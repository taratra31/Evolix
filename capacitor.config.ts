import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.evolix.app',
  appName: 'EVOLIX',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'none', // Ovaina 'none' mba tsy hanosika ny content mihitsy
      style: 'dark',         
      resizeOnFullScreen: false // Ataovy false mba tsy hisy espace fotsy
    }
  }
};

export default config;