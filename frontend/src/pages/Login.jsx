import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Bus, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('user');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password, role);
    setLoading(false);
    if (res.success) {
      if (res.data.role !== role) {
        setError(`This account is registered as a ${res.data.role}, not ${role}. Please switch tabs.`);
        return;
      }
      navigate(res.data.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
    } else {
      setError(res.error || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      position: 'relative', overflow: 'hidden', background: 'var(--bg-app)',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-80px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-60px', right: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '40%', right: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            <Bus size={26} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>Sign in to your TransitPass account</p>
        </div>

        <div className="form-container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '1.75rem', gap: '0.25rem' }}>
            {[{ val: 'user', label: 'Student', icon: <User size={15} /> }, { val: 'admin', label: 'Admin', icon: <ShieldCheck size={15} /> }].map(r => (
              <button key={r.val} type="button" onClick={() => setRole(r.val)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: role === r.val ? 'var(--primary)' : 'transparent', color: role === r.val ? 'white' : 'var(--text-muted)', boxShadow: role === r.val ? '0 2px 8px rgba(99,102,241,0.35)' : 'none', transition: 'all 0.2s' }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" required className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ margin: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} required className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Student'}`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
