import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { useHub } from '../state';
import { useTheme } from '../theme';
import { updatesInfo } from '../updates';
import { Button, Header } from '../ui';

export function SettingsScreen() {
  const t = useTheme();
  const { settings, setSettings, connected, updateStatus, checkUpdates, logout, pushStatus } = useHub();
  const info = updatesInfo();
  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6 }}>
      <Text style={{ color: t.muted }}>{label}</Text>
      <Text selectable style={{ color: t.text, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
  const card = { backgroundColor: t.panel, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <View style={card}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>Hub</Text>
          <Row label="Server" value={settings.url} />
          <Row label="Connection" value={connected ? 'live' : 'reconnecting…'} />
          <Button title="Disconnect" kind="danger" style={{ marginTop: 8 }} onPress={() => Alert.alert('Forget this hub?', undefined, [
            { text: 'Cancel', style: 'cancel' }, { text: 'Forget', style: 'destructive', onPress: logout },
          ])} />
        </View>

        <View style={card}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>Voice</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: t.text, flex: 1 }}>Speak replies aloud</Text>
            <Switch value={settings.speak} onValueChange={(speak) => {
              setSettings({ ...settings, speak });
              if (speak) Speech.speak('Speaking replies.');
            }} />
          </View>
          <Text style={{ color: t.muted, fontSize: 12 }}>Long-press any message to hear it.</Text>
          <Row label="Push notifications" value={pushStatus || '—'} />
        </View>

        <View style={card}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: 4 }}>App updates</Text>
          <Row label="App version" value={Constants.expoConfig?.version ?? '?'} />
          <Row label="Runtime" value={info.runtimeVersion ?? '—'} />
          <Row label="Channel" value={info.channel ?? '—'} />
          <Row label="Running" value={!info.enabled ? 'updates disabled (dev or web build)' : info.embedded ? 'built-in bundle' : `update ${info.updateId?.slice(0, 8)}`} />
          <Row label="Published" value={info.createdAt ? info.createdAt.toLocaleString() : '—'} />
          <Row label="Status" value={updateStatus || '—'} />
          <Button title="Check for updates now" style={{ marginTop: 8 }} onPress={checkUpdates} />
        </View>
      </ScrollView>
    </View>
  );
}
