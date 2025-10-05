import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import router from '../index'

describe('Router', () => {
  beforeEach(async () => {
    // Pinia初期化
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('has correct routes defined', () => {
    const routes = router.getRoutes()
    const routeNames = routes.map(r => r.name)
    
    expect(routeNames).toContain('Dashboard')
    expect(routeNames).toContain('Login')
    expect(routeNames).toContain('Register')
    expect(routeNames).toContain('Decks')
    expect(routeNames).toContain('Statistics')
    expect(routeNames).toContain('Profile')
  })

  it('dashboard route requires auth', () => {
    const dashboardRoute = router.getRoutes().find(r => r.name === 'Dashboard')
    expect(dashboardRoute?.meta?.requiresAuth).toBe(true)
  })

  it('login route does not require auth', () => {
    const loginRoute = router.getRoutes().find(r => r.name === 'Login')
    expect(loginRoute?.meta?.requiresAuth).toBe(false)
  })

  it('has correct paths', () => {
    const routes = router.getRoutes()
    
    const dashboardRoute = routes.find(r => r.name === 'Dashboard')
    const loginRoute = routes.find(r => r.name === 'Login')
    const registerRoute = routes.find(r => r.name === 'Register')
    
    expect(dashboardRoute?.path).toBe('/')
    expect(loginRoute?.path).toBe('/login')
    expect(registerRoute?.path).toBe('/register')
  })
})
