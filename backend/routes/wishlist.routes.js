import express from 'express';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
} from '../controllers/wishlist.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply auth protection middleware to all wishlist endpoints
router.use(protect);

// Task 2: Add product to wishlist
router.post('/:productId', addToWishlist);

// Task 3: Get current user's populated wishlist
router.get('/', getWishlist);

// Task 4: Remove product from wishlist
router.delete('/:productId', removeFromWishlist);

// Bonus: Toggle product in wishlist
router.patch('/:productId/toggle', toggleWishlist);

export default router;
