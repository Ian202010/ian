# Claude Hub phone app

An Expo (React Native) app for Android and iPhone. It does the same things as the hub web UI:

- **Chats** with every session, with live updates and permission Allow/Deny buttons
- **Terminal view** of each session, with keys you can press
- **Start and stop sessions**
- **Backlog board** by project, status and priority
- **History search**
- **Spoken replies:** turned on by default. Long-press any message to hear it.
- **Walk mode with push-to-talk:** hold the big button or a Flic button, talk, and release. The hub transcribes the recording and sends it to the chosen session, and the reply is read aloud. This keeps working with the phone locked in your pocket.
- **Push notifications:** replies reach you even when the app is closed. Tap one to open that chat.

It **updates itself**. The app checks for a new version on launch, whenever it comes to the foreground, every 15 minutes, and right away when the hub announces one. When it finds one, it downloads it and restarts into it. Any Claude session can ship a new version with the `ship_app_update` tool, so the boss session can change the app and push the change to your phone on its own.

## One-time setup (about 20 minutes)

You need a free [Expo account](https://expo.dev/signup).

```bash
cd hub/mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest init                 # links this folder to an EAS project (writes extra.eas.projectId)
npx eas-cli@latest update:configure     # writes updates.url into app.json
```

Before your first build, change `ios.bundleIdentifier` and `android.package` in `app.json` (currently `com.claudehub.app`) to something unique to you.

### Android

```bash
npx eas-cli@latest build --profile production --platform android
```

When the build finishes (in the cloud, roughly 10–15 minutes), open the link it prints on your phone and install the APK. You may need to allow installs from your browser.

### iPhone

You need an Apple Developer account ($99/year).

```bash
npx eas-cli@latest build --profile production --platform ios     # EAS handles certificates
npx eas-cli@latest submit --platform ios                          # then install from TestFlight
```

For quick sideloading without TestFlight, register your device with `eas device:create` and build with an ad hoc profile.

### Let sessions ship updates

1. Create an access token at expo.dev → Account settings → Access tokens.
2. Start the hub with the token set: `EXPO_TOKEN=… npm start`. Every session the hub spawns inherits it.
3. Ship:

```bash
cd hub && npm run ship-app -- "Bigger send button"    # typecheck → eas update → tell phones to update now
```

Sessions can also call the `ship_app_update` tool. If you published with `eas update` some other way (from CI, for example), run `hub announce-app` or `POST /api/app/announce` so phones fetch the update right away.

## Walk mode and the Flic button

The **Walk** tab has a target picker, a hold-to-talk button and Flic pairing. Turn on **walk mode** before you put the phone away. The app then plays a silent audio loop so it keeps running in the background: iOS background audio, and on Android a media notification. That keeps the hub connection, spoken replies and the Flic button working with the screen off. On Android, walk mode pauses other audio such as music or podcasts, because the OS needs exclusive audio focus to keep the app alive. On iOS your audio keeps playing.

**Flic button** (Flic 2, connected directly to this app):
1. Walk tab → **Pair a Flic button**, then hold the Flic for 7 seconds until it blinks. On Android, allow Bluetooth when asked.
2. **Hold** the button to talk and **release** to send. A **quick click** replays the last reply.
3. You'll hear a high beep when it starts listening and a falling double beep when it sends.

If your Flic is already paired with the official Flic app, unpair it there first, because a button connects to one app at a time. Or keep it in the Flic app and use an **Internet request** action instead: `POST http://<hub>:8787/api/ptt?token=<token>&action=toggle`. Click once to start talking, and click again to send.

Voice needs speech-to-text on the hub server (see the hub README, "Voice").

## Push notifications

- **iOS:** works after `eas build`. EAS sets up the APNs key the first time you build.
- **Android:** Expo's push service needs Firebase Cloud Messaging credentials:
  1. Create a Firebase project and add an Android app with your package name.
  2. Download `google-services.json` into this folder and set `"android": { "googleServicesFile": "./google-services.json" }` in `app.json`.
  3. Upload an FCM V1 service-account key with `eas credentials` → Android → Push Notifications.
  4. Rebuild.

  See [Expo's FCM guide](https://docs.expo.dev/push-notifications/fcm-credentials/).

Settings → Voice shows whether this phone is registered.

## Connecting the app

On first launch, paste the link the hub server prints (`http://<machine>:8787/?token=…`). Use the machine's Tailscale address so the link works away from home. Plain `http` to a private address works: Android has cleartext traffic enabled and iOS has App Transport Security relaxed. The token is stored in the iOS Keychain / Android Keystore through `expo-secure-store`.

## What can't ship over the air

This release adds native modules (expo-audio, expo-notifications, expo-flic2), so **an app built before walk mode can't get it over the air. Run `eas build` and install the new build once.**

Over-the-air updates replace JavaScript and assets only. `runtimeVersion` uses the **fingerprint** policy: if a change adds or upgrades a native module, the fingerprint changes. Old builds then ignore the new update instead of crashing. In that case run `eas build` again and install the new build once. After that, updates flow over the air again.

## Development

```bash
npx expo start          # Expo Go works for most things; updates are disabled in dev
npx tsc --noEmit
npx expo export --platform web   # web preview build (uses localStorage instead of SecureStore)
```
