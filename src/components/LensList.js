import React from 'react';
import './LensList.css';

const LensList = ({ lenses, onLensSelect, onAddLens, disabled = false }) => {
  return (
    <div className={`lens-list ${disabled ? 'lens-list-disabled' : ''}`}>
      {lenses.map((lens) => (
        <button
          key={lens}
          className="lens-button"
          onClick={() => onLensSelect(lens)}
          disabled={disabled}
        >
          {lens}
        </button>
      ))}
      
      <button 
        className="add-lens-button"
        onClick={onAddLens}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );
};

export default LensList; 