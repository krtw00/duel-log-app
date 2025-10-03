import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/services/api'
import router from '@/router'
import { User } from '@/types'

// Mock axios
vi.mock('@/services/api', async () => {
  const { vi } = await import('vitest')
  const actual = await vi.importActual('@/services/api')
  return {
    api: {
      ...(actual as any).api,
      post: vi.fn(),
      get: vi.fn(),
    },
  }
})

// Mock vue-router
vi.mock('@/router', async () => {
  const { vi } = await import('vitest')
  const actual = await vi.importActual('@/router')
  return {
    default: {
      ...(actual as any).default,
      push: vi.fn(),
    },
  }
})

describe('authStore', () => {
  const mockUser: User = { id: 1, email: 'test@example.com', username: 'testuser' }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should set user and isAuthenticated on successful login', async () => {
    const authStore = useAuthStore()
    
    // Mock API responses
    (api.post as vi.Mock).mockResolvedValueOnce({ data: {} })
    (api.get as vi.Mock).mockResolvedValueOnce({ data: mockUser })

    await authStore.login('test@example.com', 'password123')

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password123' })
    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toEqual(mockUser)
    expect((authStore as any).isAuthenticated).toBe(true)
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('should clear user and isAuthenticated on logout', async () => {
    const authStore = useAuthStore()
    authStore.user = mockUser
    ;(authStore as any).isInitialized = true

    // Mock API response
    (api.post as vi.Mock).mockResolvedValueOnce({ data: {} })

    await authStore.logout()

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(authStore.user).toBeNull()
    expect((authStore as any).isAuthenticated).toBe(false)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('should fetch user on initialization if authenticated', async () => {
    const authStore = useAuthStore()
    ;(authStore as any).isInitialized = false

    // Mock API response for /me
    (api.get as vi.Mock).mockResolvedValueOnce({ data: mockUser })

    await authStore.fetchUser()

    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toEqual(mockUser)
    expect((authStore as any).isAuthenticated).toBe(true)
    expect((authStore as any).isInitialized).toBe(true)
  })

  it('should not set user if fetchUser fails', async () => {
    const authStore = useAuthStore()
    ;(authStore as any).isInitialized = false

    // Mock API response for /me to reject
    (api.get as vi.Mock).mockRejectedValueOnce(new Error('Unauthorized'))

    await authStore.fetchUser()

    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toBeNull()
    expect((authStore as any).isAuthenticated).toBe(false)
    expect((authStore as any).isInitialized).toBe(true)
  })
})
