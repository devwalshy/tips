import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist/public');
const docsDir = path.resolve(__dirname, '../docs-react');

console.log('📦 Preparing GitHub Pages deployment...');

// Create docs-react directory if it doesn't exist
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Copy dist/public contents to docs-react
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('📁 Copying build files...');
copyRecursive(distDir, docsDir);

// Create .nojekyll file
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

console.log('✅ GitHub Pages deployment prepared!');
console.log(`📂 Files are in: ${docsDir}`);
console.log('\n📝 Next steps:');
console.log('1. git add docs-react/');
console.log('2. git commit -m "Deploy React app to GitHub Pages"');
console.log('3. git push origin main');
console.log('4. Enable GitHub Pages in repo settings (source: main branch, /docs-react folder)');
