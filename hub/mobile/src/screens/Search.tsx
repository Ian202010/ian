import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { SearchHit } from '../api';
import { useHub } from '../state';
import { time, useTheme } from '../theme';
import { Button, Header, Input, Markdown } from '../ui';

export function SearchScreen() {
  const t = useTheme();
  const { hub } = useHub();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [err, setErr] = useState('');
  const run = async () => {
    if (!q.trim()) return;
    setErr('');
    try { setHits(await hub.search(q)); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Search history" subtitle="every message ever sent" />
      <View style={{ flexDirection: 'row', gap: 8, padding: 10 }}>
        <Input style={{ flex: 1 }} value={q} onChangeText={setQ} placeholder="what did we decide about…" onSubmitEditing={run} returnKeyType="search" autoCapitalize="none" />
        <Button title="Search" kind="primary" onPress={run} />
      </View>
      {err ? <Text style={{ color: t.danger, paddingHorizontal: 12 }}>{err}</Text> : null}
      <FlatList
        data={hits ?? []}
        keyExtractor={(h) => String(h.id)}
        contentContainerStyle={{ padding: 10, gap: 8 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: t.panel, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 10 }}>
            <Text style={{ color: t.muted, fontSize: 11, marginBottom: 3 }}>#{item.id} {item.from_name} → {item.to_name} · {time(item.created_at)}</Text>
            <Markdown text={item.snippet} color={t.text} />
          </View>
        )}
        ListEmptyComponent={hits ? <Text style={{ color: t.muted, textAlign: 'center', marginTop: 30 }}>No matches.</Text> : undefined}
      />
    </View>
  );
}
