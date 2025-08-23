// Weather System - Adds atmospheric weather effects with ALTTP-style charm
// Integrates with VisualEffectsSystem for rain, snow, and fog particles

import { System } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@shared/constants.js';

export enum WeatherType {
  CLEAR = 'clear',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  STORM = 'storm',
  MIST = 'mist'
}

export interface WeatherConfig {
  type: WeatherType;
  intensity: number; // 0.1 to 1.0
  duration: number; // in milliseconds, 0 = indefinite
  windDirection: { x: number; y: number };
  particleCount: number;
  particleSpeed: number;
  particleSize: number;
  color: number;
  alpha: number;
}

export class WeatherSystem extends System {
  private scene: Phaser.Scene;
  private currentWeather: WeatherType = WeatherType.CLEAR;
  private weatherConfig: WeatherConfig | null = null;
  private weatherTimer = 0;
  private weatherDuration = 0;
  
  // Weather particle management
  private weatherParticles: Phaser.GameObjects.Graphics[] = [];
  private particlePool: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    alpha: number;
    active: boolean;
  }> = [];
  
  private activeWeatherParticles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    alpha: number;
    active: boolean;
  }> = [];
  
  // Weather presets
  private weatherPresets: Map<WeatherType, WeatherConfig> = new Map([
    [WeatherType.RAIN, {
      type: WeatherType.RAIN,
      intensity: 0.7,
      duration: 0, // Indefinite
      windDirection: { x: -0.2, y: 1 },
      particleCount: 80,
      particleSpeed: 200,
      particleSize: 2,
      color: 0x4A7BCA,
      alpha: 0.6
    }],
    [WeatherType.SNOW, {
      type: WeatherType.SNOW,
      intensity: 0.5,
      duration: 0,
      windDirection: { x: 0.1, y: 0.8 },
      particleCount: 60,
      particleSpeed: 50,
      particleSize: 3,
      color: 0xFFFFFF,
      alpha: 0.8
    }],
    [WeatherType.FOG, {
      type: WeatherType.FOG,
      intensity: 0.3,
      duration: 0,
      windDirection: { x: 0.5, y: 0 },
      particleCount: 40,
      particleSpeed: 20,
      particleSize: 8,
      color: 0xC0C0C0,
      alpha: 0.3
    }],
    [WeatherType.STORM, {
      type: WeatherType.STORM,
      intensity: 0.9,
      duration: 30000, // 30 seconds
      windDirection: { x: -0.6, y: 1.2 },
      particleCount: 120,
      particleSpeed: 300,
      particleSize: 1,
      color: 0x2C3E50,
      alpha: 0.7
    }],
    [WeatherType.MIST, {
      type: WeatherType.MIST,
      intensity: 0.4,
      duration: 0,
      windDirection: { x: 0.2, y: -0.1 },
      particleCount: 30,
      particleSpeed: 15,
      particleSize: 6,
      color: 0xE6F3FF,
      alpha: 0.4
    }]
  ]);
  
  // Automatic weather system
  private autoWeatherEnabled = false;
  private weatherChangeTimer = 0;
  private weatherChangeInterval = 120000; // Change weather every 2 minutes
  private possibleWeathers = [WeatherType.CLEAR, WeatherType.RAIN, WeatherType.SNOW, WeatherType.FOG, WeatherType.MIST];

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.initialize();
    this.setupEventHandlers();
  }

  private initialize(): void {
    // Initialize particle pool
    for (let i = 0; i < 150; i++) {
      this.particlePool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1000,
        size: 1,
        alpha: 1,
        active: false
      });
    }
    
    console.log('WeatherSystem: Initialized with atmospheric effects');
  }

  private setupEventHandlers(): void {
    // Handle weather change requests
    gameEvents.on('weather.change', (event: any) => {
      this.setWeather(event.payload.type, event.payload.duration);
    });
    
    // Handle auto weather toggle
    gameEvents.on('weather.auto.toggle', (event: any) => {
      this.autoWeatherEnabled = event.payload.enabled;
    });
    
    // Handle intensity changes
    gameEvents.on('weather.intensity', (event: any) => {
      if (this.weatherConfig) {
        this.weatherConfig.intensity = Math.max(0.1, Math.min(1.0, event.payload.intensity));
      }
    });
  }

  update(deltaTime: number): void {
    this.updateWeatherTimer(deltaTime);
    this.updateAutoWeather(deltaTime);
    this.updateWeatherParticles(deltaTime);
    this.spawnWeatherParticles(deltaTime);
    this.renderWeatherEffects();
  }

  private updateWeatherTimer(deltaTime: number): void {
    if (this.weatherDuration > 0) {
      this.weatherTimer += deltaTime * 1000;
      
      if (this.weatherTimer >= this.weatherDuration) {
        this.setWeather(WeatherType.CLEAR);
      }
    }
  }

  private updateAutoWeather(deltaTime: number): void {
    if (!this.autoWeatherEnabled) return;
    
    this.weatherChangeTimer += deltaTime * 1000;
    
    if (this.weatherChangeTimer >= this.weatherChangeInterval) {
      const randomWeather = this.possibleWeathers[Math.floor(Math.random() * this.possibleWeathers.length)];
      this.setWeather(randomWeather, randomWeather === WeatherType.CLEAR ? 0 : 60000 + Math.random() * 120000);
      this.weatherChangeTimer = 0;
    }
  }

  private updateWeatherParticles(deltaTime: number): void {
    for (let i = this.activeWeatherParticles.length - 1; i >= 0; i--) {
      const particle = this.activeWeatherParticles[i];
      
      if (!particle.active) {
        this.activeWeatherParticles.splice(i, 1);
        continue;
      }
      
      // Update particle physics
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life += deltaTime * 1000;
      
      // Apply weather-specific effects
      this.applyWeatherForces(particle, deltaTime);
      
      // Update alpha based on life
      const lifeProgress = particle.life / particle.maxLife;
      particle.alpha = Math.max(0, 1 - lifeProgress);
      
      // Remove particles that are off screen or expired
      if (particle.x < -50 || particle.x > CANVAS_WIDTH + 50 ||
          particle.y < -50 || particle.y > CANVAS_HEIGHT + 50 ||
          particle.life >= particle.maxLife) {
        this.activeWeatherParticles.splice(i, 1);
        this.returnParticleToPool(particle);
      }
    }
  }

  private applyWeatherForces(particle: any, deltaTime: number): void {
    if (!this.weatherConfig) return;
    
    switch (this.currentWeather) {
      case WeatherType.RAIN:
      case WeatherType.STORM:
        // Rain falls straight down with slight wind drift
        particle.vy += 50 * deltaTime; // Gravity effect
        break;
        
      case WeatherType.SNOW:
        // Snow floats down slowly with more drift
        particle.vx += Math.sin(particle.life * 0.002) * 10 * deltaTime;
        break;
        
      case WeatherType.FOG:
      case WeatherType.MIST:
        // Fog drifts slowly and expands
        particle.size += deltaTime * 2;
        break;
    }
  }

  private spawnWeatherParticles(deltaTime: number): void {
    if (!this.weatherConfig || this.currentWeather === WeatherType.CLEAR) return;
    
    const spawnRate = this.weatherConfig.particleCount * this.weatherConfig.intensity * deltaTime;
    const particlesToSpawn = Math.floor(spawnRate + Math.random());
    
    for (let i = 0; i < particlesToSpawn && this.activeWeatherParticles.length < this.weatherConfig.particleCount; i++) {
      this.spawnWeatherParticle();
    }
  }

  private spawnWeatherParticle(): void {
    if (!this.weatherConfig) return;
    
    const particle = this.getParticleFromPool();
    if (!particle) return;
    
    // Spawn above screen with some random spread
    particle.x = -50 + Math.random() * (CANVAS_WIDTH + 100);
    particle.y = -50;
    particle.vx = this.weatherConfig.windDirection.x * this.weatherConfig.particleSpeed + (Math.random() - 0.5) * 20;
    particle.vy = this.weatherConfig.windDirection.y * this.weatherConfig.particleSpeed + (Math.random() - 0.5) * 10;
    particle.life = 0;
    particle.maxLife = 3000 + Math.random() * 2000;
    particle.size = this.weatherConfig.particleSize + (Math.random() - 0.5);
    particle.alpha = this.weatherConfig.alpha;
    particle.active = true;
    
    this.activeWeatherParticles.push(particle);
  }

  private getParticleFromPool(): any {
    return this.particlePool.pop() || null;
  }

  private returnParticleToPool(particle: any): void {
    particle.active = false;
    this.particlePool.push(particle);
  }

  private renderWeatherEffects(): void {
    if (!this.weatherConfig || this.currentWeather === WeatherType.CLEAR) return;
    
    // Clear previous weather graphics
    this.clearWeatherGraphics();
    
    // Create graphics object for this frame
    const graphics = this.scene.add.graphics();
    graphics.setDepth(1500); // Above most game objects but below UI
    this.weatherParticles.push(graphics);
    
    // Render each weather particle
    for (const particle of this.activeWeatherParticles) {
      this.renderWeatherParticle(graphics, particle);
    }
    
    // Add screen overlay for atmospheric effect
    this.renderWeatherOverlay(graphics);
  }

  private renderWeatherParticle(graphics: Phaser.GameObjects.Graphics, particle: any): void {
    if (!this.weatherConfig) return;
    
    const camera = this.scene.cameras.main;
    const x = particle.x - camera.scrollX;
    const y = particle.y - camera.scrollY;
    
    // Don't render particles outside viewport
    if (x < -20 || x > camera.width + 20 || y < -20 || y > camera.height + 20) return;
    
    graphics.fillStyle(this.weatherConfig.color, particle.alpha * this.weatherConfig.intensity);
    
    switch (this.currentWeather) {
      case WeatherType.RAIN:
      case WeatherType.STORM:
        // Render rain as thin lines
        graphics.fillRect(x, y, 1, particle.size * 3);
        break;
        
      case WeatherType.SNOW:
        // Render snow as small circles
        graphics.fillCircle(x, y, particle.size);
        break;
        
      case WeatherType.FOG:
      case WeatherType.MIST:
        // Render fog as soft circles
        graphics.fillCircle(x, y, particle.size);
        break;
    }
  }

  private renderWeatherOverlay(graphics: Phaser.GameObjects.Graphics): void {
    if (!this.weatherConfig) return;
    
    // Add subtle screen overlay for atmospheric effect
    let overlayAlpha = 0;
    let overlayColor = 0x000000;
    
    switch (this.currentWeather) {
      case WeatherType.RAIN:
        overlayAlpha = 0.1 * this.weatherConfig.intensity;
        overlayColor = 0x2C3E50;
        break;
        
      case WeatherType.STORM:
        overlayAlpha = 0.2 * this.weatherConfig.intensity;
        overlayColor = 0x1A1A2E;
        break;
        
      case WeatherType.SNOW:
        overlayAlpha = 0.05 * this.weatherConfig.intensity;
        overlayColor = 0xE8F4F8;
        break;
        
      case WeatherType.FOG:
      case WeatherType.MIST:
        overlayAlpha = 0.15 * this.weatherConfig.intensity;
        overlayColor = 0xF0F8FF;
        break;
    }
    
    if (overlayAlpha > 0) {
      graphics.fillStyle(overlayColor, overlayAlpha);
      graphics.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  private clearWeatherGraphics(): void {
    // Remove old weather graphics
    for (const graphics of this.weatherParticles) {
      graphics.destroy();
    }
    this.weatherParticles.length = 0;
  }

  // Public API
  setWeather(type: WeatherType, duration: number = 0): void {
    this.currentWeather = type;
    this.weatherTimer = 0;
    this.weatherDuration = duration;
    
    if (type === WeatherType.CLEAR) {
      this.weatherConfig = null;
      this.clearActiveParticles();
    } else {
      this.weatherConfig = this.weatherPresets.get(type) || null;
      if (this.weatherConfig && duration > 0) {
        this.weatherConfig.duration = duration;
      }
    }
    
    // Emit weather change event
    gameEvents.emit({
      type: 'weather.changed',
      payload: {
        type: this.currentWeather,
        duration,
        config: this.weatherConfig
      },
      timestamp: Date.now()
    });
    
    console.log(`Weather: Changed to ${type}${duration > 0 ? ` for ${duration}ms` : ' indefinitely'}`);
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  getWeatherConfig(): WeatherConfig | null {
    return this.weatherConfig;
  }

  setAutoWeather(enabled: boolean): void {
    this.autoWeatherEnabled = enabled;
    this.weatherChangeTimer = 0;
    
    if (enabled) {
      console.log('Weather: Auto weather system enabled');
    } else {
      console.log('Weather: Auto weather system disabled');
    }
  }

  isAutoWeatherEnabled(): boolean {
    return this.autoWeatherEnabled;
  }

  private clearActiveParticles(): void {
    // Return all active particles to pool
    for (const particle of this.activeWeatherParticles) {
      this.returnParticleToPool(particle);
    }
    this.activeWeatherParticles.length = 0;
  }

  // Performance metrics
  getPerformanceMetrics(): object {
    return {
      currentWeather: this.currentWeather,
      activeParticles: this.activeWeatherParticles.length,
      poolSize: this.particlePool.length,
      autoWeatherEnabled: this.autoWeatherEnabled,
      weatherTimer: this.weatherTimer,
      weatherDuration: this.weatherDuration
    };
  }

  // Cleanup
  destroy(): void {
    this.clearActiveParticles();
    this.clearWeatherGraphics();
    
    // Remove event listeners
    gameEvents.off('weather.change');
    gameEvents.off('weather.auto.toggle');
    gameEvents.off('weather.intensity');
    
    console.log('WeatherSystem: Cleanup complete');
  }
}