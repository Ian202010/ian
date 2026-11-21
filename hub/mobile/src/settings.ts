import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore is native-only; the web build (used for previews) falls back to localStorage.
const store = Platform.OS === 'web'
  ? {
      getItemAsync: async (k: string) => globalThis.localStorage?.getItem(k) ?? null,
      setItemAsync: async (k: string, v: string) => globalThis.localStorage?.setItem(k, v),
      deleteItemAsync: async (k: string) => globalThis.localStorage?.removeItem(k),
    }
  : SecureStore;

export type Settings = { url: string; token: string; speak: boolean; walk?: boolean; target?: string };
const KEY = 'hub.settings.v1';

export async function loadSettings(): Promise<Settings | null> {
  try {
    const raw = await store.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(s: Settings) {
  await store.setItemAsync(KEY, JSON.stringify(s));
}

export async function clearSettings() {
  await store.deleteItemAsync(KEY);
}

/** Accepts "http://host:8787/?token=abc" (the link the server prints) or a bare URL. */
export function parseHubLink(link: string): { url: string; token?: string } {
  const trimmed = link.trim();
  const m = trimmed.match(/^(https?:\/\/[^/?#]+)(?:[^?#]*)?(?:\?(.*))?/i);
  if (!m) return { url: trimmed };
  const token = new URLSearchParams(m[2] || '').get('token') || undefined;
  return { url: m[1], token };
}
