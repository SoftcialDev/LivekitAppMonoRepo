/**
 * @fileoverview Script to copy function.json files to dist/ directory
 * @description Copies all function.json files from src/handlers to dist/handlers
 */

const fs = require('fs');
const path = require('path');

const srcHandlersDir = path.join(__dirname, '../src/handlers');
const distHandlersDir = path.join(__dirname, '../dist/handlers');

/**
 * Recursively copies function.json files from src to dist
 * @param {string} srcDir - Source directory
 * @param {string} destDir - Destination directory
 */
function copyFunctionJsonFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.log(`Source directory does not exist: ${srcDir}`);
    return;
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      // Recursively process subdirectories
      copyFunctionJsonFiles(srcPath, destPath);
    } else if (entry.name === 'function.json') {
      // Copy function.json file
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

// Ensure dist/handlers directory exists
if (!fs.existsSync(distHandlersDir)) {
  fs.mkdirSync(distHandlersDir, { recursive: true });
}

// Copy all function.json files
copyFunctionJsonFiles(srcHandlersDir, distHandlersDir);

console.log('Finished copying function.json files');

