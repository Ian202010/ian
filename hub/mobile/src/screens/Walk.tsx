import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useFlicButtons } from '../flic';
import { useHub } from '../state';
import { statusColor, time, useTheme } from '../theme';
import { Button, Header, Markdown } from '../ui';
import { useVoice } from '../voice';

export function WalkScreen() {
  const t = useTheme();
  const { sessions } = useHub();
  const v = useVoice();
  const flic = useFlicButtons();
  const talking = v.phase === 'recording' || v.phase === 'starting';
  const label = v.phase === 'recording' ? 'Listening… release to send'
    : v.phase === 'starting' ? 'Starting mic…'
    : v.phase === 'sending' ? 'Sending…'
    : 'Hold to talk';
  const card = { backgroundColor: t.panel, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 } as const;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Walk" subtitle={v.walk ? 'walk mode on — works with the screen off' : 'push-to-talk'} right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.muted, fontSize: 12 }}>walk mode</Text>
          <Switch value={v.walk} onValueChange={v.setWalk} />
        </View>
      } />
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {sessions.map((s) => (
            <Pressable key={s.name} onPress={() => v.setTarget(s.name)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
              borderColor: v.target === s.name ? t.accent : t.line, backgroundColor: v.target === s.name ? t.accent : t.panel,
            }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor(t, s.status) }} />
              <Text style={{ color: v.target === s.name ? t.accentText : t.text }}>{s.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPressIn={() => v.start('screen')}
          onPressOut={() => v.stop('screen')}
          style={{
            height: 220, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: talking ? t.danger : v.phase === 'sending' ? t.warn : t.mine,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 40 }}>🎤</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{label}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>to {v.target}</Text>
        </Pressable>

        {v.error ? <Text style={{ color: t.danger }}>{v.error}</Text> : null}
        {v.lastTranscript ? (
          <View style={card}>
            <Text style={{ color: t.muted, fontSize: 12 }}>You said</Text>
            <Text style={{ color: t.text, fontSize: 16 }}>{v.lastTranscript}</Text>
          </View>
        ) : null}
        {v.lastReply ? (
          <Pressable onPress={v.replay} style={card}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Last reply · {v.lastReply.from_name} · {time(v.lastReply.created_at)} · tap to hear again</Text>
            <Markdown text={v.lastReply.body} color={t.text} />
          </Pressable>
        ) : null}

        <View style={card}>
          <Text style={{ color: t.text, fontWeight: '700' }}>Flic button</Text>
          <Text style={{ color: t.muted, fontSize: 13 }}>Hold the button to talk and release to send. A quick click replays the last reply.</Text>
          {!flic.available ? <Text style={{ color: t.muted }}>Not available in this build.</Text> : (
            <>
              {flic.buttons.map((b) => (
                <View key={b.uuid} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.isReady ? t.ok : t.muted }} />
                  <Text style={{ color: t.text, flex: 1 }}>{b.name || b.serialNumber} · {b.isReady ? 'ready' : b.connectionState}{b.batteryLevel ? ` · ${b.batteryLevel}%` : ''}</Text>
                  <Button title="Forget" kind="danger" onPress={() => flic.forget(b.uuid)} style={{ paddingVertical: 4 }} />
                </View>
              ))}
              <Button title={flic.scanning ? 'Cancel pairing' : flic.buttons.length ? 'Pair another button' : 'Pair a Flic button'}
                kind={flic.scanning ? 'default' : 'primary'} onPress={flic.scanning ? flic.cancel : flic.scan} />
              {flic.message ? <Text style={{ color: t.muted, fontSize: 13 }}>{flic.message}</Text> : null}
            </>
          )}
        </View>

        <Text style={{ color: t.muted, fontSize: 12, textAlign: 'center' }}>
          Walk mode keeps the app running with the screen off so replies are spoken and the button keeps working. It uses a bit more battery.
        </Text>
      </ScrollView>
    </View>
  );
}
