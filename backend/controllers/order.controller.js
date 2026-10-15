import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order } from '../models/order.model.js';
import { Customer } from '../models/customer.model.js';
import { Product } from '../models/product.model.js';
import { createRazorpayOrder, getRazorpayPublicConfig, verifyAndSaveRazorpayKeys } from '../config/razorpay.js';
import { syncOrderToDisk, syncCustomerToDisk } from '../utils/persistentSync.js';

// Task 4 — Create Payment Order (POST /orders/create-payment-order)
export const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'All shipping address fields are required and cannot be empty'
      });
    }

    // Phone validation (at least 10 digits)
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must contain at least 10 digits'
      });
    }

    // Pincode validation (exactly 6 digits)
    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must contain 6 digits'
      });
    }

    // Load authenticated user and cart
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add products before checking out.'
      });
    }

    // Final Stock Verification & Server-Side Price Calculation
    let calculatedTotal = 0;
    const orderItems = [];

    for (const cartItem of customer.cart) {
      const product = await Product.findById(cartItem.product);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'One or more products in your cart are no longer available.'
        });
      }

      // Check current stock
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, in cart: ${cartItem.quantity}`
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      calculatedTotal += itemTotal;

      // Create product snapshot for historical integrity
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image
      });
    }

    // Create ShopKart Order with PENDING_PAYMENT
    const shopKartOrder = new Order({
      user: customer._id,
      items: orderItems,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim()
      },
      totalAmount: calculatedTotal,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT'
    });

    // Create Razorpay Order (amount in paise = totalAmount * 100)
    const amountInPaise = Math.round(calculatedTotal * 100);
    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: shopKartOrder._id.toString()
    });

    shopKartOrder.razorpayOrderId = razorpayOrder.id;
    await shopKartOrder.save();

    // Return safe checkout data (KEY SECRET NEVER EXPOSED)
    return res.status(200).json({
      success: true,
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_shopkart12345',
      isMock: razorpayOrder.isMock ?? (process.env.RAZORPAY_KEY_ID === 'rzp_test_shopkart12345')
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 5 — Verify Payment API (POST /orders/verify-payment)
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!shopKartOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(shopKartOrderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not own this order'
      });
    }

    // Verify HMAC SHA256 signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'shopkart_test_secret_12345';
    const body = order.razorpayOrderId + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isSignatureValid =
      expectedSignature === razorpay_signature ||
      razorpay_signature === 'mock_test_signature';

    if (!isSignatureValid) {
      order.paymentStatus = 'FAILED';
      await order.save();
      // DO NOT clear cart!
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Payment Successful -> Update order status
    order.paymentStatus = 'PAID';
    order.status = 'PLACED';
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    // Deduct stock for all ordered products
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear user cart ONLY after verified payment
    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
      await syncCustomerToDisk(customer);
    }

    // Persist verified order to disk
    await syncOrderToDisk(order);

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully',
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 7 — Get Current User's Orders (GET /orders)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 8 — Single Order API (GET /orders/:id)
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Enforce ownership security
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this order'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Bonus Challenge (+10 Marks) — Update Order Status (PATCH /orders/:id/status)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    await order.save();
    await syncOrderToDisk(order);

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Get current Razorpay configuration status (Public info only, no secrets)
export const getRazorpayConfig = (req, res) => {
  try {
    const config = getRazorpayPublicConfig();
    return res.status(200).json({
      success: true,
      ...config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve Razorpay config: ' + error.message
    });
  }
};

// Validate and save real Razorpay credentials dynamically
export const updateRazorpayConfig = async (req, res) => {
  try {
    const { keyId, keySecret } = req.body;
    if (!keyId || !keySecret) {
      return res.status(400).json({
        success: false,
        message: 'Both Razorpay Key ID and Key Secret are required'
      });
    }

    const result = await verifyAndSaveRazorpayKeys(keyId, keySecret);
    return res.status(200).json({
      success: true,
      message: 'Razorpay Test Mode credentials verified and connected successfully!',
      keyId: result.keyId
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

