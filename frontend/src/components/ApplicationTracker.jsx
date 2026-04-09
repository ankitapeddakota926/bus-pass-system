import React from 'react';
import { FileText, Search, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

const STEPS = [
  { key: 'applied',    label: 'Applied',       icon: <FileText size={16} />,     desc: 'Application submitted' },
  { key: 'review',     label: 'Under Review',  icon: <Search size={16} />,       desc: 'Admin is reviewing your documents' },
  { key: 'approved',   label: 'Approved',      icon: <CheckCircle size={16} />,  desc: 'Pass generated & active' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'Pending':    return 1; // applied + under review active
    case 'Approved':   return 2;
    case 'Expired':    return 2;
    case 'Rejected':   return -1; // special
    case 'Correction': return -2; // special
    default:           return 0;
  }
};

const statusMeta = {
  Approved:   { color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', label: 'Active Pass' },
  Pending:    { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', label: 'Under Review' },
  Rejected:   { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: 'Rejected' },
  Correction: { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', label: 'Correction Needed' },
  Expired:    { color: '#94A3B8', bg: '#F1F5F9', border: '#E2E8F0', label: 'Expired' },
};

const ApplicationTracker = ({ app, onRenew, renewLoading, renderBadge }) => {
  const stepIndex = getStepIndex(app.status);
  const meta = statusMeta[app.status] || statusMeta.Pending;
  const isRejected = app.status === 'Rejected';
  const isCorrection = app.status === 'Correction';
  const isSpecial = isRejected || isCorrection;

  return (
    <div className="card" style={{ padding: '1.75rem', borderLeft: `4px solid ${meta.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
            {app.route}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={12} />
            Applied on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            &nbsp;&bull;&nbsp;{app.passType} Pass
            {app.generatedPassId && <>&nbsp;&bull;&nbsp;<span style={{ fontWeight: 600, color: 'var(--primary)' }}>{app.generatedPassId}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {app.status === 'Expired' && (
            <button onClick={() => onRenew(app._id)} disabled={renewLoading} className="btn btn-sm btn-outline">
              <RefreshCw size={13} /> Renew
            </button>
          )}
          {renderBadge(app.status)}
        </div>
      </div>

      {/* Stepper */}
      {!isSpecial && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: app.status === 'Approved' || app.status === 'Expired' ? '1.25rem' : 0 }}>
          {STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            const color = done || active ? meta.color : '#CBD5E1';
            const bgColor = done ? meta.color : active ? meta.bg : '#F8FAFC';
            const textColor = done ? 'white' : active ? meta.color : '#94A3B8';

            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  {/* Circle */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: bgColor,
                    border: `2px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: textColor,
                    boxShadow: active ? `0 0 0 4px ${meta.color}22` : 'none',
                    transition: 'all 0.3s',
                    position: 'relative', zIndex: 1,
                  }}>
                    {done ? <CheckCircle size={16} color="white" /> : step.icon}
                  </div>
                  {/* Label */}
                  <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: active || done ? 'var(--text-main)' : 'var(--text-light)' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-light)', marginTop: '0.1rem', maxWidth: '90px' }}>
                      {step.desc}
                    </div>
                  </div>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 2, height: '2px', marginBottom: '1.5rem',
                    background: i < stepIndex ? meta.color : '#E2E8F0',
                    transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Rejected / Correction banner */}
      {isSpecial && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: meta.bg, border: `1px solid ${meta.border}`,
        }}>
          <div style={{ marginTop: '0.1rem', color: meta.color, flexShrink: 0 }}>
            {isRejected ? <XCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: meta.color, marginBottom: '0.25rem' }}>
              {isRejected ? 'Application Rejected' : 'Correction Required'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {app.rejectionReason || 'Please contact the admin for more details.'}
            </div>
          </div>
        </div>
      )}

      {/* Approved pass details */}
      {(app.status === 'Approved' || app.status === 'Expired') && app.validUntil && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', padding: '0.875rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
          {[
            ['Valid From', new Date(app.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
            ['Valid Until', new Date(app.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })],
            ['College', app.college],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
