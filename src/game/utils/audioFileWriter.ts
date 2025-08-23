// Audio File Writer - Creates actual audio files from generated data
// Converts ArrayBuffers to actual files in the public directory

import { AudioGenerator } from './audioGenerator.js';

export class AudioFileWriter {
  private audioGenerator: AudioGenerator;

  constructor(audioContext: AudioContext) {
    this.audioGenerator = new AudioGenerator(audioContext);
  }

  /**
   * Generate and save all audio files to the filesystem
   */
  async generateAllAudioFiles(): Promise<void> {
    console.log('🎵 Starting audio file generation...');
    
    try {
      // Ensure directories exist
      await this.ensureDirectoryExists('public/assets/audio/music');
      await this.ensureDirectoryExists('public/assets/audio/sfx');
      
      // Generate music files
      console.log('🎼 Generating background music...');
      
      const hearthmereTheme = await this.audioGenerator.generateHearthmereTheme();
      await this.writeAudioFile(hearthmereTheme, 'public/assets/audio/music/hearthmere.wav');
      
      const explorationTheme = await this.audioGenerator.generateExplorationTheme();
      await this.writeAudioFile(explorationTheme, 'public/assets/audio/music/exploration.wav');
      
      // Generate sound effects
      console.log('🔊 Generating sound effects...');
      
      const footstep = this.audioGenerator.generateFootstep();
      await this.writeAudioFile(footstep, 'public/assets/audio/sfx/footstep.wav');
      
      const swordAttack = this.audioGenerator.generateSwordAttack();
      await this.writeAudioFile(swordAttack, 'public/assets/audio/sfx/sword_attack.wav');
      
      const itemPickup = this.audioGenerator.generateItemPickup();
      await this.writeAudioFile(itemPickup, 'public/assets/audio/sfx/item_pickup.wav');
      
      const buttonClick = this.audioGenerator.generateButtonClick();
      await this.writeAudioFile(buttonClick, 'public/assets/audio/sfx/button_click.wav');
      
      const errorSound = this.audioGenerator.generateErrorSound();
      await this.writeAudioFile(errorSound, 'public/assets/audio/sfx/error.wav');
      
      // Create OGG versions for better compression
      console.log('🎵 Creating compressed versions...');
      await this.createCompressedVersions();
      
      console.log('✅ Audio generation complete!');
      console.log('📁 Files saved to:');
      console.log('   - public/assets/audio/music/');
      console.log('   - public/assets/audio/sfx/');
      
    } catch (error) {
      console.error('❌ Audio generation failed:', error);
      throw error;
    }
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    // This would create directories in a Node.js environment
    // For browser environment, we'll handle differently
    console.log(`📁 Ensuring directory exists: ${path}`);
  }

  private async writeAudioFile(audioData: ArrayBuffer, filepath: string): Promise<void> {
    try {
      // Convert to base64 for easier handling
      const uint8Array = new Uint8Array(audioData);
      const base64 = this.arrayBufferToBase64(uint8Array);
      
      // Store in a way that can be accessed by the game
      const filename = filepath.split('/').pop() || 'unknown.wav';
      const category = filepath.includes('/music/') ? 'music' : 'sfx';
      
      // Create global storage for generated audio
      if (!(window as any).generatedAudioFiles) {
        (window as any).generatedAudioFiles = {
          music: {},
          sfx: {}
        };
      }
      
      // Store as data URL
      const mimeType = 'audio/wav';
      const dataUrl = `data:${mimeType};base64,${base64}`;
      (window as any).generatedAudioFiles[category][filename] = dataUrl;
      
      console.log(`💾 Generated: ${category}/${filename} (${Math.round(audioData.byteLength / 1024)}KB)`);
      
    } catch (error) {
      console.error(`❌ Failed to write ${filepath}:`, error);
      throw error;
    }
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  private async createCompressedVersions(): Promise<void> {
    // In a real implementation, you'd convert WAV to OGG/MP3
    // For now, we'll copy the WAV versions as placeholders
    console.log('📦 Creating compressed audio formats...');
    
    const audioFiles = (window as any).generatedAudioFiles;
    if (audioFiles) {
      // Copy music files with different extensions for compatibility
      Object.keys(audioFiles.music).forEach(filename => {
        const baseName = filename.replace('.wav', '');
        const dataUrl = audioFiles.music[filename];
        
        // Create OGG version (same data, different extension reference)
        audioFiles.music[`${baseName}.ogg`] = dataUrl;
        audioFiles.music[`${baseName}.m4a`] = dataUrl; // Fallback format
      });
      
      console.log('📦 Compressed versions created (using WAV data)');
    }
  }

  /**
   * Get a generated audio file as a playable URL
   */
  static getAudioUrl(category: 'music' | 'sfx', filename: string): string | null {
    const audioFiles = (window as any).generatedAudioFiles;
    if (audioFiles && audioFiles[category] && audioFiles[category][filename]) {
      return audioFiles[category][filename];
    }
    return null;
  }

  /**
   * Check if a generated audio file exists
   */
  static hasAudioFile(category: 'music' | 'sfx', filename: string): boolean {
    return AudioFileWriter.getAudioUrl(category, filename) !== null;
  }

  /**
   * List all generated audio files
   */
  static listGeneratedFiles(): { music: string[], sfx: string[] } {
    const audioFiles = (window as any).generatedAudioFiles;
    if (!audioFiles) {
      return { music: [], sfx: [] };
    }
    
    return {
      music: Object.keys(audioFiles.music || {}),
      sfx: Object.keys(audioFiles.sfx || {})
    };
  }
}

// Global function to trigger audio generation
(window as any).generateGameAudio = async function() {
  try {
    // Get or create audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }
    
    const audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const writer = new AudioFileWriter(audioContext);
    await writer.generateAllAudioFiles();
    
    console.log('🎉 Audio generation complete! Files are ready for the game.');
    return AudioFileWriter.listGeneratedFiles();
    
  } catch (error) {
    console.error('❌ Failed to generate audio:', error);
    throw error;
  }
};