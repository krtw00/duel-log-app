/**
 * Ranks Composable
 * Provides internationalized rank names and utilities
 */

import { computed } from 'vue';
import { useLocale } from './useLocale';

// Rank tier keys for translation lookup
type RankTier = 'beginner' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

// Internal rank definition (tier + subRank)
interface RankDefinition {
  value: number;
  tier: RankTier;
  subRank: number;
}

// Rank definitions with tier and subRank
const RANK_DEFINITIONS: RankDefinition[] = [
  { value: 1, tier: 'beginner', subRank: 2 },
  { value: 2, tier: 'beginner', subRank: 1 },
  { value: 3, tier: 'bronze', subRank: 5 },
  { value: 4, tier: 'bronze', subRank: 4 },
  { value: 5, tier: 'bronze', subRank: 3 },
  { value: 6, tier: 'bronze', subRank: 2 },
  { value: 7, tier: 'bronze', subRank: 1 },
  { value: 8, tier: 'silver', subRank: 5 },
  { value: 9, tier: 'silver', subRank: 4 },
  { value: 10, tier: 'silver', subRank: 3 },
  { value: 11, tier: 'silver', subRank: 2 },
  { value: 12, tier: 'silver', subRank: 1 },
  { value: 13, tier: 'gold', subRank: 5 },
  { value: 14, tier: 'gold', subRank: 4 },
  { value: 15, tier: 'gold', subRank: 3 },
  { value: 16, tier: 'gold', subRank: 2 },
  { value: 17, tier: 'gold', subRank: 1 },
  { value: 18, tier: 'platinum', subRank: 5 },
  { value: 19, tier: 'platinum', subRank: 4 },
  { value: 20, tier: 'platinum', subRank: 3 },
  { value: 21, tier: 'platinum', subRank: 2 },
  { value: 22, tier: 'platinum', subRank: 1 },
  { value: 23, tier: 'diamond', subRank: 5 },
  { value: 24, tier: 'diamond', subRank: 4 },
  { value: 25, tier: 'diamond', subRank: 3 },
  { value: 26, tier: 'diamond', subRank: 2 },
  { value: 27, tier: 'diamond', subRank: 1 },
  { value: 28, tier: 'master', subRank: 5 },
  { value: 29, tier: 'master', subRank: 4 },
  { value: 30, tier: 'master', subRank: 3 },
  { value: 31, tier: 'master', subRank: 2 },
  { value: 32, tier: 'master', subRank: 1 },
];

export function useRanks() {
  const { LL } = useLocale();

  // Get translated tier name
  const getTierName = (tier: RankTier): string => {
    const tierNames: Record<RankTier, () => string | undefined> = {
      beginner: () => LL.value?.obs.ranks.beginner(),
      bronze: () => LL.value?.obs.ranks.bronze(),
      silver: () => LL.value?.obs.ranks.silver(),
      gold: () => LL.value?.obs.ranks.gold(),
      platinum: () => LL.value?.obs.ranks.platinum(),
      diamond: () => LL.value?.obs.ranks.diamond(),
      master: () => LL.value?.obs.ranks.master(),
    };
    return tierNames[tier]?.() ?? tier;
  };

  // Get translated rank name from rank value
  const getRankName = (rankValue: number): string => {
    const rank = RANK_DEFINITIONS.find((r) => r.value === rankValue);
    if (!rank) {
      return LL.value?.obs.ranks.unknown() ?? 'Unknown';
    }
    return `${getTierName(rank.tier)}${rank.subRank}`;
  };

  // Get rank value from translated rank name (for backward compatibility)
  const getRankValue = (rankLabel: string): number | null => {
    // Try to match the label with current translations
    for (const rank of RANK_DEFINITIONS) {
      const translatedLabel = `${getTierName(rank.tier)}${rank.subRank}`;
      if (translatedLabel === rankLabel) {
        return rank.value;
      }
    }
    return null;
  };

  // Computed RANKS array with translated labels (for v-select items)
  const RANKS = computed(() =>
    RANK_DEFINITIONS.map((rank) => ({
      value: rank.value,
      label: `${getTierName(rank.tier)}${rank.subRank}`,
    })),
  );

  return {
    RANKS,
    getRankName,
    getRankValue,
    getTierName,
  };
}
