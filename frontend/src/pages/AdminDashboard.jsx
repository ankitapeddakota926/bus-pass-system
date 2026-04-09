import React, { useState, useEffect, useContext } from 'react';
import {
  Users, CreditCard, Clock, AlertTriangle, LayoutDashboard, FileText, LogOut,
  CheckCircle, XCircle, AlertCircle, Eye, Search, Download, Bus, Trash2, Plus,
  CalendarDays, Navigation, MessageSquare, Phone, Megaphone, Shield, CheckSquare
} from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API_BASE from '../config';
import BusLoader from '../components/BusLoader';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [extendDays, setExtendDays] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [newRoute, setNewRoute] = useState({ routeName: '', busNumber: '', stops: '', fare: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info', expiresAt: '' });
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Approved');
  const [dataLoading, setDataLoading] = useState(true);

  const { user, getAuthConfig, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchApplications();
      fetchUsers();
      fetchRoutes();
      fetchComplaints();
      fetchAnnouncements();
      fetchAuditLogs();
    }
  }, [user]);

  useEffect(() => {
    let result = [...applications];
    if (statusFilter) result = result.filter(a => a.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(s) ||
        a.email?.toLowerCase().includes(s) ||
        a.college?.toLowerCase().includes(s) ||
        a.route?.toLowerCase().includes(s) ||
        a.generatedPassId?.toLowerCase().includes(s)
      );
    }
    setFilteredApps(result);
  }, [applications, search, statusFilter]);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/applications`, getAuthConfig());
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/auth/users`, getAuthConfig());
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/routes`);
      setRoutes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/complaints`, getAuthConfig());
      setComplaints(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/announcements/all`, getAuthConfig());
      setAnnouncements(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/audit`, getAuthConfig());
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    if ((status === 'Rejected' || status === 'Correction') && !rejectionReason) {
      alert('Please provide a reason.');
      return;
    }
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/api/applications/${id}/status`, { status, rejectionReason }, getAuthConfig());
      setSelectedApp(null);
      setRejectionReason('');
      fetchApplications();
    } catch (err) {
      alert('Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async (id) => {
    if (!extendDays || extendDays < 1) { alert('Enter valid days'); return; }
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE}/api/applications/${id}/extend`, { days: extendDays }, getAuthConfig());
      setSelectedApp(null);
      setExtendDays('');
      fetchApplications();
      alert('Pass validity extended successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/applications/export`, {
        ...getAuthConfig(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applications.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed');
    }
  };

  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/routes`, {
        ...newRoute,
        stops: newRoute.stops.split(',').map(s => s.trim()),
        fare: Number(newRoute.fare),
      }, getAuthConfig());
      setNewRoute({ routeName: '', busNumber: '', stops: '', fare: '' });
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return;
    try {
      await axios.delete(`${API_BASE}/api/routes/${id}`, getAuthConfig());
      fetchRoutes();
    } catch (err) {
      alert('Failed to delete route');
    }
  };

  const handleBulkAction = async () => {
    if (!selectedIds.length) return alert('Select at least one application');
    if (!confirm(`${bulkStatus} ${selectedIds.length} applications?`)) return;
    try {
      const res = await axios.put(`${API_BASE}/api/applications/bulk-status`, { ids: selectedIds, status: bulkStatus }, getAuthConfig());
      alert(res.data.message);
      setSelectedIds([]);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.message || 'Bulk action failed');
    }
  };

  const handleBlacklist = async (id) => {
    const reason = prompt('Reason for blacklisting this pass?');
    if (!reason) return;
    try {
      await axios.put(`${API_BASE}/api/applications/${id}/blacklist`, { reason }, getAuthConfig());
      alert('Pass blacklisted');
      fetchApplications();
    } catch (err) {
      alert('Failed to blacklist');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return alert('Enter a reply');
    try {
      await axios.put(
        `${API_BASE}/api/complaints/${selectedComplaint._id}/reply`,
        { reply: replyText, status: replyStatus },
        getAuthConfig()
      );
      setSelectedComplaint(null);
      setReplyText('');
      fetchComplaints();
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/announcements`, newAnnouncement, getAuthConfig());
      setNewAnnouncement({ title: '', message: '', type: 'info', expiresAt: '' });
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE}/api/announcements/${id}`, getAuthConfig());
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement');
    }
  };

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'Pending').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  const chartData = [
    { name: 'Approved', value: counts.approved, color: '#10B981' },
    { name: 'Pending', value: counts.pending, color: '#F59E0B' },
    { name: 'Rejected', value: counts.rejected, color: '#EF4444' },
    { name: 'Correction', value: applications.filter(a => a.status === 'Correction').length, color: '#6366F1' },
  ].filter(d => d.value > 0);

  const stats = [
    { label: 'Total Applications', value: counts.total, icon: <FileText size={20} />, color: '#6366F1' },
    { label: 'Active Passes', value: counts.approved, icon: <CreditCard size={20} />, color: '#10B981' },
    { label: 'Pending Review', value: counts.pending, icon: <Clock size={20} />, color: '#F59E0B' },
    { label: 'Total Students', value: users.length, icon: <Users size={20} />, color: '#8B5CF6' },
  ];

  const tabs = ['Overview', 'Applications', 'Users', 'Routes', 'Complaints', 'Announcements', 'Audit Log'];

  const tabIcons = {
    Overview: <LayoutDashboard size={18} />,
    Applications: <FileText size={18} />,
    Users: <Users size={18} />,
    Routes: <Bus size={18} />,
    Complaints: <MessageSquare size={18} />,
    Announcements: <Megaphone size={18} />,
    'Audit Log': <Shield size={18} />,
  };

  const renderBadge = (status) => {
    const map = {
      Approved: 'badge-success',
      Pending: 'badge-warning',
      Rejected: 'badge-danger',
      Correction: 'badge-info',
      Expired: 'badge-secondary',
    };
    return <span className={`badge ${map[status] || 'badge-secondary'}`}>{status}</span>;
  };

  return (
    <div className="dashboard-grid">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Admin Panel
          </p>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>TransitPass</h2>
        </div>
        <ul className="sidebar-menu">
          {tabs.map(tab => (
            <li key={tab}>
              <button
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tabIcons[tab]}
                {tab}
              </button>
            </li>
          ))}
          <li style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <button onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--danger)' }}>
              <LogOut size={18} /> Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* ── Main Content ── */}
      <main className="dashboard-content">
        {dataLoading ? (
          <BusLoader message="Loading admin dashboard" />
        ) : (
          <>
            {/* ── Overview Tab ── */}
            {activeTab === 'Overview' && (
              <div>
                <h1 className="section-title">Dashboard Overview</h1>
                <p className="section-sub">Welcome back, {user?.name?.split(' ')[0]}.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
                  {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                      <span className="stat-label">{s.label}</span>
                      <span className="stat-value">{s.value}</span>
                      <div className="stat-icon" style={{ color: s.color, background: `${s.color}18`, padding: '0.5rem', borderRadius: '10px' }}>
                        {s.icon}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                      Application Status
                    </h3>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend iconType="circle" iconSize={8} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="empty-state" style={{ padding: '2rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No data yet</p>
                      </div>
                    )}
                  </div>
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                      Recent Applications
                    </h3>
                    <div className="data-table-container" style={{ boxShadow: 'none', border: '1px solid var(--border)' }}>
                      <table className="data-table">
                        <thead>
                          <tr><th>Name</th><th>Route</th><th>Status</th><th></th></tr>
                        </thead>
                        <tbody>
                          {applications.slice(0, 5).map(app => (
                            <tr key={app._id}>
                              <td className="td-main">{app.name || app.user?.name}</td>
                              <td>{app.route}</td>
                              <td>{renderBadge(app.status)}</td>
                              <td>
                                <button
                                  onClick={() => { setSelectedApp(app); setActiveTab('Applications'); }}
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: '0.3rem 0.6rem' }}
                                >
                                  <Eye size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {applications.length === 0 && (
                            <tr>
                              <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                No applications yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Applications Tab ── */}
            {activeTab === 'Applications' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>All Applications</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {filteredApps.length} of {applications.length} applications
                    </p>
                  </div>
                  <button onClick={handleExport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={16} /> Export Excel
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, email, college, pass ID..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                  <select
                    className="form-control"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: 'auto', minWidth: '150px' }}
                  >
                    <option value="">All Statuses</option>
                    {['Pending', 'Approved', 'Rejected', 'Correction', 'Expired'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            onChange={e => setSelectedIds(e.target.checked ? filteredApps.map(a => a._id) : [])}
                            checked={selectedIds.length === filteredApps.length && filteredApps.length > 0}
                          />
                        </th>
                        <th>Applicant</th>
                        <th>College</th>
                        <th>Route</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map(app => (
                        <tr key={app._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(app._id)}
                              onChange={e => setSelectedIds(
                                e.target.checked
                                  ? [...selectedIds, app._id]
                                  : selectedIds.filter(id => id !== app._id)
                              )}
                            />
                          </td>
                          <td>
                            <div className="td-main">{app.name || app.user?.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{app.email || app.user?.email}</div>
                          </td>
                          <td>{app.college}</td>
                          <td>{app.route}</td>
                          <td>{renderBadge(app.status)}</td>
                          <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => { setSelectedApp(app); setRejectionReason(''); setExtendDays(''); }}
                              className="btn btn-sm btn-primary"
                            >
                              Review
                            </button>
                            {app.status === 'Approved' && (
                              <button
                                onClick={() => handleBlacklist(app._id)}
                                className="btn btn-sm btn-danger"
                                title="Blacklist"
                              >
                                🚫
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredApps.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No applications found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {selectedIds.length > 0 && (
                  <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--text-main)', color: 'white', padding: '0.875rem 1.5rem',
                    borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--shadow-xl)', zIndex: 100,
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedIds.length} selected</span>
                    <select
                      value={bulkStatus}
                      onChange={e => setBulkStatus(e.target.value)}
                      style={{ background: '#334155', color: 'white', border: '1px solid #475569', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      <option value="Approved">Approve</option>
                      <option value="Rejected">Reject</option>
                    </select>
                    <button onClick={handleBulkAction} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckSquare size={14} /> Apply
                    </button>
                    <button onClick={() => setSelectedIds([])} className="btn btn-sm" style={{ background: '#475569', color: 'white' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Users Tab ── */}
            {activeTab === 'Users' && (
              <div>
                <h1 className="section-title">All Students</h1>
                <p className="section-sub">{users.length} registered students</p>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td className="td-main">{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.phone}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.address}
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No students yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Routes Tab ── */}
            {activeTab === 'Routes' && (
              <div>
                <h1 className="section-title">Route Management</h1>
                <p className="section-sub">Add or remove bus routes available for students.</p>

                <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} color="var(--primary)" /> Add New Route
                  </h3>
                  <form onSubmit={handleAddRoute}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Route Name</label>
                        <input
                          type="text" required className="form-control"
                          value={newRoute.routeName}
                          onChange={e => setNewRoute({ ...newRoute, routeName: e.target.value })}
                          placeholder="e.g. Vizag to GMRIT"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Bus Number</label>
                        <input
                          type="text" required className="form-control"
                          value={newRoute.busNumber}
                          onChange={e => setNewRoute({ ...newRoute, busNumber: e.target.value })}
                          placeholder="e.g. AP-39-X-1234"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Stops (comma separated)</label>
                        <input
                          type="text" required className="form-control"
                          value={newRoute.stops}
                          onChange={e => setNewRoute({ ...newRoute, stops: e.target.value })}
                          placeholder="Stop 1, Stop 2, Stop 3"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Fare (₹)</label>
                        <input
                          type="number" required className="form-control"
                          value={newRoute.fare}
                          onChange={e => setNewRoute({ ...newRoute, fare: e.target.value })}
                          placeholder="500" min="1"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Plus size={15} /> Add Route
                    </button>
                  </form>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Route Name</th><th>Bus Number</th><th>Stops</th><th>Fare</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {routes.map(r => (
                        <tr key={r._id}>
                          <td className="td-main">{r.routeName}</td>
                          <td>{r.busNumber}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {Array.isArray(r.stops) ? r.stops.join(' → ') : r.stops}
                          </td>
                          <td style={{ fontWeight: 700 }}>₹{r.fare}</td>
                          <td>
                            <button onClick={() => handleDeleteRoute(r._id)} className="btn btn-sm btn-danger">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {routes.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No routes added yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Complaints Tab ── */}
            {activeTab === 'Complaints' && (
              <div>
                <h1 className="section-title">Complaints &amp; Feedback</h1>
                <p className="section-sub">{complaints.length} total submissions</p>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Subject</th>
                        <th>Category</th>
                        <th>Emergency Contact</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => (
                        <tr key={c._id}>
                          <td>
                            <div className="td-main">{c.user?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{c.user?.email}</div>
                          </td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.subject}
                          </td>
                          <td>{c.category}</td>
                          <td>
                            {c.emergencyContact ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem' }}>
                                <Phone size={12} color="var(--danger)" /> {c.emergencyContact}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td>{renderBadge(c.status)}</td>
                          <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => { setSelectedComplaint(c); setReplyText(''); setReplyStatus('Resolved'); }}
                              className="btn btn-sm btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <MessageSquare size={13} /> Reply
                            </button>
                          </td>
                        </tr>
                      ))}
                      {complaints.length === 0 && (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No complaints yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Announcements Tab ── */}
            {activeTab === 'Announcements' && (
              <div>
                <h1 className="section-title">Announcements</h1>
                <p className="section-sub">Broadcast messages to all students.</p>

                <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={16} color="var(--primary)" /> New Announcement
                  </h3>
                  <form onSubmit={handleAddAnnouncement}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Title</label>
                        <input
                          type="text" required className="form-control"
                          value={newAnnouncement.title}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                          placeholder="Announcement title"
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Type</label>
                        <select
                          className="form-control"
                          value={newAnnouncement.type}
                          onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                        >
                          {['info', 'warning', 'success', 'danger'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea
                        required className="form-control" rows="2"
                        value={newAnnouncement.message}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                        placeholder="Announcement message..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Expires At (optional)</label>
                      <input
                        type="datetime-local" className="form-control"
                        value={newAnnouncement.expiresAt}
                        onChange={e => setNewAnnouncement({ ...newAnnouncement, expiresAt: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Megaphone size={15} /> Publish
                    </button>
                  </form>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Title</th><th>Type</th><th>Message</th><th>Expires</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {announcements.map(a => (
                        <tr key={a._id}>
                          <td className="td-main">{a.title}</td>
                          <td>
                            <span className={`badge badge-${a.type === 'danger' ? 'danger' : a.type === 'warning' ? 'warning' : a.type === 'success' ? 'success' : 'info'}`}>
                              {a.type}
                            </span>
                          </td>
                          <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.message}
                          </td>
                          <td>{a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'Never'}</td>
                          <td>
                            <button onClick={() => handleDeleteAnnouncement(a._id)} className="btn btn-sm btn-danger">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {announcements.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No announcements
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Audit Log Tab ── */}
            {activeTab === 'Audit Log' && (
              <div>
                <h1 className="section-title">Audit Log</h1>
                <p className="section-sub">Track all admin actions in the system.</p>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr><th>Admin</th><th>Action</th><th>Target</th><th>Details</th><th>IP</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log._id}>
                          <td className="td-main">{log.adminName}</td>
                          <td>
                            <span style={{
                              fontFamily: 'monospace', fontSize: '0.75rem',
                              background: 'var(--bg-subtle)', padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-sm)', color: 'var(--primary)',
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.target}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                            {log.details}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{log.ip}</td>
                          <td style={{ fontSize: '0.78rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No audit logs yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Review Modal ── */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>Review Application</h2>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Name', selectedApp.name || selectedApp.user?.name],
                ['Email', selectedApp.email || selectedApp.user?.email],
                ['College', selectedApp.college],
                ['Route', selectedApp.route],
                ['Pass ID', selectedApp.generatedPassId || '—'],
                ['Status', selectedApp.status],
                ['Age', selectedApp.age || '—'],
                ['Gender', selectedApp.gender || '—'],
                ['Distance', selectedApp.distanceKm ? `${selectedApp.distanceKm} km` : '—'],
                ['Area Type', selectedApp.areaType || '—'],
                ['Pass Duration', selectedApp.passDuration || '—'],
                ['Pass Category', selectedApp.passCategory || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.875rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{val}</div>
                </div>
              ))}
            </div>

            {selectedApp.documentUrl && (
              <a
                href={`${API_BASE}/${selectedApp.documentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}
              >
                <Eye size={14} /> View Document
              </a>
            )}

            <div className="form-group">
              <label>Reason (required for Reject / Correction)</label>
              <textarea
                className="form-control" rows="2"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter reason..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <button onClick={() => updateStatus(selectedApp._id, 'Approved')} className="btn btn-success" disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle size={15} /> Approve
              </button>
              <button onClick={() => updateStatus(selectedApp._id, 'Rejected')} className="btn btn-danger" disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <XCircle size={15} /> Reject
              </button>
              <button onClick={() => updateStatus(selectedApp._id, 'Correction')} className="btn btn-warning" disabled={actionLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={15} /> Request Correction
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                <CalendarDays size={15} color="var(--primary)" /> Extend Pass Validity
              </label>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="number" min="1" className="form-control"
                  placeholder="Days to extend"
                  value={extendDays}
                  onChange={e => setExtendDays(e.target.value)}
                  style={{ maxWidth: '160px' }}
                />
                <button onClick={() => handleExtend(selectedApp._id)} className="btn btn-primary" disabled={actionLoading}>
                  Extend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Complaint Reply Modal ── */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>Reply to Complaint</h2>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '1.25rem' }}>✕</button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {selectedComplaint.subject}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {selectedComplaint.message}
              </div>
              {selectedComplaint.emergencyContact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                  <Phone size={12} /> Emergency: {selectedComplaint.emergencyContact}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Your Reply</label>
              <textarea
                className="form-control" rows="3"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
              />
            </div>

            <div className="form-group">
              <label>Update Status</label>
              <select className="form-control" value={replyStatus} onChange={e => setReplyStatus(e.target.value)}>
                <option value="Resolved">Resolved</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedComplaint(null)} className="btn btn-outline">Cancel</button>
              <button onClick={handleReply} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageSquare size={14} /> Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
