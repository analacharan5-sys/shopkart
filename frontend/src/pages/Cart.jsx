import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { ShoppingBag, ArrowRight, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalUnits, subtotal, loading, error, refreshCart } = useCart();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            marginBottom: '0.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem'
          }}
        >
          <ShoppingBag size={32} color="var(--primary-indigo)" />
          My Shopping Cart
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          {loading
            ? 'Calculating cart totals...'
            : `${totalUnits} total unit${totalUnits === 1 ? '' : 's'} across ${cartItems.length} product${cartItems.length === 1 ? '' : 's'}.`}
        </p>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--primary-indigo)' }}>
          <Loader2
            size={40}
            className="glow-effect"
            style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}
          />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading your cart...</p>
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
            maxWidth: '500px',
            margin: '2rem auto'
          }}
        >
          <AlertTriangle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--danger-color)', marginBottom: '0.5rem' }}>
            Unable to load your cart
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>

          <button
            onClick={refreshCart}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && cartItems.length === 0 && (
        <div
          className="glass-panel animate-fade-in"
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
              background: 'rgba(99, 102, 241, 0.15)',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <ShoppingBag size={36} color="var(--primary-indigo)" />
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            Your cart is empty 🛒
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
            Looks like you haven't added anything yet. Explore our products catalog to start shopping!
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
            Browse Products
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {/* 4. Active Cart Grid with Order Summary */}
      {!loading && !error && cartItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Left Column: Cart Items List */}
          <div style={{ flex: '2 1 550px' }}>
            {cartItems.map((item) => (
              <CartItem key={item.product?._id || item._id} item={item} />
            ))}
          </div>

          {/* Right Column: Order Summary Card */}
          <div style={{ flex: '1 1 300px' }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', sticky: 'top', top: '100px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  <span>Total Items ({cartItems.length} products)</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{totalUnits} units</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  <span>Estimated Delivery</span>
                  <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>FREE</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Subtotal</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 18px rgba(99, 102, 241, 0.4)'
                }}
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1.2rem', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                <ShieldCheck size={16} /> Secure 256-bit Encrypted Checkout
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
