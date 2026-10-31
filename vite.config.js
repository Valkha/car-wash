import { defineConfig, minify } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'tinyglobby';
import { resolve } from 'path';
import fs from 'fs';

// Discover every HTML page in the project, excluding build artefacts
// (dot folders are never matched: tinyglobby ignores them by default).
const htmlFiles = globSync('**/*.html', {
  ignore: ['node_modules/**', 'dist/**']
});

// Build the Rollup input map: { 'services_cologny_index': '/abs/path/index.html', ... }
const input = Object.fromEntries(
  htmlFiles.map(file => [
    file.replace(/\.html$/, '').replace(/[/\\]/g, '_'),
    resolve(file)
  ])
);

// ---------------------------------------------------------------------------
// Publication propre. Les sources gardent leurs commentaires (documentation du
// projet) ; ce qui part en ligne n'en garde aucun.
//  - HTML : tous les commentaires <!-- --> sont retires des pages publiees.
//  - public/js/app.js est copie tel quel par Vite : on le reecrit sans
//    commentaires (minification oxc sans compression ni renommage, le code
//    reste lisible et identique).
//  - Garde anti-fuite : le build ECHOUE si dist/ contient un fichier .md, un
//    commentaire HTML, ou une trace d'outil (marqueurs [cite: …], noms d'IA).
// ---------------------------------------------------------------------------
const INTERDITS = [/\[cite:/i, /\bclaude\b/i, /anthropic/i, /chatgpt/i, /\bgemini\b/i, /llms\.txt/i];

function publicationPropre() {
  return {
    name: 'ccw-publication-propre',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: html => html.replace(/<!--[\s\S]*?-->/g, '').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n'),
    },
    async closeBundle() {
      const app = resolve('dist/js/app.js');
      if (fs.existsSync(app)) {
        const r = await minify('app.js', fs.readFileSync(app, 'utf8'), { compress: false, mangle: false, codegen: { removeWhitespace: false } });
        if (r.errors && r.errors.length) throw new Error('app.js : nettoyage impossible : ' + r.errors.map(e => e.message).join(' | '));
        fs.writeFileSync(app, r.code);
      }
      const fichiers = globSync('**/*', { cwd: resolve('dist'), dot: true });
      const fautes = [];
      fichiers.forEach(f => {
        if (/\.md$/i.test(f)) fautes.push(`${f} : fichier .md publie`);
        if (!/\.(html|js|css|json|txt|xml|webmanifest)$/i.test(f)) return;
        const t = fs.readFileSync(resolve('dist', f), 'utf8');
        if (/\.html$/i.test(f) && t.includes('<!--')) fautes.push(`${f} : commentaire HTML publie`);
        INTERDITS.forEach(re => { if (re.test(t)) fautes.push(`${f} : trace interdite ${re}`); });
      });
      if (fautes.length) throw new Error('Publication refusee :\n - ' + fautes.join('\n - '));
      console.log(`ccw-publication-propre : ${fichiers.length} fichiers verifies, aucune trace.`);
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), publicationPropre()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input }
  }
});
