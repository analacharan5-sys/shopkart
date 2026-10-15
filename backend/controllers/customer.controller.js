import { Customer } from '../models/customer.model.js';
import { generateToken } from '../utils/generateToken.js';
import { syncCustomerToDisk } from '../utils/persistentSync.js';

// Task 1 — Register Customer
export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Check for missing mandatory fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field'
      });
    }

    // Check password minimum length rule
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 6 characters'
      });
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create customer (password automatically hashed via pre-save hook)
    const customer = await Customer.create({
      fullName,
      email,
      password,
      phone
    });

    // Persist to disk so credentials survive server restarts
    await syncCustomerToDisk(customer);

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone
      }
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

// Task 2 — Login Customer
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password with stored bcrypt hash
    const isPasswordCorrect = await customer.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT and store inside HttpOnly cookie
    const token = generateToken(res, customer._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 3 — My Profile
export const getProfile = async (req, res) => {
  try {
    // req.user attached by auth.middleware (excludes password)
    return res.status(200).json(req.user);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Task 4 — Logout Customer
export const logoutCustomer = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};

// Bonus Challenge — Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both oldPassword and newPassword are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least 6 characters'
      });
    }

    // Fetch customer with password to verify old password
    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const isMatch = await customer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect old password'
      });
    }

    customer.password = newPassword;
    await customer.save(); // Triggers pre-save hook to hash new password
    await syncCustomerToDisk(customer);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
};
