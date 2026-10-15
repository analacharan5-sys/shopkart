import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById
} from '../controllers/product.controller.js';

const router = express.Router();

// Task 2: Create product
router.post('/', createProduct);

// Task 3, Task 5 & Bonus: Get all products (supports ?search= & ?category= & ?sort=)
router.get('/', getProducts);

// Task 4: Get single product by ID
router.get('/:id', getProductById);

export default router;
