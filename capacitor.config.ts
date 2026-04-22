import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.evolix.app',
  appName: 'EVOLIX',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'body',       
      style: 'dark',         
      resizeOnFullScreen: true
    }
  }
};

export default config;