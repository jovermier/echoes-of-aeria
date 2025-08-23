// HUD Component - Authentic ALTTP-style health, currency, and game status display
// Following UI/UX Designer specifications with ALTTP aesthetics

import React, { useEffect, useRef } from 'react';
import { ALTTPGraphics } from '../utils/ALTTPGraphics.js';

interface HUDProps {
  health: number;
  maxHealth: number;
  hearts: number;
  gleam: number;
  aetherShards: number;
  fps?: number;
  memoryUsage?: number;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  hearts,
  gleam,
  aetherShards,
  fps,
  memoryUsage
}) => {
  const heartsContainerRef = useRef<HTMLDivElement>(null);
  const rupeeIconRef = useRef<HTMLDivElement>(null);

  // ALTTP Heart Component
  const ALTTPHeart: React.FC<{ type: 'full' | 'half' | 'empty' }> = ({ type }) => {
    const heartRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (heartRef.current) {
        const heartCanvas = ALTTPGraphics.generateHeart(type);
        heartRef.current.innerHTML = '';
        heartRef.current.appendChild(heartCanvas);
      }
    }, [type]);

    return <div ref={heartRef} className={`alttp-heart ${type}`}></div>;
  };

  // ALTTP Minimap Component
  const ALTTPMinimap: React.FC = () => {
    const minimapRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (minimapRef.current) {
        const frameCanvas = ALTTPGraphics.generateMinimapFrame(128);
        minimapRef.current.appendChild(frameCanvas);
      }
    }, []);

    return (
      <div className="alttp-minimap-frame" ref={minimapRef}>
        <canvas width="122" height="122" style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          imageRendering: 'pixelated'
        }}></canvas>
      </div>
    );
  };
  
  // Generate ALTTP-style graphics on mount
  useEffect(() => {
    if (rupeeIconRef.current) {
      const rupeeCanvas = ALTTPGraphics.generateRupee('green');
      rupeeIconRef.current.appendChild(rupeeCanvas);
    }
  }, []);

  const renderHearts = () => {
    const heartElements = [];
    
    for (let i = 0; i < hearts; i++) {
      const heartValue = i * 2; // Each heart represents 2 health points
      let heartState: 'full' | 'half' | 'empty';
      
      if (health > heartValue + 1) {
        heartState = 'full';
      } else if (health > heartValue) {
        heartState = 'half';
      } else {
        heartState = 'empty';
      }
      
      heartElements.push(
        <ALTTPHeart key={i} type={heartState} />
      );
    }
    
    return heartElements;
  };

  return (
    <div className="alttp-hud">
      {/* Top Left - Health (ALTTP Style) */}
      <div className="alttp-hud-section alttp-hud-top-left">
        <div className="alttp-hearts-container" ref={heartsContainerRef}>
          {renderHearts()}
        </div>
      </div>
      
      {/* Top Center - Item Display */}
      <div className="alttp-hud-section alttp-hud-top-center">
        <div className="alttp-item-display">
          <div className="alttp-selected-item">
            <div className="alttp-item-slot-display"></div>
          </div>
        </div>
      </div>
      
      {/* Top Right - Currency Counter (ALTTP Style) */}
      <div className="alttp-hud-section alttp-hud-top-right">
        <div className="alttp-currency-panel">
          <div className="alttp-rupee-counter">
            <div className="alttp-rupee-icon" ref={rupeeIconRef}></div>
            <div className="alttp-counter-display">
              <span className="alttp-currency-text">{gleam.toString().padStart(3, '0')}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Right - Minimap Frame */}
      <div className="alttp-hud-section alttp-hud-bottom-right">
        <ALTTPMinimap />
      </div>
      
      {/* Bottom Left - Debug Info (if enabled) */}
      {(fps !== undefined || memoryUsage !== undefined) && (
        <div className="alttp-hud-section alttp-hud-bottom-left">
          <div className="alttp-debug-panel">
            {fps !== undefined && <div className="alttp-debug-text">FPS: {fps}</div>}
            {memoryUsage !== undefined && memoryUsage > 0 && (
              <div className="alttp-debug-text">Memory: {memoryUsage}MB</div>
            )}
          </div>
        </div>
      )}
      
      {/* Aether Shards Progress (ALTTP Style) */}
      <div className="alttp-hud-section alttp-hud-bottom-center">
        <div className="alttp-progress-display">
          <div className="alttp-shard-counter">
            <span className="alttp-progress-icon">◆</span>
            <span className="alttp-progress-text">{aetherShards}/8</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .alttp-hud {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 12px;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        
        .alttp-hud-section {
          position: absolute;
        }
        
        .alttp-hud-top-left {
          top: 16px;
          left: 16px;
        }
        
        .alttp-hud-top-center {
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .alttp-hud-top-right {
          top: 16px;
          right: 16px;
        }
        
        .alttp-hud-bottom-left {
          bottom: 16px;
          left: 16px;
        }
        
        .alttp-hud-bottom-center {
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .alttp-hud-bottom-right {
          bottom: 16px;
          right: 16px;
        }
        
        /* ALTTP Hearts Display */
        .alttp-hearts-container {
          display: flex;
          gap: 1px;
          align-items: center;
          padding: 8px;
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
        }
        
        .alttp-hearts-container::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 1px solid #4c4c4c;
          pointer-events: none;
        }
        
        .alttp-heart {
          width: 16px;
          height: 16px;
          position: relative;
          display: inline-block;
          image-rendering: pixelated;
        }
        
        .alttp-heart canvas {
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
        
        /* ALTTP Currency Panel */
        .alttp-currency-panel {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          padding: 8px;
          position: relative;
        }
        
        .alttp-currency-panel::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 1px solid #4c4c4c;
          pointer-events: none;
        }
        
        .alttp-rupee-counter {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .alttp-rupee-icon {
          width: 16px;
          height: 16px;
          position: relative;
        }
        
        .alttp-rupee-icon canvas {
          width: 100%;
          height: 100%;
          image-rendering: pixelated;
        }
        
        .alttp-currency-text {
          color: #F8F800;
          text-shadow: 1px 1px 0 #000000;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          min-width: 36px;
          text-align: right;
          font-weight: bold;
        }
        
        /* ALTTP Item Display */
        .alttp-item-display {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          padding: 4px;
        }
        
        .alttp-item-slot-display {
          width: 32px;
          height: 32px;
          background: #3c3c3c;
          border: 2px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #9c9c9c;
          border-bottom-color: #9c9c9c;
        }
        
        /* ALTTP Debug Panel */
        .alttp-debug-panel {
          background: #101820;
          border: 1px solid #4c4c4c;
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .alttp-debug-text {
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
          font-size: 10px;
          font-family: 'Courier New', monospace;
        }
        
        /* ALTTP Progress Display */
        .alttp-progress-display {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          padding: 6px 8px;
          position: relative;
        }
        
        .alttp-shard-counter {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .alttp-progress-icon {
          color: #00d8f8;
          text-shadow: 1px 1px 0 #000000;
          font-size: 12px;
        }
        
        .alttp-progress-text {
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
          font-size: 11px;
          font-family: 'Courier New', monospace;
        }
        
        /* ALTTP Minimap */
        .alttp-minimap-frame {
          width: 128px;
          height: 128px;
          background: #101820;
          border: 3px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #9c9c9c;
          border-bottom-color: #9c9c9c;
          position: relative;
        }
        
        .alttp-minimap-frame::before {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          bottom: 1px;
          border: 1px solid #4c4c4c;
        }
        
        /* ALTTP Animations */
        @keyframes alttp-heart-beat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .alttp-heart.full {
          animation: alttp-heart-beat 2s ease-in-out infinite;
        }
        
        @keyframes alttp-rupee-collect {
          0% { 
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.2) rotate(180deg);
            filter: brightness(1.4);
          }
          100% { 
            transform: scale(1) rotate(360deg);
            filter: brightness(1);
          }
        }
        
        .alttp-rupee-counter.animate {
          animation: alttp-rupee-collect 0.6s ease-out;
        }
        
        @keyframes alttp-progress-pulse {
          0%, 100% { 
            color: #00d8f8;
            text-shadow: 1px 1px 0 #000000;
          }
          50% { 
            color: #40e8ff;
            text-shadow: 0 0 4px #00d8f8, 1px 1px 0 #000000;
          }
        }
        
        .alttp-progress-icon {
          animation: alttp-progress-pulse 2s ease-in-out infinite;
        }
        
        /* ALTTP Responsive adjustments */
        @media (max-width: 768px) {
          .alttp-hud {
            font-size: 10px;
          }
          
          .alttp-hearts-container,
          .alttp-currency-panel,
          .alttp-item-display,
          .alttp-progress-display {
            padding: 6px;
          }
          
          .alttp-heart {
            width: 14px;
            height: 14px;
          }
          
          .alttp-rupee-icon {
            width: 14px;
            height: 14px;
          }
          
          .alttp-item-slot-display {
            width: 28px;
            height: 28px;
          }
          
          .alttp-minimap-frame {
            width: 96px;
            height: 96px;
          }
          
          .alttp-currency-text,
          .alttp-progress-text {
            font-size: 10px;
          }
        }
        
        /* ALTTP Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .alttp-heart.full,
          .alttp-rupee-counter.animate,
          .alttp-progress-icon {
            animation: none;
          }
        }
        
        @media (prefers-contrast: high) {
          .alttp-hearts-container,
          .alttp-currency-panel,
          .alttp-item-display,
          .alttp-progress-display {
            border-width: 3px;
          }
          
          .alttp-currency-text,
          .alttp-progress-text,
          .alttp-debug-text {
            color: #ffffff;
            text-shadow: 2px 2px 0 #000000;
          }
        }
      `}</style>
    </div>
  );
};