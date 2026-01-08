/**
 * @fileoverview Copy function.json files to dist/ directory
 * @summary Copies all function.json files from src/handlers to dist/handlers
 * @description Recursively copies function.json configuration files from the source handlers
 * directory to the compiled dist/handlers directory. This ensures Azure Functions can locate
 * the function configuration files after TypeScript compilation.
 */

const fs = require('fs');
const path = require('path');

const srcHandlersDir = path.join(__dirname, '../src/handlers');
const distHandlersDir = path.join(__dirname, '../dist/handlers');

/**
 * Recursively copies function.json files from source to destination directory
 * @param {string} srcDir - Source directory path
 * @param {string} destDir - Destination directory path
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
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyFunctionJsonFiles(srcPath, destPath);
    } else if (entry.name === 'function.json') {
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  }
}

if (!fs.existsSync(distHandlersDir)) {
  fs.mkdirSync(distHandlersDir, { recursive: true });
}

copyFunctionJsonFiles(srcHandlersDir, distHandlersDir);

console.log('Finished copying function.json files');

