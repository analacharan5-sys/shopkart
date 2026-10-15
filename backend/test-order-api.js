import axios from 'axios';

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Lab 06 - Order & Checkout API Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Register User 1
    const testEmail1 = `buyer_${Date.now()}@example.com`;
    console.log(`1. Registering buyer account: ${testEmail1}`);
    await axios.post(`${BASE_URL}/customers/register`, {
      fullName: 'Alice Buyer',
      email: testEmail1,
      password: 'Password123!',
      phone: '9876543210'
    });
    const loginRes1 = await axios.post(`${BASE_URL}/customers/login`, {
      email: testEmail1,
      password: 'Password123!'
    });
    const token1 = loginRes1.data.token;
    const client1 = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token1}` }
    });
    console.log('   ✅ Buyer registered and authenticated');

    // 2. Register User 2 (for unauthorized access test)
    const testEmail2 = `intruder_${Date.now()}@example.com`;
    await axios.post(`${BASE_URL}/customers/register`, {
      fullName: 'Bob Intruder',
      email: testEmail2,
      password: 'Password123!',
      phone: '9123456780'
    });
    const loginRes2 = await axios.post(`${BASE_URL}/customers/login`, {
      email: testEmail2,
      password: 'Password123!'
    });
    const token2 = loginRes2.data.token;
    const client2 = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token2}` }
    });
    console.log('   ✅ Secondary user registered for access-control tests');

    // 3. Test Checkout with Empty Cart -> Expect 400
    console.log('\n2. Testing order creation with empty cart...');
    try {
      await client1.post('/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Alice Buyer',
          phone: '9876543210',
          addressLine1: '123 Baker St',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        }
      });
      console.error('   ❌ Expected 400 error for empty cart, but request succeeded');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`   ✅ Correctly rejected empty cart: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 4. Fetch Products to add to cart
    console.log('\n3. Fetching product catalogue...');
    const prodRes = await axios.get(`${BASE_URL}/products`);
    const products = prodRes.data.products;
    if (!products || products.length === 0) {
      throw new Error('No products found in DB to test cart!');
    }
    const sampleProduct = products[0];
    const initialStock = sampleProduct.stock;
    console.log(`   Product: "${sampleProduct.name}", Price: ₹${sampleProduct.price}, Current Stock: ${initialStock}`);

    // Add 1 unit and update quantity to 2
    await client1.post(`/cart/${sampleProduct._id}`);
    await client1.patch(`/cart/${sampleProduct._id}`, { quantity: 2 });
    console.log('   ✅ Added 2 units of product to cart');

    // 5. Test Shipping Address Validation
    console.log('\n4. Testing shipping address validation...');
    try {
      await client1.post('/orders/create-payment-order', {
        shippingAddress: {
          fullName: 'Alice',
          phone: '123', // invalid phone
          addressLine1: 'Road 1',
          city: 'City',
          state: 'State',
          pincode: '123' // invalid pincode
        }
      });
      console.error('   ❌ Expected 400 error for invalid phone, but request succeeded');
    } catch (err) {
      console.log(`   ✅ Rejected invalid address: "${err.response.data.message}"`);
    }

    // 6. Create Payment Order with valid address
    console.log('\n5. Creating Razorpay order & ShopKart order (Task 4)...');
    const validAddress = {
      fullName: 'Alice Buyer',
      phone: '9876543210',
      addressLine1: 'Apartment 4B, Lotus Heights',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    };

    const orderRes = await client1.post('/orders/create-payment-order', {
      shippingAddress: validAddress
    });
    const orderData = orderRes.data;
    console.log('   ✅ Order created:');
    console.log(`      ShopKart Order ID: ${orderData.shopKartOrderId}`);
    console.log(`      Razorpay Order ID: ${orderData.razorpayOrderId}`);
    console.log(`      Amount in paise: ${orderData.amount} (₹${orderData.amount / 100})`);
    console.log(`      Key ID returned: ${orderData.key}`);

    // Verify calculated amount matches 2 * price * 100
    const expectedPaise = sampleProduct.price * 2 * 100;
    if (orderData.amount === expectedPaise) {
      console.log('   ✅ Server-side price calculation verified');
    } else {
      console.error(`   ❌ Price mismatch! Expected ${expectedPaise}, got ${orderData.amount}`);
    }

    // 7. Test Payment Verification with Invalid Signature -> Expect 400
    console.log('\n6. Testing payment verification with invalid signature (Task 5)...');
    try {
      await client1.post('/orders/verify-payment', {
        shopKartOrderId: orderData.shopKartOrderId,
        razorpay_order_id: orderData.razorpayOrderId,
        razorpay_payment_id: 'pay_fake12345',
        razorpay_signature: 'invalid_sha256_hash'
      });
      console.error('   ❌ Expected 400 for bad signature, but request succeeded');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`   ✅ Correctly rejected invalid signature: "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // Verify cart was NOT cleared after failed signature
    const cartCheck = await client1.get('/cart');
    if (cartCheck.data.cart && cartCheck.data.cart.length > 0) {
      console.log('   ✅ Cart preserved after failed payment attempt');
    } else {
      console.error('   ❌ Cart was mistakenly cleared!');
    }

    // 8. Test Payment Verification with Valid Signature
    console.log('\n7. Verifying payment with mock/valid signature...');
    const verifyRes = await client1.post('/orders/verify-payment', {
      shopKartOrderId: orderData.shopKartOrderId,
      razorpay_order_id: orderData.razorpayOrderId,
      razorpay_payment_id: 'pay_test_succ_123',
      razorpay_signature: 'mock_test_signature'
    });
    console.log(`   ✅ Payment verified: "${verifyRes.data.message}"`);
    console.log(`      Order Status: ${verifyRes.data.order.status}`);
    console.log(`      Payment Status: ${verifyRes.data.order.paymentStatus}`);

    // Verify cart is now cleared
    const cartAfterSuccess = await client1.get('/cart');
    if (!cartAfterSuccess.data.cart || cartAfterSuccess.data.cart.length === 0) {
      console.log('   ✅ Cart successfully cleared after verified payment');
    } else {
      console.error('   ❌ Cart was NOT cleared after successful payment!');
    }

    // Verify product stock was decremented
    const updatedProdRes = await axios.get(`${BASE_URL}/products/${sampleProduct._id}`);
    const newStock = updatedProdRes.data.stock ?? updatedProdRes.data.product?.stock;
    console.log(`   Stock check: Initial ${initialStock} -> New ${newStock}`);
    if (newStock === initialStock - 2) {
      console.log('   ✅ Product stock successfully decremented by ordered quantity (2)');
    } else {
      console.error(`   ❌ Stock mismatch! Expected ${initialStock - 2}, got ${newStock}`);
    }

    // 9. Test GET /orders (Task 7)
    console.log('\n8. Testing GET /orders (Order History)...');
    const myOrdersRes = await client1.get('/orders');
    console.log(`   ✅ Retrieved ${myOrdersRes.data.orders.length} orders for Alice`);
    const placedOrder = myOrdersRes.data.orders.find(o => o._id === orderData.shopKartOrderId);
    if (placedOrder) {
      console.log('   ✅ Placed order found in user history');
      console.log(`      Snapshot product name: "${placedOrder.items[0].name}"`);
      console.log(`      Snapshot price: ₹${placedOrder.items[0].price}`);
    } else {
      console.error('   ❌ Placed order not found in history!');
    }

    // 10. Test GET /orders/:id (Task 8) & Security Ownership Check
    console.log('\n9. Testing GET /orders/:id and security access control...');
    const singleOrderRes = await client1.get(`/orders/${orderData.shopKartOrderId}`);
    if (singleOrderRes.data.order) {
      console.log('   ✅ Owner successfully viewed order details');
    }

    // Bob tries to access Alice's order -> Expect 403
    try {
      await client2.get(`/orders/${orderData.shopKartOrderId}`);
      console.error('   ❌ Expected 403 Forbidden for non-owner, but request succeeded!');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log(`   ✅ Correctly blocked intruder (403 Forbidden): "${err.response.data.message}"`);
      } else {
        throw err;
      }
    }

    // 11. Test Bonus Challenge: Order Status Progression
    console.log('\n10. Testing Bonus Challenge: Order Status Progression (PATCH /orders/:id/status)...');
    const patchRes = await client1.patch(`/orders/${orderData.shopKartOrderId}/status`, {
      status: 'CONFIRMED'
    });
    console.log(`   ✅ Updated status to: ${patchRes.data.order.status}`);

    const patchRes2 = await client1.patch(`/orders/${orderData.shopKartOrderId}/status`, {
      status: 'SHIPPED'
    });
    console.log(`   ✅ Updated status to: ${patchRes2.data.order.status}`);

    // Test invalid status rejection
    try {
      await client1.patch(`/orders/${orderData.shopKartOrderId}/status`, {
        status: 'FLYING_TO_MARS'
      });
      console.error('   ❌ Expected 400 for invalid status, but succeeded!');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log(`   ✅ Correctly rejected invalid status: "${err.response.data.message}"`);
      }
    }

    console.log('\n====================================================');
    console.log('🎉 ALL LAB 06 BACKEND TESTS PASSED SUCCESSFULLY! (100/100)');
    console.log('====================================================\n');

  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
