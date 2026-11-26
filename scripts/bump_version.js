#!/usr/bin/env node
/**
 * Semestero ME — Automated Cross-Manifest Version Bumper
 * Usage: node scripts/bump_version.js <new_version> [optional_hebrew_description]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const oldVer = pkg.version;

const newVer = (process.argv[2] || '').replace(/^v/i, '').trim();
const customDesc = process.argv[3] || '';

if (!newVer || !/^\d+\.\d+\.\d+$/.test(newVer)) {
    console.error(`Usage: node scripts/bump_version.js <x.y.z> [description] (current: ${oldVer})`);
    process.exit(1);
}

if (newVer === oldVer) {
    console.log(`[VersionBump] Already at v${newVer}.`);
    process.exit(0);
}

console.log(`[VersionBump] Bumping Semestero ME from v${oldVer} -> v${newVer}...`);

// 1. package.json
pkg.version = newVer;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
console.log(`  ✓ package.json -> ${newVer}`);

// 2. app.js (APP_CURRENT_REVISION)
const appPath = path.join(ROOT, 'app.js');
let appCode = fs.readFileSync(appPath, 'utf-8');
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
appCode = appCode.replace(
    new RegExp(`code:\\s*"REV-[^"]*-v${oldVer.replace(/\./g, '\\.')}"`),
    `code: "REV-${yyyy}.${mm}.${dd}-v${newVer}"`
);
appCode = appCode.replace(
    new RegExp(`version:\\s*"${oldVer.replace(/\./g, '\\.')}"`),
    `version: "${newVer}"`
);
if (customDesc) {
    appCode = appCode.replace(
        /description:\s*"v\d+\.\d+\.\d+:[^"]*"/,
        `description: "v${newVer}: ${customDesc.replace(/"/g, '\\"')}"`
    );
} else {
    appCode = appCode.replace(
        new RegExp(`description:\\s*"v${oldVer.replace(/\./g, '\\.')}:`),
        `description: "v${newVer}:`
    );
}
fs.writeFileSync(appPath, appCode, 'utf-8');
console.log(`  ✓ app.js (APP_CURRENT_REVISION) -> v${newVer}`);

// 3. index.html (preserve historical changelog <li><strong>vX.Y.Z entries)
const indexPath = path.join(ROOT, 'index.html');
const indexLines = fs.readFileSync(indexPath, 'utf-8').split('\n');
const oldVerRegex = new RegExp(oldVer.replace(/\./g, '\\.'), 'g');
const updatedIndexLines = indexLines.map(line => {
    if (line.includes(`<li><strong>v${oldVer}`)) {
        return line;
    }
    return line.replace(oldVerRegex, newVer);
});
fs.writeFileSync(indexPath, updatedIndexLines.join('\n'), 'utf-8');
console.log(`  ✓ index.html -> v${newVer}`);

// 4. sw.js
const swPath = path.join(ROOT, 'sw.js');
let swCode = fs.readFileSync(swPath, 'utf-8');
swCode = swCode.replace(oldVerRegex, newVer);
fs.writeFileSync(swPath, swCode, 'utf-8');
console.log(`  ✓ sw.js (CACHE_NAME) -> semestero-me-v${newVer}`);

// 5. android/app/build.gradle & android/wear/build.gradle
for (const relGradle of ['android/app/build.gradle', 'android/wear/build.gradle']) {
    const gradlePath = path.join(ROOT, relGradle);
    if (!fs.existsSync(gradlePath)) continue;
    let g = fs.readFileSync(gradlePath, 'utf-8');
    g = g.replace(/versionCode\s+(\d+)/, (_, codeStr) => `versionCode ${parseInt(codeStr, 10) + 1}`);
    g = g.replace(new RegExp(`versionName\\s+"${oldVer.replace(/\./g, '\\.')}"`), `versionName "${newVer}"`);
    fs.writeFileSync(gradlePath, g, 'utf-8');
    console.log(`  ✓ ${relGradle} -> v${newVer} (versionCode +1)`);
}

// 6. ios/App/App.xcodeproj/project.pbxproj
const pbxPath = path.join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj');
if (fs.existsSync(pbxPath)) {
    let pbx = fs.readFileSync(pbxPath, 'utf-8');
    pbx = pbx.replace(/CURRENT_PROJECT_VERSION = (\d+);/g, (_, n) => `CURRENT_PROJECT_VERSION = ${parseInt(n, 10) + 1};`);
    pbx = pbx.replace(new RegExp(`MARKETING_VERSION = ${oldVer.replace(/\./g, '\\.')};`, 'g'), `MARKETING_VERSION = ${newVer};`);
    fs.writeFileSync(pbxPath, pbx, 'utf-8');
    console.log(`  ✓ ios/App/App.xcodeproj/project.pbxproj -> v${newVer}`);
}

// 7. Auxiliary static HTML & GEO files
for (const auxFile of ['404.html', 'guide.html', 'watch.html', 'widgets.html', 'llms.txt']) {
    const auxPath = path.join(ROOT, auxFile);
    if (!fs.existsSync(auxPath)) continue;
    const auxContent = fs.readFileSync(auxPath, 'utf-8').replace(oldVerRegex, newVer);
    fs.writeFileSync(auxPath, auxContent, 'utf-8');
    console.log(`  ✓ ${auxFile} -> v${newVer}`);
}

console.log(`[VersionBump] Successfully updated all manifests to v${newVer}!`);
