import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { assetUrl } from '../api/axios';
import { useIsOnline, useSocket } from '../context/SocketContext';
import ChatWindow from '../components/ChatWindow';

export default function Chat() {
  const { userId } = useParams();
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOnline = useIsOnline(otherUser);
  const { syncOnlineFromRest } = useSocket();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${userId}`)
      .then(({ data }) => {
        setOtherUser(data.user);
        syncOnlineFromRest(data.user); // heal any stale/missed presence updates
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Quietly re-check every 20s in case a presence event was missed
  // (e.g. the other person's tab closed without a clean disconnect)
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/users/${userId}`).then(({ data }) => syncOnlineFromRest(data.user));
    }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) return <p className="text-center py-16 text-dune-900/40">Loading chat…</p>;
  if (!otherUser) return <p className="text-center py-16 text-dune-900/40">User not found.</p>;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <Link to="/inbox" className="text-dune-900/50 hover:text-taarof-600">
          ←
        </Link>
        <div className="w-10 h-10 rounded-full bg-taarof-100 flex items-center justify-center overflow-hidden">
          {otherUser.photoURL ? (
            <img src={assetUrl(otherUser.photoURL)} alt={otherUser.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-taarof-600">{otherUser.name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="font-semibold">{otherUser.name}</p>
          <p className="text-xs text-dune-900/40">{isOnline ? 'Online' : 'Offline'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow otherUser={otherUser} />
      </div>
    </div>
  );
}
