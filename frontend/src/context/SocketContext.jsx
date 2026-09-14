import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Live overrides for user online/offline status, keyed by userId.
  // Populated from 'presence_update' socket events as they arrive, and
  // "healed" whenever fresh REST data comes in (see syncOnlineFromRest).
  const [onlineOverrides, setOnlineOverrides] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('taarof_token');
    if (!user || !token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('presence_update', ({ userId, isActive }) => {
      setOnlineOverrides((prev) => ({ ...prev, [userId]: isActive }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Make sure the server hears about it right away when the tab actually
  // closes/navigates away, instead of waiting for the ping-timeout to
  // notice the dead connection (which could otherwise leave a user
  // looking "online" for a while after they're gone).
  useEffect(() => {
    function handleUnload() {
      socketRef.current?.disconnect();
    }
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  // Reconciles onlineOverrides with fresh isActive values from a REST
  // response (a single user object or an array of them). This "heals"
  // the online/offline map if a live presence_update was ever missed,
  // so a stale status can't get stuck forever.
  const syncOnlineFromRest = useCallback((usersOrUser) => {
    const list = Array.isArray(usersOrUser) ? usersOrUser : [usersOrUser];
    setOnlineOverrides((prev) => {
      const next = { ...prev };
      for (const u of list) {
        if (u && u.id) next[u.id] = !!u.isActive;
      }
      return next;
    });
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineOverrides, syncOnlineFromRest }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

// Resolves whether a profile is online, preferring a live socket update
// (onlineOverrides) over the possibly-stale value from a REST fetch.
export function useIsOnline(profile) {
  const { onlineOverrides } = useSocket();
  if (!profile) return false;
  const live = onlineOverrides[profile.id];
  return live !== undefined ? live : !!profile.isActive;
}

// Non-hook version for use inside .filter()/.map() callbacks, where hooks
// can't be called per-item.
export function computeIsOnline(profile, onlineOverrides) {
  if (!profile) return false;
  const live = onlineOverrides[profile.id];
  return live !== undefined ? live : !!profile.isActive;
}
