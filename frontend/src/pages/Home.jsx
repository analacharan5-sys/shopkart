import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { User, Mail, Phone, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/customers/me');
        setProfile(response.data);
        setUser(response.data);
      } catch (err) {
        console.error('Unauthenticated access to /home:', err);
        setError('Unauthorized');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, setUser]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.2rem' }}>Loading customer profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }} className="animate-fade-in">
      {/* Hero Welcome Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'var(--gradient-glow)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.8rem' }}>
          <ShieldCheck size={18} />
          Authenticated Session Active
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Welcome back, <span className="text-gradient">{profile.fullName}</span>! 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px' }}>
          You have successfully logged into ShopKart. Your account is protected with HttpOnly cookie JWT authentication.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
          Customer Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <User size={16} /> Full Name
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{profile.fullName}</p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-violet)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <Mail size={16} /> Email Address
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{profile.email}</p>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-pink)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <Phone size={16} /> Phone Number
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{profile.phone}</p>
          </div>
        </div>

        {/* Quick Action Button to Products Catalog */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Ready to shop?</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Explore our latest product catalog and discovery page.</p>
          </div>
          <Link
            to="/products"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
            }}
          >
            <ShoppingBag size={18} /> Browse Products <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
