<template>
  <v-app>
    <!-- ナビゲーションバー -->
    <v-app-bar elevation="0" class="app-bar">
      <div class="app-bar-glow"></div>
      
      <v-app-bar-title class="ml-4">
        <span class="text-primary font-weight-black">DUEL</span>
        <span class="text-secondary font-weight-black">LOG</span>
      </v-app-bar-title>

      <v-spacer />

      <v-btn
        prepend-icon="mdi-view-dashboard"
        variant="text"
        @click="router.push('/')"
      >
        ダッシュボード
      </v-btn>

      <v-chip
        class="mr-4"
        prepend-icon="mdi-account-circle"
        color="primary"
        variant="tonal"
      >
        {{ authStore.user?.username || 'User' }}
      </v-chip>

      <v-btn
        icon="mdi-logout"
        @click="authStore.logout"
        variant="text"
      />
    </v-app-bar>

    <!-- メインコンテンツ -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
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
                  size="small"
                  @click="openDeckDialog(false)"
                  class="add-btn"
                >
                  追加
                </v-btn>
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-4">
                <v-list v-if="myDecks.length > 0" class="deck-list">
                  <v-list-item
                    v-for="deck in myDecks"
                    :key="deck.id"
                    class="deck-list-item"
                  >
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
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click="editDeck(deck)"
                      />
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
                  size="small"
                  @click="openDeckDialog(true)"
                  class="add-btn"
                >
                  追加
                </v-btn>
              </v-card-title>

              <v-divider />

              <v-card-text class="pa-4">
                <v-list v-if="opponentDecks.length > 0" class="deck-list">
                  <v-list-item
                    v-for="deck in opponentDecks"
                    :key="deck.id"
                    class="deck-list-item"
                  >
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
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        @click="editDeck(deck)"
                      />
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
    </v-main>

    <!-- デッキ登録/編集ダイアログ -->
    <v-dialog
      v-model="dialogOpen"
      max-width="500"
      persistent
    >
      <v-card class="deck-form-card">
        <div class="card-glow"></div>
        
        <v-card-title class="pa-6">
          <v-icon class="mr-2" :color="isOpponentDeck ? 'secondary' : 'primary'">
            {{ isOpponentDeck ? 'mdi-account' : 'mdi-cards' }}
          </v-icon>
          <span class="text-h5">
            {{ isEdit ? 'デッキを編集' : (isOpponentDeck ? '相手のデッキを追加' : '自分のデッキを追加') }}
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
              :rules="[rules.required]"
              placeholder="例: 烙印、エルド、白き森"
            />
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            キャンセル
          </v-btn>
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
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { api } from '../services/api'
import { Deck } from '../types'

const router = useRouter()
const authStore = useAuthStore()

const myDecks = ref<Deck[]>([])
const opponentDecks = ref<Deck[]>([])
const dialogOpen = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const isOpponentDeck = ref(false)
const deckName = ref('')
const selectedDeckId = ref<number | null>(null)
const formRef = ref()

const rules = {
  required: (v: string) => !!v || '入力必須です'
}

const fetchDecks = async () => {
  try {
    const response = await api.get('/decks/')
    const allDecks = response.data
    myDecks.value = allDecks.filter((d: Deck) => !d.is_opponent)
    opponentDecks.value = allDecks.filter((d: Deck) => d.is_opponent)
  } catch (error) {
    console.error('Failed to fetch decks:', error)
  }
}

const openDeckDialog = (opponent: boolean) => {
  isEdit.value = false
  isOpponentDeck.value = opponent
  deckName.value = ''
  selectedDeckId.value = null
  dialogOpen.value = true
}

const editDeck = (deck: Deck) => {
  isEdit.value = true
  isOpponentDeck.value = deck.is_opponent
  deckName.value = deck.name
  selectedDeckId.value = deck.id
  dialogOpen.value = true
}

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    if (isEdit.value && selectedDeckId.value) {
      await api.put(`/decks/${selectedDeckId.value}`, {
        name: deckName.value,
        is_opponent: isOpponentDeck.value
      })
    } else {
      await api.post('/decks/', {
        name: deckName.value,
        is_opponent: isOpponentDeck.value
      })
    }

    await fetchDecks()
    closeDialog()
  } catch (error) {
    console.error('Failed to save deck:', error)
  } finally {
    loading.value = false
  }
}

const deleteDeck = async (deckId: number) => {
  if (!confirm('このデッキを削除しますか？')) return

  try {
    await api.delete(`/decks/${deckId}`)
    await fetchDecks()
  } catch (error) {
    console.error('Failed to delete deck:', error)
  }
}

const closeDialog = () => {
  dialogOpen.value = false
  deckName.value = ''
  selectedDeckId.value = null
  formRef.value?.resetValidation()
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  fetchDecks()
})
</script>

<style scoped lang="scss">
.app-bar {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 217, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.app-bar-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d9ff, #b536ff, #ff2d95);
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.main-content {
  background: #0a0e27;
  min-height: 100vh;
}

.deck-card {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
  height: 100%;
}

.deck-list {
  background: transparent !important;
}

.deck-list-item {
  background: rgba(26, 31, 58, 0.5);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(0, 217, 255, 0.05);
    transform: translateX(4px);
  }
}

.add-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
  }
}

.deck-form-card {
  background: rgba(18, 22, 46, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 217, 255, 0.2);
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
</style>
