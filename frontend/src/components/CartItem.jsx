import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const product = item.product || {};
  const quantity = item.quantity || 1;
  const isMaxStock = quantity >= (product.stock || 9999);
  const isMinQuantity = quantity <= 1;

  const handleDecrease = async () => {
    if (isMinQuantity || updating) return;
    setUpdating(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, quantity - 1);
    if (!res.success) {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(''), 2500);
    }
    setUpdating(false);
  };

  const handleIncrease = async () => {
    if (isMaxStock || updating) return;
    setUpdating(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, quantity + 1);
    if (!res.success) {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(''), 2500);
    }
    setUpdating(false);
  };

  const handleRemove = async () => {
    setUpdating(true);
    await removeFromCart(product._id);
    setUpdating(false);
  };

  const lineTotal = (product.price || 0) * quantity;

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        padding: '1.2rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.2rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Product Image & Info */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: '1 1 280px' }}>
        <div
          style={{
            width: '90px',
            height: '90px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: '#0f172a',
            flexShrink: 0
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src =
                'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        <div>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--primary-indigo)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Tag size={12} /> {product.category}
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0' }}>
            <Link to={`/products/${product._id}`} style={{ color: 'var(--text-main)' }}>
              {product.name}
            </Link>
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            ₹{product.price?.toLocaleString('en-IN')} each
          </p>
        </div>
      </div>

      {/* Quantity Controls [-] QTY [+] */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleDecrease}
            disabled={isMinQuantity || updating}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: isMinQuantity ? 'var(--text-subtle)' : 'var(--text-main)',
              cursor: isMinQuantity || updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Decrease Quantity"
          >
            <Minus size={14} />
          </button>

          <span style={{ fontSize: '1rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
            {quantity}
          </span>

          <button
            onClick={handleIncrease}
            disabled={isMaxStock || updating}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: isMaxStock ? 'var(--text-subtle)' : 'var(--text-main)',
              cursor: isMaxStock || updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isMaxStock ? 'Stock limit reached' : 'Increase Quantity'}
          >
            <Plus size={14} />
          </button>
        </div>

        {errorMsg && (
          <span style={{ fontSize: '0.72rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <AlertCircle size={10} /> {errorMsg}
          </span>
        )}
      </div>

      {/* Line Item Total & Remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'flex-end', minWidth: '160px' }}>
        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
          ₹{lineTotal.toLocaleString('en-IN')}
        </span>

        <button
          onClick={handleRemove}
          disabled={updating}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger-color)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            cursor: updating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Remove Item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
