import React from 'react';
import './FactDisplay.css';

const FactDisplay = ({ fact, loading, error }) => {
  if (!fact && !error) {
    return null; // Don't render anything if there's no fact or error
  }
  
  return (
    <div className={`fact-display ${fact ? 'fact-display-visible' : ''}`}>
      {/* Remove the loading state display */}
      
      {error && <div className="error">{error}</div>}
      
      {!error && fact && (
        <div className="fact-content">{fact}</div>
      )}
      
      {!error && !fact && (
        <div className="empty-state">Fact will appear here after clicking "Get Fact"</div>
      )}
    </div>
  );
};

export default FactDisplay; 