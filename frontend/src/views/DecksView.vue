<template>
  <app-layout current-view="decks">
    <v-container fluid class="pa-6">
      <!-- アーカイブボタン -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-alert type="info" variant="tonal" prominent border="start" class="archive-alert">
            <template #prepend>
              <v-icon size="large">mdi-archive</v-icon>
            </template>
            <div class="d-flex align-center justify-space-between flex-wrap ga-4">
              <div>
                <div class="text-h6 mb-1">月次リセット機能</div>
                <div class="text-body-2">
                  新弾リリース時など、全デッキを一括アーカイブできます。アーカイブしても過去の対戦記録は保持されます。
                </div>
              </div>
              <v-btn
                color="warning"
                prepend-icon="mdi-archive"
                variant="elevated"
                size="large"
                @click="confirmArchiveAll"
              >
                全デッキをアーカイブ
              </v-btn>
            </div>
          </v-alert>
        </v-col>
      </v-row>

      <v-row>
        <!-- 自分のデッキ -->
        <v-col cols="12" md="6">
          <v-card class="deck-card">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon class="mr-2" color="primary">mdi-cards</v-icon>
              <span class="text-h6">自分のデッキ</span>
              <v-spacer />
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                class="add-btn"
                @click="openDeckDialog(false)"
              >
                追加
              </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
              <v-list v-if="myDecks.length > 0" class="deck-list">
                <v-list-item v-for="deck in myDecks" :key="deck.id" class="deck-list-item">
                  <template #prepend>
                    <v-avatar color="primary" size="40">
                      <v-icon>mdi-cards-playing</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold">
                    {{ deck.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    登録日: {{ formatDate(deck.createdat) }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn icon="mdi-pencil" size="small" variant="text" @click="editDeck(deck)" />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteDeck(deck.id)"
                    />
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center pa-8">
                <v-icon size="64" color="grey">mdi-cards-outline</v-icon>
                <p class="text-body-1 text-grey mt-4">デッキが登録されていません</p>
                <p class="text-caption text-grey">「追加」ボタンからデッキを登録しましょう</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 相手のデッキ -->
        <v-col cols="12" md="6">
          <v-card class="deck-card">
            <v-card-title class="d-flex align-center pa-4">
              <v-icon class="mr-2" color="secondary">mdi-account</v-icon>
              <span class="text-h6">相手のデッキ</span>
              <v-spacer />
              <v-btn
                color="secondary"
                prepend-icon="mdi-plus"
                class="add-btn"
                @click="openDeckDialog(true)"
              >
                追加
              </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-4">
              <v-list v-if="opponentDecks.length > 0" class="deck-list">
                <v-list-item v-for="deck in opponentDecks" :key="deck.id" class="deck-list-item">
                  <template #prepend>
                    <v-avatar color="secondary" size="40">
                      <v-icon>mdi-account-circle</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold">
                    {{ deck.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-caption">
                    登録日: {{ formatDate(deck.createdat) }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn icon="mdi-pencil" size="small" variant="text" @click="editDeck(deck)" />
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="deleteDeck(deck.id)"
                    />
                  </template>
                </v-list-item>
              </v-list>

              <div v-else class="text-center pa-8">
                <v-icon size="64" color="grey">mdi-account-outline</v-icon>
                <p class="text-body-1 text-grey mt-4">相手のデッキが登録されていません</p>
                <p class="text-caption text-grey">「追加」ボタンから相手のデッキを登録しましょう</p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- デッキ登録/編集ダイアログ -->
    <v-dialog v-model="dialogOpen" max-width="500" persistent>
      <v-card class="deck-form-card">
        <div class="card-glow"></div>

        <v-card-title class="pa-6">
          <v-icon class="mr-2" :color="isOpponentDeck ? 'secondary' : 'primary'">
            {{ isOpponentDeck ? 'mdi-account' : 'mdi-cards' }}
          </v-icon>
          <span class="text-h5">
            {{
              isEdit ? 'デッキを編集' : isOpponentDeck ? '相手のデッキを追加' : '自分のデッキを追加'
            }}
          </span>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="formRef" @submit.prevent="handleSubmit">
            <v-text-field
              v-model="deckName"
              label="デッキ名"
              prepend-inner-icon="mdi-text"
              variant="outlined"
              :color="isOpponentDeck ? 'secondary' : 'primary'"
              :rules="[rules.required, rules.duplicate]"
              placeholder="例: 烙印、エルド、白き森"
              @input="validateDuplicate"
            />
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="closeDialog"> キャンセル </v-btn>
          <v-btn
            :color="isOpponentDeck ? 'secondary' : 'primary'"
            :loading="loading"
            @click="handleSubmit"
          >
            <v-icon start>mdi-content-save</v-icon>
            {{ isEdit ? '更新' : '登録' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </app-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/api';
import { createLogger } from '@/utils/logger';
import { Deck } from '@/types';
import AppLayout from '@/components/layout/AppLayout.vue';
import { useNotificationStore } from '@/stores/notification';

const logger = createLogger('Decks');
const notificationStore = useNotificationStore();

const myDecks = ref<Deck[]>([]);
const opponentDecks = ref<Deck[]>([]);
const dialogOpen = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const isOpponentDeck = ref(false);
const deckName = ref('');
const selectedDeckId = ref<number | null>(null);
const formRef = ref();

// 現在のデッキタイプのデッキリストを取得
const currentDecks = computed(() => {
  return isOpponentDeck.value ? opponentDecks.value : myDecks.value;
});

// 重複チェック関数
const isDuplicateName = (name: string): boolean => {
  if (!name.trim()) return false;

  const trimmedName = name.trim();
  return currentDecks.value.some((deck) => {
    // 編集中の場合は、自分自身を除外
    if (isEdit.value && deck.id === selectedDeckId.value) {
      return false;
    }
    return deck.name === trimmedName;
  });
};

const rules = {
  required: (v: string) => !!v || '入力必須です',
  duplicate: (v: string) => {
    if (!v) return true; // 空の場合はrequiredルールでチェック
    if (isDuplicateName(v)) {
      const deckType = isOpponentDeck.value ? '相手のデッキ' : '自分のデッキ';
      return `同じ名前の${deckType}が既に存在します`;
    }
    return true;
  },
};

// 入力時に重複チェックをトリガー
const validateDuplicate = () => {
  if (formRef.value) {
    formRef.value.validate();
  }
};

const fetchDecks = async () => {
  try {
    const response = await api.get('/decks/');
    const allDecks = response.data;
    myDecks.value = allDecks.filter((d: Deck) => !d.is_opponent);
    opponentDecks.value = allDecks.filter((d: Deck) => d.is_opponent);
  } catch (error) {
    logger.error('Failed to fetch decks');
  }
};

const openDeckDialog = (opponent: boolean) => {
  isEdit.value = false;
  isOpponentDeck.value = opponent;
  deckName.value = '';
  selectedDeckId.value = null;
  dialogOpen.value = true;
};

const editDeck = (deck: Deck) => {
  isEdit.value = true;
  isOpponentDeck.value = deck.is_opponent;
  deckName.value = deck.name;
  selectedDeckId.value = deck.id;
  dialogOpen.value = true;
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 念のため送信前にも重複チェック
  if (isDuplicateName(deckName.value)) {
    const deckType = isOpponentDeck.value ? '相手のデッキ' : '自分のデッキ';
    notificationStore.error(`同じ名前の${deckType}が既に存在します`);
    return;
  }

  loading.value = true;

  try {
    if (isEdit.value && selectedDeckId.value) {
      await api.put(`/decks/${selectedDeckId.value}`, {
        name: deckName.value,
        is_opponent: isOpponentDeck.value,
      });
    } else {
      await api.post('/decks/', {
        name: deckName.value,
        is_opponent: isOpponentDeck.value,
      });
    }

    await fetchDecks();
    closeDialog();
    notificationStore.success(isEdit.value ? 'デッキを更新しました' : 'デッキを登録しました');
  } catch (error) {
    logger.error('Failed to save deck');
  } finally {
    loading.value = false;
  }
};

const deleteDeck = async (deckId: number) => {
  if (!confirm('このデッキを削除しますか？')) return;

  try {
    await api.delete(`/decks/${deckId}`);
    await fetchDecks();
    notificationStore.success('デッキを削除しました');
  } catch (error) {
    logger.error('Failed to delete deck');
  }
};

const closeDialog = () => {
  dialogOpen.value = false;
  deckName.value = '';
  selectedDeckId.value = null;
  formRef.value?.resetValidation();
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const confirmArchiveAll = async () => {
  const totalDecks = myDecks.value.length + opponentDecks.value.length;
  if (totalDecks === 0) {
    notificationStore.info('アーカイブするデッキがありません');
    return;
  }

  if (
    !confirm(
      `${totalDecks}件のデッキをアーカイブしますか？\n\nアーカイブしても過去の対戦記録は保持されます。`,
    )
  ) {
    return;
  }

  try {
    const response = await api.post('/decks/archive-all');
    notificationStore.success(response.data.message);
    await fetchDecks();
  } catch (error) {
    logger.error('Failed to archive decks');
    notificationStore.error('アーカイブに失敗しました');
  }
};

onMounted(() => {
  fetchDecks();
});
</script>

<style scoped lang="scss">
.deck-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
  height: 100%;
}

.deck-list {
  background: transparent !important;
}

.deck-list-item {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
    transform: translateX(4px);
  }
}

.add-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.deck-form-card {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

.archive-alert {
  border-left: 4px solid rgb(var(--v-theme-warning)) !important;
  background: rgba(255, 193, 7, 0.05) !important;

  :deep(.v-alert__prepend) {
    color: rgb(var(--v-theme-warning));
  }
}
</style>
