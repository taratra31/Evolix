import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.evolix.app',
  appName: 'EVOLIX',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#000000'
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;