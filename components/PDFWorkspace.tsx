import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../store';
import { renderPageOnCanvas, getPageDimensions } from '../services/pdfService';
import { formatFolio } from '../utils/folioUtils';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';

export const PDFWorkspace: React.FC = () => {
  const { 
    pages, 
    activePageIndex, 
    pdfFileMap, 
    settings, 
    setActivePage,
    setPageScale,
    rotatePage
  } = useStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mutex to serialize render operations
  const renderMutex = useRef<Promise<void>>(Promise.resolve());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dimensions of the actual canvas element (high res)
  const [renderedDimensions, setRenderedDimensions] = useState({ w: 0, h: 0 });
  
  // The scale that was last used to draw on the canvas
  const [canvasRenderScale, setCanvasRenderScale] = useState(1);
  
  // The user's target scale (UI)
  const [targetScale, setTargetScale] = useState(1);

  const activePage = pages[activePageIndex];

  // Sync internal targetScale with store scale (handling 'auto' as a numeric value locally for smooth zoom)
  useEffect(() => {
    if (activePage?.scale) {
      setTargetScale(activePage.scale);
    }
  }, [activePage?.scale]);

  // Main Render Effect - Debounced for zoom, Immediate for page changes
  useEffect(() => {
    const abortController = new AbortController();
    
    if (!activePage || !pdfFileMap[activePage.sourceFileId]) return;

    // We use a timer to debounce the expensive render operation during zooming
    const renderTimeoutId = setTimeout(async () => {
      
      const performRender = async () => {
        // Serialization: Wait for previous
        const previousOperation = renderMutex.current;
        
        renderMutex.current = (async () => {
          try { await previousOperation; } catch {}
          if (abortController.signal.aborted) return;

          setLoading(true);
          setError(null);

          if (canvasRef.current && containerRef.current) {
            try {
              const fileData = pdfFileMap[activePage.sourceFileId];
              
              // Calculate effective scale
              let scaleToRender = activePage.scale;

              // Auto-scale calculation
              if (scaleToRender === undefined) {
                 const pageDims = await getPageDimensions(fileData, activePage.originalIndex, activePage.rotation);
                 if (abortController.signal.aborted) return;

                 const containerW = containerRef.current.clientWidth - 80;
                 const containerH = containerRef.current.clientHeight - 80;

                 if (pageDims.width > 0 && pageDims.height > 0) {
                     const scaleW = containerW / pageDims.width;
                     const scaleH = containerH / pageDims.height;
                     scaleToRender = Math.min(scaleW, scaleH);
                     scaleToRender = Math.min(Math.max(scaleToRender, 0.2), 2.0);
                 } else {
                   scaleToRender = 1.0; 
                 }
                 
                 // Update local target scale if it was auto
                 setTargetScale(scaleToRender);
              }

              if (abortController.signal.aborted) return;
              
              // RENDER CALL
              await renderPageOnCanvas(
                 fileData, 
                 activePage.originalIndex, 
                 canvasRef.current, 
                 scaleToRender,
                 activePage.rotation,
                 abortController.signal
              );

              if (!abortController.signal.aborted) {
                // Update the state to reflect what is currently on the canvas
                setRenderedDimensions({
                    w: canvasRef.current.width,
                    h: canvasRef.current.height
                });
                setCanvasRenderScale(scaleToRender);
              }

            } catch (err: any) {
              if (abortController.signal.aborted) return;
              console.error("Failed to render page:", err);
              let msg = "Error al visualizar.";
              if (err.message) msg += ` (${err.message})`;
              setError(msg);
            }
          }
          if (!abortController.signal.aborted) setLoading(false);
        })();
      };

      performRender();
    
    // If the difference between target and current render is small (< 10%), delay longer (user is scrubbing)
    // If it's a page change (different ID), render immediately (0ms)
    }, 300);

    // Initial render / Page switch should be faster/immediate if possible, but 
    // keeping it unified in debounce avoids race conditions. 
    // We can optimization: if renderedDimensions is 0 (first load), run immediately.
    if (renderedDimensions.w === 0) {
        // Immediate execution for first load
    }

    return () => {
      clearTimeout(renderTimeoutId);
      abortController.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageIndex, activePage?.rotation, activePage?.id, activePage?.scale, pdfFileMap]); 
  // Note: We depend on activePage.scale (store) which drives the debounced render.
  
  
  // --- UI HANDLERS ---

  const handleZoomIn = () => {
    if (!activePage) return;
    const newScale = Math.min(targetScale + 0.2, 4); // Increased step slightly
    setTargetScale(newScale); // Immediate UI update
    setPageScale(activePage.id, newScale); // Triggers store update -> effect -> debounce render
  };

  const handleZoomOut = () => {
    if (!activePage) return;
    const newScale = Math.max(targetScale - 0.2, 0.2);
    setTargetScale(newScale);
    setPageScale(activePage.id, newScale);
  };

  const handleFitToScreen = () => {
    if (!activePage) return;
    // Reset local first for feel
    setRenderedDimensions({ w: 0, h: 0 }); 
    setPageScale(activePage.id, undefined as any); 
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.002; // Adjusted sensitivity
      const newScale = Math.min(Math.max(targetScale + delta, 0.2), 4);
      setTargetScale(newScale);
      
      // We debounce the STORE update for wheel to avoid flooding Redux/Zustand with 60fps updates
      // Local state 'targetScale' handles the CSS transform visual
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
         if (activePage) setPageScale(activePage.id, newScale);
      }, 100);
    }
  };
  const wheelTimeout = useRef<any>(null);


  if (!activePage) {
    return (
      <div className="flex-1 bg-slate-100 flex items-center justify-center flex-col text-slate-400">
        <div className="w-24 h-24 border-4 border-slate-300 border-dashed rounded-xl mb-4 flex items-center justify-center bg-slate-50">
           <span className="text-4xl text-slate-300">+</span>
        </div>
        <p className="font-medium">Sube archivos PDF para comenzar</p>
      </div>
    );
  }

  // --- COMPUTE VISUALS ---

  // CSS Transform for instant zoom
  // If the canvas is rendered at scale 1.0, but target is 2.0, we scale(2) via CSS
  // This is hardware accelerated and instant.
  // When the debounced render finishes, canvasRenderScale becomes 2.0, so cssScale becomes 1.0 (sharp)
  const cssScale = canvasRenderScale > 0 ? targetScale / canvasRenderScale : 1;
  
  // Calculate Overlay
  const calculateOverlayStyle = () => {
    if (activePage.excluded) return { display: 'none' };
    
    const validPagesBefore = pages.slice(0, activePageIndex).filter(p => !p.excluded).length;
    const totalValid = pages.filter(p => !p.excluded).length;
    
    const text = formatFolio(validPagesBefore, totalValid, {
        startNumber: settings.startNumber,
        direction: settings.direction,
        type: settings.type,
        format: settings.format
    });

    // The font size must be relative to the *Canvas internal resolution*
    // Because the canvas is being scaled by CSS, the text drawn on top (DOM) needs to match.
    // Actually, since we are scaling the CONTAINER, the overlay scales with it automatically if using % or if inside.
    // However, our overlay logic currently uses absolute pixels based on settings * scale.
    
    // We base overlay calculations on the RENDERED scale (the coordinate system of the container div)
    // Then the CSS transform scales everything up together.
    
    const style: React.CSSProperties = {
      position: 'absolute',
      fontSize: `${settings.fontSize * canvasRenderScale}px`,
      fontFamily: settings.fontFamily,
      fontWeight: settings.bold ? 'bold' : 'normal',
      fontStyle: settings.italic ? 'italic' : 'normal',
      color: settings.color,
      opacity: settings.opacity,
      transform: `rotate(${settings.rotation}deg)`,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10
    };

    const marginX = settings.marginX * canvasRenderScale;
    const marginY = settings.marginY * canvasRenderScale;

    if (settings.position.includes('top')) style.top = marginY;
    if (settings.position.includes('bottom')) style.bottom = marginY;
    
    if (settings.position.includes('left')) style.left = marginX;
    if (settings.position.includes('right')) style.right = marginX;
    
    if (settings.position.includes('center')) {
        style.left = '50%';
        style.transform += ' translateX(-50%)';
    }

    return { text, style };
  };

  const overlay = calculateOverlayStyle();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/50 relative min-w-0">
      
      {/* Workspace Toolbar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-20">
         <div className="flex items-center gap-2">
            <button 
              onClick={() => setActivePage(Math.max(0, activePageIndex - 1))}
              disabled={activePageIndex === 0}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-slate-600 min-w-[80px] text-center">
               {activePageIndex + 1} / {pages.length}
            </span>
            <button 
              onClick={() => setActivePage(Math.min(pages.length - 1, activePageIndex + 1))}
              disabled={activePageIndex === pages.length - 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
         </div>

         <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            
            <button 
                onClick={handleFitToScreen} 
                className={`p-1.5 hover:bg-slate-100 rounded text-slate-600 ${activePage.scale === undefined ? 'bg-blue-50 text-blue-600' : ''}`} 
                title="Ajustar a pantalla"
            >
               <Maximize size={18} />
            </button>

            <button onClick={handleZoomOut} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Reducir">
               <ZoomOut size={18} />
            </button>
            
            <span className="text-xs font-mono w-10 text-center text-slate-500">
                {Math.round(targetScale * 100)}%
            </span>
            
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Ampliar">
               <ZoomIn size={18} />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            <button 
               onClick={() => rotatePage(activePage.id)} 
               className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition"
            >
               <RotateCw size={16} />
               Rotar
            </button>
         </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-10 relative"
        onWheel={handleWheel}
      >
        {/* The Wrapper handles the CSS Zoom (Instant) */}
        <div 
          className="relative shadow-xl transition-transform duration-75 ease-out bg-white origin-center" 
          style={{ 
             width: renderedDimensions.w, 
             height: renderedDimensions.h,
             transform: `scale(${cssScale})` 
          }}
        >
          {loading && renderedDimensions.w === 0 && (
            <div className="absolute inset-0 z-50 bg-white/90 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          )}
          
          {/* Subtle loading indicator when high-res is fetching but preview is visible */}
          {loading && renderedDimensions.w > 0 && (
             <div className="absolute top-2 right-2 z-50">
               <Loader2 className="animate-spin text-blue-600 opacity-50" size={20} />
             </div>
          )}

          {error && (
             <div className="absolute inset-0 z-40 bg-white flex flex-col items-center justify-center text-red-500 p-4 text-center">
               <AlertCircle size={40} className="mb-2" />
               <p className="max-w-md">{error}</p>
             </div>
          )}
          
          <canvas ref={canvasRef} className="block" />

          {/* Overlay */}
          {!activePage.excluded && !error && overlay && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  <div style={overlay.style}>
                      {overlay.text}
                  </div>
              </div>
          )}

          {activePage.excluded && !error && (
               <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[1px] z-20">
                   <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transform -rotate-12 border-2 border-white">
                       NO FOLIAR
                   </div>
               </div>
          )}
        </div>
      </div>
    </div>
  );
};