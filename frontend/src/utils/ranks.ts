export const rankOptions = [
  { title: 'マスター1', value: 1 },
  { title: 'マスター2', value: 2 },
  { title: 'マスター3', value: 3 },
  { title: 'マスター4', value: 4 },
  { title: 'マスター5', value: 5 },
  { title: 'ダイヤ1', value: 6 },
  { title: 'ダイヤ2', value: 7 },
  { title: 'ダイヤ3', value: 8 },
  { title: 'ダイヤ4', value: 9 },
  { title: 'ダイヤ5', value: 10 },
  { title: 'プラチナ1', value: 11 },
  { title: 'プラチナ2', value: 12 },
  { title: 'プラチナ3', value: 13 },
  { title: 'プラチナ4', value: 14 },
  { title: 'プラチナ5', value: 15 },
  { title: 'ゴールド1', value: 16 },
  { title: 'ゴールド2', value: 17 },
  { title: 'ゴールド3', value: 18 },
  { title: 'ゴールド4', value: 19 },
  { title: 'ゴールド5', value: 20 },
  { title: 'シルバー1', value: 21 },
  { title: 'シルバー2', value: 22 },
  { title: 'シルバー3', value: 23 },
  { title: 'シルバー4', value: 24 },
  { title: 'シルバー5', value: 25 },
  { title: 'ブロンズ1', value: 26 },
  { title: 'ブロンズ2', value: 27 },
  { title: 'ブロンズ3', value: 28 },
  { title: 'ブロンズ4', value: 29 },
  { title: 'ブロンズ5', value: 30 },
  { title: 'ビギナー1', value: 31 },
  { title: 'ビギナー2', value: 32 }
];

const rankMap = new Map(rankOptions.map(option => [option.value, option.title]));

export const getRankName = (rank: number): string => {
  return rankMap.get(rank) || `ランク${rank}`;
};
