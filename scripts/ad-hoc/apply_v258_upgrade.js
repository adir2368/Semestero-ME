const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');

console.log('Applying v2.5.8 upgrade to Semestero ME at:', rootDir);

// 1. Update package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = '2.5.8';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ Updated package.json to v2.5.8');

// 2. Update sw.js
const swPath = path.join(rootDir, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(/v2\.5\.7/g, 'v2.5.8');
fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✓ Updated sw.js to v2.5.8');

// 3. Update android/app/build.gradle
const gradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');
if (fs.existsSync(gradlePath)) {
    let gradleContent = fs.readFileSync(gradlePath, 'utf8');
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, 'versionCode 15');
    gradleContent = gradleContent.replace(/versionName\s+"[^"]+"/, 'versionName "2.5.8"');
    fs.writeFileSync(gradlePath, gradleContent, 'utf8');
    console.log('✓ Updated android/app/build.gradle to versionCode 15, versionName 2.5.8');
}

// 4. Update scripts/create_github_release.py
const releaseScriptPath = path.join(rootDir, 'scripts', 'create_github_release.py');
if (fs.existsSync(releaseScriptPath)) {
    let relContent = fs.readFileSync(releaseScriptPath, 'utf8');
    relContent = relContent.replace(/2\.5\.7/g, '2.5.8');
    fs.writeFileSync(releaseScriptPath, relContent, 'utf8');
    console.log('✓ Updated scripts/create_github_release.py');
}

// 5. Update app.js
const appJsPath = path.join(rootDir, 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');
appJsContent = appJsContent.replace(/REV-2026\.10\.25-v2\.5\.7/g, 'REV-2026.10.25-v2.5.8');
appJsContent = appJsContent.replace(/version:\s*"2\.5\.7"/g, 'version: "2.5.8"');
appJsContent = appJsContent.replace(/currentVer\s*=\s*currentVer\s*\|\|\s*"2\.5\.7"/g, 'currentVer = currentVer || "2.5.8"');
appJsContent = appJsContent.replace(/APP_CURRENT_REVISION\.version\)\s*\|\|\s*"2\.5\.7"/g, 'APP_CURRENT_REVISION.version) || "2.5.8"');

// Update getFormattedChangelogHTML in app.js
const v258ChangelogHTML = `window.getFormattedChangelogHTML = function() {
    return \`<div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>🔍</span> <span>חיפוש חכם ופקודות מהירות (Ctrl+K / ⌘K / /)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>שורת פקודות חכמה (Command Palette) לחיפוש מיידי וניווט מהיר בכל 350+ הקורסים האקדמיים, משימות, טאבים ופעולות מערכת.</li>
                <li>תמיכה מלאה בניווט מקלדת (חצים ↑/↓, בחירה ב-Enter, סגירה ב-Esc) וחיפוש קל לפי קוד או שם קורס.</li>
            </ul>
        </div>

        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>⚖️</span> <span>כלי השוואת קורסי בחירה צד-מול-צד (Course Comparator)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>השוואה מקיפה בין שני קורסים: נק״ז, סיווג רשימה פקולטית, דרישות קדם, וסילבוס.</li>
                <li><strong>זיהוי אוטומטי של התנגשויות בחינה:</strong> סימון אדום בולט בעת התנגשות תאריכי מועד א׳ או מועד ב׳.</li>
            </ul>
        </div>

        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>📖</span> <span>מדריך זכויות, נהלים ושאלות נפוצות בטכניון (Technion FAQ)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li>מאגר מקיף ומסונן: מילואים (הפחתת 2 נק״ז ומועדי ג׳), טירונות עתודה (2 נק״ז בינארי), נבחרת פורמולה SAE (2 נק״ז לסמסטר או 6 נק״ז תכן גמר).</li>
                <li>חובת קורסי אנגלית, מכסת מל״ג וספורט, תנאי סף לפרויקט גמר ונהלי ערעורי בחינות.</li>
            </ul>
        </div>

        <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 10px; padding: 12px;">
            <div style="font-weight: 700; color: #a78bfa; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span>✨</span> <span>חבילת נגישות ושיפורי ממשק (UI/UX Supercharge)</span>
            </div>
            <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                <li><strong>מקשי קיצור גלובליים:</strong> 1-6 למעבר בין טאבים, Esc לסגירת כל מודאל, Ctrl+S לסנכרון מיידי, ומקש '?' ללוח מקשים.</li>
                <li><strong>כפתור חזרה לראש העמוד (🔝):</strong> כפתור צף חלק שמופיע בגלילה מעל 300px.</li>
                <li><strong>העתקה בלחיצה אחת (📋):</strong> העתקת קודי קורסים, משימות ותשובות נהלים ישירות ללוח עם Toast.</li>
                <li><strong>קורסים שנצפו לאחרונה ומועדפים:</strong> רצועת 7 הקורסים האחרונים שנפתחו וסימון כוכב (⭐) עם מונה בסרגל.</li>
                <li><strong>בקר נגישות לגודל טקסט:</strong> התאמת זום וגודל פונט (A- / 100% / A+) נשמרת אוטומטית.</li>
                <li><strong>איחוד כפתורי הורדה ישירה:</strong> חץ ירוק מואר (⬇️) להורדת APK נייד והתקנה במחשב.</li>
            </ul>
        </div>
    </div>\`;
};`;

appJsContent = appJsContent.replace(/window\.getFormattedChangelogHTML\s*=\s*function\(\)\s*\{[\s\S]*?\n\};/, v258ChangelogHTML);
fs.writeFileSync(appJsPath, appJsContent, 'utf8');
console.log('✓ Updated app.js to v2.5.8 with new changelog renderer');

// 6. Update index.html
const indexHtmlPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// A. Bump cache busting query params
html = html.replace(/\?v=2\.5\.7/g, '?v=2.5.8');
html = html.replace(/"v2\.5\.7"/g, '"v2.5.8"');
html = html.replace(/>v2\.5\.7</g, '>v2.5.8<');
html = html.replace(/v2\.5\.7 ✨/g, 'v2.5.8 ✨');
html = html.replace(/\(v2\.5\.7\)/g, '(v2.5.8)');

// B. Add script tag if not present
if (!html.includes('ui_enhancements.js')) {
    html = html.replace(
        '<script defer src="accessibility.js?v=2.5.8"></script>',
        '<script defer src="ui_enhancements.js?v=2.5.8"></script>\r\n    <script defer src="accessibility.js?v=2.5.8"></script>'
    );
    console.log('✓ Added ui_enhancements.js script tag to index.html');
}

// C. Add Command Palette button in .hud-card-actions
if (!html.includes('btn-open-command-palette')) {
    const targetDownloadBtn = '<button type="button" class="btn-hud-bell" id="btn-open-downloads-modal"';
    const commandPaletteBtn = `<button type="button" class="btn-hud-bell" id="btn-open-command-palette" onclick="if(window.openCommandPalette) window.openCommandPalette();" title="חיפוש חכם ופקודות מהירות (Ctrl+K) 🔍" aria-label="חיפוש חכם ופקודות מהירות">
                        <span class="bell-icon">🔍</span>
                    </button>\r\n                    `;
    html = html.replace(targetDownloadBtn, commandPaletteBtn + targetDownloadBtn);
    console.log('✓ Added Command Palette button to hud-card-actions in index.html');
}

// D. Add Recently Viewed Courses Strip above planner search
if (!html.includes('recent-courses-chips-container')) {
    const targetSearchWrap = '<div class="planner-search-wrap">';
    const recentStrip = `<!-- Recently Viewed Courses Strip -->\r\n                            <div id="recent-courses-chips-container" style="display: none;"></div>\r\n\r\n                            `;
    html = html.replace(targetSearchWrap, recentStrip + targetSearchWrap);
    console.log('✓ Added recent-courses-chips-container to Degree Planner in index.html');
}

// E. Add Smart Tools & Academic Rights card in Settings
if (!html.includes('settings-card-smart-tools')) {
    const smartToolsCard = `
                <!-- Section: Smart Tools & Academic Rights -->
                <div class="settings-card" id="settings-card-smart-tools">
                    <div class="settings-card-header">
                        <div class="settings-card-title">
                            <span>✨ כלים מתקדמים, מקשי קיצור ומדריך זכויות אקדמיות (Smart Tools & FAQ)</span>
                        </div>
                        <span class="app-version-badge" style="font-size: 0.65rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">חדש ב-v2.5.8</span>
                    </div>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">
                        כלי עזר מתקדמים לייעול הלימודים, השוואת קורסי בחירה צד-מול-צד, מקשי קיצור מהירים ומאגר שאלות ותשובות על נהלי הטכניון:
                    </p>

                    <div class="bug-report-grid">
                        <div class="bug-report-card-btn" onclick="window.openCommandPalette()" style="cursor: pointer;">
                            <div class="btn-title">
                                <span>🔍 חיפוש חכם ופקודות מהירות</span>
                                <span class="analytics-badge-v2" style="font-size: 0.62rem; padding: 2px 6px;">Ctrl + K</span>
                            </div>
                            <div class="btn-desc">
                                פתיחת שורת הפקודות החכמה לחיפוש מיידי של כל קורס, משימה, טאב או פעולה במערכת.
                            </div>
                            <div style="margin-top: 10px;">
                                <button type="button" class="btn btn-xs btn-primary" onclick="event.stopPropagation(); window.openCommandPalette();" style="width: 100%; justify-content: center;">
                                    🔍 פתח חיפוש חכם (Ctrl+K)
                                </button>
                            </div>
                        </div>

                        <div class="bug-report-card-btn" onclick="window.openCourseComparisonModal()" style="cursor: pointer;">
                            <div class="btn-title">
                                <span>⚖️ השוואת קורסי בחירה צד-מול-צד</span>
                                <span class="analytics-badge-v2" style="font-size: 0.62rem; padding: 2px 6px; background: rgba(52, 211, 153, 0.2); color: #34d399; border-color: rgba(52, 211, 153, 0.4);">השוואה חכמה</span>
                            </div>
                            <div class="btn-desc">
                                השוואת נק״ז, פקולטה, דרישות קדם, מועדי מבחן א׳ ו-ב׳ וזיהוי התנגשויות אוטומטי.
                            </div>
                            <div style="margin-top: 10px;">
                                <button type="button" class="btn btn-xs btn-primary" onclick="event.stopPropagation(); window.openCourseComparisonModal();" style="background: linear-gradient(135deg, #059669, #10b981); border-color: #34d399; width: 100%; justify-content: center;">
                                    ⚖️ פתח כלי השוואת קורסים
                                </button>
                            </div>
                        </div>

                        <div class="bug-report-card-btn" onclick="window.openFaqModal()" style="cursor: pointer;">
                            <div class="btn-title">
                                <span>📖 מדריך זכויות ושאלות נפוצות</span>
                                <span class="analytics-badge-v2" style="font-size: 0.62rem; padding: 2px 6px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">טכניון</span>
                            </div>
                            <div class="btn-desc">
                                מילואים (הפחתת 2 נק״ז ומועדי ג׳), טירונות עתודה, פורמולה טכניון, מל״ג וספורט, אנגלית, ופרויקטי גמר.
                            </div>
                            <div style="margin-top: 10px;">
                                <button type="button" class="btn btn-xs btn-primary" onclick="event.stopPropagation(); window.openFaqModal();" style="background: linear-gradient(135deg, #0284c7, #2563eb); width: 100%; justify-content: center;">
                                    📖 פתח מדריך זכויות אקדמיות
                                </button>
                            </div>
                        </div>

                        <div class="bug-report-card-btn" onclick="window.openKeyboardShortcutsModal()" style="cursor: pointer;">
                            <div class="btn-title">
                                <span>⌨️ מקשי קיצור במקלדת</span>
                                <span class="analytics-badge-v2" style="font-size: 0.62rem; padding: 2px 6px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">מקש '?'</span>
                            </div>
                            <div class="btn-desc">
                                טבלת כל קיצורי הדרך במקלדת למעבר מהיר בין טאבים (1-6), חיפוש מהיר, סגירת חלונות, ושמירה.
                            </div>
                            <div style="margin-top: 10px;">
                                <button type="button" class="btn btn-xs btn-outline" onclick="event.stopPropagation(); window.openKeyboardShortcutsModal();" style="border-color: #f59e0b; color: #fbbf24; width: 100%; justify-content: center;">
                                    ⌨️ צפה במקשי הקיצור
                                </button>
                            </div>
                        </div>

                        <div class="bug-report-card-btn">
                            <div class="btn-title">
                                <span>🔤 גודל טקסט וממשק (Accessibility Zoom)</span>
                                <span class="analytics-badge-v2" id="ui-font-scale-label" style="font-size: 0.62rem; padding: 2px 6px;">100%</span>
                            </div>
                            <div class="btn-desc">
                                התאמה מהירה של גודל הפונטים והתצוגה לקריאה נוחה במיוחד במסכים שונים:
                            </div>
                            <div style="margin-top: 10px; display: flex; gap: 8px;">
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.adjustUiTextScale(-1)" style="flex: 1; justify-content: center; font-weight: 700;">A- (הקטן)</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.adjustUiTextScale(0)" style="flex: 1; justify-content: center; font-weight: 700;">100%</button>
                                <button type="button" class="btn btn-xs btn-outline" onclick="window.adjustUiTextScale(1)" style="flex: 1; justify-content: center; font-weight: 700;">A+ (הגדל)</button>
                            </div>
                        </div>
                    </div>
                </div>
`;
    const targetAfterDist = '<!-- Section 3: Editable Google Calendar 2-Way Sync -->';
    html = html.replace(targetAfterDist, smartToolsCard + '\r\n                ' + targetAfterDist);
    console.log('✓ Added settings-card-smart-tools to Settings in index.html');
}

// F. Add v2.5.8 to What's New list in Settings
const v258ChangelogLi = `<li><strong>v2.5.8 (25/10/2026):</strong> שדרוג חוויית משתמש וממשק חכם (UI Supercharge Suite): שורת פקודות וחיפוש חכם מהיר (Ctrl+K / ⌘K) עם ניווט מקלדת בכלל הקורסים והמשימות, מקשי קיצור גלובליים (1-6 לטאבים, Esc לסגירה, Ctrl+S לסנכרון), כלי השוואת קורסי בחירה צד-מול-צד עם זיהוי התנגשויות מועדי בחינה, מדריך זכויות ושאלות נפוצות בטכניון (מילואים, עתודה, פורמולה, אנגלית, מל״ג וספורט), כפתור צף לחזרה לראש העמוד, סרגל קורסים אחרונים ומועדפים, מחוון קריאה דינמי במודאלים, ובקר נגישות לגודל טקסט.</li>\r\n                            `;
const whatsNewTarget = '<ul class="version-changelog-list" style="margin: 0; padding-right: 20px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.6; max-height: 280px; overflow-y: auto;">\r\n                            ';
if (html.includes(whatsNewTarget) && !html.includes('v2.5.8 (25/10/2026)')) {
    html = html.replace(whatsNewTarget, whatsNewTarget + v258ChangelogLi);
    console.log('✓ Added v2.5.8 to What\'s New list in index.html');
}

// G. Update update-modal fallback description in index.html
const modalDescStart = '<div id="update-modal-description" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;">';
if (html.includes(modalDescStart)) {
    const endTag = '</div>\r\n\r\n                <div class="modal-footer"';
    const idxStart = html.indexOf(modalDescStart);
    const idxEnd = html.indexOf(endTag, idxStart);
    if (idxStart !== -1 && idxEnd !== -1) {
        const replacementModalDesc = `<div id="update-modal-description" style="margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="background: rgba(2, 132, 199, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>🔍</span> <span>חיפוש חכם ופקודות מהירות (Ctrl+K / ⌘K)</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>חיפוש מיידי וניווט מהיר בכל 350+ הקורסים האקדמיים, משימות, טאבים ופעולות מערכת.</li>
                            <li>תמיכה מלאה במקשי מקלדת (חצים ↑/↓, Enter לבחירה, Esc לסגירה).</li>
                        </ul>
                    </div>

                    <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>⚖️</span> <span>השוואת קורסי בחירה צד-מול-צד וזיהוי התנגשויות בחינה</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>השוואת נק״ז, סילבוס, דרישות קדם ורשימות פקולטיות.</li>
                            <li>זיהוי אוטומטי והתראה בולטת בעת התנגשות תאריכי מועד א׳ או מועד ב׳.</li>
                        </ul>
                    </div>

                    <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>📖</span> <span>מדריך זכויות ונהלים בטכניון (FAQ)</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>מילואים (הפחתת 2 נק״ז ומועדי ג׳), טירונות עתודה (2 נק״ז), פורמולה (2 נק״ז לסמסטר), קורסי אנגלית, מל״ג וספורט.</li>
                        </ul>
                    </div>

                    <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 10px; padding: 12px;">
                        <div style="font-weight: 700; color: #a78bfa; display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span>✨</span> <span>מקשי קיצור, כפתור ציפה ובקר נגישות</span>
                        </div>
                        <ul style="margin: 0; padding-right: 20px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.55;">
                            <li>מעבר מהיר בין טאבים (1-6), כפתור חזרה לראש העמוד (🔝), העתקה בלחיצה (📋), ורצועת קורסים אחרונים.</li>
                            <li>בקר נגישות לגודל טקסט וממשק (A- / 100% / A+).</li>
                        </ul>
                    </div>
                </div>`;
        html = html.substring(0, idxStart) + replacementModalDesc + html.substring(idxEnd);
        console.log('✓ Updated static update-modal-description in index.html');
    }
}

fs.writeFileSync(indexHtmlPath, html, 'utf8');
console.log('✓ Successfully wrote updated index.html');
