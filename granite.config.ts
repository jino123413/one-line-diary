import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'one-line-diary',
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'rsbuild dev',
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
