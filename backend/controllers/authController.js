import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, address, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, phone, address, password, role: role || 'user' });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, token: generateToken(user._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, emergencyContact: user.emergencyContact, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Update profile
// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { name, phone, address, currentPassword, newPassword, emergencyContact } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (emergencyContact) user.emergencyContact = emergencyContact;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, address: updated.address, role: updated.role, emergencyContact: updated.emergencyContact, token: generateToken(updated._id) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Forgot password — send reset email
// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    await sendEmail({
      email: user.email,
      subject: '🔐 Reset Your TransitPass Password',
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center;">
  <div style="font-size:24px;font-weight:900;color:white;">🚌 TransitPass</div>
</td></tr>
<tr><td style="padding:32px 40px;">
  <h2 style="color:#0F172A;margin:0 0 16px;">Reset Your Password</h2>
  <p style="color:#6B7280;font-size:14px;line-height:1.7;margin:0 0 24px;">Hello <strong>${user.name}</strong>, click the button below to reset your password. This link expires in 15 minutes.</p>
  <table width="100%"><tr><td align="center">
    <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-decoration:none;padding:13px 32px;border-radius:9999px;font-weight:700;font-size:14px;">Reset Password</a>
  </td></tr></table>
  <p style="color:#9CA3AF;font-size:12px;margin-top:24px;text-align:center;">If you didn't request this, ignore this email.</p>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px 40px;text-align:center;border-top:1px solid #E5E7EB;">
  <div style="font-size:11px;color:#9CA3AF;">© ${new Date().getFullYear()} TransitPass</div>
</td></tr>
</table></td></tr></table></body></html>`,
    });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Reset password
// @route PUT /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc  Get all users (Admin)
// @route GET /api/auth/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
