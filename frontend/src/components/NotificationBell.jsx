import React, { useState, useEffect, useRef, useContext } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import API_BASE from '../config';

const typeColors = { success: '#10B981', danger: '#EF4444', warning: '#F59E0B', info: '#6366F1' };
const typeBg = { success: '#ECFDF5', danger: '#FEF2F2', warning: '#FFFBEB', info: '#EEF2FF' };

const NotificationBell = () => {
  const { user, getAuthConfig } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/notifications`, getAuthConfig());
      setNotifications(data);
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_BASE}/api/notifications/read-all`, {}, getAuthConfig());
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, getAuthConfig());
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '9999px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <Bell size={16} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: '-3px', right: '-3px', background: 'var(--danger)', color: 'white', borderRadius: '9999px', width: '16px', height: '16px', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '44px', right: 0, width: '340px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Notifications {unread > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.65rem', marginLeft: '0.3rem' }}>{unread}</span>}</span>
            {unread > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCheck size={13} /> Mark all read</button>}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications yet</div>
            ) : notifications.map(n => (
              <div key={n._id} onClick={() => markRead(n._id)} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.read ? 'transparent' : typeBg[n.type] || '#EEF2FF', transition: 'background 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: '0.85rem', color: typeColors[n.type] || 'var(--primary)', marginBottom: '0.2rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: typeColors[n.type] || 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
