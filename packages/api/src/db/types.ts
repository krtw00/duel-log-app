export interface UserRow {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isDebugger: boolean;
  themePreference: string;
  streamerMode: boolean;
  enableScreenAnalysis: boolean;
  status: string;
  statusReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeckRow {
  id: string;
  userId: string;
  name: string;
  isOpponentDeck: boolean;
  isGeneric: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DuelRow {
  id: string;
  userId: string;
  deckId: string;
  opponentDeckId: string;
  result: string;
  gameMode: string;
  isFirst: boolean;
  wonCoinToss: boolean;
  rank: number | null;
  rateValue: number | null;
  dcValue: number | null;
  memo: string | null;
  dueledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedStatisticsRow {
  id: string;
  userId: string;
  token: string;
  filters: unknown;
  expiresAt: Date | null;
  createdAt: Date;
}
