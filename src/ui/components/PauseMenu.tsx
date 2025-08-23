// Pause Menu Component - Authentic ALTTP-style game pause interface
// Following UI/UX Designer specifications with ALTTP aesthetics

import React, { useState, useEffect, useRef } from 'react';
import { ALTTPGraphics } from '../utils/ALTTPGraphics.js';

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onMainMenu
}) => {
  const [selectedOption, setSelectedOption] = useState(0);
  
  const menuOptions = [
    { label: 'Resume', action: onResume },
    { label: 'Save Game', action: () => console.log('Save game') },
    { label: 'Settings', action: () => console.log('Settings') },
    { label: 'Main Menu', action: onMainMenu }
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          event.preventDefault();
          setSelectedOption(prev => 
            prev === 0 ? menuOptions.length - 1 : prev - 1
          );
          break;
        
        case 'ArrowDown':
        case 'KeyS':
          event.preventDefault();
          setSelectedOption(prev => 
            prev === menuOptions.length - 1 ? 0 : prev + 1
          );
          break;
        
        case 'Enter':
        case 'Space':
          event.preventDefault();
          menuOptions[selectedOption].action();
          break;
        
        case 'Escape':
          event.preventDefault();
          onResume();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, menuOptions, onResume]);

  return (
    <div className="alttp-pause-menu">
      <div className="alttp-pause-backdrop" />
      
      <div className="alttp-pause-content">
        <div className="alttp-pause-header">
          <h1 className="alttp-pause-title">GAME PAUSED</h1>
          <div className="alttp-header-decoration" />
        </div>
        
        <div className="alttp-menu-options">
          {menuOptions.map((option, index) => (
            <div
              key={option.label}
              className={`alttp-menu-option ${index === selectedOption ? 'selected' : ''}`}
              onClick={option.action}
              onMouseEnter={() => setSelectedOption(index)}
            >
              <div className="alttp-option-cursor">
                {index === selectedOption && <div className="alttp-cursor-arrow" />}
              </div>
              <div className="alttp-option-text">
                {option.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="alttp-pause-footer">
          <div className="alttp-controls-panel">
            <div className="alttp-control-group">
              <span className="alttp-key-display">↑↓</span>
              <span className="alttp-action-text">NAVIGATE</span>
            </div>
            <div className="alttp-control-group">
              <span className="alttp-key-display">ENTER</span>
              <span className="alttp-action-text">SELECT</span>
            </div>
            <div className="alttp-control-group">
              <span className="alttp-key-display">ESC</span>
              <span className="alttp-action-text">RESUME</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .alttp-pause-menu {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 300;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Courier New', 'Monaco', monospace;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        
        .alttp-pause-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
        }
        
        .alttp-pause-content {
          position: relative;
          width: 420px;
          max-width: 90%;
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 4px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          box-shadow: 
            0 0 0 2px #4c4c4c,
            8px 8px 24px rgba(0, 0, 0, 0.8);
          overflow: hidden;
        }
        
        .alttp-pause-content::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 2px solid;
          border-top-color: #6c6c6c;
          border-left-color: #6c6c6c;
          border-right-color: #2c2c2c;
          border-bottom-color: #2c2c2c;
          pointer-events: none;
        }
        
        .alttp-pause-header {
          text-align: center;
          padding: 20px;
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          border-bottom: 2px solid #1c1c1c;
          position: relative;
          z-index: 1;
        }
        
        .alttp-pause-title {
          margin: 0;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 20px;
          text-shadow: 2px 2px 0 #000000;
          letter-spacing: 3px;
        }
        
        .alttp-header-decoration {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 2px;
          background: #ffffff;
          box-shadow: 0 1px 0 #000000;
        }
        
        .alttp-menu-options {
          padding: 24px;
          background: #3c3c3c;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          z-index: 1;
        }
        
        .alttp-menu-option {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: #4c4c4c;
          border: 2px solid;
          border-top-color: #6c6c6c;
          border-left-color: #6c6c6c;
          border-right-color: #2c2c2c;
          border-bottom-color: #2c2c2c;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          position: relative;
          margin-bottom: 2px;
        }
        
        .alttp-menu-option:hover,
        .alttp-menu-option.selected {
          background: #f8f800;
          color: #000000;
          text-shadow: none;
        }
        
        .alttp-option-cursor {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .alttp-cursor-arrow {
          width: 0;
          height: 0;
          border: 6px solid transparent;
          border-left: 8px solid currentColor;
          animation: alttp-cursor-pulse 1s ease-in-out infinite alternate;
        }
        
        @keyframes alttp-cursor-pulse {
          0% { opacity: 1; }
          100% { opacity: 0.6; }
        }
        
        .alttp-option-text {
          flex: 1;
          text-shadow: 1px 1px 0 #000000;
          letter-spacing: 1px;
        }
        
        .alttp-menu-option.selected .alttp-option-text {
          text-shadow: none;
        }
        
        .alttp-pause-footer {
          padding: 16px 20px;
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          border-top: 2px solid #1c1c1c;
          position: relative;
          z-index: 1;
        }
        
        .alttp-controls-panel {
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        .alttp-control-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        
        .alttp-key-display {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 100%);
          color: #ffffff;
          padding: 3px 6px;
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          font-size: 9px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0 #000000;
          min-width: 20px;
          text-align: center;
        }
        
        .alttp-action-text {
          font-size: 8px;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
          text-align: center;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        
        /* ALTTP Responsive design */
        @media (max-width: 480px) {
          .alttp-pause-content {
            width: 95%;
          }
          
          .alttp-pause-header {
            padding: 16px;
          }
          
          .alttp-pause-title {
            font-size: 18px;
            letter-spacing: 2px;
          }
          
          .alttp-menu-options {
            padding: 20px 16px;
            gap: 3px;
          }
          
          .alttp-menu-option {
            padding: 10px 12px;
            font-size: 13px;
          }
          
          .alttp-controls-panel {
            gap: 8px;
          }
          
          .alttp-control-group {
            gap: 1px;
          }
          
          .alttp-key-display {
            padding: 2px 4px;
            font-size: 8px;
            min-width: 18px;
          }
          
          .alttp-action-text {
            font-size: 7px;
          }
        }
        
        /* ALTTP High contrast mode */
        @media (prefers-contrast: high) {
          .alttp-pause-content {
            border-width: 6px;
            background: #ffffff;
          }
          
          .alttp-menu-option {
            background: #000000;
            color: #ffffff;
            border-color: #ffffff;
          }
          
          .alttp-menu-option:hover,
          .alttp-menu-option.selected {
            background: #ffffff;
            color: #000000;
          }
          
          .alttp-pause-title,
          .alttp-option-text,
          .alttp-action-text {
            text-shadow: none;
          }
        }
        
        /* ALTTP Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .alttp-cursor-arrow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};