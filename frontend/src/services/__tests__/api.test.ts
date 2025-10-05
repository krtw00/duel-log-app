import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { api } from '../api'

vi.mock('axios')

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates axios instance with correct config', () => {
    expect(api.defaults.baseURL).toBeDefined()
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('has correct headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('is an axios instance', () => {
    expect(api.get).toBeDefined()
    expect(api.post).toBeDefined()
    expect(api.put).toBeDefined()
    expect(api.delete).toBeDefined()
  })
})
