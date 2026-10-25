const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const indexPath = path.join(rootDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const oldTarget = `<div style="background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 12px 14px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.3rem;">💻</span>
                            <span style="font-weight: 700; color: #f1f5f9; font-size: 0.9rem;">גרסת מחשב (Windows / Mac)</span>
                        </div>
                        <a href="https://github.com/adir2368/Semestero-ME/releases" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; color: #38bdf8; text-decoration: underline; font-weight: 600;">
                            עבור ל-GitHub Releases ↗
                        </a>
                    </div>
                </div>`;

const newTarget = `<div style="background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px; padding: 14px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.3rem;">💻</span>
                            <span style="font-weight: 700; color: #f1f5f9; font-size: 0.95rem;">גרסת שולחן עבודה למחשב (Windows)</span>
                        </div>
                        <span class="analytics-badge-v2" style="font-size: 0.65rem; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">v2.5.9 • x64</span>
                    </div>
                    <p style="font-size: 0.8rem; color: #94a3b8; margin: 0 0 10px 0;">
                        הורדה ישירה של האפליקציה השולחנית למחשב. ניתן להוריד את קובץ ההרצה הישיר (Semestero-ME.exe) או את החבילה המלאה (ZIP).
                    </p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <a href="https://github.com/adir2368/Semestero-ME/releases/download/v2.5.9/Semestero-ME-Windows-x64.zip" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; min-width: 170px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; padding: 9px 12px; background: linear-gradient(135deg, #0284c7, #2563eb); text-decoration: none; color: #fff; border-radius: 8px; font-size: 0.82rem; border: none;">
                            <span>📦</span> <span>הורדת חבילה מלאה (ZIP)</span>
                        </a>
                        <a href="https://github.com/adir2368/Semestero-ME/releases/download/v2.5.9/Semestero-ME.exe" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="flex: 1; min-width: 170px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; padding: 9px 12px; border: 1px solid #38bdf8; text-decoration: none; color: #38bdf8; border-radius: 8px; font-size: 0.82rem;">
                            <span>⚡</span> <span>קובץ הרצה (Semestero-ME.exe)</span>
                        </a>
                    </div>
                </div>`;

const hasCRLF = html.includes('\r\n');
const normHtml = html.replace(/\r\n/g, '\n');
const normOld = oldTarget.replace(/\r\n/g, '\n');
const normNew = newTarget.replace(/\r\n/g, '\n');

if (normHtml.includes(normOld)) {
    const updated = normHtml.replace(normOld, normNew);
    fs.writeFileSync(indexPath, hasCRLF ? updated.replace(/\n/g, '\r\n') : updated, 'utf8');
    console.log('Successfully updated direct-download-modal desktop card in index.html!');
} else {
    console.error('Target not found in index.html');
}
