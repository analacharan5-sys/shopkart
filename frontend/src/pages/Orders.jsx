import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  RotateCw
} from 'lucide-react';

const statusConfig = {
  PENDING_PAYMENT: { label: 'Pending Payment', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: Clock },
  PLACED: { label: 'Placed', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', icon: Package },
  CONFIRMED: { label: 'Confirmed', bg: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', icon: CheckCircle },
  SHIPPED: { label: 'Shipped', bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', icon: Truck },
  DELIVERED: { label: 'Delivered', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: CheckCircle }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/orders');
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err.response?.data?.message || 'Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Demo status progression (Bonus requirement demonstration)
  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const progression = {
      PLACED: 'CONFIRMED',
      CONFIRMED: 'SHIPPED',
      SHIPPED: 'DELIVERED'
    };
    const nextStatus = progression[currentStatus];
    if (!nextStatus) return;

    try {
      setUpdatingId(orderId);
      const res = await API.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
          <Package size={32} color="var(--primary-indigo)" />
          My Orders
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          View and track all your past and active ShopKart orders.
        </p>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--primary-indigo)' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Retrieving your orders...</p>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <div
          className="glass-panel"
          style={{
            padding: '3rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            maxWidth: '550px',
            margin: '2rem auto'
          }}
        >
          <AlertTriangle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger-color)', marginBottom: '0.5rem' }}>
            Unable to Load Orders
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
          <button
            onClick={fetchOrders}
            style={{
              padding: '0.75rem 1.6rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '550px',
            margin: '3rem auto'
          }}
        >
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <Package size={38} color="var(--primary-indigo)" />
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            No Orders Yet 📦
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
            You haven't placed any orders yet. Discover our premium products and start your shopping journey!
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
              fontWeight: 700,
              boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
            }}
          >
            <ShoppingBag size={20} />
            Start Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {/* 4. Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || {
              label: order.status,
              bg: 'rgba(255,255,255,0.1)',
              color: 'var(--text-main)',
              icon: Package
            };
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={order._id}
                className="glass-panel"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.8rem',
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease'
                }}
              >
                {/* Header Row: ID, Date, Status Badges */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '1.2rem',
                    marginBottom: '1.4rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Order Placed
                    </span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} color="var(--primary-indigo)" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.88rem' }}>
                        at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Order Number
                    </span>
                    <div style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary-indigo)' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {/* Status Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.85rem',
                        borderRadius: 'var(--radius-full)',
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      <StatusIcon size={14} />
                      {statusInfo.label}
                    </div>

                    {/* Payment Badge */}
                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        background:
                          order.paymentStatus === 'PAID'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          order.paymentStatus === 'PAID'
                            ? 'var(--success-color)'
                            : 'var(--danger-color)',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      {order.paymentStatus}
                    </div>
                  </div>
                </div>

                {/* Body: Items Snapshot Previews */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.4rem' }}>
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.98rem', fontWeight: 600 }}>{item.name}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-indigo)' }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer: Destination, Total, Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '1.2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <MapPin size={16} color="var(--primary-indigo)" />
                    <span>
                      Shipping to: <strong style={{ color: 'var(--text-main)' }}>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.city}, {order.shippingAddress?.pincode})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block' }}>
                        Order Total
                      </span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Bonus: Advance status demo button if not delivered */}
                    {['PLACED', 'CONFIRMED', 'SHIPPED'].includes(order.status) && (
                      <button
                        onClick={() => handleAdvanceStatus(order._id, order.status)}
                        disabled={updatingId === order._id}
                        title="Bonus Feature: Advance order status to next lifecycle stage"
                        style={{
                          padding: '0.55rem 0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: 'var(--primary-indigo)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        {updatingId === order._id ? (
                          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <RotateCw size={13} />
                        )}
                        Advance Status
                      </button>
                    )}

                    <Link
                      to={`/orders/${order._id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.65rem 1.2rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--gradient-primary)',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      View Details
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
