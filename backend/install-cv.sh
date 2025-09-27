#!/bin/bash

echo "🔧 Installing Computer Vision Dependencies for LV Image Comparison"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install system dependencies for OpenCV
echo "📦 Installing system dependencies..."

# For macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "📦 Installing OpenCV and related packages via Homebrew..."
    brew install opencv pkg-config cairo pango libpng jpeg giflib librsvg
    
    # Install Python dependencies for OpenCV
    echo "🐍 Installing Python dependencies..."
    pip3 install opencv-python numpy
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Detected Linux"
    
    # Update package list
    sudo apt-get update
    
    # Install OpenCV and related packages
    echo "📦 Installing OpenCV and related packages via apt..."
    sudo apt-get install -y \
        libopencv-dev \
        python3-opencv \
        python3-numpy \
        pkg-config \
        libcairo2-dev \
        libpango1.0-dev \
        libpng-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev
    
else
    echo "⚠️  Unsupported operating system: $OSTYPE"
    echo "   Please install OpenCV manually for your system"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Check if OpenCV installation was successful
echo "🔍 Verifying OpenCV installation..."
node -e "
try {
    const cv = require('opencv4nodejs');
    console.log('✅ OpenCV4Node.js is working correctly');
    console.log('   OpenCV version:', cv.version);
} catch (error) {
    console.log('❌ OpenCV4Node.js installation failed:', error.message);
    console.log('   Please check the installation and try again');
    process.exit(1);
}
"

# Test other dependencies
echo "🔍 Testing other dependencies..."
node -e "
try {
    const puppeteer = require('puppeteer');
    const cheerio = require('cheerio');
    const jimp = require('jimp');
    console.log('✅ All dependencies are working correctly');
} catch (error) {
    console.log('❌ Some dependencies failed:', error.message);
    process.exit(1);
}
"

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the backend server: npm run dev"
echo "2. The server will automatically scrape LV Fall 2025 images from WWD"
echo "3. Images will be processed and cached for fast comparison"
echo ""
echo "⚠️  Note: First run may take a few minutes to download and process images"
echo ""
echo "🚀 Ready to compare images with LV Fall 2025 collection!"
