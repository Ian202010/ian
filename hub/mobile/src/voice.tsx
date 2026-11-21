// Walk mode: talk to a session hands-free and hear its replies, with the phone in your pocket.
//
// - Push-to-talk from the on-screen button, a Flic button (src/flic.ts), or the hub's /api/ptt trigger.
// - Recordings are uploaded to the hub, transcribed there, and sent to the target session.
// - Replies addressed to you are spoken aloud (expo-speech); speech pauses while you're talking.
// - While walk mode is on, a silent looping track keeps the app alive in the background
//   (iOS background audio; an Android media foreground service via the lock-screen session),
//   so the WebSocket, Flic connection and speech keep working with the screen off.
import {
  AudioPlayer, createAudioPlayer, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Message } from './api';
import { speakable, useHub } from './state';

export type Phase = 'idle' | 'starting' | 'recording' | 'sending';
type Source = 'screen' | 'flic' | 'remote';

type VoiceCtx = {
  phase: Phase;
  walk: boolean;
  setWalk: (on: boolean) => Promise<void>;
  target: string;
  setTarget: (name: string) => void;
  lastTranscript: string;
  error: string;
  start: (source?: Source) => Promise<void>;
  stop: (source?: Source) => Promise<void>;
  toggle: (source?: Source) => Promise<void>;
  replay: () => void;
  lastReply: Message | null;
};

const Ctx = createContext<VoiceCtx | null>(null);
export const useVoice = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useVoice outside VoiceProvider');
  return c;
};

const MIN_TALK_MS = 450; // shorter presses are treated as a click (replay last reply), not speech

const cues = {
  start: require('../assets/sounds/start.wav'),
  stop: require('../assets/sounds/stop.wav'),
  error: require('../assets/sounds/error.wav'),
  silence: require('../assets/sounds/silence.wav'),
};

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { hub, settings, setSettings, on, sessions } = useHub();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhaseState] = useState<Phase>('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState('');
  const [lastReply, setLastReply] = useState<Message | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const fns = useRef<Pick<VoiceCtx, 'start' | 'stop' | 'toggle' | 'replay'>>({ start: async () => {}, stop: async () => {}, toggle: async () => {}, replay: () => {} });
  const stopRequested = useRef(false);
  const startedAt = useRef(0);
  const speechQueue = useRef<string[]>([]);
  const keepAlive = useRef<AudioPlayer | null>(null);
  const cuePlayers = useRef<Record<string, AudioPlayer>>({});
  const walk = Boolean(settings.walk);
  const target = settings.target || sessions.find((s) => s.name === 'boss')?.name || sessions[0]?.name || 'boss';
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const targetRef = useRef(target);
  targetRef.current = target;

  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };

  const cue = useCallback((name: 'start' | 'stop' | 'error') => {
    try {
      const p = (cuePlayers.current[name] ??= createAudioPlayer(cues[name]));
      p.seekTo(0);
      p.play();
    } catch {}
  }, []);

  const audioMode = useCallback(async (background: boolean) => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
      shouldPlayInBackground: background,
      allowsBackgroundRecording: background,
      // Android needs exclusive focus for a lasting lock-screen session; iOS can keep your music playing.
      interruptionMode: background && Platform.OS === 'android' ? 'doNotMix' : 'mixWithOthers',
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  // ---------- speaking ----------
  const say = useCallback((text: string) => {
    if (phaseRef.current === 'recording' || phaseRef.current === 'starting') speechQueue.current.push(text);
    else Speech.speak(text, { language: undefined });
  }, []);
  const flushSpeech = useCallback(() => {
    const queued = speechQueue.current.splice(0);
    queued.forEach((t) => Speech.speak(t));
  }, []);

  useEffect(() => on((e) => {
    if (e.type === 'ptt') {
      const f = fns.current;
      if (e.action === 'start') f.start('remote');
      else if (e.action === 'stop') f.stop('remote');
      else if (e.action === 'replay') f.replay();
      else f.toggle('remote');
      return;
    }
    if (e.type !== 'message') return;
    const m = e.message;
    if (m.to_name !== 'user' || m.from_name === 'user') return;
    if (m.kind === 'chat') setLastReply(m);
    if (!settingsRef.current.speak) return;
    const prefix = m.from_name === targetRef.current ? '' : `${m.from_name} says: `;
    if (m.kind === 'chat') say(prefix + speakable(m.body));
    if (m.kind === 'permission') say(`${m.from_name} is asking for permission. Check your phone.`);
  }), [on, say]);

  // ---------- recording ----------
  const start = useCallback(async (_source: Source = 'screen') => {
    if (phaseRef.current !== 'idle') return;
    setPhase('starting');
    stopRequested.current = false;
    setError('');
    Speech.stop();
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) throw new Error('microphone permission denied');
      await audioMode(walk);
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAt.current = Date.now();
      setPhase('recording');
      cue('start');
      if (stopRequested.current) await fns.current.stop(_source);
    } catch (e) {
      setPhase('idle');
      setError((e as Error).message);
      cue('error');
    }
  }, [recorder, walk, audioMode, cue]);

  const lastReplyRef = useRef<Message | null>(null);
  lastReplyRef.current = lastReply;
  const replay = useCallback(() => {
    if (!lastReplyRef.current) { Speech.speak('No replies yet.'); return; }
    Speech.stop();
    Speech.speak(speakable(lastReplyRef.current.body));
  }, []);

  const stop = useCallback(async (source: Source = 'screen') => {
    if (phaseRef.current === 'starting') { stopRequested.current = true; return; }
    if (phaseRef.current !== 'recording') return;
    const held = Date.now() - startedAt.current;
    setPhase('sending');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (held < MIN_TALK_MS || !uri) {
        setPhase('idle');
        flushSpeech();
        if (source === 'flic' || source === 'remote') replay(); // a quick click = "say that again"
        else setError('Hold the button while you talk.');
        return;
      }
      cue('stop');
      const { url, token } = settingsRef.current;
      const res = await new File(uri).upload(`${url}/api/voice?to=${encodeURIComponent(targetRef.current)}`, {
        httpMethod: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'audio/mp4' },
        sessionType: 'background',
      });
      const data = JSON.parse(res.body || '{}');
      if (res.status >= 400) throw new Error(data.error || `upload failed (${res.status})`);
      setLastTranscript(data.text || `(${data.skipped || 'nothing heard'})`);
      if (!data.text) say("Sorry, I didn't catch that.");
      try { new File(uri).delete(); } catch {}
    } catch (e) {
      setError((e as Error).message);
      cue('error');
      say('Sending failed.');
    } finally {
      setPhase('idle');
      flushSpeech();
    }
  }, [recorder, cue, flushSpeech, replay, say]);

  const toggle = useCallback(async (source: Source = 'screen') => {
    if (phaseRef.current === 'idle') await start(source);
    else await stop(source);
  }, [start, stop]);

  // ---------- walk mode keep-alive ----------
  const setWalk = useCallback(async (onOff: boolean) => {
    await setSettings({ ...settingsRef.current, walk: onOff, speak: onOff ? true : settingsRef.current.speak });
  }, [setSettings]);

  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    (async () => {
      if (!walk) {
        keepAlive.current?.setActiveForLockScreen(false);
        keepAlive.current?.pause();
        await audioMode(false).catch(() => {});
        return;
      }
      await audioMode(true);
      const p = (keepAlive.current ??= createAudioPlayer(cues.silence));
      p.loop = true;
      p.play();
      p.setActiveForLockScreen(true, { title: 'Claude Hub — walk mode', artist: `Talking to ${targetRef.current}` });
      // Other audio (e.g. system TTS on Android) can steal focus and pause us; resume so the app stays alive.
      iv = setInterval(() => { if (!p.playing) p.play(); }, 5000);
    })().catch((e) => setError(`walk mode: ${(e as Error).message}`));
    return () => clearInterval(iv);
  }, [walk, audioMode]);

  useEffect(() => {
    if (walk) keepAlive.current?.updateLockScreenMetadata({ title: 'Claude Hub — walk mode', artist: `Talking to ${target}` });
  }, [walk, target]);

  // Latest action functions for long-lived listeners (WebSocket events).
  fns.current = { start, stop, toggle, replay };

  const setTarget = useCallback((name: string) => { setSettings({ ...settingsRef.current, target: name }); }, [setSettings]);

  const value = useMemo<VoiceCtx>(() => ({
    phase, walk, setWalk, target, setTarget, lastTranscript, error, start, stop, toggle, replay, lastReply,
  }), [phase, walk, setWalk, target, setTarget, lastTranscript, error, start, stop, toggle, replay, lastReply]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
