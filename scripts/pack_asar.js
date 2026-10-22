const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_APP_DIR = path.join(ROOT_DIR, 'scratch', 'app_package_' + Date.now());

// 1. Prepare clean temp directory with only runtime files
fs.mkdirSync(TEMP_APP_DIR, { recursive: true });

// Copy index.js, package.json
fs.copyFileSync(path.join(ROOT_DIR, 'index.js'), path.join(TEMP_APP_DIR, 'index.js'));
fs.copyFileSync(path.join(ROOT_DIR, 'package.json'), path.join(TEMP_APP_DIR, 'package.json'));

// Copy raw_web recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (!entry.name.endsWith('.bak')) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(path.join(ROOT_DIR, 'raw_web'), path.join(TEMP_APP_DIR, 'raw_web'));

// Copy build icons
const buildDest = path.join(TEMP_APP_DIR, 'build');
fs.mkdirSync(buildDest, { recursive: true });
['icon.ico', 'tray.png', 'icon.png'].forEach(file => {
  const p = path.join(ROOT_DIR, 'build', file);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(buildDest, file));
});

console.log('Temporary app directory prepared at:', TEMP_APP_DIR);

async function main() {
  const targets = [
    path.join(ROOT_DIR, 'installer', 'win-unpacked', 'resources', 'app.asar'),
    path.join(ROOT_DIR, 'installer', 'win-ia32-unpacked', 'resources', 'app.asar')
  ];

  for (const targetAsar of targets) {
    if (fs.existsSync(path.dirname(targetAsar))) {
      console.log('Packing app.asar to:', targetAsar);
      await asar.createPackage(TEMP_APP_DIR, targetAsar);
      const st = fs.statSync(targetAsar);
      console.log(`  ✓ Updated ${targetAsar} (${(st.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }

  // Clean up scratch dir
  fs.rmSync(TEMP_APP_DIR, { recursive: true, force: true });
  console.log('✓ All unpacked app.asar packages successfully updated with latest code!');
}

main().catch(err => {
  console.error('Asar pack error:', err);
  process.exit(1);
});
