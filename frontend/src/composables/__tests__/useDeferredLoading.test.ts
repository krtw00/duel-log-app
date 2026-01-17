import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDeferredLoading } from '../useDeferredLoading'

describe('useDeferredLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not show loading immediately after startLoading', () => {
    const { isLoading, startLoading } = useDeferredLoading({ delay: 300 })

    expect(isLoading.value).toBe(false)

    startLoading()

    expect(isLoading.value).toBe(false)
  })

  it('should show loading after delay', () => {
    const { isLoading, startLoading } = useDeferredLoading({ delay: 300 })

    startLoading()
    expect(isLoading.value).toBe(false)

    vi.advanceTimersByTime(300)
    expect(isLoading.value).toBe(true)
  })

  it('should not show loading if stopped before delay', () => {
    const { isLoading, startLoading, stopLoading } = useDeferredLoading({ delay: 300 })

    startLoading()
    expect(isLoading.value).toBe(false)

    vi.advanceTimersByTime(200)
    stopLoading()

    vi.advanceTimersByTime(200)
    expect(isLoading.value).toBe(false)
  })

  it('should hide loading when stopLoading is called', () => {
    const { isLoading, startLoading, stopLoading } = useDeferredLoading({ delay: 300 })

    startLoading()
    vi.advanceTimersByTime(300)
    expect(isLoading.value).toBe(true)

    stopLoading()
    expect(isLoading.value).toBe(false)
  })

  it('should handle multiple startLoading calls', () => {
    const { isLoading, startLoading, stopLoading } = useDeferredLoading({ delay: 300 })

    startLoading()
    vi.advanceTimersByTime(100)

    // 2回目の呼び出し
    startLoading()
    vi.advanceTimersByTime(200)

    // まだ表示されない（タイマーがリセットされた）
    expect(isLoading.value).toBe(false)

    vi.advanceTimersByTime(100)
    // 2回目の呼び出しから300ms経過で表示
    expect(isLoading.value).toBe(true)

    stopLoading()
  })

  it('should reset loading state', () => {
    const { isLoading, isPending, startLoading, reset } = useDeferredLoading({ delay: 300 })

    startLoading()
    vi.advanceTimersByTime(300)

    expect(isLoading.value).toBe(true)
    expect(isPending.value).toBe(true)

    reset()

    expect(isLoading.value).toBe(false)
    expect(isPending.value).toBe(false)
  })

  it('should use default delay of 300ms', () => {
    const { isLoading, startLoading } = useDeferredLoading()

    startLoading()
    vi.advanceTimersByTime(299)
    expect(isLoading.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(isLoading.value).toBe(true)
  })

  it('should support custom delay', () => {
    const { isLoading, startLoading } = useDeferredLoading({ delay: 500 })

    startLoading()
    vi.advanceTimersByTime(499)
    expect(isLoading.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(isLoading.value).toBe(true)
  })

  it('should track pending state correctly', () => {
    const { isPending, startLoading, stopLoading } = useDeferredLoading({ delay: 300 })

    expect(isPending.value).toBe(false)

    startLoading()
    expect(isPending.value).toBe(true)

    stopLoading()
    expect(isPending.value).toBe(false)
  })
})
