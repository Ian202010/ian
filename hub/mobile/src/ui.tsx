import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from './theme';

export function Button({ title, onPress, kind = 'default', style, disabled }: {
  title: string; onPress: () => void; kind?: 'default' | 'primary' | 'danger'; style?: StyleProp<ViewStyle>; disabled?: boolean;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.accent : t.panel;
  const fg = kind === 'primary' ? t.accentText : kind === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ backgroundColor: bg, borderColor: kind === 'primary' ? bg : t.line, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }, s.btn, style]}
    >
      <Text style={{ color: fg, fontWeight: '600' }}>{title}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[{ backgroundColor: t.panel, borderColor: t.line, color: t.text }, s.input, props.style]}
    />
  );
}

export function Header({ title, subtitle, left, right }: { title: string; subtitle?: string; left?: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[s.header, { backgroundColor: t.panel, borderBottomColor: t.line }]}>
      {left}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: t.text, fontWeight: '700', fontSize: 17 }}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={{ color: t.muted, fontSize: 12 }}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Very small markdown: fenced code blocks, inline code, bold. */
export function Markdown({ text, color, style }: { text: string; color: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  const parts = text.split(/```(?:[\w-]*)\n?([\s\S]*?)```/g);
  return (
    <View style={{ gap: 6 }}>
      {parts.map((p, i) => i % 2
        ? <Text key={i} selectable style={[s.code, { backgroundColor: t.code, color: t.text }]}>{p.replace(/\n$/, '')}</Text>
        : p.trim()
          ? <Text key={i} selectable style={[{ color, fontSize: 15, lineHeight: 21 }, style]}>
              {p.trim().split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g).map((seg, j) =>
                seg.startsWith('`') && seg.endsWith('`') && seg.length > 1
                  ? <Text key={j} style={{ fontFamily: 'monospace', backgroundColor: t.code, color: t.text }}>{seg.slice(1, -1)}</Text>
                  : seg.startsWith('**') && seg.endsWith('**') && seg.length > 3
                    ? <Text key={j} style={{ fontWeight: '700' }}>{seg.slice(2, -2)}</Text>
                    : seg)}
            </Text>
          : null)}
    </View>
  );
}

export const s = StyleSheet.create({
  btn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  code: { fontFamily: 'monospace', fontSize: 12, padding: 8, borderRadius: 6 },
});
