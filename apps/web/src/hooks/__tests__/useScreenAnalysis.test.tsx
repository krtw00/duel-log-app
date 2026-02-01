import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { useScreenAnalysis } from '../useScreenAnalysis.js';
import { api } from '../../lib/api.js';

vi.mock('../../lib/api.js', () => ({
  api: vi.fn().mockResolvedValue({}),
}));

class FakeWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

class FakeOffscreenCanvas {
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
  getContext() {
    return {
      drawImage: vi.fn(),
      getImageData: () => ({
        data: new Uint8ClampedArray(4),
        width: this.width,
        height: this.height,
      }),
    };
  }
}

describe('useScreenAnalysis', () => {
  const apiMock = vi.mocked(api);
  let originalCreateElement: typeof document.createElement;
  let originalCrypto: Crypto | undefined;
  let originalMediaDevices: MediaDevices | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
    localStorage.setItem('duellog.screenAnalysis.debugLogging', 'true');
    apiMock.mockClear();

    originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (array: Uint8Array) => {
          for (let i = 0; i < array.length; i += 1) {
            array[i] = (i + 1) % 256;
          }
          return array;
        },
      },
      configurable: true,
    });

    const track = {
      stop: vi.fn(),
      addEventListener: vi.fn(),
    };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track],
    };
    originalMediaDevices = navigator.mediaDevices;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getDisplayMedia: vi.fn().mockResolvedValue(stream),
      },
      configurable: true,
    });

    originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'video') {
        const video = originalCreateElement('video') as HTMLVideoElement;
        Object.defineProperty(video, 'videoWidth', { value: 1280 });
        Object.defineProperty(video, 'videoHeight', { value: 720 });
        Object.defineProperty(video, 'srcObject', { writable: true, value: null });
        video.play = vi.fn().mockResolvedValue(undefined) as HTMLVideoElement['play'];
        video.pause = vi.fn() as HTMLVideoElement['pause'];
        return video;
      }
      return originalCreateElement(tagName);
    });

    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem('duellog.screenAnalysis.debugLogging');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalCrypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    } else {
      // @ts-expect-error cleanup
      delete globalThis.crypto;
    }
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: originalMediaDevices,
        configurable: true,
      });
    } else {
      // @ts-expect-error cleanup
      delete navigator.mediaDevices;
    }
  });

  it('creates a debug session id with crypto.getRandomValues', async () => {
    const mathSpy = vi.spyOn(Math, 'random');
    const { result } = renderHook(() => useScreenAnalysis());

    await act(async () => {
      await result.current.startCapture();
    });

    await waitFor(() => {
      expect(result.current.debugSessionId).not.toBeNull();
    });
    expect(result.current.debugSessionId).toMatch(/^\d+-[0-9a-f]{32}$/);
    expect(mathSpy).not.toHaveBeenCalled();
  });

  it('clears debug session state when capture stops', async () => {
    const { result } = renderHook(() => useScreenAnalysis());

    await act(async () => {
      await result.current.startCapture();
    });

    await waitFor(() => {
      expect(result.current.status.isCapturing).toBe(true);
    });

    act(() => {
      result.current.stopCapture();
    });

    await waitFor(() => {
      expect(result.current.status.isCapturing).toBe(false);
      expect(result.current.debugSessionId).toBeNull();
    });
  });
});
