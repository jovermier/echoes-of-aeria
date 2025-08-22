import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from '../AudioManager';

// Mock Howler globally
vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    load: vi.fn(),
    play: vi.fn(() => 1),
    stop: vi.fn(),
    volume: vi.fn(),
    fade: vi.fn(),
    once: vi.fn(),
    unload: vi.fn(),
  })),
  Howler: {
    ctx: {
      state: 'running',
      resume: vi.fn(),
    },
  },
}));

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    audioManager = AudioManager.getInstance();
  });

  afterEach(() => {
    audioManager.dispose();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AudioManager.getInstance();
      const instance2 = AudioManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Audio Loading', () => {
    it('should load audio assets successfully', async () => {
      const testAssets = [
        {
          id: 'test_sfx',
          src: ['/audio/test.ogg', '/audio/test.m4a'],
          volume: 0.8,
          category: 'sfx' as const,
        },
      ];

      await expect(audioManager.loadAudio(testAssets)).resolves.toBeUndefined();
    });

    it('should preload critical audio assets', async () => {
      await expect(audioManager.preloadCriticalAudio()).resolves.toBeUndefined();
    });
  });

  describe('Sound Effects', () => {
    beforeEach(async () => {
      await audioManager.preloadCriticalAudio();
    });

    it('should play SFX with default settings', () => {
      const mockPlay = vi.fn(() => 1);
      const mockSound = { play: mockPlay };
      (audioManager as any).sounds.set('sfx_sword_swing', mockSound);

      const result = audioManager.playSfx('sfx_sword_swing');
      expect(mockPlay).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should apply pitch variation to SFX', () => {
      const mockPlay = vi.fn(() => 1);
      const mockSound = { 
        play: mockPlay,
        _soundById: vi.fn(() => ({
          _node: {
            detune: { value: 0 }
          }
        }))
      };
      (audioManager as any).sounds.set('test_sfx', mockSound);

      audioManager.playSfx('test_sfx', { pitchVariation: 40 });
      expect(mockPlay).toHaveBeenCalled();
    });

    it('should respect concurrency limits', () => {
      const mockPlay = vi.fn(() => 1);
      const mockSound = { play: mockPlay };
      (audioManager as any).sounds.set('test_sfx', mockSound);

      // First call should work
      const result1 = audioManager.playSfx('test_sfx');
      expect(result1).toBe(1);

      // Immediate second call should be blocked by cooldown
      const result2 = audioManager.playSfx('test_sfx');
      expect(result2).toBeNull();
    });
  });

  describe('Music Management', () => {
    it('should play music with simple loop', () => {
      const mockPlay = vi.fn(() => 1);
      const mockFade = vi.fn();
      const mockVolume = vi.fn(() => 0.6);
      const mockSound = { 
        play: mockPlay,
        fade: mockFade,
        volume: mockVolume,
        _sprite: undefined
      };
      (audioManager as any).sounds.set('bgm_test', mockSound);

      audioManager.playMusic('bgm_test');
      expect(mockPlay).toHaveBeenCalled();
      expect(mockFade).toHaveBeenCalled();
    });

    it('should handle intro->loop music structure', () => {
      const mockPlay = vi.fn(() => 1);
      const mockOnce = vi.fn();
      const mockFade = vi.fn();
      const mockVolume = vi.fn(() => 0.6);
      const mockSound = {
        play: mockPlay,
        once: mockOnce,
        fade: mockFade,
        volume: mockVolume,
        _sprite: {
          intro: [0, 8000, false],
          loop: [8000, 64000, true]
        }
      };
      (audioManager as any).sounds.set('bgm_test', mockSound);

      audioManager.playMusic('bgm_test');
      expect(mockPlay).toHaveBeenCalledWith('intro');
      expect(mockOnce).toHaveBeenCalled();
    });

    it('should stop current music before playing new track', () => {
      const mockStop = vi.fn();
      const mockFade = vi.fn();
      const mockVolume = vi.fn(() => 0.6);
      const currentMusic = {
        sound: { stop: mockStop, fade: mockFade, volume: mockVolume },
        id: 1
      };
      (audioManager as any).currentMusic = currentMusic;

      const newSound = {
        play: vi.fn(() => 2),
        fade: vi.fn(),
        volume: mockVolume,
        _sprite: undefined
      };
      (audioManager as any).sounds.set('bgm_new', newSound);

      audioManager.playMusic('bgm_new');
      expect(mockFade).toHaveBeenCalled();
    });
  });

  describe('Music Ducking', () => {
    it('should duck and restore music volume', () => {
      const mockFade = vi.fn();
      const mockVolume = vi.fn(() => 0.6);
      const mockSound = { fade: mockFade, volume: mockVolume };
      (audioManager as any).currentMusic = { sound: mockSound };

      audioManager.duckMusic(0.3, 200);

      expect(mockFade).toHaveBeenCalledTimes(1);
      expect(mockFade).toHaveBeenCalledWith(0.6, 0.18, 200);
    });

    it('should not duck if no music is playing', () => {
      (audioManager as any).currentMusic = undefined;
      
      // Should not throw error
      expect(() => audioManager.duckMusic()).not.toThrow();
    });
  });

  describe('Mixer Settings', () => {
    it('should update mixer levels', () => {
      const initialSettings = audioManager.getMixerSettings();
      expect(initialSettings.master).toBe(0.7);

      audioManager.setMixerLevel('master', 0.5);
      const updatedSettings = audioManager.getMixerSettings();
      expect(updatedSettings.master).toBe(0.5);
    });

    it('should clamp mixer levels to 0-1 range', () => {
      audioManager.setMixerLevel('master', 1.5);
      expect(audioManager.getMixerSettings().master).toBe(1);

      audioManager.setMixerLevel('master', -0.5);
      expect(audioManager.getMixerSettings().master).toBe(0);
    });
  });

  describe('Resource Management', () => {
    it('should dispose all resources', () => {
      const mockUnload = vi.fn();
      const mockSound = { unload: mockUnload };
      (audioManager as any).sounds.set('test', mockSound);

      audioManager.dispose();

      expect(mockUnload).toHaveBeenCalled();
      expect((audioManager as any).sounds.size).toBe(0);
      expect((audioManager as any).currentMusic).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing sound gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = audioManager.playSfx('nonexistent_sound');
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('SFX "nonexistent_sound" not found');
      
      consoleSpy.mockRestore();
    });

    it('should handle missing music gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      audioManager.playMusic('nonexistent_music');
      
      expect(consoleSpy).toHaveBeenCalledWith('Music track "nonexistent_music" not found');
      
      consoleSpy.mockRestore();
    });
  });
});