import React, { useState, useEffect, useContext } from 'react';
import { X, Megaphone } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';

const typeStyles = {
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8', icon: '#3B82F6' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '#F59E0B' },
  success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', icon: '#10B981' },
  danger:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '#EF4444' },
};

const AnnouncementBanner = () => {
  const { user, getAuthConfig } = useContext(AuthContext);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!user) return;
    axios.get(`${API_BASE}/api/announcements`, getAuthConfig())
      .then(({ data }) => setAnnouncements(data))
      .catch(() => {});
  }, [user]);

  const dismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
  };

  const visible = announcements.filter(a => !dismissed.includes(a._id));
  if (!visible.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1.5rem 0' }}>
      {visible.map(a => {
        const s = typeStyles[a.type] || typeStyles.info;
        return (
          <div key={a._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 'var(--radius-md)', color: s.color }}>
            <Megaphone size={16} color={s.icon} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{a.title}: </span>
              <span style={{ fontSize: '0.85rem' }}>{a.message}</span>
            </div>
            <button onClick={() => dismiss(a._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, display: 'flex', padding: '0', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementBanner;
