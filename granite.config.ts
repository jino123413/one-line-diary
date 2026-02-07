import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'one-line-diary',
  web: {
    host: '0.0.0.0',
    port: 3002,
    commands: {
      dev: 'rsbuild dev --host',
      build: 'rsbuild build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '오늘 한 줄',
    icon: 'https://raw.githubusercontent.com/jino123413/app-logos/master/one-line-diary.png',
    primaryColor: '#FF6B6B',
    bridgeColorMode: 'basic',
  },
  webViewProps: {
    type: 'partner',
  },
});
