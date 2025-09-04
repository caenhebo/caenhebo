const puppeteer = require('puppeteer');

async function debugAuthentication() {
  console.log('🔍 Debugging wallet authentication issue...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true in production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable request interception to capture session details
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/wallets')) {
        console.log('📋 Wallets API Request Headers:', request.headers());
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/wallets')) {
        const responseBody = await response.text();
        console.log('📋 Wallets API Response:', {
          status: response.status(),
          headers: response.headers(),
          body: responseBody
        });
      }
    });
    
    // 1. Navigate to signin
    console.log('1. 🚪 Navigating to sign-in page...');
    await page.goto('http://155.138.165.47:3004/auth/signin', { 
      waitUntil: 'networkidle0' 
    });
    
    // 2. Login as seller
    console.log('2. 🔐 Logging in as seller...');
    await page.type('input[type="email"]', 'seller@test.com');
    await page.type('input[type="password"]', 'C@rlos2025');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const currentUrl = page.url();
    console.log('3. 📍 Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/seller/dashboard')) {
      console.log('✅ Successfully redirected to seller dashboard!');
      
      // 4. Wait for wallets to load or fail
      console.log('4. ⏳ Waiting for wallet loading...');
      
      // Look for wallet loading indicators or error messages
      await page.waitForTimeout(3000); // Give time for API call
      
      // Check if there are error messages in console
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🚨 Browser Console Error:', msg.text());
        }
      });
      
      // Check for network failures
      page.on('requestfailed', request => {
        if (request.url().includes('/api/wallets')) {
          console.log('🚨 API Request Failed:', request.failure());
        }
      });
      
      // Try to manually trigger wallet fetch by checking the page content
      const hasWalletError = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Failed to fetch wallets') || text.includes('Loading wallets');
      });
      
      if (hasWalletError) {
        console.log('❌ Wallet loading issues detected');
      } else {
        console.log('✅ No obvious wallet loading errors found');
      }
      
      // Check session cookies
      const cookies = await page.cookies();
      const sessionCookie = cookies.find(c => c.name.includes('nextauth'));
      
      if (sessionCookie) {
        console.log('🍪 Found session cookie:', {
          name: sessionCookie.name,
          domain: sessionCookie.domain,
          path: sessionCookie.path,
          secure: sessionCookie.secure,
          httpOnly: sessionCookie.httpOnly
        });
      } else {
        console.log('🚨 No NextAuth session cookie found!');
      }
      
    } else {
      console.log('❌ Not redirected to seller dashboard. URL:', currentUrl);
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"]');
        return Array.from(alerts).map(a => a.textContent).join(' ');
      });
      
      if (errorText) {
        console.log('🚨 Error message:', errorText);
      }
    }
    
    // 5. Test API directly with session
    console.log('5. 🧪 Testing API call directly...');
    
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/wallets');
        const result = {
          status: response.status,
          ok: response.ok,
          body: await response.text()
        };
        return result;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📋 Direct API call result:', apiResponse);
    
  } catch (error) {
    console.error('🚨 Debug script failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugAuthentication().catch(console.error);