import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import api, { assetUrl } from '../api/axios';

// Simple in-memory cache so we don't re-fetch a sender's name/photo on every message
const userCache = new Map();
const TOAST_DURATION = 5000;

// Renders the in-app toast popup stack AND fires a native browser
// notification when the user isn't already looking at that chat / tab.
export default function NotificationListener() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { refreshUnread } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // Ask for browser notification permission once, right after login
  useEffect(() => {
    if (!user) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user]);

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    if (!socket || !user) return;

    async function handleReceive(msg) {
      // Only notify for messages sent TO me, not echoes of my own messages
      if (msg.receiver !== user.id || msg.sender === user.id) return;

      const onThatChat = locationRef.current.pathname === `/chat/${msg.sender}`;
      const tabVisible = document.visibilityState === 'visible';

      // Keep the "Messages" badge count accurate regardless of where we are
      refreshUnread();

      if (onThatChat && tabVisible) return; // already looking at this conversation

      let sender = userCache.get(msg.sender);
      if (!sender) {
        try {
          const { data } = await api.get(`/users/${msg.sender}`);
          sender = data.user;
          userCache.set(msg.sender, sender);
        } catch {
          sender = { name: 'New message' };
        }
      }

      // In-app toast popup, shown regardless of browser notification permission
      const id = `${msg._id || Date.now()}-${Math.random()}`;
      setToasts((prev) => [
        ...prev.slice(-2), // keep at most 3 toasts on screen
        { id, senderId: msg.sender, senderName: sender.name, photoURL: sender.photoURL, imageURL: msg.imageURL, text: msg.text },
      ]);
      setTimeout(() => dismissToast(id), TOAST_DURATION);

      // Native browser notification (useful when the tab isn't focused)
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(`${sender.name} • Taarof`, {
          body: msg.imageURL ? '📷 Sent a photo' : msg.text,
          tag: `taarof-chat-${msg.sender}`, // groups repeated notifications from the same sender
        });
        notif.onclick = () => {
          window.focus();
          navigate(`/chat/${msg.sender}`);
          notif.close();
        };
      }
    }

    socket.on('receive_message', handleReceive);
    return () => socket.off('receive_message', handleReceive);
  }, [socket, user, navigate, refreshUnread]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-[90vw] max-w-sm">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            navigate(`/chat/${t.senderId}`);
            dismissToast(t.id);
          }}
          className="animate-toast-in flex items-start gap-3 bg-white border border-gray-100 shadow-lg rounded-2xl p-3 text-left hover:bg-taarof-50/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-taarof-100 flex items-center justify-center overflow-hidden shrink-0">
            {t.photoURL ? (
              <img src={assetUrl(t.photoURL)} alt={t.senderName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold text-taarof-600">{t.senderName?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{t.senderName}</p>
            <p className="text-sm text-dune-900/60 truncate">{t.imageURL ? '📷 Sent a photo' : t.text}</p>
          </div>
          <span
            onClick={(e) => {
              e.stopPropagation();
              dismissToast(t.id);
            }}
            className="text-dune-900/30 hover:text-dune-900/60 text-lg leading-none px-1"
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
