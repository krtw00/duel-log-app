import type { TFunction } from 'i18next';

type RankTier = 'rookie' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

interface RankDefinition {
  value: number;
  tier: RankTier;
  tierNum: number;
}

// Tier numbers descend within each rank (highest → Tier 1 → promote to next rank)
export const RANK_DEFINITIONS: RankDefinition[] = [
  // ROOKIE: Tier 2, 1
  { value: 1, tier: 'rookie', tierNum: 2 },
  { value: 2, tier: 'rookie', tierNum: 1 },
  // BRONZE: Tier 5, 4, 3, 2, 1
  { value: 3, tier: 'bronze', tierNum: 5 },
  { value: 4, tier: 'bronze', tierNum: 4 },
  { value: 5, tier: 'bronze', tierNum: 3 },
  { value: 6, tier: 'bronze', tierNum: 2 },
  { value: 7, tier: 'bronze', tierNum: 1 },
  // SILVER: Tier 5, 4, 3, 2, 1
  { value: 8, tier: 'silver', tierNum: 5 },
  { value: 9, tier: 'silver', tierNum: 4 },
  { value: 10, tier: 'silver', tierNum: 3 },
  { value: 11, tier: 'silver', tierNum: 2 },
  { value: 12, tier: 'silver', tierNum: 1 },
  // GOLD: Tier 5, 4, 3, 2, 1
  { value: 13, tier: 'gold', tierNum: 5 },
  { value: 14, tier: 'gold', tierNum: 4 },
  { value: 15, tier: 'gold', tierNum: 3 },
  { value: 16, tier: 'gold', tierNum: 2 },
  { value: 17, tier: 'gold', tierNum: 1 },
  // PLATINUM: Tier 5, 4, 3, 2, 1
  { value: 18, tier: 'platinum', tierNum: 5 },
  { value: 19, tier: 'platinum', tierNum: 4 },
  { value: 20, tier: 'platinum', tierNum: 3 },
  { value: 21, tier: 'platinum', tierNum: 2 },
  { value: 22, tier: 'platinum', tierNum: 1 },
  // DIAMOND: Tier 5, 4, 3, 2, 1
  { value: 23, tier: 'diamond', tierNum: 5 },
  { value: 24, tier: 'diamond', tierNum: 4 },
  { value: 25, tier: 'diamond', tierNum: 3 },
  { value: 26, tier: 'diamond', tierNum: 2 },
  { value: 27, tier: 'diamond', tierNum: 1 },
  // MASTER: Tier 5, 4, 3, 2, 1
  { value: 28, tier: 'master', tierNum: 5 },
  { value: 29, tier: 'master', tierNum: 4 },
  { value: 30, tier: 'master', tierNum: 3 },
  { value: 31, tier: 'master', tierNum: 2 },
  { value: 32, tier: 'master', tierNum: 1 },
];

export const MAX_RANK = 32;

/** 月初のランク降格: 1つ下のランクの Tier 5 に落とす。ルーキーは Tier 2 のまま */
export function demoteRank(value: number): number {
  const rank = RANK_DEFINITIONS.find((r) => r.value === value);
  if (!rank) return 18; // fallback: Platinum 5

  // Demotion map: current tier → Tier 5 of one rank below
  const demotionMap: Record<RankTier, number> = {
    rookie: 1, // Rookie → Rookie Tier 2 (can't go lower)
    bronze: 1, // Bronze → Rookie Tier 2
    silver: 3, // Silver → Bronze Tier 5
    gold: 8, // Gold → Silver Tier 5
    platinum: 13, // Platinum → Gold Tier 5
    diamond: 18, // Diamond → Platinum Tier 5
    master: 23, // Master → Diamond Tier 5
  };

  return demotionMap[rank.tier];
}

export function getRankLabel(value: number, t: TFunction): string {
  const rank = RANK_DEFINITIONS.find((r) => r.value === value);
  if (!rank) return `${value}`;
  return `${t(`ranks.${rank.tier}`)} ${rank.tierNum}`;
}
