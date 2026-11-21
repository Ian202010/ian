# Claude Hub

Run many Claude Code sessions in tmux and talk to all of them from a browser or phone. Every message is stored in Postgres.

- **Sessions in tmux.** Each session is `claude` running in a detached tmux window (`hub-<name>`). You can start, watch, type into and stop sessions from the web UI, the `hub` CLI, or from any Claude session through its MCP tools. That last option is how a "boss" session runs the others.
- **Push delivery through Claude Code channels.** `src/channel.js` is an MCP server that registers as a channel (`claude/channel`). When a message for a session is inserted into Postgres, `LISTEN/NOTIFY` wakes that session's channel server. The server pushes the message straight into the conversation as a `<channel source="hub" from="user" …>` event, so Claude never polls with a tool call. Messages sent to sessions that are offline stay queued and are delivered when the session connects.
- **Permanent, searchable history.** Every message between you and the sessions, and between sessions, is kept with a full-text index. Sessions can call `search_history` when they've forgotten something.
- **Session-to-session messaging.** Sessions message each other with `send_message`, and every message shows up in your UI.
- **Backlog.** Tasks have a project, a status (`backlog`, `todo`, `in_progress`, `blocked`, `done`, `cancelled`) and a priority (P0 urgent to P3 someday). Sessions manage them with tools, and you manage them on the Backlog board.
- **Permission relay.** When a session needs approval for a tool such as Bash or Edit, the request appears in the UI with Allow and Deny buttons.
- **Voice in the browser.** You can hold the 🎤 button to talk (Web Speech API) and turn on "Speak replies aloud" to hear replies (speech synthesis). Use it on your phone by adding it to the home screen as a PWA.
- **Talk while walking.** In the app's walk mode you press a Flic button (or the screen) to talk. The hub transcribes your voice, sends it to a session, and the reply is read aloud on your phone, even when it's locked. Push notifications cover the times the app isn't running. Recordings are kept next to their messages in the history.
- **Phone app that updates itself** (`mobile/`, Expo, Android and iPhone). Sessions ship new versions with the `ship_app_update` tool, and phones download them and restart. See [mobile/README.md](mobile/README.md).

## Requirements

- Node 20+, tmux 3.0+, PostgreSQL 13+
- Claude Code with channels support, logged in with claude.ai or a Console API key. On Team or Enterprise plans, an admin must enable channels (Organization settings → Claude Code → Channels).

## Setup

```bash
cd hub
npm install
# Postgres: create a role and database (or point DATABASE_URL at an existing one)
sudo -u postgres psql -c "CREATE USER hub WITH PASSWORD 'hub';" -c "CREATE DATABASE hub OWNER hub;"
export DATABASE_URL=postgres://hub:hub@localhost:5432/hub   # this is the default

npm start             # web UI on :8787; prints the access token (saved in .hub-token)
```

Open `http://<machine>:8787/?token=<token>` once on each device. The token is then kept in the browser. To reach the hub from your phone when you're away from home, put the machine on [Tailscale](https://tailscale.com) and use its tailnet address, or use `tailscale serve` to get HTTPS, which iOS needs for the microphone. Don't expose port 8787 to the public internet.

Start the orchestrator:

```bash
npm run boss          # = hub spawn boss --cwd . --prompt-file prompts/boss.md
```

### What a spawn runs

```
tmux new-session -d -s hub-<name> -c <cwd> -e HUB_SESSION=<name> \
  claude --mcp-config hub/.hub-mcp.json --dangerously-load-development-channels server:hub [HUB_CLAUDE_ARGS] [args]
```

Claude Code shows a warning for development channels, and a folder-trust prompt for new directories. The spawner answers both automatically by watching the pane. If some other dialog blocks a session, open its **Screen** tab and press keys there, or have the boss session use `read_screen` and `send_keys`.

You can also join a session you started yourself to the hub:

```bash
HUB_SESSION=my-name claude --mcp-config hub/.hub-mcp.json --dangerously-load-development-channels server:hub
```

## Configuration (environment variables)

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` | `postgres://hub:hub@localhost:5432/hub` | |
| `HUB_PORT` / `HUB_HOST` | `8787` / `0.0.0.0` | web server |
| `HUB_TOKEN` | random, saved to `.hub-token` | UI/API access token |
| `HUB_CLAUDE_BIN` | `claude` | |
| `HUB_CLAUDE_ARGS` | — | added to every spawn, e.g. `--permission-mode acceptEdits` |
| `HUB_TMUX_PREFIX` | `hub-` | |
| `HUB_PERMISSION_RELAY` | on | set `0` to turn off approving tools from the UI |
| `EXPO_TOKEN` | — | passed to spawned sessions so they can ship phone-app updates |
| `HUB_APP_CHANNEL` | `production` | EAS Update channel |
| `OPENAI_API_KEY` | — | speech-to-text for voice messages (default model `gpt-4o-mini-transcribe`, set `HUB_STT_MODEL` to change) |
| `HUB_STT` / `HUB_STT_CMD` | auto | `command` runs `HUB_STT_CMD` with `{file}` replaced by the audio path, e.g. `scripts/stt-whisper-cpp.sh {file}` for local whisper.cpp |
| `HUB_DATA_DIR` | `./data` | where voice recordings are kept |
| `HUB_PUSH` | on | set `0` to turn off phone push notifications |

## Tools each session gets (MCP server `hub`)

`reply`, `send_message`, `list_sessions`, `search_history`, `get_messages`, `spawn_session`, `stop_session`, `read_screen`, `send_keys`, `task_add`, `task_list`, `task_update`, `task_projects`, `ship_app_update`

## CLI

```
hub ls | spawn <name> --cwd DIR --prompt "…" | stop <name> | screen <name> | attach <name>
hub send <to> <text> | log [name] | search <query> | tasks [--project P] | task-add <title> --project P --priority 1
hub ship-app <message> | announce-app [message]
```

(`npm link` puts `hub` on your PATH. Otherwise use `node src/cli.js …`.)

## HTTP API (Bearer token)

`GET/POST /api/sessions`, `DELETE /api/sessions/:name`, `GET /api/sessions/:name/screen`, `POST /api/sessions/:name/keys`,
`GET/POST /api/messages`, `GET /api/search?q=`, `POST /api/permission`,
`GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`, `GET /api/tasks/summary`, `POST /api/app/announce`,
`POST /api/voice?to=<session>` (audio body → transcribed message), `GET /api/voice/:file`, `POST|GET /api/ptt?action=toggle|start|stop|replay`, `POST/DELETE /api/devices`, WebSocket `/ws?token=` for live events.

## Voice

Voice messages from the phone (or a Flic button) are uploaded to `/api/voice`, saved under `data/voice/`, transcribed, and sent to the target session with `meta.via = "voice"`. The web UI shows a 🎤 and an audio player on those messages. You need one of these:

- **Hosted:** set `OPENAI_API_KEY` (and `OPENAI_BASE_URL` for any compatible endpoint).
- **Local / offline:** install `ffmpeg` and [whisper.cpp](https://github.com/ggml-org/whisper.cpp), download a model, then:
  ```bash
  WHISPER_MODEL=~/models/ggml-base.en.bin HUB_STT_CMD="$PWD/scripts/stt-whisper-cpp.sh {file}" npm start
  ```

`/api/ptt` lets anything that can make an HTTP request act as a push-to-talk button for every connected phone or browser. For example, the official Flic app's "Internet request" action.

## Tests

```bash
npm test   # drives src/channel.js the way Claude Code does: push delivery, replies, search, tasks, permission relay
```

`test/fake-claude.js` stands in for `claude`, so you can test tmux orchestration without spending tokens: `HUB_CLAUDE_BIN=$PWD/test/fake-claude.js npm start`.

## Roadmap

1. ✅ tmux control, channel push, Postgres history, web UI, inter-session messages
2. ✅ Backlog with projects, statuses and priorities
3. ✅ Native phone app (Expo) that updates itself over the air; sessions ship it with `ship_app_update`
4. ✅ Replies spoken with the phone locked (walk mode background audio), plus push notifications
5. ✅ Flic button push-to-talk (Flic 2 SDK in the app; HTTP `/api/ptt` fallback), with transcription on the server
