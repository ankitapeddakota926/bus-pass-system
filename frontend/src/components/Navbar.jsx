import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useDarkMode from '../hooks/useDarkMode';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      height: '65px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          padding: '0.45rem',
          borderRadius: '10px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(99,102,241,0.35)'
        }}>
          <Bus size={20} strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Transit<span style={{ color: 'var(--primary)' }}>Pass</span>
        </span>
      </Link>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="dark-toggle"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '9999px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {user && <NotificationBell />}
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.875rem', background: 'var(--bg-subtle)', borderRadius: '9999px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name?.split(' ')[0]}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'capitalize' }}>{user.role}</span>
            </div>
            <Link to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogOut size={15} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
