import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

let currentKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_shopkart12345';
let currentKeySecret = process.env.RAZORPAY_KEY_SECRET || 'shopkart_test_secret_12345';
let razorpayInstance = null;

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || currentKeyId;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || currentKeySecret;

  if (!razorpayInstance || razorpayInstance.key_id !== keyId) {
    try {
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      razorpayInstance.key_id = keyId;
    } catch (err) {
      console.warn('Razorpay initialization warning:', err.message);
    }
  }
  return razorpayInstance;
};

// Check if authentic (non-dummy) keys are configured
export const isRazorpayRealConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || currentKeyId;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || currentKeySecret;
  return Boolean(
    keyId &&
    keySecret &&
    keyId !== 'rzp_test_shopkart12345' &&
    keySecret !== 'shopkart_test_secret_12345' &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
  );
};

export const getRazorpayPublicConfig = () => {
  const configured = isRazorpayRealConfigured();
  const keyId = process.env.RAZORPAY_KEY_ID || currentKeyId;
  return {
    isRealConnected: configured,
    keyId: configured ? keyId : null,
    maskedKey: configured ? `${keyId.substring(0, 12)}...` : null
  };
};

// Verify credentials directly with Razorpay API and save to environment
export const verifyAndSaveRazorpayKeys = async (keyId, keySecret) => {
  if (!keyId || !keySecret) {
    throw new Error('Both Key ID and Key Secret are required.');
  }

  const cleanKeyId = keyId.trim();
  const cleanKeySecret = keySecret.trim();

  if (!cleanKeyId.startsWith('rzp_test_') && !cleanKeyId.startsWith('rzp_live_')) {
    throw new Error('Invalid Key ID format. Razorpay test keys must start with "rzp_test_".');
  }

  // Test credentials against Razorpay API by creating a small ₹1 test order
  const testInstance = new Razorpay({
    key_id: cleanKeyId,
    key_secret: cleanKeySecret
  });

  try {
    await testInstance.orders.create({
      amount: 100, // 100 paise = ₹1
      currency: 'INR',
      receipt: `verify_${Date.now()}`
    });
  } catch (apiErr) {
    const errorMsg =
      apiErr.error?.description ||
      apiErr.message ||
      'Authentication failed. Please verify your Key ID and Secret.';
    throw new Error(`Razorpay validation failed: ${errorMsg}`);
  }

  // Update in-memory process environment
  process.env.RAZORPAY_KEY_ID = cleanKeyId;
  process.env.RAZORPAY_KEY_SECRET = cleanKeySecret;
  currentKeyId = cleanKeyId;
  currentKeySecret = cleanKeySecret;
  razorpayInstance = testInstance;

  // Persist to .env file for server reboots
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '../.env');

    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf8');
      if (content.includes('RAZORPAY_KEY_ID=')) {
        content = content.replace(/RAZORPAY_KEY_ID=.*/g, `RAZORPAY_KEY_ID=${cleanKeyId}`);
      } else {
        content += `\nRAZORPAY_KEY_ID=${cleanKeyId}`;
      }
      if (content.includes('RAZORPAY_KEY_SECRET=')) {
        content = content.replace(/RAZORPAY_KEY_SECRET=.*/g, `RAZORPAY_KEY_SECRET=${cleanKeySecret}`);
      } else {
        content += `\nRAZORPAY_KEY_SECRET=${cleanKeySecret}`;
      }
      fs.writeFileSync(envPath, content, 'utf8');
    }
  } catch (fsErr) {
    console.warn('Could not write to .env:', fsErr.message);
  }

  return {
    success: true,
    keyId: cleanKeyId
  };
};

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
  const instance = getRazorpayInstance();
  const keyId = process.env.RAZORPAY_KEY_ID || currentKeyId;
  const isReal = isRazorpayRealConfigured();

  if (isReal && instance && instance.orders) {
    try {
      const order = await instance.orders.create({
        amount: Math.round(amount),
        currency,
        receipt
      });
      return { ...order, isMock: false };
    } catch (err) {
      console.warn('Razorpay live order creation failed, using sandbox fallback:', err.message);
      return {
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        amount: Math.round(amount),
        currency,
        receipt,
        status: 'created',
        isMock: true,
        gatewayError: err.message
      };
    }
  }

  // Graceful fallback for offline development or sandbox testing
  return {
    id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    amount: Math.round(amount),
    currency,
    receipt,
    status: 'created',
    isMock: true
  };
};

export default getRazorpayInstance();
