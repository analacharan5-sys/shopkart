import express from 'express';
import {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword
} from '../controllers/customer.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Task 1: Register
router.post('/register', registerCustomer);

// Task 2: Login
router.post('/login', loginCustomer);

// Task 3: Profile (Protected)
router.get('/me', protect, getProfile);

// Task 4: Logout (Protected)
router.post('/logout', protect, logoutCustomer);

// Bonus: Change Password (Protected)
router.patch('/change-password', protect, changePassword);

export default router;
