import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { assetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/users/me', form);
      updateUser(data.user);

      if (photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        const photoRes = await api.post('/users/me/photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser({ photoURL: photoRes.data.user.photoURL });
        setPhotoFile(null);
        setPhotoPreview('');
      }

      setMessage('Profile updated!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="card p-6">
        <div className="text-center mb-6">
          <div className="w-28 h-28 mx-auto rounded-full bg-taarof-50 overflow-hidden flex items-center justify-center">
            {photoPreview || user?.photoURL ? (
              <img
                src={photoPreview || assetUrl(user.photoURL)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-taarof-300">{user?.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <label className="btn-secondary inline-block cursor-pointer mt-3 text-sm">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-dune-900/70">Name</label>
            <input className="input-field mt-1" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-dune-900/70">Age</label>
            <input
              type="number"
              min={18}
              max={120}
              className="input-field mt-1"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-dune-900/70">Location</label>
            <input
              className="input-field mt-1"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-dune-900/70">Bio</label>
            <textarea
              rows={4}
              maxLength={500}
              className="input-field mt-1 resize-none"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
            />
          </div>

          {message && <p className="text-sm text-taarof-600">{message}</p>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <button
        onClick={() => {
          logout();
          navigate('/');
        }}
        className="btn-secondary w-full mt-4"
      >
        Log out
      </button>
    </div>
  );
}
