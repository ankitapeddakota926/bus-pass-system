import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Bus, Calendar, MapPin, User, Phone, BookOpen, Clock } from 'lucide-react';
import API_BASE from '../config';

const VerifyPass = () => {
  const { passId } = useParams();
  const [pass, setPass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/applications/verify/${passId}`)
      .then(({ data }) => setPass(data))
      .catch(() => setPass({ valid: false, status: 'Not Found' }))
      .finally(() => setLoading(false));
  }, [passId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verifying pass...</p>
      </div>
    </div>
  );

  const isValid = pass?.valid;
  const isExpired = pass?.status === 'Expired';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '0.4rem', borderRadius: '8px', color: 'white', display: 'flex' }}>
              <Bus size={18} strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Transit<span style={{ color: 'var(--primary)' }}>Pass</span></span>
          </Link>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pass Verification</p>
        </div>

        {/* Status Banner */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-xl)',
          background: isValid ? 'linear-gradient(135deg, #10B981, #059669)' : isExpired ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: 'white',
          textAlign: 'center',
          marginBottom: '1.25rem',
          boxShadow: isValid ? '0 8px 24px rgba(16,185,129,0.4)' : '0 8px 24px rgba(239,68,68,0.4)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {isValid ? '✅' : isExpired ? '⏰' : '❌'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>
            {isValid ? 'VALID PASS' : isExpired ? 'EXPIRED PASS' : 'INVALID PASS'}
          </div>
          <div style={{ opacity: 0.85, fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {isValid ? 'This pass is authentic and active' : isExpired ? 'This pass has expired' : 'This pass is not valid'}
          </div>
        </div>

        {/* Pass Details */}
        {pass && pass.passId && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pass ID</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.25rem' }}>{pass.passId}</div>
              <span className={`badge ${isValid ? 'badge-success' : isExpired ? 'badge-warning' : 'badge-danger'}`} style={{ marginTop: '0.5rem' }}>
                {pass.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[
                { icon: <User size={15} />, label: 'Student Name', value: pass.name },
                { icon: <Phone size={15} />, label: 'Phone', value: pass.phone },
                { icon: <BookOpen size={15} />, label: 'College', value: pass.college },
                { icon: <BookOpen size={15} />, label: 'Course & Year', value: `${pass.course} — ${pass.year}` },
                { icon: <MapPin size={15} />, label: 'Route', value: pass.route },
                { icon: <Bus size={15} />, label: 'Pass Type', value: pass.passType + ' Pass' },
                { icon: <Calendar size={15} />, label: 'Valid From', value: pass.validFrom ? new Date(pass.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { icon: <Clock size={15} />, label: 'Valid Until', value: pass.validUntil ? new Date(pass.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '1px', flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', marginTop: '0.1rem' }}>{value || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '1.25rem' }}>
          Verified by TransitPass · Municipal Transit Authority
        </p>
      </div>
    </div>
  );
};

export default VerifyPass;
