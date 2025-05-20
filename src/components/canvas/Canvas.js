import React, { useRef, useEffect, useState } from 'react';
import './Canvas.css';

const Canvas = ({ originalFact, reframedFacts, appliedLenses }) => {
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  // Transformation matrix - using DOMMatrix for now, can be a custom object later
  const [transformMatrix, setTransformMatrix] = useState(new DOMMatrix());
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState([]); // To store canvas elements
  const zoomSensitivity = 0.1;
  const minZoom = 0.1;
  const maxZoom = 10;
  const keyboardPanSpeed = 20; // pixels per keystroke
  const defaultElementSize = { width: 120, height: 60 };
  const factElementBaseSize = { width: 250, height: 100 }; // Base size for fact elements

  // Debounce function
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      setCtx(context);

      const dpr = window.devicePixelRatio || 1;
      // Set display size (css pixels).
      // Canvas.css already sets width/height to 100%, so we use clientWidth/Height for actual size.
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale the context to ensure crisp drawing on high DPI screens
      // All drawing operations will now be in CSS pixels.
      // The transformation matrix will also operate in this scaled space.
      context.scale(dpr, dpr);

      // Load viewport state from localStorage
      const savedPanOffset = localStorage.getItem('canvasPanOffset');
      const savedZoomLevel = localStorage.getItem('canvasZoomLevel');

      let initialPanX = 0;
      let initialPanY = 0;
      let initialZoom = 1;

      if (savedPanOffset) {
        try {
          const parsedOffset = JSON.parse(savedPanOffset);
          initialPanX = parsedOffset.x || 0;
          initialPanY = parsedOffset.y || 0;
        } catch (error) {
          console.error("Error parsing saved pan offset:", error);
        }
      }
      if (savedZoomLevel) {
        const parsedZoom = parseFloat(savedZoomLevel);
        if (!isNaN(parsedZoom)) {
          initialZoom = Math.max(minZoom, Math.min(maxZoom, parsedZoom));
        }
      }

      setPanOffset({x: initialPanX, y: initialPanY });
      setZoomLevel(initialZoom);

      // Initial transform (operates in the scaled coordinate system)
      const initialMatrix = new DOMMatrix();
      initialMatrix.translateSelf(initialPanX, initialPanY);
      initialMatrix.scaleSelf(initialZoom, initialZoom);
      setTransformMatrix(initialMatrix); // Store the matrix that doesn't include DPR scale
      
      // Apply the full transform to context: DPR scale * view transform
      const fullInitialMatrix = new DOMMatrix().scale(dpr, dpr).multiply(initialMatrix);
      context.setTransform(fullInitialMatrix); 
    }
  }, []); // Runs once on mount

  useEffect(() => {
    if (ctx) {
      const dpr = window.devicePixelRatio || 1;
      // View transform matrix (pan and zoom)
      const viewMatrix = new DOMMatrix();
      viewMatrix.translateSelf(panOffset.x, panOffset.y);
      viewMatrix.scaleSelf(zoomLevel, zoomLevel);
      setTransformMatrix(viewMatrix); // Store the view matrix

      // Apply the full transform: DPR scale * view transform
      const fullMatrix = new DOMMatrix().scale(dpr, dpr).multiply(viewMatrix);
      ctx.setTransform(fullMatrix);
      
      redrawCanvas();

      localStorage.setItem('canvasPanOffset', JSON.stringify(panOffset));
      localStorage.setItem('canvasZoomLevel', zoomLevel.toString());
    }
  }, [panOffset, zoomLevel, ctx]);

  const redrawCanvas = () => {
    if (!ctx) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Clear the canvas (transformed)
    const savedTransform = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(savedTransform);

    // Draw all elements
    elements.forEach(element => {
      ctx.fillStyle = element.color || 'gray';
      ctx.fillRect(element.x, element.y, element.width, element.height);

      if (element.text) {
        ctx.fillStyle = '#333333'; // Text color
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Basic text wrapping
        const padding = 10;
        const maxWidth = element.width - (padding * 2);
        const lineHeight = 18;
        let words = element.text.split(' ');
        let line = '';
        let textY = element.y + padding;

        for(let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          let metrics = ctx.measureText(testLine);
          let testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, element.x + padding, textY);
            line = words[n] + ' ';
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, element.x + padding, textY);
        
        // Dynamically adjust element height based on text content (approximate)
        // This is a bit tricky and might need a more robust solution or fixed height with scroll.
        // For now, we can try to update the element's height if it's too small.
        // This part is complex to do reactively here. Ideally, calculate height when element is created/updated.
      }
    });

    // Example drawing - a rectangle in world coordinates (keeping for reference, can be removed)
    // ctx.fillStyle = 'blue';
    // ctx.fillRect(50, 50, 100, 100); 

    // Example drawing - a circle at world origin (keeping for reference, can be removed)
    // ctx.beginPath();
    // ctx.arc(0, 0, 20, 0, 2 * Math.PI); 
    // ctx.fillStyle = 'red';
    // ctx.fill();
  };

  const addElement = (worldX, worldY, width, height, color, text, elementType) => {
    const newElement = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 15), // More robust unique ID
      x: worldX,
      y: worldY,
      width: width || defaultElementSize.width,
      height: height || defaultElementSize.height,
      color: color || 'purple',
      text: text || '',
      elementType: elementType || 'generic',
    };
    // Avoid adding duplicate elements if an element with the same text and type already exists (simple check)
    setElements(prevElements => {
        if (elementType !== 'generic' && prevElements.find(el => el.text === text && el.elementType === elementType)) {
            return prevElements;
        }
        return [...prevElements, newElement];
    });
  };

  // Placeholder for coordinate conversion functions
  const screenToWorld = (screenX, screenY) => {
    // transformMatrix here is the view matrix (pan/zoom), it does not include DPR scaling.
    // Screen coordinates are CSS pixels.
    const invertedMatrix = transformMatrix.inverse();
    if (invertedMatrix) {
        // Apply the inverse transform to get world coordinates
        const worldX = (screenX - panOffset.x) / zoomLevel;
        const worldY = (screenY - panOffset.y) / zoomLevel;
        return { x: worldX, y: worldY };
    }
    return { x: screenX, y: screenY }; // Fallback to screen coordinates
  };

  const worldToScreen = (worldX, worldY) => {
    // Apply the transform to get screen coordinates
    const screenX = (worldX * zoomLevel) + panOffset.x;
    const screenY = (worldY * zoomLevel) + panOffset.y;
    return { x: screenX, y: screenY };
  };

  // Effect to handle incoming fact data from props
  useEffect(() => {
    if (!ctx || !canvasRef.current) return; // Ensure canvas and context are ready

    let nextElements = elements.filter(el => el.elementType === 'generic');
    let currentOriginalFactElement = elements.find(el => el.elementType === 'originalFact');

    const dpr = window.devicePixelRatio || 1;
    const viewWidth = canvasRef.current.width / dpr;
    const viewHeight = canvasRef.current.height / dpr;

    // Check if the originalFact prop has actually changed to a new fact
    const isNewOriginalFact = originalFact && (!currentOriginalFactElement || currentOriginalFactElement.text !== originalFact);

    if (isNewOriginalFact) {
      // New original fact, clear previous fact elements and place the new one at viewport center
      nextElements = elements.filter(el => el.elementType === 'generic'); // Keep only generic elements
      
      // Calculate the current viewport center in world coordinates
      const screenCenterX = viewWidth / 2;
      const screenCenterY = viewHeight / 2;
      const worldCenter = screenToWorld(screenCenterX, screenCenterY);

      if (worldCenter && typeof worldCenter.x === 'number' && typeof worldCenter.y === 'number') {
        // Place the original fact at the current viewport center
        currentOriginalFactElement = {
          id: 'original-' + originalFact.slice(0, 20) + Date.now(),
          x: worldCenter.x - (factElementBaseSize.width / 2),
          y: worldCenter.y - (factElementBaseSize.height / 2),
          width: factElementBaseSize.width,
          height: factElementBaseSize.height,
          text: originalFact,
          elementType: 'originalFact',
          color: '#FFFACD',
        };
        nextElements.push(currentOriginalFactElement);
      }
    } else if (currentOriginalFactElement) {
      // Keep the existing original fact in its current position
      nextElements.push(currentOriginalFactElement);
    }

    // Handle reframed facts
    if (reframedFacts && reframedFacts.length > 0 && currentOriginalFactElement) {
      // Get all existing reframed facts for this original fact
      const existingReframedFacts = nextElements.filter(el => 
        el.elementType === 'reframedFact' && 
        el.originalFactId === currentOriginalFactElement.id
      );

      // Calculate the starting Y position for new reframed facts
      let currentYOffset = currentOriginalFactElement.y + currentOriginalFactElement.height + 20;
      if (existingReframedFacts.length > 0) {
        // If there are existing reframed facts, start after the last one
        const lastReframedFact = existingReframedFacts.reduce((last, current) => 
          current.y > last.y ? current : last
        );
        currentYOffset = lastReframedFact.y + lastReframedFact.height + 20;
      }

      const baseFactX = currentOriginalFactElement.x;

      reframedFacts.forEach((rf, index) => {
        const reframedId = `reframed-${index}-` + rf.slice(0, 15) + Date.now();
        let lensInfo = appliedLenses && appliedLenses[index] ? ` (${appliedLenses[index]})` : '';
        const fullText = `${rf}${lensInfo}`;

        // Check if this reframed fact already exists
        const existingReframedElement = existingReframedFacts.find(el => 
          el.id.startsWith(`reframed-${index}-`)
        );

        if (!existingReframedElement) {
          // Add new reframed fact below the last fact
          nextElements.push({
            id: reframedId,
            originalFactId: currentOriginalFactElement.id,
            x: baseFactX + 30,
            y: currentYOffset,
            width: factElementBaseSize.width - 30,
            height: factElementBaseSize.height,
            text: fullText,
            elementType: 'reframedFact',
            color: '#E6E6FA',
          });
          currentYOffset += factElementBaseSize.height + 20;
        }
      });
    }

    // Filter out old reframed facts if original fact changed
    if (isNewOriginalFact) {
      nextElements = nextElements.filter(el => el.elementType !== 'reframedFact');
    }

    // Only update if there are actual changes
    const significantProps = el => ({ id: el.id, text: el.text, x: el.x, y: el.y, elementType: el.elementType });
    const currentSignificantElements = elements.map(significantProps);
    const nextSignificantElements = nextElements.map(significantProps);

    if (JSON.stringify(currentSignificantElements) !== JSON.stringify(nextSignificantElements)) {
      setElements(nextElements);
    }
  }, [originalFact, reframedFacts, appliedLenses, ctx, panOffset, zoomLevel]);

  // Example: Add a test element on mount for visualization
  useEffect(() => {
    // Load elements from localStorage
    const savedElements = localStorage.getItem('canvasElements');
    if (savedElements) {
      try {
        const parsedElements = JSON.parse(savedElements);
        if (Array.isArray(parsedElements)) {
          setElements(parsedElements);
        } else {
          // Fallback if saved data is not an array (e.g. initial test elements)
          addDefaultElements();
        }
      } catch (error) {
        console.error("Error parsing saved elements:", error);
        addDefaultElements(); // Load default if parsing fails
      }
    } else {
      // Add default elements if nothing is in localStorage
      addDefaultElements();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const addDefaultElements = () => {
    // Only add if elements array is currently empty to avoid duplication on HMR
    setElements(prevElements => {
        if (prevElements.length === 0) {
            return [
                { id: '1', x: 10, y: 10, width: 150, height: 80, color: 'green' },
                { id: '2', x: 200, y: 150, width: 100, height: 100, color: 'orange' },
            ];
        }
        return prevElements;
    });
  };

  // Save elements to localStorage whenever they change
  useEffect(() => {
    if (elements.length > 0 || localStorage.getItem('canvasElements')) { 
        // Debounce saving to avoid excessive writes for rapid changes (e.g. dragging an element)
        // However, for simple element list changes, direct save is fine for now.
        // If element properties were changing rapidly, debouncing would be more critical here.
        localStorage.setItem('canvasElements', JSON.stringify(elements));
    }
  }, [elements]);

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect(); // Get current CSS size

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // The existing transformMatrix for pan/zoom is still valid.
      // We need to re-apply the dpr scaling to the context first,
      // then our view transform.
      const viewMatrix = new DOMMatrix().translateSelf(panOffset.x, panOffset.y).scaleSelf(zoomLevel, zoomLevel);
      const fullMatrix = new DOMMatrix().scale(dpr, dpr).multiply(viewMatrix);
      ctx.setTransform(fullMatrix);
      
      redrawCanvas(); 
    }
  };

  // Debounced resize handler
  const debouncedResizeHandler = debounce(handleResize, 250);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp); 
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('wheel', handleWheel, { passive: false }); 
      canvas.addEventListener('dblclick', handleDoubleClick); 
      window.addEventListener('keydown', handleKeyDown); 
      window.addEventListener('resize', debouncedResizeHandler); // Add resize listener

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('dblclick', handleDoubleClick); 
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', debouncedResizeHandler); // Remove resize listener
      };
    }
  }, [isPanning, lastMousePosition, zoomLevel, panOffset, transformMatrix, elements, ctx]); // Added ctx to dependencies for handleResize

  const handleMouseDown = (e) => {
    setIsPanning(true);
    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;

    const dx = e.clientX - lastMousePosition.x;
    const dy = e.clientY - lastMousePosition.y;

    // Pan speed should be independent of zoom level in screen space
    setPanOffset(prevOffset => ({
      x: prevOffset.x + dx,
      y: prevOffset.y + dy,
    }));

    setLastMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleWheel = (e) => {
    e.preventDefault(); // Prevent page scrolling
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left; // Mouse position relative to canvas
    const mouseY = e.clientY - rect.top;

    // Convert mouse screen coordinates to world coordinates before zoom
    const worldBeforeZoom = screenToWorld(mouseX, mouseY);

    // Calculate new zoom level
    const delta = e.deltaY * -1; // Invert direction for intuitive zoom
    const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel * Math.pow(1 + zoomSensitivity, delta > 0 ? 1 : -1)));

    setZoomLevel(newZoomLevel);

    // After zoom, the world point under mouse should still be same screen point.
    // So, we adjust panOffset.
    // newPanX + worldBeforeZoom.x * newZoom = mouseX
    // newPanY + worldBeforeZoom.y * newZoom = mouseY
    setPanOffset(prevOffset => ({
        x: mouseX - worldBeforeZoom.x * newZoomLevel,
        y: mouseY - worldBeforeZoom.y * newZoomLevel
    }));
  };

  const handleKeyDown = (e) => {
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowUp':
        dy = keyboardPanSpeed;
        break;
      case 'ArrowDown':
        dy = -keyboardPanSpeed;
        break;
      case 'ArrowLeft':
        dx = keyboardPanSpeed;
        break;
      case 'ArrowRight':
        dx = -keyboardPanSpeed;
        break;
      default:
        return; // Exit if not an arrow key
    }

    // Prevent default arrow key behavior (scrolling the page)
    e.preventDefault();

    setPanOffset(prevOffset => ({
      x: prevOffset.x + dx,
      y: prevOffset.y + dy,
    }));
  };

  const handleDoubleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const worldCoords = screenToWorld(screenX, screenY);
    
    // Ensure worldCoords is valid before adding element
    if (worldCoords && typeof worldCoords.x === 'number' && typeof worldCoords.y === 'number') {
        addElement(worldCoords.x, worldCoords.y);
    } else {
        console.error("Failed to convert screen to world coordinates for double click.");
    }
  };

  // TODO: Implement pan and zoom event handlers
  // TODO: Implement virtual scrolling mechanism
  // TODO: Add keyboard navigation
  // TODO: Implement pinch-to-zoom and trackpad gesture support
  // TODO: Store viewport state
  // TODO: Set a maximum zoom out boundary (minZoom already does this effectively)
  // TODO: Implement element persistence (to localStorage for now)
  // TODO: Implement spatial index
  // TODO: Implement undo/redo

  return (
    <canvas ref={canvasRef} id="main-canvas"></canvas>
  );
};

export default Canvas; 