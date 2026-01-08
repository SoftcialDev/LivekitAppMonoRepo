/**
 * @fileoverview Move handlers from dist/handlers/ to dist/ root
 * @description Replicates the deployment structure for local development
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const handlersDir = path.join(distDir, 'handlers');

if (!fs.existsSync(handlersDir)) {
  console.log('No handlers directory found, skipping...');
  process.exit(0);
}

// Get all handler directories
const handlerDirs = fs.readdirSync(handlersDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

if (handlerDirs.length === 0) {
  console.log('No handlers found, skipping...');
  process.exit(0);
}

console.log(`Moving ${handlerDirs.length} handlers to dist root...`);

// Move each handler to dist root
handlerDirs.forEach(handlerName => {
  const sourcePath = path.join(handlersDir, handlerName);
  const destPath = path.join(distDir, handlerName);
  
  // Remove existing handler in root if it exists
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  
  // Move handler to root
  fs.renameSync(sourcePath, destPath);
  
  // Fix imports: ../../* -> ../* (handlers moved from dist/handlers/ to dist/)
  const handlerIndexJs = path.join(destPath, 'index.js');
  if (fs.existsSync(handlerIndexJs)) {
    let content = fs.readFileSync(handlerIndexJs, 'utf8');
    // Replace require("../../...") with require("../...")
    // This fixes imports like ../../index, ../../domain, ../../infrastructure, etc.
    content = content.replace(/require\("\.\.\/\.\.\/([^"]+)"\)/g, 'require("../$1")');
    fs.writeFileSync(handlerIndexJs, content, 'utf8');
    console.log(`  ✓ Moved ${handlerName} and fixed imports`);
  } else {
    console.log(`  ✓ Moved ${handlerName}`);
  }
});

// Remove empty handlers directory
try {
  fs.rmdirSync(handlersDir);
  console.log('  ✓ Removed empty handlers directory');
} catch (err) {
  // Directory might not be empty (could have .map files), that's okay
}

console.log('✅ Handlers moved to dist root successfully');

