import { SCAN_FPS } from './config.js';

export class ScreenCapture {
  video: HTMLVideoElement | null = null;
  isActive = false;

  private stream: MediaStream | null = null;
  private canvas: OffscreenCanvas | null = null;
  private intervalId: number | null = null;

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

    const scanInterval = 1000 / SCAN_FPS;
    this.intervalId = window.setInterval(() => {
      if (!this.video || !this.canvas) return;

      const ctx = this.canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(this.video, 0, 0);
      const imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      onFrame(imageData);
    }, scanInterval);

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', onEnded);
    }

    return true;
  }

  stop(): void {
    this.isActive = false;

    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
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
  }
}
