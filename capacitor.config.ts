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
      resize: 'none',           // 🔥 OVAY HO 'none' - Tsy hanova ny taille du contenu
      style: 'DARK',
      resizeOnFullScreen: true
    },
    
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#0a0a0f'
    }
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0a0f',
    
    // 🔥 Ampio ity mba tsy hisy espace fotsy
    webContentsDebuggingEnabled: false
  }
};

export default config;