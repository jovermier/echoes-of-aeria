// Inventory Modal Component - Authentic ALTTP-style item management interface
// Following UI/UX Designer specifications with ALTTP aesthetics

import React, { useEffect, useRef } from 'react';
import type { PlayerInventory } from '@shared/types.js';
import { ALTTPGraphics } from '../utils/ALTTPGraphics.js';

interface InventoryModalProps {
  inventory: PlayerInventory;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  onClose
}) => {
  // ALTTP Item Slot Component
  const ALTTPItemSlot: React.FC<{
    hasItem: boolean;
    itemName: string;
    description: string;
    index: number;
  }> = ({ hasItem, itemName, description, index }) => {
    const slotRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (slotRef.current) {
        const slotCanvas = ALTTPGraphics.generateItemSlot(40, hasItem, false);
        slotRef.current.style.backgroundImage = `url(${ALTTPGraphics.canvasToDataURL(slotCanvas)})`;
      }
    }, [hasItem]);

    return (
      <div 
        className={`alttp-item-slot ${hasItem ? 'obtained' : 'missing'}`}
        ref={slotRef}
        title={description}
      >
        <div className="alttp-item-icon">
          {hasItem ? '✓' : '?'}
        </div>
        <div className="alttp-item-tooltip">
          {itemName}
        </div>
      </div>
    );
  };

  // ALTTP Collectible Component
  const ALTTPCollectible: React.FC<{
    icon: string;
    name: string;
    count: string;
    color: string;
  }> = ({ icon, name, count, color }) => {
    return (
      <div className="alttp-collectible">
        <div className="alttp-collectible-icon" style={{ color }}>
          {icon}
        </div>
        <div className="alttp-collectible-name">
          {name}
        </div>
        <div className="alttp-collectible-count">
          {count}
        </div>
      </div>
    );
  };

  // ALTTP Key Item Component
  const ALTTPKeyItem: React.FC<{
    keyType: string;
    count: number;
  }> = ({ keyType, count }) => {
    return (
      <div className="alttp-key-item">
        <div className="alttp-key-icon">🗝️</div>
        <div className="alttp-key-name">{keyType}</div>
        <div className="alttp-key-count">×{count}</div>
      </div>
    );
  };
  const progressionItems = [
    { key: 'sunflame_lantern', name: 'Sunflame Lantern', description: 'Lights the way in dark places' },
    { key: 'gale_boots', name: 'Gale Boots', description: 'Swift movement across terrain' },
    { key: 'riverfin_vest', name: 'Riverfin Vest', description: 'Enables underwater breathing' },
    { key: 'aether_mirror', name: 'Aether Mirror', description: 'Switch between realms' },
    { key: 'storm_disk', name: 'Storm Disk', description: 'Harness the power of lightning' },
    { key: 'quake_maul', name: 'Quake Maul', description: 'Shatter stone and barriers' },
    { key: 'tide_hook', name: 'Tide Hook', description: 'Grapple across vast distances' },
    { key: 'sunflame_prism', name: 'Sunflame Prism', description: 'Channel solar energy' },
    { key: 'kingsbane_sigil', name: 'Kingsbane Sigil', description: 'The final key to victory' }
  ] as const;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' || event.key === 'i' || event.key === 'I') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div 
      className="alttp-inventory-modal"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="alttp-modal-backdrop" onClick={onClose} />
      
      <div className="alttp-inventory-content">
        <div className="alttp-inventory-header">
          <h2 className="alttp-inventory-title">INVENTORY</h2>
          <button className="alttp-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="alttp-inventory-body">
          {/* Progression Items */}
          <div className="alttp-inventory-section">
            <h3 className="alttp-section-title">EQUIPMENT</h3>
            <div className="alttp-items-grid">
              {progressionItems.map((item, index) => {
                const hasItem = inventory[item.key as keyof PlayerInventory] as boolean;
                return (
                  <ALTTPItemSlot
                    key={item.key}
                    hasItem={hasItem}
                    itemName={hasItem ? item.name : '???'}
                    description={item.description}
                    index={index}
                  />
                );
              })}
            </div>
          </div>
          
          {/* Collectibles */}
          <div className="alttp-inventory-section">
            <h3 className="alttp-section-title">COLLECTIBLES</h3>
            <div className="alttp-collectibles-panel">
              <div className="alttp-collectible-row">
                <ALTTPCollectible
                  icon="◆"
                  name="AETHER SHARDS"
                  count={`${inventory.aether_shards}/8`}
                  color="#00d8f8"
                />
              </div>
              
              <div className="alttp-collectible-row">
                <ALTTPCollectible
                  icon="♥"
                  name="HEART PIECES"
                  count={`${inventory.heart_pieces}/4`}
                  color="#f83800"
                />
              </div>
              
              <div className="alttp-collectible-row">
                <ALTTPCollectible
                  icon="📜"
                  name="RUMOR CARDS"
                  count={inventory.rumor_cards.toString()}
                  color="#f8d800"
                />
              </div>
            </div>
          </div>
          
          {/* Keys */}
          {Object.keys(inventory.keys).length > 0 && (
            <div className="alttp-inventory-section">
              <h3 className="alttp-section-title">KEYS</h3>
              <div className="alttp-keys-panel">
                {Object.entries(inventory.keys).map(([keyType, count]) => (
                  <ALTTPKeyItem
                    key={keyType}
                    keyType={keyType}
                    count={count}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="alttp-inventory-footer">
          <div className="alttp-controls-text">
            ESC OR I TO CLOSE
          </div>
        </div>
      </div>
      
      <style>{`
        .alttp-inventory-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 200;
          display: flex;
          justify-content: center;
          align-items: center;
          outline: none;
          font-family: 'Courier New', 'Monaco', monospace;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          -webkit-font-smoothing: none;
          font-smooth: never;
        }
        
        .alttp-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          cursor: pointer;
        }
        
        .alttp-inventory-content {
          position: relative;
          width: 90%;
          max-width: 640px;
          max-height: 85%;
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 50%, #3c3c3c 100%);
          border: 4px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          overflow: hidden;
          box-shadow: 
            0 0 0 2px #4c4c4c,
            4px 4px 12px rgba(0, 0, 0, 0.8);
        }
        
        .alttp-inventory-content::before {
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
        
        .alttp-inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          border-bottom: 2px solid #1c1c1c;
          position: relative;
          z-index: 1;
        }
        
        .alttp-inventory-title {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-family: 'Courier New', monospace;
          text-shadow: 2px 2px 0 #000000;
          letter-spacing: 2px;
        }
        
        .alttp-close-button {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 100%);
          border: 2px solid;
          border-top-color: #9c9c9c;
          border-left-color: #9c9c9c;
          border-right-color: #1c1c1c;
          border-bottom-color: #1c1c1c;
          color: #ffffff;
          font-size: 16px;
          cursor: pointer;
          padding: 4px 8px;
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-close-button:hover {
          background: linear-gradient(135deg, #9c9c9c 0%, #6c6c6c 100%);
        }
        
        .alttp-close-button:active {
          background: linear-gradient(135deg, #5c5c5c 0%, #3c3c3c 100%);
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #9c9c9c;
          border-bottom-color: #9c9c9c;
          transform: translate(1px, 1px);
        }
        
        .alttp-inventory-body {
          padding: 20px 24px;
          max-height: 450px;
          overflow-y: auto;
          background: #3c3c3c;
          position: relative;
        }
        
        .alttp-inventory-section {
          margin-bottom: 20px;
        }
        
        .alttp-section-title {
          margin: 0 0 12px 0;
          color: #ffffff;
          font-size: 14px;
          font-family: 'Courier New', monospace;
          text-shadow: 1px 1px 0 #000000;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          padding: 8px 12px;
          border: 2px solid;
          border-top-color: #8c8c8c;
          border-left-color: #8c8c8c;
          border-right-color: #2c2c2c;
          border-bottom-color: #2c2c2c;
        }
        
        .alttp-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
          gap: 8px;
          padding: 12px;
          background: #2c2c2c;
          border: 2px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #4c4c4c;
          border-bottom-color: #4c4c4c;
        }
        
        .alttp-item-slot {
          width: 40px;
          height: 40px;
          background: #3c3c3c;
          border: 2px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #5c5c5c;
          border-bottom-color: #5c5c5c;
          position: relative;
          cursor: pointer;
        }
        
        .alttp-item-slot.obtained {
          background: #5c5c5c;
        }
        
        .alttp-item-slot.obtained::before {
          content: '';
          position: absolute;
          top: 1px;
          left: 1px;
          right: 1px;
          bottom: 1px;
          border: 1px solid #6c6c6c;
        }
        
        .alttp-item-slot:hover {
          background: #f8f800;
        }
        
        .alttp-item-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 16px;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-item-slot.missing .alttp-item-icon {
          color: #6c6c6c;
        }
        
        .alttp-item-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: #000000;
          color: #ffffff;
          padding: 4px 8px;
          font-size: 10px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        
        .alttp-item-slot:hover .alttp-item-tooltip {
          opacity: 1;
        }
        
        .alttp-collectibles-panel {
          background: #2c2c2c;
          border: 2px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #4c4c4c;
          border-bottom-color: #4c4c4c;
          padding: 12px;
        }
        
        .alttp-collectible-row {
          margin-bottom: 8px;
        }
        
        .alttp-collectible {
          display: flex;
          align-items: center;
          padding: 8px;
          background: #3c3c3c;
          border: 1px solid #4c4c4c;
        }
        
        .alttp-collectible-icon {
          width: 20px;
          text-align: center;
          margin-right: 12px;
          font-size: 14px;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-collectible-name {
          flex: 1;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-collectible-count {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000;
          min-width: 32px;
          text-align: right;
        }
        
        .alttp-keys-panel {
          background: #2c2c2c;
          border: 2px solid;
          border-top-color: #1c1c1c;
          border-left-color: #1c1c1c;
          border-right-color: #4c4c4c;
          border-bottom-color: #4c4c4c;
          padding: 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .alttp-key-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          background: #3c3c3c;
          border: 1px solid #f8d800;
          min-width: 120px;
        }
        
        .alttp-key-icon {
          margin-right: 8px;
          font-size: 12px;
          color: #f8d800;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-key-name {
          flex: 1;
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          text-transform: uppercase;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-key-count {
          color: #f8d800;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          font-weight: bold;
          text-shadow: 1px 1px 0 #000000;
        }
        
        .alttp-inventory-footer {
          padding: 12px 24px;
          background: linear-gradient(135deg, #6c6c6c 0%, #4c4c4c 100%);
          border-top: 2px solid #1c1c1c;
          text-align: center;
        }
        
        .alttp-controls-text {
          color: #ffffff;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          text-shadow: 1px 1px 0 #000000;
          letter-spacing: 1px;
        }
        
        /* ALTTP Scrollbar styling */
        .alttp-inventory-body::-webkit-scrollbar {
          width: 12px;
        }
        
        .alttp-inventory-body::-webkit-scrollbar-track {
          background: #1c1c1c;
          border: 1px solid #4c4c4c;
        }
        
        .alttp-inventory-body::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8c8c8c 0%, #5c5c5c 100%);
          border: 1px solid #1c1c1c;
        }
        
        .alttp-inventory-body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #9c9c9c 0%, #6c6c6c 100%);
        }
        
        /* ALTTP Responsive design */
        @media (max-width: 768px) {
          .alttp-inventory-content {
            width: 95%;
            max-height: 90%;
          }
          
          .alttp-items-grid {
            grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
            gap: 6px;
          }
          
          .alttp-item-slot {
            width: 36px;
            height: 36px;
          }
          
          .alttp-item-icon {
            font-size: 14px;
          }
          
          .alttp-inventory-title {
            font-size: 16px;
            letter-spacing: 1px;
          }
          
          .alttp-section-title {
            font-size: 12px;
            padding: 6px 8px;
          }
          
          .alttp-collectible-name,
          .alttp-collectible-count {
            font-size: 10px;
          }
        }
        
        /* ALTTP Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .alttp-item-tooltip {
            transition: none;
          }
        }
        
        @media (prefers-contrast: high) {
          .alttp-inventory-content {
            border-width: 6px;
          }
          
          .alttp-inventory-title,
          .alttp-section-title,
          .alttp-collectible-name,
          .alttp-key-name {
            text-shadow: 2px 2px 0 #000000;
          }
        }
      `}</style>
    </div>
  );
};