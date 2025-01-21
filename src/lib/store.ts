import { create } from 'zustand';
import { User, Notification } from '../types';

interface AppState {
  user: User | null;
  notifications: Notification[];
  setUser: (user: User | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  notifications: [],
  setUser: (user) => set({ user }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),
}));