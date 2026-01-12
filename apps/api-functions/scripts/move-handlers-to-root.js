/**
 * @fileoverview Move handlers from dist/handlers/ to dist/ root
 * @summary Moves compiled handlers to root and fixes import paths
 * @description Moves all compiled handler directories from dist/handlers/ to the dist/ root
 * directory to match Azure Functions deployment structure. Also updates relative import paths
 * in handler index.js files from ../../* to ../* to account for the directory structure change.
 */

const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const handlersDir = path.join(distDir, 'handlers');

if (!fs.existsSync(handlersDir)) {
  console.log('No handlers directory found, skipping...');
  process.exit(0);
}

const handlerDirs = fs.readdirSync(handlersDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

if (handlerDirs.length === 0) {
  console.log('No handlers found, skipping...');
  process.exit(0);
}

console.log(`Moving ${handlerDirs.length} handlers to dist root...`);

handlerDirs.forEach(handlerName => {
  const sourcePath = path.join(handlersDir, handlerName);
  const destPath = path.join(distDir, handlerName);
  
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  
  fs.renameSync(sourcePath, destPath);
  
  const handlerIndexJs = path.join(destPath, 'index.js');
  if (fs.existsSync(handlerIndexJs)) {
    let content = fs.readFileSync(handlerIndexJs, 'utf8');
    content = content.replaceAll(/require\("\.\.\/\.\.\/([^"]+)"\)/g, 'require("../$1")');
    fs.writeFileSync(handlerIndexJs, content, 'utf8');
    console.log(`  Moved ${handlerName} and fixed imports`);
  } else {
    console.log(`  Moved ${handlerName}`);
  }
});

try {
  fs.rmdirSync(handlersDir);
  console.log('  Removed empty handlers directory');
} catch (err) {
  // Directory might not be empty (could have .map files), that's okay
  // Ignore error silently as this is expected behavior
  if (err && typeof err === 'object' && 'code' in err && err.code !== 'ENOTEMPTY') {
    throw err;
  }
}

console.log('Handlers moved to dist root successfully');

