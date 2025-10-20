import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { useAuthStore } from './auth'

const THEME_STORAGE_KEY = 'theme'
const DEFAULT_THEME = 'dark'

const readStoredTheme = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME
  } catch {
    // Storage access can throw in some environments (e.g. private mode)
    return DEFAULT_THEME
  }
}

const writeStoredTheme = (value: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Ignore storage errors to keep tests and private browsing working
  }
}

const normaliseTheme = (value: string) => (value === 'light' ? 'light' : 'dark')

export const useThemeStore = defineStore('theme', () => {
  const themeName = ref<'customDarkTheme' | 'customLightTheme'>('customDarkTheme')
  const isDark = ref(true)
  const localTheme = ref(readStoredTheme())

  const applyTheme = (theme: string) => {
    const normalised = normaliseTheme(theme)
    isDark.value = normalised === 'dark'
    themeName.value = isDark.value ? 'customDarkTheme' : 'customLightTheme'
    localTheme.value = normalised
  }

  const loadTheme = () => {
    const authStore = useAuthStore()

    if (authStore.user) {
      // Logged-in users prefer the server side setting
      applyTheme(authStore.user.theme_preference)
    } else {
      // Guests fall back to the locally stored preference
      applyTheme(localTheme.value)
    }
  }

  const toggleTheme = async () => {
    const authStore = useAuthStore()
    const nextTheme = isDark.value ? 'light' : 'dark'

    if (authStore.user) {
      try {
        await api.put('/me', { theme_preference: nextTheme })
        await authStore.fetchUser()
        applyTheme(nextTheme)
      } catch (error) {
        console.error('Failed to update theme preference:', error)
      }
    } else {
      applyTheme(nextTheme)
      writeStoredTheme(nextTheme)
    }
  }

  return {
    themeName,
    isDark,
    loadTheme,
    toggleTheme,
  }
})
