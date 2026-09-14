import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  function load() {
    api.get('/messages/conversations').then(({ data }) => {
      setConversations(data.conversations);
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
  }, []);

  // Refresh the inbox whenever a new message arrives anywhere
  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('receive_message', handler);
    return () => socket.off('receive_message', handler);
  }, [socket]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {loading ? (
        <p className="text-center text-dune-900/40 py-16">Loading conversations…</p>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-dune-900/40 mb-4">No conversations yet.</p>
          <Link to="/directory" className="btn-primary inline-block">
            Discover members
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {conversations.map((c) => (
            <Link
              key={c.user.id}
              to={`/chat/${c.user.id}`}
              className="flex items-center gap-3 p-4 hover:bg-taarof-50/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-taarof-100 flex items-center justify-center overflow-hidden shrink-0">
                {c.user.photoURL ? (
                  <img src={assetUrl(c.user.photoURL)} alt={c.user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-semibold text-taarof-600">{c.user.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.user.name}</p>
                <p className="text-sm text-dune-900/50 truncate">
                  {c.lastMessage.imageURL ? '📷 Photo' : c.lastMessage.text}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="bg-taarof-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
