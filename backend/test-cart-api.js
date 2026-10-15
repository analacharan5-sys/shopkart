import http from 'http';

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

let cookieStore = '';

function makeRequest(path, method = 'GET', data = null, useAuth = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : null;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    if (useAuth && cookieStore) {
      headers['Cookie'] = cookieStore;
    }

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            cookieStore = setCookie.map((c) => c.split(';')[0]).join('; ');
          }

          let body;
          try {
            body = JSON.parse(rawData);
          } catch {
            body = rawData;
          }
          resolve({ status: res.statusCode, body });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runCartTests() {
  console.log('\n======================================================');
  console.log('  SHOPKART SHOPPING CART SERVICE API TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       Details: ${JSON.stringify(details)}`);
      failed++;
    }
  }

  const testEmail = `cart_user_${Date.now()}@shopkart.com`;
  const testPassword = 'password123';

  try {
    // 1. Setup authenticated customer
    console.log('--- 1. Authenticating Test Customer ---');
    await makeRequest('/customers/register', 'POST', {
      fullName: 'Cart Tester',
      email: testEmail,
      password: testPassword,
      phone: '9876543210'
    });

    const loginRes = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: testPassword
    });

    assert(
      loginRes.status === 200 && cookieStore.includes('token='),
      'Customer authenticated and HttpOnly token cookie obtained'
    );

    // 2. Unauthenticated check
    console.log('\n--- 2. Testing Authorization Security ---');
    const resUnauth = await makeRequest('/cart', 'GET', null, false);
    assert(
      resUnauth.status === 401,
      'GET /cart without token returns HTTP 401 Unauthorized',
      resUnauth.body
    );

    // 3. Create test product with stock limit = 5
    console.log('\n--- 3. Creating Test Product (Stock: 5) ---');
    const prodRes = await makeRequest('/products', 'POST', {
      name: 'Test Gaming Mouse',
      description: 'Test product for cart verification.',
      price: 1499,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
      stock: 5
    });

    const testProductId = prodRes.body.product?._id;
    assert(
      prodRes.status === 201 && Boolean(testProductId),
      'Test product created successfully',
      prodRes.body
    );

    // 4. Add product to cart (quantity = 1)
    console.log('\n--- 4. Testing Add to Cart (POST /cart/:productId) ---');
    const resAdd1 = await makeRequest(`/cart/${testProductId}`, 'POST');
    assert(
      resAdd1.status === 200 && resAdd1.body.success === true,
      'POST /cart/:productId adds product with quantity 1',
      resAdd1.body
    );

    // 5. Add same product again (increments quantity to 2)
    const resAdd2 = await makeRequest(`/cart/${testProductId}`, 'POST');
    const itemInCart = resAdd2.body.cart?.find(
      (i) => (i.product?._id || i.product) === testProductId
    );

    assert(
      resAdd2.status === 200 && itemInCart && itemInCart.quantity === 2,
      'Re-adding same product increments quantity to 2',
      resAdd2.body
    );

    // 6. Get populated cart
    console.log('\n--- 5. Testing Get Cart with populate() (GET /cart) ---');
    const resGet = await makeRequest('/cart', 'GET');
    const populatedItem = resGet.body.cart?.find(
      (i) => i.product && i.product._id === testProductId
    );

    assert(
      resGet.status === 200 &&
        resGet.body.count === 2 &&
        populatedItem &&
        populatedItem.product.name === 'Test Gaming Mouse',
      'GET /cart returns populated product object with quantity',
      resGet.body
    );

    // 7. Update quantity (PATCH /cart/:productId)
    console.log('\n--- 6. Testing Quantity Updates & Stock Validations ---');
    const resUpdateValid = await makeRequest(`/cart/${testProductId}`, 'PATCH', {
      quantity: 3
    });
    assert(
      resUpdateValid.status === 200 && resUpdateValid.body.success === true,
      'PATCH /cart/:productId updates quantity to 3',
      resUpdateValid.body
    );

    // 8. Exceed stock limit validation (stock = 5, request = 10)
    const resExceedStock = await makeRequest(`/cart/${testProductId}`, 'PATCH', {
      quantity: 10
    });
    assert(
      resExceedStock.status === 400,
      'PATCH /cart/:productId exceeding stock limit returns HTTP 400 Bad Request',
      resExceedStock.body
    );

    // 9. Quantity < 1 validation
    const resMinQty = await makeRequest(`/cart/${testProductId}`, 'PATCH', {
      quantity: 0
    });
    assert(
      resMinQty.status === 400,
      'PATCH /cart/:productId quantity < 1 returns HTTP 400 Bad Request',
      resMinQty.body
    );

    // 10. Remove product from cart
    console.log('\n--- 7. Testing Remove Product (DELETE /cart/:productId) ---');
    const resRemove = await makeRequest(`/cart/${testProductId}`, 'DELETE');
    assert(
      resRemove.status === 200 && resRemove.body.success === true,
      'DELETE /cart/:productId removes item from cart',
      resRemove.body
    );

    const resRemoveNonExistent = await makeRequest(`/cart/${testProductId}`, 'DELETE');
    assert(
      resRemoveNonExistent.status === 404,
      'DELETE /cart/:productId when not in cart returns HTTP 404',
      resRemoveNonExistent.body
    );

    // 11. Edge cases
    console.log('\n--- 8. Testing Edge Cases & Validations ---');
    const resInvalidId = await makeRequest('/cart/invalid-object-id', 'POST');
    assert(
      resInvalidId.status === 400,
      'Invalid productId format returns HTTP 400',
      resInvalidId.body
    );

    const resNotFoundProd = await makeRequest('/cart/66d123abc456789012345678', 'POST');
    assert(
      resNotFoundProd.status === 404,
      'Non-existent product ID returns HTTP 404',
      resNotFoundProd.body
    );

    console.log('\n======================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runCartTests();
