import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        AudioContext: 'readonly',
        GainNode: 'readonly',
        OscillatorNode: 'readonly',
        OscillatorType: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        FrameRequestCallback: 'readonly',
        
        // Node.js/Timer globals
        process: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        AudioContext: 'readonly',
        GainNode: 'readonly',
        OscillatorNode: 'readonly',
        OscillatorType: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        FrameRequestCallback: 'readonly',
        
        // Node.js/Timer globals
        process: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Basic rules
      'no-unused-vars': 'off', // Turn off for TS files, will be handled by TS
      'no-console': 'off',
      'no-redeclare': 'off', // TypeScript handles this
      'no-empty': 'off',
      'no-case-declarations': 'off',
      'no-undef': 'off' // TypeScript handles undefined variables
    }
  },
  {
    ignores: ['dist/**', '*.config.js', '*.config.ts', 'node_modules/**']
  }
];