import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assetUrl } from '../api/axios';
import { useIsOnline } from '../context/SocketContext';

export default function ProfileCard({ profile, onViewProfile }) {
  const navigate = useNavigate();
  const isOnline = useIsOnline(profile);

  return (
    <div className="card overflow-hidden flex flex-col group">
      <button onClick={() => onViewProfile(profile)} className="relative aspect-[4/5] w-full bg-taarof-50 overflow-hidden">
        {profile.photoURL ? (
          <img
            src={assetUrl(profile.photoURL)}
            alt={profile.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-taarof-300">
            {profile.name?.[0]?.toUpperCase()}
          </div>
        )}
        {isOnline && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 text-xs font-medium text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Online
          </span>
        )}
      </button>

      <div className="p-4 flex-1 flex flex-col">
        <button onClick={() => onViewProfile(profile)} className="text-left">
          <h3 className="font-semibold text-lg text-dune-900">
            {profile.name}
            {profile.age ? <span className="font-normal text-dune-900/60">, {profile.age}</span> : null}
          </h3>
          <p className="text-sm text-dune-900/50 truncate">{profile.location || 'Location not set'}</p>
        </button>
        <p className="text-sm text-dune-900/70 mt-2 line-clamp-2 flex-1">{profile.bio || 'No bio yet.'}</p>

        <button
          onClick={() => navigate(`/chat/${profile.id}`)}
          className="btn-primary w-full mt-4 !py-2 text-sm"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}
