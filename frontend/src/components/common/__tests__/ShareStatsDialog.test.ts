import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createTestingPinia } from '@pinia/testing';
import ShareStatsDialog from '../ShareStatsDialog.vue';
import { useSharedStatisticsStore } from '../../../stores/shared_statistics';
import { useNotificationStore } from '../../../stores/notification';

const vuetify = createVuetify({
  components,
  directives,
});

// Helper function to wait for Vuetify dialog to render
const waitForDialog = async () => {
  await flushPromises();
  await new Promise((resolve) => setTimeout(resolve, 100));
};

describe('ShareStatsDialog.vue', () => {
  let sharedStatisticsStore: ReturnType<typeof useSharedStatisticsStore>;
  let notificationStore: ReturnType<typeof useNotificationStore>;
  let pinia: ReturnType<typeof createTestingPinia>;

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });
    sharedStatisticsStore = useSharedStatisticsStore();
    notificationStore = useNotificationStore();

    // Spy on notification methods
    vi.spyOn(notificationStore, 'success');
    vi.spyOn(notificationStore, 'error');
    vi.spyOn(sharedStatisticsStore, 'createSharedLink');

    vi.clearAllMocks();
  });

  it('renders correctly and is hidden by default', () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: false,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    });
    expect(wrapper.find('.v-dialog .v-overlay__content').exists()).toBe(false);
  });

  it('opens when modelValue is true', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
      attachTo: document.body,
    });

    await waitForDialog();

    // Check if dialog content exists in the document
    const headlineText = document.body.textContent;
    expect(headlineText).toContain('共有リンクを生成');

    wrapper.unmount();
  });

  it('generates a link successfully with no expiration', async () => {
    const mockShareId = 'generated_share_id_123';
    vi.mocked(sharedStatisticsStore.createSharedLink).mockResolvedValue(mockShareId);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
      attachTo: document.body,
    });

    await waitForDialog();

    // Find form in the document body (where Vuetify renders dialogs)
    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    // Trigger form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form!.dispatchEvent(submitEvent);
    await flushPromises();

    expect(sharedStatisticsStore.createSharedLink).toHaveBeenCalledWith({
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: undefined,
    });
    expect(wrapper.vm.generatedLink).toContain(mockShareId);

    wrapper.unmount();
  });

  it('generates a link successfully with YYYY-MM-DD expiration', async () => {
    const mockShareId = 'generated_share_id_456';
    vi.mocked(sharedStatisticsStore.createSharedLink).mockResolvedValue(mockShareId);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
      attachTo: document.body,
    });

    await waitForDialog();

    wrapper.vm.expiresAt = '2025-12-31';
    await wrapper.vm.$nextTick();

    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form!.dispatchEvent(submitEvent);
    await flushPromises();

    expect(sharedStatisticsStore.createSharedLink).toHaveBeenCalledWith({
      year: 2023,
      month: 10,
      game_mode: 'RANK',
      expires_at: '2025-12-31T00:00:00.000Z',
    });
    expect(wrapper.vm.generatedLink).toContain(mockShareId);

    wrapper.unmount();
  });

  it('shows error for invalid YYYY-MM-DD format', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
      attachTo: document.body,
    });

    await waitForDialog();

    wrapper.vm.expiresAt = 'invalid-date-format';
    await wrapper.vm.$nextTick();

    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form!.dispatchEvent(submitEvent);
    await flushPromises();

    expect(sharedStatisticsStore.createSharedLink).not.toHaveBeenCalled();
    expect(notificationStore.error).toHaveBeenCalledWith(
      '有効期限の日付形式が不正です。YYYY-MM-DD 形式で入力してください。',
    );

    wrapper.unmount();
  });

  it('shows error for non-existent date (e.g., 2025-02-30)', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
      attachTo: document.body,
    });

    await waitForDialog();

    wrapper.vm.expiresAt = '2025-02-30';
    await wrapper.vm.$nextTick();

    const form = document.querySelector('form');
    expect(form).toBeTruthy();

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form!.dispatchEvent(submitEvent);
    await flushPromises();

    expect(sharedStatisticsStore.createSharedLink).not.toHaveBeenCalled();
    expect(notificationStore.error).toHaveBeenCalledWith(
      '有効期限の日付が不正です。存在しない日付が入力されました。',
    );

    wrapper.unmount();
  });

  it('resets generated link and expiration on dialog close', async () => {
    const wrapper = mount(ShareStatsDialog, {
      global: {
        plugins: [vuetify, pinia],
      },
      props: {
        modelValue: true,
        initialYear: 2023,
        initialMonth: 10,
        initialGameMode: 'RANK',
      },
    });

    await flushPromises();
    await wrapper.vm.$nextTick();

    wrapper.vm.generatedLink = 'http://test.com/share/abc';
    wrapper.vm.expiresAt = '2023-11-01';
    await wrapper.vm.$nextTick();

    await wrapper.setProps({ modelValue: false });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.generatedLink).toBe('');
    expect(wrapper.vm.expiresAt).toBe('');
  });
});
