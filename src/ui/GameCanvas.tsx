// GameCanvas Component - Phaser game mount point for React
// Following Game Architect specifications for Phaser + React integration

import React, { useEffect, useRef, useState } from 'react';
import { ALTTPGameIntegration } from '@game/ALTTPGameIntegration.js';
import { gameEvents } from '@shared/events.js';

interface GameCanvasProps {
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ className = '' }) => {
  const gameRef = useRef<ALTTPGameIntegration | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    const initializeGame = async () => {
      try {
        console.log('Initializing ALTTP Game...');
        
        const gameIntegration = new ALTTPGameIntegration({
          canvas: canvasRef.current!,
          enablePerformanceMonitoring: true,
          enablePixelPerfect: true,
          targetFPS: 60
        });
        
        await gameIntegration.initialize();
        
        if (mounted) {
          gameRef.current = gameIntegration;
          setIsLoading(false);
          setError(null);
          
          // Make game globally accessible for testing
          (window as any).altttpGame = gameIntegration;
          
          console.log('ALTTP Game initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize ALTTP game:', err);
        
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
          setIsLoading(false);
        }
      }
    };

    initializeGame();

    // Setup event listeners for game state
    const unsubscribeError = gameEvents.on('system.error', (event: any) => {
      console.error('Game error:', event.payload.error);
      setError(`Game error: ${event.payload.error.message || event.payload.error}`);
    });

    const unsubscribePerformance = gameEvents.on('system.performance.update', (event: any) => {
      // Handle performance updates if needed
      if (event.payload.fps < 30) {
        console.warn('Low FPS detected:', event.payload.fps);
      }
    });

    const unsubscribePerformanceWarning = gameEvents.on('system.performance.warning', (event: any) => {
      console.warn('Performance Warning:', event.payload.warning);
    });

    // Cleanup function
    return () => {
      mounted = false;
      
      // Unsubscribe from events
      unsubscribeError();
      unsubscribePerformance();
      unsubscribePerformanceWarning();
      
      // Destroy game instance
      if (gameRef.current) {
        console.log('Destroying ALTTP game instance...');
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      className={`game-canvas ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#101820',
        outline: 'none'
      }}
    >
      {error && (
        <div className="error-content">
          <h2>Game Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}
      
      {isLoading && !error && (
        <div className="loading-content">
          <h2>Loading Echoes of Aeria - ALTTP Edition...</h2>
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {/* ALTTP Game Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: error || isLoading ? 'none' : 'block',
          imageRendering: 'pixelated'
        }}
        className="alttp-canvas"
      />
    </div>
  );
};