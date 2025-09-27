import React, { useState } from 'react';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setMatches(null);
      setError(null);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFindLouis = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatches(data.matches);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setMatches(null);
    setError(null);
    setIsLoading(false);
    // Reset the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Will it LV?</h1>
        
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="image-upload"
            className="file-input"
          />
          <label htmlFor="image-upload" className="upload-button">
            Upload Image
          </label>
        </div>

        {imagePreview && (
          <div className="image-display">
            <img src={imagePreview} alt="Uploaded" className="uploaded-image" />
          </div>
        )}

        {imagePreview && (
          <div className="button-group">
            <button 
              onClick={handleFindLouis} 
              className="find-button"
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Find my Louis'}
            </button>
            <button 
              onClick={handleClear} 
              className="clear-button"
              disabled={isLoading}
            >
              Clear
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {matches && (
          <div className="results-section">
            <h2>LV Fall 2025 Matches</h2>
            <div className="matches-grid">
              {matches.map((match, index) => (
                <div key={match.id} className="match-card">
                  <div className="match-header">
                    <h3>{match.name}</h3>
                    <span className="confidence">
                      {Math.round(match.confidence * 100)}% match
                    </span>
                  </div>
                  <p className="category">{match.category}</p>
                  <p className="description">{match.description}</p>
                  <div className="match-details">
                    <div className="link-buttons">
                      <a 
                        href={match.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gallery-link primary"
                      >
                        View Full Image
                      </a>
                      <a 
                        href={`https://wwd.com/fashion-news/shows-reviews/gallery/louis-vuitton-fall-2025-ready-to-wear-collection-1237040044/louis-vuitton-fall-2025-ready-to-wear-collection-${match.id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gallery-link secondary"
                      >
                        Browse Collection
                      </a>
                    </div>
                    <div className="features">
                      {match.features.slice(0, 3).map((feature, idx) => (
                        <span key={idx} className="feature-tag">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
