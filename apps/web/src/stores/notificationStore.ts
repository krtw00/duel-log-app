import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type Notification = {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
};

type NotificationStore = {
  notifications: Notification[];
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
};

let idCounter = 0;

function generateId(): string {
  return `toast-${Date.now()}-${++idCounter}`;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  success: (message: string) => {
    const id = generateId();
    set((state) => ({
      notifications: [...state.notifications, { id, type: 'success', message, duration: 3000 }],
    }));
  },
  error: (message: string) => {
    const id = generateId();
    set((state) => ({
      notifications: [...state.notifications, { id, type: 'error', message, duration: 5000 }],
    }));
  },
  warning: (message: string) => {
    const id = generateId();
    set((state) => ({
      notifications: [...state.notifications, { id, type: 'warning', message, duration: 4000 }],
    }));
  },
  info: (message: string) => {
    const id = generateId();
    set((state) => ({
      notifications: [...state.notifications, { id, type: 'info', message, duration: 3000 }],
    }));
  },
  dismiss: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
