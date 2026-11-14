import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowkunai.survivor',
  appName: 'Shadow Kunai',
  webDir: 'dist',
  backgroundColor: '#07070d',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
