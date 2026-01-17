import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, onUnmounted } from 'vue'
import { mount } from '@vue/test-utils'
import { useCancellableRequest } from '../useCancellableRequest'

describe('useCancellableRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('リクエストを作成できる', () => {
    const { createRequest } = useCancellableRequest()
    const request = createRequest('test-key')

    expect(request).toHaveProperty('signal')
    expect(request).toHaveProperty('abort')
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(typeof request.abort).toBe('function')
  })

  it('同じキーで連続してリクエストを作成すると、前のリクエストがキャンセルされる', () => {
    const { createRequest } = useCancellableRequest()
    
    const request1 = createRequest('test-key')
    const abortSpy1 = vi.fn()
    request1.signal.addEventListener('abort', abortSpy1)

    const request2 = createRequest('test-key')

    // 前のリクエストがキャンセルされる
    expect(request1.signal.aborted).toBe(true)
    expect(abortSpy1).toHaveBeenCalled()

    // 新しいリクエストは有効
    expect(request2.signal.aborted).toBe(false)
  })

  it('異なるキーでリクエストを作成すると、独立して管理される', () => {
    const { createRequest } = useCancellableRequest()
    
    const request1 = createRequest('key1')
    const request2 = createRequest('key2')

    // 両方のリクエストが有効
    expect(request1.signal.aborted).toBe(false)
    expect(request2.signal.aborted).toBe(false)
  })

  it('cancelRequestで特定のリクエストをキャンセルできる', () => {
    const { createRequest, cancelRequest } = useCancellableRequest()
    
    const request = createRequest('test-key')
    const abortSpy = vi.fn()
    request.signal.addEventListener('abort', abortSpy)

    cancelRequest('test-key')

    expect(request.signal.aborted).toBe(true)
    expect(abortSpy).toHaveBeenCalled()
  })

  it('存在しないキーをcancelRequestしてもエラーにならない', () => {
    const { cancelRequest } = useCancellableRequest()
    
    expect(() => cancelRequest('non-existent-key')).not.toThrow()
  })

  it('cancelAllRequestsで全てのリクエストをキャンセルできる', () => {
    const { createRequest, cancelAllRequests } = useCancellableRequest()
    
    const request1 = createRequest('key1')
    const request2 = createRequest('key2')
    const request3 = createRequest('key3')

    cancelAllRequests()

    expect(request1.signal.aborted).toBe(true)
    expect(request2.signal.aborted).toBe(true)
    expect(request3.signal.aborted).toBe(true)
  })

  it('コンポーネントがアンマウントされると全てのリクエストがキャンセルされる', () => {
    const TestComponent = defineComponent({
      setup() {
        const { createRequest } = useCancellableRequest()
        const request1 = createRequest('key1')
        const request2 = createRequest('key2')
        
        return { request1, request2 }
      },
      template: '<div>Test</div>',
    })

    const wrapper = mount(TestComponent)
    const { request1, request2 } = wrapper.vm

    expect(request1.signal.aborted).toBe(false)
    expect(request2.signal.aborted).toBe(false)

    // アンマウント
    wrapper.unmount()

    expect(request1.signal.aborted).toBe(true)
    expect(request2.signal.aborted).toBe(true)
  })

  it('abort関数を呼び出してリクエストをキャンセルできる', () => {
    const { createRequest } = useCancellableRequest()
    
    const request = createRequest('test-key')
    const abortSpy = vi.fn()
    request.signal.addEventListener('abort', abortSpy)

    request.abort()

    expect(request.signal.aborted).toBe(true)
    expect(abortSpy).toHaveBeenCalled()
  })
})
