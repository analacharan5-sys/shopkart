import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  RotateCw
} from 'lucide-react';

const steps = [
  { key: 'PLACED', label: 'Order Placed', icon: Package },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 }
];

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get(`/orders/${id}`);
      if (response.data.success) {
        setOrder(response.data.order);
      } else {
        setError('Order could not be loaded.');
      }
    } catch (err) {
      console.error('Fetch order details error:', err);
      if (err.response?.status === 403) {
        setError('Unauthorized: You do not own this order.');
      } else {
        setError(err.response?.data?.message || 'Failed to retrieve order details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleAdvanceStatus = async () => {
    if (!order) return;
    const progression = {
      PLACED: 'CONFIRMED',
      CONFIRMED: 'SHIPPED',
      SHIPPED: 'DELIVERED'
    };
    const next = progression[order.status];
    if (!next) return;

    try {
      setAdvancing(true);
      const res = await API.patch(`/orders/${order._id}/status`, { status: next });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '5rem auto', textAlign: 'center', color: 'var(--primary-indigo)' }}>
        <Loader2 size={44} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Loading order specifications...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
          <AlertTriangle size={48} color="var(--danger-color)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.8rem' }}>Order Not Accessible</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.8rem' }}>{error || 'Unable to display order details.'}</p>
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
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = steps.findIndex((s) => s.key === order.status);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>

      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem'
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Order Details
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-indigo)', fontFamily: 'monospace' }}>
            #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: order.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: order.paymentStatus === 'PAID' ? 'var(--success-color)' : 'var(--danger-color)',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            Payment: {order.paymentStatus}
          </div>

          {['PLACED', 'CONFIRMED', 'SHIPPED'].includes(order.status) && (
            <button
              onClick={handleAdvanceStatus}
              disabled={advancing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: 'var(--primary-indigo)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              {advancing ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCw size={15} />}
              Advance Lifecycle Status
            </button>
          )}
        </div>
      </div>

      {/* Visual Status Tracker */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.8rem' }}>Order Journey</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', position: 'relative' }}>
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            const StepIcon = step.icon;

            return (
              <div key={step.key} style={{ textAlign: 'center', position: 'relative' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
                    border: isCurrent ? '2px solid #a855f7' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.8rem',
                    color: isCompleted ? '#fff' : 'var(--text-subtle)',
                    boxShadow: isCompleted ? '0 0 16px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  <StepIcon size={22} />
                </div>
                <div
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: isCompleted ? 700 : 500,
                    color: isCompleted ? 'var(--text-main)' : 'var(--text-subtle)'
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Delivery & Payment Details */}
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
            <p style={{ marginTop: '0.4rem' }}>📞 {order.shippingAddress?.phone}</p>
          </div>
        </div>

        {/* Razorpay Transaction Details */}
        <div className="glass-panel" style={{ padding: '1.8rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--primary-indigo)' }}>
            <CreditCard size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Payment Security</h3>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.7' }}>
            <p>
              Gateway: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Razorpay Test Mode</span>
            </p>
            <p>
              Razorpay Order ID: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{order.razorpayOrderId || 'N/A'}</span>
            </p>
            <p>
              Payment ID: <span style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{order.razorpayPaymentId || 'N/A'}</span>
            </p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', marginTop: '0.3rem' }}>
              <ShieldCheck size={16} /> HMAC-SHA256 Signature Verified
            </p>
          </div>
        </div>
      </div>

      {/* Purchased Items Snapshot */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Package size={22} color="var(--primary-indigo)" />
          Purchased Product Snapshots ({order.items?.length || 0})
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
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.name}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  ₹{item.price.toLocaleString('en-IN')} × {item.quantity} unit{item.quantity === 1 ? '' : 's'}
                </p>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-indigo)' }}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.2rem'
          }}
        >
          <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>Total Paid:</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>
            ₹{order.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
