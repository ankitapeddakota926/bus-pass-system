import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Eye, EyeOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', password: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await register(formData.name, formData.email, formData.password, formData.phone, formData.address, formData.role);
    setLoading(false);
    if (res.success) navigate(formData.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
    else setError(res.error || 'Registration failed');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 65px)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '2rem',
      position: 'relative', overflow: 'hidden', background: 'var(--bg-app)',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-60px', left: '-60px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '30%', left: '8%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '14px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
            <Bus size={26} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>Join TransitPass and go paperless</p>
        </div>

        <div className="form-container" style={{ padding: '2rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Full Name</label>
                <input type="text" name="name" required className="form-control" value={formData.name} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Phone Number</label>
                <input type="tel" name="phone" required className="form-control" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label>Email Address</label>
              <input type="email" name="email" required className="form-control" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" required className="form-control" value={formData.address} onChange={handleChange} placeholder="123 Main St, City" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} name="password" required className="form-control" value={formData.password} onChange={handleChange} placeholder="Create a strong password" style={{ paddingRight: '2.75rem' }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Register As</label>
              <select name="role" value={formData.role} onChange={handleChange} className="form-control">
                <option value="user">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
