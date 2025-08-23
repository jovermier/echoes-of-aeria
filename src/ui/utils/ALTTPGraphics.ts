// ALTTP Graphics Generator - Authentic pixel-perfect UI graphics
// Generates classic A Link to the Past style interface elements

export class ALTTPGraphics {
  private static canvas: HTMLCanvasElement;
  private static ctx: CanvasRenderingContext2D;

  // Import authentic ALTTP colors from constants
  private static readonly COLORS = {
    // Heart colors (authentic ALTTP HUD)
    HEART_FULL: '#F83800',           // Full heart red
    HEART_HALF: '#F85800',           // Half heart orange
    HEART_EMPTY: '#381800',          // Empty heart dark
    HEART_OUTLINE: '#080808',        // Heart outline black
    
    // Rupee colors (authentic ALTTP gem colors)
    RUPEE_GREEN: '#00D800',          // Green rupee (1)
    RUPEE_BLUE: '#0080F8',           // Blue rupee (5)
    RUPEE_RED: '#F80000',            // Red rupee (20)
    RUPEE_YELLOW: '#F8D800',         // Yellow rupee (50)
    RUPEE_SILVER: '#C0C0C0',         // Silver rupee (100)
    RUPEE_GOLD: '#F8C040',           // Gold rupee (300)
    
    // UI Panel colors (ALTTP interface authentic)
    STONE_DARK: '#303030',           // UI panel shadows
    STONE_MEDIUM: '#606060',         // Base UI panel color
    STONE_LIGHT: '#909090',          // UI panel highlights
    STONE_HIGHLIGHT: '#B0B0B0',      // UI bright highlights
    
    // Border colors (ALTTP UI borders)
    BORDER_DARK: '#202020',          // Dark border
    BORDER_MEDIUM: '#505050',        // Medium border
    BORDER_LIGHT: '#A0A0A0',         // Light border
    
    // Background colors
    BG_DARK: '#101820',              // Dark background
    BG_MEDIUM: '#283040',            // Medium background
    BG_LIGHT: '#404860',             // Light background
    
    // Text colors (ALTTP authentic)
    TEXT_WHITE: '#F8F8F8',           // White text
    TEXT_YELLOW: '#F8F800',          // Yellow text (items/currency)
    TEXT_BLUE: '#4080F8',            // Blue text (items/magic)
    TEXT_RED: '#F84040',             // Red text (danger/health)
    TEXT_GREEN: '#40F840',           // Green text (success)
    TEXT_SHADOW: '#000000',          // Text shadow/outline
    
    // Special colors
    AETHER_BLUE: '#40C0F8',          // Aether shard blue
    MAGIC_PURPLE: '#C040F8',         // Magic purple
    ECLIPSE_PURPLE: '#6020A0',       // Eclipse realm purple
    DAYREALM_GOLD: '#F8C040'         // Dayrealm gold light
  } as const;

  private static ensureCanvas(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d')!;
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  /**
   * Generate authentic ALTTP heart container
   */
  static generateHeart(type: 'full' | 'half' | 'empty'): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 16;
    canvas.height = 16;
    ctx.imageSmoothingEnabled = false;

    // Heart pixel pattern (authentic ALTTP heart shape)
    const heartPattern = [
      '0000000000000000',
      '0000111001110000',
      '0011111111111100',
      '0111111111111110',
      '1111111111111111',
      '1111111111111111',
      '1111111111111111',
      '0111111111111110',
      '0011111111111100',
      '0001111111111000',
      '0000111111110000',
      '0000011111100000',
      '0000001111000000',
      '0000000110000000',
      '0000000000000000',
      '0000000000000000'
    ];

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pixel = heartPattern[y][x];
        if (pixel === '1') {
          let color: string;
          
          if (type === 'full') {
            color = this.COLORS.HEART_FULL;
          } else if (type === 'half' && x < 8) {
            color = this.COLORS.HEART_HALF;
          } else if (type === 'half') {
            color = this.COLORS.HEART_EMPTY;
          } else {
            color = this.COLORS.HEART_EMPTY;
          }
          
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        } else if (pixel === '0' && type !== 'full') {
          // Add outline for empty/half hearts
          const hasNeighbor = 
            (y > 0 && heartPattern[y - 1][x] === '1') ||
            (y < 15 && heartPattern[y + 1][x] === '1') ||
            (x > 0 && heartPattern[y][x - 1] === '1') ||
            (x < 15 && heartPattern[y][x + 1] === '1');
            
          if (hasNeighbor) {
            ctx.fillStyle = this.COLORS.HEART_OUTLINE;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    return canvas;
  }

  /**
   * Generate ALTTP-style rupee icon
   */
  static generateRupee(color: 'green' | 'blue' | 'red' | 'yellow' = 'green'): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 16;
    canvas.height = 16;
    ctx.imageSmoothingEnabled = false;

    const colorMap = {
      green: this.COLORS.RUPEE_GREEN,
      blue: this.COLORS.RUPEE_BLUE,
      red: this.COLORS.RUPEE_RED,
      yellow: this.COLORS.RUPEE_YELLOW
    };

    // Rupee diamond pattern
    const rupeePattern = [
      '0000000110000000',
      '0000001111000000',
      '0000011111100000',
      '0000111111110000',
      '0001111111111000',
      '0011111111111100',
      '0111111111111110',
      '1111111111111111',
      '0111111111111110',
      '0011111111111100',
      '0001111111111000',
      '0000111111110000',
      '0000011111100000',
      '0000001111000000',
      '0000000110000000',
      '0000000000000000'
    ];

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (rupeePattern[y][x] === '1') {
          ctx.fillStyle = colorMap[color];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas;
  }

  /**
   * Generate ALTTP-style stone panel texture
   */
  static generateStonePanel(width: number, height: number, inset: boolean = false): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    // Fill with stone gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (inset) {
      gradient.addColorStop(0, this.COLORS.STONE_DARK);
      gradient.addColorStop(0.5, this.COLORS.STONE_MEDIUM);
      gradient.addColorStop(1, this.COLORS.STONE_LIGHT);
    } else {
      gradient.addColorStop(0, this.COLORS.STONE_LIGHT);
      gradient.addColorStop(0.5, this.COLORS.STONE_MEDIUM);
      gradient.addColorStop(1, this.COLORS.STONE_DARK);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add stone texture noise
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (Math.random() > 0.7) {
          ctx.fillStyle = Math.random() > 0.5 ? this.COLORS.STONE_HIGHLIGHT : this.COLORS.STONE_DARK;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas;
  }

  /**
   * Generate ALTTP-style button
   */
  static generateButton(width: number, height: number, pressed: boolean = false): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    // Button face
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    if (pressed) {
      gradient.addColorStop(0, this.COLORS.STONE_DARK);
      gradient.addColorStop(1, this.COLORS.STONE_MEDIUM);
    } else {
      gradient.addColorStop(0, this.COLORS.STONE_LIGHT);
      gradient.addColorStop(1, this.COLORS.STONE_MEDIUM);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(2, 2, width - 4, height - 4);

    // Borders
    const lightColor = pressed ? this.COLORS.BORDER_DARK : this.COLORS.BORDER_LIGHT;
    const darkColor = pressed ? this.COLORS.BORDER_LIGHT : this.COLORS.BORDER_DARK;

    // Top and left borders (light when not pressed)
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, width, 2); // top
    ctx.fillRect(0, 0, 2, height); // left

    // Bottom and right borders (dark when not pressed)
    ctx.fillStyle = darkColor;
    ctx.fillRect(0, height - 2, width, 2); // bottom
    ctx.fillRect(width - 2, 0, 2, height); // right

    // Inner borders
    ctx.fillStyle = this.COLORS.BORDER_MEDIUM;
    ctx.fillRect(1, 1, width - 2, 1); // inner top
    ctx.fillRect(1, 1, 1, height - 2); // inner left
    ctx.fillRect(1, height - 2, width - 2, 1); // inner bottom
    ctx.fillRect(width - 2, 1, 1, height - 2); // inner right

    return canvas;
  }

  /**
   * Generate ALTTP-style item slot
   */
  static generateItemSlot(size: number = 32, hasItem: boolean = false, selected: boolean = false): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = size;
    canvas.height = size;
    ctx.imageSmoothingEnabled = false;

    // Slot background
    const bgColor = selected ? this.COLORS.TEXT_YELLOW : 
                   hasItem ? this.COLORS.STONE_MEDIUM : this.COLORS.STONE_DARK;
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(2, 2, size - 4, size - 4);

    // Inset borders for slot
    ctx.fillStyle = this.COLORS.BORDER_DARK;
    ctx.fillRect(0, 0, size, 2); // top
    ctx.fillRect(0, 0, 2, size); // left

    ctx.fillStyle = this.COLORS.BORDER_LIGHT;
    ctx.fillRect(0, size - 2, size, 2); // bottom
    ctx.fillRect(size - 2, 0, 2, size); // right

    // Inner highlight
    if (hasItem) {
      ctx.fillStyle = this.COLORS.BORDER_MEDIUM;
      ctx.fillRect(1, 1, size - 2, 1); // inner top
      ctx.fillRect(1, 1, 1, size - 2); // inner left
    }

    return canvas;
  }

  /**
   * Generate ALTTP-style dialogue box corner
   */
  static generateDialogueCorner(): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 8;
    canvas.height = 8;
    ctx.imageSmoothingEnabled = false;

    // Corner pattern (top-left)
    const cornerPattern = [
      '11111100',
      '11111100',
      '11111100',
      '11111100',
      '11111100',
      '11111100',
      '00000000',
      '00000000'
    ];

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (cornerPattern[y][x] === '1') {
          ctx.fillStyle = this.COLORS.BORDER_LIGHT;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    return canvas;
  }

  /**
   * Generate ALTTP-style minimap frame
   */
  static generateMinimapFrame(size: number = 128): HTMLCanvasElement {
    this.ensureCanvas();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = size;
    canvas.height = size;
    ctx.imageSmoothingEnabled = false;

    // Dark background
    ctx.fillStyle = this.COLORS.BG_DARK;
    ctx.fillRect(3, 3, size - 6, size - 6);

    // Inset border
    ctx.fillStyle = this.COLORS.BORDER_DARK;
    ctx.fillRect(0, 0, size, 3); // top
    ctx.fillRect(0, 0, 3, size); // left

    ctx.fillStyle = this.COLORS.BORDER_LIGHT;
    ctx.fillRect(0, size - 3, size, 3); // bottom
    ctx.fillRect(size - 3, 0, 3, size); // right

    // Inner border
    ctx.fillStyle = this.COLORS.BORDER_MEDIUM;
    ctx.fillRect(1, 1, size - 2, 1); // inner top
    ctx.fillRect(1, 1, 1, size - 2); // inner left
    ctx.fillRect(1, size - 2, size - 2, 1); // inner bottom
    ctx.fillRect(size - 2, 1, 1, size - 2); // inner right

    return canvas;
  }

  /**
   * Convert canvas to CSS background-image data URL
   */
  static canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL();
  }

  /**
   * Create CSS class for a generated graphic
   */
  static createCSSClass(className: string, canvas: HTMLCanvasElement): string {
    const dataURL = this.canvasToDataURL(canvas);
    return `.${className} { background-image: url('${dataURL}'); }`;
  }
}