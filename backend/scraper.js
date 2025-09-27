const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class LVImageScraper {
  constructor() {
    this.baseUrl = 'https://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-27/';
    this.imagesDir = path.join(__dirname, 'lv-images');
    this.collectionData = [];
  }

  async init() {
    // Create images directory if it doesn't exist
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  async scrapeImages() {
    console.log('🕷️ Starting LV Fall 2025 image scraping...');
    
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log('📄 Loading WWD page...');
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for images to load
      await page.waitForTimeout(5000);
      
      // Scroll down to load more images (lazy loading)
      console.log('📜 Scrolling to load all images...');
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
      
      // Wait a bit more for images to load after scrolling
      await page.waitForTimeout(3000);
      
      // Extract image URLs and metadata
      const imageData = await page.evaluate(() => {
        const images = [];
        const imgElements = document.querySelectorAll('img');
        
        imgElements.forEach((img, index) => {
          // Look for actual image URLs, not tracking URLs
          if (img.src && 
              !img.src.includes('bing.com') && 
              !img.src.includes('tracking') &&
              !img.src.includes('pixel') &&
              !img.src.includes('analytics') &&
              !img.src.includes('logo') &&
              !img.src.includes('icon') &&
              !img.src.includes('avatar') &&
              !img.src.includes('social') &&
              !img.src.includes('share') &&
              (img.src.includes('.jpg') || img.src.includes('.jpeg') || img.src.includes('.png') || img.src.includes('.webp')) &&
              img.naturalWidth > 150 && img.naturalHeight > 150) {
            
            // More lenient filtering - include any reasonable sized image from the gallery
            const altText = (img.alt || '').toLowerCase();
            const srcText = img.src.toLowerCase();
            
            // Include if it's a reasonable size and not obviously a UI element
            if (img.naturalWidth > 300 && img.naturalHeight > 300) {
              images.push({
                url: img.src,
                alt: img.alt || `LV Fall 2025 Item ${index + 1}`,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height
              });
            }
          }
        });
        
        return images;
      });
      
      console.log(`📸 Found ${imageData.length} LV images`);
      
      // Download and save images
      for (let i = 0; i < imageData.length; i++) {
        const imageInfo = imageData[i];
        try {
          console.log(`⬇️ Downloading image ${i + 1}/${imageData.length}...`);
          
          const response = await axios.get(imageInfo.url, {
            responseType: 'stream',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          const filename = `lv-fall-2025-${i + 1}.jpg`;
          const filepath = path.join(this.imagesDir, filename);
          
          const writer = fs.createWriteStream(filepath);
          response.data.pipe(writer);
          
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          // Add to collection data
          this.collectionData.push({
            id: i + 1,
            name: this.generateItemName(imageInfo.alt, i + 1),
            category: this.categorizeItem(imageInfo.alt),
            description: this.generateDescription(imageInfo.alt, i + 1),
            imagePath: filepath,
            imageUrl: imageInfo.url,
            features: this.extractFeatures(imageInfo.alt),
            colors: this.extractColors(imageInfo.alt),
            price: this.estimatePrice(i + 1),
            originalAlt: imageInfo.alt
          });
          
        } catch (error) {
          console.error(`❌ Failed to download image ${i + 1}:`, error.message);
        }
      }
      
      await browser.close();
      
      // Save collection data
      const dataPath = path.join(__dirname, 'lv-collection.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.collectionData, null, 2));
      
      console.log(`✅ Scraping complete! Found ${this.collectionData.length} items`);
      console.log(`💾 Collection data saved to: ${dataPath}`);
      
      return this.collectionData;
      
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    }
  }

  generateItemName(alt, index) {
    if (alt && alt.toLowerCase().includes('louis vuitton')) {
      return alt;
    }
    
    const categories = ['Trench Coat', 'Blazer', 'Dress', 'Handbag', 'Sneakers', 'Boots', 'Jacket', 'Pants', 'Skirt', 'Top'];
    const materials = ['Canvas', 'Leather', 'Denim', 'Silk', 'Wool', 'Cotton'];
    const styles = ['Classic', 'Modern', 'Vintage', 'Contemporary', 'Elegant', 'Casual'];
    
    const category = categories[index % categories.length];
    const material = materials[index % materials.length];
    const style = styles[index % styles.length];
    
    return `${style} ${material} ${category}`;
  }

  categorizeItem(alt) {
    const altLower = alt.toLowerCase();
    
    if (altLower.includes('coat') || altLower.includes('jacket') || altLower.includes('blazer')) {
      return 'Outerwear';
    } else if (altLower.includes('dress') || altLower.includes('gown')) {
      return 'Dresses';
    } else if (altLower.includes('bag') || altLower.includes('handbag') || altLower.includes('purse')) {
      return 'Bags';
    } else if (altLower.includes('shoe') || altLower.includes('boot') || altLower.includes('sneaker')) {
      return 'Footwear';
    } else if (altLower.includes('pant') || altLower.includes('trouser')) {
      return 'Bottoms';
    } else if (altLower.includes('top') || altLower.includes('shirt') || altLower.includes('blouse')) {
      return 'Tops';
    } else {
      return 'Accessories';
    }
  }

  generateDescription(alt, index) {
    const baseDescriptions = [
      'Elegant piece from the LV Fall 2025 collection featuring signature monogram details',
      'Contemporary design showcasing Louis Vuitton\'s innovative approach to luxury fashion',
      'Sophisticated item from the latest ready-to-wear collection with premium materials',
      'Modern interpretation of classic LV aesthetics with contemporary styling',
      'Luxurious piece embodying the brand\'s heritage and forward-thinking design'
    ];
    
    return baseDescriptions[index % baseDescriptions.length];
  }

  extractFeatures(alt) {
    const features = [];
    const altLower = alt.toLowerCase();
    
    if (altLower.includes('monogram')) features.push('monogram');
    if (altLower.includes('damier')) features.push('damier');
    if (altLower.includes('leather')) features.push('leather');
    if (altLower.includes('canvas')) features.push('canvas');
    if (altLower.includes('belted')) features.push('belted');
    if (altLower.includes('structured')) features.push('structured');
    if (altLower.includes('logo')) features.push('logo');
    if (altLower.includes('pocket')) features.push('pockets');
    
    // Add some default features if none found
    if (features.length === 0) {
      features.push('luxury', 'premium', 'designer');
    }
    
    return features;
  }

  extractColors(alt) {
    const colors = [];
    const altLower = alt.toLowerCase();
    
    if (altLower.includes('black')) colors.push('black');
    if (altLower.includes('brown')) colors.push('brown');
    if (altLower.includes('beige')) colors.push('beige');
    if (altLower.includes('white')) colors.push('white');
    if (altLower.includes('blue')) colors.push('blue');
    if (altLower.includes('red')) colors.push('red');
    if (altLower.includes('green')) colors.push('green');
    if (altLower.includes('gray') || altLower.includes('grey')) colors.push('gray');
    
    // Add some default colors if none found
    if (colors.length === 0) {
      colors.push('neutral', 'classic', 'versatile');
    }
    
    return colors;
  }

  estimatePrice(index) {
    const basePrices = ['$1,200', '$1,800', '$2,400', '$2,800', '$3,200', '$3,600', '$4,000'];
    return basePrices[index % basePrices.length];
  }

  async loadCollection() {
    const dataPath = path.join(__dirname, 'lv-collection.json');
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      this.collectionData = JSON.parse(data);
      console.log(`📚 Loaded ${this.collectionData.length} items from collection`);
      
      // Check if images actually exist and have content
      const validItems = [];
      for (const item of this.collectionData) {
        if (fs.existsSync(item.imagePath) && fs.statSync(item.imagePath).size > 0) {
          validItems.push(item);
        }
      }
      
      if (validItems.length === 0) {
        console.log('📚 No valid images found, creating mock collection...');
        return await this.createMockCollection();
      }
      
      this.collectionData = validItems;
      return this.collectionData;
    } else {
      console.log('📚 No collection data found, starting fresh scrape...');
      const scrapedData = await this.scrapeImages();
      
      // If scraping failed, create mock collection (but only if we got 0 images)
      if (scrapedData.length === 0) {
        console.log('📚 Scraping failed completely, creating mock collection...');
        return await this.createMockCollection();
      }
      
      // Filter out any items with invalid images
      const validScrapedData = scrapedData.filter(item => 
        fs.existsSync(item.imagePath) && fs.statSync(item.imagePath).size > 0
      );
      
      if (validScrapedData.length === 0) {
        console.log('📚 No valid scraped images, creating mock collection...');
        return await this.createMockCollection();
      }
      
      console.log(`📚 Using ${validScrapedData.length} valid scraped images`);
      return validScrapedData;
    }
  }

  async createMockCollection() {
    console.log('🎨 Creating mock LV Fall 2025 collection...');
    
    // Create mock images using Jimp
    const mockItems = [
      {
        id: 1,
        name: "Monogram Canvas Trench Coat",
        category: "Outerwear",
        description: "Classic monogram canvas with modern trench silhouette",
        features: ["monogram", "canvas", "trench", "belted", "double-breasted"],
        colors: ["brown", "beige", "gold"],
        price: "$3,200"
      },
      {
        id: 2,
        name: "Damier Azur Mini Dress",
        category: "Dresses",
        description: "Elegant mini dress in signature Damier Azur pattern",
        features: ["damier", "azur", "mini", "sleeveless", "a-line"],
        colors: ["blue", "white", "navy"],
        price: "$2,800"
      },
      {
        id: 3,
        name: "Epi Leather Handbag",
        category: "Bags",
        description: "Structured handbag in textured Epi leather",
        features: ["epi", "leather", "structured", "top-handle", "logo"],
        colors: ["black", "red", "blue"],
        price: "$2,400"
      },
      {
        id: 4,
        name: "Monogram Denim Jacket",
        category: "Outerwear",
        description: "Contemporary denim jacket with monogram detailing",
        features: ["monogram", "denim", "jacket", "button-up", "pockets"],
        colors: ["blue", "indigo", "black"],
        price: "$1,900"
      },
      {
        id: 5,
        name: "Damier Graphite Sneakers",
        category: "Footwear",
        description: "High-top sneakers in Damier Graphite pattern",
        features: ["damier", "graphite", "sneakers", "high-top", "rubber-sole"],
        colors: ["gray", "black", "white"],
        price: "$1,200"
      }
    ];

    // Create mock images
    for (let i = 0; i < mockItems.length; i++) {
      const item = mockItems[i];
      try {
        const Jimp = require('jimp');
        const image = new Jimp(400, 400, this.getMockColor(item.colors[0]));
        
        // Add some text to make it look like a fashion item
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
        image.print(font, 10, 10, item.name);
        
        const imagePath = path.join(this.imagesDir, `lv-fall-2025-${i + 1}.jpg`);
        await image.writeAsync(imagePath);
        
        item.imagePath = imagePath;
        item.imageUrl = `mock://lv-fall-2025-${i + 1}.jpg`;
      } catch (error) {
        console.error(`Error creating mock image for ${item.name}:`, error);
      }
    }

    // Save collection data
    const dataPath = path.join(__dirname, 'lv-collection.json');
    fs.writeFileSync(dataPath, JSON.stringify(mockItems, null, 2));
    
    this.collectionData = mockItems;
    console.log(`✅ Created mock collection with ${mockItems.length} items`);
    return mockItems;
  }

  getMockColor(colorName) {
    const colors = {
      'brown': 0x8B4513,
      'beige': 0xF5F5DC,
      'gold': 0xFFD700,
      'blue': 0x0000FF,
      'white': 0xFFFFFF,
      'navy': 0x000080,
      'black': 0x000000,
      'red': 0xFF0000,
      'gray': 0x808080,
      'neutral': 0x696969,
      'classic': 0x2F4F4F,
      'versatile': 0x708090
    };
    return colors[colorName] || 0x808080;
  }
}

module.exports = LVImageScraper;
