import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <span className="text-6xl">💫</span>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4 text-dune-900">
          Taarof <span className="text-taarof-500">تعارف</span>
        </h1>
        <p className="text-dune-900/60 mt-4 text-lg">
          A welcoming space to meet new people, start real conversations, and connect — completely free,
          no matches required, no subscriptions ever.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link to="/signup" className="btn-primary">
            Join for free
          </Link>
          <Link to="/login" className="btn-secondary">
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
