// Dialogue Box Component - Authentic ALTTP-style NPC conversation interface
// Following UI/UX Designer specifications with ALTTP aesthetics

import React, { useEffect, useState, useRef } from 'react';
import { ALTTPGraphics } from '../utils/ALTTPGraphics.js';

interface DialogueBoxProps {
  text: string;
  speaker?: string | undefined;
  onAdvance: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  text,
  speaker,
  onAdvance
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [, setCurrentIndex] = useState(0);

  // Text typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
    
    if (!text) return;

    const typewriterSpeed = 30; // milliseconds per character
    let timeoutId: NodeJS.Timeout;

    const typeCharacter = (index: number) => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        setCurrentIndex(index + 1);
        
        timeoutId = setTimeout(() => typeCharacter(index + 1), typewriterSpeed);
      } else {
        setIsComplete(true);
      }
    };

    timeoutId = setTimeout(() => typeCharacter(0), 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [text]);

  // Handle input for advancing dialogue
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        
        if (!isComplete) {
          // Skip typewriter effect and show full text
          setDisplayedText(text);
          setIsComplete(true);
        } else {
          // Advance to next dialogue or close
          onAdvance();
        }
      }
    };

    const handleClick = () => {
      if (!isComplete) {
        setDisplayedText(text);
        setIsComplete(true);
      } else {
        onAdvance();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClick);
    };
  }, [isComplete, text, onAdvance]);

  if (!text) return null;

  return (
    <div className="alttp-dialogue-box">
      <div className="alttp-dialogue-content">
        {speaker && (
          <div className="alttp-speaker-panel">
            <div className="alttp-speaker-name">
              {speaker.toUpperCase()}
            </div>
          </div>
        )}
        
        <div className="alttp-text-panel">
          <div className="alttp-dialogue-text">
            {displayedText}
            {!isComplete && (
              <span className="alttp-cursor">_</span>
            )}
          </div>
          
          <div className="alttp-dialogue-controls">
            {isComplete ? (
              <div className="alttp-continue-arrow">▼</div>
            ) : (
              <div className="alttp-skip-text">SPACE TO SKIP</div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .alttp-dialogue-box {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 640px;
          z-index: 150;
          font-family: 'Courier New', 'Monaco', monospace;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        
        .alttp-dialogue-content {
          background: #101820;
          border: 4px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          box-shadow: 
            0 0 0 2px #4c4c4c,
            4px 4px 12px rgba(0, 0, 0, 0.8);
          position: relative;
        }
        
        .alttp-dialogue-content::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border: 2px solid;
          border-top-color: #6c6c6c;
          border-left-color: #6c6c6c;
          border-right-color: #000000;
          border-bottom-color: #000000;
          pointer-events: none;
        }
        
        .alttp-speaker-panel {
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          border-bottom: 2px solid #1c1c1c;
          padding: 8px 16px;
          margin: -2px -2px 0 -2px;
          position: relative;
          z-index: 1;
        }
        
        .alttp-speaker-name {
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: bold;
          text-shadow: 1px 1px 0 #000000;
          letter-spacing: 1px;
        }
        
        .alttp-text-panel {
          padding: 16px 20px;
          position: relative;
          z-index: 1;
        }
        
        .alttp-dialogue-text {
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 12px;
          min-height: 52px;
          text-shadow: 1px 1px 0 #000000;
          word-wrap: break-word;
        }
        
        .alttp-cursor {
          display: inline-block;
          animation: alttp-blink 1s infinite;
          margin-left: 2px;
          color: #ffffff;
          background: #ffffff;
          width: 8px;
          height: 2px;
          vertical-align: baseline;
        }
        
        @keyframes alttp-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .alttp-dialogue-controls {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          position: absolute;
          bottom: 8px;
          right: 12px;
        }
        
        .alttp-continue-arrow {
          font-size: 12px;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
          animation: alttp-arrow-bounce 1.5s ease-in-out infinite;
        }
        
        .alttp-skip-text {
          font-size: 9px;
          color: #cccccc;
          text-shadow: 1px 1px 0 #000000;
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
          opacity: 0.8;
        }
        
        @keyframes alttp-arrow-bounce {
          0%, 100% { 
            transform: translateY(0);
            opacity: 1;
          }
          50% { 
            transform: translateY(2px);
            opacity: 0.7;
          }
        }
        
        /* ALTTP Responsive design */
        @media (max-width: 768px) {
          .alttp-dialogue-box {
            bottom: 16px;
            width: 95%;
          }
          
          .alttp-text-panel {
            padding: 12px 16px;
          }
          
          .alttp-speaker-panel {
            padding: 6px 12px;
          }
          
          .alttp-speaker-name {
            font-size: 11px;
          }
          
          .alttp-dialogue-text {
            font-size: 12px;
            min-height: 44px;
            margin-bottom: 10px;
          }
          
          .alttp-continue-arrow {
            font-size: 11px;
          }
          
          .alttp-skip-text {
            font-size: 8px;
          }
        }
        
        /* ALTTP Mobile landscape adjustments */
        @media (max-height: 500px) {
          .alttp-dialogue-box {
            bottom: 8px;
          }
          
          .alttp-text-panel {
            padding: 8px 12px;
          }
          
          .alttp-dialogue-text {
            min-height: 36px;
            margin-bottom: 8px;
          }
          
          .alttp-speaker-panel {
            padding: 4px 8px;
          }
        }
        
        /* ALTTP Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          .alttp-cursor,
          .alttp-continue-arrow {
            animation: none;
          }
          
          .alttp-cursor {
            opacity: 1;
          }
        }
        
        /* ALTTP High contrast mode support */
        @media (prefers-contrast: high) {
          .alttp-dialogue-content {
            border-width: 6px;
            background: #000000;
          }
          
          .alttp-dialogue-text,
          .alttp-speaker-name {
            color: #ffffff;
            text-shadow: 2px 2px 0 #000000;
          }
          
          .alttp-speaker-panel {
            background: #333333;
          }
        }
        
        /* ALTTP Text effects */
        .alttp-dialogue-text em {
          color: #f8f800;
          font-style: normal;
          text-shadow: 1px 1px 0 #000000, 0 0 2px #f8f800;
        }
        
        .alttp-dialogue-text strong {
          color: #ff6040;
          font-weight: normal;
          text-shadow: 1px 1px 0 #000000;
        }
      `}</style>
    </div>
  );
};