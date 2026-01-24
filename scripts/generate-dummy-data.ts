/**
 * ダミーデータ生成スクリプト
 *
 * ygo-grimoireのテーマデータを参考に、人間らしい対戦履歴を生成する。
 *
 * Usage:
 *   npx tsx scripts/generate-dummy-data.ts > supabase/seed-dummy.sql
 *
 * 生成内容:
 *   - testuser (UUID: 00000000-...01) に対して
 *   - 自分デッキ 4-5個（環境テーマ）
 *   - 相手デッキ 20-30個（多様なテーマ）
 *   - 3ヶ月分の対戦履歴 約200-300件
 *   - 人間味のあるメモ（日本語）
 */

// === テーマデータ（ygo-grimoire DBから取得した実テーマ名） ===

/** 環境上位テーマ（プレイヤーが使いそうなデッキ） */
const META_DECKS = [
  'スネークアイ',
  'ティアラメンツ',
  '天盃龍',
  'ラビュリンス',
  'R－ACE',
  '粛声',
  'ユベル',
  'デモンスミス',
  'センチュリオン',
  '烙印',
  'ピュアリィ',
  'ヌーベルズ',
  '閃刀姫',
  'ライゼオル',
  'M∀LICE',
] as const;

/** 対戦相手として遭遇しうる幅広いテーマ */
const OPPONENT_THEMES = [
  'スネークアイ',
  'ティアラメンツ',
  '天盃龍',
  'ラビュリンス',
  'R－ACE',
  '粛声',
  'ユベル',
  'デモンスミス',
  'センチュリオン',
  '烙印',
  'ピュアリィ',
  'ヌーベルズ',
  '閃刀姫',
  'ライゼオル',
  'M∀LICE',
  'エルドリッチ',
  'ドラゴンメイド',
  '幻影騎士団',
  'オルターガイスト',
  'シャドール',
  'サラマングレイト',
  'コード・トーカー',
  'サイバー・ドラゴン',
  'ブルーアイズ',
  'ブラック・マジシャン',
  'レッドアイズ',
  'E・HERO',
  '六武衆',
  'スプライト',
  'クシャトリラ',
  'ふわんだりぃず',
  'エクソシスター',
  '御巫',
  '蟲惑魔',
  'マドルチェ',
  '超重武者',
  '電脳堺',
  '斬機',
  'マシンナーズ',
  '捕食植物',
  'トリックスター',
  'ドラグニティ',
  'サンダー・ドラゴン',
  'スターダスト',
  '妖仙獣',
  'インフェルノイド',
  'DD（ディーディー）',
  'トライブリゲード',
  '竜星',
  '不知火',
  '剣闘獣',
  'ヴァレット',
  'ドラグマ',
  '天威',
  '春化精',
  '魔術師',
  'セフィラ',
  'マテリアクトル',
  '白き森',
  'ゴーティス',
  'スケアクロー',
] as const;

/** 人間が書きそうなメモのパターン */
const MEMOS = {
  /** 勝利時のメモ */
  win: [
    '相手事故ってた',
    'うらら通った',
    'ニビル刺さった',
    '後手ワンキル成功',
    'Gで止まってくれた',
    '墓穴効いた',
    'うさぎ通って助かった',
    '展開通った',
    '指名者引けてた',
    '泡影で止めた',
    'ロンギで返した',
    '完封',
    '相手投了',
    '早めに投了してくれた',
    '危なかった',
    'ギリギリ',
    'トップ解決',
    '初手全ハンデス成功',
    '盤面返せた',
    '妨害踏み越えた',
    '相手ドロー事故っぽい',
    '一滴で全処理',
    'アクセスコード通った',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
  /** 敗北時のメモ */
  loss: [
    '事故った',
    'うらら食らった',
    'ニビル食らった',
    '手札誘発引けず',
    'Gで止められた',
    '墓穴で止められた',
    '展開途中で止められた',
    '相手の盤面返せず',
    '先攻制圧された',
    '後手で何もできず',
    '手札事故',
    '初手弱すぎ',
    '妨害多すぎ',
    'ドロール食らった',
    '次元障壁きつい',
    '勝てる気がしなかった',
    'プレミした',
    '操作ミスで負けた',
    '時間切れ負け',
    'サレンダー',
    '手札0枚でターン返された',
    '相手上手かった',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ],
} as const;

/** レート戦用のメモ */
const RATE_MEMOS = {
  win: [
    'レート+15',
    'レート+20',
    'レート+12',
    '連勝中',
    '調子いい',
    '',
    '',
    '',
  ],
  loss: [
    'レート-18',
    'レート-15',
    'レート-22',
    '連敗止まらん',
    '',
    '',
    '',
  ],
} as const;

// === ユーティリティ ===

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uuid(prefix: string, index: number): string {
  const hex = index.toString(16).padStart(12, '0');
  return `${prefix}-0000-0000-0000-${hex}`;
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

// === データ生成ロジック ===

interface DeckInfo {
  id: string;
  name: string;
  isOpponent: boolean;
}

interface DuelRecord {
  deckId: string;
  opponentDeckId: string;
  result: 'win' | 'loss';
  gameMode: 'RANK' | 'RATE' | 'EVENT' | 'DC';
  isFirst: boolean;
  wonCoinToss: boolean;
  rank: number | null;
  rateValue: number | null;
  dcValue: number | null;
  memo: string;
  dueledAt: Date;
}

function generateDecks(): DeckInfo[] {
  const decks: DeckInfo[] = [];

  // プレイヤーデッキ（4-5個、メタテーマから）
  const myThemes = shuffle([...META_DECKS]).slice(0, randomInt(4, 5));
  myThemes.forEach((name, i) => {
    decks.push({
      id: uuid('20000000', i + 1),
      name,
      isOpponent: false,
    });
  });

  // 相手デッキ（25-35個、幅広いテーマから）
  const opponentCount = randomInt(25, 35);
  const opponents = shuffle([...OPPONENT_THEMES]).slice(0, opponentCount);
  opponents.forEach((name, i) => {
    decks.push({
      id: uuid('30000000', i + 1),
      name,
      isOpponent: true,
    });
  });

  return decks;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateDuels(decks: DeckInfo[]): DuelRecord[] {
  const myDecks = decks.filter((d) => !d.isOpponent);
  const opponentDecks = decks.filter((d) => d.isOpponent);
  const duels: DuelRecord[] = [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // 3ヶ月分のデータを生成
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const targetMonth = currentMonth - monthOffset;
    const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
    const adjustedMonth = ((targetMonth % 12) + 12) % 12;

    // 月ごとの対戦数（60-120件/月）
    const duelsThisMonth = randomInt(60, 120);

    // この月のメインデッキ（1-2個を重点的に使う）
    const mainDeck = randomChoice(myDecks);
    const subDeck = randomChoice(myDecks.filter((d) => d.id !== mainDeck.id));

    // ランク進行シミュレーション
    let currentRank = monthOffset === 2 ? randomInt(16, 20) : randomInt(12, 18);
    let currentRate = randomInt(1200, 1500);
    let currentDC = 0;

    // 連勝/連敗ストリーク管理
    let streak = 0; // 正=連勝、負=連敗

    for (let i = 0; i < duelsThisMonth; i++) {
      // 時刻: 月内でランダムに分散（朝少なめ、夜多め）
      const day = randomInt(1, 28);
      const hourWeight = Math.random();
      let hour: number;
      if (hourWeight < 0.1) hour = randomInt(6, 9); // 朝
      else if (hourWeight < 0.3) hour = randomInt(10, 14); // 昼
      else if (hourWeight < 0.6) hour = randomInt(15, 19); // 夕方
      else hour = randomInt(20, 25) % 24; // 夜〜深夜

      const minute = randomInt(0, 59);
      const dueledAt = new Date(targetYear, adjustedMonth, day, hour, minute);

      // ゲームモード選択（ランクが最多）
      let gameMode: 'RANK' | 'RATE' | 'EVENT' | 'DC';
      const modeRoll = Math.random();
      if (modeRoll < 0.6) gameMode = 'RANK';
      else if (modeRoll < 0.8) gameMode = 'RATE';
      else if (modeRoll < 0.93) gameMode = 'EVENT';
      else gameMode = 'DC';

      // デッキ選択（メインデッキを70%使用）
      const deckRoll = Math.random();
      const deck = deckRoll < 0.55 ? mainDeck : deckRoll < 0.85 ? subDeck : randomChoice(myDecks);
      const opponent = randomChoice(opponentDecks);

      // コイン & 先攻後攻
      const wonCoinToss = Math.random() < 0.5;
      // コイン勝ち→ほぼ先攻選択、負け→後攻
      const isFirst = wonCoinToss ? Math.random() < 0.92 : Math.random() < 0.08;

      // 勝敗判定（先攻有利 + ストリーク影響）
      let winProb = isFirst ? 0.55 : 0.45;
      // 連勝中は少し勝率下がる（マッチング調整的なリアリティ）
      if (streak > 3) winProb -= 0.05;
      if (streak < -3) winProb += 0.05;
      const result: 'win' | 'loss' = Math.random() < winProb ? 'win' : 'loss';

      // ストリーク更新
      if (result === 'win') streak = streak > 0 ? streak + 1 : 1;
      else streak = streak < 0 ? streak - 1 : -1;

      // ランク/レート/DC値
      let rank: number | null = null;
      let rateValue: number | null = null;
      let dcValue: number | null = null;

      if (gameMode === 'RANK') {
        if (result === 'win') {
          currentRank = Math.max(1, currentRank - 1); // ランクアップ
        } else {
          currentRank = Math.min(25, currentRank + (Math.random() < 0.3 ? 1 : 0)); // たまにランクダウン
        }
        rank = currentRank;
      } else if (gameMode === 'RATE') {
        const delta = randomInt(10, 25);
        if (result === 'win') currentRate += delta;
        else currentRate = Math.max(1000, currentRate - delta);
        rateValue = currentRate;
      } else if (gameMode === 'DC') {
        const delta = randomInt(50, 200);
        if (result === 'win') currentDC += delta;
        else currentDC = Math.max(0, currentDC - Math.floor(delta * 0.3));
        dcValue = currentDC;
      }

      // メモ生成（30%の確率でメモあり）
      let memo = '';
      if (Math.random() < 0.30) {
        if (gameMode === 'RATE' && Math.random() < 0.5) {
          memo = randomChoice(result === 'win' ? RATE_MEMOS.win : RATE_MEMOS.loss);
        } else {
          memo = randomChoice(result === 'win' ? MEMOS.win : MEMOS.loss);
        }
      }

      duels.push({
        deckId: deck.id,
        opponentDeckId: opponent.id,
        result,
        gameMode,
        isFirst,
        wonCoinToss,
        rank,
        rateValue,
        dcValue,
        memo,
        dueledAt,
      });
    }
  }

  // 時系列ソート
  duels.sort((a, b) => a.dueledAt.getTime() - b.dueledAt.getTime());
  return duels;
}

// === SQL出力 ===

const USER_ID = '00000000-0000-0000-0000-000000000001';
const USER_EMAIL = 'test@example.com';
const USER_PASSWORD = 'password123';
const USER_DISPLAY_NAME = 'testuser';

function generateUserSQL(): string[] {
  const lines: string[] = [];

  lines.push('-- ============================================================');
  lines.push('-- User: testuser (admin + debugger)');
  lines.push('-- Email: test@example.com / Password: password123');
  lines.push('-- ============================================================');
  lines.push('');

  // Clean existing data
  lines.push('-- Clean existing data for this user');
  lines.push(`DELETE FROM public.duels WHERE user_id = '${USER_ID}';`);
  lines.push(`DELETE FROM public.decks WHERE user_id = '${USER_ID}';`);
  lines.push(`DELETE FROM public.users WHERE id = '${USER_ID}';`);
  lines.push(`DELETE FROM auth.identities WHERE user_id = '${USER_ID}';`);
  lines.push(`DELETE FROM auth.users WHERE id = '${USER_ID}';`);
  lines.push('');

  // auth.users
  lines.push('-- Auth user');
  lines.push(`INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token,
  reauthentication_token,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '${USER_ID}',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  '${USER_EMAIL}',
  crypt('${USER_PASSWORD}', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '', '', '', '', '',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "${USER_DISPLAY_NAME}"}'
);`);
  lines.push('');

  // auth.identities
  lines.push('-- Auth identity');
  lines.push(`INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) VALUES (
  '${USER_ID}',
  '${USER_ID}',
  '${USER_ID}',
  'email',
  jsonb_build_object('sub', '${USER_ID}', 'email', '${USER_EMAIL}'),
  now(), now(), now()
);`);
  lines.push('');

  // public.users (admin + debugger)
  lines.push('-- App user (admin + debugger)');
  lines.push(`INSERT INTO public.users (id, email, display_name, is_admin, is_debugger)
VALUES ('${USER_ID}', '${USER_EMAIL}', '${USER_DISPLAY_NAME}', true, true);`);
  lines.push('');

  return lines;
}

function generateSQL(): string {
  const lines: string[] = [];

  lines.push('-- ============================================================');
  lines.push('-- Dummy data generated from ygo-grimoire themes');
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push('-- ============================================================');
  lines.push('');

  // ユーザー作成
  lines.push(...generateUserSQL());

  // デッキ生成
  const decks = generateDecks();

  lines.push('-- Decks (player + opponent)');
  lines.push('INSERT INTO public.decks (id, user_id, name, is_opponent_deck, active) VALUES');
  const deckValues = decks.map(
    (d) => `  ('${d.id}', '${USER_ID}', '${escapeSQL(d.name)}', ${d.isOpponent}, true)`,
  );
  lines.push(deckValues.join(',\n') + ';');
  lines.push('');

  // デュエル生成
  const duels = generateDuels(decks);

  lines.push(`-- Duels (${duels.length} records across 3 months)`);
  lines.push(
    'INSERT INTO public.duels (user_id, deck_id, opponent_deck_id, result, game_mode, is_first, won_coin_toss, rank, rate_value, dc_value, memo, dueled_at) VALUES',
  );

  const duelValues = duels.map((d) => {
    const rankStr = d.rank !== null ? String(d.rank) : 'NULL';
    const rateStr = d.rateValue !== null ? String(d.rateValue) : 'NULL';
    const dcStr = d.dcValue !== null ? String(d.dcValue) : 'NULL';
    const memoStr = d.memo ? `'${escapeSQL(d.memo)}'` : 'NULL';
    const dateStr = d.dueledAt.toISOString();

    return `  ('${USER_ID}', '${d.deckId}', '${d.opponentDeckId}', '${d.result}', '${d.gameMode}', ${d.isFirst}, ${d.wonCoinToss}, ${rankStr}, ${rateStr}, ${dcStr}, ${memoStr}, '${dateStr}')`;
  });

  lines.push(duelValues.join(',\n') + ';');
  lines.push('');
  lines.push('-- Summary:');
  lines.push(`--   Player decks: ${decks.filter((d) => !d.isOpponent).length}`);
  lines.push(`--   Opponent decks: ${decks.filter((d) => d.isOpponent).length}`);
  lines.push(`--   Total duels: ${duels.length}`);
  lines.push(`--   RANK: ${duels.filter((d) => d.gameMode === 'RANK').length}`);
  lines.push(`--   RATE: ${duels.filter((d) => d.gameMode === 'RATE').length}`);
  lines.push(`--   EVENT: ${duels.filter((d) => d.gameMode === 'EVENT').length}`);
  lines.push(`--   DC: ${duels.filter((d) => d.gameMode === 'DC').length}`);
  const wins = duels.filter((d) => d.result === 'win').length;
  lines.push(`--   Win rate: ${((wins / duels.length) * 100).toFixed(1)}%`);

  return lines.join('\n');
}

// === メイン ===
console.log(generateSQL());
