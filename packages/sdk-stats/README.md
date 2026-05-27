# @flowstream/sdk-stats

Video in → processed video out. The CLI wires **acquire** (source), **content** (vertical adapter), and **output** (file today; WebRTC later).

Football runs a CV subprocess under `src/content/football/cv/` — not a separate “core” layer.

## Setup

**Git LFS** — football CV weights (`*.pt`) are stored in Git LFS. Install once:

```bash
brew install git-lfs   # or see https://git-lfs.github.com
git lfs install
```

After clone or pull, fetch the weights:

```bash
git lfs pull
```

Without LFS you get tiny pointer files (~134 bytes) instead of the models.

```bash
cd packages/sdk-stats
npm install
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
npm run build
```

Optional: `export FLOWSTREAM_PYTHON=/path/to/python3`

Requires **ffmpeg** on `PATH`.

## Run

```bash
npx tsx src/main.ts \
  --acquire file \
  --source test/test-10s.mp4 \
  --content football \
  --output file \
  --out-file test/result-file.mp4
```

Flags:

- `--debug` — also write internal `ObservationFrame` JSONL (default path: same as out-file with `.jsonl`)
- `--debug-file <path>` — JSONL path when using `--debug`
- `--no-render` — passthrough acquired JPEG to output (legal bypass of rendered stream)

## Test

```bash
npm run build
npm test
```

Unit tests cover orchestrator lifecycle. E2E runs full football CV against `test/test-10s.mp4` (slow; needs venv + weights).
