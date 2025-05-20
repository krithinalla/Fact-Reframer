import React from 'react';
import './OriginalFact.css';

const OriginalFact = ({ fact }) => {
  return (
    <div className="original-fact-container">
      {fact}
    </div>
  );
};

export default OriginalFact; 