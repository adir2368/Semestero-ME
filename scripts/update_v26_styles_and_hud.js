const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Update styles.css
const stylesPath = path.join(rootDir, 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');

// Replace .char-name-row and .char-level
const targetCharRow = /\.char-name-row\s*\{[^}]+\}/;
const replacementCharRow = `.char-name-row {
    display: flex;
    justify-content: stretch;
    align-items: center;
    margin-bottom: 2px;
    min-width: 0;
    width: 100%;
}`;
styles = styles.replace(targetCharRow, replacementCharRow);

const targetCharLevel = /\.char-level\s*\{[^}]+\}/;
const replacementCharLevel = `.char-level {
    font-weight: 800;
    font-size: 0.88rem;
    color: #fbbf24;
    text-shadow: 0 0 8px rgba(251, 191, 36, 0.35);
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 1px 8px;
    border-radius: 6px;
    letter-spacing: 0.3px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-right: 0 !important;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    box-sizing: border-box;
}`;
styles = styles.replace(targetCharLevel, replacementCharLevel);

// Remove specific green background/border for #btn-open-downloads-modal
const targetBtnGreen = /\/\*\s*Green Download Arrow Button Styling\s*\*\/[\s\S]*?#btn-open-downloads-modal:hover\s*\{[^}]+\}/;
styles = styles.replace(targetBtnGreen, '/* Green Download Arrow Button Styling Harmonized with .btn-hud-bell */');

// Update .btn-back-to-top z-index and add responsive rules
styles = styles.replace(/(\.btn-back-to-top\s*\{[\s\S]*?)z-index:\s*990;/, '$1z-index: 10000;');

if (!styles.includes('.btn-back-to-top-mobile-fix')) {
    const backToTopMobile = `
/* Floating Back to Top Button Mobile Optimization */
@media (max-width: 768px), screen and (max-device-width: 768px) {
    .btn-back-to-top {
        bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
        left: 16px !important;
        width: 42px !important;
        height: 42px !important;
    }
} /* .btn-back-to-top-mobile-fix */
`;
    styles = styles.replace(/(\.btn-back-to-top:active\s*\{[^}]+\})/, '$1' + backToTopMobile);
}

// Unhide #hud-char-avatar at the bottom of styles.css
styles = styles.replace(
    /\.hud-header\s+\.char-avatar,\s*#hud-char-avatar,\s*#char-title\s*\{\s*display:\s*none\s*!important;\s*\}/g,
    `/* Clean Minimalist HUD: Keep Redundant Degree Subtitle Hidden */\n#char-title {\n    display: none !important;\n}`
);

fs.writeFileSync(stylesPath, styles, 'utf8');
console.log('Successfully updated styles.css');

// 2. Update index.html
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Unhide #hud-char-avatar inline style
indexHtml = indexHtml.replace(
    'id="hud-char-avatar" onclick="if (window.AuthSync && AuthSync.openAuthModal) AuthSync.openAuthModal();" title="לחץ לשינוי סמל / עריכת פרטי חשבון" style="cursor: pointer; display: none;"',
    'id="hud-char-avatar" onclick="if (window.AuthSync && AuthSync.openAuthModal) AuthSync.openAuthModal();" title="לחץ לשינוי סמל / עריכת פרטי חשבון" style="cursor: pointer;"'
);

// Update #btn-open-downloads-modal icon to sleek green SVG
const oldDownloadBtn = `<button type="button" class="btn-hud-bell" id="btn-open-downloads-modal" onclick="window.openDownloadModal()" title="הורדה ישירה לטלפון ולמחשב ⬇️" aria-label="הורדה ישירה לטלפון ולמחשב">
                        <span class="bell-icon">⬇️</span>
                    </button>`;
const newDownloadBtn = `<button type="button" class="btn-hud-bell" id="btn-open-downloads-modal" onclick="window.openDownloadModal()" title="הורדה ישירה לטלפון ולמחשב ⬇️" aria-label="הורדה ישירה לטלפון ולמחשב">
                        <span class="bell-icon" style="color: #10b981; display: inline-flex; align-items: center; justify-content: center;">
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="#10b981" style="display: block;">
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                        </span>
                    </button>`;
indexHtml = indexHtml.replace(oldDownloadBtn, newDownloadBtn);

// Also replace if whitespace differed
if (indexHtml.includes('<span class="bell-icon">⬇️</span>')) {
    indexHtml = indexHtml.replace(
        '<span class="bell-icon">⬇️</span>',
        `<span class="bell-icon" style="color: #10b981; display: inline-flex; align-items: center; justify-content: center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="#10b981" style="display: block;"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></span>`
    );
}

// Update version tags and links from v2.5.9 to v2.6
indexHtml = indexHtml.replace(/icon_small\.webp\?v=2\.5\.9/g, 'icon_small.webp?v=2.6');
indexHtml = indexHtml.replace(/icon_small\.png\?v=2\.5\.9/g, 'icon_small.png?v=2.6');
indexHtml = indexHtml.replace(/id="display-system-version">v2\.5\.9<\/span>/g, 'id="display-system-version">v2.6</span>');
indexHtml = indexHtml.replace(/id="footer-version-badge" title="[^"]+" aria-label="[^"]+" style="cursor: pointer;">v2\.5\.9 ✓<\/button>/g, 'id="footer-version-badge" title="בדיקת עדכוני מערכת (v2.6)" aria-label="גרסת מערכת ובדיקת עדכונים" style="cursor: pointer;">v2.6 ✓</button>');
indexHtml = indexHtml.replace(/v2\.5\.9 • x64/g, 'v2.6 • x64');
indexHtml = indexHtml.replace(/\/download\/v2\.5\.9\/Semestero-ME-Windows-x64\.zip/g, '/download/v2.6/Semestero-ME-Windows-x64.zip');
indexHtml = indexHtml.replace(/\/download\/v2\.5\.9\/Semestero-ME\.exe/g, '/download/v2.6/Semestero-ME.exe');

// Add v2.6 to Settings What's New
const v26WhatsNew = `                        <li><strong>v2.6 (25/10/2026):</strong> כפתור צף חכם "חזרה למעלה" (Back to Top) פעיל בכל חלקי המערכת והמודאלים, עידון סרגל הכלים העליון (HUD) עם שחזור סמל הפקולטה והרחבת מד השלמת התואר לרוחב מלא, כפתור הורדה מעודן עם חץ ירוק תואם, שורת פקודות חכמה (Ctrl+K), והשוואת קורסים צד-מול-צד.</li>\n`;
if (!indexHtml.includes('v2.6 (25/10/2026):')) {
    indexHtml = indexHtml.replace(
        '<ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">',
        '<ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">\n' + v26WhatsNew
    );
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('Successfully updated index.html');

// 3. Update package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '2.6.0';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('Successfully updated package.json to 2.6.0');

// 4. Update sw.js
const swPath = path.join(rootDir, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const CACHE_NAME = 'semestero-me-v[^']+';/, "const CACHE_NAME = 'semestero-me-v2.6';");
sw = sw.replace(/Academic Skill Tree \(Semestero ME\) - v[0-9.]+/g, 'Academic Skill Tree (Semestero ME) - v2.6');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Successfully updated sw.js');

// 5. Update android/app/build.gradle
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode \d+/, 'versionCode 17');
gradle = gradle.replace(/versionName "[^"]+"/, 'versionName "2.6"');
fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('Successfully updated android/app/build.gradle');

// 6. Update app.js
const appJsPath = path.join(rootDir, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace(/code: "REV-[^"]+"/, 'code: "REV-2026.10.25-v2.6"');
appJs = appJs.replace(/version: "[0-9.]+"/, 'version: "2.6"');
appJs = appJs.replace(/currentVer \|\| "2\.5\.9"/g, 'currentVer || "2.6"');

// Update getFormattedChangelogHTML in app.js
const changelogCardV26 = `        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>🔝</span> <span>גרסה 2.6: כפתור חזרה למעלה, שחזור סמל הפקולטה ועידון HUD מלא</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>כפתור צף אינטליגנטי "חזרה למעלה" (Back to Top) פעיל ומגיב לגלילה בכל מסכי המערכת (הגדרות, תכנון תואר, מערכת שעות ומודאלים).</li>
                <li>שחזור סמל הפקולטה (הכובע/מבחנה וגלגל שיניים) בסרגל ה-HUD העליון.</li>
                <li>הרחבת מד אחוז השלמת התואר (0.0% הושלמו) לרוחב מלא זהה למד הנק"ז למראה הרמוני ומדויק.</li>
                <li>התאמת כפתור ההורדה לסגנון שאר כפתורי הזכוכית ב-HUD עם חץ ירוק אלגנטי.</li>
            </ul>
        </div>\n`;

if (!appJs.includes('גרסה 2.6: כפתור חזרה למעלה')) {
    appJs = appJs.replace(
        'window.getFormattedChangelogHTML = function() {\n    return `<div style="display: flex; flex-direction: column; gap: 10px;">',
        'window.getFormattedChangelogHTML = function() {\n    return `<div style="display: flex; flex-direction: column; gap: 10px;">\n' + changelogCardV26
    );
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Successfully updated app.js');

// 7. Update scripts/create_github_release.py
const releasePyPath = path.join(rootDir, 'scripts', 'create_github_release.py');
let releasePy = fs.readFileSync(releasePyPath, 'utf8');
releasePy = releasePy.replace(/VERSION = pkg\.get\("version", "[^"]+"\)/, 'VERSION = pkg.get("version", "2.6")');
releasePy = releasePy.replace(
    /NAME = f"Semestero ME v\{VERSION\} - [^"]+"/,
    'NAME = f"Semestero ME v{VERSION} - Responsive Back-to-Top, HUD Avatar & Expanded Completion Gauge"'
);
fs.writeFileSync(releasePyPath, releasePy, 'utf8');
console.log('Successfully updated scripts/create_github_release.py');
