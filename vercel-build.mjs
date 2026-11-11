import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import './build.mjs';

const output = '.vercel/output';
const functionDirectory = output + '/functions/cadrotsentry.func';
await mkdir(functionDirectory, { recursive: true });
await copyFile('worker/index.js', functionDirectory + '/worker.mjs');
await copyFile('vercel-handler.mjs', functionDirectory + '/index.mjs');
await writeFile(functionDirectory + '/.vc-config.json', JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs'
}));
await writeFile(output + '/config.json', JSON.stringify({
  version: 3,
  routes: [{ src: '^/(.*)$', dest: '/cadrotsentry?__cadrotsentry_path=/$1' }]
}));
console.log('Built Vercel deployment output');
