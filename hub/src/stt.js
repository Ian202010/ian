// Speech-to-text for voice messages. Pluggable:
//   HUB_STT=openai   uses OPENAI_API_KEY (model HUB_STT_MODEL, default gpt-4o-mini-transcribe)
//   HUB_STT=command  runs HUB_STT_CMD with {file} replaced by the audio path; stdout is the transcript
// With HUB_STT unset: openai if OPENAI_API_KEY is set, else command if HUB_STT_CMD is set.
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

export function sttProvider() {
  const p = process.env.HUB_STT;
  if (p) return p;
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.HUB_STT_CMD) return 'command';
  return null;
}

export async function transcribe(file, mime = 'audio/mp4') {
  const provider = sttProvider();
  if (provider === 'openai') {
    const form = new FormData();
    form.append('model', process.env.HUB_STT_MODEL || 'gpt-4o-mini-transcribe');
    form.append('file', new Blob([await fs.readFile(file)], { type: mime }), path.basename(file));
    const res = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/audio/transcriptions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`transcription failed: ${data.error?.message || res.status}`);
    return (data.text || '').trim();
  }
  if (provider === 'command') {
    const cmd = process.env.HUB_STT_CMD;
    if (!cmd) throw new Error('HUB_STT=command needs HUB_STT_CMD');
    // Run through sh so the command can be a pipeline; the path is passed as $1, never interpolated.
    const { stdout } = await run('sh', ['-c', cmd.replaceAll('{file}', '"$1"'), 'stt', file], { timeout: 120_000, maxBuffer: 4 << 20 });
    return stdout.trim();
  }
  throw new Error('no speech-to-text configured: set OPENAI_API_KEY, or HUB_STT_CMD (see README)');
}
