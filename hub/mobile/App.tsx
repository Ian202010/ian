import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Hub } from './src/api';
import { ChatScreen } from './src/screens/Chat';
import { SearchScreen } from './src/screens/Search';
import { SessionsScreen } from './src/screens/Sessions';
import { SettingsScreen } from './src/screens/Settings';
import { TasksScreen } from './src/screens/Tasks';
import { clearSettings, loadSettings, parseHubLink, saveSettings, Settings } from './src/settings';
import { HubProvider, useHub } from './src/state';
import { useTheme } from './src/theme';
import { Button, Header, Input } from './src/ui';

type Tab = 'sessions' | 'tasks' | 'search' | 'settings';

export default function App() {
  const t = useTheme();
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);
  useEffect(() => { loadSettings().then(setSettings); }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={{ flex: 1, backgroundColor: t.panel }} edges={['top', 'bottom']}>
        {settings === undefined ? (
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator /></View>
        ) : settings === null ? (
          <Connect onConnected={setSettings} />
        ) : (
          <HubProvider settings={settings} onLogout={() => { clearSettings(); setSettings(null); }}>
            <Main />
          </HubProvider>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Connect({ onConnected }: { onConnected: (s: Settings) => void }) {
  const t = useTheme();
  const [link, setLink] = useState('');
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = parseHubLink(link);
  const connect = async () => {
    setBusy(true);
    setErr('');
    const s: Settings = { url: parsed.url, token: parsed.token || token.trim(), speak: true };
    try {
      await new Hub(s.url, s.token).me();
      await saveSettings(s);
      onConnected(s);
    } catch (e) {
      setErr(`Could not connect: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Connect to Claude Hub" />
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: t.muted }}>Paste the link the hub server prints at startup (http://…:8787/?token=…), or the server address and token separately.</Text>
        <Input value={link} onChangeText={setLink} placeholder="http://my-machine.tailnet.ts.net:8787/?token=…" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        {!parsed.token ? <Input value={token} onChangeText={setToken} placeholder="token" autoCapitalize="none" autoCorrect={false} secureTextEntry /> : null}
        <Button title={busy ? 'Connecting…' : 'Connect'} kind="primary" disabled={busy || !link} onPress={connect} />
        {err ? <Text style={{ color: t.danger }}>{err}</Text> : null}
      </View>
    </View>
  );
}

function Main() {
  const t = useTheme();
  const { unread, updateStatus } = useHub();
  const [tab, setTab] = useState<Tab>('sessions');
  const [open, setOpen] = useState<string | null | undefined>(undefined); // undefined = no chat open, null = "all"

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (open !== undefined) { setOpen(undefined); return true; }
      if (tab !== 'sessions') { setTab('sessions'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [open, tab]);

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);
  const tabs: [Tab, string][] = [['sessions', totalUnread ? `Chats (${totalUnread})` : 'Chats'], ['tasks', 'Backlog'], ['search', 'Search'], ['settings', 'Settings']];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/^(downloading|restarting)/.test(updateStatus) ? (
        <Text style={{ backgroundColor: t.accent, color: t.accentText, textAlign: 'center', padding: 4, fontSize: 12 }}>{updateStatus}</Text>
      ) : null}
      <View style={{ flex: 1 }}>
        {open !== undefined ? <ChatScreen name={open} onBack={() => setOpen(undefined)} />
          : tab === 'sessions' ? <SessionsScreen onOpen={setOpen} />
          : tab === 'tasks' ? <TasksScreen />
          : tab === 'search' ? <SearchScreen />
          : <SettingsScreen />}
      </View>
      {open === undefined ? (
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.line, backgroundColor: t.panel }}>
          {tabs.map(([key, label]) => (
            <Pressable key={key} onPress={() => setTab(key)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
              <Text style={{ color: tab === key ? t.accent : t.muted, fontWeight: tab === key ? '700' : '500', fontSize: 13 }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
