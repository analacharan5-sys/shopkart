import mongoose from 'mongoose';
import { Customer } from '../models/customer.model.js';
import { Product } from '../models/product.model.js';
import { syncCustomerToDisk } from '../utils/persistentSync.js';

// Task 2 — Add Product to Cart (POST /cart/:productId)
export const addToCart = async (req, res) => {
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

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product is out of stock'
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Check if product already exists in cart
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      const newQuantity = cartItem.quantity + 1;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Requested quantity (${newQuantity}) exceeds available stock (${product.stock}).`
        });
      }
      cartItem.quantity = newQuantity;
    } else {
      customer.cart.push({
        product: productId,
        quantity: 1
      });
    }

    await customer.save();
    await syncCustomerToDisk(customer);

    return res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 3 — Get Current User Cart (GET /cart)
export const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price image category stock description'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Filter out null references if a product was deleted
    const activeCart = customer.cart.filter((item) => item.product !== null);

    const totalUnits = activeCart.reduce(
      (acc, item) => acc + (item.quantity || 0),
      0
    );

    return res.status(200).json({
      success: true,
      count: totalUnits,
      cart: activeCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 4 — Update Product Quantity (PATCH /cart/:productId)
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a valid number and at least 1'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (numQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity requested (${numQty}) exceeds available stock (${product.stock})`
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    cartItem.quantity = numQty;
    await customer.save();
    await syncCustomerToDisk(customer);

    return res.status(200).json({
      success: true,
      message: 'Cart quantity updated',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 5 — Remove Product from Cart (DELETE /cart/:productId)
export const removeFromCart = async (req, res) => {
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

    const itemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    customer.cart.splice(itemIndex, 1);
    await customer.save();
    await syncCustomerToDisk(customer);

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: customer.cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};
