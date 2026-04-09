import Complaint from '../models/Complaint.js';
import { sendEmail } from '../utils/sendEmail.js';

// @desc  Submit complaint or feedback
// @route POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const { type, category, subject, message } = req.body;
    const complaint = await Complaint.create({ user: req.user._id, type, category, subject, message });
    res.status(201).json({ message: `${type} submitted successfully`, complaint });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Get my complaints
// @route GET /api/complaints/my
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Get all complaints (Admin)
// @route GET /api/complaints
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('user', 'name email phone emergencyContact')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Admin reply to complaint
// @route PUT /api/complaints/:id/reply
export const replyComplaint = async (req, res) => {
  try {
    const { reply, status } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('user', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.adminReply = reply;
    complaint.status = status || 'Resolved';
    complaint.repliedAt = new Date();
    await complaint.save();

    // Email user
    try {
      await sendEmail({
        email: complaint.user.email,
        subject: `Re: Your ${complaint.type} — ${complaint.subject}`,
        html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:28px 36px;text-align:center;">
  <div style="font-size:22px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="padding:28px 36px;">
  <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hello <strong>${complaint.user.name}</strong>,</p>
  <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">We've responded to your ${complaint.type.toLowerCase()}:</p>
  <div style="background:#F1F5F9;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
    <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;margin-bottom:6px;">Your ${complaint.type}</div>
    <div style="font-size:14px;color:#374151;">${complaint.message}</div>
  </div>
  <div style="background:#EEF2FF;border-left:4px solid #6366F1;border-radius:8px;padding:14px 18px;">
    <div style="font-size:11px;font-weight:700;color:#4338CA;text-transform:uppercase;margin-bottom:6px;">Admin Response</div>
    <div style="font-size:14px;color:#1e1b4b;font-weight:500;">${reply}</div>
  </div>
  <div style="margin-top:16px;font-size:12px;color:#94A3B8;">Status: <strong style="color:#10B981;">${complaint.status}</strong></div>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px 36px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass</div>
</td></tr>
</table></td></tr></table></body></html>`,
      });
    } catch (e) { console.error('Reply email failed:', e); }

    res.json({ message: 'Reply sent successfully', complaint });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
