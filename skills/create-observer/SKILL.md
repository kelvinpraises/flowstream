---
name: create-observer
description: >-
  Run FlowStream sdk-stats — process video through a content adapter and write
  output video. Use for observe, video processing, football adapter, file ingest.
  Triggers on: observe, sdk-stats, video out, content adapter, football.
---

# Create Observer

`sdk-stats` is **video in → processed video out**. A **content** flag (e.g. `football`) selects the vertical adapter; CV runs inside that adapter as a subprocess, not as a separate core layer.

Distribution to consumers will use **WebRTC** later; there is no WebSocket or IPFS output in the current CLI.

## Prerequisites

- Node.js >= 18, ffmpeg on PATH
- Python venv with `packages/sdk-stats/src/content/football/cv/requirements.txt`
- `flowstream` CLI optional wrapper around `npx tsx src/main.ts`

## Run (direct)

```bash
cd packages/sdk-stats
npx tsx src/main.ts \
  --acquire file \
  --source test/test-10s.mp4 \
  --content football \
  --output file \
  --out-file test/result-file.mp4
```

## Run (CLI)

```bash
flowstream observe --source ./match.mp4 --acquire file --content football --out-file out.mp4
```

## Useful flags

- `--debug` — write internal frame JSONL for inspection (tests only)
- `--no-render` — passthrough source JPEG without pitch render

See `packages/sdk-stats/README.md` for setup and tests.
