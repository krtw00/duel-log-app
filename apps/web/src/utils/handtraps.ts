import { DEFAULT_HANDTRAP_CARDS, type DefaultHandtrapCard } from '@duel-log/shared';

export const CUSTOM_HANDTRAP_PREFIX = 'custom-';

export type UserHandtrapCard = {
  id: string;
  name: string;
  createdAt: string;
};

export type ResolvedCustomHandtrapCard = UserHandtrapCard & {
  id: string;
  rawId: string;
  isCustom: true;
};

export type ResolvedHandtrapCard = DefaultHandtrapCard | ResolvedCustomHandtrapCard;

export function toCustomHandtrapId(cardId: string) {
  return cardId.startsWith(CUSTOM_HANDTRAP_PREFIX) ? cardId : `${CUSTOM_HANDTRAP_PREFIX}${cardId}`;
}

export function fromCustomHandtrapId(cardId: string) {
  return cardId.startsWith(CUSTOM_HANDTRAP_PREFIX)
    ? cardId.slice(CUSTOM_HANDTRAP_PREFIX.length)
    : cardId;
}

export function isCustomHandtrapId(cardId: string) {
  return cardId.startsWith(CUSTOM_HANDTRAP_PREFIX);
}

export function resolveCustomHandtrapCards(
  cards: UserHandtrapCard[],
): ResolvedCustomHandtrapCard[] {
  return cards.map((card) => ({
    ...card,
    rawId: card.id,
    id: toCustomHandtrapId(card.id),
    isCustom: true,
  }));
}

export function getHandtrapName(card: ResolvedHandtrapCard, language: string) {
  if ('isCustom' in card) return card.name;
  if (language.startsWith('en')) return card.nameEn;
  if (language.startsWith('ko')) return card.nameKo;
  return card.nameJa;
}

export function getHandtrapNameFromId(
  handtrapId: string,
  language: string,
  customCards: UserHandtrapCard[],
) {
  const defaultCard = DEFAULT_HANDTRAP_CARDS.find((card) => card.id === handtrapId);
  if (defaultCard) return getHandtrapName(defaultCard, language);

  const customCard = customCards.find((card) => toCustomHandtrapId(card.id) === handtrapId);
  if (customCard) return customCard.name;

  return handtrapId;
}
