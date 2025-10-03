# パスワードリセット機能の現状と実装ガイド

## 📋 現状の確認

### ✅ 実装済みの機能

1. **データベーステーブル**: `password_reset_tokens`テーブルが存在
2. **バックエンドAPIエンドポイント**:
   - `POST /auth/forgot-password` - トークン生成
   - `POST /auth/reset-password` - パスワード更新
3. **フロントエンド画面**:
   - `/forgot-password` - メールアドレス入力画面
   - `/reset-password/:token` - 新しいパスワード入力画面
4. **トークン管理**: データベースにトークンを保存（1時間有効）

### ❌ 未実装の機能

**メール送信機能**が実装されていません。

現在、`forgot-password`エンドポイントでは：
- トークンをデータベースに保存 ✅
- リセットリンクをログに出力 ✅（開発用）
- メール送信 ❌（TODOコメントのみ）

```python
# TODO: メール送信機能の実装
reset_link = f"http://localhost:5173/reset-password/{token}"
logger.info(f"Password reset link for {user.email}: {reset_link}")
# send_email(user.email, "パスワード再設定のご案内", ...)
```

## 🎯 実装オプション

### オプション1: 簡易実装（開発・テスト用）★推奨（まずはこれ）

リセットリンクをAPIレスポンスで返す方法。

#### メリット
- 実装が簡単（5分で完了）
- メールサーバー不要
- 開発・テストが容易

#### デメリット
- セキュリティリスク（本番環境では使用不可）
- 開発環境のみでの使用を推奨

#### 使用シーン
- ローカル開発環境
- テスト環境
- MVP（最小機能製品）の初期段階

### オプション2: メールサービスの利用（本番推奨）

外部メールサービスを使用してメールを送信。

#### 推奨サービス

| サービス | 無料枠 | 特徴 |
|---------|--------|------|
| **SendGrid** | 100通/日 | 大手、信頼性高い |
| **Resend** | 100通/日、3,000通/月 | 新しい、開発者フレンドリー |
| **Mailgun** | 5,000通/月 | 柔軟なAPI |
| **AWS SES** | 62,000通/月 | AWSユーザー向け |

### オプション3: SMTPサーバーの利用

Gmailなどの既存メールアカウントを使用。

#### メリット
- 追加コスト不要
- 設定が簡単

#### デメリット
- 送信制限が厳しい（Gmail: 500通/日）
- 本番環境では推奨されない
- Googleのセキュリティ設定が必要

## 🚀 実装方法

### 【開発用】オプション1: 簡易実装（5分で完了）

開発環境でリセットリンクをレスポンスに含める方法。

#### ステップ1: バックエンドの修正

`backend/app/api/routers/auth.py`の`forgot_password`関数を修正：

```python
@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    パスワード再設定トークンを生成する
    
    開発環境: リセットリンクをレスポンスに含める
    本番環境: メールを送信（TODO）
    """
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # セキュリティのため、ユーザーが存在しない場合でも成功したかのように振る舞う
        logger.info(f"Password reset requested for non-existent email: {request.email}")
        return {"message": "パスワード再設定の案内をメールで送信しました。"}

    # 既存のトークンを無効化
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    db.commit()

    # 新しいトークンを生成
    token = generate_password_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    reset_token_entry = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token_entry)
    db.commit()
    db.refresh(reset_token_entry)

    # フロントエンドのURLを環境変数から取得
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    # カンマ区切りの場合は最初のURLを使用
    frontend_url = frontend_url.split(",")[0].strip()
    
    reset_link = f"{frontend_url}/reset-password/{token}"
    logger.info(f"Password reset link for {user.email}: {reset_link}")

    # 開発環境ではリンクをレスポンスに含める
    is_development = settings.ENVIRONMENT == "development"
    
    if is_development:
        return {
            "message": "パスワード再設定リンクを生成しました。",
            "reset_link": reset_link,  # 開発環境のみ
            "dev_mode": True
        }
    else:
        # TODO: 本番環境ではメール送信
        # send_email(user.email, "パスワード再設定のご案内", ...)
        return {"message": "パスワード再設定の案内をメールで送信しました。"}
```

必要なインポートを追加：

```python
import os
```

#### ステップ2: フロントエンドの修正

`frontend/src/views/ForgotPasswordView.vue`を修正：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import api from '../services/api'

const router = useRouter()
const notificationStore = useNotificationStore()

const formRef = ref()
const email = ref('')
const loading = ref(false)
const resetLink = ref('')
const showResetLink = ref(false)

const rules = {
  required: (v: string) => !!v || '入力必須です',
  email: (v: string) => /.+@.+\..+/.test(v) || 'メールアドレスの形式が正しくありません'
}

const handleForgotPassword = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    const response = await api.post('/auth/forgot-password', { email: email.value })
    
    // 開発環境の場合、リセットリンクを表示
    if (response.data.dev_mode && response.data.reset_link) {
      resetLink.value = response.data.reset_link
      showResetLink.value = true
      notificationStore.success('パスワード再設定リンクを生成しました。')
    } else {
      notificationStore.success('パスワード再設定の案内をメールで送信しました。')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  } catch (error: any) {
    console.error('Forgot password error:', error)
  } finally {
    loading.value = false
  }
}

const navigateToResetLink = () => {
  window.location.href = resetLink.value
}
</script>

<template>
  <!-- ...既存のテンプレート... -->
  
  <!-- フォームの後に追加 -->
  <v-form @submit.prevent="handleForgotPassword" ref="formRef">
    <!-- ...既存のフィールド... -->
    
    <!-- 送信ボタン -->
    <v-btn
      type="submit"
      block
      size="large"
      color="primary"
      :loading="loading"
      class="forgot-password-btn mb-4"
    >
      <v-icon start>mdi-send</v-icon>
      再設定メールを送信
    </v-btn>
    
    <!-- 開発環境用: リセットリンク表示 -->
    <v-alert
      v-if="showResetLink"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <div class="text-subtitle-2 mb-2">開発モード: パスワードリセットリンク</div>
      <div class="text-caption mb-3 text-break">{{ resetLink }}</div>
      <v-btn
        @click="navigateToResetLink"
        color="primary"
        size="small"
        block
      >
        リセットページを開く
      </v-btn>
    </v-alert>

    <!-- ログインページへのリンク -->
    <div class="text-center">
      <router-link to="/login" class="text-caption text-grey">ログインページに戻る</router-link>
    </div>
  </v-form>
</template>
```

#### ステップ3: 動作確認

1. **開発サーバーを起動**
   ```bash
   # バックエンド
   cd backend
   python start.py
   
   # フロントエンド
   cd frontend
   npm run dev
   ```

2. **パスワード忘れた画面にアクセス**
   - http://localhost:5173/forgot-password

3. **メールアドレスを入力して送信**
   - リセットリンクが画面に表示される
   - リンクをクリックしてリセットページに移動

### 【本番用】オプション2: SendGridを使用（推奨）

#### ステップ1: SendGridアカウントの作成

1. https://sendgrid.com にアクセス
2. 無料アカウントを作成（クレジットカード不要）
3. APIキーを生成

#### ステップ2: 必要なライブラリのインストール

```bash
cd backend
pip install sendgrid
pip freeze > requirements.txt
```

#### ステップ3: 環境変数の追加

`.env`ファイルに追加：

```env
# SendGrid設定
SENDGRID_API_KEY=your-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Duel Log
```

#### ステップ4: メール送信サービスの作成

`backend/app/services/email_service.py`を作成：

```python
"""
メール送信サービス
"""
import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

logger = logging.getLogger(__name__)


class EmailService:
    """メール送信サービス"""
    
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@duellog.com")
        self.from_name = os.getenv("SENDGRID_FROM_NAME", "Duel Log")
        
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not set. Email sending will be disabled.")
    
    def send_password_reset_email(
        self,
        to_email: str,
        username: str,
        reset_link: str
    ) -> bool:
        """
        パスワードリセットメールを送信
        
        Args:
            to_email: 送信先メールアドレス
            username: ユーザー名
            reset_link: パスワードリセットリンク
            
        Returns:
            送信成功: True、失敗: False
        """
        if not self.api_key:
            logger.error("Cannot send email: SENDGRID_API_KEY not set")
            return False
        
        try:
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject="パスワード再設定のご案内",
                html_content=self._get_password_reset_template(username, reset_link)
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            logger.info(f"Password reset email sent to {to_email}. Status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
            return False
    
    def _get_password_reset_template(self, username: str, reset_link: str) -> str:
        """パスワードリセットメールのHTMLテンプレート"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #00d9ff 0%, #b536ff 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }}
        .content {{
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }}
        .button {{
            display: inline-block;
            padding: 15px 30px;
            background: #00d9ff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .footer {{
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DUEL LOG</h1>
            <p>パスワード再設定のご案内</p>
        </div>
        <div class="content">
            <p>こんにちは、{username}さん</p>
            <p>パスワードの再設定リクエストを受け付けました。</p>
            <p>以下のボタンをクリックして、新しいパスワードを設定してください。</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">パスワードを再設定する</a>
            </div>
            <p>または、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">
                {reset_link}
            </p>
            <p><strong>このリンクは1時間で無効になります。</strong></p>
            <p>このリクエストに心当たりがない場合は、このメールを無視してください。</p>
        </div>
        <div class="footer">
            <p>このメールに返信しないでください。</p>
            <p>&copy; 2024 Duel Log. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        """


# グローバルインスタンス
email_service = EmailService()
```

#### ステップ5: auth.pyでメール送信を使用

```python
from app.services.email_service import email_service

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """パスワード再設定メールを送信する"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        logger.info(f"Password reset requested for non-existent email: {request.email}")
        return {"message": "パスワード再設定の案内をメールで送信しました。"}

    # 既存のトークンを無効化
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
    db.commit()

    # 新しいトークンを生成
    token = generate_password_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    reset_token_entry = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token_entry)
    db.commit()
    db.refresh(reset_token_entry)

    # フロントエンドのURLを取得
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    frontend_url = frontend_url.split(",")[0].strip()
    reset_link = f"{frontend_url}/reset-password/{token}"
    
    # メール送信
    email_sent = email_service.send_password_reset_email(
        to_email=user.email,
        username=user.username,
        reset_link=reset_link
    )
    
    if email_sent:
        logger.info(f"Password reset email sent to {user.email}")
    else:
        logger.error(f"Failed to send password reset email to {user.email}")
    
    # セキュリティのため、常に成功メッセージを返す
    return {"message": "パスワード再設定の案内をメールで送信しました。"}
```

#### ステップ6: Renderで環境変数を設定

Renderダッシュボードで追加：

```
SENDGRID_API_KEY = SG.xxx...
SENDGRID_FROM_EMAIL = noreply@yourdomain.com
SENDGRID_FROM_NAME = Duel Log
```

## 📊 まとめ

### 開発環境

**オプション1の簡易実装を推奨**
- すぐに動作確認可能
- メールサーバー不要
- テストが容易

### 本番環境

**オプション2のSendGridを推奨**
- 無料枠で十分
- 信頼性が高い
- プロフェッショナルな見た目

## 🔍 トラブルシューティング

### エラー: SendGrid APIキーが無効

1. SendGridダッシュボードで新しいAPIキーを生成
2. フルアクセス権限を付与
3. Renderの環境変数を更新

### エラー: メールが届かない

1. スパムフォルダを確認
2. SendGridのActivity Feedで配信状況を確認
3. 送信元メールアドレスがドメイン認証されているか確認

### エラー: リセットリンクが無効

1. トークンの有効期限（1時間）を確認
2. データベースの`password_reset_tokens`テーブルを確認
3. ログでトークン生成を確認

## ✨ 次のステップ

1. まず**オプション1（簡易実装）**で動作確認
2. 本番環境へのデプロイ前に**オプション2（SendGrid）**を実装
3. メールテンプレートのカスタマイズ
4. メール送信の監視・ログ記録
