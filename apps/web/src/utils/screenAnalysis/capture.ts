import { SCAN_FPS } from './config.js';

const ROLLING_FRAME_MS = 3_000;

export type CapturedFrame = {
  bitmap: ImageBitmap;
  capturedAt: number;
  width: number;
  height: number;
};

export class ScreenCapture {
  video: HTMLVideoElement | null = null;
  isActive = false;

  private stream: MediaStream | null = null;
  private canvas: OffscreenCanvas | null = null;
  private intervalId: number | null = null;
  private frameCallbackId: number | null = null;
  private lastFrameAt = 0;
  private recentFrames: CapturedFrame[] = [];

  private trimRecentFrames(now = Date.now()): void {
    const keep: CapturedFrame[] = [];
    for (const frame of this.recentFrames) {
      if (now - frame.capturedAt <= ROLLING_FRAME_MS) {
        keep.push(frame);
      } else {
        frame.bitmap.close();
      }
    }
    this.recentFrames = keep;
  }

  private clearRecentFrames(): void {
    for (const frame of this.recentFrames) {
      frame.bitmap.close();
    }
    this.recentFrames = [];
  }

  private recordCurrentFrame(): void {
    if (!this.canvas) return;

    const bitmap = this.canvas.transferToImageBitmap();
    this.recentFrames.push({
      bitmap,
      capturedAt: Date.now(),
      width: this.canvas.width,
      height: this.canvas.height,
    });
    this.trimRecentFrames();
  }

  private captureCurrentFrame(onFrame: (imageData: ImageData) => void): void {
    if (!this.video || !this.canvas) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(this.video, 0, 0);
    const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.recordCurrentFrame();
    onFrame(imageData);
  }

  async start(onFrame: (imageData: ImageData) => void, onEnded: () => void): Promise<boolean> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: SCAN_FPS },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        return false;
      }
      throw error;
    }
    this.stream = stream;

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    this.video = video;

    this.canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
    this.isActive = true;
    this.lastFrameAt = 0;
    this.clearRecentFrames();

    const scanInterval = 1000 / SCAN_FPS;
    if ('requestVideoFrameCallback' in video) {
      const tick = (_now: number, metadata: { expectedDisplayTime?: number }) => {
        if (!this.isActive || !this.video) return;

        const frameAt = metadata.expectedDisplayTime ?? performance.now();
        if (frameAt - this.lastFrameAt >= scanInterval) {
          this.lastFrameAt = frameAt;
          this.captureCurrentFrame(onFrame);
        }

        if (this.video && this.isActive) {
          this.frameCallbackId = this.video.requestVideoFrameCallback(tick);
        }
      };

      this.frameCallbackId = video.requestVideoFrameCallback(tick);
    } else {
      this.intervalId = window.setInterval(() => {
        this.captureCurrentFrame(onFrame);
      }, scanInterval);
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', onEnded);
    }

    return true;
  }

  async exportRecentFrames(): Promise<CapturedFrame[]> {
    this.trimRecentFrames();

    const frames = await Promise.all(
      this.recentFrames.map(async (frame) => ({
        bitmap: await createImageBitmap(frame.bitmap),
        capturedAt: frame.capturedAt,
        width: frame.width,
        height: frame.height,
      })),
    );

    return frames;
  }

  stop(): void {
    this.isActive = false;

    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.video && this.frameCallbackId != null && 'cancelVideoFrameCallback' in this.video) {
      this.video.cancelVideoFrameCallback(this.frameCallbackId);
      this.frameCallbackId = null;
    }

    this.clearRecentFrames();
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }
    this.canvas = null;
    this.lastFrameAt = 0;
  }
}
