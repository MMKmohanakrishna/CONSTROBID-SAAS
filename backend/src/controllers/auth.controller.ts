import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../config/mailer';
import { sendSms } from '../config/sms';
import { AuthenticatedRequest } from '../middlewares/auth';
import { User, Client, Contractor, InspectionTeam, PendingRegistration } from '../models';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-constrobid-key-change-in-prod';
const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function validateRegistrationFields(role: string, body: any) {
  const { name, phone, address, city, companyName, experience, serviceCategories, serviceCities, aadhaar, pan } = body;

  // Every profile field is mandatory except GST.
  if (role === 'CLIENT' && (!name || !phone || !address || !city)) {
    return 'Name, phone, address, and city are required';
  }
  if (
    role === 'CONTRACTOR' &&
    (!name ||
      !companyName ||
      !phone ||
      !experience ||
      !aadhaar ||
      !pan ||
      !Array.isArray(serviceCategories) ||
      serviceCategories.length === 0 ||
      !Array.isArray(serviceCities) ||
      serviceCities.length === 0)
  ) {
    return 'All contractor fields are required except GST';
  }
  return null;
}

// STEP 1 — validate + stash the registration and send an OTP.
// CLIENT gets it by email, CONTRACTOR by SMS to their phone. Nothing is
// written to User/Client/Contractor until verifyRegistrationOtp succeeds.
export async function requestRegistrationOtp(req: AuthenticatedRequest, res: Response) {
  const { email, password, role, phone } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }
  if (role !== 'CLIENT' && role !== 'CONTRACTOR') {
    return res.status(400).json({ error: 'Only CLIENT and CONTRACTOR can self-register' });
  }

  const fieldError = validateRegistrationFields(role, req.body);
  if (fieldError) return res.status(400).json({ error: fieldError });

  try {
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpChannel: 'EMAIL' | 'SMS' = role === 'CONTRACTOR' ? 'SMS' : 'EMAIL';

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        email,
        passwordHash,
        role,
        otpChannel,
        otpHash: hashOtp(otp),
        otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
        attempts: 0,
        payload: req.body,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    ).exec();

    if (otpChannel === 'EMAIL') {
      await sendEmail({
        to: email,
        templateType: 'REGISTRATION_OTP',
        context: { otp, minutes: String(OTP_TTL_MINUTES) },
      });
    } else {
      await sendSms({
        to: phone,
        content: `${otp} is your ConstroBID verification code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share it.`,
      });
    }

    return res.status(200).json({
      message: otpChannel === 'EMAIL' ? 'OTP sent to your email' : 'OTP sent to your phone',
      channel: otpChannel,
      email,
    });
  } catch (error) {
    logger.error('requestRegistrationOtp error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// STEP 2 — confirm the OTP, then actually create the account.
export async function verifyRegistrationOtp(req: AuthenticatedRequest, res: Response) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const pending = await PendingRegistration.findOne({ email }).exec();
    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found for this email. Please start again.' });
    }

    if (pending.otpExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (pending.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (hashOtp(String(otp)) !== pending.otpHash) {
      pending.attempts += 1;
      await pending.save();
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    // Guard against a double-submit creating two accounts for the same email.
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      await PendingRegistration.deleteOne({ email }).exec();
      return res.status(400).json({ error: 'User already exists' });
    }

    const { role, payload } = pending;
    const { name, phone, address, city, companyName, experience, serviceCategories, serviceCities, aadhaar, pan, gst } = payload;

    const user = await User.create({
      email,
      passwordHash: pending.passwordHash,
      role: role as any,
    });

    if (role === 'CLIENT') {
      await Client.create({
        userId: user._id,
        name: name || 'Valued Client',
        phone: phone || '',
        address: address || '',
        city: city || '',
      });
      await sendEmail({
        to: email,
        templateType: 'REGISTRATION',
        context: { name: name || 'Valued Client' },
      });
    } else {
      await Contractor.create({
        userId: user._id,
        name: name || companyName || 'Verified Contractor',
        companyName: companyName || 'Individual Contractor',
        phone: phone || '',
        experience: parseInt(experience || '0', 10),
        serviceCategories: serviceCategories || [],
        serviceCities: serviceCities || [],
        aadhaar: aadhaar || '',
        pan: pan || '',
        gst: gst || '',
        status: 'PENDING_VERIFICATION',
      });
    }

    await PendingRegistration.deleteOne({ email }).exec();

    const token = jwt.sign({ id: String(user._id), email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('verifyRegistrationOtp error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Re-sends a fresh OTP for a registration still awaiting confirmation.
export async function resendRegistrationOtp(req: AuthenticatedRequest, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const pending = await PendingRegistration.findOne({ email }).exec();
    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found for this email. Please start again.' });
    }

    const otp = generateOtp();
    pending.otpHash = hashOtp(otp);
    pending.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    pending.attempts = 0;
    await pending.save();

    if (pending.otpChannel === 'EMAIL') {
      await sendEmail({
        to: email,
        templateType: 'REGISTRATION_OTP',
        context: { otp, minutes: String(OTP_TTL_MINUTES) },
      });
    } else {
      await sendSms({
        to: pending.payload?.phone,
        content: `${otp} is your ConstroBID verification code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share it.`,
      });
    }

    return res.json({ message: 'OTP resent', channel: pending.otpChannel });
  } catch (error) {
    logger.error('resendRegistrationOtp error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// REGISTER USER — retained only for INSPECTION_TEAM, which is admin-created
// and never goes through the OTP flow. CLIENT/CONTRACTOR must use
// requestRegistrationOtp + verifyRegistrationOtp instead.
export async function register(req: AuthenticatedRequest, res: Response) {
  const { email, password, role, name, phone } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  if (role === 'CLIENT' || role === 'CONTRACTOR') {
    return res.status(400).json({ error: 'Use the OTP registration flow for this role' });
  }

  try {
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      passwordHash,
      role: role as any,
    });

    if (role === 'INSPECTION_TEAM') {
      // INSPECTION_TEAM users must be created by ADMIN only
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Inspection team users can only be created by Super Admin' });
      }

      await InspectionTeam.create({
        userId: user._id,
        employeeId: (req.body.employeeId) || `IT-${Date.now()}`,
        fullName: name || 'Inspection Team Member',
        email,
        phone: phone || '',
      });
    }

    const token = jwt.sign({ id: String(user._id), email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Registration error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// LOGIN USER
export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).exec();

    // populate profiles
    let profile: any = null;
    if (user) {
      if (user.role === 'CLIENT') {
        profile = await Client.findOne({ userId: user._id }).lean().exec();
      } else if (user.role === 'CONTRACTOR') {
        profile = await Contractor.findOne({ userId: user._id }).lean().exec();
      } else if (user.role === 'INSPECTION_TEAM') {
        profile = await InspectionTeam.findOne({ userId: user._id }).lean().exec();
      }
    }
    if (!user) {
  return res.status(404).json({
    error: 'EMAIL_NOT_FOUND'
  });
}

const isMatch = await bcrypt.compare(password, user.passwordHash);

if (!isMatch) {
  return res.status(401).json({
    error: 'INVALID_PASSWORD'
  });
}

    const token = jwt.sign({ id: String(user._id), email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });
    return res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    logger.error('Login error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// LOGIN FOR INSPECTION TEAM (separate endpoint)
export async function loginInspection(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
  return res.status(404).json({
    error: 'EMAIL_NOT_FOUND'
  });
}

if (user.role !== 'INSPECTION_TEAM') {
  return res.status(403).json({
    error: 'NOT_INSPECTION_TEAM'
  });
}

const isMatch = await bcrypt.compare(password, user.passwordHash);

if (!isMatch) {
  return res.status(401).json({
    error: 'INVALID_PASSWORD'
  });
}

    const profile = await InspectionTeam.findOne({ userId: user._id }).lean().exec();

    const token = jwt.sign({ id: String(user._id), email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    return res.json({ token, user: { id: String(user._id), email: user.email, role: user.role, profile } });
  } catch (error) {
    logger.error('Inspection login error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// FORGOT PASSWORD
export async function forgotPassword(req: AuthenticatedRequest, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Mocking reset link - in real app generate token and email
    logger.info('Password reset link generated', { email });
    return res.json({ message: 'Password reset link sent to your registered email address' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// RESET PASSWORD
export async function resetPassword(req: AuthenticatedRequest, res: Response) {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await User.findOneAndUpdate({ email }, { passwordHash }).exec();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET PROFILE for authenticated user
export async function profile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id, email, role, clientId, contractorId, inspectionTeamId } = req.user;
    let profile: any = null;

    if (role === 'CLIENT') {
      profile = await Client.findOne({ userId: id }).lean().exec();
    } else if (role === 'CONTRACTOR') {
      profile = await Contractor.findOne({ userId: id }).lean().exec();
    } else if (role === 'INSPECTION_TEAM') {
      profile = await InspectionTeam.findOne({ userId: id }).lean().exec();
    }

    return res.json({ id, email, role, profile });
  } catch (error) {
    logger.error('Profile fetch error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
