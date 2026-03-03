import { execSync } from 'child_process';
import { rmSync } from 'fs';
import * as esbuild from 'esbuild';

async function main() {
  console.log('Cleaning dist/...');
  rmSync('dist', { recursive: true, force: true });

  console.log('Building renderer...');
  execSync('bunx vite build', { stdio: 'inherit' });

  console.log('Building main process...');
  await esbuild.build({
    entryPoints: ['src/main/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/main/index.js',
    external: ['electron'],
    minify: true,
    sourcemap: true,
  });

  console.log('Building preload...');
  await esbuild.build({
    entryPoints: ['src/preload/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/preload/index.js',
    external: ['electron'],
    minify: true,
    sourcemap: true,
  });

  console.log('Building analysis worker...');
  await esbuild.build({
    entryPoints: ['src/main/workers/analysis-worker.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'dist/main/analysis-worker.js',
    external: ['electron'],
    minify: true,
    sourcemap: true,
  });

  console.log('\nBuild complete!');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
