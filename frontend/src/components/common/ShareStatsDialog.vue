<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="headline">{{ LL?.shared.dialog.title() }}</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="generateLink">
          <v-select
            v-model="selectedYear"
            :items="years"
            :label="LL?.common.year()"
            variant="outlined"
            density="compact"
            class="mb-4"
            hide-details
          ></v-select>
          <v-select
            v-model="selectedMonth"
            :items="months"
            :label="LL?.common.month()"
            variant="outlined"
            density="compact"
            class="mb-4"
            hide-details
          ></v-select>
          <v-select
            v-model="selectedGameMode"
            :items="gameModes"
            :label="LL?.duels.gameMode.label()"
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
                :label="LL?.shared.dialog.expiresAt()"
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
            {{ LL?.shared.dialog.generateButton() }}
          </v-btn>
        </v-form>

        <v-alert v-if="generatedLink" type="success" class="mt-4" closable variant="tonal">
          <p>{{ LL?.shared.createSuccess() }}</p>
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
        <v-btn color="grey" text @click="dialog = false">{{ LL?.common.close() }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSharedStatisticsStore } from '@/stores/shared_statistics';
import { useNotificationStore } from '@/stores/notification';
import { createLogger } from '@/utils/logger';
import { GameMode } from '@/types';
import { useLocale } from '@/composables/useLocale';

const logger = createLogger('ShareStats');
const { LL } = useLocale();

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

const selectDate = (date: Date | null) => {
  if (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    expiresAt.value = `${year}-${month}-${day}`; // YYYY-MM-DD (local date)
    menu.value = false; // Close the date picker
  }
};

const generateLink = async () => {
  generatedLink.value = ''; // Clear previous link

  let formattedExpiresAt: string | undefined = undefined;
  if (expiresAt.value) {
    // expiresAt is already YYYY-MM-DD from date picker or manual input
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = expiresAt.value.match(dateRegex);

    if (!match) {
      notificationStore.error(LL.value!.shared.dialog.invalidDateFormat());
      return;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // 入力された日付の妥当性を確認しつつ、当日0時(UTC)のISO文字列を生成
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      notificationStore.error(LL.value!.shared.dialog.invalidDate());
      return;
    }

    formattedExpiresAt = `${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`;
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
      notificationStore.success(LL.value!.shared.copySuccess());
    } catch (err) {
      notificationStore.error(LL.value!.shared.dialog.copyFailed());
      logger.error('Failed to copy link');
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

// Expose for testing
defineExpose({
  generatedLink,
  expiresAt,
});
</script>

<style scoped>
/* Add any specific styles for the dialog here */
</style>
