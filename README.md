# Will it LV? - Louis Vuitton Image Comparison App

A React frontend with Node.js backend that compares uploaded images against the LV Fall 2025 Ready-to-Wear collection.

## Features

- **Image Upload**: Upload any image to compare with LV collection
- **LV Fall 2025 Collection**: Pre-loaded dataset of LV Fall 2025 Ready-to-Wear items
- **Smart Matching**: AI-powered image comparison with confidence scores
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Real-time Results**: Instant feedback with match percentages

## Tech Stack

### Frontend
- React 18
- Webpack 5
- CSS3 with modern features
- Responsive design

### Backend
- Node.js with Express
- OpenCV4Node.js for computer vision
- Puppeteer for web scraping
- Sharp for image processing
- Multer for file uploads
- CORS enabled
- Security middleware (Helmet, Rate limiting)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install computer vision dependencies:
```bash
# Run the installation script (recommended)
./install-cv.sh

# Or install manually:
npm install
```

**Note**: The installation script will:
- Install OpenCV and system dependencies
- Set up Python dependencies for image processing
- Verify all packages are working correctly

3. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

**First Run**: The server will automatically scrape LV Fall 2025 images from [WWD](https://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-27/) and process them for comparison. This may take a few minutes.

### Frontend Setup

1. Navigate to the root directory:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### `GET /api/health`
Health check endpoint

### `GET /api/collection`
Returns the LV Fall 2025 collection data

### `POST /api/compare`
Upload an image for comparison
- **Body**: FormData with 'image' field
- **Response**: Array of matching LV items with confidence scores

## LV Fall 2025 Collection

The app includes a curated dataset of LV Fall 2025 Ready-to-Wear items including:

- **Outerwear**: Trench coats, denim jackets
- **Dresses**: Mini dresses, formal wear
- **Bags**: Handbags, structured bags
- **Footwear**: Sneakers, formal shoes

Each item includes:
- Name and description
- Category and features
- Color information
- Price range
- Confidence scoring

## How It Works

1. **Upload**: User uploads an image through the React frontend
2. **Scrape**: Backend automatically scrapes LV Fall 2025 images from WWD gallery
3. **Process**: Images are processed using OpenCV for feature extraction
4. **Compare**: Computer vision algorithms compare uploaded image with LV collection
5. **Analyze**: Features like color histograms, texture, edges, and shapes are analyzed
6. **Results**: Returns matching items with similarity scores and confidence levels
7. **Display**: Frontend displays results in a beautiful card layout

### Computer Vision Features

- **Color Histogram Analysis**: Compares color distributions
- **Texture Analysis**: Uses Local Binary Patterns (LBP) for texture comparison
- **Edge Detection**: Analyzes edge patterns and orientations
- **Shape Analysis**: Compares aspect ratios, circularity, and solidity
- **Feature Caching**: Pre-processes LV images for faster comparison

## Future Enhancements

- **Real AI Integration**: Replace mock comparison with actual computer vision
- **Database**: Store LV collection in a proper database
- **User Accounts**: Save comparison history
- **Social Features**: Share matches on social media
- **Mobile App**: React Native version

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
npm start  # Webpack dev server with hot reload
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
npm start  # Production mode
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
Personal Projeect for fun
