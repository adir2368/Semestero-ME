const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

console.log('Applying v2.5.9 update and What\'s New changelog at:', rootDir);

// 1. package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '2.5.9';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('package.json -> v2.5.9');

// 2. sw.js
const swPath = path.join(rootDir, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/v2\.5\.8/g, 'v2.5.9');
sw = sw.replace(/semestero-me-v2\.5\.8/g, 'semestero-me-v2.5.9');
fs.writeFileSync(swPath, sw, 'utf8');
console.log('sw.js -> v2.5.9');

// 3. android/app/build.gradle
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
    let gradle = fs.readFileSync(gradlePath, 'utf8');
    gradle = gradle.replace(/versionCode\s+\d+/, 'versionCode 16');
    gradle = gradle.replace(/versionName\s+"[^"]+"/, 'versionName "2.5.9"');
    fs.writeFileSync(gradlePath, gradle, 'utf8');
    console.log('android/app/build.gradle -> versionCode 16, versionName 2.5.9');
}

// 4. scripts/create_github_release.py
const relPath = path.join(rootDir, 'scripts', 'create_github_release.py');
if (fs.existsSync(relPath)) {
    let rel = fs.readFileSync(relPath, 'utf8');
    rel = rel.replace(/2\.5\.8/g, '2.5.9');
    fs.writeFileSync(relPath, rel, 'utf8');
    console.log('scripts/create_github_release.py -> 2.5.9');
}

// 5. app.js
const appJsPath = path.join(rootDir, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');
appJs = appJs.replace(/REV-2026\.10\.25-v2\.5\.8/g, 'REV-2026.10.25-v2.5.9');
appJs = appJs.replace(/version:\s*"2\.5\.8"/g, 'version: "2.5.9"');
appJs = appJs.replace(/currentVer\s*=\s*currentVer\s*\|\|\s*"2\.5\.8"/g, 'currentVer = currentVer || "2.5.9"');
appJs = appJs.replace(/APP_CURRENT_REVISION\.version\)\s*\|\|\s*"2\.5\.8"/g, 'APP_CURRENT_REVISION.version) || "2.5.9"');

const v259ChangelogHTML = `window.getFormattedChangelogHTML = function() {
    return \`<div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>✨</span> <span>עידון ופינוי סרגל הכלים העליון (HUD Clean & Minimalist)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>הסרת כפתורי הקיצור העודפים (ווידג'טים וסיור) מסרגל הכלים העליון למניעת עומס וצפיפות, ומעבר למראה נקי ומרווח.</li>
                <li>מרכז הווידג'טים האינטראקטיביים למסך הבית מרוכז וזמין תמיד ישירות בהגדרות המערכת (Settings ⚙️).</li>
            </ul>
        </div>

        <div style="background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>🧭</span> <span>מרכז הדרכה וסיור אינטראקטיבי חדש (Tutorial Academy)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>סיור מודרך בן 10 שלבים עם מעבר אוטומטי חי בין כל מסכי המערכת: עץ קורסים, תכנון תואר, מערכת שעות, משימות, חיפוש חכם והשוואת קורסים.</li>
                <li>כפתורי התנסות אינטראקטיביים ישירות מתוך כרטיסי הסיור (בדיקת זכאות לתואר, חיפוש חכם, השוואה ומדריך זכויות).</li>
                <li>זמין להפעלה בכל עת דרך ההגדרות (Settings), שורת הפקודות (Ctrl+K -> "סיור") ובקיצור מקלדת <kbd>T</kbd>.</li>
            </ul>
        </div>

        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>🔍</span> <span>שורת פקודות וחיפוש חכם מהיר (Ctrl+K / ⌘K)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>חיפוש מיידי וניווט מהיר בכל 350+ הקורסים האקדמיים, משימות, טאבים ופעולות מערכת עם תמיכה מלאה בחצים ו-Enter.</li>
            </ul>
        </div>

        <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #a78bfa; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>⚖️</span> <span>השוואת קורסי בחירה צד-מול-צד ומדריך זכויות בטכניון</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>השוואה מקיפה בין קורסים וזיהוי אוטומטי של התנגשויות תאריכי בחינה (מועד א׳ ו-ב׳).</li>
                <li>מדריך זכויות מסונן: מילואים (הפחתת 2 נק״ז), טירונות עתודה (2 נק״ז בינארי), ופורמולה SAE (2 נק״ז לסמסטר או 6 נק״ז פרויקט גמר).</li>
            </ul>
        </div>
    </div>\`;
};`;

appJs = appJs.replace(/window\.getFormattedChangelogHTML\s*=\s*function\(\)\s*\{[\s\S]*?\n\};/, v259ChangelogHTML);
fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('app.js -> v2.5.9 with updated What\'s New changelog');

// 6. index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Remove #btn-open-interactive-tour from HUD header
const hudTourRegex = /\s*<button type="button" class="btn-hud-bell" id="btn-open-interactive-tour"[\s\S]*?<\/button>/;
if (hudTourRegex.test(html)) {
    html = html.replace(hudTourRegex, '');
    console.log('Removed btn-open-interactive-tour from index.html header (HUD de-cluttered)');
}

// Bump version queries and badges
html = html.replace(/\?v=2\.5\.8/g, '?v=2.5.9');
html = html.replace(/"v2\.5\.8"/g, '"v2.5.9"');
html = html.replace(/>v2\.5\.8</g, '>v2.5.9<');
html = html.replace(/v2\.5\.8 ✨/g, 'v2.5.9 ✨');
html = html.replace(/\(v2\.5\.8\)/g, '(v2.5.9)');

// Add v2.5.9 to What's New changelog list in Settings
const v259Li = `<li><strong>v2.5.9 (25/10/2026):</strong> פינוי ועידון סרגל הכלים העליון (HUD Header De-clutter): הסרת כפתורי הקיצור העודפים (ווידג'טים וסיור) מהסרגל העליון לטובת מראה נקי, מרווח ומינימליסטי; העברת מרכז הווידג'טים האינטראקטיביים ישירות להגדרות המערכת; השקת מרכז ההדרכה והסיור האינטראקטיבי (Tutorial Academy) הנגיש דרך ההגדרות, שורת הפקודות (Ctrl+K) ומקש T.</li>\r\n                            `;
const changelogTarget = '<ul class="version-changelog-list" style="margin: 0; padding-right: 20px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.6; max-height: 280px; overflow-y: auto;">\r\n                            ';
if (html.includes(changelogTarget) && !html.includes('v2.5.9 (25/10/2026)')) {
    html = html.replace(changelogTarget, changelogTarget + v259Li);
    console.log('Added v2.5.9 to What\'s New list in index.html');
}

// Update static update-modal-description in index.html
const modalDescStart = '<div id="update-modal-description" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;">';
if (html.includes(modalDescStart)) {
    const endTag = '</div>\r\n\r\n                <div class="modal-footer"';
    const idxStart = html.indexOf(modalDescStart);
    const idxEnd = html.indexOf(endTag, idxStart);
    if (idxStart !== -1 && idxEnd !== -1) {
        const replacementModalDesc = `<div id="update-modal-description" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>✨</span> <span>עידון ופינוי סרגל הכלים העליון (HUD Clean & Minimalist)</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>הסרת כפתורי הקיצור העודפים מהסרגל העליון לטובת מראה נקי ומרווח ללא עומס.</li>
                            <li>מרכז הווידג'טים למסך הבית מרוכז וזמין תמיד ישירות בהגדרות המערכת (Settings ⚙️).</li>
                        </ul>
                    </div>

                    <div style="background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>🧭</span> <span>מרכז הדרכה וסיור אינטראקטיבי חדש (Tutorial Academy)</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>סיור מודרך בן 10 שלבים עם מעבר אוטומטי חי בין כל מסכי המערכת וכפתורי התנסות אינטראקטיביים.</li>
                            <li>זמין להפעלה בכל עת דרך ההגדרות, שורת הפקודות (Ctrl+K) ובקיצור מקלדת T.</li>
                        </ul>
                    </div>

                    <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>🔍</span> <span>שורת פקודות וחיפוש חכם מהיר (Ctrl+K / ⌘K)</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>חיפוש מיידי וניווט מהיר בכל 350+ הקורסים האקדמיים, משימות, טאבים ופעולות מערכת.</li>
                        </ul>
                    </div>

                    <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #a78bfa; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>⚖️</span> <span>השוואת קורסי בחירה צד-מול-צד ומדריך זכויות בטכניון</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>השוואה מקיפה בין קורסים וזיהוי אוטומטי של התנגשויות תאריכי בחינה (מועד א׳ ו-ב׳).</li>
                            <li>מדריך זכויות מסונן: מילואים (הפחתת 2 נק״ז), טירונות עתודה (2 נק״ז בינארי), ופורמולה SAE (2 נק״ז).</li>
                        </ul>
                    </div>
                </div>`;
        html = html.substring(0, idxStart) + replacementModalDesc + html.substring(idxEnd);
        console.log('Updated static update-modal-description in index.html for v2.5.9');
    }
}

fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('index.html -> v2.5.9 successfully');
console.log('All v2.5.9 updates finished!');
