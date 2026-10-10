import { mergeConfig } from 'vite';
import sharedConfig from './vite.config';

// Keep web artifacts separate from dist/, which Capacitor and Tauri consume.
export default mergeConfig(sharedConfig, {
  build: { outDir: 'dist-web' },
});
