import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Task 2 — Create Product API (POST /products)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Check for missing mandatory fields
    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are mandatory'
      });
    }

    const numPrice = Number(price);
    const numStock = Number(stock);

    // Validate price > 0
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a number greater than 0'
      });
    }

    // Validate stock >= 0
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }

    const product = await Product.create({
      name,
      description,
      price: numPrice,
      category,
      image,
      stock: numStock
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 3 & Task 5 & Bonus — Get All Products API with Search, Filter, Sort (GET /products)
export const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const query = {};

    // Search filter: case-insensitive regex match on product name
    if (search && search.trim() !== '') {
      query.name = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    // Category filter
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    let sortOptions = { createdAt: -1 }; // default newest first

    if (sort === 'price_asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1 };
    }

    const products = await Product.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 4 — Get Single Product API (GET /products/:id)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};
