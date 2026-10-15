import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import {
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  Loader2,
  AlertCircle
} from 'lucide-react';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/orders/${id}`);
        if (response.data.success) {
          setOrder(response.data.order);
        } else {
          setError('Order details could not be retrieved.');
        }
      } catch (err) {
        console.error('Fetch order error:', err);
        setError(err.response?.data?.message || 'Failed to load order confirmation details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center', color: 'var(--primary-indigo)' }}>
        <Loader2 size={44} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Verifying your order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
          <AlertCircle size={48} color="var(--danger-color)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.8rem' }}>Order Confirmation Error</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem' }}>{error || 'Order not found.'}</p>
          <Link
            to="/orders"
            style={{
              padding: '0.8rem 1.6rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 600
            }}
          >
            Go to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Success Hero Header */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          marginBottom: '2rem',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }}
      >
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.2rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
          }}
        >
          <CheckCircle2 size={44} color="var(--success-color)" />
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Payment Verified & Order Placed! 🎉
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
          Thank you for shopping with ShopKart! Your test transaction was authorized and the cart has been securely cleared.
        </p>

        {/* Quick Order Badge */}
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1.2rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem'
          }}
        >
          <span>
            Order ID: <strong style={{ color: 'var(--primary-indigo)' }}>#{order._id.slice(-8).toUpperCase()}</strong>
          </span>
          <span>•</span>
          <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Status: {order.status}</span>
          <span>•</span>
          <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Payment: {order.paymentStatus}</span>
        </div>
      </div>

      {/* Order Info Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Shipping Destination */}
        <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--primary-indigo)' }}>
            <MapPin size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Delivery Address</h3>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.addressLine1}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p style={{ marginTop: '0.4rem' }}>📞 Phone: {order.shippingAddress?.phone}</p>
          </div>
        </div>

        {/* Payment & Tracking Info */}
        <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--primary-indigo)' }}>
            <CreditCard size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Payment & Delivery Details</h3>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            <p>
              Date: <span style={{ color: 'var(--text-main)' }}>{new Date(order.createdAt).toLocaleString()}</span>
            </p>
            <p>
              Method: <span style={{ color: 'var(--text-main)' }}>Razorpay (Test Mode)</span>
            </p>
            <p>
              Payment ID: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{order.razorpayPaymentId || 'N/A'}</span>
            </p>
            <p style={{ marginTop: '0.4rem', color: 'var(--success-color)', fontWeight: 600 }}>
              Estimated Delivery: 3-5 Business Days
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Items Snapshot */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Package size={22} color="var(--primary-indigo)" />
          Items in this Order ({order.items?.length || 0})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {order.items?.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem',
                padding: '0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)'
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{item.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ₹{item.price.toLocaleString('en-IN')} × {item.quantity} unit{item.quantity === 1 ? '' : 's'}
                </p>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary-indigo)' }}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Total Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.2rem'
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total Paid Amount:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
        <Link
          to="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.8rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--gradient-primary)',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
          }}
        >
          <Package size={18} />
          View All Orders
          <ArrowRight size={18} />
        </Link>

        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.8rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            fontWeight: 600
          }}
        >
          <ShoppingBag size={18} />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
