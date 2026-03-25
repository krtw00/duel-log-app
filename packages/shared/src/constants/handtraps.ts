export const DEFAULT_HANDTRAP_CARDS = [
  {
    id: 'ash-blossom',
    nameJa: '灰流うらら',
    nameEn: 'Ash Blossom & Joyous Spring',
    nameKo: '재의 꽃 우라라',
  },
  {
    id: 'maxx-c',
    nameJa: '増殖するG',
    nameEn: 'Maxx "C"',
    nameKo: '증식하는 G',
  },
  {
    id: 'mulcharmy-fuwaross',
    nameJa: 'マルチャミー・フワロス',
    nameEn: 'Mulcharmy Fuwaross',
    nameKo: '멀차미 후와로스',
  },
  {
    id: 'droll-lock-bird',
    nameJa: 'ドロール&ロックバード',
    nameEn: 'Droll & Lock Bird',
    nameKo: '드롤 & 로크 버드',
  },
  {
    id: 'effect-veiler',
    nameJa: 'エフェクト・ヴェーラー',
    nameEn: 'Effect Veiler',
    nameKo: '이펙트 뵐러',
  },
  {
    id: 'nibiru',
    nameJa: '原始生命態ニビル',
    nameEn: 'Nibiru, the Primal Being',
    nameKo: '원시생명태 니비루',
  },
  {
    id: 'infinite-impermanence',
    nameJa: '無限泡影',
    nameEn: 'Infinite Impermanence',
    nameKo: '무한포영',
  },
  {
    id: 'dominus-impulse',
    nameJa: '霊王の波動',
    nameEn: 'Dominus Impulse',
    nameKo: '영왕의 파동',
  },
  {
    id: 'dominus-purge',
    nameJa: '聖王の粉砕',
    nameEn: 'Dominus Purge',
    nameKo: '성왕의 분쇄',
  },
] as const;

export type DefaultHandtrapCard = (typeof DEFAULT_HANDTRAP_CARDS)[number];
