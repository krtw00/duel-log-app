<template>
  <div class="login-container">
    <!-- 背景装飾 -->
    <div class="background-overlay">
      <div class="grid-pattern"></div>
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>
    </div>

    <!-- ログインカード -->
    <v-card class="login-card" elevation="24">
      <div class="card-glow"></div>

      <v-card-text class="pa-8">
        <!-- ロゴ・タイトル -->
        <div class="text-center mb-8">
          <h1 class="app-title">
            <span class="text-primary">DUEL</span>
            <span class="text-secondary">LOG</span>
          </h1>
          <p class="app-subtitle">Track. Analyze. Dominate.</p>
        </div>

        <!-- ログインフォーム -->
        <v-form ref="formRef" @submit.prevent="handleLogin">
          <v-text-field
            v-model="email"
            label="メールアドレス"
            prepend-inner-icon="mdi-email-outline"
            type="email"
            variant="outlined"
            color="primary"
            :rules="[rules.required, rules.email]"
            class="mb-2"
            :class="{ 'streamer-mode-input': localStreamerMode }"
            :hint="localStreamerMode ? '配信者モードが有効なため、入力内容は非表示になります' : ''"
            persistent-hint
            autocomplete="email"
          />

          <v-text-field
            v-model="password"
            label="パスワード"
            prepend-inner-icon="mdi-lock-outline"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            color="primary"
            :rules="[rules.required]"
            class="mb-4"
            @click:append-inner="showPassword = !showPassword"
          />

          <!-- ログインボタン -->
          <v-btn
            type="submit"
            block
            size="large"
            color="primary"
            :loading="loading"
            class="login-btn mb-4"
          >
            <v-icon start>mdi-login</v-icon>
            ログイン
          </v-btn>

          <!-- 配信者モード切り替え -->
          <div class="mb-4">
            <v-switch v-model="localStreamerMode" color="purple" density="compact" hide-details>
              <template #label>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-2">mdi-video</v-icon>
                  <span class="text-caption">配信者モード</span>
                </div>
              </template>
            </v-switch>
            <p class="text-caption text-grey ml-8 mt-1">
              入力内容を非表示にし、再ログイン時にメールアドレスを保持します
            </p>
          </div>

          <!-- リンク -->
          <div class="text-center">
            <router-link to="/forgot-password" class="text-caption text-grey"
              >パスワードを忘れた場合</router-link
            >
            <v-divider class="my-3" />
            <p class="text-caption text-grey">
              アカウントをお持ちでない方は
              <router-link to="/register" class="text-secondary">新規登録</router-link>
            </p>
            <v-divider class="my-3" />
            <p class="text-caption text-grey">
              ログインすることで
              <a @click="showTermsDialog = true" class="terms-link">利用規約</a>
              に同意したものとみなされます
            </p>
          </div>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- 利用規約モーダル -->
    <v-dialog v-model="showTermsDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-file-document-outline</v-icon>
          <span class="text-h5">利用規約</span>
          <v-spacer />
          <v-btn icon variant="text" @click="showTermsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-6" style="max-height: 60vh">
          <div class="terms-content">
            <h3 class="mb-4">第1条（適用）</h3>
            <p class="mb-6">
              本利用規約（以下「本規約」といいます）は、DUEL
              LOG（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って、本サービスをご利用いただきます。本サービスは個人により運営されています。
            </p>

            <h3 class="mb-4">第2条（利用登録）</h3>
            <p class="mb-6">
              本サービスにおいては、登録希望者が本規約に同意の上、所定の方法によって利用登録を申請し、運営者がこれを承認することによって、利用登録が完了するものとします。運営者は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
            </p>
            <ul class="mb-6">
              <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
              <li>本規約に違反したことがある者からの申請である場合</li>
              <li>その他、運営者が利用登録を適当でないと判断した場合</li>
            </ul>

            <h3 class="mb-4">第3条（アカウント情報の管理）</h3>
            <p class="mb-6">
              ユーザーは、自己の責任において、本サービスのメールアドレスおよびパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、アカウント情報を第三者に譲渡または貸与し、もしくは第三者と共用することはできません。運営者は、メールアドレスとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのアカウントを登録しているユーザー自身による利用とみなします。
            </p>

            <h3 class="mb-4">第4条（個人情報の取扱い）</h3>
            <p class="mb-4">
              運営者は、ユーザーから提供された個人情報について、以下のとおり適切に取り扱います。
            </p>
            <ul class="mb-4">
              <li>
                <strong>収集する情報：</strong
                >メールアドレス、ユーザー名、その他ユーザーが本サービスに登録・入力する情報
              </li>
              <li>
                <strong>利用目的：</strong
                >本サービスの提供、ユーザー認証、サービスに関する通知、問い合わせ対応
              </li>
              <li>
                <strong>保管方法：</strong
                >メールアドレスを含む個人情報は、暗号化された安全なデータベースに保管し、不正アクセスや情報漏洩を防ぐための適切なセキュリティ対策を講じます
              </li>
              <li>
                <strong>第三者提供：</strong
                >法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません
              </li>
              <li>
                <strong>データの削除：</strong
                >ユーザーがアカウントを削除した場合、登録された個人情報は速やかに削除されます
              </li>
            </ul>
            <p class="mb-6">
              運営者は、個人情報の保護に最大限の注意を払いますが、インターネットを通じた情報の送信には一定のリスクが伴うことをご理解ください。
            </p>

            <h3 class="mb-4">第5条（禁止事項）</h3>
            <p class="mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul class="mb-6">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>
                本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為
              </li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>

            <h3 class="mb-4">第6条（本サービスの提供の停止等）</h3>
            <p class="mb-6">
              運営者は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul class="mb-6">
              <li>本サービスにかかるシステムの保守点検または更新を行う場合</li>
              <li>
                地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
              </li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、運営者が本サービスの提供が困難と判断した場合</li>
            </ul>

            <h3 class="mb-4">第7条（データの著作権）</h3>
            <p class="mb-6">
              ユーザーが本サービスに登録・入力したデュエル記録等のデータの著作権は、当該ユーザー自身に帰属します。運営者は、本サービスの運営・改善の目的でのみ、これらのデータを使用することができるものとします。
            </p>

            <h3 class="mb-4">第8条（利用制限およびアカウント削除）</h3>
            <p class="mb-6">
              運営者は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはアカウントを削除することができるものとします。
            </p>
            <ul class="mb-6">
              <li>本規約のいずれかの条項に違反した場合</li>
              <li>登録事項に虚偽の事実があることが判明した場合</li>
              <li>長期間ログインがなく、アカウントが放置されていると判断した場合</li>
              <li>その他、運営者が本サービスの利用を適当でないと判断した場合</li>
            </ul>

            <h3 class="mb-4">第9条（免責事項）</h3>
            <p class="mb-6">
              本サービスは個人により運営されており、運営者は本サービスに関して、その安全性、信頼性、正確性、完全性、有効性などを保証するものではありません。本サービスの利用により生じたいかなる損害についても、運営者は一切の責任を負いません。ユーザーは自己の責任において本サービスを利用するものとします。
            </p>

            <h3 class="mb-4">第10条（サービス内容の変更・終了）</h3>
            <p class="mb-6">
              運営者は、ユーザーへの事前通知の有無を問わず、本サービスの内容を変更し、または本サービスの提供を終了することができるものとします。本サービスが終了する場合、可能な限り事前に通知するよう努めますが、これを保証するものではありません。
            </p>

            <h3 class="mb-4">第11条（利用規約の変更）</h3>
            <p class="mb-6">
              運営者は、必要と判断した場合には、いつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に表示した時点より効力を生じるものとします。
            </p>

            <h3 class="mb-4">第12条（準拠法）</h3>
            <p class="mb-6">本規約の解釈にあたっては、日本法を準拠法とします。</p>

            <p class="text-right mt-8 text-grey">以上</p>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="showTermsDialog = false">
            閉じる
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const formRef = ref();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const localStreamerMode = ref(authStore.localStreamerMode);
const showTermsDialog = ref(false);

// ローカルストレージから最後のメールアドレスを読み込む
onMounted(() => {
  const savedEmail = localStorage.getItem('lastEmail');
  if (savedEmail) {
    email.value = savedEmail;
  }
});

// ローカル配信者モードの変更を監視してストアに反映
watch(localStreamerMode, (newValue) => {
  authStore.toggleStreamerMode(newValue);
});

const rules = {
  required: (v: string) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません',
};

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  try {
    // ログイン前にメールアドレスをローカルストレージに保存
    localStorage.setItem('lastEmail', email.value);

    await authStore.login(email.value, password.value);
    notificationStore.success('ログインに成功しました');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
    notificationStore.error(errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.grid-pattern {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 217, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridScroll 20s linear infinite;
}

@keyframes gridScroll {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: float 8s ease-in-out infinite;
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  background: #00d9ff;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 300px;
  height: 300px;
  background: #b536ff;
  bottom: 15%;
  right: 15%;
  animation-delay: -4s;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 30px);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
  margin: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 16px !important;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
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

.app-title {
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
  background: linear-gradient(135deg, #00d9ff 0%, #b536ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.9rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 8px;
}

.login-btn {
  font-weight: 600;
  letter-spacing: 1px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 217, 255, 0.3);
  }
}

:deep(.v-field--variant-outlined) {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 0 20px rgba(0, 217, 255, 0.1);
  }

  &.v-field--focused {
    box-shadow: 0 0 30px rgba(0, 217, 255, 0.2);
  }
}

// 配信者モード用のスタイル
.streamer-mode-input {
  :deep(input) {
    color: transparent !important;
    text-shadow: 0 0 8px rgba(181, 54, 255, 0.8);
    letter-spacing: 0.3em;

    &::selection {
      background-color: rgba(181, 54, 255, 0.3);
      color: transparent;
    }

    // プレースホルダーは表示
    &::placeholder {
      color: rgba(228, 231, 236, 0.3) !important;
      text-shadow: none;
      letter-spacing: normal;
    }
  }
}

// 利用規約リンクのスタイル
.terms-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid transparent;

  &:hover {
    border-bottom-color: rgb(var(--v-theme-primary));
    opacity: 0.8;
  }
}

// 利用規約モーダルのコンテンツスタイル
.terms-content {
  h3 {
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
  }

  p {
    line-height: 1.8;
    color: rgba(var(--v-theme-on-surface), 0.87);
  }

  ul {
    list-style-type: disc;
    padding-left: 24px;

    li {
      line-height: 1.8;
      color: rgba(var(--v-theme-on-surface), 0.87);
      margin-bottom: 8px;
    }
  }
}
</style>
