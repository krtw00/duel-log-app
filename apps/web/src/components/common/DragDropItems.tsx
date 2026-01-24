import { useState } from 'react';

export type DisplayItemKey =
  | 'currentDeck'
  | 'gameModeValue'
  | 'totalDuels'
  | 'winRate'
  | 'firstTurnWinRate'
  | 'secondTurnWinRate'
  | 'coinWinRate'
  | 'goFirstRate'
  | 'currentStreak'
  | 'recentResults'
  | 'sessionGraph'
  | 'milestone';

export type DisplayItem = {
  key: DisplayItemKey;
  selected: boolean;
};

export function DragDropItems({
  items,
  onChange,
  labelFn,
}: {
  items: DisplayItem[];
  onChange: (items: DisplayItem[]) => void;
  labelFn: (key: DisplayItemKey) => string;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragging(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => () => {
    setDragOver(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetIndex: number) => () => {
    if (dragging === null || dragging === targetIndex) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const newItems = [...items];
    const removed = newItems.splice(dragging, 1);
    if (removed[0]) {
      newItems.splice(targetIndex, 0, removed[0]);
    }
    onChange(newItems);
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const toggleItem = (index: number) => {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      newItems[index] = { ...item, selected: !item.selected };
      onChange(newItems);
    }
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={item.key}
          draggable
          onDragStart={handleDragStart(index)}
          onDragEnter={handleDragEnter(index)}
          onDragOver={handleDragOver}
          onDrop={handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`display-item-compact ${dragging === index ? 'dragging' : ''} ${dragOver === index && dragging !== index ? 'drag-over' : ''}`}
        >
          <span className="drag-handle-compact">⋮⋮</span>
          <input
            type="checkbox"
            checked={item.selected}
            onChange={() => toggleItem(index)}
            className="accent-[var(--color-primary)]"
          />
          <span className="text-sm" style={{ color: 'var(--color-on-surface)' }}>
            {labelFn(item.key)}
          </span>
        </div>
      ))}
    </div>
  );
}
