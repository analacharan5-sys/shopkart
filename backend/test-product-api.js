import http from 'http';

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : null;

    const headers = {
      'Content-Type': 'application/json'
    };

    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
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

async function runProductTests() {
  console.log('\n======================================================');
  console.log('  SHOPKART PRODUCT CATALOG API TEST SUITE');
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

  try {
    // 1. Validation checks on POST /products
    console.log('--- 1. Testing Product Creation Validations ---');
    const resMissing = await makeRequest('/products', 'POST', {
      name: 'Incomplete Item'
    });
    assert(
      resMissing.status === 400,
      'POST /products missing fields returns HTTP 400',
      resMissing.body
    );

    const resInvalidPrice = await makeRequest('/products', 'POST', {
      name: 'Zero Price Item',
      description: 'Test description',
      price: -10,
      category: 'Electronics',
      image: 'https://example.com/item.jpg',
      stock: 5
    });
    assert(
      resInvalidPrice.status === 400,
      'POST /products negative price returns HTTP 400',
      resInvalidPrice.body
    );

    const resInvalidStock = await makeRequest('/products', 'POST', {
      name: 'Negative Stock Item',
      description: 'Test description',
      price: 100,
      category: 'Electronics',
      image: 'https://example.com/item.jpg',
      stock: -5
    });
    assert(
      resInvalidStock.status === 400,
      'POST /products negative stock returns HTTP 400',
      resInvalidStock.body
    );

    // 2. Successful creation
    console.log('\n--- 2. Testing Product Creation ---');
    const newProductData = {
      name: 'Test Mechanical Keyboard',
      description: 'RGB mechanical keyboard with blue switches.',
      price: 2999,
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
      stock: 10
    };
    const resCreate = await makeRequest('/products', 'POST', newProductData);
    assert(
      resCreate.status === 201 && resCreate.body.success === true,
      'POST /products creates product with HTTP 201',
      resCreate.body
    );
    const createdId = resCreate.body.product?._id;

    // 3. Get all products
    console.log('\n--- 3. Testing Get All Products ---');
    const resGetAll = await makeRequest('/products', 'GET');
    assert(
      resGetAll.status === 200 &&
        resGetAll.body.success === true &&
        Array.isArray(resGetAll.body.products),
      'GET /products returns list with HTTP 200',
      resGetAll.body
    );

    // 4. Search filter
    console.log('\n--- 4. Testing Search & Category Filtering ---');
    const resSearch = await makeRequest('/products?search=Mechanical', 'GET');
    assert(
      resSearch.status === 200 &&
        resSearch.body.products.some((p) => p.name.includes('Mechanical')),
      'GET /products?search=Mechanical returns filtered results',
      resSearch.body
    );

    const resCategory = await makeRequest('/products?category=Electronics', 'GET');
    assert(
      resCategory.status === 200 &&
        resCategory.body.products.every((p) => p.category.toLowerCase() === 'electronics'),
      'GET /products?category=Electronics returns only Electronics',
      resCategory.body
    );

    // 5. Price sorting (Bonus)
    const resSortAsc = await makeRequest('/products?sort=price_asc', 'GET');
    const prices = resSortAsc.body.products.map((p) => p.price);
    const isSortedAsc = prices.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(
      resSortAsc.status === 200 && isSortedAsc,
      'GET /products?sort=price_asc sorts products by price ascending',
      prices
    );

    // 6. Single product lookup
    console.log('\n--- 5. Testing Single Product Lookup ---');
    if (createdId) {
      const resGetSingle = await makeRequest(`/products/${createdId}`, 'GET');
      assert(
        resGetSingle.status === 200 && resGetSingle.body.name === 'Test Mechanical Keyboard',
        'GET /products/:id returns correct product details',
        resGetSingle.body
      );
    }

    const resInvalidId = await makeRequest('/products/invalid-id-123', 'GET');
    assert(
      resInvalidId.status === 400,
      'GET /products/invalid-id returns HTTP 400',
      resInvalidId.body
    );

    const resNotFound = await makeRequest('/products/66d123abc456789012345678', 'GET');
    assert(
      resNotFound.status === 404,
      'GET /products/nonexistent-id returns HTTP 404',
      resNotFound.body
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

runProductTests();
