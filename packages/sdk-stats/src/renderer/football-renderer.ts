/**
 * FootballRenderer — renders football observation frames as HTML/SVG.
 *
 * Produces a top-down pitch view with ball position.
 * Used for generating visual representations FROM observation data
 * without requiring the original video feed.
 *
 * This is the independent rendering capability (NBA v. Motorola):
 * independent observation + independent rendering.
 */

import type { VisualRenderer } from "../adapters/adapter.js";
import type { ObservationFrame, ObservationBatch } from "@flowstream/types";

export class FootballRenderer implements VisualRenderer {
  readonly contentType = "football";

  /**
   * Render an ObservationFrame as an SVG pitch with ball position.
   */
  renderFrame(frame: ObservationFrame): string {
    const [ballX, ballY] = frame.primaryPosition ?? [0, 0];

    // Map pitch coords (-52.5..52.5, -34..34) to SVG viewport (0..1050, 0..680)
    const svgX = ((ballX + 52.5) / 105) * 1050;
    const svgY = ((ballY + 34) / 68) * 680;

    const [homeScore, awayScore] = frame.score;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 680" width="525" height="340">
  <!-- Pitch background -->
  <rect width="1050" height="680" fill="#2d8a4e" rx="8"/>

  <!-- Pitch lines -->
  <rect x="25" y="25" width="1000" height="630" fill="none" stroke="white" stroke-width="2"/>
  <line x1="525" y1="25" x2="525" y2="655" stroke="white" stroke-width="2"/>
  <circle cx="525" cy="340" r="91.5" fill="none" stroke="white" stroke-width="2"/>
  <circle cx="525" cy="340" r="3" fill="white"/>

  <!-- Penalty areas -->
  <rect x="25" y="178" width="165" height="324" fill="none" stroke="white" stroke-width="2"/>
  <rect x="860" y="178" width="165" height="324" fill="none" stroke="white" stroke-width="2"/>

  <!-- Goal areas -->
  <rect x="25" y="262" width="55" height="156" fill="none" stroke="white" stroke-width="2"/>
  <rect x="970" y="262" width="55" height="156" fill="none" stroke="white" stroke-width="2"/>

  <!-- Ball -->
  <circle cx="${svgX}" cy="${svgY}" r="8" fill="white" stroke="black" stroke-width="1.5"/>

  <!-- Score overlay -->
  <text x="525" y="18" text-anchor="middle" fill="white" font-size="14" font-family="monospace">${homeScore} - ${awayScore}  |  ${frame.elapsed}'  |  momentum: ${frame.momentum}%</text>
</svg>`;
  }

  /**
   * Render a batch summary showing ball trajectory.
   */
  renderBatchSummary(batch: ObservationBatch): string {
    // Plot ball positions as a trajectory line
    const points = batch.frames
      .filter((f) => f.primaryPosition !== null)
      .map((f) => {
        const [x, y] = f.primaryPosition!;
        const svgX = ((x + 52.5) / 105) * 1050;
        const svgY = ((y + 34) / 68) * 680;
        return `${svgX},${svgY}`;
      })
      .join(" ");

    const [homeScore, awayScore] = batch.state.score;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1050 680" width="525" height="340">
  <rect width="1050" height="680" fill="#2d8a4e" rx="8"/>
  <rect x="25" y="25" width="1000" height="630" fill="none" stroke="white" stroke-width="2"/>
  <line x1="525" y1="25" x2="525" y2="655" stroke="white" stroke-width="2"/>
  <circle cx="525" cy="340" r="91.5" fill="none" stroke="white" stroke-width="2"/>

  <!-- Ball trajectory -->
  <polyline points="${points}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>

  <!-- Summary -->
  <text x="525" y="18" text-anchor="middle" fill="white" font-size="14" font-family="monospace">${homeScore} - ${awayScore}  |  ${batch.frames.length} frames  |  ${batch.events.length} events</text>
</svg>`;
  }
}
