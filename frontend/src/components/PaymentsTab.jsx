import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';
import API_BASE from '../config';

const PASS_FEE = 1; // ₹1 for testing

const PaymentsTab = ({ applications, getAuthConfig, onPaymentSuccess }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [paidAppIds, setPaidAppIds] = useState(new Set());

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/payments/my`, getAuthConfig());
      setPaymentHistory(data);
      setPaidAppIds(new Set(data.map(p => p.application?._id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayNow = async (application) => {
    setLoadingId(application._id);
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/payments/create-order`,
        { applicationId: application._id, amount: PASS_FEE },
        getAuthConfig()
      );

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'TransitPass',
        description: `Bus Pass - ${application.route}`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await axios.post(
              `${API_BASE}/api/payments/verify`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: data.paymentId,
              },
              getAuthConfig()
            );
            alert('Payment successful! A confirmation email has been sent.');
            fetchPaymentHistory();
            onPaymentSuccess();
          } catch (err) {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: application.name,
          email: application.email,
          contact: application.phone,
        },
        theme: { color: '#4F46E5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => alert('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoadingId(null);
    }
  };

  const approvedApps = applications.filter(a => a.status === 'Approved');
  const pendingPayment = approvedApps.filter(a => !paidAppIds.has(a._id));

  return (
    <div>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CreditCard size={28} color="var(--primary)" /> Payments
      </h2>

      {/* Pending Payments */}
      {pendingPayment.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Payment
          </h3>
          {pendingPayment.map(app => (
            <div key={app._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Pass ID: {app.generatedPassId}</p>
                <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Route: {app.route} &nbsp;|&nbsp; Valid Until: {new Date(app.validUntil).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>₹{PASS_FEE} (Test)</span>
                <button
                  className="btn btn-primary"
                  onClick={() => handlePayNow(app)}
                  disabled={loadingId === app._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CreditCard size={18} />
                  {loadingId === app._id ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment History */}
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Transaction History
      </h3>

      {paymentHistory.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon"><Clock size={48} style={{ color: 'var(--text-light)', opacity: 0.5 }} /></div>
          <p style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Pass ID</th>
                <th>Route</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{p.application?.generatedPassId || '-'}</td>
                  <td>{p.application?.route || '-'}</td>
                  <td style={{ fontWeight: 700 }}>₹{p.amount}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.razorpayPaymentId || '-'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#D1FAE5', color: '#065F46', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <CheckCircle size={14} /> Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentsTab;
