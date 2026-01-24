import type { Deck } from '@duel-log/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  decks: Deck[];
  value: string; // deck ID or empty
  onChange: (deckId: string, deckName: string) => void;
  placeholder?: string;
  id?: string;
  error?: string;
};

export function DeckCombobox({ decks, value, onChange, placeholder, id, error }: Props) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync input text when value (deckId) changes externally
  useEffect(() => {
    if (value) {
      const deck = decks.find((d) => d.id === value);
      if (deck) {
        setInputText(deck.name);
      }
    } else {
      // Keep current inputText if it's a new name being typed
    }
  }, [value, decks]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDecks = decks.filter((d) => d.name.toLowerCase().includes(inputText.toLowerCase()));

  const exactMatch = decks.find((d) => d.name.toLowerCase() === inputText.trim().toLowerCase());
  const showCreateOption = inputText.trim().length > 0 && !exactMatch;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    setIsOpen(true);
    setHighlightIndex(-1);

    // If text matches an existing deck exactly, select it
    const match = decks.find((d) => d.name.toLowerCase() === text.trim().toLowerCase());
    if (match) {
      onChange(match.id, match.name);
    } else {
      // New deck name - pass empty ID with the name
      onChange('', text.trim());
    }
  };

  const handleSelect = (deck: Deck) => {
    setInputText(deck.name);
    onChange(deck.id, deck.name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleCreateNew = () => {
    // Keep the text as-is, pass empty ID to signal "new deck"
    onChange('', inputText.trim());
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const totalItems = filteredDecks.length + (showCreateOption ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0) {
          const deck = filteredDecks[highlightIndex];
          if (highlightIndex < filteredDecks.length && deck) {
            handleSelect(deck);
          } else if (showCreateOption) {
            handleCreateNew();
          }
        } else {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? t('duel.selectOrInputDeck')}
        className="themed-input"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      {error && (
        <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      {isOpen && totalItems > 0 && (
        <ul ref={listRef} className="combobox-dropdown" role="listbox">
          {filteredDecks.map((deck, index) => (
            <li
              key={deck.id}
              role="option"
              aria-selected={highlightIndex === index}
              className={`combobox-option ${highlightIndex === index ? 'highlighted' : ''} ${deck.id === value ? 'selected' : ''}`}
              onClick={() => handleSelect(deck)}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              {deck.name}
            </li>
          ))}
          {showCreateOption && (
            <li
              role="option"
              aria-selected={highlightIndex === filteredDecks.length}
              className={`combobox-option combobox-create ${highlightIndex === filteredDecks.length ? 'highlighted' : ''}`}
              onClick={handleCreateNew}
              onMouseEnter={() => setHighlightIndex(filteredDecks.length)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('duel.createDeck', { name: inputText.trim() })}</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
