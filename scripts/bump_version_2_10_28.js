const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. package.json
const pkgPath = path.join(rootDir, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '2.10.28';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✅ package.json bumped to 2.10.28');

// 2. app.js
const appPath = path.join(rootDir, 'app.js');
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
    /code:\s*"REV-2026\.11\.10-v2\.10\.27"/,
    'code: "REV-2026.11.10-v2.10.28"'
);
appContent = appContent.replace(
    /version:\s*"2\.10\.27"/,
    'version: "2.10.28"'
);
appContent = appContent.replace(
    /description:\s*"v2\.10\.27:[^"]*"/,
    'description: "v2.10.28: מינימליזם מוחלט בפינת השעון: הצגת טקסט נקי בלבד (X משימות פתוחות / אין משימות פתוחות) ללא שעה, ללא סמל וללא עומס ויזואלי (ADR-101)."'
);
fs.writeFileSync(appPath, appContent, 'utf8');
console.log('✅ app.js bumped to 2.10.28');

// 3. sw.js
const swPath = path.join(rootDir, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(
    /\/\/ Service Worker for Academic Skill Tree \(Semestero ME\) - v2\.10\.27/,
    '// Service Worker for Academic Skill Tree (Semestero ME) - v2.10.28'
);
swContent = swContent.replace(
    /const CACHE_NAME = 'semestero-me-v2\.10\.27';/,
    "const CACHE_NAME = 'semestero-me-v2.10.28';"
);
fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✅ sw.js bumped to 2.10.28');

// 4. android/app/build.gradle
const appGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
let appGradle = fs.readFileSync(appGradlePath, 'utf8');
appGradle = appGradle.replace(/versionCode 81/, 'versionCode 82');
appGradle = appGradle.replace(/versionName "2\.10\.27"/, 'versionName "2.10.28"');
fs.writeFileSync(appGradlePath, appGradle, 'utf8');
console.log('✅ android/app/build.gradle bumped to 82 (2.10.28)');

// 5. android/wear/build.gradle
const wearGradlePath = path.join(rootDir, 'android', 'wear', 'build.gradle');
let wearGradle = fs.readFileSync(wearGradlePath, 'utf8');
wearGradle = wearGradle.replace(/versionCode 81/, 'versionCode 82');
wearGradle = wearGradle.replace(/versionName "2\.10\.27"/, 'versionName "2.10.28"');
fs.writeFileSync(wearGradlePath, wearGradle, 'utf8');
console.log('✅ android/wear/build.gradle bumped to 82 (2.10.28)');

// 6. index.html
const indexPath = path.join(rootDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Replace all ?v=2.10.27 with ?v=2.10.28
indexContent = indexContent.split('?v=2.10.27').join('?v=2.10.28');

// Replace static version strings
indexContent = indexContent.split('v2.10.27 פעילה').join('v2.10.28 פעילה');
indexContent = indexContent.split('גרסה אחרונה v2.10.27').join('גרסה אחרונה v2.10.28');
indexContent = indexContent.split('v2.10.27 • x64').join('v2.10.28 • x64');
indexContent = indexContent.split('גרסה v2.10.27 (העדכנית ביותר) ✓').join('גרסה v2.10.28 (העדכנית ביותר) ✓');
indexContent = indexContent.split('id="display-system-version">v2.10.27<').join('id="display-system-version">v2.10.28<');
indexContent = indexContent.split('v2.10.27 ✨').join('v2.10.28 ✨');
indexContent = indexContent.split('(v2.10.27)').join('(v2.10.28)');

// Add changelog entry
const newChangelogEntry = `                        <li><strong>v2.10.28 (10/11/2026):</strong> מינימליזם מוחלט בווידג'ט פינת השעון (Galaxy Watch 8 Complication): הצגת טקסט נקי, מזוקק וישיר בלבד — "X משימות פתוחות" או "אין משימות פתוחות" ללא סמל, ללא כותרות וללא שעה (ADR-101).</li>\n`;

const changelogMarker = '<span class="app-version-badge" style="font-size: 0.65rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">גרסה אחרונה v2.10.28</span>\n                    </div>\n                    <ul class="whats-new-list">\n';

if (indexContent.includes(changelogMarker)) {
    indexContent = indexContent.replace(changelogMarker, changelogMarker + newChangelogEntry);
} else {
    indexContent = indexContent.replace(
        /(<ul class="whats-new-list">\s*)/,
        `$1${newChangelogEntry}`
    );
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ index.html bumped to 2.10.28 with changelog entry');
