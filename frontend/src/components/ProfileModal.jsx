import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assetUrl } from '../api/axios';

export default function ProfileModal({ profile, onClose }) {
  const navigate = useNavigate();
  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-square bg-taarof-50">
          {profile.photoURL ? (
            <img src={assetUrl(profile.photoURL)} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl font-bold text-taarof-300">
              {profile.name?.[0]?.toUpperCase()}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-lg"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold">
            {profile.name}
            {profile.age ? <span className="font-normal text-dune-900/60">, {profile.age}</span> : null}
          </h2>
          <p className="text-dune-900/50 mt-1">{profile.location || 'Location not set'}</p>

          {profile.gender && (
            <span className="inline-block mt-3 text-xs font-medium bg-taarof-50 text-taarof-600 px-3 py-1 rounded-full capitalize">
              {profile.gender}
            </span>
          )}

          <p className="mt-4 text-dune-900/80 leading-relaxed">{profile.bio || 'This member hasn\'t written a bio yet.'}</p>

          <button onClick={() => navigate(`/chat/${profile.id}`)} className="btn-primary w-full mt-6">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
