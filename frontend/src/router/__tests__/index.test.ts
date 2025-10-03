import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createWebHistory, Router } from 'vue-router'
import { routes } from '../index'
import { useAuthStore } from '../../../stores/auth'
import { createTestingPinia } from '@pinia/testing'

// Mock the auth store
vi.mock('../../../stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    isInitialized: false,
    fetchUser: vi.fn(() => Promise.resolve()),
    logout: vi.fn(),
  })),
}))

describe('Router Navigation Guards', () => {
  let router: Router
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(async () => {
    // Reset Pinia store before each test
    createTestingPinia({ createSpy: vi.fn })
    authStore = useAuthStore()

    router = createRouter({
      history: createWebHistory(),
      routes: routes,
    })

    // Initial navigation to trigger beforeEach
    router.push('/')
    await router.isReady()
  })

  it('should redirect to login if not authenticated and route requires auth', async () => {
    authStore.isAuthenticated = false
    authStore.isInitialized = true

    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('should allow access if authenticated and route requires auth', async () => {
    authStore.isAuthenticated = true
    authStore.isInitialized = true

    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('should redirect from login to dashboard if authenticated', async () => {
    authStore.isAuthenticated = true
    authStore.isInitialized = true

    router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('should redirect from register to dashboard if authenticated', async () => {
    authStore.isAuthenticated = true
    authStore.isInitialized = true

    router.push('/register')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('should allow access to login if not authenticated', async () => {
    authStore.isAuthenticated = false
    authStore.isInitialized = true

    router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('should call fetchUser on initial load if not initialized', async () => {
    authStore.isInitialized = false
    authStore.isAuthenticated = false

    router.push('/')
    await router.isReady()

    expect(authStore.fetchUser).toHaveBeenCalledOnce()
    expect(router.currentRoute.value.name).toBe('Login') // Redirected after fetchUser
  })

  it('should redirect unknown paths to dashboard', async () => {
    authStore.isAuthenticated = true
    authStore.isInitialized = true

    router.push('/non-existent-path')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Dashboard')
  })
})
