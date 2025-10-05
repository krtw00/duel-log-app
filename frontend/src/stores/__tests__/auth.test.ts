import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/services/api'
import router from '@/router'
import { User } from '@/types'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mock('@/services/api', () => ({
      api: {
        post: vi.fn(),
        get: vi.fn(),
      },
    }))

    vi.mock('@/router', () => ({
      default: {
        push: vi.fn(),
      },
    }))
    vi.clearAllMocks()
  })

  const mockUser: User = { id: 1, email: 'test@example.com', username: 'testuser', streamer_mode: false }

  it('should set user and isAuthenticated on successful login', async () => {
    const authStore = useAuthStore()
    
    (api.post as vi.Mock).mockResolvedValueOnce({ data: {} })
    (api.get as vi.Mock).mockResolvedValueOnce({ data: mockUser })

    await authStore.login('test@example.com', 'password123')

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password123' })
    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('should clear user and isAuthenticated on logout', async () => {
    const authStore = useAuthStore()
    authStore.user = mockUser
    authStore.isInitialized.value = true

    (api.post as vi.Mock).mockResolvedValueOnce({ data: {} })

    await authStore.logout()

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('should fetch user on initialization if authenticated', async () => {
    const authStore = useAuthStore()
    authStore.isInitialized.value = false

    (api.get as vi.Mock).mockResolvedValueOnce({ data: mockUser })

    await authStore.fetchUser()

    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isInitialized.value).toBe(true)
  })

  it('should not set user if fetchUser fails', async () => {
    const authStore = useAuthStore()
    authStore.isInitialized.value = false

    (api.get as vi.Mock).mockRejectedValueOnce(new Error('Unauthorized'))

    await authStore.fetchUser()

    expect(api.get).toHaveBeenCalledWith('/me')
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isInitialized.value).toBe(true)
  })
})
