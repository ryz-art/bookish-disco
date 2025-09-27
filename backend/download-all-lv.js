const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadAllLVImages() {
  const imagesDir = path.join(__dirname, 'lv-images');
  
  // Create images directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('🕷️ Starting LV Fall 2025 image download (0001-0062)...');
  
  const baseUrl = 'https://wwd.com/wp-content/uploads/2025/03/louis-vuitton-fall-25-r-gg-pfw-';
  const collectionData = [];
  
  for (let i = 1; i <= 62; i++) {
    const imageNumber = i.toString().padStart(4, '0'); // 0001, 0002, etc.
    const imageUrl = `${baseUrl}${imageNumber}.jpg?w=800`;
    
    try {
      console.log(`⬇️ Downloading image ${i}/62: ${imageNumber}.jpg`);
      
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const filename = `lv-fall-2025-${i}.jpg`;
      const filepath = path.join(imagesDir, filename);
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      // Add to collection data
      collectionData.push({
        id: i,
        name: `LV Fall 2025 Item ${i}`,
        category: "Fashion",
        description: `Louis Vuitton Fall 2025 Ready-to-Wear Collection item ${i}`,
        imagePath: filepath,
        imageUrl: imageUrl,
        features: ["luxury", "designer", "fashion"],
        colors: ["various"],
        price: `$${(Math.random() * 3000 + 1000).toFixed(0)}`,
        originalAlt: `LV Fall 2025 Item ${i}`
      });
      
      console.log(`✅ Downloaded: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Failed to download image ${i} (${imageNumber}.jpg):`, error.message);
    }
  }
  
  // Save collection data
  const dataPath = path.join(__dirname, 'lv-collection.json');
  fs.writeFileSync(dataPath, JSON.stringify(collectionData, null, 2));
  
  console.log(`✅ Download complete! Downloaded ${collectionData.length} LV images`);
  console.log(`💾 Collection data saved to: ${dataPath}`);
  
  return collectionData;
}

// Run the download
downloadAllLVImages()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
