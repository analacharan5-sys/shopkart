import express from 'express';
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart
} from '../controllers/cart.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply auth protection middleware to all cart endpoints
router.use(protect);

// Task 2: Add product to cart
router.post('/:productId', addToCart);

// Task 3: Get current user cart
router.get('/', getCart);

// Task 4: Update product quantity
router.patch('/:productId', updateCartQuantity);

// Task 5: Remove product from cart
router.delete('/:productId', removeFromCart);

export default router;
