const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function navigateLightbox() {
  const baseUrl = 'http://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-26/';
  const imagesDir = path.join(__dirname, 'lv-images');
  
  // Create images directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('🕷️ Starting LV lightbox navigation scraping...');
  
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
    await page.waitForTimeout(3000);
    
    // Click on the first image to open lightbox
    console.log('🖼️ Clicking on first image to open lightbox...');
    try {
      const firstImage = await page.$('img[src*="louis-vuitton"]');
      if (firstImage) {
        await firstImage.click();
        await page.waitForTimeout(3000);
      } else {
        // Try clicking any image
        const anyImage = await page.$('img');
        if (anyImage) {
          await anyImage.click();
          await page.waitForTimeout(3000);
        }
      }
    } catch (error) {
      console.log('Could not click on image, trying alternative approach...');
    }
    
    // Wait for lightbox to load
    await page.waitForTimeout(5000);
    
    const allImages = new Set(); // Use Set to avoid duplicates
    let currentImageIndex = 0;
    const maxImages = 62;
    
    console.log('🔄 Navigating through lightbox to collect all images...');
    
    // Navigate through the lightbox to collect all images
    for (let i = 0; i < maxImages; i++) {
      try {
        // Extract current image
        const currentImageData = await page.evaluate(() => {
          const img = document.querySelector('img[src*="louis-vuitton"], img[src*="fall-25"], img[src*="gg-pfw"]');
          if (img && img.src) {
            return {
              url: img.src,
              alt: img.alt || `LV Fall 2025 Item ${i + 1}`,
              width: img.naturalWidth || img.width || 0,
              height: img.naturalHeight || img.height || 0
            };
          }
          return null;
        });
        
        if (currentImageData && !allImages.has(currentImageData.url)) {
          allImages.add(currentImageData.url);
          console.log(`📸 Found image ${allImages.size}: ${currentImageData.url}`);
        }
        
        // Try to navigate to next image
        const nextButton = await page.$('button[aria-label*="next"], button[class*="next"], .next, [data-action="next"]');
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(1000);
        } else {
          // Try arrow key navigation
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(1000);
        }
        
        // Check if we've reached the end
        const isAtEnd = await page.evaluate(() => {
          const nextButton = document.querySelector('button[aria-label*="next"], button[class*="next"], .next, [data-action="next"]');
          return nextButton && nextButton.disabled;
        });
        
        if (isAtEnd) {
          console.log('🏁 Reached end of lightbox');
          break;
        }
        
      } catch (error) {
        console.log(`Error at image ${i + 1}:`, error.message);
        break;
      }
    }
    
    console.log(`📸 Total unique images found: ${allImages.size}`);
    
    // Convert Set to Array and download
    const imageUrls = Array.from(allImages);
    const collectionData = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      try {
        console.log(`⬇️ Downloading image ${i + 1}/${imageUrls.length}...`);
        
        const response = await axios.get(imageUrl, {
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
          imageUrl: imageUrl,
          features: ["luxury", "designer", "fashion"],
          colors: ["various"],
          price: `$${(Math.random() * 3000 + 1000).toFixed(0)}`,
          originalAlt: `LV Fall 2025 Item ${i + 1}`
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

// Run the lightbox navigation
navigateLightbox()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
