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
