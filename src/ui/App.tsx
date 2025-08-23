// Main React App - Root component with UI overlays
// Following UI/UX Designer specifications for React integration

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './GameCanvas.js';
import { HUD } from './components/HUD.js';
import { InventoryModal } from './components/InventoryModal.js';
import { DialogueBox } from './components/DialogueBox.js';
import { PauseMenu } from './components/PauseMenu.js';
import { gameEvents } from '@shared/events.js';
import type { GameState, PlayerInventory } from '@shared/types.js';
import './styles.css';

export const App: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('playing');
  const [isPaused, setIsPaused] = useState(false);
  
  // Player state
  const [playerHealth, setPlayerHealth] = useState(6);
  const [playerMaxHealth, setPlayerMaxHealth] = useState(6);
  const [playerInventory, setPlayerInventory] = useState<PlayerInventory>({
    sunflame_lantern: true,
    gale_boots: false,
    riverfin_vest: false,
    aether_mirror: false,
    storm_disk: false,
    quake_maul: false,
    tide_hook: false,
    sunflame_prism: false,
    kingsbane_sigil: false,
    aether_shards: 0,
    keys: {},
    heart_pieces: 0,
    rumor_cards: 0
  });
  
  // UI state
  const [showInventory, setShowInventory] = useState(false);
  const [dialogueData, setDialogueData] = useState<{
    text: string;
    speaker?: string;
    visible: boolean;
  }>({ text: '', visible: false });
  
  // Performance metrics
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);

  // Set up event listeners
  useEffect(() => {
    // Game state events
    const unsubscribeGameState = gameEvents.on('game.state.changed', (event: any) => {
      setGameState(event.payload.state);
    });

    const unsubscribePause = gameEvents.on('game.paused', (event: any) => {
      setIsPaused(event.payload.paused);
    });

    // Player events
    const unsubscribeHealth = gameEvents.on('player.health.changed', (event: any) => {
      setPlayerHealth(event.payload.health);
      setPlayerMaxHealth(event.payload.maxHealth);
    });

    const unsubscribeInventory = gameEvents.on('player.inventory.changed', (event: any) => {
      setPlayerInventory(event.payload.inventory);
    });

    // UI events
    const unsubscribeInventoryToggle = gameEvents.on('ui.inventory.toggle', (event: any) => {
      setShowInventory(event.payload.open);
    });

    const unsubscribeDialogueStart = gameEvents.on('ui.dialogue.started', (event: any) => {
      setDialogueData({
        text: event.payload.text,
        speaker: event.payload.speaker,
        visible: true
      });
    });

    const unsubscribeDialogueEnd = gameEvents.on('ui.dialogue.ended', () => {
      setDialogueData(prev => ({ ...prev, visible: false }));
    });

    // Performance events
    const unsubscribePerformance = gameEvents.on('system.performance.update', (event: any) => {
      setFps(event.payload.fps);
      setMemoryUsage(event.payload.memoryUsage);
    });

    // Cleanup
    return () => {
      unsubscribeGameState();
      unsubscribePause();
      unsubscribeHealth();
      unsubscribeInventory();
      unsubscribeInventoryToggle();
      unsubscribeDialogueStart();
      unsubscribeDialogueEnd();
      unsubscribePerformance();
    };
  }, []);

  // Handle keyboard shortcuts at app level
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Escape':
          if (showInventory) {
            setShowInventory(false);
          } else if (dialogueData.visible) {
            setDialogueData(prev => ({ ...prev, visible: false }));
          } else {
            setIsPaused(!isPaused);
          }
          break;
        case 'KeyI':
          if (!dialogueData.visible && !isPaused) {
            setShowInventory(!showInventory);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInventory, dialogueData.visible, isPaused]);

  const handleCloseInventory = () => {
    setShowInventory(false);
    gameEvents.emit({
      type: 'ui.inventory.toggle',
      payload: { open: false },
      timestamp: Date.now()
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    gameEvents.emit({
      type: 'game.paused',
      payload: { paused: false },
      timestamp: Date.now()
    });
  };

  const handleMainMenu = () => {
    // This would navigate to main menu
    console.log('Navigate to main menu');
  };

  const handleDialogueAdvance = () => {
    // This would advance dialogue or end it
    gameEvents.emit({
      type: 'ui.dialogue.ended',
      payload: {},
      timestamp: Date.now()
    });
  };

  return (
    <div className="app">
      {/* Game Canvas */}
      <GameCanvas className="game-canvas" />
      
      {/* UI Overlays */}
      {gameState === 'playing' && !isPaused && (
        <HUD 
          health={playerHealth}
          maxHealth={playerMaxHealth}
          hearts={Math.ceil(playerMaxHealth / 2)}
          gleam={0} // Will be connected to player state
          aetherShards={playerInventory.aether_shards}
          fps={fps}
          memoryUsage={memoryUsage}
        />
      )}
      
      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal 
          inventory={playerInventory}
          onClose={handleCloseInventory}
        />
      )}
      
      {/* Dialogue Box */}
      {dialogueData.visible && (
        <DialogueBox 
          text={dialogueData.text}
          speaker={dialogueData.speaker || undefined}
          onAdvance={handleDialogueAdvance}
        />
      )}
      
      {/* Pause Menu */}
      {isPaused && (
        <PauseMenu 
          onResume={handleResume}
          onMainMenu={handleMainMenu}
        />
      )}
      
      {/* Error Boundary could go here */}
    </div>
  );
};