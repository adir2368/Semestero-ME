const fs = require('fs');
const path = require('path');

const ROOT = __dirname ? path.resolve(__dirname, '..') : process.cwd();

const OLD_VER = '2.10.11';
const NEW_VER = '2.10.12';
const OLD_VCODE = 65;
const NEW_VCODE = 66;

console.log(`Bumping version from ${OLD_VER} (code ${OLD_VCODE}) to ${NEW_VER} (code ${NEW_VCODE})...`);

// 1. package.json
const pkgPath = path.join(ROOT, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = NEW_VER;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ package.json updated');

// 2. app.js
const appPath = path.join(ROOT, 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');
appJs = appJs.replace(new RegExp(`REV-\\d{4}\\.\\d{2}\\.\\d{2}-v${OLD_VER.replace('.', '\\.')}`, 'g'), `REV-2026.11.07-v${NEW_VER}`);
appJs = appJs.replace(new RegExp(`version:\\s*["']${OLD_VER.replace('.', '\\.')}["']`, 'g'), `version: "${NEW_VER}"`);
appJs = appJs.replace(new RegExp(`APP_VERSION\\s*=\\s*["']${OLD_VER.replace('.', '\\.')}["']`, 'g'), `APP_VERSION = "${NEW_VER}"`);
fs.writeFileSync(appPath, appJs, 'utf8');
console.log('✓ app.js updated');

// 3. sw.js
const swPath = path.join(ROOT, 'sw.js');
let swJs = fs.readFileSync(swPath, 'utf8');
swJs = swJs.replace(new RegExp(`semestero-cache-v${OLD_VER.replace('.', '\\.')}`, 'g'), `semestero-cache-v${NEW_VER}`);
fs.writeFileSync(swPath, swJs, 'utf8');
console.log('✓ sw.js updated');

// 4. android/app/build.gradle
const gradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(new RegExp(`versionCode\\s+${OLD_VCODE}`), `versionCode ${NEW_VCODE}`);
    gradle = gradle.replace(new RegExp(`versionName\\s+["']${OLD_VER.replace('.', '\\.')}["']`), `versionName "${NEW_VER}"`);
    fs.writeFileSync(gradlePath, gradle, 'utf8');
    console.log('✓ android/app/build.gradle updated');
}

// 5. index.html
const indexPath = path.join(ROOT, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(new RegExp(`v=${OLD_VER.replace('.', '\\.')}`, 'g'), `v=${NEW_VER}`);
indexHtml = indexHtml.replace(new RegExp(`v${OLD_VER.replace('.', '\\.')}`, 'g'), `v${NEW_VER}`);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('✓ index.html updated');

// 6. scripts/create_github_release.py
const releasePyPath = path.join(ROOT, 'scripts', 'create_github_release.py');
if (fs.existsSync(releasePyPath)) {
    let py = fs.readFileSync(releasePyPath, 'utf8');
    py = py.replace(new RegExp(`v${OLD_VER.replace('.', '\\.')}`, 'g'), `v${NEW_VER}`);
    py = py.replace(new RegExp(`versionCode ${OLD_VCODE}`, 'g'), `versionCode ${NEW_VCODE}`);
    fs.writeFileSync(releasePyPath, py, 'utf8');
    console.log('✓ scripts/create_github_release.py updated');
}

console.log('All manifests bumped successfully!');
