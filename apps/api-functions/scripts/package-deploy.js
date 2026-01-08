/**
 * @fileoverview Package deployable ZIP for Azure Functions
 * @summary Creates the final deployable ZIP from dist/ directory
 * @description Packages the compiled code from dist/ into a deployable ZIP file for Azure Functions.
 * The dist/ directory should already contain handlers in the root with corrected import paths,
 * host.json, and package.json from the build process. This script copies all necessary files
 * to a temporary directory, then creates a ZIP archive ready for deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const deployZipPath = path.join(rootDir, '../../deploy.zip');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory not found. Run "npm run build" first.');
  process.exit(1);
}

const tempDir = path.join(rootDir, '.deploy-temp');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const distEntries = fs.readdirSync(distDir, { withFileTypes: true });
distEntries.forEach(entry => {
  if (entry.name === 'index.js' && !entry.isDirectory()) {
    return;
  }
  
  const srcPath = path.join(distDir, entry.name);
  const destPath = path.join(tempDir, entry.name);
  
  if (entry.isDirectory()) {
    fs.cpSync(srcPath, destPath, { recursive: true });
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
});

const hostJsonInDist = path.join(distDir, 'host.json');
const hostJsonInTemp = path.join(tempDir, 'host.json');
if (!fs.existsSync(hostJsonInTemp)) {
  const hostJsonInRoot = path.join(rootDir, 'host.json');
  if (fs.existsSync(hostJsonInRoot)) {
    fs.copyFileSync(hostJsonInRoot, hostJsonInTemp);
  } else if (fs.existsSync(hostJsonInDist)) {
    fs.copyFileSync(hostJsonInDist, hostJsonInTemp);
  } else {
    console.error('Error: host.json not found in dist/ or root directory');
    process.exit(1);
  }
}

const packageLockSrc = path.join(rootDir, 'package-lock.json');
if (fs.existsSync(packageLockSrc)) {
  fs.copyFileSync(packageLockSrc, path.join(tempDir, 'package-lock.json'));
}

const nodeModulesSrc = path.join(rootDir, 'node_modules');
if (fs.existsSync(nodeModulesSrc)) {
  fs.cpSync(nodeModulesSrc, path.join(tempDir, 'node_modules'), { recursive: true });
}


if (fs.existsSync(deployZipPath)) {
  fs.unlinkSync(deployZipPath);
}

try {
  const zipCommand = `cd "${tempDir}" && zip -r "${deployZipPath}" . -x "**/.git/**" -x "**/__tests__/**" -x "**/*.test.ts" -x "**/*.test.js" -x "**/coverage/**" -x "src/**" -x "**/tsconfig.json" -x "**/.eslintrc*" -x "**/jest.config.*"`;
  execSync(zipCommand, { stdio: 'inherit' });
  console.log(`Deployable ZIP created: ${deployZipPath}`);
} catch (error) {
  console.error('Failed to create ZIP. Make sure "zip" command is available.');
  console.error('On Windows, you may need to install zip or use PowerShell Compress-Archive.');
  console.error('Error:', error.message);
  process.exit(1);
}

fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Packaging complete');

