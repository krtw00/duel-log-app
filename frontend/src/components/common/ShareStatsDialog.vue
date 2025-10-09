<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="headline">共有リンクを生成</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="generateLink">
          <v-select
            v-model="selectedYear"
            :items="years"
            label="年"
            variant="outlined"
            density="compact"
            class="mb-4"
            hide-details
          ></v-select>
          <v-select
            v-model="selectedMonth"
            :items="months"
            label="月"
            variant="outlined"
            density="compact"
            class="mb-4"
            hide-details
          ></v-select>
          <v-select
            v-model="selectedGameMode"
            :items="gameModes"
            label="ゲームモード"
            variant="outlined"
            density="compact"
            class="mb-4"
            hide-details
          ></v-select>

          <!-- Date Picker for expiresAt -->
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="expiresAt"
                label="有効期限 (YYYY-MM-DD, オプション)"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="props"
                variant="outlined"
                density="compact"
                class="mb-4"
                hide-details
                clearable
                @click:clear="expiresAt = ''"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="datePickerDate"
              :min="minDate"
              @update:model-value="selectDate"
            ></v-date-picker>
          </v-menu>

          <v-btn color="primary" type="submit" :loading="sharedStatisticsStore.loading" block>
            リンクを生成
          </v-btn>
        </v-form>

        <v-alert v-if="generatedLink" type="success" class="mt-4" closable variant="tonal">
          <p>共有リンクが生成されました！</p>
          <v-text-field
            v-model="generatedLink"
            readonly
            density="compact"
            append-icon="mdi-content-copy"
            class="mt-2"
            hide-details
            @click:append="copyLink"
          ></v-text-field>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="dialog = false">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSharedStatisticsStore } from '../../stores/shared_statistics';
import { useNotificationStore } from '../../stores/notification';
import { GameMode } from '../../types';

const props = defineProps<{
  modelValue: boolean;
  initialYear: number;
  initialMonth: number;
  initialGameMode: GameMode;
}>();

const emit = defineEmits(['update:modelValue']);

const sharedStatisticsStore = useSharedStatisticsStore();
const notificationStore = useNotificationStore();

const dialog = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const selectedYear = ref(props.initialYear);
const selectedMonth = ref(props.initialMonth);
const selectedGameMode = ref<GameMode>(props.initialGameMode);
const expiresAt = ref(''); // YYYY-MM-DD string
const generatedLink = ref('');

const menu = ref(false); // For v-menu
const datePickerDate = ref<Date | null>(null); // Date object for v-date-picker

// Set minDate to today to prevent selecting past dates
const minDate = computed(() => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
});

watch(
  () => props.initialYear,
  (newVal) => {
    selectedYear.value = newVal;
  },
);
watch(
  () => props.initialMonth,
  (newVal) => {
    selectedMonth.value = newVal;
  },
);
watch(
  () => props.initialGameMode,
  (newVal) => {
    selectedGameMode.value = newVal;
  },
);

const years = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i); // 過去5年
});
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const gameModes: GameMode[] = ['RANK', 'RATE', 'EVENT', 'DC'];

const selectDate = (date: Date) => {
  expiresAt.value = date.toISOString().substring(0, 10); // YYYY-MM-DD
  menu.value = false; // Close the date picker
};

const generateLink = async () => {
  generatedLink.value = ''; // Clear previous link

  let formattedExpiresAt: string | undefined = undefined;
  if (expiresAt.value) {
    // expiresAt is already YYYY-MM-DD from date picker or manual input
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = expiresAt.value.match(dateRegex);

    if (!match) {
      notificationStore.error('有効期限の日付形式が不正です。YYYY-MM-DD 形式で入力してください。');
      return;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Basic date validity check
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)); // Midnight UTC
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      notificationStore.error('有効期限の日付が不正です。存在しない日付が入力されました。');
      return;
    }

    formattedExpiresAt = date.toISOString();
  }

  const shareId = await sharedStatisticsStore.createSharedLink({
    year: selectedYear.value,
    month: selectedMonth.value,
    game_mode: selectedGameMode.value,
    expires_at: formattedExpiresAt,
  });

  if (shareId) {
    // Assuming the frontend is served from the root, and the shared stats view is at /shared-stats/:share_id
    generatedLink.value = `${window.location.origin}/shared-stats/${shareId}`;
  }
};

const copyLink = async () => {
  if (generatedLink.value) {
    try {
      await navigator.clipboard.writeText(generatedLink.value);
      notificationStore.success('共有リンクをクリップボードにコピーしました！');
    } catch (err) {
      notificationStore.error('リンクのコピーに失敗しました。手動でコピーしてください。');
      console.error('Failed to copy link: ', err);
    }
  }
};

// ダイアログが閉じられたときに状態をリセット
watch(dialog, (newVal) => {
  if (!newVal) {
    generatedLink.value = '';
    expiresAt.value = '';
    datePickerDate.value = null; // Reset date picker
  }
});
</script>

<style scoped>
/* Add any specific styles for the dialog here */
</style>
