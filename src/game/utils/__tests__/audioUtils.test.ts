import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatAudio, UIAudio, WorldAudio, RegionAudio, applyAudioPreset, PITCH_VARIATIONS, AUDIO_TIMING } from '../audioUtils';
import { audioManager } from '../../systems/AudioManager';

// Mock the AudioManager
vi.mock('../../systems/AudioManager', () => ({
  audioManager: {
    playSfx: vi.fn(),
    duckMusic: vi.fn(),
    playMusic: vi.fn(),
    loadRegionMusic: vi.fn().mockResolvedValue(undefined),
    setMixerLevel: vi.fn(),
  },
}));

describe('Audio Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CombatAudio', () => {
    it('should play sword swing with subtle pitch variation', () => {
      CombatAudio.playSwordSwing();

      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_sword_swing', {
        pitchVariation: PITCH_VARIATIONS.SUBTLE,
        volume: 0.8
      });
    });

    it('should play enemy hit with moderate pitch variation', () => {
      CombatAudio.playEnemyHit();

      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_enemy_hit', {
        pitchVariation: PITCH_VARIATIONS.MODERATE,
        volume: 0.7
      });
    });

    it('should play player damage with music ducking', () => {
      CombatAudio.playPlayerDamage();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(0.2, AUDIO_TIMING.DUCK_DURATION);
      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_player_damage', {
        pitchVariation: PITCH_VARIATIONS.SUBTLE,
        volume: 0.9
      });
    });

    it('should play boss hit with heavy ducking', () => {
      CombatAudio.playBossHit();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(0.1, AUDIO_TIMING.DUCK_DURATION * 2);
      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_boss_hit', {
        pitchVariation: PITCH_VARIATIONS.NOTICEABLE,
        volume: 1.0
      });
    });
  });

  describe('UIAudio', () => {
    it('should play menu select with subtle variation', () => {
      UIAudio.playMenuSelect();

      expect(audioManager.playSfx).toHaveBeenCalledWith('ui_menu_select', {
        pitchVariation: PITCH_VARIATIONS.SUBTLE
      });
    });

    it('should play menu confirm', () => {
      UIAudio.playMenuConfirm();

      expect(audioManager.playSfx).toHaveBeenCalledWith('ui_menu_confirm', {
        volume: 0.6
      });
    });

    it('should duck music when opening inventory', () => {
      UIAudio.playInventoryOpen();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(0.4, AUDIO_TIMING.NORMAL_FADE);
      expect(audioManager.playSfx).toHaveBeenCalledWith('ui_inventory_open');
    });

    it('should restore music when closing inventory', () => {
      UIAudio.playInventoryClose();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(1.0, AUDIO_TIMING.NORMAL_FADE);
      expect(audioManager.playSfx).toHaveBeenCalledWith('ui_inventory_close');
    });
  });

  describe('WorldAudio', () => {
    it('should play rupee collection with moderate variation', () => {
      WorldAudio.playItemCollect('rupee');

      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_item_rupee', {
        pitchVariation: PITCH_VARIATIONS.MODERATE,
        volume: 0.6
      });
    });

    it('should play heart collection with subtle variation', () => {
      WorldAudio.playItemCollect('heart');

      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_item_heart', {
        pitchVariation: PITCH_VARIATIONS.SUBTLE,
        volume: 0.8
      });
    });

    it('should play special item with noticeable variation', () => {
      WorldAudio.playItemCollect('special');

      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_item_special', {
        pitchVariation: PITCH_VARIATIONS.NOTICEABLE,
        volume: 0.9
      });
    });

    it('should play secret reveal with ducking', () => {
      WorldAudio.playSecretReveal();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(0.3, AUDIO_TIMING.SLOW_FADE);
      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_secret_reveal', {
        volume: 0.8
      });
    });

    it('should play realm transition with heavy ducking', () => {
      WorldAudio.playRealmTransition();

      expect(audioManager.duckMusic).toHaveBeenCalledWith(0.1, AUDIO_TIMING.SLOW_FADE);
      expect(audioManager.playSfx).toHaveBeenCalledWith('sfx_realm_transition', {
        volume: 0.9
      });
    });
  });

  describe('RegionAudio', () => {
    beforeEach(() => {
      // Reset current region
      RegionAudio._setCurrentRegion(undefined);
    });

    it('should enter new region successfully', async () => {
      await RegionAudio.enterRegion('verdant_lowlands');

      expect(audioManager.loadRegionMusic).toHaveBeenCalledWith('verdant_lowlands');
      expect(audioManager.playMusic).toHaveBeenCalledWith('bgm_verdant_lowlands', AUDIO_TIMING.MUSIC_CROSSFADE);
      expect(RegionAudio.getCurrentRegion()).toBe('verdant_lowlands');
    });

    it('should not reload same region', async () => {
      RegionAudio._setCurrentRegion('whisperwood');

      await RegionAudio.enterRegion('whisperwood');

      expect(audioManager.loadRegionMusic).not.toHaveBeenCalled();
      expect(audioManager.playMusic).not.toHaveBeenCalled();
    });

    it('should get current region', () => {
      RegionAudio._setCurrentRegion('moonwell_marsh');
      expect(RegionAudio.getCurrentRegion()).toBe('moonwell_marsh');
    });
  });

  describe('Audio Presets', () => {
    it('should apply normal gameplay preset', () => {
      applyAudioPreset('NORMAL_GAMEPLAY');

      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('master', 0.7);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('music', 0.6);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('sfx', 0.8);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ui', 0.7);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ambient', 0.4);
    });

    it('should apply boss battle preset', () => {
      applyAudioPreset('BOSS_BATTLE');

      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('master', 0.8);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('music', 0.7);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('sfx', 0.9);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ui', 0.6);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ambient', 0.2);
    });

    it('should apply dialogue scene preset', () => {
      applyAudioPreset('DIALOGUE_SCENE');

      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('master', 0.6);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('music', 0.3);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('sfx', 0.6);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ui', 0.7);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ambient', 0.2);
    });

    it('should apply menu focused preset', () => {
      applyAudioPreset('MENU_FOCUSED');

      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('master', 0.5);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('music', 0.2);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('sfx', 0.4);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ui', 0.8);
      expect(audioManager.setMixerLevel).toHaveBeenCalledWith('ambient', 0.1);
    });
  });

  describe('Constants', () => {
    it('should have correct pitch variation values', () => {
      expect(PITCH_VARIATIONS.SUBTLE).toBe(20);
      expect(PITCH_VARIATIONS.MODERATE).toBe(40);
      expect(PITCH_VARIATIONS.NOTICEABLE).toBe(80);
      expect(PITCH_VARIATIONS.EXTREME).toBe(120);
    });

    it('should have correct audio timing values', () => {
      expect(AUDIO_TIMING.QUICK_FADE).toBe(150);
      expect(AUDIO_TIMING.NORMAL_FADE).toBe(300);
      expect(AUDIO_TIMING.SLOW_FADE).toBe(600);
      expect(AUDIO_TIMING.DUCK_DURATION).toBe(200);
      expect(AUDIO_TIMING.MUSIC_CROSSFADE).toBe(1000);
    });
  });
});