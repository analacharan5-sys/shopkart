import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getRazorpayConfig,
  updateRazorpayConfig
} from '../controllers/order.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Razorpay configuration status and live key connector
router.get('/razorpay-config', getRazorpayConfig);
router.post('/razorpay-config', updateRazorpayConfig);

// All user order operations are protected by authentication middleware
router.use(protect);

// Task 4: Create payment order with stock check and server-calculated price
router.post('/create-payment-order', createPaymentOrder);

// Task 5: Verify payment signature, deduct stock, and clear cart
router.post('/verify-payment', verifyPayment);

// Task 7: Get all orders for the authenticated customer
router.get('/', getMyOrders);

// Task 8: Get details of a single order (ownership verified)
router.get('/:id', getOrderById);

// Bonus Challenge: Update order status progression
router.patch('/:id/status', updateOrderStatus);

export default router;
