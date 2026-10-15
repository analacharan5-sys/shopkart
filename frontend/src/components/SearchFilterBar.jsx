import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

const SearchFilterBar = ({ search, setSearch, category, setCategory, sort, setSort }) => {
  const categories = ['All', 'Electronics', 'Fashion', 'Books', 'Home'];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.2rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Search Input */}
      <div style={{ flex: '1 1 300px', position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.6rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            background: 'rgba(15, 23, 42, 0.6)',
            color: 'var(--text-main)',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary-indigo)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Category Dropdown Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--primary-indigo)" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.9)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price Sorting Dropdown (Bonus Challenge) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={16} color="var(--primary-violet)" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'rgba(15, 23, 42, 0.9)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Sort By (Default)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
