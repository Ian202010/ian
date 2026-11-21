import { useColorScheme } from 'react-native';

const light = {
  bg: '#f6f6f4', panel: '#ffffff', text: '#1d1f23', muted: '#6b6f76', line: '#e3e3df',
  accent: '#c8643b', accentText: '#ffffff', mine: '#1f6f5c', mineText: '#ffffff', peer: '#eef1f6',
  danger: '#b3261e', ok: '#2e7d32', warn: '#e0a100', code: '#f0f0ec', term: '#0e0f12', termText: '#d8d8d8',
};
const dark: typeof light = {
  bg: '#14161a', panel: '#1c1f24', text: '#e7e7e4', muted: '#9a9ea6', line: '#2c3038',
  accent: '#d97757', accentText: '#ffffff', mine: '#2b7a66', mineText: '#ffffff', peer: '#1f2a38',
  danger: '#ef5350', ok: '#66bb6a', warn: '#e0a100', code: '#262a31', term: '#0e0f12', termText: '#d8d8d8',
};
export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);

export const statusColor = (t: Theme, s: string) =>
  s === 'online' ? t.ok : s === 'starting' ? t.warn : s === 'stopped' ? t.line : t.muted;

export const time = (d: string) => {
  const date = new Date(d);
  const today = new Date().toDateString() === date.toDateString();
  return (today ? '' : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ')
    + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
