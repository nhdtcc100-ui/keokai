import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prolink.app',
  appName: 'ProLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    // Allow mixed content for Supabase Storage uploads
    allowMixedContent: true,
    // Use modern WebView for better file picker support
    captureInput: true,
    // Ensure proper keyboard behavior
    windowSoftInputMode: 'adjustResize',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'default',
      // false = status bar does NOT overlay the WebView content — أهم إعداد
      overlaysWebView: false,
      backgroundColor: '#ffffff',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a66c2',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  }
};

export default config;

