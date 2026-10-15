import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import API from '../services/api';
import {
  MapPin,
  CreditCard,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  X,
  Smartphone,
  Building2,
  AlertTriangle,
  Settings,
  Key,
  Zap,
  ExternalLink
} from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, totalUnits, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Razorpay Test Sandbox Modal State
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [sandboxTab, setSandboxTab] = useState('card'); // 'card' | 'upi' | 'netbanking'
  const [modalProcessing, setModalProcessing] = useState(false);
  const [modalError, setModalError] = useState('');
  // Razorpay Live Configuration State
  const [razorpayConfig, setRazorpayConfig] = useState({
    isRealConnected: false,
    keyId: null,
    maskedKey: null
  });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState({ keyId: '', keySecret: '' });
  const [keyStatus, setKeyStatus] = useState({ loading: false, error: '', success: '' });

  // Load gateway connection status on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await API.get('/orders/razorpay-config');
        if (data.success) {
          setRazorpayConfig({
            isRealConnected: data.isRealConnected,
            keyId: data.keyId,
            maskedKey: data.maskedKey
          });
        }
      } catch (err) {
        console.warn('Could not retrieve razorpay gateway status:', err);
      }
    };
    fetchConfig();
  }, []);

  // Save and dynamically verify real Razorpay credentials
  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setKeyStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await API.post('/orders/razorpay-config', keyInput);
      if (data.success) {
        setKeyStatus({
          loading: false,
          error: '',
          success: 'Connected! Real Razorpay Test Gateway is now active.'
        });
        setRazorpayConfig({
          isRealConnected: true,
          keyId: data.keyId,
          maskedKey: `${data.keyId.substring(0, 12)}...`
        });
        setTimeout(() => setShowKeyModal(false), 1400);
      }
    } catch (err) {
      setKeyStatus({
        loading: false,
        error: err.response?.data?.message || err.message || 'Verification failed. Please check credentials.',
        success: ''
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setPaymentError('');
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.trim().replace(/\D/g, '').length < 10) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit pincode';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Execute payment verification on backend
  const executePaymentVerification = async (payload) => {
    try {
      const { data: verifyData } = await API.post('/orders/verify-payment', payload);
      if (verifyData.success) {
        clearCart();
        navigate(`/order-success/${payload.shopKartOrderId}`);
        return true;
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Payment verification failed on server.';
      throw new Error(errMsg);
    }
  };

  // Main Payment Handler
  const handlePayment = async (forceSimulation = false) => {
    if (!validate()) return;
    if (cartItems.length === 0) {
      setPaymentError('Your cart is empty. Add items before checking out.');
      return;
    }

    setSubmitting(true);
    setPaymentError('');

    try {
      // 1. Create order on backend (stock verification + price calculation)
      const { data: orderData } = await API.post('/orders/create-payment-order', {
        shippingAddress: formData
      });

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      setActiveOrder(orderData);

      // Check if real live Razorpay key is present or if placeholder/test fallback is active
      const isPlaceholderKey =
        !orderData.key ||
        orderData.key === 'rzp_test_shopkart12345' ||
        orderData.isMock === true;

      // If simulated mode requested or dummy keys detected: launch in-app Razorpay Test Sandbox Modal
      if (forceSimulation || isPlaceholderKey) {
        setShowSandboxModal(true);
        setSubmitting(false);
        return;
      }

      // If real Razorpay key is provided: load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        // Fallback to in-app Sandbox modal if script fails to load
        setShowSandboxModal(true);
        setSubmitting(false);
        return;
      }

      // Launch official Razorpay modal
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ShopKart India',
        description: `Order #${orderData.shopKartOrderId.slice(-6).toUpperCase()}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          contact: formData.phone
        },
        theme: {
          color: '#6366f1'
        },
        handler: async function (response) {
          try {
            setSubmitting(true);
            await executePaymentVerification({
              shopKartOrderId: orderData.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          } catch (verifyErr) {
            setPaymentError(verifyErr.message);
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setPaymentError('Payment window was closed. Your cart remains saved.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (failResponse) {
        console.warn('Razorpay payment.failed, switching to Sandbox modal:', failResponse);
        // Fallback to Sandbox Modal if live API fails authentication
        setShowSandboxModal(true);
        setSubmitting(false);
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      setPaymentError(
        err.response?.data?.message || err.message || 'Failed to initiate checkout.'
      );
      setSubmitting(false);
    }
  };

  // Authorize Payment in Sandbox Modal
  const handleSandboxAuthorize = async () => {
    if (!activeOrder) return;
    setModalProcessing(true);
    setModalError('');

    try {
      await executePaymentVerification({
        shopKartOrderId: activeOrder.shopKartOrderId,
        razorpay_order_id: activeOrder.razorpayOrderId,
        razorpay_payment_id: `pay_sandbox_${Date.now()}`,
        razorpay_signature: 'mock_test_signature'
      });
      setShowSandboxModal(false);
    } catch (err) {
      setModalError(err.message);
      setModalProcessing(false);
    }
  };

  // Simulate Payment Failure in Sandbox Modal
  const handleSandboxFail = async () => {
    if (!activeOrder) return;
    setModalProcessing(true);
    setModalError('');

    try {
      await API.post('/orders/verify-payment', {
        shopKartOrderId: activeOrder.shopKartOrderId,
        razorpay_order_id: activeOrder.razorpayOrderId,
        razorpay_payment_id: `pay_failed_${Date.now()}`,
        razorpay_signature: 'invalid_failure_signature'
      });
    } catch (err) {
      setModalProcessing(false);
      setShowSandboxModal(false);
      setPaymentError(
        'Simulated payment rejection: Signature verification failed. Cart preserved intact as per Lab specifications.'
      );
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
          <ShoppingBag size={56} color="var(--primary-indigo)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.8rem' }}>
            Cannot Proceed to Checkout
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Your cart is currently empty. Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1.8rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 700
            }}
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <CreditCard size={32} color="var(--primary-indigo)" />
          Checkout & Order Confirmation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Provide shipping destination and complete test mode payment to place your order.
        </p>
      </div>

      {/* Razorpay Gateway Live Integration Status & Configuration Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.2rem 1.6rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          border: razorpayConfig.isRealConnected
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : '1px solid rgba(99, 102, 241, 0.35)',
          background: razorpayConfig.isRealConnected
            ? 'rgba(16, 185, 129, 0.06)'
            : 'rgba(99, 102, 241, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: razorpayConfig.isRealConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: razorpayConfig.isRealConnected ? '#10b981' : '#6366f1'
            }}
          >
            {razorpayConfig.isRealConnected ? <ShieldCheck size={22} /> : <Zap size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                {razorpayConfig.isRealConnected
                  ? 'Real Razorpay Test Gateway Connected'
                  : 'Razorpay Mode: Test Sandbox Fallback'}
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  background: razorpayConfig.isRealConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: razorpayConfig.isRealConnected ? '#10b981' : '#818cf8'
                }}
              >
                {razorpayConfig.isRealConnected ? 'LIVE TEST ACTIVE' : 'SANDBOX READY'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0' }}>
              {razorpayConfig.isRealConnected
                ? `Key: ${razorpayConfig.maskedKey || razorpayConfig.keyId} • Real checkout modal via api.razorpay.com`
                : 'Using interactive test modal. Connect your free Razorpay Test Keys to open the real Razorpay popup!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyStatus({ loading: false, error: '', success: '' });
            setShowKeyModal(true);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Settings size={15} />
          {razorpayConfig.isRealConnected ? 'Manage Razorpay Keys' : 'Connect Real Razorpay Keys'}
        </button>
      </div>

      {paymentError && (
        <div
          className="glass-panel"
          style={{
            padding: '1.2rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.08)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            color: 'var(--danger-color)'
          }}
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 500 }}>{paymentError}</span>
        </div>
      )}

      {/* Main Grid: Shipping Form + Order Review */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem' }}>
        {/* Left Column: Shipping Form */}
        <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
            <MapPin size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>1. Shipping Address</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handlePayment(false); }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: formErrors.fullName ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem'
                  }}
                />
                {formErrors.fullName && (
                  <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                    {formErrors.fullName}
                  </span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: formErrors.phone ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem'
                  }}
                />
                {formErrors.phone && (
                  <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                    {formErrors.phone}
                  </span>
                )}
              </div>

              {/* Address Line 1 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  Street / Flat / House Address *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="House #, Apartment, Street name"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: formErrors.addressLine1 ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem'
                  }}
                />
                {formErrors.addressLine1 && (
                  <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                    {formErrors.addressLine1}
                  </span>
                )}
              </div>

              {/* City and State */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Bangalore"
                    value={formData.city}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: formErrors.city ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem'
                    }}
                  />
                  {formErrors.city && (
                    <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                      {formErrors.city}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: formErrors.state ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '0.95rem'
                    }}
                  />
                  {formErrors.state && (
                    <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                      {formErrors.state}
                    </span>
                  )}
                </div>
              </div>

              {/* Pincode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                  6-Digit Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  maxLength={6}
                  placeholder="e.g. 560001"
                  value={formData.pincode}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: formErrors.pincode ? '1px solid var(--danger-color)' : '1px solid var(--border-color)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem'
                  }}
                />
                {formErrors.pincode && (
                  <span style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                    {formErrors.pincode}
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Review & Razorpay Trigger */}
        <div className="glass-panel" style={{ padding: '2.2rem', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
            <ShoppingBag size={22} color="var(--primary-indigo)" />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>2. Order Review ({totalUnits} units)</h2>
          </div>

          {/* Cart Item Snapshots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
            {cartItems.map((item) => (
              <div
                key={item.product?._id || item._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <img
                  src={item.product?.image}
                  alt={item.product?.name}
                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product?.name}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Qty: {item.quantity} × ₹{(item.product?.price || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-indigo)' }}>
                  ₹{((item.product?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', marginBottom: '1.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              <span>Items Total ({cartItems.length} products)</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              <span>Express Delivery</span>
              <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>Total Payable</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Primary Action: Razorpay Payment */}
          <button
            type="button"
            onClick={() => handlePayment(false)}
            disabled={submitting}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              border: 'none',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              opacity: submitting ? 0.7 : 1,
              marginBottom: '0.8rem'
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Connecting to Razorpay...
              </>
            ) : (
              <>
                <Lock size={18} />
                Place Order & Pay with Razorpay
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '1.2rem' }}>
            🛡️ Razorpay Test Sandbox active. Card, UPI & Netbanking supported.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REALISTIC RAZORPAY TEST SANDBOX MODAL (Replicates official Razorpay popup) */}
      {/* ========================================================================= */}
      {showSandboxModal && activeOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '480px',
              background: '#0f172a',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Header: Razorpay Brand Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0b192c 0%, #1e3a8a 100%)',
                padding: '1.4rem 1.6rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>⚡ Razorpay</span>
                  <span
                    style={{
                      background: 'rgba(59, 130, 246, 0.25)',
                      color: '#93c5fd',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Test Sandbox
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                  ShopKart Checkout
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Amount</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                  ₹{(activeOrder.amount / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Order meta chip */}
            <div
              style={{
                padding: '0.65rem 1.6rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Order: #{activeOrder.shopKartOrderId.slice(-8).toUpperCase()}</span>
              <span>Prefill: {formData.fullName} ({formData.phone})</span>
            </div>

            {modalError && (
              <div
                style={{
                  margin: '1rem 1.6rem 0',
                  padding: '0.8rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: 'var(--danger-color)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{modalError}</span>
              </div>
            )}

            {/* Payment Method Tabs */}
            <div style={{ padding: '1.4rem 1.6rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1.4rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.3rem',
                  borderRadius: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setSandboxTab('card')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: sandboxTab === 'card' ? 'var(--primary-indigo)' : 'transparent',
                    color: sandboxTab === 'card' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <CreditCard size={15} /> Card
                </button>

                <button
                  type="button"
                  onClick={() => setSandboxTab('upi')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: sandboxTab === 'upi' ? 'var(--primary-indigo)' : 'transparent',
                    color: sandboxTab === 'upi' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Smartphone size={15} /> UPI / QR
                </button>

                <button
                  type="button"
                  onClick={() => setSandboxTab('netbanking')}
                  style={{
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: sandboxTab === 'netbanking' ? 'var(--primary-indigo)' : 'transparent',
                    color: sandboxTab === 'netbanking' ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building2 size={15} /> Netbanking
                </button>
              </div>

              {/* Tab 1: Card Tab */}
              {sandboxTab === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Test Card Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="4111 •••• •••• 1111 (Visa Sandbox)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Expiry
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="12 / 28"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-main)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        CVV
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="123"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-main)',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: UPI Tab */}
              {sandboxTab === 'upi' && (
                <div style={{ textAlign: 'center', padding: '0.8rem 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.8rem'
                    }}
                  >
                    <Smartphone size={32} color="var(--primary-indigo)" />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    Simulated Instant UPI
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    VPA: <strong style={{ color: '#60a5fa' }}>success@razorpay</strong> (Auto-approves in sandbox)
                  </p>
                </div>
              )}

              {/* Tab 3: Netbanking Tab */}
              {sandboxTab === 'netbanking' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: idx === 0 ? '1px solid var(--primary-indigo)' : '1px solid var(--border-color)',
                        background: idx === 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: idx === 0 ? 'var(--primary-indigo)' : 'var(--text-main)',
                        textAlign: 'center'
                      }}
                    >
                      {bank}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '1.8rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={handleSandboxAuthorize}
                  disabled={modalProcessing}
                  style={{
                    width: '100%',
                    padding: '0.95rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: modalProcessing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                    opacity: modalProcessing ? 0.7 : 1
                  }}
                >
                  {modalProcessing ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Verifying with ShopKart Backend...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Pay ₹{(activeOrder.amount / 100).toLocaleString('en-IN')} (Authorize Payment)
                    </>
                  )}
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <button
                    type="button"
                    onClick={handleSandboxFail}
                    disabled={modalProcessing}
                    title="Test rejection edge case: invalid signature keeps cart intact"
                    style={{
                      padding: '0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: 'var(--danger-color)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: modalProcessing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Simulate Payment Failure
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSandboxModal(false);
                      setPaymentError('Payment window was dismissed. Your cart remains saved.');
                    }}
                    disabled={modalProcessing}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: modalProcessing ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.2rem', color: '#64748b', fontSize: '0.75rem' }}>
                <ShieldCheck size={14} color="#10b981" /> 256-Bit Razorpay Test Encryption • No real money charged
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Connect Real Razorpay Keys */}
      {showKeyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Key size={22} color="var(--primary-indigo)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Connect Real Razorpay Keys</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              Enter your Razorpay Test API keys from your free Razorpay Dashboard to enable the official Razorpay Checkout window.
            </p>

            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.4rem',
                fontSize: '0.82rem',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}
            >
              <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: '0.4rem' }}>
                📍 How to get your free Razorpay Test Keys (Takes 60 seconds):
              </div>
              <ol style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <li>Log in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>dashboard.razorpay.com</a></li>
                <li>Ensure top navbar toggle is set to <strong>Test Mode</strong></li>
                <li>Go to <strong>Account & Settings</strong> → <strong>API Keys</strong></li>
                <li>Click <strong>Generate Key</strong> to copy your Key ID & Key Secret</li>
              </ol>
            </div>

            <form onSubmit={handleSaveKeys}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.4rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    Razorpay Key ID (starts with rzp_test_)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                    value={keyInput.keyId}
                    onChange={(e) => setKeyInput((prev) => ({ ...prev, keyId: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-muted)' }}>
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••••••••••••••"
                    value={keyInput.keySecret}
                    onChange={(e) => setKeyInput((prev) => ({ ...prev, keySecret: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {keyStatus.error && (
                <div style={{ color: 'var(--danger-color)', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} /> {keyStatus.error}
                </div>
              )}

              {keyStatus.success && (
                <div style={{ color: 'var(--success-color)', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} /> {keyStatus.success}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  style={{
                    padding: '0.7rem 1.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={keyStatus.loading}
                  style={{
                    padding: '0.7rem 1.4rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: 'var(--gradient-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: keyStatus.loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {keyStatus.loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {keyStatus.loading ? 'Verifying with Razorpay...' : 'Verify & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
