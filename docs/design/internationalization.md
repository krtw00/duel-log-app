# 多言語対応（i18n）設計書

## 1. 概要

### 1.1 目的
Duel Log Appを国際化し、日本語・英語・韓国語の3言語でUIを提供する。

### 1.2 対象範囲
- **対象**: フロントエンドUI（ボタン、ラベル、メニュー、メッセージ等）
- **対象外**: バックエンドAPIメッセージ、ユーザー生成コンテンツ（デッキ名等）

### 1.3 対応言語と優先順位
| 優先度 | 言語 | ロケールコード | 状態 |
|--------|------|----------------|------|
| - | 日本語 | `ja` | 既存（現在のデフォルト） |
| 1 | 英語 | `en` | Phase 1で実装 |
| 2 | 韓国語 | `ko` | Phase 2で実装 |

---

## 2. 技術選定

### 2.1 採用ライブラリ
**vue-i18n v9.x**（Vue 3対応版）

選定理由:
- Vue 3公式推奨のi18nライブラリ
- Composition API完全対応
- TypeScriptサポート
- 豊富な機能（複数形、日付/数値フォーマット、ネストしたメッセージ等）

### 2.2 インストール
```bash
cd frontend
npm install vue-i18n@9
```

---

## 3. ディレクトリ構造

現在のフロントエンド構造に合わせた配置:

```
frontend/
├── src/
│   ├── i18n/                     # 新規作成
│   │   ├── index.ts              # vue-i18n設定・初期化
│   │   ├── locales/
│   │   │   ├── ja.json           # 日本語（デフォルト）
│   │   │   ├── en.json           # 英語
│   │   │   └── ko.json           # 韓国語
│   │   └── types.ts              # 型定義（オプション）
│   ├── composables/
│   │   ├── useLocale.ts          # 言語切り替えロジック（新規）
│   │   ├── useChartOptions.ts    # 既存
│   │   ├── useDashboardFilters.ts
│   │   └── ...
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppBar.vue        # 言語切り替えUIを追加
│   │   │   └── AppLayout.vue
│   │   ├── common/
│   │   ├── duel/
│   │   ├── statistics/
│   │   └── ...
│   └── views/
│       ├── LoginView.vue
│       ├── RegisterView.vue
│       ├── DashboardView.vue
│       ├── DecksView.vue
│       ├── StatisticsView.vue
│       ├── ProfileView.vue
│       ├── OBSOverlayView.vue
│       └── ...
```

---

## 4. 翻訳ファイル設計

### 4.1 ファイル形式
JSON形式を採用。ネストしたキー構造で機能ごとにグループ化。

### 4.2 キー命名規則
```
{ページ/機能}.{コンポーネント}.{要素}
```

### 4.3 翻訳ファイル例

**ja.json（日本語 - ベース）**
```json
{
  "common": {
    "loading": "読み込み中...",
    "save": "保存",
    "cancel": "キャンセル",
    "delete": "削除",
    "edit": "編集",
    "add": "追加",
    "confirm": "確認",
    "reset": "リセット",
    "update": "更新",
    "error": "エラーが発生しました",
    "success": "成功しました",
    "dataFetchError": "データの取得に失敗しました",
    "year": "年",
    "month": "月"
  },
  "nav": {
    "dashboard": "ダッシュボード",
    "decks": "デッキ管理",
    "statistics": "統計",
    "profile": "プロフィール",
    "admin": "管理者画面",
    "logout": "ログアウト"
  },
  "auth": {
    "login": {
      "title": "ログイン",
      "email": "メールアドレス",
      "password": "パスワード",
      "submit": "ログイン",
      "forgotPassword": "パスワードを忘れた場合",
      "noAccount": "アカウントをお持ちでない方は",
      "register": "新規登録",
      "termsAgreement": "ログインすることで",
      "termsLink": "利用規約",
      "termsAgreementEnd": "に同意したものとみなされます"
    },
    "register": {
      "title": "新規登録",
      "subtitle": "Create Your Account",
      "username": "ユーザー名",
      "email": "メールアドレス",
      "password": "パスワード",
      "confirmPassword": "パスワード（確認）",
      "submit": "登録",
      "hasAccount": "すでにアカウントをお持ちの方は"
    },
    "forgotPassword": {
      "title": "パスワードリセット"
    },
    "streamerMode": {
      "label": "配信者モード",
      "hint": "入力内容を非表示にし、再ログイン時にメールアドレスを保持します"
    }
  },
  "dashboard": {
    "title": "ダッシュボード"
  },
  "decks": {
    "title": "デッキ管理",
    "myDecks": "自分のデッキ",
    "opponentDecks": "相手のデッキ",
    "addDeck": "追加",
    "deckName": "デッキ名",
    "noDeck": "デッキが登録されていません",
    "noDeckHint": "「追加」ボタンからデッキを登録しましょう",
    "registeredDate": "登録日",
    "archive": {
      "title": "月次リセット機能",
      "description": "新弾リリース時など、全デッキを一括アーカイブできます。アーカイブしても過去の対戦記録は保持されます。",
      "button": "全デッキをアーカイブ"
    }
  },
  "duels": {
    "title": "対戦記録",
    "addDuel": "対戦を記録",
    "result": {
      "win": "勝利",
      "lose": "敗北",
      "draw": "引き分け"
    },
    "turnOrder": {
      "label": "先攻/後攻",
      "first": "先攻",
      "second": "後攻"
    },
    "coinToss": {
      "win": "勝ち",
      "lose": "負け"
    }
  },
  "statistics": {
    "title": "統計情報",
    "filter": {
      "title": "統計フィルター",
      "period": "期間",
      "periodAll": "全期間",
      "periodRange": "範囲指定",
      "rangeStart": "開始（試合目）",
      "rangeEnd": "終了（試合目）",
      "myDeck": "自分のデッキ"
    },
    "gameMode": {
      "rank": "ランク",
      "rate": "レート",
      "event": "イベント",
      "dc": "DC"
    },
    "matchup": "相性表",
    "distribution": "デッキ分布"
  },
  "profile": {
    "title": "プロフィール編集",
    "username": "ユーザー名",
    "email": "メールアドレス",
    "newPassword": "新しいパスワード (変更する場合のみ)",
    "newPasswordHint": "8文字以上、72文字以下",
    "confirmPassword": "新しいパスワードの確認",
    "streamerMode": {
      "title": "配信者モード",
      "description": "有効にすると、アプリ内のメールアドレスが自動的にマスクされます。配信や録画時のプライバシー保護に便利です。",
      "enable": "配信者モードを有効にする",
      "emailMaskedHint": "配信者モードが有効なため、メールアドレスはマスクされています"
    },
    "experimental": {
      "title": "実験的機能",
      "badge": "テスト",
      "screenAnalysis": {
        "description": "画面解析機能を有効にすると、対戦記録作成時に画面キャプチャによる自動入力機能が使用できます。この機能は開発中のため、誤判定が発生する可能性があります。",
        "enable": "画面解析機能を有効にする"
      }
    },
    "accountDeletion": {
      "title": "アカウント削除",
      "warning": "この操作は元に戻せません。アカウントを削除すると、すべてのデッキと対戦履歴が完全に削除されます。",
      "button": "アカウントを削除する"
    },
    "dataManagement": {
      "title": "データ管理",
      "description": "全データをCSVファイルとしてエクスポート（バックアップ）したり、インポート（復元）したりできます。",
      "export": "エクスポート",
      "import": "インポート"
    }
  },
  "obs": {
    "title": "OBSオーバーレイ",
    "copyUrl": "URLをコピー",
    "preview": "プレビュー",
    "noToken": "URLにトークンが含まれていません",
    "ranks": {
      "beginner": "ビギナー",
      "bronze": "ブロンズ",
      "silver": "シルバー",
      "gold": "ゴールド",
      "platinum": "プラチナ",
      "diamond": "ダイヤ",
      "master": "マスター"
    }
  },
  "validation": {
    "required": "必須項目です",
    "email": "有効なメールアドレスを入力してください",
    "minLength": "{min}文字以上で入力してください",
    "maxLength": "{max}文字以内で入力してください",
    "passwordMatch": "パスワードが一致しません",
    "username": "ユーザー名は3文字以上で入力してください"
  },
  "help": {
    "title": "ヘルプ",
    "bugReport": "バグを報告",
    "featureRequest": "機能をリクエスト",
    "contact": "お問い合わせ",
    "twitter": "Twitter/X",
    "version": "バージョン"
  },
  "feedback": {
    "bugReport": {
      "title": "バグを報告",
      "titleLabel": "タイトル",
      "titlePlaceholder": "問題を簡潔に説明",
      "descriptionLabel": "説明",
      "descriptionPlaceholder": "問題の詳細を教えてください\n- 何をしようとしましたか？\n- 何が起きましたか？\n- 期待した動作は？",
      "includeEnvironment": "環境情報を含める",
      "includeEnvironmentHint": "ブラウザ、OS、画面サイズ",
      "anonymous": "匿名で送信",
      "anonymousHint": "ユーザー名・メールを含めない",
      "submit": "送信",
      "success": "バグ報告を送信しました",
      "error": "送信に失敗しました"
    },
    "featureRequest": {
      "title": "機能をリクエスト",
      "titleLabel": "タイトル",
      "titlePlaceholder": "欲しい機能を簡潔に説明",
      "descriptionLabel": "説明",
      "descriptionPlaceholder": "どんな機能が欲しいですか？\n- どんな問題を解決しますか？\n- どのように使いたいですか？",
      "anonymous": "匿名で送信",
      "anonymousHint": "ユーザー名・メールを含めない",
      "submit": "送信",
      "success": "機能リクエストを送信しました",
      "error": "送信に失敗しました"
    },
    "validation": {
      "titleRequired": "タイトルは必須です",
      "titleMinLength": "タイトルは5文字以上で入力してください",
      "titleMaxLength": "タイトルは100文字以内で入力してください",
      "descriptionRequired": "説明は必須です",
      "descriptionMinLength": "説明は20文字以上で入力してください",
      "descriptionMaxLength": "説明は2000文字以内で入力してください"
    },
    "rateLimit": "送信制限に達しました。しばらく待ってから再度お試しください"
  }
}
```

**en.json（英語）**
```json
{
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "confirm": "Confirm",
    "reset": "Reset",
    "update": "Update",
    "error": "An error occurred",
    "success": "Success",
    "dataFetchError": "Failed to fetch data",
    "year": "Year",
    "month": "Month"
  },
  "nav": {
    "dashboard": "Dashboard",
    "decks": "Decks",
    "statistics": "Statistics",
    "profile": "Profile",
    "admin": "Admin",
    "logout": "Logout"
  },
  "auth": {
    "login": {
      "title": "Login",
      "email": "Email",
      "password": "Password",
      "submit": "Login",
      "forgotPassword": "Forgot password?",
      "noAccount": "Don't have an account?",
      "register": "Register",
      "termsAgreement": "By logging in, you agree to our",
      "termsLink": "Terms of Service",
      "termsAgreementEnd": ""
    },
    "register": {
      "title": "Register",
      "subtitle": "Create Your Account",
      "username": "Username",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "submit": "Register",
      "hasAccount": "Already have an account?"
    },
    "forgotPassword": {
      "title": "Reset Password"
    },
    "streamerMode": {
      "label": "Streamer Mode",
      "hint": "Hides input and remembers email for next login"
    }
  },
  "dashboard": {
    "title": "Dashboard"
  },
  "decks": {
    "title": "Deck Management",
    "myDecks": "My Decks",
    "opponentDecks": "Opponent Decks",
    "addDeck": "Add",
    "deckName": "Deck Name",
    "noDeck": "No decks registered",
    "noDeckHint": "Click \"Add\" to register a deck",
    "registeredDate": "Registered",
    "archive": {
      "title": "Monthly Reset",
      "description": "Archive all decks at once, such as when a new set is released. Past duel records will be preserved.",
      "button": "Archive All Decks"
    }
  },
  "duels": {
    "title": "Duel Records",
    "addDuel": "Record Duel",
    "result": {
      "win": "Win",
      "lose": "Lose",
      "draw": "Draw"
    },
    "turnOrder": {
      "label": "Turn Order",
      "first": "First",
      "second": "Second"
    },
    "coinToss": {
      "win": "Won",
      "lose": "Lost"
    }
  },
  "statistics": {
    "title": "Statistics",
    "filter": {
      "title": "Statistics Filter",
      "period": "Period",
      "periodAll": "All Time",
      "periodRange": "Range",
      "rangeStart": "Start (match #)",
      "rangeEnd": "End (match #)",
      "myDeck": "My Deck"
    },
    "gameMode": {
      "rank": "Ranked",
      "rate": "Rating",
      "event": "Event",
      "dc": "DC"
    },
    "matchup": "Matchup Chart",
    "distribution": "Deck Distribution"
  },
  "profile": {
    "title": "Edit Profile",
    "username": "Username",
    "email": "Email",
    "newPassword": "New Password (only if changing)",
    "newPasswordHint": "8-72 characters",
    "confirmPassword": "Confirm New Password",
    "streamerMode": {
      "title": "Streamer Mode",
      "description": "When enabled, email addresses in the app are automatically masked. Useful for privacy during streaming or recording.",
      "enable": "Enable Streamer Mode",
      "emailMaskedHint": "Email is masked because Streamer Mode is enabled"
    },
    "experimental": {
      "title": "Experimental Features",
      "badge": "Test",
      "screenAnalysis": {
        "description": "Enable screen analysis to use automatic input via screen capture when recording duels. This feature is in development and may have errors.",
        "enable": "Enable Screen Analysis"
      }
    },
    "accountDeletion": {
      "title": "Delete Account",
      "warning": "This action cannot be undone. Deleting your account will permanently remove all decks and duel history.",
      "button": "Delete Account"
    },
    "dataManagement": {
      "title": "Data Management",
      "description": "Export all data as CSV files (backup) or import (restore) from CSV files.",
      "export": "Export",
      "import": "Import"
    }
  },
  "obs": {
    "title": "OBS Overlay",
    "copyUrl": "Copy URL",
    "preview": "Preview",
    "noToken": "No token in URL",
    "ranks": {
      "beginner": "Beginner",
      "bronze": "Bronze",
      "silver": "Silver",
      "gold": "Gold",
      "platinum": "Platinum",
      "diamond": "Diamond",
      "master": "Master"
    }
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must be at most {max} characters",
    "passwordMatch": "Passwords do not match",
    "username": "Username must be at least 3 characters"
  },
  "help": {
    "title": "Help",
    "bugReport": "Report a Bug",
    "featureRequest": "Request a Feature",
    "contact": "Contact Us",
    "twitter": "Twitter/X",
    "version": "Version"
  },
  "feedback": {
    "bugReport": {
      "title": "Report a Bug",
      "titleLabel": "Title",
      "titlePlaceholder": "Briefly describe the issue",
      "descriptionLabel": "Description",
      "descriptionPlaceholder": "Please provide details about the issue\n- What were you trying to do?\n- What happened?\n- What did you expect?",
      "includeEnvironment": "Include environment info",
      "includeEnvironmentHint": "Browser, OS, screen size",
      "anonymous": "Submit anonymously",
      "anonymousHint": "Don't include username or email",
      "submit": "Submit",
      "success": "Bug report submitted",
      "error": "Failed to submit"
    },
    "featureRequest": {
      "title": "Request a Feature",
      "titleLabel": "Title",
      "titlePlaceholder": "Briefly describe the feature",
      "descriptionLabel": "Description",
      "descriptionPlaceholder": "What feature would you like?\n- What problem does it solve?\n- How would you use it?",
      "anonymous": "Submit anonymously",
      "anonymousHint": "Don't include username or email",
      "submit": "Submit",
      "success": "Feature request submitted",
      "error": "Failed to submit"
    },
    "validation": {
      "titleRequired": "Title is required",
      "titleMinLength": "Title must be at least 5 characters",
      "titleMaxLength": "Title must be at most 100 characters",
      "descriptionRequired": "Description is required",
      "descriptionMinLength": "Description must be at least 20 characters",
      "descriptionMaxLength": "Description must be at most 2000 characters"
    },
    "rateLimit": "Rate limit reached. Please try again later"
  }
}
```

**ko.json（韓国語）**
```json
{
  "common": {
    "loading": "로딩 중...",
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "편집",
    "add": "추가",
    "confirm": "확인",
    "reset": "초기화",
    "update": "업데이트",
    "error": "오류가 발생했습니다",
    "success": "성공했습니다",
    "dataFetchError": "데이터를 가져오지 못했습니다",
    "year": "년",
    "month": "월"
  },
  "nav": {
    "dashboard": "대시보드",
    "decks": "덱 관리",
    "statistics": "통계",
    "profile": "프로필",
    "admin": "관리자",
    "logout": "로그아웃"
  },
  "auth": {
    "login": {
      "title": "로그인",
      "email": "이메일",
      "password": "비밀번호",
      "submit": "로그인",
      "forgotPassword": "비밀번호를 잊으셨나요?",
      "noAccount": "계정이 없으신가요?",
      "register": "회원가입",
      "termsAgreement": "로그인 시",
      "termsLink": "이용약관",
      "termsAgreementEnd": "에 동의하는 것으로 간주됩니다"
    },
    "register": {
      "title": "회원가입",
      "subtitle": "Create Your Account",
      "username": "사용자 이름",
      "email": "이메일",
      "password": "비밀번호",
      "confirmPassword": "비밀번호 확인",
      "submit": "가입하기",
      "hasAccount": "이미 계정이 있으신가요?"
    },
    "forgotPassword": {
      "title": "비밀번호 재설정"
    },
    "streamerMode": {
      "label": "스트리머 모드",
      "hint": "입력 내용을 숨기고 다음 로그인 시 이메일을 기억합니다"
    }
  },
  "dashboard": {
    "title": "대시보드"
  },
  "decks": {
    "title": "덱 관리",
    "myDecks": "내 덱",
    "opponentDecks": "상대 덱",
    "addDeck": "추가",
    "deckName": "덱 이름",
    "noDeck": "등록된 덱이 없습니다",
    "noDeckHint": "\"추가\" 버튼을 눌러 덱을 등록하세요",
    "registeredDate": "등록일",
    "archive": {
      "title": "월간 리셋",
      "description": "신규 세트 출시 등 전체 덱을 한 번에 아카이브할 수 있습니다. 과거 듀얼 기록은 유지됩니다.",
      "button": "전체 덱 아카이브"
    }
  },
  "duels": {
    "title": "듀얼 기록",
    "addDuel": "듀얼 기록하기",
    "result": {
      "win": "승리",
      "lose": "패배",
      "draw": "무승부"
    },
    "turnOrder": {
      "label": "선공/후공",
      "first": "선공",
      "second": "후공"
    },
    "coinToss": {
      "win": "승",
      "lose": "패"
    }
  },
  "statistics": {
    "title": "통계",
    "filter": {
      "title": "통계 필터",
      "period": "기간",
      "periodAll": "전체",
      "periodRange": "범위 지정",
      "rangeStart": "시작 (경기 번호)",
      "rangeEnd": "종료 (경기 번호)",
      "myDeck": "내 덱"
    },
    "gameMode": {
      "rank": "랭크",
      "rate": "레이트",
      "event": "이벤트",
      "dc": "DC"
    },
    "matchup": "상성표",
    "distribution": "덱 분포"
  },
  "profile": {
    "title": "프로필 편집",
    "username": "사용자 이름",
    "email": "이메일",
    "newPassword": "새 비밀번호 (변경 시에만)",
    "newPasswordHint": "8-72자",
    "confirmPassword": "새 비밀번호 확인",
    "streamerMode": {
      "title": "스트리머 모드",
      "description": "활성화하면 앱 내 이메일 주소가 자동으로 마스킹됩니다. 스트리밍이나 녹화 시 개인정보 보호에 유용합니다.",
      "enable": "스트리머 모드 활성화",
      "emailMaskedHint": "스트리머 모드가 활성화되어 이메일이 마스킹됩니다"
    },
    "experimental": {
      "title": "실험적 기능",
      "badge": "테스트",
      "screenAnalysis": {
        "description": "화면 분석 기능을 활성화하면 듀얼 기록 시 화면 캡처를 통한 자동 입력 기능을 사용할 수 있습니다. 이 기능은 개발 중이며 오류가 발생할 수 있습니다.",
        "enable": "화면 분석 기능 활성화"
      }
    },
    "accountDeletion": {
      "title": "계정 삭제",
      "warning": "이 작업은 되돌릴 수 없습니다. 계정을 삭제하면 모든 덱과 듀얼 기록이 영구적으로 삭제됩니다.",
      "button": "계정 삭제"
    },
    "dataManagement": {
      "title": "데이터 관리",
      "description": "모든 데이터를 CSV 파일로 내보내기(백업)하거나 가져오기(복원)할 수 있습니다.",
      "export": "내보내기",
      "import": "가져오기"
    }
  },
  "obs": {
    "title": "OBS 오버레이",
    "copyUrl": "URL 복사",
    "preview": "미리보기",
    "noToken": "URL에 토큰이 없습니다",
    "ranks": {
      "beginner": "비기너",
      "bronze": "브론즈",
      "silver": "실버",
      "gold": "골드",
      "platinum": "플래티넘",
      "diamond": "다이아몬드",
      "master": "마스터"
    }
  },
  "validation": {
    "required": "필수 항목입니다",
    "email": "유효한 이메일 주소를 입력해주세요",
    "minLength": "{min}자 이상 입력해주세요",
    "maxLength": "{max}자 이내로 입력해주세요",
    "passwordMatch": "비밀번호가 일치하지 않습니다",
    "username": "사용자 이름은 3자 이상이어야 합니다"
  },
  "help": {
    "title": "도움말",
    "bugReport": "버그 신고",
    "featureRequest": "기능 요청",
    "contact": "문의하기",
    "twitter": "Twitter/X",
    "version": "버전"
  },
  "feedback": {
    "bugReport": {
      "title": "버그 신고",
      "titleLabel": "제목",
      "titlePlaceholder": "문제를 간단히 설명해주세요",
      "descriptionLabel": "설명",
      "descriptionPlaceholder": "문제에 대해 자세히 알려주세요\n- 무엇을 하려고 했나요?\n- 어떤 일이 발생했나요?\n- 예상했던 동작은?",
      "includeEnvironment": "환경 정보 포함",
      "includeEnvironmentHint": "브라우저, OS, 화면 크기",
      "anonymous": "익명으로 제출",
      "anonymousHint": "사용자 이름이나 이메일을 포함하지 않음",
      "submit": "제출",
      "success": "버그 신고가 제출되었습니다",
      "error": "제출에 실패했습니다"
    },
    "featureRequest": {
      "title": "기능 요청",
      "titleLabel": "제목",
      "titlePlaceholder": "원하는 기능을 간단히 설명해주세요",
      "descriptionLabel": "설명",
      "descriptionPlaceholder": "어떤 기능을 원하시나요?\n- 어떤 문제를 해결하나요?\n- 어떻게 사용하고 싶으신가요?",
      "anonymous": "익명으로 제출",
      "anonymousHint": "사용자 이름이나 이메일을 포함하지 않음",
      "submit": "제출",
      "success": "기능 요청이 제출되었습니다",
      "error": "제출에 실패했습니다"
    },
    "validation": {
      "titleRequired": "제목은 필수입니다",
      "titleMinLength": "제목은 5자 이상이어야 합니다",
      "titleMaxLength": "제목은 100자 이내여야 합니다",
      "descriptionRequired": "설명은 필수입니다",
      "descriptionMinLength": "설명은 20자 이상이어야 합니다",
      "descriptionMaxLength": "설명은 2000자 이내여야 합니다"
    },
    "rateLimit": "전송 제한에 도달했습니다. 잠시 후 다시 시도해주세요"
  }
}
```

---

## 5. 実装設計

### 5.1 vue-i18n初期化（`src/i18n/index.ts`）

```typescript
import { createI18n } from 'vue-i18n'
import ja from './locales/ja.json'
import en from './locales/en.json'
import ko from './locales/ko.json'

export type SupportedLocale = 'ja' | 'en' | 'ko'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['ja', 'en', 'ko']

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  ja: '日本語',
  en: 'English',
  ko: '한국어'
}

// ブラウザ言語から初期言語を決定
function getDefaultLocale(): SupportedLocale {
  // localStorageに保存された設定を優先
  const saved = localStorage.getItem('locale') as SupportedLocale
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  // ブラウザの言語設定を確認
  const browserLang = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES.includes(browserLang as SupportedLocale)) {
    return browserLang as SupportedLocale
  }

  // デフォルトは日本語
  return 'ja'
}

const i18n = createI18n({
  legacy: false, // Composition API モードを使用
  locale: getDefaultLocale(),
  fallbackLocale: 'ja', // フォールバック言語
  messages: {
    ja,
    en,
    ko
  },
  // 日付・数値フォーマット（必要に応じて追加）
  datetimeFormats: {
    ja: {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    },
    en: {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    },
    ko: {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
    }
  },
  numberFormats: {
    ja: {
      percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }
    },
    en: {
      percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }
    },
    ko: {
      percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }
    }
  }
})

export default i18n
```

### 5.2 main.tsへの登録

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import vuetify from './plugins/vuetify'
import VueApexCharts from 'vue3-apexcharts'
import App from './App.vue'
import i18n from './i18n'  // 追加
import './assets/styles/main.scss'
import './assets/styles/auth.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(VueApexCharts)
app.use(i18n)  // 追加

app.mount('#app')
```

### 5.3 言語切り替えComposable（`src/composables/useLocale.ts`）

```typescript
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_NAMES, type SupportedLocale } from '@/i18n'

export function useLocale() {
  const { locale } = useI18n()

  const currentLocale = computed({
    get: () => locale.value as SupportedLocale,
    set: (value: SupportedLocale) => {
      locale.value = value
      localStorage.setItem('locale', value)
      document.documentElement.lang = value
    }
  })

  const supportedLocales = SUPPORTED_LOCALES
  const localeNames = LOCALE_NAMES

  function setLocale(newLocale: SupportedLocale) {
    currentLocale.value = newLocale
  }

  return {
    currentLocale,
    supportedLocales,
    localeNames,
    setLocale
  }
}
```

### 5.4 AppBar.vueへの言語選択UI追加例

既存のAppBar.vueに言語切り替えメニューを追加:

```vue
<!-- テーマ切り替えボタンの後に追加 -->
<v-menu>
  <template #activator="{ props }">
    <v-btn v-bind="props" variant="text" class="mr-2">
      <v-icon>mdi-translate</v-icon>
    </v-btn>
  </template>
  <v-list density="compact">
    <v-list-item
      v-for="loc in supportedLocales"
      :key="loc"
      :active="loc === currentLocale"
      @click="setLocale(loc)"
    >
      <v-list-item-title>{{ localeNames[loc] }}</v-list-item-title>
    </v-list-item>
  </v-list>
</v-menu>
```

---

## 6. コンポーネントでの使用方法

### 6.1 テンプレート内での使用

```vue
<template>
  <div>
    <!-- 基本的な翻訳 -->
    <h1>{{ $t('statistics.title') }}</h1>

    <!-- パラメータ付き翻訳 -->
    <p>{{ $t('validation.minLength', { min: 8 }) }}</p>

    <!-- 数値フォーマット -->
    <span>{{ $n(0.567, 'percent') }}</span>

    <!-- 日付フォーマット -->
    <span>{{ $d(new Date(), 'short') }}</span>
  </div>
</template>
```

### 6.2 Composition API内での使用

```typescript
import { useI18n } from 'vue-i18n'

const { t, n, d } = useI18n()

// 翻訳
const message = t('common.success')

// パラメータ付き
const validationMsg = t('validation.minLength', { min: 8 })
```

### 6.3 既存コンポーネントの変換例

**変換前（AppBar.vue）**
```typescript
const navItems = [
  { name: 'ダッシュボード', path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: 'デッキ管理', path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: '統計', path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
];
```

**変換後**
```typescript
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const navItems = computed(() => [
  { name: t('nav.dashboard'), path: '/', view: 'dashboard', icon: 'mdi-view-dashboard' },
  { name: t('nav.decks'), path: '/decks', view: 'decks', icon: 'mdi-cards' },
  { name: t('nav.statistics'), path: '/statistics', view: 'statistics', icon: 'mdi-chart-bar' },
])
```

---

## 7. 実装フェーズ

### Phase 1: 基盤構築と英語対応

**タスク**:
1. [ ] vue-i18nのインストールと初期設定
2. [ ] 翻訳ファイル（ja.json, en.json）の作成
3. [ ] main.tsへの統合
4. [ ] useLocale composableの作成
5. [ ] 言語切り替えUIの実装（AppBarに配置）
6. [ ] 既存コンポーネントの国際化対応
   - [ ] AppBar.vue（ナビゲーション、メニュー）
   - [ ] LoginView.vue, RegisterView.vue（認証画面）
   - [ ] DashboardView.vue（ダッシュボード関連）
   - [ ] DecksView.vue（デッキ管理）
   - [ ] StatisticsView.vue, StatisticsFilter.vue（統計情報）
   - [ ] ProfileView.vue（プロフィール、設定）
   - [ ] OBSOverlayView.vue（OBSオーバーレイ）
7. [ ] バリデーションメッセージの国際化
8. [ ] テストの実施

### Phase 2: 韓国語対応

**タスク**:
1. [ ] ko.jsonの作成・翻訳
2. [ ] 翻訳レビュー（ネイティブチェック推奨）
3. [ ] テストの実施

### Phase 3: 改善と最適化

**タスク**:
1. [ ] 遅延読み込みの検討（言語ファイルが大きくなった場合）
2. [ ] 翻訳キーの型安全性強化
3. [ ] 不足している翻訳の警告システム

---

## 8. 開発ワークフロー

### 8.1 新しい文字列を追加する手順

1. `ja.json`に日本語の文字列を追加（ベース言語）
2. `en.json`に英語の翻訳を追加
3. `ko.json`に韓国語の翻訳を追加（または後で）
4. コンポーネントで`$t('key.path')`を使用

### 8.2 翻訳漏れの防止

- 開発中は`fallbackWarn: true`で警告を表示
- CI/CDで翻訳キーの整合性チェックを検討
- 未翻訳キーはフォールバック言語（日本語）で表示

---

## 9. 考慮事項

### 9.1 OBSオーバーレイの言語

OBSオーバーレイはクエリパラメータで言語を指定できるようにする:
```
/obs-overlay?token=xxx&lang=en
```

### 9.2 SEOへの影響

SPAのためSEOへの影響は限定的だが、必要に応じて:
- `<html lang="xx">`属性を動的に更新
- metaタグの言語指定

### 9.3 RTL（右から左）言語

現在の対象言語（日本語、英語、韓国語）はすべてLTRのため、RTL対応は不要。
将来アラビア語等を追加する場合は別途検討。

---

## 10. 参考リンク

- [vue-i18n公式ドキュメント](https://vue-i18n.intlify.dev/)
- [Vue 3 Composition API + vue-i18n](https://vue-i18n.intlify.dev/guide/advanced/composition.html)
