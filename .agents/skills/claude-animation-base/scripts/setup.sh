#!/bin/sh
# Fetch or update Claude Animation Base and install its npm dependencies.
set -e
KIT="${CAB_DIR:-$HOME/ClaudeAnimationBase}"
if [ -d "$KIT/.git" ]; then
  git -C "$KIT" pull --ff-only --quiet || echo "warning: could not update $KIT, using it as is"
else
  git clone --quiet --depth 1 https://github.com/JohnHeibel/ClaudeAnimationBase "$KIT"
fi
(cd "$KIT" && npm install --loglevel=error --no-audit --no-fund)

missing=""
command -v node >/dev/null 2>&1 || missing="$missing node"
command -v ffmpeg >/dev/null 2>&1 || missing="$missing ffmpeg"
CHROME="${CHROME_PATH:-}"
if [ -z "$CHROME" ]; then
  for c in google-chrome google-chrome-stable chromium chromium-browser; do
    if command -v "$c" >/dev/null 2>&1; then CHROME=$(command -v "$c"); break; fi
  done
fi
if [ -z "$CHROME" ]; then
  for c in /opt/pw-browsers/chromium*/chrome-linux*/chrome "$HOME"/.cache/ms-playwright/chromium*/chrome-linux*/chrome; do
    if [ -x "$c" ]; then CHROME="$c"; break; fi
  done
fi
[ -n "$CHROME" ] || missing="$missing chrome"
[ -z "$missing" ] || echo "MISSING:$missing"
[ -z "$CHROME" ] || echo "CHROME=$CHROME"
echo "KIT=$KIT"
