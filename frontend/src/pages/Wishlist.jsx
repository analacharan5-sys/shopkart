import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import WishlistCard from '../components/WishlistCard';
import { Heart, Loader2, AlertTriangle, ArrowRight, ShoppingBag, LogIn, UserPlus } from 'lucide-react';

const Wishlist = ({ onWishlistCountChange }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError('');
    setIsUnauthenticated(false);

    try {
      const response = await API.get('/wishlist');
      if (response.data.success) {
        setWishlist(response.data.wishlist);
        if (onWishlistCountChange) {
          onWishlistCountChange(response.data.count);
        }
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
      if (err.response?.status === 401) {
        setIsUnauthenticated(true);
      } else {
        setError("We couldn't load your wishlist.");
      }
    } finally {
      setLoading(false);
    }
  }, [onWishlistCountChange]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    try {
      const response = await API.delete(`/wishlist/${productId}`);
      if (response.data.success) {
        const updated = wishlist.filter((item) => item._id !== productId);
        setWishlist(updated);
        if (onWishlistCountChange) {
          onWishlistCountChange(updated.length);
        }
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Header */}
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
          <Heart size={32} color="var(--primary-pink)" fill="var(--primary-pink)" />
          My Wishlist
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          {loading
            ? 'Fetching your saved items...'
            : isUnauthenticated
            ? 'Please log in to view your saved items.'
            : `${wishlist.length} product${wishlist.length === 1 ? '' : 's'} saved for later.`}
        </p>
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--primary-pink)' }}>
          <Loader2
            size={40}
            className="glow-effect"
            style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}
          />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading your wishlist...</p>
        </div>
      )}

      {/* 2. Unauthenticated State */}
      {!loading && isUnauthenticated && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '520px',
            margin: '2rem auto'
          }}
        >
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.2rem'
            }}
          >
            <LogIn size={32} color="var(--primary-indigo)" />
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Sign In Required
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Please log into your ShopKart account to save products and view your wishlist.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.6rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gradient-primary)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
              }}
            >
              <LogIn size={18} /> Sign In
            </Link>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.6rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontWeight: 600
              }}
            >
              <UserPlus size={18} /> Register
            </Link>
          </div>
        </div>
      )}

      {/* 3. General Server Error State */}
      {!loading && !isUnauthenticated && error && (
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
          <h3
            style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--danger-color)',
              marginBottom: '0.5rem'
            }}
          >
            Something went wrong
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>

          <button
            onClick={fetchWishlist}
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

      {/* 4. Empty Wishlist State */}
      {!loading && !isUnauthenticated && !error && wishlist.length === 0 && (
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
              background: 'rgba(236, 72, 153, 0.15)',
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <Heart size={36} color="var(--primary-pink)" fill="var(--primary-pink)" />
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            Your wishlist is empty
          </h3>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '1rem',
              marginBottom: '2rem',
              lineHeight: 1.5
            }}
          >
            Save products you love and find them here later when you're ready to purchase.
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

      {/* 5. Wishlist Grid */}
      {!loading && !isUnauthenticated && !error && wishlist.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '1.8rem'
          }}
        >
          {wishlist.map((product) => (
            <WishlistCard key={product._id} product={product} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
