import React, { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Bus, ShieldCheck, QrCode, CreditCard, ArrowRight, CheckCircle, Zap, Clock, MapPin, Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const features = [
  { icon: <Bus size={22} />, title: 'Apply Online', desc: 'Submit your bus pass application in minutes from anywhere.' },
  { icon: <ShieldCheck size={22} />, title: 'Verified & Secure', desc: 'ID-verified passes with tamper-proof QR codes.' },
  { icon: <QrCode size={22} />, title: 'Digital Pass', desc: 'Carry your pass on your phone, download as PDF anytime.' },
  { icon: <CreditCard size={22} />, title: 'Easy Payments', desc: 'Pay securely via UPI, debit/credit card, or net banking.' },
  { icon: <MapPin size={22} />, title: 'Live Bus Tracking', desc: 'Track your bus in real-time with ETA updates.' },
  { icon: <Bell size={22} />, title: 'Smart Notifications', desc: 'Get alerts for approvals, renewals, and announcements.' },
];

const steps = [
  { icon: <Zap size={20} />, label: 'Register', desc: 'Create your student account' },
  { icon: <Bus size={20} />, label: 'Apply', desc: 'Fill form & upload documents' },
  { icon: <Clock size={20} />, label: 'Review', desc: 'Admin verifies your application' },
  { icon: <CheckCircle size={20} />, label: 'Get Pass', desc: 'Download your digital pass' },
];

const Home = () => {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>

      {/* ── Hero ── */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem', maxWidth: '1100px', textAlign: 'center' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--primary-light)', color: 'var(--primary)',
            padding: '0.4rem 1rem', borderRadius: '9999px',
            fontWeight: 700, fontSize: '0.8rem', marginBottom: '2rem', letterSpacing: '0.03em'
          }}>
            <Bus size={15} /> MUNICIPAL TRANSIT AUTHORITY
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: '1.5rem'
          }}>
            Your city pass,<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              fully digital.
            </span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '560px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7
          }}>
            Apply for, renew, and carry your student transit pass in one secure platform. No queues, no paperwork.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ borderRadius: '9999px', gap: '0.5rem' }}>
              Get Your Pass <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg" style={{ borderRadius: '9999px' }}>
              Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
            {['Instant Approval', 'QR Verified', 'Secure Payments', '24/7 Access'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                <CheckCircle size={15} color="var(--success)" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="container" style={{ maxWidth: '1100px', paddingTop: '4rem', paddingBottom: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '2rem', fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em', marginBottom: '0.5rem'
          }}>
            Everything you need
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>One platform for the entire pass lifecycle.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '1.75rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="container" style={{ maxWidth: '1100px', paddingTop: '2rem', paddingBottom: '5rem' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '1.75rem', fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.03em', marginBottom: '0.4rem'
            }}>
              How it works
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Get your pass in 4 simple steps.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  Step {i + 1}
                </div>
                <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>{s.label}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
