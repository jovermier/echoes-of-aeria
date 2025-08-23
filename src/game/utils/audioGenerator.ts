// Audio Generator - Creates procedural music and sound effects
// Following Audio Designer specifications for SNES-style chiptune audio

export class AudioGenerator {
  private audioContext: AudioContext;
  private sampleRate: number = 44100;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // === MUSIC GENERATION ===

  /**
   * Generate background music for Hearthmere (peaceful town theme)
   * Style: Inspired by SNES-era RPG town themes, softer volume
   * Key: F major, Tempo: 96 BPM, 8-bit style square waves
   */
  async generateHearthmereTheme(): Promise<ArrayBuffer> {
    const duration = 48; // 48 second loop for better pacing
    const channels = 2; // Stereo
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const audioBuffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);
    
    // Musical parameters - slower, more peaceful
    const tempo = 96; // BPM (slower than before)
    const beatLength = (60 / tempo) * sampleRate;
    const measureLength = beatLength * 4;
    
    // Chord progression in F major: I-vi-ii-V (F-Dm-Gm-C) - very peaceful
    const chords = [
      [174.61, 220.00, 261.63], // F major (F-A-C)
      [146.83, 174.61, 220.00], // D minor (D-F-A)
      [196.00, 233.08, 293.66], // G minor (G-Bb-D)
      [261.63, 329.63, 392.00], // C major (C-E-G)
    ];
    
    // F major pentatonic scale for gentle melody
    const melodyScale = [174.61, 196.00, 220.00, 261.63, 293.66, 349.23]; // F pentatonic
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        const beatPosition = (i % measureLength) / beatLength;
        const chordIndex = Math.floor(beatPosition);
        const chord = chords[chordIndex % chords.length];
        const measureProgress = (i % measureLength) / measureLength;
        
        let sample = 0;
        
        // 8-bit style square wave bass (softer)
        const bassWeight = channel === 0 ? 0.12 : 0.08; // Much quieter
        const bassFreq = chord[0] * 0.5; // One octave down
        const bassSquare = Math.sign(Math.sin(2 * Math.PI * bassFreq * time));
        const bassEnv = Math.sin(measureProgress * Math.PI) * 0.7 + 0.3; // Gentle pulse
        sample += bassSquare * bassWeight * bassEnv;
        
        // Harmony chords with square wave character (very soft)
        for (let j = 0; j < chord.length; j++) {
          const harmonyWeight = 0.06; // Very quiet harmony
          const harmonySquare = Math.sign(Math.sin(2 * Math.PI * chord[j] * time));
          const harmonyPulse = Math.sin(beatPosition * Math.PI * 2) > 0.6 ? 1 : 0.4; // Rhythmic pulse
          sample += harmonySquare * harmonyWeight * harmonyPulse;
        }
        
        // Gentle melody line (8-bit style lead)
        const melodyWeight = channel === 1 ? 0.15 : 0.08; // Quieter melody
        const melodyNote = Math.floor((time * 0.5) % melodyScale.length); // Slower melody
        const melodyFreq = melodyScale[melodyNote];
        
        // Square wave melody with duty cycle variation
        const melodyPhase = (2 * Math.PI * melodyFreq * time) % (2 * Math.PI);
        const dutyCycle = 0.5 + 0.3 * Math.sin(time * 0.5); // Varying duty cycle
        const melodySquare = melodyPhase < (2 * Math.PI * dutyCycle) ? 1 : -1;
        
        // Gentle note timing
        const noteRhythm = Math.sin(time * tempo / 30) > -0.5 ? 1 : 0.2;
        sample += melodySquare * melodyWeight * noteRhythm * 
                 this.envelope(time % 2, 0.05, 0.1, 0.8, 0.2);
        
        // Soft high harmony (like SNES triangle wave)
        const highFreq = chord[2] * 2; // High octave
        const triangleWave = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * highFreq * time));
        sample += triangleWave * 0.04 * Math.sin(measureProgress * Math.PI);
        
        // Light percussion-like pulse (very subtle)
        if (beatPosition % 1 < 0.1) { // On beat
          const kickFreq = 60;
          sample += Math.sin(2 * Math.PI * kickFreq * time) * 0.03 * 
                   Math.exp(-(beatPosition % 1) * 20);
        }
        
        // 8-bit style low-pass filtering
        sample = this.lowPassFilter(sample, 0.8);
        
        // Very gentle master volume - much quieter than before
        channelData[i] = Math.max(-1, Math.min(1, sample * 0.25)); // Much lower volume
      }
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  /**
   * Generate exploration/field music - inspired by Link to the Past overworld
   * Style: Adventurous but not overwhelming, 8-bit square/triangle waves
   * Key: A minor, Tempo: 108 BPM
   */
  async generateExplorationTheme(): Promise<ArrayBuffer> {
    const duration = 32; // Shorter, tighter loop
    const channels = 2;
    const sampleRate = this.audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    
    const audioBuffer = this.audioContext.createBuffer(channels, frameCount, sampleRate);
    
    // A minor progression inspired by Zelda overworld: i-VII-VI-VII (Am-G-F-G)
    const chords = [
      [220.00, 261.63, 329.63], // A minor (A-C-E)
      [196.00, 246.94, 293.66], // G major (G-B-D)
      [174.61, 220.00, 261.63], // F major (F-A-C)
      [196.00, 246.94, 293.66], // G major (G-B-D)
    ];
    
    const tempo = 108; // Moderate adventure tempo
    const beatLength = (60 / tempo) * sampleRate;
    const measureLength = beatLength * 4;
    
    // A natural minor scale for melody (like Zelda)
    const melodyScale = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    
    for (let channel = 0; channel < channels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      
      for (let i = 0; i < frameCount; i++) {
        const time = i / sampleRate;
        const beatPosition = (i % measureLength) / beatLength;
        const chordIndex = Math.floor(beatPosition);
        const chord = chords[chordIndex % chords.length];
        const measureProgress = (i % measureLength) / measureLength;
        
        let sample = 0;
        
        // Driving 8-bit bass line (square wave, moderate volume)
        const bassWeight = channel === 0 ? 0.16 : 0.12;
        const bassFreq = chord[0] * 0.5; // Bass octave
        const bassSquare = Math.sign(Math.sin(2 * Math.PI * bassFreq * time));
        // Walking bass pattern
        const bassPattern = beatPosition % 1 < 0.5 ? 1 : 0.7;
        sample += bassSquare * bassWeight * bassPattern;
        
        // Adventure melody (square wave lead)
        const melodyWeight = channel === 1 ? 0.20 : 0.10;
        // Melody that moves more dynamically
        const melodyIndex = Math.floor((time * 1.5 + Math.sin(time * 0.3) * 2) % melodyScale.length);
        const melodyFreq = melodyScale[melodyIndex];
        
        const melodySquare = Math.sign(Math.sin(2 * Math.PI * melodyFreq * time));
        // Rhythmic melody pattern (like Zelda's dotted rhythms)
        const melodyRhythm = Math.sin(beatPosition * Math.PI * 4) > 0.2 ? 1 : 0.3;
        sample += melodySquare * melodyWeight * melodyRhythm *
                 this.envelope((beatPosition % 1), 0.02, 0.05, 0.9, 0.1);
        
        // Counter-melody in triangle wave (softer)
        const counterWeight = 0.08;
        const counterFreq = chord[1]; // Chord tone
        const triangleWave = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * counterFreq * time));
        const counterRhythm = Math.sin(beatPosition * Math.PI * 2 + Math.PI) > 0.5 ? 1 : 0;
        sample += triangleWave * counterWeight * counterRhythm;
        
        // Harmony chords (very soft, just for fullness)
        for (let j = 1; j < chord.length; j++) { // Skip bass note
          const harmonyWeight = 0.04;
          const harmonySquare = Math.sign(Math.sin(2 * Math.PI * chord[j] * time));
          const harmonyStab = beatPosition % 0.5 < 0.1 ? 1 : 0; // Staccato chords
          sample += harmonySquare * harmonyWeight * harmonyStab;
        }
        
        // Subtle high arpeggios (like SNES pulse channel)
        const arpWeight = 0.06;
        const arpNote = chord[beatPosition < 2 ? 0 : beatPosition < 3 ? 1 : 2];
        const arpFreq = arpNote * 2; // Higher octave
        const arpPulse = Math.sign(Math.sin(2 * Math.PI * arpFreq * time));
        const arpTiming = (beatPosition * 8) % 1 < 0.3 ? 1 : 0; // Quick arpeggios
        sample += arpPulse * arpWeight * arpTiming;
        
        // Light filtering for 8-bit character
        sample = this.lowPassFilter(sample, 0.85);
        
        // Moderate volume - adventure but not overwhelming
        channelData[i] = Math.max(-1, Math.min(1, sample * 0.32));
      }
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  // === SOUND EFFECTS GENERATION ===

  /**
   * Generate player footstep sound
   */
  generateFootstep(): ArrayBuffer {
    const duration = 0.15;
    const audioBuffer = this.createMonoBuffer(duration);
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = channelData.length;
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / this.audioContext.sampleRate;
      const t = time / duration;
      
      // Noise burst with frequency sweep (simulates grass/dirt)
      const noise = (Math.random() - 0.5) * 2;
      const freq = 100 + (150 * (1 - t)); // Sweep down from 250Hz to 100Hz
      const tone = Math.sin(2 * Math.PI * freq * time);
      
      // Mix noise and tone
      let sample = (noise * 0.6 + tone * 0.4) * this.envelope(t, 0.01, 0.05, 0.3, 0.6);
      
      // High-pass filter to remove mud
      sample = this.highPassFilter(sample, 0.3);
      
      channelData[i] = sample * 0.3;
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  /**
   * Generate sword attack sound
   */
  generateSwordAttack(): ArrayBuffer {
    const duration = 0.4;
    const audioBuffer = this.createMonoBuffer(duration);
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = channelData.length;
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / this.audioContext.sampleRate;
      const t = time / duration;
      
      // Whoosh sound - white noise with frequency sweep
      const noise = (Math.random() - 0.5) * 2;
      const freq = 800 + (1200 * Math.sin(t * Math.PI)); // Sweep up then down
      const whistle = Math.sin(2 * Math.PI * freq * time);
      
      // Sharp attack, quick decay
      const env = this.envelope(t, 0.02, 0.1, 0.2, 0.7);
      let sample = (noise * 0.7 + whistle * 0.3) * env;
      
      // Add metallic ring
      const metallic = Math.sin(2 * Math.PI * 2400 * time) * 0.2 * 
                      Math.exp(-t * 8); // Quick decay
      sample += metallic;
      
      channelData[i] = Math.max(-1, Math.min(1, sample * 0.5));
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  /**
   * Generate item pickup sound (positive/magical)
   */
  generateItemPickup(): ArrayBuffer {
    const duration = 0.8;
    const audioBuffer = this.createMonoBuffer(duration);
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = channelData.length;
    
    // Magical ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5-E5-G5-C6
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / this.audioContext.sampleRate;
      const t = time / duration;
      
      let sample = 0;
      
      // Arpeggio with each note triggered in sequence
      for (let j = 0; j < notes.length; j++) {
        const noteStart = j * 0.2;
        const noteEnd = noteStart + 0.6;
        
        if (t >= noteStart && t <= noteEnd) {
          const noteT = (t - noteStart) / (noteEnd - noteStart);
          const freq = notes[j];
          const noteEnv = this.envelope(noteT, 0.05, 0.1, 0.8, 0.3);
          
          // Pure sine with slight chorus effect
          sample += Math.sin(2 * Math.PI * freq * time) * noteEnv * 0.3;
          sample += Math.sin(2 * Math.PI * (freq + 2) * time) * noteEnv * 0.1; // Chorus
        }
      }
      
      // Add sparkle (high frequency content)
      const sparkle = Math.sin(2 * Math.PI * 3000 * time) * 0.1 * 
                     Math.sin(t * Math.PI * 8) * Math.exp(-t * 3);
      sample += sparkle;
      
      channelData[i] = Math.max(-1, Math.min(1, sample * 0.6));
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  /**
   * Generate UI button click sound
   */
  generateButtonClick(): ArrayBuffer {
    const duration = 0.1;
    const audioBuffer = this.createMonoBuffer(duration);
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = channelData.length;
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / this.audioContext.sampleRate;
      const t = time / duration;
      
      // Quick click - high frequency burst
      const freq1 = 1000;
      const freq2 = 800;
      
      const click1 = Math.sin(2 * Math.PI * freq1 * time);
      const click2 = Math.sin(2 * Math.PI * freq2 * time);
      
      const env = Math.exp(-t * 30); // Very quick decay
      let sample = (click1 + click2 * 0.5) * env * 0.4;
      
      channelData[i] = sample;
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  /**
   * Generate error/negative feedback sound
   */
  generateErrorSound(): ArrayBuffer {
    const duration = 0.6;
    const audioBuffer = this.createMonoBuffer(duration);
    const channelData = audioBuffer.getChannelData(0);
    const frameCount = channelData.length;
    
    for (let i = 0; i < frameCount; i++) {
      const time = i / this.audioContext.sampleRate;
      const t = time / duration;
      
      // Descending dissonant chord
      const freq1 = 400 * (1 - t * 0.3); // Descending
      const freq2 = 380 * (1 - t * 0.3); // Slightly detuned for dissonance
      const freq3 = 360 * (1 - t * 0.3);
      
      let sample = (Math.sin(2 * Math.PI * freq1 * time) +
                   Math.sin(2 * Math.PI * freq2 * time) +
                   Math.sin(2 * Math.PI * freq3 * time)) / 3;
      
      const env = this.envelope(t, 0.05, 0.2, 0.6, 0.3);
      sample *= env * 0.4;
      
      channelData[i] = sample;
    }
    
    return this.audioBufferToArrayBuffer(audioBuffer);
  }

  // === UTILITY METHODS ===

  private createMonoBuffer(duration: number): AudioBuffer {
    const frameCount = Math.floor(this.audioContext.sampleRate * duration);
    return this.audioContext.createBuffer(1, frameCount, this.audioContext.sampleRate);
  }

  private envelope(t: number, attack: number, decay: number, sustain: number, release: number): number {
    if (t < attack) {
      return t / attack; // Attack phase
    } else if (t < attack + decay) {
      return 1 - ((t - attack) / decay) * (1 - sustain); // Decay phase
    } else if (t < 1 - release) {
      return sustain; // Sustain phase
    } else {
      return sustain * (1 - (t - (1 - release)) / release); // Release phase
    }
  }

  private lowPassFilter(sample: number, cutoff: number): number {
    // Simple one-pole low-pass filter approximation
    return sample * cutoff;
  }

  private highPassFilter(sample: number, cutoff: number): number {
    // Simple high-pass filter approximation
    return sample * (1 - cutoff);
  }

  private audioBufferToArrayBuffer(audioBuffer: AudioBuffer): ArrayBuffer {
    const channels = audioBuffer.numberOfChannels;
    const frameCount = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create WAV file
    const bytesPerSample = 2; // 16-bit
    const dataSize = frameCount * channels * bytesPerSample;
    const bufferSize = 44 + dataSize; // WAV header size + data
    
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, bufferSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true); // Bits per sample
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data
    let offset = 44;
    for (let frame = 0; frame < frameCount; frame++) {
      for (let channel = 0; channel < channels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[frame];
        const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // === AUDIO FILE EXPORT ===

  /**
   * Generate all audio files and save them
   */
  async generateAllAudio(): Promise<void> {
    console.log('🎵 Generating game audio...');
    
    try {
      // Generate music
      console.log('Creating Hearthmere theme...');
      const hearthmereTheme = await this.generateHearthmereTheme();
      await this.saveAudioFile(hearthmereTheme, 'hearthmere.wav', 'music');
      
      console.log('Creating exploration theme...');
      const explorationTheme = await this.generateExplorationTheme();
      await this.saveAudioFile(explorationTheme, 'exploration.wav', 'music');
      
      // Generate sound effects
      console.log('Creating sound effects...');
      const footstep = this.generateFootstep();
      await this.saveAudioFile(footstep, 'footstep.wav', 'sfx');
      
      const swordAttack = this.generateSwordAttack();
      await this.saveAudioFile(swordAttack, 'sword_attack.wav', 'sfx');
      
      const itemPickup = this.generateItemPickup();
      await this.saveAudioFile(itemPickup, 'item_pickup.wav', 'sfx');
      
      const buttonClick = this.generateButtonClick();
      await this.saveAudioFile(buttonClick, 'button_click.wav', 'sfx');
      
      const errorSound = this.generateErrorSound();
      await this.saveAudioFile(errorSound, 'error.wav', 'sfx');
      
      console.log('✅ All audio files generated successfully!');
      
    } catch (error) {
      console.error('❌ Error generating audio:', error);
    }
  }

  private async saveAudioFile(audioData: ArrayBuffer, filename: string, type: 'music' | 'sfx'): Promise<void> {
    // In a real environment, you'd save to filesystem
    // For web environment, we'll store in a way the game can access
    const blob = new Blob([audioData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    // Store reference for game to use
    if (!(window as any).generatedAudio) {
      (window as any).generatedAudio = {};
    }
    (window as any).generatedAudio[`${type}/${filename}`] = url;
    
    console.log(`📀 Generated: ${type}/${filename}`);
  }
}