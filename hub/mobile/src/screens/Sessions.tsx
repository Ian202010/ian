import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHub } from '../state';
import { statusColor, useTheme } from '../theme';
import { Button, Header, Input } from '../ui';

export function SessionsScreen({ onOpen }: { onOpen: (name: string | null) => void }) {
  const t = useTheme();
  const { sessions, unread, connected, refreshSessions } = useHub();
  const [showNew, setShowNew] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const items = [{ name: '', status: 'all', cwd: 'every message', description: '', queued: 0 }, ...sessions];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header
        title="Claude Hub"
        subtitle={connected ? `${sessions.filter((s) => s.status === 'online').length} online` : 'connecting…'}
        right={<Button title="+ New" kind="primary" onPress={() => setShowNew(true)} />}
      />
      <FlatList
        data={items}
        keyExtractor={(s) => s.name || '*'}
        refreshing={refreshing}
        onRefresh={async () => { setRefreshing(true); await refreshSessions().catch(() => {}); setRefreshing(false); }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpen(item.name || null)}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: t.line, backgroundColor: pressed ? t.panel : t.bg })}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.status === 'all' ? t.muted : statusColor(t, item.status) }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{item.name || 'All messages'}</Text>
              <Text numberOfLines={1} style={{ color: t.muted, fontSize: 12 }}>
                {item.status !== 'all' ? `${item.status}${item.queued ? ` · ${item.queued} queued` : ''} · ` : ''}{item.description || item.cwd}
              </Text>
            </View>
            {unread[item.name] ? (
              <View style={{ backgroundColor: t.accent, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 }}>
                <Text style={{ color: t.accentText, fontSize: 12, fontWeight: '700' }}>{unread[item.name]}</Text>
              </View>
            ) : null}
          </Pressable>
        )}
      />
      <NewSessionModal visible={showNew} onClose={() => setShowNew(false)} onCreated={(n) => { setShowNew(false); onOpen(n); }} />
    </View>
  );
}

function NewSessionModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: (name: string) => void }) {
  const t = useTheme();
  const { hub } = useHub();
  const [f, setF] = useState({ name: '', cwd: '', description: '', prompt: '', args: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const create = async () => {
    setBusy(true);
    try {
      await hub.spawn(f);
      onCreated(f.name);
      setF({ name: '', cwd: '', description: '', prompt: '', args: '' });
    } catch (e) {
      Alert.alert('Could not start session', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <Header title="New Claude session" right={<Button title="Cancel" onPress={onClose} />} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} keyboardShouldPersistTaps="handled">
          <Input placeholder="name (e.g. api-refactor)" autoCapitalize="none" autoCorrect={false} value={f.name} onChangeText={set('name')} />
          <Input placeholder="working directory (e.g. ~/code/app)" autoCapitalize="none" autoCorrect={false} value={f.cwd} onChangeText={set('cwd')} />
          <Input placeholder="description (optional)" value={f.description} onChangeText={set('description')} />
          <Input placeholder="What should it work on?" multiline style={{ minHeight: 120, textAlignVertical: 'top' }} value={f.prompt} onChangeText={set('prompt')} />
          <Input placeholder="extra claude args (optional)" autoCapitalize="none" autoCorrect={false} value={f.args} onChangeText={set('args')} />
          <Button title={busy ? 'Starting…' : 'Start session'} kind="primary" disabled={busy || !f.name || !f.cwd} onPress={create} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
