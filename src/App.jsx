import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';
import { fetchUserCity } from './utils/github';
import './index.css';

function App() {
  const [cityData,   setCityData]   = useState(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [hoveredRepo, setHoveredRepo] = useState(null);
  const [error,      setError]      = useState('');

  const handleSearch = useCallback(async (username) => {
    setIsLoading(true);
    setError('');
    setCityData(null);
    try {
      const data = await fetchUserCity(username);
      setCityData(data);
    } catch (err) {
      setError(err.response?.status === 404
        ? `User "${username}" not found.`
        : err.response?.status === 403
        ? 'GitHub API rate limit reached. Please wait a minute and try again.'
        : 'Failed to load city. Check the username and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <Scene
        cityData={cityData}
        hoveredRepo={hoveredRepo}
        onHover={setHoveredRepo}
      />
      <Overlay
        cityData={cityData}
        isLoading={isLoading}
        onSearch={handleSearch}
        hoveredRepo={hoveredRepo}
        onHoverRepo={setHoveredRepo}
      />
      {error && (
        <div className="error-toast fade-in">
          ⚠️ {error}
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}
    </>
  );
}

export default App;
