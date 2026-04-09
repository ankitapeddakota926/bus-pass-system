import React, { useState, useEffect, useContext } from 'react';
import { CreditCard, FileText, History, LayoutDashboard, LogOut, CheckCircle, Clock, AlertCircle, UploadCloud, X, Download, Bus, User, Navigation, MessageSquare, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PaymentsTab from '../components/PaymentsTab';
import ApplicationTracker from '../components/ApplicationTracker';
import BusLoader from '../components/BusLoader';
import API_BASE from '../config';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const { user, getAuthConfig, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', phone: '', address: '', currentPassword: '', newPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [complaintForm, setComplaintForm] = useState({ type: 'Complaint', category: 'Other', subject: '', message: '' });
  const [complaintMsg, setComplaintMsg] = useState({ type: '', text: '' });
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' });
  const [emergencyMsg, setEmergencyMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', college: '', course: '', year: '', address: '', route: '', age: '', gender: '', distanceKm: '', passDuration: 'Monthly', areaType: 'Mofussil' });
  const [documents, setDocuments] = useState({ applicationForm: null, bonaFideCertificate: null, aadhaarCard: null, feeReceipt: null, photograph: null, casteCertificate: null, previousIdCard: null });
  const [applyMsg, setApplyMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || user.role !== 'user') navigate('/login');
    else { setFormData(prev => ({ ...prev, name: user.name, email: user.email })); fetchApplications(); fetchRoutes(); fetchComplaints();
      if (user.emergencyContact) setEmergencyContact(user.emergencyContact);
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/routes`);
      setRoutes(data);
    } catch (err) { console.error(err); }
  };

  const fetchComplaints = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/complaints/my`, getAuthConfig());
      setComplaints(data);
    } catch (err) { console.error(err); }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    setComplaintMsg({ type: '', text: '' });
    setComplaintLoading(true);
    try {
      await axios.post(`${API_BASE}/api/complaints`, complaintForm, getAuthConfig());
      setComplaintMsg({ type: 'success', text: `${complaintForm.type} submitted successfully!` });
      setComplaintForm({ type: 'Complaint', category: 'Other', subject: '', message: '' });
      fetchComplaints();
    } catch (err) {
      setComplaintMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally { setComplaintLoading(false); }
  };

  const saveEmergencyContact = async (e) => {
    e.preventDefault();
    setEmergencyMsg({ type: '', text: '' });
    try {
      const { data } = await axios.put(`${API_BASE}/api/auth/profile`, { emergencyContact }, getAuthConfig());
      localStorage.setItem('busPassUserInfo', JSON.stringify(data));
      setEmergencyMsg({ type: 'success', text: 'Emergency contact saved!' });
    } catch (err) {
      setEmergencyMsg({ type: 'error', text: 'Failed to save' });
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/applications/my`, getAuthConfig());
      setApplications(data);
    } catch (err) { console.error(err); }
    finally { setDataLoading(false); }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setApplyMsg({ type: '', text: '' });
    setLoading(true);
    const payload = new FormData();
    Object.keys(formData).forEach(k => payload.append(k, formData[k]));
    Object.keys(documents).forEach(k => { if (documents[k]) payload.append(k, documents[k]); });
    try {
      const res = await axios.post(`${API_BASE}/api/applications/apply-pass`, payload, {
        headers: { ...getAuthConfig().headers, 'Content-Type': 'multipart/form-data' }
      });
      setApplyMsg({ type: 'success', text: res.data.message || 'Application submitted successfully' });
      setFormData({ name: user.name, email: user.email, phone: '', college: '', course: '', year: '', address: '', route: '', age: '', gender: '', distanceKm: '', passDuration: 'Monthly', areaType: 'Mofussil' });
      setDocuments({ applicationForm: null, bonaFideCertificate: null, aadhaarCard: null, feeReceipt: null, photograph: null, casteCertificate: null, previousIdCard: null });
      fetchApplications();
      setTimeout(() => setActiveTab('History'), 2000);
    } catch (err) {
      setApplyMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally { setLoading(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setProfileLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE}/api/auth/profile`, profileData, getAuthConfig());
      localStorage.setItem('busPassUserInfo', JSON.stringify(data));
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setProfileData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally { setProfileLoading(false); }
  };

  const handleRenew = async (id) => {    try {
      setRenewLoading(true);
      const res = await axios.post(`${API_BASE}/api/applications/renew/${id}`, {}, getAuthConfig());
      alert(res.data.message);
      fetchApplications();
    } catch (err) { alert(err.response?.data?.message || err.message); }
    finally { setRenewLoading(false); }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/applications/${activeApp._id}/download-pass`,
        { ...getAuthConfig(), responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BusPass_${activeApp.generatedPassId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download pass. Please try again.');
    }
  };

  const activeApp = applications.find(a => a.status === 'Approved');

  const renderBadge = (status) => {
    const map = { Approved: 'badge-success', Pending: 'badge-warning', Rejected: 'badge-danger', Correction: 'badge-info', Expired: 'badge-secondary' };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  const tabs = [
    { id: 'Overview', icon: <LayoutDashboard size={17} /> },
    { id: 'Apply for Pass', icon: <FileText size={17} /> },
    { id: 'History', icon: <History size={17} /> },
    { id: 'Payments', icon: <CreditCard size={17} /> },
    { id: 'Complaints', icon: <MessageSquare size={17} /> },
    { id: 'Profile', icon: <User size={17} /> },
  ];
  const docFields = [
    { key: 'applicationForm', label: 'Application Form', required: true, accept: '.pdf,image/*' },
    { key: 'bonaFideCertificate', label: 'Bona Fide Certificate', required: true, accept: '.pdf,image/*' },
    { key: 'aadhaarCard', label: 'Aadhaar Card', required: true, accept: '.pdf,image/*' },
    { key: 'feeReceipt', label: 'Fee Receipt', required: true, accept: '.pdf,image/*' },
    { key: 'photograph', label: 'Photograph', required: true, accept: 'image/*' },
    { key: 'casteCertificate', label: 'Caste Certificate', required: false, accept: '.pdf,image/*' },
    { key: 'previousIdCard', label: 'Previous ID Card', required: false, accept: '.pdf,image/*' },
  ];

  return (
    <div className="dashboard-grid">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Student</div>
            </div>
          </div>
        </div>
        <ul className="sidebar-menu">
          {tabs.map(t => (
            <li key={t.id}>
              <button className={activeTab === t.id ? 'active' : ''} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.id}
              </button>
            </li>
          ))}
          <li style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--danger)' }}>
              <LogOut size={17} /> Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Content */}
      <main className="dashboard-content">
        {dataLoading ? <BusLoader message="Loading your dashboard" /> : (<>

        {/* ── Overview ── */}
        {activeTab === 'Overview' && (
          <div>
            <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="section-sub">Here's a summary of your transit pass status.</p>

            {activeApp ? (
              <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', padding: '2rem', borderRadius: 'var(--radius-xl)', marginBottom: '2rem', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '30%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.85, marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle size={16} /> Active Pass
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                      <div style={{ opacity: 0.7, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Pass ID</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{activeApp.generatedPassId}</div>
                      <div style={{ marginTop: '0.5rem', opacity: 0.85, fontSize: '0.9rem' }}>{activeApp.passType} Pass &bull; {activeApp.route}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ opacity: 0.7, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Valid Until</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{new Date(activeApp.validUntil).toLocaleDateString()}</div>
                      <button onClick={() => setShowPassModal(true)} style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '9999px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                        View Pass & QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card empty-state" style={{ marginBottom: '2rem', padding: '3rem' }}>
                <div className="empty-state-icon"><Bus size={52} /></div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No Active Pass</h3>
                <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>You don't have a valid bus pass yet.</p>
                <button onClick={() => setActiveTab('Apply for Pass')} className="btn btn-primary">Apply Now</button>
              </div>
            )}

            {/* Recent */}
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="var(--primary)" /> Recent Activity
            </h2>
            <div className="data-table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Route</th><th>Status</th></tr></thead>
                <tbody>
                  {applications.slice(0, 4).map(app => (
                    <tr key={app._id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={14} color="var(--text-light)" />{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="td-main">{app.route}</td>
                      <td>{renderBadge(app.status)}</td>
                    </tr>
                  ))}
                  {applications.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No activity yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Apply ── */}
        {activeTab === 'Apply for Pass' && (
          <div>
            <h1 className="section-title">Apply for Bus Pass</h1>
            <p className="section-sub">Fill in your details and upload the required documents.</p>

            <div className="card" style={{ padding: '2rem' }}>
              {applyMsg.text && (
                <div className={`alert ${applyMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {applyMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {applyMsg.text}
                </div>
              )}

              <form onSubmit={submitApplication}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {[['name', 'Full Name', 'text', 'John Doe'], ['email', 'Email', 'email', 'you@example.com'], ['phone', 'Phone', 'text', '+91 98765 43210'], ['college', 'College', 'text', 'Your college name'], ['course', 'Course', 'text', 'B.Tech Computer Science']].map(([name, label, type, ph]) => (
                    <div key={name} className="form-group" style={{ marginBottom: 0 }}>
                      <label>{label}</label>
                      <input type={type} name={name} value={formData[name]} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} required className="form-control" placeholder={ph} />
                    </div>
                  ))}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Year of Study</label>
                    <select name="year" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} required className="form-control">
                      <option value="">Select Year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Residential Address</label>
                  <textarea name="address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="form-control" rows="2" placeholder="Your full address" />
                </div>

                <div className="form-group">
                  <label>Route / Destination</label>
                  {routes.length > 0 ? (
                    <select name="route" value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} required className="form-control">
                      <option value="">Select a route</option>
                      {routes.map(r => (
                        <option key={r._id} value={r.routeName}>{r.routeName} — Bus {r.busNumber} (₹{r.fare})</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" name="route" value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} required className="form-control" placeholder="From [Location] to [College]" />
                  )}
                </div>

                {/* APSRTC Eligibility Fields */}
                <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>📋 APSRTC Pass Eligibility</div>
                  <ul style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: 1.8, margin: 0 }}>
                    <li>Boys under 12 yrs (up to 7th class) — <strong>Free Pass</strong></li>
                    <li>Girls under 18 yrs (up to 10th class) — <strong>Free Pass</strong></li>
                    <li>Students 12–35 yrs in recognized institutions — <strong>Concessional Pass</strong></li>
                    <li>Max distance: 20 km (Mofussil) / 22 km (City)</li>
                    <li>Passes issued from June (academic year start)</li>
                  </ul>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Age <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="number" min="5" max="35" required className="form-control" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="Your age" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select required className="form-control" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Distance from Home to College (km) <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input type="number" min="1" max="22" step="0.1" required className="form-control" value={formData.distanceKm} onChange={e => setFormData({ ...formData, distanceKm: e.target.value })} placeholder="e.g. 15" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Area Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select required className="form-control" value={formData.areaType} onChange={e => setFormData({ ...formData, areaType: e.target.value })}>
                      <option value="Mofussil">Mofussil (max 20 km)</option>
                      <option value="City">City (max 22 km)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Pass Duration <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select required className="form-control" value={formData.passDuration} onChange={e => setFormData({ ...formData, passDuration: e.target.value })}>
                      <option value="Monthly">Monthly (1 month)</option>
                      <option value="Quarterly">Quarterly (3 months)</option>
                      <option value="Annual">Annual (11 months)</option>
                    </select>
                  </div>
                  {/* Eligibility preview */}
                  {formData.age && formData.gender && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: ((formData.gender === 'Male' && parseInt(formData.age) < 12) || (formData.gender === 'Female' && parseInt(formData.age) < 18)) ? '#ECFDF5' : '#EEF2FF', border: '1px solid', borderColor: ((formData.gender === 'Male' && parseInt(formData.age) < 12) || (formData.gender === 'Female' && parseInt(formData.age) < 18)) ? '#A7F3D0' : 'var(--primary)' }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {((formData.gender === 'Male' && parseInt(formData.age) < 12) || (formData.gender === 'Female' && parseInt(formData.age) < 18)) ? '🎉' : '✅'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: ((formData.gender === 'Male' && parseInt(formData.age) < 12) || (formData.gender === 'Female' && parseInt(formData.age) < 18)) ? '#065F46' : 'var(--primary)' }}>
                          {((formData.gender === 'Male' && parseInt(formData.age) < 12) || (formData.gender === 'Female' && parseInt(formData.age) < 18)) ? 'Eligible for FREE Pass' : 'Eligible for Concessional Pass'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Based on your age and gender</div>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="divider" />
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>Upload Documents</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {docFields.map(({ key, label, required, accept }) => (
                    <div key={key} className="form-group" style={{ marginBottom: 0, background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <label style={{ marginBottom: '0.5rem' }}>
                        {label} {required ? <span style={{ color: 'var(--danger)' }}>*</span> : <span style={{ color: 'var(--text-light)', fontWeight: 400 }}>(Optional)</span>}
                      </label>
                      <input type="file" onChange={e => setDocuments({ ...documents, [key]: e.target.files[0] })} required={required} className="form-control" accept={accept} style={{ background: 'var(--bg-surface)', fontSize: '0.82rem' }} />
                      {documents[key] && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.3rem', fontWeight: 600 }}>✓ {documents[key].name}</div>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
                    {loading ? 'Submitting...' : <><UploadCloud size={18} /> Submit Application</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── History ── */}
        {activeTab === 'History' && (
          <div>
            <h1 className="section-title">Application History</h1>
            <p className="section-sub">Track the live status of all your bus pass applications.</p>

            {applications.length === 0 ? (
              <div className="card empty-state"><div className="empty-state-icon"><History size={48} /></div><p style={{ color: 'var(--text-muted)' }}>No applications yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {applications.map(app => <ApplicationTracker key={app._id} app={app} onRenew={handleRenew} renewLoading={renewLoading} renderBadge={renderBadge} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Payments ── */}
        {activeTab === 'Payments' && (
          <PaymentsTab applications={applications} getAuthConfig={getAuthConfig} onPaymentSuccess={fetchApplications} />
        )}

        {/* ── Complaints ── */}
        {activeTab === 'Complaints' && (
          <div>
            <h1 className="section-title">Complaints & Feedback</h1>
            <p className="section-sub">Submit a complaint or share your feedback with the admin.</p>

            {/* Submit Form */}
            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="var(--primary)" /> New Submission
              </h3>
              {complaintMsg.text && <div className={`alert ${complaintMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{complaintMsg.text}</div>}
              <form onSubmit={submitComplaint}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Type</label>
                    <select className="form-control" value={complaintForm.type} onChange={e => setComplaintForm({ ...complaintForm, type: e.target.value })}>
                      <option value="Complaint">Complaint</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Category</label>
                    <select className="form-control" value={complaintForm.category} onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}>
                      {['Driver Behavior', 'Bus Condition', 'Route Issue', 'Pass Issue', 'Payment Issue', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input type="text" required className="form-control" value={complaintForm.subject} onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })} placeholder="Brief subject..." />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea required className="form-control" rows="4" value={complaintForm.message} onChange={e => setComplaintForm({ ...complaintForm, message: e.target.value })} placeholder="Describe your complaint or feedback in detail..." />
                </div>
                <button type="submit" disabled={complaintLoading} className="btn btn-primary">
                  {complaintLoading ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </div>

            {/* History */}
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1rem' }}>My Submissions</h3>
            {complaints.length === 0 ? (
              <div className="card empty-state"><div className="empty-state-icon"><MessageSquare size={40} /></div><p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {complaints.map(c => (
                  <div key={c._id} className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${c.status === 'Resolved' ? 'var(--success)' : c.status === 'In Progress' ? 'var(--warning)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{c.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{c.type} · {c.category} · {new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge ${c.status === 'Resolved' ? 'badge-success' : c.status === 'In Progress' ? 'badge-warning' : 'badge-info'}`}>{c.status}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: c.adminReply ? '0.75rem' : 0 }}>{c.message}</p>
                    {c.adminReply && (
                      <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Admin Reply</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{c.adminReply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Profile ── */}
        {activeTab === 'Profile' && (
          <div>
            <h1 className="section-title">My Profile</h1>
            <p className="section-sub">Update your personal information and password.</p>
            <div className="card" style={{ padding: '2rem', maxWidth: '560px' }}>
              {profileMsg.text && (
                <div className={`alert ${profileMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                  {profileMsg.text}
                </div>
              )}
              <form onSubmit={handleProfileUpdate}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" value={profileData.name || user?.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} placeholder={user?.name} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" className="form-control" value={profileData.phone || user?.phone || ''} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Phone number" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea className="form-control" rows="2" value={profileData.address || user?.address || ''} onChange={e => setProfileData({ ...profileData, address: e.target.value })} placeholder="Your address" />
                </div>
                <hr className="divider" />
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Change Password (optional)</h3>
                <div className="form-group">
                  <label>Current Password</label>
                  <input type="password" className="form-control" value={profileData.currentPassword} onChange={e => setProfileData({ ...profileData, currentPassword: e.target.value })} placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" className="form-control" value={profileData.newPassword} onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })} placeholder="Enter new password" />
                </div>
                <button type="submit" disabled={profileLoading} className="btn btn-primary">
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Emergency Contact */}
            <div className="card" style={{ padding: '2rem', maxWidth: '560px', marginTop: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--danger)" /> Emergency Contact
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>This contact will be reached by admin in case of an emergency.</p>
              {emergencyMsg.text && <div className={`alert ${emergencyMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>{emergencyMsg.text}</div>}
              <form onSubmit={saveEmergencyContact}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Contact Name</label>
                    <input type="text" className="form-control" value={emergencyContact.name} onChange={e => setEmergencyContact({ ...emergencyContact, name: e.target.value })} placeholder="Parent / Guardian name" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Relation</label>
                    <select className="form-control" value={emergencyContact.relation} onChange={e => setEmergencyContact({ ...emergencyContact, relation: e.target.value })}>
                      <option value="">Select relation</option>
                      {['Parent', 'Guardian', 'Sibling', 'Spouse', 'Friend', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Phone Number</label>
                  <input type="tel" className="form-control" value={emergencyContact.phone} onChange={e => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <button type="submit" className="btn btn-danger" style={{ marginTop: '0.5rem' }}>
                  <Phone size={15} /> Save Emergency Contact
                </button>
              </form>
            </div>
          </div>
        )}
      </>) }
      </main>

      {/* Pass Modal */}
      {showPassModal && activeApp && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPassModal(false)}>
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Your Digital Pass</h2>
              <button className="modal-close" onClick={() => setShowPassModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div id="pass-ticket-render" style={{ border: '2px solid var(--primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '1.25rem 1.5rem', color: 'white' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Bus Pass</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '0.25rem' }}>{activeApp.generatedPassId}</div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {[['Name', activeApp.name || user?.name], ['Route', activeApp.route], ['College', activeApp.college], ['Valid Until', new Date(activeApp.validUntil).toLocaleDateString()]].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {activeApp.qrCode && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 0.5rem' }}>
                      <img src={activeApp.qrCode} alt="QR Code" style={{ width: '130px', height: '130px' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowPassModal(false)} className="btn btn-outline">Close</button>
              <button onClick={handleDownloadPdf} className="btn btn-primary">
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
