/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.m4a' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.wav' {
  const src: string;
  export default src;
}

// Extend Window interface for audio unlock
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
