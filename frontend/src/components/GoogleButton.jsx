import React, { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const t = setInterval(() => {
      if (!window.google?.accounts?.id) return;
      clearInterval(t);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline', size: 'large', width: 320, shape: 'pill',
      });
    }, 100);
    return () => clearInterval(t);
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="text-xs text-center text-dune-900/40">
        Set VITE_GOOGLE_CLIENT_ID to enable Google Sign-In
      </p>
    );
  }

  return <div ref={divRef} className="flex justify-center" />;
}
