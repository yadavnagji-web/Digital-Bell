const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const INSTALLER_DIR = path.join(ROOT_DIR, 'installer');

console.log('========================================================');
console.log('   DIGITAL BELL - PROFESSIONAL PRODUCTION RELEASE');
console.log('   Windows 7 (32-bit & 64-bit) & Windows 8/10/11 Compatible');
console.log('========================================================\n');

// 1. Ensure release directory exists
fs.mkdirSync(RELEASE_DIR, { recursive: true });

// 2. Verify all critical assets exist
const requiredFiles = [
  'index.js',
  'package.json',
  'build/icon.ico',
  'build/tray.png',
  'raw_web/index.html',
  'raw_web/USER_MANUAL_HINDI.html',
  'raw_web/assets/school_bell_Tan-D0KlyVNl.wav',
  'raw_web/assets/Long-bIIZeSmH.wav',
  'raw_web/assets/saraswati-CA91GMzV.jpg'
];

console.log('[1/6] Verifying Project Dependencies & Assets...');
for (const relPath of requiredFiles) {
  const fullPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Required file missing: ${relPath}`);
  }
  console.log(`  ✓ Verified: ${relPath}`);
}

// 3. Check and build packages for both ia32 and x64 if needed
console.log('\n[2/6] Checking Windows 32-bit and 64-bit Installers & Binaries...');

const setupIa32Source = path.join(INSTALLER_DIR, 'DigitalBellSetup_ia32.exe');
const unpackedIa32Dir = path.join(INSTALLER_DIR, 'win-ia32-unpacked');

const setupX64Source = path.join(INSTALLER_DIR, 'DigitalBellSetup_x64.exe');
const unpackedX64Dir = path.join(INSTALLER_DIR, 'win-unpacked');

if (!fs.existsSync(setupIa32Source) || !fs.existsSync(unpackedIa32Dir)) {
  console.log('  Building 32-bit Windows packages (Win 7 32/64, Win 8/10/11)...');
  execSync('npx electron-builder --win nsis --dir --ia32', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
} else {
  console.log('  ✓ Pre-built 32-bit (ia32) NSIS installer and unpacked binary verified.');
}

if (!fs.existsSync(setupX64Source) || !fs.existsSync(unpackedX64Dir)) {
  console.log('  Building 64-bit Windows packages (Win 7 64, Win 8/10/11)...');
  execSync('npx electron-builder --win nsis --dir --x64', {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
} else {
  console.log('  ✓ Pre-built 64-bit (x64) NSIS installer and unpacked binary verified.');
}

// 4. Copy Installers to Release Folder
console.log('\n[3/6] Packaging Setup Installers for Release...');

// Universal installer (ia32 runs natively on 32-bit and via WOW64 on all 64-bit Windows)
const universalTarget = path.join(RELEASE_DIR, 'DigitalBellSetup.exe');
fs.copyFileSync(setupIa32Source, universalTarget);
const universalStats = fs.statSync(universalTarget);
console.log(`  ✓ Created: DigitalBellSetup.exe (Universal 32/64-bit) (${(universalStats.size / (1024 * 1024)).toFixed(2)} MB)`);

// Dedicated 32-bit installer
const setup32Target = path.join(RELEASE_DIR, 'DigitalBellSetup_32bit.exe');
fs.copyFileSync(setupIa32Source, setup32Target);
const setup32Stats = fs.statSync(setup32Target);
console.log(`  ✓ Created: DigitalBellSetup_32bit.exe (${(setup32Stats.size / (1024 * 1024)).toFixed(2)} MB)`);

// Dedicated 64-bit installer
const setup64Target = path.join(RELEASE_DIR, 'DigitalBellSetup_64bit.exe');
fs.copyFileSync(setupX64Source, setup64Target);
const setup64Stats = fs.statSync(setup64Target);
console.log(`  ✓ Created: DigitalBellSetup_64bit.exe (${(setup64Stats.size / (1024 * 1024)).toFixed(2)} MB)`);

// 5. Create Portable ZIPs (32-bit and 64-bit)
console.log('\n[4/6] Creating Portable ZIP Archives...');

function createZip(sourceDir, targetZip) {
  if (fs.existsSync(targetZip)) {
    fs.unlinkSync(targetZip);
  }
  const srcEscaped = sourceDir.replace(/\\/g, '\\\\');
  const dstEscaped = targetZip.replace(/\\/g, '\\\\');
  const psCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${srcEscaped}', '${dstEscaped}')"`;
  execSync(psCmd, { stdio: 'inherit' });
  const stats = fs.statSync(targetZip);
  console.log(`  ✓ Created: ${path.basename(targetZip)} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
}

const portableZip32 = path.join(RELEASE_DIR, 'DigitalBell-Portable-32bit.zip');
createZip(unpackedIa32Dir, portableZip32);

const portableZip64 = path.join(RELEASE_DIR, 'DigitalBell-Portable-64bit.zip');
createZip(unpackedX64Dir, portableZip64);

const portableZipUniversal = path.join(RELEASE_DIR, 'DigitalBell-Portable.zip');
if (fs.existsSync(portableZipUniversal)) {
  fs.unlinkSync(portableZipUniversal);
}
fs.copyFileSync(portableZip32, portableZipUniversal);
console.log(`  ✓ Created: DigitalBell-Portable.zip (Universal Standalone)`);

// 6. Generate SHA256 Checksums
console.log('\n[5/6] Generating SHA256 Checksums...');
function getSha256(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = fs.readFileSync(filePath);
  hash.update(buffer);
  return hash.digest('hex');
}

const releaseFiles = [
  'DigitalBellSetup.exe',
  'DigitalBellSetup_32bit.exe',
  'DigitalBellSetup_64bit.exe',
  'DigitalBell-Portable.zip',
  'DigitalBell-Portable-32bit.zip',
  'DigitalBell-Portable-64bit.zip'
];

const checksumsLines = [
  `# SHA-256 Checksums for Digital Bell v1.0.0`,
  `# Compatibility: Windows 7 (32-bit & 64-bit), Windows 8, Windows 8.1, Windows 10, Windows 11`,
  `# Generated: ${new Date().toISOString()}`,
  ``
];

for (const relFile of releaseFiles) {
  const fullPath = path.join(RELEASE_DIR, relFile);
  if (fs.existsSync(fullPath)) {
    checksumsLines.push(`${getSha256(fullPath)} *${relFile}`);
  }
}

fs.writeFileSync(path.join(RELEASE_DIR, 'checksums.txt'), checksumsLines.join('\r\n'), 'utf-8');
console.log('  ✓ Generated: checksums.txt');

// 7. Write Comprehensive Release Notes and Copy Manual
console.log('\n[6/6] Finalizing Documentation and User Manual...');
const releaseNotes = `========================================================================
             DIGITAL BELL - AUTOMATED SCHOOL BELL SYSTEM
              VERSION 1.0.0 (OFFICIAL PRODUCTION RELEASE)
========================================================================

Designed & Developed By:
  NAGJI YADAV SAKODARA
  Village: Sakodara, Post: Chikhali, District: Dungarpur (Rajasthan) 314030
  Mobile: +91 9982151938

------------------------------------------------------------------------
SYSTEM COMPATIBILITY (OS & ARCHITECTURE)
------------------------------------------------------------------------
✓ Windows 7 Service Pack 1 (32-bit / x86 & 64-bit / x64)
✓ Windows 8 / Windows 8.1 (32-bit & 64-bit)
✓ Windows 10 (32-bit & 64-bit)
✓ Windows 11 (64-bit)

Built on the official Windows 7 supported runtime (Electron 22 LTS),
guaranteeing 100% offline standalone operation with zero missing DLL errors.

------------------------------------------------------------------------
PACKAGE CONTENTS (RELEASE FOLDER)
------------------------------------------------------------------------
1. DigitalBellSetup.exe (Universal Installer)
   - Installs and runs on ALL Windows versions (Windows 7 32/64-bit, 8, 10, 11).
   - Recommended installer for all users and schools.

2. DigitalBellSetup_32bit.exe
   - Specifically built for 32-bit (x86) Windows systems (Windows 7/8/10).

3. DigitalBellSetup_64bit.exe
   - Specifically optimized for 64-bit (x64) Windows systems (Windows 7/8/10/11).

4. DigitalBell-Portable.zip / DigitalBell-Portable-32bit.zip
   - Standalone portable version. No installation required.
   - Just extract and double-click "Digital Bell.exe" to run immediately.

5. DigitalBell-Portable-64bit.zip
   - Standalone portable version optimized for 64-bit Windows.

6. USER_MANUAL_HINDI.html
   - Full Hindi operating manual with Sky Blue theme.

7. checksums.txt
   - SHA-256 integrity verification hashes for all files.

------------------------------------------------------------------------
DESIGN & USER INTERFACE
------------------------------------------------------------------------
• Fresh, professional Sky Blue color scheme throughout the software.
• Matching Sky Blue top designer bar, bottom info banner, and dialogs.
• Beautiful Maa Saraswati portrait and integrated Hindu Panchang.
• Clear Hindi indicators for current period, next bell countdown, and test chime.

------------------------------------------------------------------------
KEY CAPABILITIES
------------------------------------------------------------------------
• Rajasthan Government School Bell Schedules (Summer & Winter Timings).
• Automatic bell ringing with single, double, triple, and long chime patterns.
• Runs silently in Windows System Tray (Taskbar notification area).
• Auto-Launch on Windows startup option.
• Sleep & Suspension Prevention: keeps bells ringing even when screen locks.
• 100% Offline: NO internet, NO Node.js, and NO external drivers needed.
• User settings and logs safely stored in: %APPDATA%/Digital Bell
========================================================================
`;

fs.writeFileSync(path.join(RELEASE_DIR, 'RELEASE_NOTES.txt'), releaseNotes, 'utf-8');
console.log('  ✓ Generated: RELEASE_NOTES.txt');

fs.copyFileSync(
  path.join(ROOT_DIR, 'raw_web', 'USER_MANUAL_HINDI.html'),
  path.join(RELEASE_DIR, 'USER_MANUAL_HINDI.html')
);
console.log('  ✓ Copied: USER_MANUAL_HINDI.html');

console.log('\n========================================================');
console.log('✓ OFFICIAL PRODUCTION RELEASE COMPLETED SUCCESSFULLY!');
console.log(`✓ Release Directory: ${RELEASE_DIR}`);
console.log('========================================================\n');
