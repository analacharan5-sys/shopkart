import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './services/api';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';

function App() {
  const [user, setUser] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check initial authentication status via /customers/me & fetch wishlist count
  useEffect(() => {
    const checkAuthAndWishlist = async () => {
      try {
        const response = await API.get('/customers/me');
        setUser(response.data);

        // Fetch initial wishlist count if authenticated
        try {
          const wishlistRes = await API.get('/wishlist');
          if (wishlistRes.data.success) {
            setWishlistCount(wishlistRes.data.count);
          }
        } catch {
          setWishlistCount(0);
        }
      } catch {
        setUser(null);
        setWishlistCount(0);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthAndWishlist();
  }, []);

  const refreshWishlistCount = async () => {
    try {
      const response = await API.get('/wishlist');
      if (response.data.success) {
        setWishlistCount(response.data.count);
      }
    } catch {
      // Ignore unauth
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.2rem' }}>Initializing ShopKart App...</p>
      </div>
    );
  }

  return (
    <CartProvider user={user}>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar user={user} setUser={setUser} wishlistCount={wishlistCount} />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/home" element={<Home user={user} setUser={setUser} />} />
              <Route
                path="/products"
                element={<Products onWishlistChange={refreshWishlistCount} />}
              />
              <Route
                path="/products/:id"
                element={<ProductDetails onWishlistChange={refreshWishlistCount} />}
              />
              <Route
                path="/wishlist"
                element={<Wishlist onWishlistCountChange={setWishlistCount} />}
              />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
