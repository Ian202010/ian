# Claude Hub phone app

An Expo (React Native) app for Android and iPhone. It does the same things as the hub web UI:

- **Chats** with every session, with live updates and permission Allow/Deny buttons
- **Terminal view** of each session, with keys you can press
- **Start and stop sessions**
- **Backlog board** by project, status and priority
- **History search**
- **Spoken replies:** turned on by default. Long-press any message to hear it.

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

## Connecting the app

On first launch, paste the link the hub server prints (`http://<machine>:8787/?token=…`). Use the machine's Tailscale address so the link works away from home. Plain `http` to a private address works: Android has cleartext traffic enabled and iOS has App Transport Security relaxed. The token is stored in the iOS Keychain / Android Keystore through `expo-secure-store`.

## What can't ship over the air

Over-the-air updates replace JavaScript and assets only. `runtimeVersion` uses the **fingerprint** policy: if a change adds or upgrades a native module, the fingerprint changes. Old builds then ignore the new update instead of crashing. In that case run `eas build` again and install the new build once. After that, updates flow over the air again.

## Development

```bash
npx expo start          # Expo Go works for most things; updates are disabled in dev
npx tsc --noEmit
npx expo export --platform web   # web preview build (uses localStorage instead of SecureStore)
```
