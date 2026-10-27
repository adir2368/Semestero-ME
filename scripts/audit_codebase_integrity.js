const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('🔍 SEMESTERO ME - CODEBASE INTEGRITY & STATIC HEALTH AUDITOR');
console.log('========================================================================\n');

// 1. Verify all document.getElementById calls in app.js exist in index.html
const indexHtmlPath = path.join(ROOT, 'index.html');
const appJsPath = path.join(ROOT, 'app.js');
const plannerJsPath = path.join(ROOT, 'planner_module.js');
const authSyncPath = path.join(ROOT, 'auth_sync.js');

const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
const idRegex = /id=["']([^"']+)["']/g;
const htmlIds = new Set();
let m;
while ((m = idRegex.exec(htmlContent)) !== null) {
    htmlIds.add(m[1]);
}
console.log(`[DOM Audit] Found ${htmlIds.size} unique element IDs in index.html.`);

function auditGetElementById(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const regex = /document\.getElementById\(\s*["']([^"']+)["']\s*\)/g;
    const missing = new Set();
    const found = new Set();
    let match;
    while ((match = regex.exec(code)) !== null) {
        const id = match[1];
        if (!htmlIds.has(id)) {
            // Check if dynamically created or legitimately optional
            missing.add(id);
        } else {
            found.add(id);
        }
    }
    return { found, missing };
}

const appAudit = auditGetElementById(appJsPath);
console.log(`[DOM Audit - app.js] Found ${appAudit.found.size} valid IDs referenced, ${appAudit.missing.size} missing/dynamic IDs.`);

// Filter missing IDs to see which ones might be bugs vs template/dynamic IDs
const suspiciousMissing = [];
for (const id of appAudit.missing) {
    // Dynamic IDs usually contain hyphens, numbers, or are created at runtime
    if (!id.includes('${') && !id.startsWith('course-') && !id.startsWith('slot-') && !id.startsWith('task-') && !id.startsWith('sem-') && !id.startsWith('exam-') && !id.startsWith('node-')) {
        suspiciousMissing.push(id);
    }
}
console.log(`[DOM Audit] Suspicious missing IDs (${suspiciousMissing.length}):`, suspiciousMissing.slice(0, 15));

// 2. Scan for hardcoded outdated versions
console.log('\n[Version Audit] Checking for legacy version strings across active sources...');
const activeFiles = ['index.html', 'app.js', 'auth_sync.js', 'planner_module.js', 'package.json', 'sw.js'];
const legacyVersions = ['2.5.8', '2.5.9', '2.7.0', '2.7.1', '2.7.2'];

for (const f of activeFiles) {
    const fpath = path.join(ROOT, f);
    if (!fs.existsSync(fpath)) continue;
    const content = fs.readFileSync(fpath, 'utf-8');
    for (const lv of legacyVersions) {
        // Exclude changelog lists in index.html where previous versions are legitimately documented
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(lv)) {
                // If it's a changelog or revision note, ignore
                if (line.includes('<li><strong>v') || line.includes('note:') || line.includes('description:') || line.includes('רוויזיה')) {
                    continue;
                }
                if (line.includes('badge') || line.includes('version') || line.includes('CACHE_NAME')) {
                    console.log(`⚠️  Potential stale version ${lv} in ${f}:${i + 1} -> ${line.trim()}`);
                }
            }
        }
    }
}

// 3. Inspect suspicious missing IDs for null checks
console.log('\n[Safety Audit] Checking suspicious missing IDs for safe null guards...');
const appLines = fs.readFileSync(appJsPath, 'utf-8').split('\n');
const criticalMissing = ['stat-credits', 'btn-register-course', 'btn-unregister-course', 'tree-viewport', 'connections-svg', 'btn-open-widgets', 'btn-moodle-mock-trigger'];

for (const t of criticalMissing) {
    for (let i = 0; i < appLines.length; i++) {
        const line = appLines[i];
        if (line.includes(`getElementById("${t}")`) || line.includes(`getElementById('${t}')`)) {
            // Check next 3 lines to see if it's accessed without check
            const context = appLines.slice(i, Math.min(appLines.length, i + 4)).join(' ');
            const hasGuard = context.includes('if (') || context.includes('?') || context.includes('&&') || context.includes('if(!');
            console.log(`- ${t} at line ${i + 1}: ${hasGuard ? '✅ Guarded' : '⚠️ UNGUARDED'}`);
            console.log(`  Code: ${line.trim().slice(0, 80)}`);
        }
    }
}

console.log('\n[Integrity Audit Completed]');
