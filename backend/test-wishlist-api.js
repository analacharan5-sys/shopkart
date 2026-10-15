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

async function runWishlistTests() {
  console.log('\n======================================================');
  console.log('  SHOPKART WISHLIST SERVICE API TEST SUITE');
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

  const testEmail = `wishlist_user_${Date.now()}@shopkart.com`;
  const testPassword = 'password123';

  try {
    // 1. Setup authenticated customer
    console.log('--- 1. Authenticating Test Customer ---');
    await makeRequest('/customers/register', 'POST', {
      fullName: 'Wishlist Tester',
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
    const resUnauth = await makeRequest('/wishlist', 'GET', null, false);
    assert(
      resUnauth.status === 401,
      'GET /wishlist without token returns HTTP 401 Unauthorized',
      resUnauth.body
    );

    // 3. Create test product
    console.log('\n--- 3. Creating Test Product ---');
    const prodRes = await makeRequest('/products', 'POST', {
      name: 'Wishlist Wireless Headphones',
      description: 'Test product for wishlist verification.',
      price: 3999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      stock: 15
    });

    const testProductId = prodRes.body.product?._id;
    assert(
      prodRes.status === 201 && Boolean(testProductId),
      'Test product created successfully',
      prodRes.body
    );

    // 4. Add product to wishlist
    console.log('\n--- 4. Testing Add to Wishlist (POST /wishlist/:productId) ---');
    const resAdd = await makeRequest(`/wishlist/${testProductId}`, 'POST');
    assert(
      resAdd.status === 200 && resAdd.body.success === true,
      'POST /wishlist/:productId adds product to wishlist',
      resAdd.body
    );

    // 5. Prevent duplicate addition (HTTP 409 Conflict)
    const resDup = await makeRequest(`/wishlist/${testProductId}`, 'POST');
    assert(
      resDup.status === 409,
      'POST /wishlist/:productId duplicate entry returns HTTP 409 Conflict',
      resDup.body
    );

    // 6. Get populated wishlist
    console.log('\n--- 5. Testing Get Wishlist with populate() (GET /wishlist) ---');
    const resGet = await makeRequest('/wishlist', 'GET');
    const hasPopulatedProduct =
      resGet.body.wishlist &&
      resGet.body.wishlist.some((item) => item._id === testProductId && item.name);

    assert(
      resGet.status === 200 &&
        resGet.body.count >= 1 &&
        hasPopulatedProduct,
      'GET /wishlist returns populated product objects',
      resGet.body
    );

    // 7. Toggle endpoint (Bonus)
    console.log('\n--- 6. Testing Toggle Wishlist (PATCH /wishlist/:productId/toggle) ---');
    const resToggleRemove = await makeRequest(`/wishlist/${testProductId}/toggle`, 'PATCH');
    assert(
      resToggleRemove.status === 200 && resToggleRemove.body.inWishlist === false,
      'PATCH toggle removes existing product from wishlist',
      resToggleRemove.body
    );

    const resToggleAdd = await makeRequest(`/wishlist/${testProductId}/toggle`, 'PATCH');
    assert(
      resToggleAdd.status === 200 && resToggleAdd.body.inWishlist === true,
      'PATCH toggle adds non-saved product back to wishlist',
      resToggleAdd.body
    );

    // 8. Remove from wishlist
    console.log('\n--- 7. Testing Remove Product (DELETE /wishlist/:productId) ---');
    const resRemove = await makeRequest(`/wishlist/${testProductId}`, 'DELETE');
    assert(
      resRemove.status === 200 && resRemove.body.success === true,
      'DELETE /wishlist/:productId removes product from wishlist',
      resRemove.body
    );

    const resRemoveNonExistent = await makeRequest(`/wishlist/${testProductId}`, 'DELETE');
    assert(
      resRemoveNonExistent.status === 404,
      'DELETE /wishlist/:productId when not in wishlist returns HTTP 404',
      resRemoveNonExistent.body
    );

    // 9. Edge cases: Invalid ID & Non-existent product
    console.log('\n--- 8. Testing Edge Cases & Validations ---');
    const resInvalidId = await makeRequest('/wishlist/invalid-object-id', 'POST');
    assert(
      resInvalidId.status === 400,
      'Invalid productId format returns HTTP 400',
      resInvalidId.body
    );

    const resNotFoundProd = await makeRequest('/wishlist/66d123abc456789012345678', 'POST');
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

runWishlistTests();
