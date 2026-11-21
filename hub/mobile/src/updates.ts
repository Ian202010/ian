// Over-the-air self updates (expo-updates / EAS Update).
// A session runs `hub ship-app "..."`, which publishes a new JS bundle with `eas update` and tells
// the hub server, which tells this app over the WebSocket. The app downloads the bundle and restarts into it.
// The app also checks on launch, whenever it comes to the foreground, and every 15 minutes.
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export type UpdateState = { status: string; lastCheck: Date | null };

let busy = false;

export function updatesInfo() {
  return {
    enabled: Platform.OS !== 'web' && Updates.isEnabled,
    channel: Updates.channel,
    runtimeVersion: Updates.runtimeVersion,
    updateId: Updates.updateId,
    embedded: Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt,
  };
}

/** Check for a new bundle and, if there is one, download it and restart into it. */
export async function checkAndApply(onStatus?: (s: string) => void): Promise<string> {
  if (Platform.OS === 'web') return 'not available on web';
  if (__DEV__ || !Updates.isEnabled) return 'updates disabled in this build';
  if (busy) return 'already checking';
  busy = true;
  try {
    onStatus?.('checking…');
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return 'up to date';
    onStatus?.('downloading update…');
    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) return 'up to date';
    onStatus?.('restarting into new version…');
    await Updates.reloadAsync();
    return 'reloading';
  } catch (e) {
    return `update check failed: ${(e as Error).message}`;
  } finally {
    busy = false;
  }
}
