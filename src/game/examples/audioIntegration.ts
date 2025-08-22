/**
 * Example: Integrating SNES-style audio into Echoes of Aeria
 * Shows how to use the AudioManager and utilities in actual gameplay
 */

import { audioManager } from '../systems/AudioManager';
import { CombatAudio, UIAudio, WorldAudio, RegionAudio, initializeAudio, applyAudioPreset } from '../utils/audioUtils';
import { CRITICAL_AUDIO_ASSETS } from '../../assets/audioManifest';

/**
 * Example: Game initialization with audio
 */
export async function initializeGame(): Promise<void> {
  try {
    // Initialize SNES-style audio system
    await initializeAudio();
    
    // Load additional critical assets for immediate gameplay
    await audioManager.loadAudio(CRITICAL_AUDIO_ASSETS);
    
    console.log('🎮 Game initialized with SNES-style audio');
  } catch (error) {
    console.error('Failed to initialize game audio:', error);
  }
}

/**
 * Example: Player combat integration
 */
export class PlayerCombatExample {
  private isAttacking = false;
  private lastAttackTime = 0;
  private readonly attackCooldown = 500; // ms
  
  performAttack(): void {
    const now = Date.now();
    if (this.isAttacking || (now - this.lastAttackTime) < this.attackCooldown) {
      return;
    }
    
    this.isAttacking = true;
    this.lastAttackTime = now;
    
    // Play SNES-style sword swing with subtle pitch variation
    CombatAudio.playSwordSwing();
    
    // Visual attack animation would go here...
    
    setTimeout(() => {
      this.isAttacking = false;
    }, 300);
  }
  
  takeDamage(amount: number): void {
    // Play damage sound with music ducking for impact
    CombatAudio.playPlayerDamage();
    
    // Damage logic here...
    console.log(`Player took ${amount} damage`);
  }
}

/**
 * Example: Enemy hit detection with audio feedback
 */
export class EnemyExample {
  private health = 2;
  
  takeHit(damage: number): void {
    this.health -= damage;
    
    if (this.health <= 0) {
      // Enemy death sound
      audioManager.playSfx('sfx_enemy_death', {
        pitchVariation: 40, // Moderate variation
        volume: 0.7
      });
      
      // Drop rupee with satisfying collect sound
      this.dropRupee();
    } else {
      // Regular hit sound
      CombatAudio.playEnemyHit();
    }
  }
  
  private dropRupee(): void {
    // Simulate item drop after brief delay
    setTimeout(() => {
      WorldAudio.playItemCollect('rupee');
    }, 200);
  }
}

/**
 * Example: Region transition with music management
 */
export class WorldManagerExample {
  private currentRegion?: string;
  
  async enterRegion(regionName: string): Promise<void> {
    if (this.currentRegion === regionName) return;
    
    console.log(`🌍 Entering ${regionName}`);
    
    try {
      // Automatically handles music crossfading and loading
      await RegionAudio.enterRegion(regionName);
      this.currentRegion = regionName;
      
      // Play region enter sound effect
      audioManager.playSfx('sfx_region_enter', {
        volume: 0.6
      });
      
    } catch (error) {
      console.error(`Failed to load region music for ${regionName}:`, error);
    }
  }
  
  enterBossBattle(): void {
    // Change audio preset for intense boss fight
    applyAudioPreset('BOSS_BATTLE');
    
    // Play boss battle music
    audioManager.playMusic('bgm_boss_battle', 1500);
    
    console.log('⚔️ Boss battle started!');
  }
  
  exitBossBattle(): void {
    // Return to normal gameplay audio levels
    applyAudioPreset('NORMAL_GAMEPLAY');
    
    // Return to region music
    if (this.currentRegion) {
      audioManager.playMusic(`bgm_${this.currentRegion}`, 2000);
    }
  }
}

/**
 * Example: UI integration with audio feedback
 */
export class MenuSystemExample {
  private selectedIndex = 0;
  private readonly menuItems = ['New Game', 'Continue', 'Settings', 'Exit'];
  
  navigateUp(): void {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    UIAudio.playMenuSelect();
  }
  
  navigateDown(): void {
    this.selectedIndex = Math.min(this.menuItems.length - 1, this.selectedIndex + 1);
    UIAudio.playMenuSelect();
  }
  
  confirmSelection(): void {
    UIAudio.playMenuConfirm();
    
    const selectedItem = this.menuItems[this.selectedIndex];
    console.log(`Selected: ${selectedItem}`);
    
    // Handle menu action...
  }
  
  openInventory(): void {
    // Audio preset change for focused UI interaction
    applyAudioPreset('MENU_FOCUSED');
    UIAudio.playInventoryOpen();
    
    // Show inventory UI...
  }
  
  closeInventory(): void {
    // Return to gameplay audio levels
    applyAudioPreset('NORMAL_GAMEPLAY');
    UIAudio.playInventoryClose();
    
    // Hide inventory UI...
  }
}

/**
 * Example: Eclipse/Dayrealm transition with special audio
 */
export class RealmTransitionExample {
  private currentRealm: 'dayrealm' | 'eclipse' = 'dayrealm';
  
  toggleRealm(): void {
    // Check if player has Aether Mirror...
    if (!this.hasAetherMirror()) {
      UIAudio.playMenuCancel(); // Deny sound
      return;
    }
    
    // Play dramatic realm transition sound
    WorldAudio.playRealmTransition();
    
    // Toggle realm
    this.currentRealm = this.currentRealm === 'dayrealm' ? 'eclipse' : 'dayrealm';
    
    // World transformation visual effects would happen here...
    
    console.log(`🌙 Switched to ${this.currentRealm}`);
  }
  
  private hasAetherMirror(): boolean {
    // Check player inventory...
    return true; // Placeholder
  }
}

/**
 * Example: Dialogue system with audio ducking
 */
export class DialogueSystemExample {
  private isDialogueActive = false;
  
  startDialogue(npcName: string, text: string): void {
    if (this.isDialogueActive) return;
    
    this.isDialogueActive = true;
    
    // Switch to dialogue audio preset (quieter music/ambience)
    applyAudioPreset('DIALOGUE_SCENE');
    
    // Play dialogue start sound
    audioManager.playSfx('ui_dialogue_start', {
      volume: 0.4
    });
    
    console.log(`💬 ${npcName}: "${text}"`);
  }
  
  advanceDialogue(): void {
    // Subtle advance sound
    audioManager.playSfx('ui_dialogue_advance', {
      volume: 0.3
    });
  }
  
  endDialogue(): void {
    this.isDialogueActive = false;
    
    // Return to normal gameplay audio
    applyAudioPreset('NORMAL_GAMEPLAY');
    
    // Play dialogue end sound
    audioManager.playSfx('ui_dialogue_end', {
      volume: 0.4
    });
  }
}

/**
 * Example: Debug and testing utilities
 */
export class AudioDebugExample {
  
  testCombatAudio(): void {
    console.log('🧪 Testing combat audio...');
    
    // Test sword swing
    setTimeout(() => CombatAudio.playSwordSwing(), 0);
    
    // Test enemy hit
    setTimeout(() => CombatAudio.playEnemyHit(), 500);
    
    // Test player damage (with ducking)
    setTimeout(() => CombatAudio.playPlayerDamage(), 1000);
  }
  
  testItemCollection(): void {
    console.log('🧪 Testing item collection...');
    
    const items = ['rupee', 'heart', 'key', 'special'] as const;
    items.forEach((item, index) => {
      setTimeout(() => {
        WorldAudio.playItemCollect(item);
        console.log(`Collected ${item}`);
      }, index * 800);
    });
  }
  
  testMusicTransitions(): void {
    console.log('🧪 Testing music transitions...');
    
    const regions = ['verdant_lowlands', 'whisperwood', 'moonwell_marsh'];
    regions.forEach((region, index) => {
      setTimeout(async () => {
        await RegionAudio.enterRegion(region);
        console.log(`Now playing: ${region}`);
      }, index * 5000);
    });
  }
}

// Usage examples for integration:
/*
// In your game's main loop or event handlers:

const player = new PlayerCombatExample();
const worldManager = new WorldManagerExample();
const menuSystem = new MenuSystemExample();

// Initialize game with audio
initializeGame().then(() => {
  console.log('Game ready with SNES-style audio!');
});

// Combat example
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    player.performAttack();
  }
});

// Region transition example
worldManager.enterRegion('verdant_lowlands');

// Menu navigation example
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'ArrowUp':
      menuSystem.navigateUp();
      break;
    case 'ArrowDown':
      menuSystem.navigateDown();
      break;
    case 'Enter':
      menuSystem.confirmSelection();
      break;
  }
});
*/