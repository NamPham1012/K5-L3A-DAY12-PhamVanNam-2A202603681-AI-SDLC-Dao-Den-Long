import * as esbuild from 'esbuild';
import fs from 'node:fs';

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

await esbuild.build({
  entryPoints: ['src/headless/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/headless.js',
  banner: {
    js: '#!/usr/bin/env node',
  },
  sourcemap: true,
});
console.log('Build headless succeeded: dist/headless.js');
await esbuild.build({ entryPoints: ['src/soak/soak.ts'], bundle: true, platform: 'node', target: 'node20', format: 'esm', outfile: 'dist/soak.js' });
console.log('Build soak succeeded: dist/soak.js');
await esbuild.build({entryPoints:['electron/main.ts'],bundle:true,platform:'node',target:'node20',format:'cjs',external:['electron'],outfile:'dist/main.cjs'});
await esbuild.build({entryPoints:['electron/preload.ts'],bundle:true,platform:'node',target:'node20',format:'cjs',external:['electron'],outfile:'dist/preload.cjs'});
const vite = await import('vite');
await vite.build();
console.log('Build Electron and web succeeded');
