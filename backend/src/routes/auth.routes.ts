import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  profile,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  resendRegistrationOtp,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/register/request-otp', requestRegistrationOtp);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken as any, profile as any);

export default router;
