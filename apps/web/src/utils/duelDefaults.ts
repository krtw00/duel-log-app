export function getDefaultTurnValues(defaultIsFirst: boolean): {
  isFirst: boolean;
  wonCoinToss: boolean;
} {
  return {
    isFirst: defaultIsFirst,
    wonCoinToss: true,
  };
}

export function deriveIsFirstFromWonCoinToss(
  wonCoinToss: boolean,
  defaultIsFirst: boolean,
): boolean {
  return wonCoinToss ? defaultIsFirst : !defaultIsFirst;
}

export function deriveWonCoinTossFromIsFirst(
  isFirst: boolean,
  defaultIsFirst: boolean,
): boolean {
  return isFirst === defaultIsFirst;
}
