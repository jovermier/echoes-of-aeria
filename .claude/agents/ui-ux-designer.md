---
name: "UI/UX Designer Agent"
description: "Specializes in user interface design, user experience optimization, and React integration for Echoes of Aeria's UI systems"
---

# UI/UX Designer Agent

## Purpose
Specializes in user interface design, user experience optimization, and React integration for Echoes of Aeria's UI systems.

## Expertise Areas
- **React UI Components**: HUD, inventory, menus, and dialog systems
- **Game UI/UX Design**: Player feedback, information hierarchy, accessibility
- **Animation & Transitions**: Smooth UI animations and state transitions
- **Mobile Responsiveness**: Adaptive layouts for different screen sizes
- **Accessibility**: Screen readers, keyboard navigation, color blindness support

## Key Responsibilities

### UI Architecture Design

#### React + Phaser Integration Pattern
```typescript
// Main app structure integrating React UI with Phaser game
interface GameUIProps {
  gameState: GameState;
  playerData: PlayerData;
  onGameAction: (action: GameAction) => void;
}

const GameUI: React.FC<GameUIProps> = ({ gameState, playerData, onGameAction }) => {
  return (
    <div className="game-container">
      <PhaserGameCanvas />
      {gameState === 'playing' && <HUDOverlay playerData={playerData} />}
      {gameState === 'inventory' && <InventoryScreen playerData={playerData} />}
      {gameState === 'dialogue' && <DialogueBox />}
      {gameState === 'paused' && <PauseMenu onAction={onGameAction} />}
      {gameState === 'menu' && <MainMenu onAction={onGameAction} />}
    </div>
  );
};
```

#### State Management with Zustand
```typescript
interface GameUIState {
  // UI State
  showHUD: boolean;
  inventoryOpen: boolean;
  dialogueActive: boolean;
  currentDialogue: DialogueData | null;
  notifications: NotificationData[];
  
  // Player State (synchronized with game)
  playerHealth: number;
  playerMaxHealth: number;
  currency: number;
  inventory: PlayerInventory;
  currentRegion: string;
  
  // Actions
  setGameState: (state: GameState) => void;
  openInventory: () => void;
  closeInventory: () => void;
  startDialogue: (dialogue: DialogueData) => void;
  endDialogue: () => void;
  addNotification: (notification: NotificationData) => void;
  updatePlayerData: (data: Partial<PlayerData>) => void;
}

const useGameUIStore = create<GameUIState>((set, get) => ({
  showHUD: true,
  inventoryOpen: false,
  dialogueActive: false,
  currentDialogue: null,
  notifications: [],
  
  setGameState: (state) => set({ gameState: state }),
  openInventory: () => set({ inventoryOpen: true }),
  closeInventory: () => set({ inventoryOpen: false }),
  startDialogue: (dialogue) => set({ 
    dialogueActive: true, 
    currentDialogue: dialogue 
  }),
  endDialogue: () => set({ 
    dialogueActive: false, 
    currentDialogue: null 
  }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, notification]
  })),
  updatePlayerData: (data) => set((state) => ({
    ...state,
    ...data
  }))
}));
```

### HUD Design System

#### Health Display Component
```typescript
interface HealthDisplayProps {
  currentHealth: number;
  maxHealth: number;
  className?: string;
}

const HealthDisplay: React.FC<HealthDisplayProps> = ({ 
  currentHealth, 
  maxHealth, 
  className 
}) => {
  const hearts = Math.ceil(maxHealth / 2); // Each heart = 2 HP
  
  return (
    <div className={`health-display ${className}`}>
      {Array.from({ length: hearts }, (_, index) => {
        const heartIndex = index * 2;
        const heartHealth = Math.max(0, Math.min(2, currentHealth - heartIndex));
        
        return (
          <HeartIcon
            key={index}
            fillLevel={heartHealth / 2} // 0, 0.5, or 1
            animated={heartHealth < 2 && heartIndex < currentHealth + 2}
          />
        );
      })}
    </div>
  );
};

const HeartIcon: React.FC<{ fillLevel: number; animated: boolean }> = ({ 
  fillLevel, 
  animated 
}) => {
  return (
    <div className={`heart-icon ${animated ? 'heart-pulse' : ''}`}>
      <svg viewBox="0 0 16 16" className="heart-outline">
        <path d="M8 2L7 1C5 0 2 1 2 4c0 2 2 4 6 8 4-4 6-6 6-8 0-3-3-4-5-3z" 
              fill="none" 
              stroke="#8B0000" 
              strokeWidth="1"/>
      </svg>
      {fillLevel > 0 && (
        <svg viewBox="0 0 16 16" className="heart-fill">
          <defs>
            <clipPath id={`heart-clip-${fillLevel}`}>
              <rect x="0" y="0" width={16 * fillLevel} height="16" />
            </clipPath>
          </defs>
          <path d="M8 2L7 1C5 0 2 1 2 4c0 2 2 4 6 8 4-4 6-6 6-8 0-3-3-4-5-3z"
                fill="#DC143C"
                clipPath={`url(#heart-clip-${fillLevel})`} />
        </svg>
      )}
    </div>
  );
};
```

#### HUD Layout Component
```typescript
const HUDOverlay: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
  const { notifications } = useGameUIStore();
  
  return (
    <div className="hud-overlay">
      {/* Top Left - Health and Status */}
      <div className="hud-top-left">
        <HealthDisplay 
          currentHealth={playerData.health} 
          maxHealth={playerData.maxHealth}
        />
        <CurrencyDisplay amount={playerData.currency} />
        <KeysDisplay count={playerData.keys} />
      </div>
      
      {/* Top Right - Current Region & Controls */}
      <div className="hud-top-right">
        <RegionDisplay regionName={playerData.currentRegion} />
        <ControlsHint />
      </div>
      
      {/* Bottom Left - Quick Items */}
      <div className="hud-bottom-left">
        <QuickItemSlots items={playerData.quickItems} />
      </div>
      
      {/* Bottom Right - Minimap */}
      <div className="hud-bottom-right">
        <Minimap 
          playerPosition={playerData.position}
          revealedAreas={playerData.revealedAreas}
        />
      </div>
      
      {/* Center - Notifications */}
      <NotificationCenter notifications={notifications} />
    </div>
  );
};
```

#### Currency & Items Display
```typescript
const CurrencyDisplay: React.FC<{ amount: number }> = ({ amount }) => {
  const [animatedAmount, setAnimatedAmount] = useState(amount);
  
  useEffect(() => {
    // Animate number changes
    const diff = amount - animatedAmount;
    if (diff !== 0) {
      const step = Math.sign(diff) * Math.max(1, Math.abs(diff) / 10);
      const timer = setInterval(() => {
        setAnimatedAmount(prev => {
          const next = prev + step;
          return Math.sign(diff) > 0 ? Math.min(next, amount) : Math.max(next, amount);
        });
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [amount, animatedAmount]);
  
  return (
    <div className="currency-display">
      <div className="rupee-icon">💎</div>
      <span className="currency-amount">{Math.floor(animatedAmount)}</span>
    </div>
  );
};

const KeysDisplay: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="keys-display">
      <div className="key-icon">🗝️</div>
      <span className="key-count">{count}</span>
    </div>
  );
};
```

### Inventory System UI

#### Main Inventory Screen
```typescript
interface InventoryScreenProps {
  playerData: PlayerData;
  onClose: () => void;
  onItemSelect: (item: InventoryItem) => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ 
  playerData, 
  onClose, 
  onItemSelect 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('tools');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  return (
    <div className="inventory-screen">
      <div className="inventory-header">
        <h2>Inventory</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="inventory-content">
        <CategoryTabs 
          categories={ITEM_CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        
        <ItemGrid 
          items={playerData.inventory[selectedCategory]}
          selectedItem={selectedItem}
          onItemSelect={setSelectedItem}
        />
        
        <ItemDetails 
          item={selectedItem}
          onUse={() => selectedItem && onItemSelect(selectedItem)}
        />
      </div>
      
      <div className="inventory-footer">
        <ProgressIndicator playerData={playerData} />
      </div>
    </div>
  );
};

const ItemGrid: React.FC<{
  items: InventoryItem[];
  selectedItem: InventoryItem | null;
  onItemSelect: (item: InventoryItem) => void;
}> = ({ items, selectedItem, onItemSelect }) => {
  return (
    <div className="item-grid">
      {items.map((item, index) => (
        <ItemSlot
          key={item.id}
          item={item}
          selected={selectedItem?.id === item.id}
          onClick={() => onItemSelect(item)}
          index={index}
        />
      ))}
    </div>
  );
};

const ItemSlot: React.FC<{
  item: InventoryItem;
  selected: boolean;
  onClick: () => void;
  index: number;
}> = ({ item, selected, onClick, index }) => {
  return (
    <motion.div
      className={`item-slot ${selected ? 'selected' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="item-icon">
        <img src={item.iconPath} alt={item.name} />
      </div>
      {item.stackable && item.count > 1 && (
        <span className="item-count">{item.count}</span>
      )}
      {item.equipped && <div className="equipped-indicator">E</div>}
    </motion.div>
  );
};
```

#### Progress Tracking Display
```typescript
const ProgressIndicator: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
  const aetherShardProgress = playerData.inventory.aether_shards;
  const heartPieceProgress = playerData.inventory.heart_pieces;
  
  return (
    <div className="progress-indicator">
      <div className="progress-item">
        <span>Aether Shards</span>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(aetherShardProgress / 8) * 100}%` }}
          />
        </div>
        <span>{aetherShardProgress}/8</span>
      </div>
      
      <div className="progress-item">
        <span>Heart Pieces</span>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(heartPieceProgress % 4) / 4 * 100}%` }}
          />
        </div>
        <span>{heartPieceProgress % 4}/4</span>
      </div>
    </div>
  );
};
```

### Dialogue System UI

#### Dialogue Box Component
```typescript
interface DialogueBoxProps {
  dialogue: DialogueData;
  onNext: () => void;
  onClose: () => void;
}

const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onNext, onClose }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const currentText = dialogue.messages[dialogue.currentIndex];
  
  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    const timer = setInterval(() => {
      setDisplayedText(prev => {
        if (prev.length >= currentText.length) {
          setIsComplete(true);
          clearInterval(timer);
          return prev;
        }
        return currentText.slice(0, prev.length + 1);
      });
    }, 50);
    
    return () => clearInterval(timer);
  }, [currentText]);
  
  const handleClick = () => {
    if (!isComplete) {
      // Skip typewriter effect
      setDisplayedText(currentText);
      setIsComplete(true);
    } else if (dialogue.currentIndex < dialogue.messages.length - 1) {
      onNext();
    } else {
      onClose();
    }
  };
  
  return (
    <motion.div 
      className="dialogue-box"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      onClick={handleClick}
    >
      <div className="dialogue-header">
        <div className="speaker-portrait">
          <img src={dialogue.speaker.portraitPath} alt={dialogue.speaker.name} />
        </div>
        <h3 className="speaker-name">{dialogue.speaker.name}</h3>
      </div>
      
      <div className="dialogue-content">
        <p className="dialogue-text">{displayedText}</p>
        {isComplete && (
          <div className="continue-indicator">
            {dialogue.currentIndex < dialogue.messages.length - 1 ? '▼' : '×'}
          </div>
        )}
      </div>
      
      {dialogue.choices && isComplete && (
        <div className="dialogue-choices">
          {dialogue.choices.map((choice, index) => (
            <button
              key={index}
              className="choice-button"
              onClick={(e) => {
                e.stopPropagation();
                dialogue.onChoice?.(index);
              }}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
};
```

### Notification System

#### Notification Center
```typescript
interface NotificationData {
  id: string;
  type: 'item' | 'achievement' | 'warning' | 'info';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  timestamp: number;
}

const NotificationCenter: React.FC<{ notifications: NotificationData[] }> = ({ 
  notifications 
}) => {
  return (
    <div className="notification-center">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: React.FC<{ notification: NotificationData }> = ({ 
  notification 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);
  
  if (!isVisible) return null;
  
  return (
    <motion.div
      className={`notification notification-${notification.type}`}
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      layout
    >
      {notification.icon && (
        <div className="notification-icon">
          {notification.icon}
        </div>
      )}
      <div className="notification-content">
        <h4 className="notification-title">{notification.title}</h4>
        <p className="notification-message">{notification.message}</p>
      </div>
    </motion.div>
  );
};
```

### Menu Systems

#### Main Menu
```typescript
const MainMenu: React.FC<{ onAction: (action: MenuAction) => void }> = ({ onAction }) => {
  const menuItems = [
    { id: 'new_game', label: 'New Game', action: () => onAction('start_new_game') },
    { id: 'continue', label: 'Continue', action: () => onAction('load_game') },
    { id: 'settings', label: 'Settings', action: () => onAction('open_settings') },
    { id: 'credits', label: 'Credits', action: () => onAction('show_credits') }
  ];
  
  return (
    <div className="main-menu">
      <div className="menu-background">
        <div className="title-logo">
          <h1>Echoes of Aeria</h1>
          <p className="subtitle">A Zelda-inspired Adventure</p>
        </div>
        
        <nav className="menu-navigation">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              className="menu-item"
              onClick={item.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>
      </div>
    </div>
  );
};
```

#### Settings Screen
```typescript
const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useLocalStorage('game-settings', {
    masterVolume: 0.7,
    musicVolume: 0.8,
    sfxVolume: 0.9,
    fullscreen: false,
    difficulty: 'normal',
    controls: 'wasd'
  });
  
  return (
    <div className="settings-screen">
      <h2>Settings</h2>
      
      <div className="settings-section">
        <h3>Audio</h3>
        <VolumeSlider
          label="Master Volume"
          value={settings.masterVolume}
          onChange={(value) => setSettings(prev => ({ ...prev, masterVolume: value }))}
        />
        <VolumeSlider
          label="Music Volume"
          value={settings.musicVolume}
          onChange={(value) => setSettings(prev => ({ ...prev, musicVolume: value }))}
        />
        <VolumeSlider
          label="SFX Volume"
          value={settings.sfxVolume}
          onChange={(value) => setSettings(prev => ({ ...prev, sfxVolume: value }))}
        />
      </div>
      
      <div className="settings-section">
        <h3>Display</h3>
        <ToggleSwitch
          label="Fullscreen"
          checked={settings.fullscreen}
          onChange={(checked) => setSettings(prev => ({ ...prev, fullscreen: checked }))}
        />
      </div>
      
      <div className="settings-section">
        <h3>Gameplay</h3>
        <SelectDropdown
          label="Difficulty"
          value={settings.difficulty}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' }
          ]}
          onChange={(value) => setSettings(prev => ({ ...prev, difficulty: value }))}
        />
      </div>
    </div>
  );
};
```

### Accessibility Features

#### Keyboard Navigation
```typescript
const useKeyboardNavigation = (items: NavigableItem[], onSelect: (item: NavigableItem) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(items.length - 1, prev + 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect(items[selectedIndex]);
          break;
        case 'Escape':
          event.preventDefault();
          // Handle escape based on context
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);
  
  return selectedIndex;
};
```

#### Color Accessibility
```css
/* CSS custom properties for accessible color schemes */
:root {
  --color-health-full: #dc143c;
  --color-health-half: #ff6347;
  --color-health-empty: #2f2f2f;
  
  --color-mana-full: #4169e1;
  --color-mana-half: #87ceeb;
  --color-mana-empty: #2f2f2f;
  
  --color-ui-primary: #ffffff;
  --color-ui-secondary: #cccccc;
  --color-ui-background: rgba(0, 0, 0, 0.8);
  --color-ui-border: #666666;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-ui-background: rgba(0, 0, 0, 0.95);
    --color-ui-border: #ffffff;
    --color-ui-primary: #ffffff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance Optimization

#### Virtual Scrolling for Large Lists
```typescript
const VirtualizedInventory: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemHeight = 64;
  const visibleCount = Math.ceil(window.innerHeight / itemHeight);
  
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);
  
  return (
    <div 
      className="virtualized-inventory"
      style={{ height: items.length * itemHeight }}
      onScroll={(e) => {
        const scrollTop = e.currentTarget.scrollTop;
        setStartIndex(Math.floor(scrollTop / itemHeight));
      }}
    >
      <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
        {visibleItems.map((item, index) => (
          <ItemSlot key={item.id} item={item} index={startIndex + index} />
        ))}
      </div>
    </div>
  );
};
```

This agent ensures that Echoes of Aeria has a polished, accessible, and user-friendly interface that enhances rather than detracts from the core gameplay experience.