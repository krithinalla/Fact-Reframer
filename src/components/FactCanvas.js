import React, { useState, useRef, useEffect } from 'react';
import ReframedFact from './ReframedFact';
import OriginalFact from './OriginalFact';
import './FactCanvas.css';

const FactCanvas = ({ originalFact, reframedFacts, appliedLenses, generateLensBadgeText }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const latestFactRef = useRef(null);

  // Handle zooming with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(0.5, scale + delta), 2);
    setScale(newScale);
  };

  // Start dragging the canvas
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

  // Scroll to latest fact when added
  useEffect(() => {
    if (latestFactRef.current && reframedFacts.length > 0) {
      // Calculate the position to center the latest fact
      const factRect = latestFactRef.current.getBoundingClientRect();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      const targetX = -(factRect.left - canvasRect.width/2 + factRect.width/2);
      const targetY = -(factRect.top - canvasRect.height/2 + factRect.height/2);
      
      // Animate to the position
      setPosition({ x: targetX, y: targetY });
    }
  }, [reframedFacts.length]);

  // Setup event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }
  }, [scale]);

  // Reset position when no facts
  useEffect(() => {
    if (!originalFact) {
      setPosition({ x: 0, y: 0 });
      setScale(1);
    } else if (reframedFacts.length === 0) {
      // Center the original fact when it's first loaded
      setTimeout(() => {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (canvasRect) {
          setPosition({ 
            x: canvasRect.width / 2 - 150, // Approximate center
            y: canvasRect.height / 2 - 100
          });
        }
      }, 100);
    }
  }, [originalFact, reframedFacts.length]);

  return (
    <div 
      className="fact-canvas"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="canvas-grid"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
        }}
      />
      
      <div 
        className="canvas-content"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        {originalFact && (
          <div className="fact-thread">
            <OriginalFact fact={originalFact} />
            {reframedFacts.length > 0 && (
              <div className="fact-branches">
                {reframedFacts.map((reframedFact, index) => (
                  <div 
                    key={index} 
                    className="fact-branch"
                  >
                    <div className="branch-line"></div>
                    <ReframedFact 
                      fact={reframedFact}
                      badgeText={generateLensBadgeText(index)}
                      ref={index === reframedFacts.length - 1 ? latestFactRef : null}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="canvas-controls">
        <button onClick={() => setScale(Math.min(scale + 0.1, 2))}>+</button>
        <button onClick={() => setScale(1)}>Reset</button>
        <button onClick={() => setScale(Math.max(scale - 0.1, 0.5))}>-</button>
      </div>
      
      <div className="canvas-info">
        <span>Zoom: {Math.round(scale * 100)}%</span>
        <span>• Scroll to zoom • Drag to pan</span>
      </div>
    </div>
  );
};

export default FactCanvas; 