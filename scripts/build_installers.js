const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const ISCC_EXE = 'C:\\Users\\DELL\\AppData\\Local\\Programs\\Antigravity IDE\\resources\\app\\node_modules\\innosetup\\bin\\ISCC.exe';
const RELEASE_DIR = path.join(ROOT_DIR, 'release');

fs.mkdirSync(RELEASE_DIR, { recursive: true });

console.log('========================================================');
console.log('   DIGITAL BELL - BUILDING WINDOWS INSTALLATION WIZARDS');
console.log('   Windows 7 SP1 (32-bit & 64-bit), 8, 8.1, 10, 11');
console.log('========================================================\n');

// 1. Compile Universal Installer (ia32 - runs on 32-bit and 64-bit Windows)
console.log('[1/2] Compiling Universal Windows Setup Wizard (32-bit & 64-bit)...');
const scriptUniversal = path.join(ROOT_DIR, 'scripts', 'installer_universal.iss');
execSync(`"${ISCC_EXE}" "${scriptUniversal}"`, {
  cwd: path.join(ROOT_DIR, 'scripts'),
  stdio: 'inherit'
});

// 2. Compile Dedicated 64-bit Installer
console.log('\n[2/2] Compiling Dedicated 64-bit Windows Setup Wizard...');
const scriptX64 = path.join(ROOT_DIR, 'scripts', 'installer_x64.iss');
execSync(`"${ISCC_EXE}" "${scriptX64}"`, {
  cwd: path.join(ROOT_DIR, 'scripts'),
  stdio: 'inherit'
});

console.log('\n========================================================');
console.log('✓ INSTALLATION WIZARDS BUILT SUCCESSFULLY!');

const universalSetup = path.join(RELEASE_DIR, 'Digital_Bell_Setup.exe');
const x64Setup = path.join(RELEASE_DIR, 'Digital_Bell_Setup_x64.exe');

if (fs.existsSync(universalSetup)) {
  const sz = (fs.statSync(universalSetup).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Universal Installer: ${universalSetup} (${sz} MB)`);
}
if (fs.existsSync(x64Setup)) {
  const sz = (fs.statSync(x64Setup).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ 64-bit Installer:    ${x64Setup} (${sz} MB)`);
}
console.log('========================================================\n');
