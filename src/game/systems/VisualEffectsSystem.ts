// ALTTP-Style Visual Effects System
// Provides authentic 16-bit visual effects including sparkles, screen shake, 
// transitions, and particle effects with performance optimization

import Phaser from 'phaser';
import { TILE_SIZE } from '@shared/constants.js';
import { gameEvents } from '@shared/events.js';

// Effect types and interfaces
export interface EffectParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  color: number;
  alpha: number;
  type: ParticleType;
  active: boolean;
}

export enum ParticleType {
  SPARKLE = 'sparkle',
  DUST = 'dust',
  MAGIC = 'magic',
  RIPPLE = 'ripple',
  FLAME = 'flame',
  SPLASH = 'splash',
  GLINT = 'glint'
}

export enum TransitionType {
  FADE_TO_BLACK = 'fade_to_black',
  DIAMOND_WIPE = 'diamond_wipe',
  CIRCLE_EXPAND = 'circle_expand',
  SLICE_LEFT = 'slice_left',
  SLICE_RIGHT = 'slice_right',
  FLASH_WHITE = 'flash_white',
  REALM_SWITCH = 'realm_switch'
}

export interface ScreenShakeConfig {
  intensity: number;
  duration: number;
  frequency: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}

export interface TransitionConfig {
  type: TransitionType;
  duration: number;
  color?: number;
  onComplete?: () => void;
}

export class VisualEffectsSystem {
  private scene: Phaser.Scene;
  private particlePool: EffectParticle[] = [];
  private activeParticles: EffectParticle[] = [];
  private particleGraphics!: Phaser.GameObjects.Graphics;
  
  // Screen shake state
  private shakeOffset = { x: 0, y: 0 };
  private shakeTimer = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private shakeFrequency = 0;
  private shakeDirection: 'horizontal' | 'vertical' | 'both' = 'both';
  
  // Transition state
  private transitionActive = false;
  private transitionGraphics!: Phaser.GameObjects.Graphics;
  private transitionTimer = 0;
  private transitionDuration = 0;
  private currentTransition: TransitionType | null = null;
  private transitionCallback: (() => void) | null = null;
  
  // Effect layers
  private backgroundEffectsLayer!: Phaser.GameObjects.Group;
  private foregroundEffectsLayer!: Phaser.GameObjects.Group;
  private uiEffectsLayer!: Phaser.GameObjects.Group;
  
  // Performance tracking
  private maxParticles = 200;
  private particleUpdateCount = 0;
  private effectsEnabled = true;
  
  // Preset effect configurations
  private effectPresets = {
    itemCollection: {
      count: 12,
      colors: [0xFFD700, 0xFFA500, 0xFFFF00, 0xFFFFF0],
      duration: 800,
      spread: 32,
      type: ParticleType.SPARKLE
    },
    heartCollection: {
      count: 8,
      colors: [0xFF69B4, 0xFF1493, 0xFFB6C1, 0xFFC0CB],
      duration: 1000,
      spread: 24,
      type: ParticleType.GLINT
    },
    rupeeCollection: {
      count: 6,
      colors: [0x00FF00, 0x32CD32, 0x90EE90],
      duration: 600,
      spread: 20,
      type: ParticleType.SPARKLE
    },
    magicCast: {
      count: 15,
      colors: [0x9932CC, 0xBA55D3, 0xDDA0DD, 0xE6E6FA],
      duration: 1200,
      spread: 40,
      type: ParticleType.MAGIC
    },
    swordStrike: {
      count: 8,
      colors: [0xFFFFFF, 0xF0F8FF, 0xE6E6FA],
      duration: 300,
      spread: 16,
      type: ParticleType.DUST
    }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialize();
    this.setupEventListeners();
  }

  private initialize(): void {
    // Create effect layers
    this.backgroundEffectsLayer = this.scene.add.group();
    this.foregroundEffectsLayer = this.scene.add.group();
    this.uiEffectsLayer = this.scene.add.group();
    
    // Create graphics objects
    this.particleGraphics = this.scene.add.graphics();
    this.transitionGraphics = this.scene.add.graphics();
    
    // Set proper depth for layering
    this.backgroundEffectsLayer.setDepth(10);
    this.foregroundEffectsLayer.setDepth(1000);
    this.uiEffectsLayer.setDepth(2000);
    this.transitionGraphics.setDepth(5000);
    
    // Initialize particle pool
    this.initializeParticlePool();
    
    console.log('VisualEffectsSystem: Initialized with ALTTP-style effects');
  }

  private initializeParticlePool(): void {
    // Pre-allocate particles for performance
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  private createParticle(): EffectParticle {
    return {
      id: `particle_${Date.now()}_${Math.random()}`,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1000,
      scale: 1,
      rotation: 0,
      rotationSpeed: 0,
      color: 0xffffff,
      alpha: 1,
      type: ParticleType.SPARKLE,
      active: false
    };
  }

  private setupEventListeners(): void {
    // Item collection effects
    gameEvents.on('inventory.item.collected', (event: any) => {
      this.playItemCollectionEffect(event.payload.position, event.payload.itemType);
    });
    
    // Combat effects
    gameEvents.on('combat.hit', (event: any) => {
      this.playHitEffect(event.payload.position, event.payload.damage);
    });
    
    // Realm switching effects
    gameEvents.on('world.realm.switch', (event: any) => {
      this.playRealmSwitchEffect(event.payload.fromRealm, event.payload.toRealm);
    });
    
    // Scene transitions
    gameEvents.on('scene.transition.start', (event: any) => {
      this.startTransition(event.payload.type, event.payload.duration, event.payload.onComplete);
    });
    
    // Screen shake requests
    gameEvents.on('effects.screen.shake', (event: any) => {
      this.startScreenShake(event.payload);
    });
    
    // Magic and special effects
    gameEvents.on('effects.magic.cast', (event: any) => {
      this.playMagicEffect(event.payload.position, event.payload.spellType);
    });
    
    // Environmental interaction effects
    gameEvents.on('effects.interaction', (event: any) => {
      this.playInteractionEffect(event.payload.position, event.payload.type);
    });
  }

  // Main update loop
  update(deltaTime: number): void {
    if (!this.effectsEnabled) return;
    
    this.updateScreenShake(deltaTime);
    this.updateParticles(deltaTime);
    this.updateTransitions(deltaTime);
    this.renderEffects();
  }

  // Screen Shake System
  startScreenShake(config: ScreenShakeConfig): void {
    this.shakeTimer = 0;
    this.shakeDuration = config.duration;
    this.shakeIntensity = config.intensity;
    this.shakeFrequency = config.frequency;
    this.shakeDirection = config.direction || 'both';
    
    console.log(`Screen shake: ${config.intensity} intensity for ${config.duration}ms`);
  }

  private updateScreenShake(deltaTime: number): void {
    if (this.shakeTimer >= this.shakeDuration) {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      return;
    }
    
    this.shakeTimer += deltaTime * 1000; // Convert to ms
    const progress = this.shakeTimer / this.shakeDuration;
    const intensity = this.shakeIntensity * (1 - progress); // Decay over time
    
    // Generate shake offset based on frequency
    const shakeAmount = Math.sin(this.shakeTimer * this.shakeFrequency * 0.1) * intensity;
    
    switch (this.shakeDirection) {
      case 'horizontal':
        this.shakeOffset.x = shakeAmount;
        this.shakeOffset.y = 0;
        break;
      case 'vertical':
        this.shakeOffset.x = 0;
        this.shakeOffset.y = shakeAmount;
        break;
      case 'both':
        this.shakeOffset.x = shakeAmount * Math.cos(this.shakeTimer * 0.02);
        this.shakeOffset.y = shakeAmount * Math.sin(this.shakeTimer * 0.02);
        break;
    }
    
    // Apply shake to camera
    this.scene.cameras.main.setScroll(
      this.scene.cameras.main.scrollX + this.shakeOffset.x,
      this.scene.cameras.main.scrollY + this.shakeOffset.y
    );
  }

  // Particle System
  private spawnParticle(config: {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    life?: number;
    color?: number;
    type?: ParticleType;
    scale?: number;
    rotation?: number;
    rotationSpeed?: number;
  }): EffectParticle | null {
    const particle = this.getParticleFromPool();
    if (!particle) return null;
    
    particle.x = config.x;
    particle.y = config.y;
    particle.vx = config.vx || 0;
    particle.vy = config.vy || 0;
    particle.life = 0;
    particle.maxLife = config.life || 1000;
    particle.color = config.color || 0xffffff;
    particle.type = config.type || ParticleType.SPARKLE;
    particle.scale = config.scale || 1;
    particle.rotation = config.rotation || 0;
    particle.rotationSpeed = config.rotationSpeed || 0;
    particle.alpha = 1;
    particle.active = true;
    
    this.activeParticles.push(particle);
    return particle;
  }

  private getParticleFromPool(): EffectParticle | null {
    return this.particlePool.pop() || null;
  }

  private returnParticleToPool(particle: EffectParticle): void {
    particle.active = false;
    this.particlePool.push(particle);
  }

  private updateParticles(deltaTime: number): void {
    this.particleUpdateCount = 0;
    
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];
      
      if (!particle.active) {
        this.activeParticles.splice(i, 1);
        continue;
      }
      
      // Update particle physics
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.rotation += particle.rotationSpeed * deltaTime;
      particle.life += deltaTime * 1000;
      
      // Apply gravity/forces based on particle type
      this.applyParticleForces(particle, deltaTime);
      
      // Update alpha based on life
      const lifeProgress = particle.life / particle.maxLife;
      particle.alpha = Math.max(0, 1 - lifeProgress);
      
      // Remove expired particles
      if (particle.life >= particle.maxLife || particle.alpha <= 0) {
        this.activeParticles.splice(i, 1);
        this.returnParticleToPool(particle);
      }
      
      this.particleUpdateCount++;
    }
  }

  private applyParticleForces(particle: EffectParticle, deltaTime: number): void {
    switch (particle.type) {
      case ParticleType.SPARKLE:
        // Sparkles float upward and slow down
        particle.vy -= 20 * deltaTime;
        particle.vx *= 0.98;
        particle.vy *= 0.95;
        break;
        
      case ParticleType.DUST:
        // Dust settles downward
        particle.vy += 30 * deltaTime;
        particle.vx *= 0.95;
        break;
        
      case ParticleType.MAGIC:
        // Magic particles spiral and float
        const time = particle.life * 0.01;
        particle.vx += Math.cos(time) * 10 * deltaTime;
        particle.vy += Math.sin(time) * 10 * deltaTime - 15 * deltaTime;
        break;
        
      case ParticleType.RIPPLE:
        // Ripples expand outward
        particle.scale += deltaTime * 2;
        break;
        
      case ParticleType.FLAME:
        // Flames flicker upward
        particle.vy -= 50 * deltaTime;
        particle.vx += (Math.random() - 0.5) * 20 * deltaTime;
        break;
        
      case ParticleType.SPLASH:
        // Water splash with gravity
        particle.vy += 80 * deltaTime;
        particle.vx *= 0.98;
        break;
        
      case ParticleType.GLINT:
        // Glints fade in place
        particle.vx *= 0.9;
        particle.vy *= 0.9;
        break;
    }
  }

  // Specific Effect Implementations
  playItemCollectionEffect(position: { x: number; y: number }, itemType: string): void {
    let preset = this.effectPresets.itemCollection;
    
    // Use specific presets for certain items
    if (itemType.includes('heart')) {
      preset = this.effectPresets.heartCollection;
    } else if (itemType.includes('rupee') || itemType.includes('currency')) {
      preset = this.effectPresets.rupeeCollection;
    }
    
    // Spawn sparkle particles
    for (let i = 0; i < preset.count; i++) {
      const angle = (i / preset.count) * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      const distance = Math.random() * preset.spread;
      
      this.spawnParticle({
        x: position.x + Math.cos(angle) * distance,
        y: position.y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: preset.duration + Math.random() * 200,
        color: preset.colors[Math.floor(Math.random() * preset.colors.length)],
        type: preset.type,
        scale: 0.5 + Math.random() * 0.5,
        rotationSpeed: (Math.random() - 0.5) * 5
      });
    }
    
    // Add screen flash for important items
    if (itemType.includes('heart') || itemType.includes('key')) {
      this.flashScreen(0xFFFFFF, 100, 0.3);
    }
    
    console.log(`Item collection effect: ${itemType} at (${position.x}, ${position.y})`);
  }

  playHitEffect(position: { x: number; y: number }, damage: number): void {
    // Screen shake intensity based on damage
    const shakeIntensity = Math.min(10, damage * 2);
    this.startScreenShake({
      intensity: shakeIntensity,
      duration: 200,
      frequency: 30,
      direction: 'both'
    });
    
    // Impact particles
    const particleCount = Math.min(8, Math.max(3, damage));
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 30;
      
      this.spawnParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300,
        color: damage > 2 ? 0xFF4444 : 0xFFFFFF,
        type: ParticleType.DUST,
        scale: 0.8,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    // Flash effect for critical hits
    if (damage > 3) {
      this.flashScreen(0xFF0000, 80, 0.4);
    }
  }

  playRealmSwitchEffect(fromRealm: string, toRealm: string): void {
    // Create a unique transition effect for realm switching
    const transitionDuration = 600;
    
    // Diamond wipe transition
    this.startTransition(TransitionType.REALM_SWITCH, transitionDuration);
    
    // Spawn magical particles during transition
    setTimeout(() => {
      const centerX = this.scene.cameras.main.centerX;
      const centerY = this.scene.cameras.main.centerY;
      
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 50 + i * 10;
        
        this.spawnParticle({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: Math.cos(angle) * 30,
          vy: Math.sin(angle) * 30,
          life: 800,
          color: toRealm === 'eclipse' ? 0x9932CC : 0xFFD700,
          type: ParticleType.MAGIC,
          scale: 1,
          rotationSpeed: 3
        });
      }
    }, transitionDuration / 2);
    
    console.log(`Realm switch effect: ${fromRealm} -> ${toRealm}`);
  }

  playMagicEffect(position: { x: number; y: number }, spellType: string): void {
    const config = this.effectPresets.magicCast;
    
    // Spawn magic particles
    for (let i = 0; i < config.count; i++) {
      const angle = (i / config.count) * Math.PI * 2;
      const speed = 20 + Math.random() * 30;
      
      this.spawnParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20, // Upward bias
        life: config.duration,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        type: ParticleType.MAGIC,
        scale: 0.6 + Math.random() * 0.4,
        rotationSpeed: 2
      });
    }
    
    // Add magical flash
    this.flashScreen(0x9932CC, 150, 0.2);
  }

  playInteractionEffect(position: { x: number; y: number }, interactionType: string): void {
    // Different effects based on interaction type
    switch (interactionType) {
      case 'door_open':
        this.spawnDoorEffect(position);
        break;
      case 'chest_open':
        this.spawnChestEffect(position);
        break;
      case 'switch_activate':
        this.spawnSwitchEffect(position);
        break;
      case 'water_splash':
        this.spawnWaterEffect(position);
        break;
      default:
        this.spawnGenericInteractionEffect(position);
        break;
    }
  }

  private spawnDoorEffect(position: { x: number; y: number }): void {
    // Dust particles as door opens
    for (let i = 0; i < 6; i++) {
      this.spawnParticle({
        x: position.x + (Math.random() - 0.5) * TILE_SIZE,
        y: position.y + Math.random() * TILE_SIZE,
        vx: (Math.random() - 0.5) * 40,
        vy: -20 - Math.random() * 20,
        life: 500,
        color: 0xD2B48C,
        type: ParticleType.DUST,
        scale: 0.4
      });
    }
  }

  private spawnChestEffect(position: { x: number; y: number }): void {
    // Golden sparkles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = 40 + Math.random() * 20;
      
      this.spawnParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 800,
        color: 0xFFD700,
        type: ParticleType.SPARKLE,
        scale: 0.8,
        rotationSpeed: 4
      });
    }
    
    // Screen flash
    this.flashScreen(0xFFD700, 120, 0.25);
  }

  private spawnSwitchEffect(position: { x: number; y: number }): void {
    // Electric-like effect
    for (let i = 0; i < 8; i++) {
      this.spawnParticle({
        x: position.x + (Math.random() - 0.5) * 8,
        y: position.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 60,
        vy: -10 - Math.random() * 20,
        life: 300,
        color: 0x00FFFF,
        type: ParticleType.GLINT,
        scale: 0.3,
        rotationSpeed: 8
      });
    }
  }

  private spawnWaterEffect(position: { x: number; y: number }): void {
    // Water splash particles
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      
      this.spawnParticle({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 600,
        color: 0x4A7BCA,
        type: ParticleType.SPLASH,
        scale: 0.5,
        rotationSpeed: 2
      });
    }
  }

  private spawnGenericInteractionEffect(position: { x: number; y: number }): void {
    // Simple sparkle effect
    for (let i = 0; i < 4; i++) {
      this.spawnParticle({
        x: position.x + (Math.random() - 0.5) * 12,
        y: position.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 10,
        life: 400,
        color: 0xFFFFFF,
        type: ParticleType.GLINT,
        scale: 0.6
      });
    }
  }

  // Transition System
  startTransition(type: TransitionType, duration: number, onComplete?: () => void): void {
    if (this.transitionActive) return;
    
    this.transitionActive = true;
    this.currentTransition = type;
    this.transitionTimer = 0;
    this.transitionDuration = duration;
    this.transitionCallback = onComplete || null;
    
    console.log(`Starting transition: ${type} for ${duration}ms`);
  }

  private updateTransitions(deltaTime: number): void {
    if (!this.transitionActive || !this.currentTransition) return;
    
    this.transitionTimer += deltaTime * 1000;
    const progress = Math.min(1, this.transitionTimer / this.transitionDuration);
    
    // Render transition based on type
    this.renderTransition(this.currentTransition, progress);
    
    // Complete transition
    if (progress >= 1) {
      this.transitionActive = false;
      if (this.transitionCallback) {
        this.transitionCallback();
      }
      this.transitionGraphics.clear();
      this.currentTransition = null;
    }
  }

  private renderTransition(type: TransitionType, progress: number): void {
    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    this.transitionGraphics.clear();
    
    switch (type) {
      case TransitionType.FADE_TO_BLACK:
        this.transitionGraphics.fillStyle(0x000000, progress);
        this.transitionGraphics.fillRect(0, 0, width, height);
        break;
        
      case TransitionType.DIAMOND_WIPE:
        const maxRadius = Math.sqrt(width * width + height * height);
        const currentRadius = maxRadius * (1 - progress);
        
        this.transitionGraphics.fillStyle(0x000000);
        this.transitionGraphics.fillRect(0, 0, width, height);
        
        // Create diamond-shaped hole
        this.transitionGraphics.beginPath();
        this.transitionGraphics.moveTo(centerX, centerY - currentRadius);
        this.transitionGraphics.lineTo(centerX + currentRadius, centerY);
        this.transitionGraphics.lineTo(centerX, centerY + currentRadius);
        this.transitionGraphics.lineTo(centerX - currentRadius, centerY);
        this.transitionGraphics.closePath();
        
        this.transitionGraphics.fillStyle(0x000000, 0);
        this.transitionGraphics.fillPath();
        break;
        
      case TransitionType.CIRCLE_EXPAND:
        const circleRadius = Math.sqrt(width * width + height * height) * progress;
        
        this.transitionGraphics.fillStyle(0x000000);
        this.transitionGraphics.fillRect(0, 0, width, height);
        this.transitionGraphics.fillStyle(0x000000, 0);
        this.transitionGraphics.fillCircle(centerX, centerY, circleRadius);
        break;
        
      case TransitionType.REALM_SWITCH:
        // Custom realm switch effect with color cycling
        const colors = [0x9932CC, 0xFFD700, 0x4A7BCA];
        const colorIndex = Math.floor(progress * colors.length);
        const color = colors[Math.min(colorIndex, colors.length - 1)];
        
        this.transitionGraphics.fillStyle(color, 0.3 * Math.sin(progress * Math.PI));
        this.transitionGraphics.fillRect(0, 0, width, height);
        break;
        
      case TransitionType.FLASH_WHITE:
        const flashAlpha = Math.sin(progress * Math.PI);
        this.transitionGraphics.fillStyle(0xFFFFFF, flashAlpha);
        this.transitionGraphics.fillRect(0, 0, width, height);
        break;
    }
  }

  // Flash Effect
  flashScreen(color: number = 0xFFFFFF, duration: number = 100, intensity: number = 0.5): void {
    const graphics = this.scene.add.graphics();
    graphics.setDepth(4999);
    graphics.fillStyle(color, intensity);
    graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
    
    // Fade out flash
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        graphics.destroy();
      }
    });
  }

  // Particle Rendering
  private renderEffects(): void {
    this.particleGraphics.clear();
    
    for (const particle of this.activeParticles) {
      this.renderParticle(particle);
    }
  }

  private renderParticle(particle: EffectParticle): void {
    const camera = this.scene.cameras.main;
    const x = particle.x - camera.scrollX;
    const y = particle.y - camera.scrollY;
    
    // Cull particles outside viewport
    if (x < -20 || x > camera.width + 20 || y < -20 || y > camera.height + 20) {
      return;
    }
    
    this.particleGraphics.save();
    this.particleGraphics.translateCanvas(x, y);
    this.particleGraphics.rotateCanvas(particle.rotation);
    this.particleGraphics.scaleCanvas(particle.scale, particle.scale);
    
    // Render based on particle type
    switch (particle.type) {
      case ParticleType.SPARKLE:
        this.renderSparkle(particle);
        break;
      case ParticleType.DUST:
        this.renderDust(particle);
        break;
      case ParticleType.MAGIC:
        this.renderMagic(particle);
        break;
      case ParticleType.RIPPLE:
        this.renderRipple(particle);
        break;
      case ParticleType.FLAME:
        this.renderFlame(particle);
        break;
      case ParticleType.SPLASH:
        this.renderSplash(particle);
        break;
      case ParticleType.GLINT:
        this.renderGlint(particle);
        break;
    }
    
    this.particleGraphics.restore();
  }

  private renderSparkle(particle: EffectParticle): void {
    this.particleGraphics.fillStyle(particle.color, particle.alpha);
    
    // Draw 4-pointed star
    this.particleGraphics.beginPath();
    this.particleGraphics.moveTo(0, -4);
    this.particleGraphics.lineTo(1, -1);
    this.particleGraphics.lineTo(4, 0);
    this.particleGraphics.lineTo(1, 1);
    this.particleGraphics.lineTo(0, 4);
    this.particleGraphics.lineTo(-1, 1);
    this.particleGraphics.lineTo(-4, 0);
    this.particleGraphics.lineTo(-1, -1);
    this.particleGraphics.closePath();
    this.particleGraphics.fillPath();
  }

  private renderDust(particle: EffectParticle): void {
    this.particleGraphics.fillStyle(particle.color, particle.alpha * 0.7);
    this.particleGraphics.fillCircle(0, 0, 2);
  }

  private renderMagic(particle: EffectParticle): void {
    // Pulsing magical orb
    const pulseScale = 1 + Math.sin(particle.life * 0.01) * 0.3;
    this.particleGraphics.fillStyle(particle.color, particle.alpha);
    this.particleGraphics.fillCircle(0, 0, 3 * pulseScale);
    
    // Add inner glow
    this.particleGraphics.fillStyle(0xFFFFFF, particle.alpha * 0.5);
    this.particleGraphics.fillCircle(0, 0, 1.5 * pulseScale);
  }

  private renderRipple(particle: EffectParticle): void {
    this.particleGraphics.lineStyle(2, particle.color, particle.alpha);
    this.particleGraphics.strokeCircle(0, 0, particle.scale * 5);
  }

  private renderFlame(particle: EffectParticle): void {
    // Flame-like shape
    this.particleGraphics.fillStyle(particle.color, particle.alpha);
    this.particleGraphics.beginPath();
    this.particleGraphics.moveTo(0, -6);
    this.particleGraphics.lineTo(2, -2);
    this.particleGraphics.lineTo(3, 2);
    this.particleGraphics.lineTo(0, 4);
    this.particleGraphics.lineTo(-3, 2);
    this.particleGraphics.lineTo(-2, -2);
    this.particleGraphics.closePath();
    this.particleGraphics.fillPath();
  }

  private renderSplash(particle: EffectParticle): void {
    this.particleGraphics.fillStyle(particle.color, particle.alpha);
    this.particleGraphics.fillEllipse(0, 0, 3, 5);
  }

  private renderGlint(particle: EffectParticle): void {
    // Plus-shaped glint
    this.particleGraphics.fillStyle(particle.color, particle.alpha);
    this.particleGraphics.fillRect(-4, -1, 8, 2);
    this.particleGraphics.fillRect(-1, -4, 2, 8);
  }

  // Environmental Effects
  createTorchFlame(x: number, y: number): void {
    // Continuously spawn flame particles for torch effect
    const spawnFlame = () => {
      if (!this.effectsEnabled) return;
      
      this.spawnParticle({
        x: x + (Math.random() - 0.5) * 4,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: -30 - Math.random() * 20,
        life: 500 + Math.random() * 200,
        color: Math.random() > 0.5 ? 0xFF6B47 : 0xFFD700,
        type: ParticleType.FLAME,
        scale: 0.8 + Math.random() * 0.4
      });
    };
    
    // Spawn flame particles at intervals
    spawnFlame();
    setTimeout(() => spawnFlame(), 100 + Math.random() * 100);
  }

  createWaterSparkles(x: number, y: number, width: number, height: number): void {
    // Ambient water sparkles
    if (Math.random() < 0.02) { // Low frequency
      this.spawnParticle({
        x: x + Math.random() * width,
        y: y + Math.random() * height,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 800 + Math.random() * 400,
        color: 0x87CEEB,
        type: ParticleType.GLINT,
        scale: 0.3 + Math.random() * 0.2
      });
    }
  }

  // Public API
  setEnabled(enabled: boolean): void {
    this.effectsEnabled = enabled;
    if (!enabled) {
      this.clearAllEffects();
    }
  }

  clearAllEffects(): void {
    this.activeParticles.forEach(particle => {
      this.returnParticleToPool(particle);
    });
    this.activeParticles.length = 0;
    this.particleGraphics.clear();
  }

  getPerformanceMetrics(): object {
    return {
      activeParticles: this.activeParticles.length,
      poolSize: this.particlePool.length,
      particleUpdatesPerFrame: this.particleUpdateCount,
      effectsEnabled: this.effectsEnabled,
      transitionActive: this.transitionActive
    };
  }

  // Cleanup
  destroy(): void {
    this.clearAllEffects();
    this.particleGraphics.destroy();
    this.transitionGraphics.destroy();
    this.backgroundEffectsLayer.destroy();
    this.foregroundEffectsLayer.destroy();
    this.uiEffectsLayer.destroy();
    
    // Remove event listeners
    gameEvents.off('inventory.item.collected');
    gameEvents.off('combat.hit');
    gameEvents.off('world.realm.switch');
    gameEvents.off('scene.transition.start');
    gameEvents.off('effects.screen.shake');
    gameEvents.off('effects.magic.cast');
    gameEvents.off('effects.interaction');
    
    console.log('VisualEffectsSystem: Cleanup complete');
  }
}