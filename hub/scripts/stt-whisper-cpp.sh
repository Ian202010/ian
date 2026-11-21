#!/bin/sh
# Local, offline transcription with whisper.cpp. Use with:
#   HUB_STT_CMD="$PWD/scripts/stt-whisper-cpp.sh {file}"
# Needs ffmpeg and whisper.cpp's whisper-cli; set WHISPER_MODEL to a ggml model path.
set -e
in="$1"
wav="$(mktemp --suffix=.wav)"
trap 'rm -f "$wav"' EXIT
ffmpeg -loglevel error -y -i "$in" -ar 16000 -ac 1 -c:a pcm_s16le "$wav"
whisper-cli -m "${WHISPER_MODEL:?set WHISPER_MODEL to a ggml model file}" -f "$wav" -nt -np 2>/dev/null | sed 's/^ *//' | tr '\n' ' '
