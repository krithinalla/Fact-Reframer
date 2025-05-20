import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import StepIndicator from './components/StepIndicator';
import FactStackLayout from './components/FactRadialLayout';

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('');
  const [reframedFacts, setReframedFacts] = useState([]);
  const [appliedLenses, setAppliedLenses] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [lenses, setLenses] = useState([
    'Chemistry',
    'Design',
    'Engineering',
    'Mathematics',
    'Geography',
    'Material Science',
    'Art'
  ]);

  // Test the API connection on component mount
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        setApiStatus('Testing API connection...');
        const response = await fetch('/api/test');
        const data = await response.json();
        setApiStatus(`Google Gemini 1.5 Flash model works successfully`);
      } catch (error) {
        setApiStatus(`API connection failed: ${error.message}`);
        console.error('API connection error:', error);
      }
    };

    testApiConnection();
  }, []);

  const getRandomFact = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching fact from API...');
      const response = await fetch('/api/getInitialFact', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received fact:', data);
      setFact(data.fact);
      // Reset reframed facts and applied lenses when getting a new fact
      setReframedFacts([]);
      setAppliedLenses([]);
      setCurrentStep(2); // Move to step 2 after getting fact
    } catch (error) {
      console.error('Error getting fact:', error);
      setError(error.message || "Failed to retrieve a fact. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const applyLens = async (lens) => {
    if (!fact) return;
    
    setError('');
    
    try {
      console.log(`Applying ${lens} lens to fact: ${fact}`);
      const response = await fetch('/api/reframeFact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          textToReframe: fact, 
          subjectLens: lens 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Reframed fact:', data);
      
      // Add new reframed fact to the list
      const newReframedFacts = [...reframedFacts, data.reframedText];
      setReframedFacts(newReframedFacts);
      
      // Add new lens to the list of applied lenses
      const newAppliedLenses = [...appliedLenses, lens];
      setAppliedLenses(newAppliedLenses);
    } catch (error) {
      console.error('Error applying lens:', error);
      setError(error.message || `Failed to reframe with ${lens}. Check console for details.`);
    }
  };

  const addNewLens = () => {
    const newLens = prompt("Enter new lens category:");
    if (newLens && newLens.trim() !== "" && !lenses.includes(newLens)) {
      setLenses([...lenses, newLens]);
    }
  };

  // Helper function to generate lens badge text
  const generateLensBadgeText = (lensIndex) => {
    const usedLenses = appliedLenses.slice(0, lensIndex + 1);
    return `Fact ${usedLenses.map(lens => `. ${lens.toLowerCase()}`).join('')}`;
  };

  const togglePanel = () => {
    setIsPanelCollapsed(!isPanelCollapsed);
  };

  return (
    <div className="app-container">
      <div className={`floating-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <h2>Fact Reframer</h2>
          <button className="collapse-button" onClick={togglePanel}>
            {isPanelCollapsed ? '»' : '«'}
          </button>
        </div>
        
        <div className="panel-content">
          <StepIndicator 
            currentStep={currentStep} 
            getRandomFact={getRandomFact}
            lenses={lenses}
            onLensSelect={applyLens}
            onAddLens={addNewLens}
          />
          
          {apiStatus && <div className="api-status">{apiStatus}</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {loading && <div className="loading-indicator">Loading...</div>}
        </div>
      </div>
      
      <FactStackLayout 
        originalFact={fact}
        reframedFacts={reframedFacts}
        appliedLenses={appliedLenses}
        generateLensBadgeText={(index) => {
          if (!appliedLenses || !appliedLenses[index]) return '';
          return `Fact . ${appliedLenses.slice(0, index + 1).join('. ').toLowerCase()}`;
        }}
      />
    </div>
  );
};

export default App; 