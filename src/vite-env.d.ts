/// <reference types="vite/client" />

import type { PixlabApi } from '../electron/preload';

declare global {
  interface Window {
    pixlab?: PixlabApi;
  }
}

export {};
