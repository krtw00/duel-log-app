import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileView from '../ProfileView.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { api } from '@/services/api'

const vuetify = createVuetify({
  components,
  directives,
})

vi.mock('@/services/api', () => ({
  api: {
    put: vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} })),
  },
}))

describe('ProfileView.vue', () => {
  let authStore: ReturnType<typeof useAuthStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    const _pinia = createTestingPinia({
      createSpy: vi.fn,
    })
    authStore = useAuthStore()
    notificationStore = useNotificationStore()
    authStore.user = { id: 1, username: 'testuser', email: 'test@example.com' }
    vi.clearAllMocks()
  })

  it('renders correctly with user data', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    await (wrapper.vm as any).$nextTick()

    expect(wrapper.exists()).toBe(true)
    expect((wrapper.find('input[label="ユーザー名"]').element as HTMLInputElement).value).toBe('testuser')
    expect((wrapper.find('input[label="メールアドレス"]').element as HTMLInputElement).value).toBe('test@example.com')
  })

  it('updates profile on form submission with valid data', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: true }), resetValidation: vi.fn() }
    ;(wrapper.vm as any).form.username = 'newusername'
    ;(wrapper.vm as any).form.email = 'new@example.com'
    ;(wrapper.vm as any).form.password = 'newpassword123'
    ;(wrapper.vm as any).form.passwordConfirm = 'newpassword123'

    api.put = vi.fn(() => Promise.resolve({ data: { ...authStore.user, username: 'newusername', email: 'new@example.com' }, status: 200, statusText: 'OK', headers: {}, config: {}, request: {} }))

    await wrapper.find('button').trigger('click') // Update button

    expect(api.put).toHaveBeenCalledWith('/me/', {
      username: 'newusername',
      email: 'new@example.example.com',
      password: 'newpassword123',
    })
    expect(authStore.user?.username).toBe('newusername')
    expect(notificationStore.success).toHaveBeenCalledWith('プロフィールを更新しました')
    expect((wrapper.vm as any).form.password).toBe('')
    expect((wrapper.vm as any).form.passwordConfirm).toBe('')
    expect((wrapper.vm as any).formRef.resetValidation).toHaveBeenCalled()
  })

  it('does not update profile on form submission with invalid data', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    ;(wrapper.vm as any).formRef = { validate: () => Promise.resolve({ valid: false }) }
    ;(wrapper.vm as any).form.username = ''

    await wrapper.find('button').trigger('click') // Update button

    expect(api.put).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
  })

  it('deletes account when confirmed', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    ;(wrapper.vm as any).deleteDialog = true
    ;(wrapper.vm as any).deleteConfirmText = 'DELETE'

    await wrapper.find('.delete-dialog-card button.v-btn--error').trigger('click') // Delete button in dialog

    expect(api.delete).toHaveBeenCalledWith('/me/')
    expect(notificationStore.success).toHaveBeenCalledWith('アカウントが正常に削除されました')
    expect(authStore.logout).toHaveBeenCalled()
  })

  it('does not delete account if confirmation text is incorrect', async () => {
    const wrapper = mount(ProfileView, {
      global: {
        plugins: [vuetify, createTestingPinia()],
        stubs: {
          AppBar: true,
        },
      },
    })

    ;(wrapper.vm as any).deleteDialog = true
    ;(wrapper.vm as any).deleteConfirmText = 'WRONG'

    await wrapper.find('.delete-dialog-card button.v-btn--error').trigger('click') // Delete button in dialog

    expect(api.delete).not.toHaveBeenCalled()
    expect(notificationStore.success).not.toHaveBeenCalled()
    expect(authStore.logout).not.toHaveBeenCalled()
  })
})
