import puppeteer, { type Browser, type Page } from "puppeteer";
import type { FrameSource } from "./source.js";

export interface WebCaptureOptions {
  url: string;
  interactive?: boolean;
}

export class WebCapture implements FrameSource {
  private url: string;
  private interactive: boolean;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private cropRegion: { x: number; y: number; width: number; height: number } | null = null;

  constructor(options: WebCaptureOptions) {
    this.url = options.url;
    this.interactive = options.interactive ?? false;
  }

  async start(): Promise<void> {
    console.log(`[web-capture] Launching Chromium (interactive=${this.interactive})...`);
    this.browser = await puppeteer.launch({
      headless: !this.interactive,
      defaultViewport: { width: 1280, height: 720 },
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
    console.log(`[web-capture] Navigating to ${this.url}...`);
    await this.page.goto(this.url, { waitUntil: "networkidle2", timeout: 60000 });

    if (this.interactive) {
      console.log("[web-capture] Interactive mode active. Injected drag-to-crop overlay.");
      this.cropRegion = await this.runInteractiveCropper();
      console.log("[web-capture] Crop region confirmed:", this.cropRegion);
    }
  }

  async nextFrame(): Promise<Buffer | null> {
    if (!this.page) return null;
    try {
      let screenshot: Buffer;
      if (this.cropRegion) {
        screenshot = (await this.page.screenshot({
          type: "jpeg",
          quality: 80,
          clip: {
            x: this.cropRegion.x,
            y: this.cropRegion.y,
            width: this.cropRegion.width,
            height: this.cropRegion.height,
          },
        })) as Buffer;
      } else {
        screenshot = (await this.page.screenshot({
          type: "jpeg",
          quality: 80,
        })) as Buffer;
      }
      return screenshot;
    } catch (err) {
      console.error("[web-capture] screenshot error:", err);
      return null;
    }
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    console.log("[web-capture] Stopped");
  }

  private async runInteractiveCropper(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    if (!this.page) throw new Error("Page not initialized");

    await this.page.evaluate(() => {
      const style = document.createElement("style");
      style.id = "flowstream-crop-style";
      style.innerHTML = `
        #flowstream-crop-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9999999;
          cursor: crosshair;
          user-select: none;
        }
        #flowstream-crop-box {
          position: absolute;
          border: 2px dashed #00ffcc;
          background: rgba(0, 255, 204, 0.15);
          box-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
          pointer-events: none;
          display: none;
        }
        #flowstream-crop-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #00ffcc;
          color: #000;
          font-family: monospace;
          font-weight: bold;
          font-size: 16px;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          z-index: 10000000;
          box-shadow: 0 4px 15px rgba(0, 255, 204, 0.4);
          transition: all 0.2s ease;
        }
        #flowstream-crop-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 255, 204, 0.6);
        }
        #flowstream-crop-hint {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.85);
          color: #00ffcc;
          font-family: monospace;
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 10000000;
          border: 1px solid #00ffcc;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);

      const overlay = document.createElement("div");
      overlay.id = "flowstream-crop-overlay";

      const box = document.createElement("div");
      box.id = "flowstream-crop-box";
      overlay.appendChild(box);

      const hint = document.createElement("div");
      hint.id = "flowstream-crop-hint";
      hint.innerText =
        "Click and drag to select the video crop region. Press 'Confirm Selection' when done.";
      overlay.appendChild(hint);

      const btn = document.createElement("button");
      btn.id = "flowstream-crop-btn";
      btn.innerText = "Confirm Selection";
      document.body.appendChild(btn);
      document.body.appendChild(overlay);

      let startX = 0,
        startY = 0,
        isDrawing = false;
      const cropRect = { x: 0, y: 0, width: 0, height: 0 };

      overlay.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDrawing = true;
        box.style.display = "block";
        box.style.left = startX + "px";
        box.style.top = startY + "px";
        box.style.width = "0px";
        box.style.height = "0px";
      });

      overlay.addEventListener("mousemove", (e) => {
        if (!isDrawing) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        cropRect.x = Math.min(startX, currentX);
        cropRect.y = Math.min(startY, currentY);
        cropRect.width = Math.abs(currentX - startX);
        cropRect.height = Math.abs(currentY - startY);

        box.style.left = cropRect.x + "px";
        box.style.top = cropRect.y + "px";
        box.style.width = cropRect.width + "px";
        box.style.height = cropRect.height + "px";
      });

      overlay.addEventListener("mouseup", () => {
        isDrawing = false;
      });

      btn.addEventListener("click", () => {
        // Report selection coordinates back to Node
        (window as any).onCropConfirmed(cropRect);
      });
    });

    return new Promise((resolve) => {
      this.page!.exposeFunction("onCropConfirmed", async (crop: any) => {
        await this.page!.evaluate(() => {
          document.getElementById("flowstream-crop-overlay")?.remove();
          document.getElementById("flowstream-crop-btn")?.remove();
          document.getElementById("flowstream-crop-style")?.remove();
        });
        resolve(crop);
      });
    });
  }
}
