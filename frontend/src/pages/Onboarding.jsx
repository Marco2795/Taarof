import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STEPS = ['Basics', 'About you', 'Location', 'Photo'];

export default function Onboarding() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '',
    gender: '',
    interestedIn: 'everyone',
    bio: '',
    location: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function next() {
    setError('');
    if (step === 0 && (!form.age || !form.gender)) {
      setError('Please fill in your age and gender');
      return;
    }
    if (step === 2 && !form.location) {
      setError('Please tell us your location');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.put('/users/me', form);
      updateUser({ ...data.user, onboardingComplete: data.onboardingComplete });

      if (photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        const photoRes = await api.post('/users/me/photo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser({ photoURL: photoRes.data.user.photoURL });
      }

      navigate('/directory');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-lg p-8">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-taarof-500' : 'bg-gray-100'}`} />
          ))}
        </div>
        <h2 className="text-xl font-bold mb-1">{STEPS[step]}</h2>
        <p className="text-sm text-dune-900/50 mb-6">Step {step + 1} of {STEPS.length}</p>

        {step === 0 && (
          <div className="space-y-4">
            <input
              type="number"
              min={18}
              max={120}
              placeholder="Your age"
              className="input-field"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
            />
            <select className="input-field" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">I am…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
            <select
              className="input-field"
              value={form.interestedIn}
              onChange={(e) => set('interestedIn', e.target.value)}
            >
              <option value="everyone">Interested in everyone</option>
              <option value="male">Interested in men</option>
              <option value="female">Interested in women</option>
            </select>
          </div>
        )}

        {step === 1 && (
          <textarea
            rows={6}
            maxLength={500}
            placeholder="Tell people a little about yourself…"
            className="input-field resize-none"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
          />
        )}

        {step === 2 && (
          <input
            placeholder="City, Country (e.g. Algiers, Algeria)"
            className="input-field"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full bg-taarof-50 overflow-hidden flex items-center justify-center mb-4">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-taarof-300">📷</span>
              )}
            </div>
            <label className="btn-secondary inline-block cursor-pointer">
              Choose photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            <p className="text-xs text-dune-900/40 mt-2">Optional — you can add this later in Settings.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button onClick={back} className="btn-secondary flex-1">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="btn-primary flex-1">
              Continue
            </button>
          ) : (
            <button onClick={finish} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Enter Taarof'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
