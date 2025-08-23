// Reusable ALTTP-style UI Components
// Authentic A Link to the Past interface elements for consistent styling

import React, { useEffect, useRef } from 'react';
import { ALTTPGraphics } from '../utils/ALTTPGraphics.js';

// =========================== //
// ALTTP Panel Component
// =========================== //
interface ALTTPPanelProps {
  children: React.ReactNode;
  inset?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ALTTPPanel: React.FC<ALTTPPanelProps> = ({ 
  children, 
  inset = false, 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`alttp-panel ${inset ? 'alttp-panel-inset' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// =========================== //
// ALTTP Button Component
// =========================== //
interface ALTTPButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ALTTPButton: React.FC<ALTTPButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false, 
  selected = false,
  className = '', 
  style = {} 
}) => {
  return (
    <button
      className={`alttp-button ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

// =========================== //
// ALTTP Heart Container Component
// =========================== //
interface ALTTPHeartProps {
  type: 'full' | 'half' | 'empty';
  className?: string;
  animate?: boolean;
}

export const ALTTPHeart: React.FC<ALTTPHeartProps> = ({ 
  type, 
  className = '', 
  animate = true 
}) => {
  const heartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (heartRef.current) {
      const heartCanvas = ALTTPGraphics.generateHeart(type);
      heartRef.current.innerHTML = '';
      heartRef.current.appendChild(heartCanvas);
    }
  }, [type]);

  return (
    <div 
      ref={heartRef} 
      className={`alttp-heart ${type} ${animate && type === 'full' ? 'animate' : ''} ${className}`}
    />
  );
};

// =========================== //
// ALTTP Hearts Display Component
// =========================== //
interface ALTTPHeartsDisplayProps {
  currentHealth: number;
  maxHearts: number;
  className?: string;
}

export const ALTTPHeartsDisplay: React.FC<ALTTPHeartsDisplayProps> = ({ 
  currentHealth, 
  maxHearts, 
  className = '' 
}) => {
  const renderHearts = () => {
    const hearts = [];
    
    for (let i = 0; i < maxHearts; i++) {
      const heartValue = i * 2; // Each heart = 2 health points
      let heartType: 'full' | 'half' | 'empty';
      
      if (currentHealth > heartValue + 1) {
        heartType = 'full';
      } else if (currentHealth > heartValue) {
        heartType = 'half';
      } else {
        heartType = 'empty';
      }
      
      hearts.push(
        <ALTTPHeart key={i} type={heartType} />
      );
    }
    
    return hearts;
  };

  return (
    <div className={`alttp-hearts-display ${className}`}>
      {renderHearts()}
    </div>
  );
};

// =========================== //
// ALTTP Currency Display Component
// =========================== //
interface ALTTPCurrencyDisplayProps {
  amount: number;
  type?: 'green' | 'blue' | 'red' | 'yellow';
  className?: string;
  animate?: boolean;
}

export const ALTTPCurrencyDisplay: React.FC<ALTTPCurrencyDisplayProps> = ({ 
  amount, 
  type = 'green', 
  className = '', 
  animate = false 
}) => {
  const iconRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (iconRef.current) {
      const rupeeCanvas = ALTTPGraphics.generateRupee(type);
      iconRef.current.innerHTML = '';
      iconRef.current.appendChild(rupeeCanvas);
    }
  }, [type]);

  return (
    <div className={`alttp-currency-display ${animate ? 'animate' : ''} ${className}`}>
      <div ref={iconRef} className="alttp-currency-icon" />
      <div className="alttp-currency-amount">
        {amount.toString().padStart(3, '0')}
      </div>
    </div>
  );
};

// =========================== //
// ALTTP Item Slot Component
// =========================== //
interface ALTTPItemSlotProps {
  hasItem?: boolean;
  selected?: boolean;
  size?: number;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ALTTPItemSlot: React.FC<ALTTPItemSlotProps> = ({ 
  hasItem = false, 
  selected = false, 
  size = 32, 
  children, 
  onClick, 
  className = '' 
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (slotRef.current) {
      const slotCanvas = ALTTPGraphics.generateItemSlot(size, hasItem, selected);
      slotRef.current.style.backgroundImage = `url(${ALTTPGraphics.canvasToDataURL(slotCanvas)})`;
      slotRef.current.style.width = `${size}px`;
      slotRef.current.style.height = `${size}px`;
    }
  }, [hasItem, selected, size]);

  return (
    <div 
      ref={slotRef}
      className={`alttp-item-slot ${hasItem ? 'has-item' : ''} ${selected ? 'selected' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </div>
  );
};

// =========================== //
// ALTTP Text Component
// =========================== //
interface ALTTPTextProps {
  children: React.ReactNode;
  size?: 'small' | 'normal' | 'large';
  color?: 'primary' | 'secondary' | 'highlight';
  className?: string;
  style?: React.CSSProperties;
}

export const ALTTPText: React.FC<ALTTPTextProps> = ({ 
  children, 
  size = 'normal', 
  color = 'primary', 
  className = '', 
  style = {} 
}) => {
  const sizeClass = size !== 'normal' ? `alttp-text-${size}` : '';
  const colorClass = color !== 'primary' ? `alttp-text-${color}` : '';
  
  return (
    <div 
      className={`alttp-text ${sizeClass} ${colorClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// =========================== //
// ALTTP Menu Cursor Component
// =========================== //
interface ALTTPMenuCursorProps {
  className?: string;
}

export const ALTTPMenuCursor: React.FC<ALTTPMenuCursorProps> = ({ className = '' }) => {
  return <div className={`alttp-cursor ${className}`} />;
};

// =========================== //
// ALTTP Progress Bar Component
// =========================== //
interface ALTTPProgressBarProps {
  current: number;
  max: number;
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const ALTTPProgressBar: React.FC<ALTTPProgressBarProps> = ({ 
  current, 
  max, 
  color = '#00d8f8', 
  width = 64, 
  height = 8, 
  className = '' 
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div 
      className={`alttp-progress-bar ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div 
        className="alttp-progress-fill"
        style={{ 
          width: `${percentage}%`, 
          backgroundColor: color 
        }}
      />
    </div>
  );
};

// =========================== //
// ALTTP Minimap Component
// =========================== //
interface ALTTPMinimapProps {
  size?: number;
  className?: string;
}

export const ALTTPMinimap: React.FC<ALTTPMinimapProps> = ({ 
  size = 128, 
  className = '' 
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (minimapRef.current) {
      const frameCanvas = ALTTPGraphics.generateMinimapFrame(size);
      minimapRef.current.appendChild(frameCanvas);
    }
  }, [size]);

  return (
    <div 
      ref={minimapRef} 
      className={`alttp-minimap ${className}`}
    >
      <canvas 
        width={size - 6} 
        height={size - 6}
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};

// =========================== //
// ALTTP Dialog Component
// =========================== //
interface ALTTPDialogProps {
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

export const ALTTPDialog: React.FC<ALTTPDialogProps> = ({ 
  title, 
  children, 
  onClose, 
  className = '', 
  width = 400, 
  height 
}) => {
  return (
    <div className={`alttp-dialog-overlay ${className}`}>
      <div className="alttp-dialog-backdrop" onClick={onClose} />
      <div 
        className="alttp-dialog-content"
        style={{ 
          width: `${width}px`, 
          ...(height && { height: `${height}px` }) 
        }}
      >
        {title && (
          <div className="alttp-dialog-header">
            <ALTTPText size="large" className="alttp-dialog-title">
              {title.toUpperCase()}
            </ALTTPText>
            {onClose && (
              <ALTTPButton onClick={onClose} className="alttp-dialog-close">
                ×
              </ALTTPButton>
            )}
          </div>
        )}
        <div className="alttp-dialog-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// =========================== //
// ALTTP Collectible Counter Component
// =========================== //
interface ALTTPCollectibleCounterProps {
  icon: string;
  name: string;
  current: number;
  max?: number;
  color?: string;
  className?: string;
}

export const ALTTPCollectibleCounter: React.FC<ALTTPCollectibleCounterProps> = ({ 
  icon, 
  name, 
  current, 
  max, 
  color = '#ffffff', 
  className = '' 
}) => {
  const displayText = max !== undefined ? `${current}/${max}` : current.toString();
  
  return (
    <div className={`alttp-collectible-counter ${className}`}>
      <div className="alttp-collectible-icon" style={{ color }}>
        {icon}
      </div>
      <div className="alttp-collectible-name">
        {name.toUpperCase()}
      </div>
      <div className="alttp-collectible-count">
        {displayText}
      </div>
    </div>
  );
};

// =========================== //
// Component Styles
// =========================== //
const ALTTPComponentsStyles = `
  /* Import base ALTTP styles */
  @import url('./alttp-ui.css');
  
  /* Hearts Display */
  .alttp-hearts-display {
    display: flex;
    gap: 1px;
    align-items: center;
  }
  
  /* Currency Display */
  .alttp-currency-display {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .alttp-currency-icon {
    width: 16px;
    height: 16px;
    image-rendering: pixelated;
  }
  
  .alttp-currency-icon canvas {
    width: 100%;
    height: 100%;
  }
  
  .alttp-currency-amount {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: var(--alttp-text-primary);
    text-shadow: 1px 1px 0 var(--alttp-text-shadow);
    min-width: 36px;
    text-align: right;
  }
  
  .alttp-currency-display.animate {
    animation: alttp-currency-collect 0.6s ease-out;
  }
  
  @keyframes alttp-currency-collect {
    0% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.2); filter: brightness(1.4); }
    100% { transform: scale(1); filter: brightness(1); }
  }
  
  /* Item Slot */
  .alttp-item-slot {
    position: relative;
    display: inline-block;
    image-rendering: pixelated;
    background-size: contain;
    background-repeat: no-repeat;
  }
  
  .alttp-item-slot.selected {
    animation: alttp-slot-pulse 1s ease-in-out infinite alternate;
  }
  
  @keyframes alttp-slot-pulse {
    0% { filter: brightness(1); }
    100% { filter: brightness(1.3); }
  }
  
  /* Progress Bar */
  .alttp-progress-bar {
    background: var(--alttp-magic-empty);
    border: 1px solid var(--alttp-border-dark);
    position: relative;
    overflow: hidden;
    image-rendering: pixelated;
  }
  
  .alttp-progress-fill {
    height: 100%;
    transition: width 0.3s ease;
    image-rendering: pixelated;
  }
  
  /* Minimap */
  .alttp-minimap {
    position: relative;
    display: inline-block;
  }
  
  /* Dialog */
  .alttp-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .alttp-dialog-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    cursor: pointer;
  }
  
  .alttp-dialog-content {
    position: relative;
    background: linear-gradient(135deg, var(--alttp-stone-light) 0%, var(--alttp-stone-medium) 50%, var(--alttp-stone-dark) 100%);
    border: 4px solid;
    border-top-color: var(--alttp-border-light);
    border-left-color: var(--alttp-border-light);
    border-right-color: var(--alttp-border-dark);
    border-bottom-color: var(--alttp-border-dark);
    box-shadow: 0 0 0 2px var(--alttp-border-medium), 4px 4px 12px rgba(0, 0, 0, 0.8);
  }
  
  .alttp-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--alttp-stone-medium) 0%, var(--alttp-stone-dark) 100%);
    border-bottom: 2px solid var(--alttp-border-dark);
  }
  
  .alttp-dialog-body {
    padding: 16px;
  }
  
  .alttp-dialog-close {
    font-size: 16px;
    padding: 2px 6px;
  }
  
  /* Collectible Counter */
  .alttp-collectible-counter {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background: var(--alttp-stone-dark);
    border: 1px solid var(--alttp-border-medium);
    gap: 6px;
  }
  
  .alttp-collectible-icon {
    width: 16px;
    text-align: center;
    font-size: 12px;
    text-shadow: 1px 1px 0 var(--alttp-text-shadow);
  }
  
  .alttp-collectible-name {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: var(--alttp-text-primary);
    text-shadow: 1px 1px 0 var(--alttp-text-shadow);
    letter-spacing: 1px;
  }
  
  .alttp-collectible-count {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: var(--alttp-text-primary);
    text-shadow: 1px 1px 0 var(--alttp-text-shadow);
    min-width: 24px;
    text-align: right;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .alttp-currency-icon {
      width: 14px;
      height: 14px;
    }
    
    .alttp-currency-amount {
      font-size: 10px;
      min-width: 32px;
    }
    
    .alttp-collectible-name,
    .alttp-collectible-count {
      font-size: 9px;
    }
    
    .alttp-dialog-content {
      width: 95% !important;
      max-width: none;
    }
  }
`;

// Inject styles when components are used
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = ALTTPComponentsStyles;
  document.head.appendChild(styleElement);
}