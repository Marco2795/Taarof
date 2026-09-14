import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import ProfileCard from '../components/ProfileCard';
import ProfileModal from '../components/ProfileModal';
import { useSocket, computeIsOnline } from '../context/SocketContext';

export default function Directory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', minAge: '', maxAge: '', location: '', gender: '', onlineOnly: false });
  // The online-only filter is client-side (see loadProfiles below), so unlike
  // the other filters it doesn't go through a server round-trip. Without a
  // separate "applied" flag it would filter the list the instant the
  // checkbox is toggled, before "Apply filters" is even clicked — making the
  // button look like it does nothing when the user checks/unchecks it and
  // then presses Apply. Tracking it separately keeps ALL filters, including
  // this one, taking effect only on "Apply filters", like the rest of the form.
  const [appliedOnlineOnly, setAppliedOnlineOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { onlineOverrides, syncOnlineFromRest } = useSocket();

  const visibleProfiles = appliedOnlineOnly
    ? profiles.filter((p) => computeIsOnline(p, onlineOverrides))
    : profiles;

  async function loadProfiles(activeFilters = filters, silent = false) {
    if (!silent) setLoading(true);
    try {
      const params = {};
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (k === 'onlineOnly') return; // client-side only, not a backend filter
        if (v) params[k] = v;
      });
      const { data } = await api.get('/users', { params });
      setProfiles(data.users);
      syncOnlineFromRest(data.users); // heal any stale/missed presence updates
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quietly re-sync online status every 20s so a missed presence event
  // (e.g. a tab closing without a clean disconnect) can't stay stale forever
  useEffect(() => {
    const interval = setInterval(() => loadProfiles(filters, true), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setAppliedOnlineOnly(filters.onlineOnly);
    loadProfiles();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Discover members</h1>
          <p className="text-dune-900/50 text-sm">Every profile here is open to message — no matching required.</p>
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="btn-secondary text-sm">
          {showFilters ? 'Hide filters' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <form onSubmit={handleFilterSubmit} className="card p-4 mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <input
            placeholder="Search by name"
            className="input-field !py-2 col-span-2 sm:col-span-1"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Min age"
            className="input-field !py-2"
            value={filters.minAge}
            onChange={(e) => setFilters((f) => ({ ...f, minAge: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Max age"
            className="input-field !py-2"
            value={filters.maxAge}
            onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value }))}
          />
          <input
            placeholder="Location"
            className="input-field !py-2"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          />
          <select
            className="input-field !py-2"
            value={filters.gender}
            onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Any gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="nonbinary">Non-binary</option>
            <option value="other">Other</option>
          </select>
          <label className="input-field !py-2 flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.onlineOnly}
              onChange={(e) => setFilters((f) => ({ ...f, onlineOnly: e.target.checked }))}
              className="w-4 h-4 accent-taarof-500"
            />
            <span className="text-sm text-dune-900/70">Online only</span>
          </label>
          <button type="submit" className="btn-primary !py-2 col-span-2 sm:col-span-5">
            Apply filters
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center text-dune-900/40 py-16">Loading members…</p>
      ) : visibleProfiles.length === 0 ? (
        <p className="text-center text-dune-900/40 py-16">
          {appliedOnlineOnly ? 'No members online right now.' : 'No members match your filters yet.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProfiles.map((p) => (
            <ProfileCard key={p.id} profile={p} onViewProfile={setSelected} />
          ))}
        </div>
      )}

      <ProfileModal profile={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
