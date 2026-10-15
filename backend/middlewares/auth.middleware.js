import jwt from 'jsonwebtoken';
import { Customer } from '../models/customer.model.js';

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'shopkart_super_secret_jwt_key_2026'
    );

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      // Clear stale cookie from previous session/database instance
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(401).json({
        success: false,
        message: 'Please log in to continue'
      });
    }

    req.user = customer;
    next();
  } catch (error) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.status(401).json({
      success: false,
      message: 'Please log in to continue'
    });
  }
};
