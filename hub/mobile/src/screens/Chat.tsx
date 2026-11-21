import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, Text, View } from 'react-native';
import { Message } from '../api';
import { speakable, useHub } from '../state';
import { time, useTheme } from '../theme';
import { Button, Header, Input, Markdown } from '../ui';

export function ChatScreen({ name, onBack }: { name: string | null; onBack: () => void }) {
  const t = useTheme();
  const { hub, sessions, on, setCurrent } = useHub();
  const [tab, setTab] = useState<'chat' | 'screen'>('chat');
  const session = sessions.find((s) => s.name === name);

  useEffect(() => { setCurrent(name); return () => setCurrent(null); }, [name, setCurrent]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header
        title={name || 'All messages'}
        subtitle={session ? `${session.status} · ${session.cwd ?? ''}` : undefined}
        left={<Button title="‹" onPress={onBack} style={{ paddingVertical: 6 }} />}
        right={name ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Button title={tab === 'chat' ? 'Screen' : 'Chat'} onPress={() => setTab(tab === 'chat' ? 'screen' : 'chat')} />
            {session?.tmux ? <Button title="■" kind="danger" onPress={() => Alert.alert(`Stop ${name}?`, undefined, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Stop', style: 'destructive', onPress: () => hub.stop(name).catch((e) => Alert.alert(e.message)) },
            ])} /> : null}
          </View>
        ) : null}
      />
      {tab === 'chat' ? <Conversation name={name} on={on} /> : <TerminalView name={name!} />}
    </View>
  );
}

function Conversation({ name, on }: { name: string | null; on: ReturnType<typeof useHub>['on'] }) {
  const t = useTheme();
  const { hub } = useHub();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const involves = useCallback((m: Message) => !name || m.from_name === name || m.to_name === name, [name]);

  const load = useCallback(async () => { setMessages(await hub.messages(name ?? undefined)); }, [hub, name]);
  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => on((e) => {
    if (e.type === 'message' && involves(e.message)) setMessages((ms) => [...ms, e.message]);
    if (e.type === 'message_update') setMessages((ms) => ms.map((m) => (m.id === e.message.id ? e.message : m)));
    if (e.type === 'sessions') { /* reconnect may have missed messages */ }
  }), [on, involves]);

  const older = async () => {
    if (loadingOlder || messages.length < 50) return;
    setLoadingOlder(true);
    const more = await hub.messages(name ?? undefined, messages[0]?.id).catch(() => []);
    setMessages((ms) => [...more, ...ms]);
    setLoadingOlder(false);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !name) return;
    setDraft('');
    try { await hub.send(name, text); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
    catch (e) { setDraft(text); Alert.alert('Not sent', (e as Error).message); }
  };

  const answered = (m: Message) => messages.some((x) => x.kind === 'permission_verdict' && x.meta?.request_id === m.meta?.request_id);
  const reversed = [...messages].reverse();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      <FlatList
        ref={list}
        inverted
        data={reversed}
        keyExtractor={(m) => String(m.id)}
        onEndReached={older}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item: m }) => {
          const mine = m.from_name === 'user';
          const peer = !mine && m.to_name !== 'user';
          const bg = mine ? t.mine : peer ? t.peer : t.panel;
          const fg = mine ? t.mineText : t.text;
          if (m.kind === 'permission_verdict') {
            return <Text style={{ color: t.muted, alignSelf: 'flex-end', fontSize: 12 }}>you {m.meta.behavior === 'allow' ? 'allowed' : 'denied'} {m.meta.request_id}</Text>;
          }
          return (
            <Pressable
              onLongPress={() => Speech.speak(speakable(m.body))}
              style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '90%', backgroundColor: bg, borderRadius: 14, padding: 10, borderWidth: m.kind === 'permission' ? 2 : mine ? 0 : 1, borderColor: m.kind === 'permission' ? t.accent : t.line }}
            >
              <Text style={{ color: mine ? 'rgba(255,255,255,0.75)' : t.muted, fontSize: 11, marginBottom: 3 }}>
                {m.from_name} → {m.to_name} · {time(m.created_at)}{mine ? (m.delivered_at ? ' · ✓' : ' · queued') : ''}
              </Text>
              <Markdown text={m.body} color={fg} />
              {m.kind === 'permission' && !answered(m) ? (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <Button title="Allow" kind="primary" onPress={() => hub.permission(m.from_name, m.meta.request_id, 'allow')} />
                  <Button title="Deny" onPress={() => hub.permission(m.from_name, m.meta.request_id, 'deny')} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={{ color: t.muted, textAlign: 'center', marginTop: 40, transform: [{ scaleY: -1 }] }}>No messages yet.</Text>}
      />
      {name ? (
        <View style={{ flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: t.line, backgroundColor: t.panel, alignItems: 'flex-end' }}>
          <Input value={draft} onChangeText={setDraft} placeholder={`Message ${name}…`} multiline style={{ flex: 1, maxHeight: 140 }} />
          <Button title="Send" kind="primary" onPress={send} disabled={!draft.trim()} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const KEYS: [string, { text?: string; keys?: string[] }][] = [
  ['⏎', { keys: ['Enter'] }], ['Esc', { keys: ['Escape'] }], ['↑', { keys: ['Up'] }], ['↓', { keys: ['Down'] }],
  ['Tab', { keys: ['Tab'] }], ['^C', { keys: ['C-c'] }], ['1', { text: '1' }], ['2', { text: '2' }],
];

function TerminalView({ name }: { name: string }) {
  const t = useTheme();
  const { hub } = useHub();
  const [screen, setScreen] = useState('');
  const [text, setText] = useState('');
  const scroll = useRef<ScrollViewInstance>(null);

  const refresh = useCallback(async () => {
    try { setScreen((await hub.screen(name)).screen); } catch (e) { setScreen(`(${(e as Error).message})`); }
  }, [hub, name]);
  useEffect(() => { refresh(); const iv = setInterval(refresh, 2000); return () => clearInterval(iv); }, [refresh]);
  const press = async (body: { text?: string; keys?: string[]; enter?: boolean }) => {
    await hub.keys(name, body).catch((e) => Alert.alert(e.message));
    setTimeout(refresh, 300);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: t.term }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <ScrollView horizontal>
          <Text selectable style={{ color: t.termText, fontFamily: 'monospace', fontSize: 10, padding: 8 }}>{screen}</Text>
        </ScrollView>
      </ScrollView>
      <View style={{ padding: 8, gap: 8, backgroundColor: t.panel, borderTopWidth: 1, borderTopColor: t.line }}>
        <Input value={text} onChangeText={setText} placeholder="type into terminal, then ⏎" autoCapitalize="none" autoCorrect={false}
          onSubmitEditing={() => { press({ text, enter: true }); setText(''); }} returnKeyType="send" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {KEYS.map(([label, body]) => <Button key={label} title={label} onPress={() => press(body)} style={{ paddingVertical: 6 }} />)}
        </View>
      </View>
    </View>
  );
}
