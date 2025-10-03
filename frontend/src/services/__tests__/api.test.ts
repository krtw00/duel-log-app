import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { api } from '../api'
import { useNotificationStore } from '@/stores/notification'
import { useLoadingStore } from '@/stores/loading'
import { useAuthStore } from '@/stores/auth'
import { createPinia, setActivePinia } from 'pinia'

// Mock Pinia stores
vi.mock('@/stores/notification', () => ({
  useNotificationStore: vi.fn(() => ({
    error: vi.fn(),
    success: vi.fn(),
  })),
}))

vi.mock('@/stores/loading', () => ({
  useLoadingStore: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    stopAll: vi.fn(),
  })),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    logout: vi.fn(),
  })),
}))

describe('api service', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>
  let loadingStore: ReturnType<typeof useLoadingStore>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    notificationStore = useNotificationStore()
    loadingStore = useLoadingStore()
    authStore = useAuthStore()
    vi.clearAllMocks()
  })

  it('should start and stop loading on successful request', async () => {
    vi.spyOn(axios, 'create').mockReturnValue({
      ...axios.create(),
      request: vi.fn().mockResolvedValue({ data: 'success' }),
    })

    const testApi = axios.create()
    testApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
    testApi.interceptors.response.use(api.interceptors.response.handlers[0].fulfilled)

    await testApi.get('/test')

    expect(loadingStore.start).toHaveBeenCalledWith(expect.any(String))
    expect(loadingStore.stop).toHaveBeenCalledWith(expect.any(String))
    expect(loadingStore.stopAll).not.toHaveBeenCalled()
  })

  it('should handle 401 error and logout', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { detail: 'Unauthorized' },
      },
      config: { metadata: { requestId: 'test-request' } },
    }

    vi.spyOn(axios, 'create').mockReturnValue({
      ...axios.create(),
      request: vi.fn().mockRejectedValue(errorResponse),
    })

    const testApi = axios.create()
    testApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
    testApi.interceptors.response.use(api.interceptors.response.handlers[0].rejected)

    await expect(testApi.get('/test')).rejects.toEqual(errorResponse)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).not.toHaveBeenCalled()
    expect(authStore.logout).toHaveBeenCalled()
  })

  it('should show error notification for non-401 errors', async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: { detail: 'Bad Request' },
      },
      config: { metadata: { requestId: 'test-request' } },
    }

    vi.spyOn(axios, 'create').mockReturnValue({
      ...axios.create(),
      request: vi.fn().mockRejectedValue(errorResponse),
    })

    const testApi = axios.create()
    testApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
    testApi.interceptors.response.use(api.interceptors.response.handlers[0].rejected)

    await expect(testApi.get('/test')).rejects.toEqual(errorResponse)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).toHaveBeenCalledWith('リクエストが正しくありません')
    expect(authStore.logout).not.toHaveBeenCalled()
  })

  it('should handle network error', async () => {
    const networkError = {
      request: true,
      message: 'Network Error',
      config: { metadata: { requestId: 'test-request' } },
    }

    vi.spyOn(axios, 'create').mockReturnValue({
      ...axios.create(),
      request: vi.fn().mockRejectedValue(networkError),
    })

    const testApi = axios.create()
    testApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
    testApi.interceptors.response.use(api.interceptors.response.handlers[0].rejected)

    await expect(testApi.get('/test')).rejects.toEqual(networkError)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).toHaveBeenCalledWith('サーバーに接続できません。ネットワーク接続を確認してください')
  })

  it('should handle request setup error', async () => {
    const setupError = {
      message: 'Request setup failed',
      config: { metadata: { requestId: 'test-request' } },
    }

    vi.spyOn(axios, 'create').mockReturnValue({
      ...axios.create(),
      request: vi.fn().mockRejectedValue(setupError),
    })

    const testApi = axios.create()
    testApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled)
    testApi.interceptors.response.use(api.interceptors.response.handlers[0].rejected)

    await expect(testApi.get('/test')).rejects.toEqual(setupError)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).toHaveBeenCalledWith('リクエストの作成に失敗しました')
  })
})
