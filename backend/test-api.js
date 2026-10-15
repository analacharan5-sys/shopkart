import http from 'http';

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}`;

let cookieStore = '';

function makeRequest(path, method = 'GET', data = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = data ? JSON.stringify(data) : null;

    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    if (cookieStore) {
      headers['Cookie'] = cookieStore;
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          // Capture cookies if set
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

          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  SHOPKART BACKEND AUTHENTICATION API TEST SUITE');
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

  const testEmail = `test_${Date.now()}@shopkart.com`;
  const testPassword = 'password123';
  const newPassword = 'newPassword456';

  try {
    // 1. Missing fields check
    console.log('--- 1. Testing Register API Validations ---');
    const resMissing = await makeRequest('/customers/register', 'POST', {
      email: testEmail,
      password: testPassword
    });
    assert(
      resMissing.status === 400,
      'Register with missing fields returns HTTP 400',
      resMissing.body
    );

    // 2. Short password check
    const resShortPass = await makeRequest('/customers/register', 'POST', {
      fullName: 'Test User',
      email: testEmail,
      password: '123',
      phone: '9876543210'
    });
    assert(
      resShortPass.status === 400,
      'Register with short password (< 6 chars) returns HTTP 400',
      resShortPass.body
    );

    // 3. Successful registration
    console.log('\n--- 2. Testing Customer Registration ---');
    const resRegister = await makeRequest('/customers/register', 'POST', {
      fullName: 'Test Customer',
      email: testEmail,
      password: testPassword,
      phone: '9876543210'
    });
    assert(
      resRegister.status === 201 && resRegister.body.success === true,
      'Customer registered successfully with HTTP 201',
      resRegister.body
    );
    assert(
      resRegister.body.customer &&
        resRegister.body.customer.email === testEmail &&
        !resRegister.body.customer.password,
      'Registered response excludes password field',
      resRegister.body
    );

    // 4. Duplicate email check
    const resDuplicate = await makeRequest('/customers/register', 'POST', {
      fullName: 'Test Customer Duplicate',
      email: testEmail,
      password: testPassword,
      phone: '9876543210'
    });
    assert(
      resDuplicate.status === 409,
      'Register duplicate email returns HTTP 409',
      resDuplicate.body
    );

    // 5. Login with invalid password
    console.log('\n--- 3. Testing Login API ---');
    const resWrongLogin = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: 'wrongpassword'
    });
    assert(
      resWrongLogin.status === 401 &&
        resWrongLogin.body.message === 'Invalid credentials',
      'Login with incorrect password returns HTTP 401 ("Invalid credentials")',
      resWrongLogin.body
    );

    // 6. Successful Login
    cookieStore = ''; // clear any stored cookies
    const resLogin = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: testPassword
    });
    assert(
      resLogin.status === 200 && resLogin.body.success === true,
      'Login successful returns HTTP 200',
      resLogin.body
    );
    const setCookieHeader = resLogin.headers['set-cookie']
      ? resLogin.headers['set-cookie'].join(';')
      : '';
    assert(
      setCookieHeader.includes('token=') && setCookieHeader.includes('HttpOnly'),
      'Login sets HttpOnly cookie "token"',
      setCookieHeader
    );

    // 7. Get Profile (Protected)
    console.log('\n--- 4. Testing Get Profile (/customers/me) ---');
    const resProfile = await makeRequest('/customers/me', 'GET');
    assert(
      resProfile.status === 200 &&
        resProfile.body.email === testEmail &&
        !resProfile.body.password,
      'Authenticated GET /customers/me returns user profile without password',
      resProfile.body
    );

    // 8. Access Profile without token
    const oldCookie = cookieStore;
    cookieStore = ''; // clear token
    const resNoToken = await makeRequest('/customers/me', 'GET');
    assert(
      resNoToken.status === 401,
      'Unauthenticated GET /customers/me returns HTTP 401',
      resNoToken.body
    );
    cookieStore = oldCookie; // restore token

    // 9. Bonus: Change Password Failure (Wrong Old Password)
    console.log('\n--- 5. Testing Bonus: Change Password ---');
    const resWrongOldPass = await makeRequest(
      '/customers/change-password',
      'PATCH',
      {
        oldPassword: 'wrongoldpass',
        newPassword
      }
    );
    assert(
      resWrongOldPass.status === 401,
      'Change password with incorrect old password returns HTTP 401',
      resWrongOldPass.body
    );

    // 10. Bonus: Change Password Success
    const resChangePass = await makeRequest(
      '/customers/change-password',
      'PATCH',
      {
        oldPassword: testPassword,
        newPassword
      }
    );
    assert(
      resChangePass.status === 200 && resChangePass.body.success === true,
      'Change password with correct old password returns HTTP 200',
      resChangePass.body
    );

    // 11. Login with New Password
    cookieStore = '';
    const resLoginNewPass = await makeRequest('/customers/login', 'POST', {
      email: testEmail,
      password: newPassword
    });
    assert(
      resLoginNewPass.status === 200 && resLoginNewPass.body.success === true,
      'Login with newly updated password succeeds',
      resLoginNewPass.body
    );

    // 12. Logout
    console.log('\n--- 6. Testing Logout API ---');
    const resLogout = await makeRequest('/customers/logout', 'POST');
    assert(
      resLogout.status === 200 && resLogout.body.success === true,
      'Logout returns HTTP 200 and success message',
      resLogout.body
    );

    // 13. Verify profile access fails post-logout
    cookieStore = ''; // cleared by server clearCookie header
    const resPostLogout = await makeRequest('/customers/me', 'GET');
    assert(
      resPostLogout.status === 401,
      'GET /customers/me after logout returns HTTP 401',
      resPostLogout.body
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

runTests();
