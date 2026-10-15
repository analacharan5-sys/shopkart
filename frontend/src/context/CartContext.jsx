import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children, user }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch cart from backend whenever authenticated user is present
  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/cart');
      if (response.data.success) {
        setCartItems(response.data.cart || []);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      if (err.response?.status !== 401) {
        setError('Unable to load your cart.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Task 2 — Add product to cart (or increment quantity by 1)
  const addToCart = async (productId) => {
    setError('');
    try {
      const response = await API.post(`/cart/${productId}`);
      if (response.data.success) {
        await refreshCart();
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add product to cart.';
      return { success: false, message };
    }
  };

  // Task 4 — Update quantity
  const updateQuantity = async (productId, quantity) => {
    setError('');
    try {
      const response = await API.patch(`/cart/${productId}`, { quantity });
      if (response.data.success) {
        await refreshCart();
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update quantity.';
      return { success: false, message };
    }
  };

  // Task 5 — Remove item from cart
  const removeFromCart = async (productId) => {
    setError('');
    try {
      const response = await API.delete(`/cart/${productId}`);
      if (response.data.success) {
        await refreshCart();
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove item.';
      return { success: false, message };
    }
  };

  // Derived values (Task 15)
  const totalUnits = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    const qty = item.quantity || 0;
    return sum + price * qty;
  }, 0);

  // Clear cart locally after verified order
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalUnits,
        subtotal,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
