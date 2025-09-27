const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

class ComputerVisionService {
  constructor() {
    this.lvImagesDir = path.join(__dirname, 'lv-images');
    this.featureCache = new Map();
  }

  // Extract features from an image using Jimp
  async extractImageFeatures(imagePath) {
    try {
      // Load image with Jimp
      const image = await Jimp.read(imagePath);
      
      // Extract features using different methods
      const features = {
        // Color analysis
        colorFeatures: await this.extractColorFeatures(image),
        
        // Texture features
        textureFeatures: this.extractTextureFeatures(image),
        
        // Edge features
        edgeFeatures: this.extractEdgeFeatures(image),
        
        // Shape features
        shapeFeatures: this.extractShapeFeatures(image),
        
        // Image properties
        imageProperties: this.extractImageProperties(image)
      };
      
      return features;
    } catch (error) {
      console.error('Error extracting features:', error);
      return null;
    }
  }

  // Extract color features using Jimp
  async extractColorFeatures(image) {
    try {
      // Get dominant colors using custom algorithm
      const dominantColors = this.extractDominantColors(image);
      
      // Calculate color histogram using Jimp
      const histogram = this.calculateColorHistogram(image);
      
      // Calculate average color
      const averageColor = this.calculateAverageColor(image);
      
      return {
        dominantColors,
        histogram,
        averageColor
      };
    } catch (error) {
      console.error('Error extracting color features:', error);
      return null;
    }
  }

  // Extract dominant colors using k-means clustering
  extractDominantColors(image, numColors = 5) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const pixels = [];
    
    // Sample pixels (every 10th pixel for performance)
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        pixels.push([
          image.bitmap.data[idx],     // R
          image.bitmap.data[idx + 1], // G
          image.bitmap.data[idx + 2]  // B
        ]);
      }
    }
    
    // Simple k-means clustering
    return this.kMeansClustering(pixels, numColors);
  }

  // Simple k-means clustering implementation
  kMeansClustering(pixels, k, maxIterations = 10) {
    if (pixels.length === 0) return [];
    
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
      const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
      centroids.push([...randomPixel]);
    }
    
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign pixels to closest centroid
      const clusters = Array(k).fill().map(() => []);
      
      pixels.forEach(pixel => {
        let minDistance = Infinity;
        let closestCentroid = 0;
        
        centroids.forEach((centroid, idx) => {
          const distance = this.euclideanDistance(pixel, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = idx;
          }
        });
        
        clusters[closestCentroid].push(pixel);
      });
      
      // Update centroids
      let converged = true;
      centroids.forEach((centroid, idx) => {
        if (clusters[idx].length > 0) {
          const newCentroid = [
            clusters[idx].reduce((sum, p) => sum + p[0], 0) / clusters[idx].length,
            clusters[idx].reduce((sum, p) => sum + p[1], 0) / clusters[idx].length,
            clusters[idx].reduce((sum, p) => sum + p[2], 0) / clusters[idx].length
          ];
          
          if (this.euclideanDistance(centroid, newCentroid) > 1) {
            converged = false;
          }
          
          centroids[idx] = newCentroid;
        }
      });
      
      if (converged) break;
    }
    
    return centroids.map(centroid => [
      Math.round(centroid[0]),
      Math.round(centroid[1]),
      Math.round(centroid[2])
    ]);
  }

  // Calculate Euclidean distance between two RGB colors
  euclideanDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1[0] - color2[0], 2) +
      Math.pow(color1[1] - color2[1], 2) +
      Math.pow(color1[2] - color2[2], 2)
    );
  }

  // Calculate color histogram
  calculateColorHistogram(image) {
    const histogram = {
      red: new Array(256).fill(0),
      green: new Array(256).fill(0),
      blue: new Array(256).fill(0)
    };
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      histogram.red[red]++;
      histogram.green[green]++;
      histogram.blue[blue]++;
    });
    
    return histogram;
  }

  // Calculate average color
  calculateAverageColor(image) {
    let totalRed = 0, totalGreen = 0, totalBlue = 0;
    let pixelCount = 0;
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      totalRed += this.bitmap.data[idx + 0];
      totalGreen += this.bitmap.data[idx + 1];
      totalBlue += this.bitmap.data[idx + 2];
      pixelCount++;
    });
    
    return {
      red: Math.round(totalRed / pixelCount),
      green: Math.round(totalGreen / pixelCount),
      blue: Math.round(totalBlue / pixelCount)
    };
  }

  // Extract texture features using Jimp
  extractTextureFeatures(image) {
    try {
      // Convert to grayscale for texture analysis
      const grayImage = image.clone().grayscale();
      
      // Calculate texture statistics
      const stats = this.calculateTextureStats(grayImage);
      
      // Add pattern analysis for fashion items
      const patternFeatures = this.analyzePatterns(image);
      
      return {
        ...stats,
        ...patternFeatures
      };
    } catch (error) {
      console.error('Error extracting texture features:', error);
      return null;
    }
  }

  // Calculate texture statistics using Jimp
  calculateTextureStats(grayImage) {
    const width = grayImage.bitmap.width;
    const height = grayImage.bitmap.height;
    const pixels = [];
    
    // Extract pixel values
    grayImage.scan(0, 0, width, height, function (x, y, idx) {
      pixels.push(this.bitmap.data[idx]);
    });
    
    // Calculate statistics
    const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;
    const variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate entropy
    const histogram = new Array(256).fill(0);
    pixels.forEach(pixel => histogram[pixel]++);
    
    const entropy = -histogram.reduce((sum, count) => {
      if (count > 0) {
        const p = count / pixels.length;
        return sum + p * Math.log2(p);
      }
      return sum;
    }, 0);
    
    return { mean, variance, stdDev, entropy };
  }

  // Analyze patterns in fashion images
  analyzePatterns(image) {
    try {
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      
      // Sample different regions of the image
      const regions = this.sampleImageRegions(image, 4); // 2x2 grid
      
      // Analyze each region for patterns
      const regionFeatures = regions.map(region => this.analyzeRegionPattern(region));
      
      // Calculate pattern consistency across regions
      const patternConsistency = this.calculatePatternConsistency(regionFeatures);
      
      // Detect vertical vs horizontal patterns (important for fashion)
      const directionalFeatures = this.analyzeDirectionalPatterns(image);
      
      return {
        patternConsistency,
        ...directionalFeatures,
        regionCount: regions.length
      };
    } catch (error) {
      console.error('Error analyzing patterns:', error);
      return {
        patternConsistency: 0,
        verticalPattern: 0,
        horizontalPattern: 0,
        regionCount: 0
      };
    }
  }

  // Sample different regions of the image
  sampleImageRegions(image, gridSize) {
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const regionWidth = Math.floor(width / gridSize);
    const regionHeight = Math.floor(height / gridSize);
    const regions = [];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * regionWidth;
        const y = row * regionHeight;
        const region = image.clone().crop(x, y, regionWidth, regionHeight);
        regions.push(region);
      }
    }
    
    return regions;
  }

  // Analyze pattern in a specific region
  analyzeRegionPattern(region) {
    const width = region.bitmap.width;
    const height = region.bitmap.height;
    const pixels = [];
    
    // Sample pixels in the region
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        pixels.push([
          region.bitmap.data[idx],     // R
          region.bitmap.data[idx + 1], // G
          region.bitmap.data[idx + 2]  // B
        ]);
      }
    }
    
    // Calculate local variance (indicates pattern complexity)
    const mean = pixels.reduce((sum, pixel) => sum + (pixel[0] + pixel[1] + pixel[2]) / 3, 0) / pixels.length;
    const variance = pixels.reduce((sum, pixel) => {
      const intensity = (pixel[0] + pixel[1] + pixel[2]) / 3;
      return sum + Math.pow(intensity - mean, 2);
    }, 0) / pixels.length;
    
    return { mean, variance, pixelCount: pixels.length };
  }

  // Calculate pattern consistency across regions
  calculatePatternConsistency(regionFeatures) {
    if (regionFeatures.length < 2) return 0;
    
    const variances = regionFeatures.map(region => region.variance);
    const meanVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    
    // Calculate coefficient of variation (lower = more consistent)
    const varianceOfVariances = variances.reduce((sum, v) => sum + Math.pow(v - meanVariance, 2), 0) / variances.length;
    const coefficientOfVariation = Math.sqrt(varianceOfVariances) / meanVariance;
    
    // Convert to similarity score (0-1, higher = more consistent)
    return Math.max(0, 1 - coefficientOfVariation);
  }

  // Analyze directional patterns (vertical vs horizontal)
  analyzeDirectionalPatterns(image) {
    try {
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const grayImage = image.clone().grayscale();
      
      // Calculate gradients in horizontal and vertical directions
      let verticalGradient = 0;
      let horizontalGradient = 0;
      let pixelCount = 0;
      
      for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
          const idx = (y * width + x) * 4;
          const current = grayImage.bitmap.data[idx];
          
          // Vertical gradient (difference between top and bottom neighbors)
          const topIdx = ((y - 1) * width + x) * 4;
          const bottomIdx = ((y + 1) * width + x) * 4;
          const verticalDiff = Math.abs(current - grayImage.bitmap.data[topIdx]) + 
                              Math.abs(current - grayImage.bitmap.data[bottomIdx]);
          
          // Horizontal gradient (difference between left and right neighbors)
          const leftIdx = (y * width + (x - 1)) * 4;
          const rightIdx = (y * width + (x + 1)) * 4;
          const horizontalDiff = Math.abs(current - grayImage.bitmap.data[leftIdx]) + 
                                Math.abs(current - grayImage.bitmap.data[rightIdx]);
          
          verticalGradient += verticalDiff;
          horizontalGradient += horizontalDiff;
          pixelCount++;
        }
      }
      
      const avgVerticalGradient = verticalGradient / pixelCount;
      const avgHorizontalGradient = horizontalGradient / pixelCount;
      const totalGradient = avgVerticalGradient + avgHorizontalGradient;
      
      return {
        verticalPattern: totalGradient > 0 ? avgVerticalGradient / totalGradient : 0.5,
        horizontalPattern: totalGradient > 0 ? avgHorizontalGradient / totalGradient : 0.5
      };
    } catch (error) {
      console.error('Error analyzing directional patterns:', error);
      return { verticalPattern: 0.5, horizontalPattern: 0.5 };
    }
  }

  // Extract edge features using Jimp
  extractEdgeFeatures(image) {
    try {
      // Convert to grayscale
      const grayImage = image.clone().grayscale();
      
      // Apply edge detection using convolution
      const edgeImage = this.applyEdgeDetection(grayImage);
      
      // Calculate edge density
      const edgeDensity = this.calculateEdgeDensity(edgeImage);
      
      return {
        edgeDensity
      };
    } catch (error) {
      console.error('Error extracting edge features:', error);
      return null;
    }
  }

  // Apply simple edge detection using Sobel operator
  applyEdgeDetection(grayImage) {
    const width = grayImage.bitmap.width;
    const height = grayImage.bitmap.height;
    const edgeImage = grayImage.clone();
    
    // Sobel X kernel
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    
    // Sobel Y kernel
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];
    
    edgeImage.scan(1, 1, width - 2, height - 2, function (x, y, idx) {
      let gx = 0, gy = 0;
      
      // Apply Sobel kernels
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const pixelIdx = ((y + i) * width + (x + j)) * 4;
          const pixel = this.bitmap.data[pixelIdx];
          
          gx += pixel * sobelX[i + 1][j + 1];
          gy += pixel * sobelY[i + 1][j + 1];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const edgeValue = Math.min(255, magnitude);
      
      this.bitmap.data[idx] = edgeValue;
      this.bitmap.data[idx + 1] = edgeValue;
      this.bitmap.data[idx + 2] = edgeValue;
    });
    
    return edgeImage;
  }

  // Calculate edge density
  calculateEdgeDensity(edgeImage) {
    const width = edgeImage.bitmap.width;
    const height = edgeImage.bitmap.height;
    let edgePixels = 0;
    const threshold = 50; // Edge threshold
    
    edgeImage.scan(0, 0, width, height, function (x, y, idx) {
      if (this.bitmap.data[idx] > threshold) {
        edgePixels++;
      }
    });
    
    return edgePixels / (width * height);
  }

  // Extract shape features using Jimp
  extractShapeFeatures(image) {
    try {
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      
      // Calculate basic shape properties
      const aspectRatio = width / height;
      const area = width * height;
      const perimeter = 2 * (width + height);
      const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
      
      // Analyze silhouette for fashion items
      const silhouetteFeatures = this.analyzeSilhouette(image);
      
      return {
        aspectRatio,
        circularity,
        area,
        perimeter,
        width,
        height,
        ...silhouetteFeatures
      };
    } catch (error) {
      console.error('Error extracting shape features:', error);
      return null;
    }
  }

  // Analyze silhouette for fashion items
  analyzeSilhouette(image) {
    try {
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const grayImage = image.clone().grayscale();
      
      // Find the main subject (assuming it's darker than background)
      const threshold = this.calculateThreshold(grayImage);
      const silhouette = this.extractSilhouette(grayImage, threshold);
      
      // Analyze silhouette properties
      const silhouetteProps = this.analyzeSilhouetteProperties(silhouette, width, height);
      
      return silhouetteProps;
    } catch (error) {
      console.error('Error analyzing silhouette:', error);
      return {
        silhouetteRatio: 0.5,
        centerOfMass: { x: 0.5, y: 0.5 },
        verticalBalance: 0.5,
        horizontalBalance: 0.5
      };
    }
  }

  // Calculate threshold for silhouette extraction
  calculateThreshold(grayImage) {
    const width = grayImage.bitmap.width;
    const height = grayImage.bitmap.height;
    const pixels = [];
    
    // Sample pixels to find threshold
    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const idx = (y * width + x) * 4;
        pixels.push(grayImage.bitmap.data[idx]);
      }
    }
    
    // Use Otsu's method approximation
    pixels.sort((a, b) => a - b);
    const median = pixels[Math.floor(pixels.length / 2)];
    return median;
  }

  // Extract silhouette from image
  extractSilhouette(grayImage, threshold) {
    const width = grayImage.bitmap.width;
    const height = grayImage.bitmap.height;
    const silhouette = [];
    
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = grayImage.bitmap.data[idx];
        row.push(pixel < threshold ? 1 : 0); // 1 = subject, 0 = background
      }
      silhouette.push(row);
    }
    
    return silhouette;
  }

  // Analyze silhouette properties
  analyzeSilhouetteProperties(silhouette, width, height) {
    let totalPixels = 0;
    let centerX = 0;
    let centerY = 0;
    let topPixels = 0;
    let bottomPixels = 0;
    let leftPixels = 0;
    let rightPixels = 0;
    
    // Calculate center of mass and distribution
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (silhouette[y][x] === 1) {
          totalPixels++;
          centerX += x;
          centerY += y;
          
          // Count pixels in different regions
          if (y < height / 2) topPixels++;
          else bottomPixels++;
          
          if (x < width / 2) leftPixels++;
          else rightPixels++;
        }
      }
    }
    
    if (totalPixels === 0) {
      return {
        silhouetteRatio: 0,
        centerOfMass: { x: 0.5, y: 0.5 },
        verticalBalance: 0.5,
        horizontalBalance: 0.5
      };
    }
    
    // Normalize center of mass
    const normalizedCenterX = centerX / totalPixels / width;
    const normalizedCenterY = centerY / totalPixels / height;
    
    // Calculate balance ratios
    const verticalBalance = topPixels / (topPixels + bottomPixels);
    const horizontalBalance = leftPixels / (leftPixels + rightPixels);
    
    // Calculate silhouette ratio (subject vs background)
    const silhouetteRatio = totalPixels / (width * height);
    
    return {
      silhouetteRatio,
      centerOfMass: { x: normalizedCenterX, y: normalizedCenterY },
      verticalBalance,
      horizontalBalance
    };
  }

  // Extract image properties
  extractImageProperties(image) {
    return {
      width: image.bitmap.width,
      height: image.bitmap.height,
      format: image.getMIME(),
      hasAlpha: image.hasAlpha()
    };
  }

  // Compare two feature vectors
  compareFeatures(features1, features2) {
    if (!features1 || !features2) return 0;
    
    let totalScore = 0;
    let weightSum = 0;
    
    // Color features comparison (reduced weight)
    if (features1.colorFeatures && features2.colorFeatures) {
      const colorScore = this.compareColorFeatures(features1.colorFeatures, features2.colorFeatures);
      totalScore += colorScore * 0.25;
      weightSum += 0.25;
    }
    
    // Texture comparison (increased weight for fabric patterns)
    if (features1.textureFeatures && features2.textureFeatures) {
      const textureScore = this.compareTextureFeatures(features1.textureFeatures, features2.textureFeatures);
      totalScore += textureScore * 0.35;
      weightSum += 0.35;
    }
    
    // Edge comparison (increased weight for silhouette)
    if (features1.edgeFeatures && features2.edgeFeatures) {
      const edgeScore = this.compareEdgeFeatures(features1.edgeFeatures, features2.edgeFeatures);
      totalScore += edgeScore * 0.25;
      weightSum += 0.25;
    }
    
    // Shape comparison (increased weight for overall structure)
    if (features1.shapeFeatures && features2.shapeFeatures) {
      const shapeScore = this.compareShapeFeatures(features1.shapeFeatures, features2.shapeFeatures);
      totalScore += shapeScore * 0.15;
      weightSum += 0.15;
    }
    
    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  // Compare color features
  compareColorFeatures(color1, color2) {
    let totalScore = 0;
    let weightSum = 0;
    
    // Compare dominant colors
    if (color1.dominantColors && color2.dominantColors) {
      const dominantScore = this.compareDominantColors(color1.dominantColors, color2.dominantColors);
      totalScore += dominantScore * 0.4;
      weightSum += 0.4;
    }
    
    // Compare average colors
    if (color1.averageColor && color2.averageColor) {
      const averageScore = this.compareAverageColors(color1.averageColor, color2.averageColor);
      totalScore += averageScore * 0.3;
      weightSum += 0.3;
    }
    
    // Compare histograms
    if (color1.histogram && color2.histogram) {
      const histogramScore = this.compareHistograms(color1.histogram, color2.histogram);
      totalScore += histogramScore * 0.3;
      weightSum += 0.3;
    }
    
    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  // Compare dominant colors
  compareDominantColors(colors1, colors2) {
    let totalSimilarity = 0;
    const minLength = Math.min(colors1.length, colors2.length);
    
    for (let i = 0; i < minLength; i++) {
      const color1 = colors1[i];
      const color2 = colors2[i];
      
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(color1[0] - color2[0], 2) +
        Math.pow(color1[1] - color2[1], 2) +
        Math.pow(color1[2] - color2[2], 2)
      );
      
      // Convert distance to similarity (0-1)
      const similarity = Math.max(0, 1 - distance / (255 * Math.sqrt(3)));
      totalSimilarity += similarity;
    }
    
    return totalSimilarity / minLength;
  }

  // Compare average colors
  compareAverageColors(avg1, avg2) {
    const distance = Math.sqrt(
      Math.pow(avg1.red - avg2.red, 2) +
      Math.pow(avg1.green - avg2.green, 2) +
      Math.pow(avg1.blue - avg2.blue, 2)
    );
    
    return Math.max(0, 1 - distance / (255 * Math.sqrt(3)));
  }

  // Compare color histograms
  compareHistograms(hist1, hist2) {
    let totalSimilarity = 0;
    const channels = ['red', 'green', 'blue'];
    
    channels.forEach(channel => {
      if (hist1[channel] && hist2[channel]) {
        const similarity = this.calculateHistogramSimilarity(hist1[channel], hist2[channel]);
        totalSimilarity += similarity;
      }
    });
    
    return totalSimilarity / channels.length;
  }

  // Calculate histogram similarity using correlation
  calculateHistogramSimilarity(hist1, hist2) {
    const n = Math.min(hist1.length, hist2.length);
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
    
    for (let i = 0; i < n; i++) {
      sum1 += hist1[i];
      sum2 += hist2[i];
      sum1Sq += hist1[i] * hist1[i];
      sum2Sq += hist2[i] * hist2[i];
      pSum += hist1[i] * hist2[i];
    }
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
  }

  // Compare texture features
  compareTextureFeatures(tex1, tex2) {
    const meanDiff = Math.abs(tex1.mean - tex2.mean) / Math.max(tex1.mean, tex2.mean, 1);
    const varDiff = Math.abs(tex1.variance - tex2.variance) / Math.max(tex1.variance, tex2.variance, 1);
    const entropyDiff = Math.abs(tex1.entropy - tex2.entropy) / Math.max(tex1.entropy, tex2.entropy, 1);
    
    // Basic texture similarity
    const basicSimilarity = 1 - (meanDiff + varDiff + entropyDiff) / 3;
    
    // Pattern-based similarity (if available)
    let patternSimilarity = 0;
    if (tex1.patternConsistency !== undefined && tex2.patternConsistency !== undefined) {
      const patternConsistencyDiff = Math.abs(tex1.patternConsistency - tex2.patternConsistency);
      const verticalPatternDiff = Math.abs(tex1.verticalPattern - tex2.verticalPattern);
      const horizontalPatternDiff = Math.abs(tex1.horizontalPattern - tex2.horizontalPattern);
      
      patternSimilarity = 1 - (patternConsistencyDiff + verticalPatternDiff + horizontalPatternDiff) / 3;
    }
    
    // Weighted combination: 60% basic texture, 40% pattern analysis
    return patternSimilarity > 0 ? 
      (basicSimilarity * 0.6 + patternSimilarity * 0.4) : 
      basicSimilarity;
  }

  // Compare edge features
  compareEdgeFeatures(edge1, edge2) {
    const densityDiff = Math.abs(edge1.edgeDensity - edge2.edgeDensity);
    return 1 - densityDiff;
  }

  // Compare shape features
  compareShapeFeatures(shape1, shape2) {
    const aspectRatioDiff = Math.abs(shape1.aspectRatio - shape2.aspectRatio) / Math.max(shape1.aspectRatio, shape2.aspectRatio, 1);
    const circularityDiff = Math.abs(shape1.circularity - shape2.circularity);
    
    // Basic shape similarity
    const basicSimilarity = 1 - (aspectRatioDiff + circularityDiff) / 2;
    
    // Silhouette-based similarity (if available)
    let silhouetteSimilarity = 0;
    if (shape1.silhouetteRatio !== undefined && shape2.silhouetteRatio !== undefined) {
      const silhouetteRatioDiff = Math.abs(shape1.silhouetteRatio - shape2.silhouetteRatio);
      const centerXDiff = Math.abs(shape1.centerOfMass.x - shape2.centerOfMass.x);
      const centerYDiff = Math.abs(shape1.centerOfMass.y - shape2.centerOfMass.y);
      const verticalBalanceDiff = Math.abs(shape1.verticalBalance - shape2.verticalBalance);
      const horizontalBalanceDiff = Math.abs(shape1.horizontalBalance - shape2.horizontalBalance);
      
      silhouetteSimilarity = 1 - (silhouetteRatioDiff + centerXDiff + centerYDiff + verticalBalanceDiff + horizontalBalanceDiff) / 5;
    }
    
    // Weighted combination: 40% basic shape, 60% silhouette analysis
    return silhouetteSimilarity > 0 ? 
      (basicSimilarity * 0.4 + silhouetteSimilarity * 0.6) : 
      basicSimilarity;
  }

  // Find similar images in LV collection
  async findSimilarImages(uploadedImagePath, lvCollection, threshold = 0.1) {
    console.log('🔍 Starting image comparison...');
    
    try {
      // Extract features from uploaded image
      const uploadedFeatures = await this.extractImageFeatures(uploadedImagePath);
      
      if (!uploadedFeatures) {
        throw new Error('Failed to extract features from uploaded image');
      }
      
      const similarities = [];
      
      // Compare with each LV image
      for (const lvItem of lvCollection) {
        try {
          // Check if features are cached
          let lvFeatures = this.featureCache.get(lvItem.id);
          
          if (!lvFeatures) {
            // Extract features from LV image
            lvFeatures = await this.extractImageFeatures(lvItem.imagePath);
            
            if (lvFeatures) {
              // Cache the features
              this.featureCache.set(lvItem.id, lvFeatures);
            }
          }
          
          if (lvFeatures) {
            const similarity = this.compareFeatures(uploadedFeatures, lvFeatures);
            
            // Always include the match, but with lower confidence for low similarity
            similarities.push({
              ...lvItem,
              similarity,
              confidence: Math.min(Math.max(similarity, 0.3), 1.0) // Cap at 100%, minimum 30%
            });
          }
        } catch (error) {
          console.error(`Error comparing with LV item ${lvItem.id}:`, error.message);
        }
      }
      
      // Sort by similarity (highest first)
      similarities.sort((a, b) => b.similarity - a.similarity);
      
      // Filter by threshold and return top matches
      const filteredMatches = similarities.filter(match => match.similarity >= threshold);
      
      console.log(`✅ Found ${filteredMatches.length} similar images (${similarities.length} total compared)`);
      return filteredMatches.slice(0, 3); // Return top 3 matches
      
    } catch (error) {
      console.error('Error in findSimilarImages:', error);
      throw error;
    }
  }

  // Pre-process LV collection images
  async preprocessLVCollection(lvCollection) {
    console.log('🔄 Pre-processing LV collection images...');
    
    for (const item of lvCollection) {
      try {
        if (!this.featureCache.has(item.id)) {
          const features = await this.extractImageFeatures(item.imagePath);
          if (features) {
            this.featureCache.set(item.id, features);
          }
        }
      } catch (error) {
        console.error(`Error pre-processing LV item ${item.id}:`, error.message);
      }
    }
    
    console.log(`✅ Pre-processed ${this.featureCache.size} LV images`);
  }
}

module.exports = ComputerVisionService;
