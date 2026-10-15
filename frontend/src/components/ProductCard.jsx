import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { ArrowRight, Tag, CheckCircle, AlertCircle, Heart, ShoppingBag, Loader2 } from 'lucide-react';

const ProductCard = ({ product, initialSaved = false, onWishlistChange }) => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOutOfStock = product.stock <= 0;

  // Check if item is already present in cart
  const itemInCart = cartItems.find(
    (item) => (item.product?._id || item.product) === product._id
  );

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg('');
    setSavingWishlist(true);

    try {
      const response = await API.patch(`/wishlist/${product._id}/toggle`);
      if (response.data.success) {
        setIsSaved(response.data.inWishlist);
        if (onWishlistChange) onWishlistChange();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMsg('Please log in to save items.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setErrorMsg(err.response?.data?.message || 'Unable to save product.');
        setTimeout(() => setErrorMsg(''), 2500);
      }
    } finally {
      setSavingWishlist(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || addingCart) return;
    setErrorMsg('');
    setAddingCart(true);

    const res = await addToCart(product._id);
    if (!res.success) {
      const msg = res.message || '';
      if (
        msg.toLowerCase().includes('log in') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('customer') ||
        msg.includes('401')
      ) {
        setErrorMsg('Please log in to add items to cart.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(''), 2500);
      }
    }
    setAddingCart(false);
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Category Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          padding: '0.3rem 0.7rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--primary-indigo)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          zIndex: 2
        }}
      >
        <Tag size={12} />
        {product.category}
      </div>

      {/* Heart Icon Button overlay on top right */}
      <button
        onClick={handleWishlistToggle}
        disabled={savingWishlist}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: isSaved ? 'rgba(236, 72, 153, 0.25)' : 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: isSaved ? '1px solid var(--primary-pink)' : '1px solid var(--border-color)',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: savingWishlist ? 'not-allowed' : 'pointer',
          zIndex: 2,
          transition: 'all 0.2s ease'
        }}
        title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        {savingWishlist ? (
          <Loader2 size={16} color="var(--primary-pink)" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Heart
            size={18}
            color={isSaved ? 'var(--primary-pink)' : 'var(--text-muted)'}
            fill={isSaved ? 'var(--primary-pink)' : 'none'}
          />
        )}
      </button>

      {/* Image Container */}
      <div style={{ width: '100%', height: '190px', overflow: 'hidden', background: '#0f172a' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Card Content */}
      <div
        style={{
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              marginBottom: '0.4rem',
              color: 'var(--text-main)',
              lineHeight: 1.3
            }}
          >
            {product.name}
          </h3>
          <p
            style={{
              fontSize: '0.83rem',
              color: 'var(--text-muted)',
              marginBottom: '0.8rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {product.description}
          </p>
        </div>

        <div>
          {errorMsg && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--danger-color)',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Price & Stock info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.8rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.6rem'
            }}
          >
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: isOutOfStock ? 'var(--danger-color)' : 'var(--success-color)'
              }}
            >
              {isOutOfStock ? (
                <>
                  <AlertCircle size={14} /> Out of Stock
                </>
              ) : (
                <>
                  <CheckCircle size={14} /> {product.stock} left
                </>
              )}
            </span>
          </div>

          {/* Primary Action Button: Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || addingCart}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: itemInCart ? 'rgba(99, 102, 241, 0.2)' : 'var(--gradient-primary)',
              border: itemInCart ? '1px solid var(--primary-indigo)' : 'none',
              color: itemInCart ? 'var(--primary-indigo)' : '#fff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: isOutOfStock || addingCart ? 'not-allowed' : 'pointer',
              opacity: isOutOfStock ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginBottom: '0.5rem',
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingBag size={16} />
            {addingCart
              ? 'Adding...'
              : itemInCart
              ? `Add Another (${itemInCart.quantity})`
              : 'Add to Cart'}
          </button>

          {/* Secondary Action: View Details */}
          <Link
            to={`/products/${product._id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
              width: '100%',
              padding: '0.45rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.82rem',
              textAlign: 'center'
            }}
          >
            View Details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
