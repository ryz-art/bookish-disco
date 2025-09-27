const puppeteer = require('puppeteer');

async function inspectPage() {
  const baseUrl = 'http://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-26/';
  
  console.log('🔍 Inspecting WWD page structure...');
  
  try {
    const browser = await puppeteer.launch({
      headless: false, // Run in non-headless mode to see what's happening
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport to desktop size
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Loading WWD page...');
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for initial load
    await page.waitForTimeout(5000);
    
    // Scroll to load all content
    console.log('📜 Scrolling to load all content...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Inspect page structure
    const pageInfo = await page.evaluate(() => {
      const info = {
        totalImages: document.querySelectorAll('img').length,
        allImages: [],
        buttons: [],
        links: [],
        scripts: [],
        dataAttributes: []
      };
      
      // Get all images
      document.querySelectorAll('img').forEach((img, index) => {
        if (img.src) {
          info.allImages.push({
            index: index,
            src: img.src,
            alt: img.alt,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            className: img.className,
            id: img.id
          });
        }
      });
      
      // Get all buttons
      document.querySelectorAll('button').forEach((btn, index) => {
        info.buttons.push({
          index: index,
          text: btn.textContent,
          className: btn.className,
          id: btn.id,
          ariaLabel: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title')
        });
      });
      
      // Get all links
      document.querySelectorAll('a').forEach((link, index) => {
        if (link.href && link.href.includes('louis-vuitton')) {
          info.links.push({
            index: index,
            href: link.href,
            text: link.textContent,
            className: link.className
          });
        }
      });
      
      // Get all script tags that might contain image data
      document.querySelectorAll('script').forEach((script, index) => {
        if (script.textContent && script.textContent.includes('louis-vuitton')) {
          info.scripts.push({
            index: index,
            content: script.textContent.substring(0, 500) // First 500 chars
          });
        }
      });
      
      // Get elements with data attributes
      document.querySelectorAll('[data-*]').forEach((el, index) => {
        const dataAttrs = {};
        for (let attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            dataAttrs[attr.name] = attr.value;
          }
        }
        if (Object.keys(dataAttrs).length > 0) {
          info.dataAttributes.push({
            index: index,
            tagName: el.tagName,
            className: el.className,
            dataAttrs: dataAttrs
          });
        }
      });
      
      return info;
    });
    
    console.log('📊 Page Analysis:');
    console.log(`Total images: ${pageInfo.totalImages}`);
    console.log(`Total buttons: ${pageInfo.buttons.length}`);
    console.log(`Total links: ${pageInfo.links.length}`);
    console.log(`Total scripts: ${pageInfo.scripts.length}`);
    console.log(`Total data attributes: ${pageInfo.dataAttributes.length}`);
    
    console.log('\n🖼️ All Images:');
    pageInfo.allImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img.src} (${img.width}x${img.height}) - ${img.alt}`);
    });
    
    console.log('\n🔘 Buttons:');
    pageInfo.buttons.forEach((btn, i) => {
      console.log(`${i + 1}. "${btn.text}" (${btn.className}) - aria-label: ${btn.ariaLabel}`);
    });
    
    console.log('\n🔗 Links:');
    pageInfo.links.forEach((link, i) => {
      console.log(`${i + 1}. ${link.href} - "${link.text}"`);
    });
    
    console.log('\n📜 Scripts with LV content:');
    pageInfo.scripts.forEach((script, i) => {
      console.log(`${i + 1}. ${script.content}...`);
    });
    
    // Try to find image URLs in script content
    const imageUrls = new Set();
    pageInfo.scripts.forEach(script => {
      const matches = script.content.match(/https?:\/\/[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
      if (matches) {
        matches.forEach(url => {
          if (url.includes('louis-vuitton') || url.includes('fall-25') || url.includes('gg-pfw')) {
            imageUrls.add(url);
          }
        });
      }
    });
    
    console.log(`\n🎯 Found ${imageUrls.size} image URLs in scripts:`);
    Array.from(imageUrls).forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Inspection failed:', error);
    throw error;
  }
}

// Run the inspection
inspectPage()
  .then(() => {
    console.log('🎉 Inspection complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
