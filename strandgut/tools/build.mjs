// Baut aus src/ eine einzige, offline lauffähige Datei: strandgut.html
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const watch = process.argv.includes('--watch');

function write(js) {
  const tpl = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
  const html = tpl
    .replace('/*CSS*/', () => css)
    .replace('/*JS*/', () => js.replace(/<\/script/gi, '<\\/script'));
  const out = path.join(root, 'strandgut.html');
  fs.writeFileSync(out, html);
  console.log(`strandgut.html: ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

const options = {
  entryPoints: [path.join(root, 'src/main.js')],
  bundle: true, minify: !process.env.DEBUG, format: 'iife', target: 'es2020',
  write: false, legalComments: 'none',
  plugins: [{
    name: 'single-file',
    setup(build) { build.onEnd(r => { if (!r.errors.length) write(r.outputFiles[0].text); }); },
  }],
};

if (watch) { const ctx = await esbuild.context(options); await ctx.watch(); console.log('watching …'); }
else await esbuild.build(options);
