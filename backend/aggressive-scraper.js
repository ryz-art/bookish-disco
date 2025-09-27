const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function aggressiveScrape() {
  const baseUrl = 'http://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-26/';
  const imagesDir = path.join(__dirname, 'lv-images');
  
  // Create images directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('🕷️ Starting aggressive LV image scraping...');
  
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
    
    // Try multiple scrolling strategies
    console.log('📜 Scrolling strategy 1: Slow scroll...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 50; // Smaller steps
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
        }, 200); // Slower
      });
    });
    
    await page.waitForTimeout(3000);
    
    // Try clicking "Load More" or similar buttons
    console.log('🔍 Looking for "Load More" buttons...');
    try {
      const loadMoreButtons = await page.$$('button, a');
      for (const button of loadMoreButtons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.toLowerCase().includes('load') || text.toLowerCase().includes('more') || text.toLowerCase().includes('show'))) {
          console.log(`🔄 Clicking button: ${text}`);
          await button.click();
          await page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.log('No load more buttons found');
    }
    
    // Scroll again after potential button clicks
    console.log('📜 Scrolling strategy 2: Fast scroll...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 200;
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
    
    await page.waitForTimeout(5000);
    
    // Extract ALL possible image sources
    const imageData = await page.evaluate(() => {
      const images = [];
      
      // Get all img elements
      const imgElements = document.querySelectorAll('img');
      console.log(`Found ${imgElements.length} img elements`);
      
      // Get all elements with background images
      const bgElements = document.querySelectorAll('*');
      console.log(`Found ${bgElements.length} total elements`);
      
      // Process img elements
      imgElements.forEach((img, index) => {
        if (img.src) {
          images.push({
            url: img.src,
            alt: img.alt || `Image ${index + 1}`,
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
            type: 'img',
            index: index
          });
        }
      });
      
      // Process background images
      bgElements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none' && bgImage.includes('url(')) {
          const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            images.push({
              url: urlMatch[1],
              alt: `Background image ${index + 1}`,
              width: el.offsetWidth || 0,
              height: el.offsetHeight || 0,
              type: 'background',
              index: index
            });
          }
        }
      });
      
      return images;
    });
    
    console.log(`📸 Found ${imageData.length} total image sources`);
    
    // Filter and sort images
    const filteredImages = imageData
      .filter(img => 
        img.url && 
        !img.url.includes('data:') &&
        !img.url.includes('bing.com') && 
        !img.url.includes('tracking') &&
        !img.url.includes('pixel') &&
        !img.url.includes('analytics') &&
        !img.url.includes('logo') &&
        !img.url.includes('icon') &&
        !img.url.includes('avatar') &&
        !img.url.includes('social') &&
        !img.url.includes('share') &&
        (img.url.includes('.jpg') || img.url.includes('.jpeg') || img.url.includes('.png') || img.url.includes('.webp'))
      )
      .sort((a, b) => (b.width * b.height) - (a.width * a.height)) // Sort by area
      .slice(0, 62); // Take top 62
    
    console.log(`📸 Filtered to ${filteredImages.length} high-quality images`);
    
    // Log some sample URLs for debugging
    console.log('Sample URLs:');
    filteredImages.slice(0, 5).forEach((img, i) => {
      console.log(`${i + 1}. ${img.url} (${img.width}x${img.height})`);
    });
    
    // Download images
    const collectionData = [];
    
    for (let i = 0; i < filteredImages.length; i++) {
      const imageInfo = filteredImages[i];
      try {
        console.log(`⬇️ Downloading image ${i + 1}/${filteredImages.length}...`);
        
        const response = await axios.get(imageInfo.url, {
          responseType: 'stream',
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': baseUrl
          }
        });
        
        const filename = `lv-fall-2025-${i + 1}.jpg`;
        const filepath = path.join(imagesDir, filename);
        
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        // Add to collection data
        collectionData.push({
          id: i + 1,
          name: `LV Fall 2025 Item ${i + 1}`,
          category: "Fashion",
          description: `Louis Vuitton Fall 2025 Ready-to-Wear Collection item ${i + 1}`,
          imagePath: filepath,
          imageUrl: imageInfo.url,
          features: ["luxury", "designer", "fashion"],
          colors: ["various"],
          price: `$${(Math.random() * 3000 + 1000).toFixed(0)}`,
          originalAlt: imageInfo.alt
        });
        
        console.log(`✅ Downloaded: ${filename}`);
        
      } catch (error) {
        console.error(`❌ Failed to download image ${i + 1}:`, error.message);
      }
    }
    
    await browser.close();
    
    // Save collection data
    const dataPath = path.join(__dirname, 'lv-collection.json');
    fs.writeFileSync(dataPath, JSON.stringify(collectionData, null, 2));
    
    console.log(`✅ Download complete! Downloaded ${collectionData.length} LV images`);
    console.log(`💾 Collection data saved to: ${dataPath}`);
    
    return collectionData;
    
  } catch (error) {
    console.error('❌ Download failed:', error);
    throw error;
  }
}

// Run the aggressive scrape
aggressiveScrape()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
