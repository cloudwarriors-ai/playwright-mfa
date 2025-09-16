const { chromium } = require('@playwright/test');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to Google
    await page.goto('https://www.google.com');
    console.log('Successfully loaded Google');
    
    // Type 'cats' into search box
    const searchBox = await page.getByRole('combobox', { name: 'Search' });
    await searchBox.fill('cats');
    await searchBox.press('Enter');
    
    console.log('Searched for cats');
    
    // Wait for search results
    await page.waitForSelector('h3');
    
    // Get first few search results
    const results = await page.$$eval('h3', (elements) => 
      elements.slice(0, 5).map(el => el.textContent)
    );
    
    console.log('Search Results:');
    console.log(results);
    
    // Take a screenshot
    await page.screenshot({ path: 'cats-search.png' });
    console.log('Screenshot saved as cats-search.png');
    
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();