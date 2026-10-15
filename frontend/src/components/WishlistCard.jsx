import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trash2, Tag, CheckCircle, AlertCircle } from 'lucide-react';

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);
  const isOutOfStock = product.stock <= 0;

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(product._id);
    setRemoving(false);
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

      {/* Image Container */}
      <div style={{ width: '100%', height: '190px', overflow: 'hidden', background: '#0f172a' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
          }}
        />
      </div>

      {/* Card Body Content */}
      <div
        style={{
          padding: '1.2rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justify: 'space-between'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: 'var(--text-main)',
              lineHeight: 1.3
            }}
          >
            {product.name}
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
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
          {/* Price & Stock info */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '0.8rem'
            }}
          >
            <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ₹{product.price?.toLocaleString('en-IN')}
            </span>

            <span
              style={{
                fontSize: '0.78rem',
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

          {/* Action Buttons: View Details & Remove */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <Link
              to={`/products/${product._id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--primary-indigo)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              View Details <ArrowRight size={14} />
            </Link>

            <button
              onClick={handleRemove}
              disabled={removing}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger-color)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: removing ? 'not-allowed' : 'pointer',
                opacity: removing ? 0.6 : 1
              }}
            >
              <Trash2 size={14} />
              {removing ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
