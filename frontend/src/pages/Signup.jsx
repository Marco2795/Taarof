import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';

export default function Signup() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential) {
    setError('');
    try {
      const data = await loginWithGoogle(credential);
      navigate(data.user.onboardingComplete ? '/directory' : '/onboarding');
    } catch (err) {
      setError('Google sign-in failed');
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">💫</span>
          <h1 className="font-display text-2xl font-bold mt-2">
            Join Taarof <span className="text-dune-900/40">تعارف</span>
          </h1>
          <p className="text-dune-900/50 text-sm mt-1">100% free — no subscriptions, ever.</p>
        </div>

        <GoogleButton onCredential={handleGoogle} />

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-dune-900/40">or</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Full name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            required
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min. 6 characters)"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create free account'}
          </button>
        </form>

        <p className="text-center text-sm text-dune-900/60 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-taarof-600 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
