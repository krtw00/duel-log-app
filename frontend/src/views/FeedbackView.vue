<template>
  <app-layout current-view="feedback">
    <v-container class="d-flex justify-center py-6">
      <div style="width: 100%; max-width: 700px">
        <!-- ヘッダー -->
        <h1 class="text-h5 mb-4">{{ LL?.nav.feedback() }}</h1>

        <!-- イントロ -->
        <v-card class="mb-6">
          <v-card-text>
            <p class="text-body-1">
              {{ LL?.feedback.intro() }}
            </p>
          </v-card-text>
        </v-card>

        <!-- タブ -->
        <v-card>
          <v-tabs v-model="activeTab" color="primary" grow>
            <v-tab value="bug">
              <v-icon start>mdi-bug</v-icon>
              {{ LL?.feedback.tabs.bug() }}
            </v-tab>
            <v-tab value="enhancement">
              <v-icon start>mdi-lightbulb</v-icon>
              {{ LL?.feedback.tabs.enhancement() }}
            </v-tab>
            <v-tab value="contact">
              <v-icon start>mdi-email</v-icon>
              {{ LL?.feedback.tabs.contact() }}
            </v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text class="pa-6">
            <v-window v-model="activeTab">
              <!-- バグ報告 -->
              <v-window-item value="bug">
                <v-form ref="bugFormRef" @submit.prevent="submitBugReport">
                  <v-text-field
                    v-model="bugForm.title"
                    :label="LL?.feedback.form.title()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.bug.titlePlaceholder()"
                    class="mb-4"
                  />
                  <v-textarea
                    v-model="bugForm.description"
                    :label="LL?.feedback.form.description()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.bug.descriptionPlaceholder()"
                    rows="4"
                    class="mb-4"
                  />
                  <v-textarea
                    v-model="bugForm.steps"
                    :label="LL?.feedback.bug.steps()"
                    variant="outlined"
                    :placeholder="LL?.feedback.bug.stepsPlaceholder()"
                    rows="3"
                    class="mb-4"
                  />
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-textarea
                        v-model="bugForm.expected"
                        :label="LL?.feedback.bug.expected()"
                        variant="outlined"
                        :placeholder="LL?.feedback.bug.expectedPlaceholder()"
                        rows="2"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-textarea
                        v-model="bugForm.actual"
                        :label="LL?.feedback.bug.actual()"
                        variant="outlined"
                        :placeholder="LL?.feedback.bug.actualPlaceholder()"
                        rows="2"
                      />
                    </v-col>
                  </v-row>
                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!githubEnabled"
                    >
                      {{ LL?.feedback.bug.submit() }}
                    </v-btn>
                  </div>
                </v-form>
              </v-window-item>

              <!-- 機能要望 -->
              <v-window-item value="enhancement">
                <v-form ref="enhancementFormRef" @submit.prevent="submitEnhancement">
                  <v-text-field
                    v-model="enhancementForm.title"
                    :label="LL?.feedback.form.title()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.enhancement.titlePlaceholder()"
                    class="mb-4"
                  />
                  <v-textarea
                    v-model="enhancementForm.description"
                    :label="LL?.feedback.form.description()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.enhancement.descriptionPlaceholder()"
                    rows="4"
                    class="mb-4"
                  />
                  <v-textarea
                    v-model="enhancementForm.useCase"
                    :label="LL?.feedback.enhancement.useCase()"
                    variant="outlined"
                    :placeholder="LL?.feedback.enhancement.useCasePlaceholder()"
                    rows="3"
                    class="mb-4"
                  />
                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!githubEnabled"
                    >
                      {{ LL?.feedback.enhancement.submit() }}
                    </v-btn>
                  </div>
                </v-form>
              </v-window-item>

              <!-- お問い合わせ -->
              <v-window-item value="contact">
                <v-form ref="contactFormRef" @submit.prevent="submitContact">
                  <v-text-field
                    v-model="contactForm.subject"
                    :label="LL?.feedback.contact.subject()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.contact.subjectPlaceholder()"
                    class="mb-4"
                  />
                  <v-textarea
                    v-model="contactForm.message"
                    :label="LL?.feedback.contact.message()"
                    variant="outlined"
                    :rules="[rules.required]"
                    :placeholder="LL?.feedback.contact.messagePlaceholder()"
                    rows="6"
                    class="mb-4"
                  />
                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!githubEnabled"
                    >
                      {{ LL?.feedback.contact.submit() }}
                    </v-btn>
                  </div>
                </v-form>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>

        <!-- 連絡先 -->
        <v-card class="mt-6">
          <v-card-title>
            <v-icon start>mdi-account-box</v-icon>
            {{ LL?.feedback.contactInfo.title() }}
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item :href="xUrl" target="_blank" prepend-icon="mdi-twitter">
                <v-list-item-title>X (Twitter)</v-list-item-title>
                <v-list-item-subtitle>{{ xHandle }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item :href="githubUrl" target="_blank" prepend-icon="mdi-github">
                <v-list-item-title>GitHub</v-list-item-title>
                <v-list-item-subtitle>{{ githubUrl }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- GitHub無効時の警告 -->
        <v-alert v-if="!githubEnabled" type="warning" variant="tonal" class="mt-4">
          {{ LL?.feedback.githubDisabled() }}
        </v-alert>

        <!-- 成功ダイアログ -->
        <v-dialog v-model="successDialog" max-width="400">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              {{ LL?.feedback.success.title() }}
            </v-card-title>
            <v-card-text>
              <p>{{ successMessage }}</p>
              <p v-if="issueUrl" class="mt-2">
                <a :href="issueUrl" target="_blank">{{ LL?.feedback.success.viewIssue() }}</a>
              </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn color="primary" @click="successDialog = false">
                {{ LL?.common.close() }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-container>
  </app-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/api';
import { useLocale } from '@/composables/useLocale';
import { useNotificationStore } from '@/stores/notification';
import AppLayout from '@/components/layout/AppLayout.vue';

const { LL } = useLocale();
const notificationStore = useNotificationStore();

const activeTab = ref('bug');
const loading = ref(false);
const githubEnabled = ref(false);
const xHandle = ref('@XrIGT');
const xUrl = ref('https://x.com/XrIGT');
const githubUrl = ref('https://github.com/krtw00/duel-log-app');

const successDialog = ref(false);
const successMessage = ref('');
const issueUrl = ref<string | null>(null);

// フォームデータ
const bugForm = ref({
  title: '',
  description: '',
  steps: '',
  expected: '',
  actual: '',
});

const enhancementForm = ref({
  title: '',
  description: '',
  useCase: '',
});

const contactForm = ref({
  subject: '',
  message: '',
});

// フォーム参照
const bugFormRef = ref();
const enhancementFormRef = ref();
const contactFormRef = ref();

// バリデーションルール
const rules = {
  required: (v: string) => !!v || LL.value?.validation.required() || '必須項目です',
};

// フィードバック状態を取得
const fetchFeedbackStatus = async () => {
  try {
    const response = await api.get('/feedback/status');
    githubEnabled.value = response.data.github_enabled;
    xHandle.value = response.data.x_handle;
    xUrl.value = response.data.x_url;
    githubUrl.value = response.data.github_repo_url;
  } catch {
    // デフォルト値を使用
  }
};

// バグ報告送信
const submitBugReport = async () => {
  const { valid } = await bugFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await api.post('/feedback/bug', {
      title: bugForm.value.title,
      description: bugForm.value.description,
      steps: bugForm.value.steps || null,
      expected: bugForm.value.expected || null,
      actual: bugForm.value.actual || null,
    });

    successMessage.value = response.data.message;
    issueUrl.value = response.data.issue_url;
    successDialog.value = true;

    // フォームをリセット
    bugForm.value = { title: '', description: '', steps: '', expected: '', actual: '' };
    bugFormRef.value.resetValidation();
  } catch {
    notificationStore.error(LL.value?.feedback.error() || 'エラーが発生しました');
  } finally {
    loading.value = false;
  }
};

// 機能要望送信
const submitEnhancement = async () => {
  const { valid } = await enhancementFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await api.post('/feedback/enhancement', {
      title: enhancementForm.value.title,
      description: enhancementForm.value.description,
      use_case: enhancementForm.value.useCase || null,
    });

    successMessage.value = response.data.message;
    issueUrl.value = response.data.issue_url;
    successDialog.value = true;

    // フォームをリセット
    enhancementForm.value = { title: '', description: '', useCase: '' };
    enhancementFormRef.value.resetValidation();
  } catch {
    notificationStore.error(LL.value?.feedback.error() || 'エラーが発生しました');
  } finally {
    loading.value = false;
  }
};

// お問い合わせ送信
const submitContact = async () => {
  const { valid } = await contactFormRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const response = await api.post('/feedback/contact', {
      subject: contactForm.value.subject,
      message: contactForm.value.message,
    });

    successMessage.value = response.data.message;
    issueUrl.value = response.data.issue_url;
    successDialog.value = true;

    // フォームをリセット
    contactForm.value = { subject: '', message: '' };
    contactFormRef.value.resetValidation();
  } catch {
    notificationStore.error(LL.value?.feedback.error() || 'エラーが発生しました');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchFeedbackStatus();
});
</script>

<style scoped>
.v-list-item-subtitle {
  opacity: 0.7;
}
</style>
