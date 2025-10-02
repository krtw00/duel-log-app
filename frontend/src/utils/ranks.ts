// ランクの定義
export const RANKS = [
  { value: 1, label: 'ビギナー2' },
  { value: 2, label: 'ビギナー1' },
  { value: 3, label: 'ブロンズ5' },
  { value: 4, label: 'ブロンズ4' },
  { value: 5, label: 'ブロンズ3' },
  { value: 6, label: 'ブロンズ2' },
  { value: 7, label: 'ブロンズ1' },
  { value: 8, label: 'シルバー5' },
  { value: 9, label: 'シルバー4' },
  { value: 10, label: 'シルバー3' },
  { value: 11, label: 'シルバー2' },
  { value: 12, label: 'シルバー1' },
  { value: 13, label: 'ゴールド5' },
  { value: 14, label: 'ゴールド4' },
  { value: 15, label: 'ゴールド3' },
  { value: 16, label: 'ゴールド2' },
  { value: 17, label: 'ゴールド1' },
  { value: 18, label: 'プラチナ5' },
  { value: 19, label: 'プラチナ4' },
  { value: 20, label: 'プラチナ3' },
  { value: 21, label: 'プラチナ2' },
  { value: 22, label: 'プラチナ1' },
  { value: 23, label: 'ダイヤ5' },
  { value: 24, label: 'ダイヤ4' },
  { value: 25, label: 'ダイヤ3' },
  { value: 26, label: 'ダイヤ2' },
  { value: 27, label: 'ダイヤ1' },
  { value: 28, label: 'マスター5' },
  { value: 29, label: 'マスター4' },
  { value: 30, label: 'マスター3' },
  { value: 31, label: 'マスター2' },
  { value: 32, label: 'マスター1' },
];

export const getRankName = (rankValue: number): string => {
  const rank = RANKS.find(r => r.value === rankValue);
  return rank ? rank.label : '不明';
};

export const getRankValue = (rankLabel: string): number | null => {
  const rank = RANKS.find(r => r.label === rankLabel);
  return rank ? rank.value : null;
};
