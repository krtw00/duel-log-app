export interface UserRow {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string | null;
  oauthProvider: string | null;
  oauthProviderId: string | null;
  isAdmin: boolean;
  isDebugger: boolean;
  themePreference: string;
  streamerMode: boolean;
  showPlayMistakeStats: boolean;
  classicLayout: boolean;
  status: string;
  statusReason: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface OAuthStateRow {
  id: string;
  state: string;
  codeVerifier: string | null;
  provider: string;
  createdAt: Date;
  expiresAt: Date;
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
  opponentHandtraps: string[];
  playMistake: boolean | null;
  dueledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserHandtrapCardRow {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface SharedStatisticsRow {
  id: string;
  userId: string;
  token: string;
  filters: unknown;
  expiresAt: Date | null;
  createdAt: Date;
}
