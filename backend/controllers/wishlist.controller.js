import mongoose from 'mongoose';
import { Customer } from '../models/customer.model.js';
import { Product } from '../models/product.model.js';

// Task 2 — Add Product to Wishlist (POST /wishlist/:productId)
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Verify product exists in database
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Fetch customer profile
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Prevent duplicate entries (HTTP 409 Conflict)
    const isAlreadySaved = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (isAlreadySaved) {
      return res.status(409).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 3 — Get Current User's Wishlist (GET /wishlist)
export const getWishlist = async (req, res) => {
  try {
    // Find user and populate wishlist product references
    const customer = await Customer.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price category image stock description'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Filter out any broken null references if a product was deleted from DB
    const activeWishlist = customer.wishlist.filter(Boolean);

    return res.status(200).json({
      success: true,
      count: activeWishlist.length,
      wishlist: activeWishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 4 — Remove Product from Wishlist (DELETE /wishlist/:productId)
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const itemIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in wishlist'
      });
    }

    customer.wishlist.splice(itemIndex, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Bonus Challenge — Wishlist Toggle API (PATCH /wishlist/:productId/toggle)
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const itemIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    let inWishlist = false;
    let message = '';

    if (itemIndex > -1) {
      customer.wishlist.splice(itemIndex, 1);
      inWishlist = false;
      message = 'Product removed from wishlist';
    } else {
      customer.wishlist.push(productId);
      inWishlist = true;
      message = 'Product added to wishlist';
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      inWishlist,
      message
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};
