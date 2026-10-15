import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { ShoppingBag, LogOut, User, Home, Package, Heart, ShoppingCart, LogIn, UserPlus, ClipboardList } from 'lucide-react';

const Navbar = ({ user, setUser, wishlistCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnits } = useCart();

  const handleLogout = async () => {
    try {
      await API.post('/customers/logout');
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setUser(null);
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="glass-panel"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.8rem 2rem',
        marginBottom: '2rem'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/products"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '1.4rem',
            fontWeight: 700
          }}
        >
          <div
            style={{
              background: 'var(--gradient-primary)',
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex'
            }}
          >
            <ShoppingBag size={22} color="#fff" />
          </div>
          <span className="text-gradient">ShopKart</span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link
            to="/products"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive('/products') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: isActive('/products') ? 'var(--primary-indigo)' : 'var(--text-muted)',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            <Package size={18} />
            Products
          </Link>

          <Link
            to="/wishlist"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive('/wishlist') ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
              color: isActive('/wishlist') ? 'var(--primary-pink)' : 'var(--text-muted)',
              fontWeight: 500,
              transition: 'all 0.2s ease'
            }}
          >
            <Heart
              size={18}
              color={isActive('/wishlist') ? 'var(--primary-pink)' : 'var(--text-muted)'}
              fill={isActive('/wishlist') ? 'var(--primary-pink)' : 'none'}
            />
            Wishlist
            {wishlistCount > 0 && (
              <span
                style={{
                  background: 'var(--primary-pink)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.1rem 0.55rem',
                  marginLeft: '0.15rem'
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: isActive('/cart') ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: isActive('/cart') ? 'var(--primary-indigo)' : 'var(--text-main)',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            <ShoppingCart size={18} color="var(--primary-indigo)" />
            Cart
            {totalUnits > 0 && (
              <span
                style={{
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.1rem 0.55rem',
                  marginLeft: '0.15rem'
                }}
              >
                {totalUnits}
              </span>
            )}
          </Link>

          {user && (
            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive('/orders') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive('/orders') ? 'var(--primary-indigo)' : 'var(--text-muted)',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <ClipboardList size={18} />
              My Orders
            </Link>
          )}

          {user && (
            <Link
              to="/home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive('/home') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive('/home') ? 'var(--primary-indigo)' : 'var(--text-muted)',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <Home size={18} />
              My Profile
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginLeft: '0.4rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              >
                <div
                  style={{
                    background: '#334155',
                    borderRadius: '50%',
                    padding: '0.3rem',
                    display: 'flex'
                  }}
                >
                  <User size={16} color="var(--primary-indigo)" />
                </div>
                <span>{user.fullName || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger-color)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem', marginLeft: '0.4rem' }}>
              <Link
                to="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                <LogIn size={15} />
                Login
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <UserPlus size={15} />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
