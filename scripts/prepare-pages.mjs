import { cpSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Keep the original paths used by the catalog's JSON image and fetch URLs.
cpSync('src/json', 'dist/json', { recursive: true });
cpSync('src/images', 'dist/images', { recursive: true });

function prepareHtml(directory) {
  readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) prepareHtml(path);
    if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8').replace(
        /(href|src)=(['"])\/(?!\/|wdd330\/)/g,
        '$1=$2/wdd330/',
      );
      writeFileSync(path, html);
    }
  });
}

prepareHtml('dist');
writeFileSync('dist/.nojekyll', '');
