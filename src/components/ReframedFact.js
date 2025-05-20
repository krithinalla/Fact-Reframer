import React, { forwardRef } from 'react';
import './ReframedFact.css';

const ReframedFact = forwardRef(({ fact, badgeText }, ref) => {
  return (
    <div className="reframed-fact-container" ref={ref}>
      <div className="lens-badge">
        {badgeText}
      </div>
      <div className="reframed-fact">
        {fact}
      </div>
    </div>
  );
});

export default ReframedFact; 