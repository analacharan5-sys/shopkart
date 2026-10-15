import React, { useState, useEffect } from 'react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchFilterBar from '../components/SearchFilterBar';
import { Package, AlertTriangle, Inbox, Loader2 } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('');

  // Fetch products whenever search, category, or sort changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (category && category !== 'All') params.append('category', category);
        if (sort) params.append('sort', sort);

        const response = await API.get(`/products?${params.toString()}`);
        if (response.data.success) {
          setProducts(response.data.products);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Something went wrong while loading products.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce search input slightly for better UX
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto 4rem', padding: '0 1rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Package size={32} color="var(--primary-indigo)" />
          Product Catalog & Discovery
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          Browse our collection of high quality products with instant search and filtering.
        </p>
      </div>

      {/* Search & Filter Component */}
      <SearchFilterBar
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
        sort={sort}
        setSort={setSort}
      />

      {/* UI State Handling */}

      {/* 1. Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--primary-indigo)' }}>
          <Loader2 size={40} className="glow-effect" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading products...</p>
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
            Error Loading Products
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && products.length === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: 'var(--radius-md)',
            maxWidth: '500px',
            margin: '2rem auto'
          }}
        >
          <Inbox size={56} color="var(--text-subtle)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No products found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Try adjusting your search query or selecting a different category filter.
          </p>
        </div>
      )}

      {/* 4. Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.8rem'
          }}
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
