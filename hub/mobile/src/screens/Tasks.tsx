import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, ScrollView, SectionList, Switch, Text, View } from 'react-native';
import { Task } from '../api';
import { useHub } from '../state';
import { useTheme } from '../theme';
import { Button, Header, Input } from '../ui';

const STATUSES: [Task['status'], string][] = [
  ['in_progress', 'In progress'], ['blocked', 'Blocked'], ['todo', 'To do'], ['backlog', 'Backlog'], ['done', 'Done'], ['cancelled', 'Cancelled'],
];
const PRIO = ['P0 urgent', 'P1 high', 'P2 normal', 'P3 someday'];

function choose(title: string, options: string[], onPick: (i: number) => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions({ title, options: [...options, 'Cancel'], cancelButtonIndex: options.length }, (i) => { if (i < options.length) onPick(i); });
  } else {
    Alert.alert(title, undefined, [...options.map((o, i) => ({ text: o, onPress: () => onPick(i) })), { text: 'Cancel', style: 'cancel' as const }], { cancelable: true });
  }
}

export function TasksScreen() {
  const t = useTheme();
  const { hub, on } = useHub();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showDone, setShowDone] = useState(false);
  const [project, setProject] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', project: '', priority: 2 });

  const load = useCallback(async () => setTasks(await hub.tasks(showDone)), [hub, showDone]);
  useEffect(() => { load().catch(() => {}); }, [load]);
  useEffect(() => on((e) => {
    if (e.type !== 'task') return;
    setTasks((ts) => {
      const rest = ts.filter((x) => x.id !== e.id);
      return e.task && (showDone || !['done', 'cancelled'].includes(e.task.status)) ? [...rest, e.task] : rest;
    });
  }), [on, showDone]);

  const projects = useMemo(() => [...new Set(tasks.map((x) => x.project))].sort(), [tasks]);
  const sections = STATUSES.map(([status, title]) => ({
    title,
    data: tasks.filter((x) => x.status === status && (!project || x.project === project)).sort((a, b) => a.priority - b.priority),
  })).filter((sec) => sec.data.length);

  const add = async () => {
    if (!draft.title.trim()) return;
    await hub.addTask({ title: draft.title, project: draft.project || project || undefined, priority: draft.priority }).catch((e) => Alert.alert(e.message));
    setDraft({ ...draft, title: '' });
  };
  const edit = (task: Task) => choose(task.title, ['Change status', 'Change priority'], (i) => {
    if (i === 0) choose('Status', STATUSES.map(([, l]) => l), (j) => hub.updateTask(task.id, { status: STATUSES[j][0] }).catch((e) => Alert.alert(e.message)));
    else choose('Priority', PRIO, (j) => hub.updateTask(task.id, { priority: j }).catch((e) => Alert.alert(e.message)));
  });
  const prioColor = (p: number) => [t.danger, t.accent, t.muted, t.line][p];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Backlog" subtitle={`${tasks.length} tasks`} right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.muted, fontSize: 12 }}>done</Text>
          <Switch value={showDone} onValueChange={setShowDone} />
        </View>
      } />
      <View style={{ padding: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: t.line }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input style={{ flex: 1 }} placeholder="New task…" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} onSubmitEditing={add} returnKeyType="done" />
          <Button title={`P${draft.priority}`} onPress={() => choose('Priority', PRIO, (priority) => setDraft({ ...draft, priority }))} />
          <Button title="Add" kind="primary" onPress={add} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[null, ...projects].map((p) => (
            <Pressable key={p ?? '*'} onPress={() => { setProject(p); setDraft({ ...draft, project: p ?? '' }); }}
              style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: project === p ? t.accent : t.line, backgroundColor: project === p ? t.accent : t.panel }}>
              <Text style={{ color: project === p ? t.accentText : t.text, fontSize: 13 }}>{p ?? 'All projects'}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: 10 }}
        renderSectionHeader={({ section }) => (
          <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 12, marginBottom: 6 }}>{section.title} · {section.data.length}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable onPress={() => edit(item)} style={{ backgroundColor: t.panel, borderColor: t.line, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8, gap: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Text style={{ color: prioColor(item.priority), borderColor: prioColor(item.priority), borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, fontSize: 11, fontWeight: '700' }}>P{item.priority}</Text>
              <Text style={{ color: t.text, fontWeight: '500', flex: 1 }}>{item.title}</Text>
            </View>
            <Text style={{ color: t.muted, fontSize: 12 }}>#{item.id} · {item.project}{item.assignee ? ` · @${item.assignee}` : ''}{item.created_by ? ` · by ${item.created_by}` : ''}</Text>
            {item.notes ? <Text style={{ color: t.muted, fontSize: 13 }} numberOfLines={4}>{item.notes}</Text> : null}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={{ color: t.muted, textAlign: 'center', marginTop: 40 }}>Nothing here.</Text>}
      />
    </View>
  );
}
