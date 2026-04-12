'use client';

import React, { useState, useEffect } from 'react';

export default function IntroVideo({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem('intro_seen');
    if (!seen) setShow(true);
  }, []);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('intro_seen', '1');
    }, 600);
  };

  if (!show) return <>{children}</>;

  return (
    <>
      {/* Intro overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease',
      }}>
        <video
          src="/find_blue_banner.mp4"
          autoPlay
          muted
          playsInline
          onEnded={dismiss}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <button
          onClick={dismiss}
          style={{
            position: 'absolute', top: 32, right: 32,
            padding: '10px 24px', borderRadius: 8,
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'system-ui',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          Skip ➤
        </button>
      </div>
      {/* Site content hidden behind */}
      <div style={{ visibility: 'hidden' }}>{children}</div>
    </>
  );
}
