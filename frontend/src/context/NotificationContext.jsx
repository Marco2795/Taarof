import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const NotificationContext = createContext(null);

// Tracks the total number of unread messages across all conversations so
// any component (Navbar badge, page title, etc.) can read it without
// re-fetching conversations itself.
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    api
      .get('/messages/conversations')
      .then(({ data }) => {
        const total = data.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});
  }, [user]);

  // Load once on login/app start, and whenever the logged-in user changes
  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
