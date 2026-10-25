const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `<div class="bug-report-card-btn" id="card-btn-interactive-tour" style="border-color: rgba(56, 189, 248, 0.45); background: rgba(14, 165, 233, 0.05);">
                            <div class="btn-title">
                                <span>🧭 סיור מודרך במערכת (Interactive Tour)</span>
                                <span class="analytics-badge-v2" style="font-size: 0.6rem; padding: 2px 6px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">הדרכה</span>
                            </div>
                            <div class="btn-desc">
                                רוצה רענון על כל הפיצ'רים, מתכנן התואר, כפתורי העזרה ולוח המשימות? הפעל את סיור ההדרכה בכל עת.
                            </div>
                            <div style="margin-top: 10px;">
                                <button type="button" class="btn btn-xs btn-primary" id="btn-settings-start-tour" onclick="if (window.startInteractiveTour) window.startInteractiveTour();" style="background: linear-gradient(135deg, #0284c7, #2563eb); font-weight: 600; width: 100%; justify-content: center;">
                                    🚀 הפעל את הסיור עכשיו
                                </button>
                            </div>
                        </div>`;

const newBlock = `<div class="bug-report-card-btn" id="card-btn-interactive-tour" style="border-color: rgba(56, 189, 248, 0.45); background: rgba(14, 165, 233, 0.05);">
                            <div class="btn-title">
                                <span>🧭 אקדמיית הדרכה וסיור מודרך (Tutorial Academy)</span>
                                <span class="analytics-badge-v2" style="font-size: 0.6rem; padding: 2px 6px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border-color: rgba(56, 189, 248, 0.4);">מרכז הדרכה</span>
                            </div>
                            <div class="btn-desc">
                                רוצה רענון על כל הפיצ'רים, מתכנן התואר, כפתורי העזרה ולוח המשימות? הפעל סיור מודרך מלא בן 10 שלבים או בחר פרק ספציפי באקדמיית ההדרכה. זמין גם במקש <strong>T</strong> ובשורת הפקודות.
                            </div>
                            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" class="btn btn-xs btn-primary" id="btn-settings-start-tour" onclick="if (window.startInteractiveTour) window.startInteractiveTour(0);" style="background: linear-gradient(135deg, #0284c7, #2563eb); font-weight: 700; flex: 1; min-width: 130px; justify-content: center;">
                                    🚀 סיור מלא (10 שלבים)
                                </button>
                                <button type="button" class="btn btn-xs btn-outline" id="btn-settings-open-tutorial-hub" onclick="if (window.openTutorialHubModal) window.openTutorialHubModal();" style="border-color: #38bdf8; color: #38bdf8; font-weight: 700; flex: 1; min-width: 130px; justify-content: center;">
                                    📚 אקדמיית הדרכה לפי נושא
                                </button>
                            </div>
                        </div>`;

const hasCRLF = content.includes('\r\n');
const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
    const updated = normContent.replace(normOld, normNew);
    fs.writeFileSync(filePath, hasCRLF ? updated.replace(/\n/g, '\r\n') : updated, 'utf8');
    console.log('Successfully updated settings card-btn-interactive-tour!');
} else {
    console.error('Could not find normOld in content!');
}
