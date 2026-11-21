// Push notifications: replies reach you even when the app isn't running.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';
import { Hub } from './api';

let walkModeActive = false;
export const setPushWalkMode = (on: boolean) => { walkModeActive = on; };

Notifications.setNotificationHandler({
  handleNotification: async () => {
    const foreground = AppState.currentState === 'active';
    return {
      // In the foreground the chat (and voice) already shows the message.
      shouldShowBanner: !foreground,
      shouldShowList: true,
      // In walk mode the reply is spoken; skip the ding.
      shouldPlaySound: !foreground && !walkModeActive,
      shouldSetBadge: false,
    };
  },
});

/** Ask for permission, get this phone's Expo push token, and register it with the hub. */
export async function registerForPush(hub: Hub): Promise<string> {
  if (Platform.OS === 'web') return 'not available on web';
  if (!Device.isDevice) return 'push needs a physical device';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('replies', {
      name: 'Replies from Claude sessions',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return 'notifications not allowed';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'no EAS projectId yet (run eas init)';
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await hub.req('POST', '/api/devices', { token, platform: Platform.OS, name: Device.deviceName ?? undefined });
  return 'registered';
}

/** Calls onOpen(sessionName) when the user taps a notification. */
export function onNotificationTap(onOpen: (from: string) => void) {
  if (Platform.OS === 'web') return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const from = r.notification.request.content.data?.from;
    if (typeof from === 'string') onOpen(from);
  });
  return () => sub.remove();
}
