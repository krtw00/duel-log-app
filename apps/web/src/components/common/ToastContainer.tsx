import { useEffect, useRef, useState } from 'react';
import { type Notification, useNotificationStore } from '../../stores/notificationStore.js';

const TYPE_STYLES: Record<Notification['type'], { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(0, 230, 118, 0.15)', border: 'var(--color-success)', icon: '✓' },
  error: { bg: 'rgba(255, 61, 113, 0.15)', border: 'var(--color-error)', icon: '✕' },
  warning: { bg: 'rgba(255, 170, 0, 0.15)', border: 'var(--color-warning)', icon: '⚠' },
  info: { bg: 'rgba(0, 217, 255, 0.15)', border: 'var(--color-primary)', icon: 'ℹ' },
};

function ToastItem({ notification }: { notification: Notification }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => dismiss(notification.id), 300);
    }, notification.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification.id, notification.duration, dismiss]);

  const style = TYPE_STYLES[notification.type];

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '240px',
        maxWidth: '360px',
      }}
    >
      <span style={{ color: style.border, fontWeight: 'bold', fontSize: '1rem' }}>
        {style.icon}
      </span>
      <span style={{ color: 'var(--color-on-surface)', fontSize: '0.875rem', flex: 1 }}>
        {notification.message}
      </span>
      <button
        type="button"
        onClick={() => {
          setExiting(true);
          setTimeout(() => dismiss(notification.id), 300);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-on-surface-muted)',
          cursor: 'pointer',
          padding: '2px',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const notifications = useNotificationStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} />
      ))}
    </div>
  );
}
