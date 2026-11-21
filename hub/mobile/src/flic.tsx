// Flic 2 buttons as a push-to-talk remote: press = start talking, release = send.
// A quick click replays the last reply.
// Uses expo-flic2 (pinned 0.5.0, wrapping Shortcut Labs' official flic2lib on both platforms).
import type { Flic2Button } from 'expo-flic2';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useVoice } from './voice';

const MAX_EVENT_AGE_MS = 2000; // ignore presses queued while the button was out of range

// Loaded lazily: the native module only exists in real builds (not on web or in Expo Go),
// and expo-flic2 throws at import time when it's missing.
type FlicModule = typeof import('expo-flic2');
let flic: FlicModule | null = null;
let initialized = false;
function init(): FlicModule | null {
  if (initialized) return flic;
  initialized = true;
  if (Platform.OS === 'web') return null;
  try {
    flic = require('expo-flic2') as FlicModule;
    flic.initialize();
  } catch {
    flic = null;
  }
  return flic;
}

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 31) {
    const r = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(r).every((v) => v === 'granted');
  }
  return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)) === 'granted';
}

/** Mount once (inside VoiceProvider): connects paired buttons and maps presses to push-to-talk. */
export function FlicBridge() {
  const { start, stop } = useVoice();
  const startRef = useRef(start);
  const stopRef = useRef(stop);
  startRef.current = start;
  stopRef.current = stop;

  useEffect(() => {
    const f = init();
    if (!f) return;
    const connectAll = () => {
      for (const b of safeButtons()) {
        try {
          f.setButtonTriggerMode(b.uuid, f.Flic2TriggerMode.Click); // lowest latency: events on press-down
          if (b.connectionState === 'disconnected') f.connectButton(b.uuid);
        } catch {}
      }
    };
    requestPermissions().then((ok) => ok && connectAll());
    const sub = f.addOnUpOrDownListener(({ isDown, queued, age }) => {
      if (queued && age > MAX_EVENT_AGE_MS) return;
      if (isDown) startRef.current('flic');
      else stopRef.current('flic');
    });
    return () => sub.remove();
  }, []);
  return null;
}

function safeButtons(): Flic2Button[] {
  try { return flic?.getButtons() ?? []; } catch { return []; }
}

/** State and actions for the Flic settings UI. */
export function useFlicButtons() {
  const [buttons, setButtons] = useState<Flic2Button[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const available = Boolean(init());

  const refresh = useCallback(() => setButtons(safeButtons()), []);

  useEffect(() => {
    const f = init();
    if (!f) return;
    refresh();
    const subs = [
      f.addOnConnectionListener(({ error }) => { refresh(); if (error) setMessage(error); }),
      f.addOnScanListener(({ isScanning, button, error, scanEvent }) => {
        setScanning(isScanning);
        if (error) setMessage(`Scan: ${error}`);
        else if (button) {
          setMessage(`Paired ${button.name || button.serialNumber}.`);
          try { f.setButtonTriggerMode(button.uuid, f.Flic2TriggerMode.Click); } catch {}
          refresh();
        } else if (scanEvent) setMessage(`Scan: ${scanEvent}…`);
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [refresh]);

  const scan = useCallback(async () => {
    if (!(await requestPermissions())) { setMessage('Bluetooth permission is needed to pair.'); return; }
    setMessage('Press and hold your Flic button for 7 seconds until it blinks…');
    try { flic?.startScan(); setScanning(true); } catch (e) { setMessage((e as Error).message); }
  }, []);
  const cancel = useCallback(() => { try { flic?.stopScan(); } catch {} setScanning(false); }, []);
  const forget = useCallback((uuid: string) => { try { flic?.forgetButton(uuid); } catch {} setTimeout(refresh, 500); }, [refresh]);

  return { available, buttons, scanning, message, scan, cancel, forget, refresh };
}
