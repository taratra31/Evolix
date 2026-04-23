import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.evolix.app',
  appName: 'EVOLIX',
  webDir: 'www',

  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['*']
  },

  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true
    },
    
    // 🔥 StatusBar SEULEMENT - Configuration izay tsy hidiran'ny contenu
    StatusBar: {
      overlaysWebView: false,        // ZAVA-DEHIBE: Tsy hi-overlay
      style: 'LIGHT',
      backgroundColor: '#0a0a0f'
    }
    
    // ❌ TSY MISY SplashScreen intsony
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0a0f'
  }
};

export default config;