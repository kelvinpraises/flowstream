---
name: create-observer
description: >-
  Set up a FlowStream stats observer -- run CV-based observation against live
  video to extract real-time match data. Use this skill when setting up video
  observation, running the CV pipeline, configuring stats feeds, processing
  video for predictions, providing observation data to FlowStream, or building
  a content adapter for a new video type. Triggers on: observe, stats, CV,
  video feed, match data, ball tracking, observation pipeline, WebSocket feed,
  IPFS batches, content adapter, Roboflow, video processing.
---

# Create Observer

An observer is a long-running process that ingests live video, extracts factual observations via computer vision, serves them as a real-time WebSocket feed, and batches them to IPFS for permanent storage. Observers are the data foundation of FlowStream -- bookmaker agents and the client UI both consume their output.

Observers do NOT resolve vaults or provide authoritative outcomes. They just observe and report facts. This is legally protected under NBA v. Motorola (1997): independent observation of public broadcasts is legal.

## Prerequisites

1. Node.js >= 18 installed
2. FlowStream CLI installed: `pip install -e .` from the `cli/` directory
3. Logged in: `flowstream login --address 0xYourAddress`
4. The `sdk-stats` package available (auto-discovered in the monorepo, or set `FLOWSTREAM_SDK_STATS_PATH`)

## Starting an Observer

The `flowstream observe` command wraps the `sdk-stats` Observer and spawns it as a subprocess.

### Mock Mode (Development)

Start immediately with synthetic data -- no video source needed:

```bash
flowstream observe --source mock --port 8765
```

This generates realistic observation frames with simulated ball movement, goals, and possession changes. Use it to develop and test bookmaker agents without a real video feed.

### Real Video Source

Point at a video file, YouTube live URL, or RTMP stream:

```bash
# Local video file
flowstream observe --source ./demo-match.mp4 --port 8765

# YouTube live stream
flowstream observe --source "https://youtube.com/live/xyz" --port 8765 --fps 5

# RTMP stream
flowstream observe --source "rtmp://your-stream-url" --port 8765
```

### All Flags

```
flowstream observe
  --source, -s <string>     Video source. "mock" for synthetic data,
                             or a URL/file path. Default: mock
  --port, -p <int>          WebSocket server port. Default: 8765
  --fps <int>               CV processing framerate. Default: 5
                             (5fps is sufficient for stats extraction)
  --ipfs-interval <int>     Seconds between IPFS batch uploads. Default: 30
  --sdk-path <path>         Path to sdk-stats/app directory (overrides auto-discovery)
  --dry-run                 Print the command that would be run, then exit
```

### What Happens When You Run It

The observer starts a pipeline with five stages:

1. **Video ingestion** -- reads frames from the source into a buffer
2. **CV processing** -- runs detection models per frame at the configured FPS:
   - YOLOv8 player detection (1280px)
   - YOLOv8 ball detection (640px slicer)
   - YOLOv8 pitch keypoint detection
   - SigLIP + KMeans team classification
   - ByteTrack player tracking
   - ViewTransformer: image coordinates to pitch coordinates
3. **Event detection** -- detects events from frame diffs (goals, fouls, possession changes)
4. **WebSocket server** -- starts on `ws://localhost:<port>`, pushes one JSON frame every 200ms
5. **IPFS batcher** -- every `--ipfs-interval` seconds, bundles frames into a batch, uploads to IPFS, submits the CID to the Arc observation contract

The observer runs until you stop it with Ctrl+C.

## WebSocket Output Schema

Every 200ms (at 5fps), the observer pushes a JSON frame to all connected WebSocket clients:

```json
{
  "frame": 1234,
  "ts": 1716422400000,
  "ball": [23.5, -12.3],
  "possession": 67,
  "events": [
    { "t": "goal", "team": 0, "min": 62 }
  ],
  "score": [1, 0],
  "min": 62,
  "period": 2
}
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `frame` | number | Monotonically increasing frame counter |
| `ts` | number | Unix timestamp in milliseconds |
| `ball` | [x, y] or null | Ball position on pitch. Center = [0,0], x: -52.5..52.5 (goals), y: -34..34 (sidelines) |
| `possession` | number | Possession percentage (0-100) for home team |
| `events` | array | Events detected in this frame (see below) |
| `score` | [home, away] | Cumulative score. team 0 = home, 1 = away |
| `min` | number | Match minute (elapsed time) |
| `period` | number | 1 = first half, 2 = second half |

**Event types:** `goal`, `shot`, `foul`, `corner`, `offside`, `card`, `possession_change`, `substitution`

Each event object:
```json
{ "t": "goal", "team": 0, "min": 62, "player": null }
```

## IPFS Observation Batches

Every 30 seconds (configurable), the observer bundles all frames since the last batch and uploads to IPFS:

```json
{
  "version": 1,
  "observer": "0xabc...",
  "source": "https://youtube.com/live/xyz",
  "chain": 5042002,
  "from_ts": 1716422400000,
  "to_ts": 1716422430000,
  "frames": [ ... ],
  "events_summary": [
    { "t": "goal", "team": 0, "min": 62 }
  ],
  "match_state": {
    "score": [1, 0],
    "min": 62,
    "period": 2,
    "possession_avg": [67, 33]
  }
}
```

The resulting CID is submitted to the Arc observation contract as a pointer. Anyone can fetch the CID from IPFS to verify the observations.

## Content Adapter Pattern

FlowStream is content-agnostic. The football CV pipeline is just one **content adapter**. The `sdk-stats` package uses a `ContentAdapter` interface that any content type can implement.

```typescript
import { Observer, MockAdapter } from "@flowstream/sdk-stats";

// Mock adapter -- synthetic data, works immediately
const observer = new Observer({
  adapter: new MockAdapter(),
  port: 8765,
});
await observer.start();
```

The ContentAdapter interface:

```typescript
interface ContentAdapter {
  readonly contentType: string;      // e.g., "football", "esports-lol"
  readonly displayName: string;

  initialize(source: string, fps: number): Promise<void>;
  processFrame(frameId: number, elapsedMs: number): Promise<ObservationFrame | null>;
  destroy(): Promise<void>;
}
```

To add a new content vertical (esports, debates, concerts), write one adapter file that implements this interface. The rest of the system -- bookmaker agents, vaults, client UI -- works without changes because they consume the same normalized `ObservationFrame` schema.

### Normalized ObservationFrame (content-agnostic)

The SDK uses content-agnostic field names internally:

| Generic Field | Football Equivalent |
|---------------|-------------------|
| `primaryPosition` | `ball` position |
| `momentum` | `possession` percentage |
| `elapsed` | `min` (match minute) |
| `score_change` event | `goal` event |
| `action` event | `shot`, `corner` |
| `violation` event | `card`, `offside`, `foul` |
| `momentum_shift` event | `possession_change` |

Content-specific data goes in the `meta` field of each frame.

## Connecting Consumers

Once the observer is running, other services connect to its WebSocket:

```bash
# Bookmaker agent consuming the feed
flowstream agent run my-bookmaker --ws ws://localhost:8765

# Or connect programmatically
const ws = new WebSocket("ws://localhost:8765");
ws.onmessage = (event) => {
  const frame = JSON.parse(event.data);
  console.log(`Frame ${frame.frame}: ball at ${frame.ball}`);
};
```

## SDK Reference

The observer wraps `@flowstream/sdk-stats`. Key classes:

- `Observer` -- main entry point, starts the pipeline and WebSocket server
- `MockAdapter` -- synthetic data adapter for development
- `FootballAdapter` -- real CV adapter using Roboflow sports models
- `ContentAdapter` -- interface for building new content type adapters
- `WsServer` -- WebSocket frame server
- `IpfsBatcher` -- batches frames and uploads to IPFS

Package: `@flowstream/sdk-stats` in `packages/sdk-stats/`

## Troubleshooting

**"Could not find sdk-stats package"** -- Set `FLOWSTREAM_SDK_STATS_PATH` to the `sdk-stats/app` directory, or pass `--sdk-path /path/to/sdk-stats/app`.

**"Node.js not found"** -- Install Node.js >= 18.

**No WebSocket clients connecting** -- Verify the port is correct and not blocked. Default is 8765. Check with `--dry-run` to see the exact command.
