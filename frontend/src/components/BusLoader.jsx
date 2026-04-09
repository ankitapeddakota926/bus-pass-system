import React from 'react';

const BusLoader = ({ fullScreen = false, message = 'Loading...' }) => {
  const containerStyle = fullScreen ? {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'var(--bg-app)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  } : {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '4rem 2rem',
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative', width: '260px', marginBottom: '2rem' }}>

        {/* Road */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)', animation: 'roadMove 1.2s linear infinite' }} />
        </div>

        {/* Dashed road line */}
        <div style={{ position: 'absolute', bottom: '1px', left: 0, right: 0, height: '2px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '8px', animation: 'roadMove 0.6s linear infinite' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ width: '20px', height: '2px', background: 'var(--text-light)', borderRadius: '1px', flexShrink: 0 }} />
            ))}
          </div>
        </div>

        {/* Bus */}
        <div style={{ animation: 'busRide 1.2s ease-in-out infinite', display: 'inline-block', marginBottom: '8px' }}>
          <svg width="72" height="44" viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <rect x="2" y="4" width="64" height="32" rx="6" fill="#6366F1" />
            {/* Roof stripe */}
            <rect x="2" y="4" width="64" height="8" rx="6" fill="#4F46E5" />
            {/* Windows */}
            <rect x="8" y="10" width="12" height="10" rx="2" fill="#BAE6FD" opacity="0.9" />
            <rect x="24" y="10" width="12" height="10" rx="2" fill="#BAE6FD" opacity="0.9" />
            <rect x="40" y="10" width="12" height="10" rx="2" fill="#BAE6FD" opacity="0.9" />
            {/* Door */}
            <rect x="54" y="14" width="8" height="14" rx="2" fill="#4F46E5" />
            <rect x="56" y="18" width="4" height="6" rx="1" fill="#818CF8" />
            {/* Front light */}
            <rect x="58" y="8" width="6" height="4" rx="1" fill="#FDE68A" />
            {/* Bumper */}
            <rect x="2" y="33" width="64" height="4" rx="2" fill="#4338CA" />
            {/* Wheels */}
            <circle cx="16" cy="40" r="6" fill="#1E293B" />
            <circle cx="16" cy="40" r="3" fill="#64748B" />
            <circle cx="52" cy="40" r="6" fill="#1E293B" />
            <circle cx="52" cy="40" r="3" fill="#64748B" />
            {/* Headlight glow */}
            <ellipse cx="66" cy="20" rx="4" ry="3" fill="#FDE68A" opacity="0.4" />
            {/* Transit text */}
            <text x="18" y="30" fontSize="7" fill="white" fontFamily="Arial" fontWeight="bold">TRANSIT</text>
          </svg>
        </div>

        {/* Exhaust puffs */}
        <div style={{ position: 'absolute', left: '-8px', bottom: '12px', display: 'flex', gap: '4px', animation: 'puffFade 1.2s ease-in-out infinite' }}>
          {[10, 7, 5].map((size, i) => (
            <div key={i} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'var(--text-light)', opacity: 0.4 - i * 0.1, animation: `puffMove 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>

      {/* Message */}
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{message}</div>
      <div style={{ display: 'flex', gap: '5px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', animation: `dotBounce 1s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes busRide {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-3px); }
          75% { transform: translateY(-1px); }
        }
        @keyframes roadMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40px); }
        }
        @keyframes puffMove {
          0% { transform: translateX(0) scale(1); opacity: 0.4; }
          100% { transform: translateX(-20px) scale(1.5); opacity: 0; }
        }
        @keyframes puffFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BusLoader;
