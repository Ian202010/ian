This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## This app

Claude Hub's phone client. It talks to the hub server (`../src/server.js`) over REST plus a WebSocket. Navigation is deliberately simple: tab and chat state lives in `App.tsx`, there's no Expo Router, and screens are in `src/screens/`. Keep it that way unless the app outgrows it.

- `src/api.ts`: hub REST/WS client and types (these must match `../src/server.js`)
- `src/state.tsx`: connection, sessions, unread counts, spoken replies, update checks
- `src/updates.ts`: over-the-air self-update logic
- `src/voice.tsx`: walk mode (background keep-alive, push-to-talk recording → `/api/voice`, spoken replies)
- `src/flic.tsx`: Flic 2 buttons via `expo-flic2`, which is pinned to 0.5.0 and loaded lazily. Its packaged config plugin is broken, so `plugins/with-flic2.js` is used instead.
- `src/push.ts`: Expo push registration and handling notification taps

**Shipping changes.** Run `npx tsc --noEmit`, then use the hub `ship_app_update` tool (or `npm run ship-app -- "message"` in `..`). Phones download the update and restart into it. JS/asset changes ship over the air. Adding a native module changes the runtime fingerprint, which needs a new `eas build` that the human installs. Tell them when that happens.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
