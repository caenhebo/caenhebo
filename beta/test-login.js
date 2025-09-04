const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Go to sign-in page
    console.log('1. Navigating to sign-in page...');
    await page.goto('http://155.138.165.47:3018/auth/signin', { waitUntil: 'networkidle0' });
    
    // Fill in credentials
    console.log('2. Filling in credentials...');
    await page.type('input[type="email"]', 'f@pachoman.com');
    await page.type('input[type="password"]', 'C@rlos2025');
    
    // Click sign in
    console.log('3. Clicking sign in...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Check where we ended up
    const url = page.url();
    console.log('4. Current URL:', url);
    
    if (url.includes('/admin')) {
      console.log('✅ SUCCESS: Logged in and redirected to admin dashboard!');
      
      // Check if Striga API tab exists
      const hasStrigaTab = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button'));
        return tabs.some(tab => tab.textContent.includes('Striga API'));
      });
      
      if (hasStrigaTab) {
        console.log('✅ Striga API tab found!');
      } else {
        console.log('❌ Striga API tab NOT found');
      }
    } else {
      console.log('❌ FAILED: Not redirected to admin dashboard');
      
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const alerts = document.querySelectorAll('[role="alert"]');
        return Array.from(alerts).map(a => a.textContent).join(' ');
      });
      
      if (errorText) {
        console.log('Error message:', errorText);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();