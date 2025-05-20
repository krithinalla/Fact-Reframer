import React from 'react';
import './StepIndicator.css';
import LensList from './LensList';

const StepIndicator = ({ currentStep, getRandomFact, lenses, onLensSelect, onAddLens }) => {
  // Check if a fact is loaded (Step 2 is active)
  const hasFact = currentStep === 2;
  
  return (
    <div className="step-indicator">
      <div className="grid-container">
        {/* Row 1 */}
        <div className="grid-cell cell-label">
          <div className="step-text">
            <div className="step-number">Step 1:</div>
            <div className="step-title">Add a fact</div>
          </div>
        </div>
        <div className="grid-cell cell-button">
          <button 
            className="get-fact-button"
            onClick={getRandomFact}
          >
            Get Fact
          </button>
        </div>
        
        {/* Row 2 */}
        <div className="grid-cell cell-label">
          <div className="step-text">
            <div className="step-number">Step 2:</div>
            <div className="step-title">Pick a lens</div>
          </div>
        </div>
        <div className="grid-cell cell-button">
          <div className="step-lens-list">
            <LensList 
              lenses={lenses} 
              onLensSelect={onLensSelect}
              onAddLens={onAddLens}
              disabled={!hasFact}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator; 