import React, { useState, useRef, useEffect } from 'react';
import './FactRadialLayout.css';

// Constants for layout configuration
const BASE_RADIUS = 400; // Increased for better spacing
const CENTER_SIZE = { width: 320, height: 120 };
const REFRAMED_SIZE = { width: 320, height: 120 };
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const FactRadialLayout = ({ originalFact, reframedFacts, appliedLenses, generateLensBadgeText }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Center of the container (responsive)
  const vw = window.innerWidth || 1200;
  const vh = window.innerHeight || 800;
  const centerX = Math.floor(vw * 0.5);
  const centerY = Math.floor(vh * 0.5);

  // Handle zooming with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(MIN_ZOOM, zoom + delta), MAX_ZOOM);
    setZoom(newZoom);
  };

  // Start dragging
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Update position while dragging
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - ZOOM_STEP, MIN_ZOOM));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoom]);

  // Calculate positions for reframed facts
  let reframedPositions;

  if (reframedFacts.length === 0) {
    reframedPositions = [];
  } else if (reframedFacts.length === 1) {
    // Single fact goes below
    reframedPositions = [{
      x: centerX - REFRAMED_SIZE.width / 2,
      y: centerY + CENTER_SIZE.height / 2 + 80,
      angle: 0
    }];
  } else {
    // For multiple facts, distribute them evenly in a circle
    const radius = BASE_RADIUS + (reframedFacts.length > 6 ? (reframedFacts.length - 6) * 40 : 0);
    
    reframedPositions = reframedFacts.map((_, index) => {
      // Calculate the angle for even distribution
      // Start from -π/2 (top) and distribute facts evenly
      const angleStep = (2 * Math.PI) / reframedFacts.length;
      const angle = -Math.PI / 2 + index * angleStep;
      
      // Calculate position using polar coordinates
      // Add offset to x position to account for card width
      // Add offset to y position to account for card height
      return {
        x: centerX + radius * Math.cos(angle) - REFRAMED_SIZE.width / 2,
        y: centerY + radius * Math.sin(angle) - REFRAMED_SIZE.height / 2,
        angle: angle
      };
    });
  }

  return (
    <div 
      ref={containerRef}
      className="fact-radial-bg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="fact-radial-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <svg className="fact-radial-svg" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
          {/* Draw lines from center to each reframed fact */}
          {originalFact && reframedPositions.map((pos, i) => (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={pos.x + REFRAMED_SIZE.width / 2}
              y2={pos.y + REFRAMED_SIZE.height / 2}
              stroke="#bcb3e6"
              strokeWidth={2 / zoom} // Adjust line width based on zoom
            />
          ))}
        </svg>
        {/* Original Fact in center */}
        {originalFact && (
          <div
            className="fact-center"
            style={{
              left: centerX - CENTER_SIZE.width / 2,
              top: centerY - CENTER_SIZE.height / 2,
              position: 'absolute',
            }}
          >
            {originalFact}
          </div>
        )}
        {/* Reframed Facts around */}
        {originalFact && reframedFacts.map((fact, i) => (
          <div
            className="fact-reframed"
            key={i}
            style={{
              left: reframedPositions[i].x,
              top: reframedPositions[i].y,
              position: 'absolute',
              // Remove the transform rotation
            }}
          >
            <div className="fact-lens-badge">{appliedLenses && appliedLenses[i]}</div>
            <div>{fact}</div>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-button">+</button>
        <button onClick={handleZoomReset} className="zoom-button">Reset</button>
        <button onClick={handleZoomOut} className="zoom-button">−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default FactRadialLayout; 