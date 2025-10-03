import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios, { AxiosInstance } from 'axios'
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

const createMockAxiosInstance = (mockRequest: any, mockResponse: any): AxiosInstance => {
  const mockInstance = {
    get: vi.fn(() => mockRequest()),
    post: vi.fn(() => mockRequest()),
    put: vi.fn(() => mockRequest()),
    delete: vi.fn(() => mockRequest()),
    request: vi.fn(() => mockRequest()),
    interceptors: {
      request: {
        use: vi.fn((fulfilled, rejected) => {
          if (fulfilled) mockResponse.requestFulfilled = fulfilled
          if (rejected) mockResponse.requestRejected = rejected
        }),
      },
      response: {
        use: vi.fn((fulfilled, rejected) => {
          if (fulfilled) mockResponse.responseFulfilled = fulfilled
          if (rejected) mockResponse.responseRejected = rejected
        }),
      },
    },
    defaults: { headers: { common: {} } },
  }
  return mockInstance as unknown as AxiosInstance
}

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
    const mockRequest = vi.fn().mockResolvedValue({ data: 'success' })
    const mockResponse: any = {}
    const mockAxios = createMockAxiosInstance(mockRequest, mockResponse)
    vi.spyOn(axios, 'create').mockReturnValue(mockAxios)

    // Apply interceptors from the actual api instance
    api.interceptors.request.use(mockResponse.requestFulfilled, mockResponse.requestRejected)
    api.interceptors.response.use(mockResponse.responseFulfilled, mockResponse.responseRejected)

    await mockAxios.get('/test')

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

    const mockRequest = vi.fn().mockRejectedValue(errorResponse)
    const mockResponse: any = {}
    const mockAxios = createMockAxiosInstance(mockRequest, mockResponse)
    vi.spyOn(axios, 'create').mockReturnValue(mockAxios)

    // Apply interceptors from the actual api instance
    api.interceptors.request.use(mockResponse.requestFulfilled, mockResponse.requestRejected)
    api.interceptors.response.use(mockResponse.responseFulfilled, mockResponse.responseRejected)

    await expect(mockAxios.get('/test')).rejects.toEqual(errorResponse)

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

    const mockRequest = vi.fn().mockRejectedValue(errorResponse)
    const mockResponse: any = {}
    const mockAxios = createMockAxiosInstance(mockRequest, mockResponse)
    vi.spyOn(axios, 'create').mockReturnValue(mockAxios)

    // Apply interceptors from the actual api instance
    api.interceptors.request.use(mockResponse.requestFulfilled, mockResponse.requestRejected)
    api.interceptors.response.use(mockResponse.responseFulfilled, mockResponse.responseRejected)

    await expect(mockAxios.get('/test')).rejects.toEqual(errorResponse)

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

    const mockRequest = vi.fn().mockRejectedValue(networkError)
    const mockResponse: any = {}
    const mockAxios = createMockAxiosInstance(mockRequest, mockResponse)
    vi.spyOn(axios, 'create').mockReturnValue(mockAxios)

    // Apply interceptors from the actual api instance
    api.interceptors.request.use(mockResponse.requestFulfilled, mockResponse.requestRejected)
    api.interceptors.response.use(mockResponse.responseFulfilled, mockResponse.responseRejected)

    await expect(mockAxios.get('/test')).rejects.toEqual(networkError)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).toHaveBeenCalledWith('サーバーに接続できません。ネットワーク接続を確認してください')
  })

  it('should handle request setup error', async () => {
    const setupError = {
      message: 'Request setup failed',
      config: { metadata: { requestId: 'test-request' } },
    }

    const mockRequest = vi.fn().mockRejectedValue(setupError)
    const mockResponse: any = {}
    const mockAxios = createMockAxiosInstance(mockRequest, mockResponse)
    vi.spyOn(axios, 'create').mockReturnValue(mockAxios)

    // Apply interceptors from the actual api instance
    api.interceptors.request.use(mockResponse.requestFulfilled, mockResponse.requestRejected)
    api.interceptors.response.use(mockResponse.responseFulfilled, mockResponse.responseRejected)

    await expect(mockAxios.get('/test')).rejects.toEqual(setupError)

    expect(loadingStore.stop).toHaveBeenCalledWith('test-request')
    expect(notificationStore.error).toHaveBeenCalledWith('リクエストの作成に失敗しました')
  })
})
