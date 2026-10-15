import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Tag, CheckCircle, AlertCircle, ShieldCheck, Truck, Loader2 } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await API.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (err.response?.status === 404) {
          setError('Product not found.');
        } else {
          setError('Failed to load product details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || adding) return;
    setAdding(true);
    setActionMsg('');

    const res = await addToCart(product._id);
    if (res.success) {
      setActionMsg('Added to Cart! 🛒');
      setTimeout(() => setActionMsg(''), 2000);
    } else {
      const msg = res.message || '';
      if (
        msg.toLowerCase().includes('log in') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('customer') ||
        msg.includes('401')
      ) {
        setActionMsg('Please log in to add items to cart.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(''), 2500);
      }
    }
    setAdding(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--primary-indigo)' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
          <AlertCircle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger-color)' }}>
            {error || 'Product Not Found'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            The requested product ID could not be retrieved from the ShopKart database.
          </p>
          <Link
            to="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} /> Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const itemInCart = cartItems.find(
    (item) => (item.product?._id || item.product) === product._id
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto 4rem', padding: '0 1rem' }} className="animate-fade-in">
      {/* Back Button */}
      <Link
        to="/products"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          transition: 'color 0.2s ease'
        }}
      >
        <ArrowLeft size={18} /> Back to Catalog
      </Link>

      {/* Product Details Layout Grid */}
      <div
        className="glass-panel"
        style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          padding: '2.5rem'
        }}
      >
        {/* Product Image Section */}
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0f172a', height: '380px' }}>
          <img
            src={product.image}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Product Information Section */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Category badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary-indigo)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}
            >
              <Tag size={14} /> {product.category}
            </span>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.8rem', color: 'var(--text-main)' }}>
              {product.name}
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {product.description}
            </p>

            {/* Price Tag */}
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </div>

            {/* Stock Availability status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '2rem',
                color: isOutOfStock ? 'var(--danger-color)' : 'var(--success-color)'
              }}
            >
              {isOutOfStock ? (
                <>
                  <AlertCircle size={20} /> Currently Out of Stock
                </>
              ) : (
                <>
                  <CheckCircle size={20} /> In Stock ({product.stock} units available)
                </>
              )}
            </div>
          </div>

          <div>
            {actionMsg && (
              <div
                style={{
                  fontSize: '0.85rem',
                  color: actionMsg.includes('Added') ? 'var(--success-color)' : 'var(--danger-color)',
                  marginBottom: '0.6rem',
                  textAlign: 'center',
                  fontWeight: 600
                }}
              >
                {actionMsg}
              </div>
            )}

            {/* Add to Cart Button connected to CartContext */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: itemInCart ? 'rgba(99, 102, 241, 0.25)' : 'var(--gradient-primary)',
                border: itemInCart ? '1px solid var(--primary-indigo)' : 'none',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: isOutOfStock || adding ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.25s ease',
                marginBottom: '1.5rem'
              }}
            >
              <ShoppingCart size={20} />
              {adding
                ? 'Adding to Cart...'
                : itemInCart
                ? `Add Another (${itemInCart.quantity} in Cart)`
                : 'Add to Cart'}
            </button>

            {/* Feature Perks */}
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-subtle)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck size={16} /> Free Delivery
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} /> Authentic Product
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
