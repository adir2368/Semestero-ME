const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '..', 'pangea_knowledge_hub.js');
let fileContent = fs.readFileSync(targetFilePath, 'utf8');

const concepts = require('./generate_pangea_concepts.js');
console.log(`Loaded ${concepts.length} concepts from generator.`);

// Check if PANGEA_CONCEPTS_INDEX is already present
if (fileContent.includes('const PANGEA_CONCEPTS_INDEX =')) {
    console.log('PANGEA_CONCEPTS_INDEX already present in file, replacing it...');
    fileContent = fileContent.replace(
        /const PANGEA_CONCEPTS_INDEX = \[[\s\S]*?\];\n/,
        ''
    );
}

// Format concepts JSON safely
const conceptsCode = `\n    const PANGEA_CONCEPTS_INDEX = ${JSON.stringify(concepts, null, 4)};\n`;

// Insert PANGEA_CONCEPTS_INDEX right before "const PangeaHub = {"
const insertMarker = '    const PangeaHub = {';
if (!fileContent.includes(insertMarker)) {
    throw new Error('Could not find insertMarker "const PangeaHub = {"');
}

fileContent = fileContent.replace(insertMarker, conceptsCode + insertMarker);

// Also attach concepts to PangeaHub:
// inside PangeaHub = {
//   catalog: PANGEA_CATALOG,
//   codeToTag: PANGEA_CODE_TO_TAG,
//   concepts: PANGEA_CONCEPTS_INDEX,
fileContent = fileContent.replace(
    'catalog: PANGEA_CATALOG,\n        codeToTag: PANGEA_CODE_TO_TAG,',
    'catalog: PANGEA_CATALOG,\n        codeToTag: PANGEA_CODE_TO_TAG,\n        concepts: PANGEA_CONCEPTS_INDEX,'
);

// Update search method
const oldSearchStart = 'search: function(query, courseCodeFilter = null) {';
const newSearchCode = `search: function(query, courseCodeFilter = null) {
            if (!query || !query.trim()) return [];
            const q = query.trim().toLowerCase();
            const results = [];

            // 1. Search deep concepts, theorems, laws and formulas
            const conceptMatches = [];
            const targetCourseTag = courseCodeFilter 
                ? (this.codeToTag[courseCodeFilter] || courseCodeFilter) 
                : null;
            
            const conceptsPool = this.concepts || PANGEA_CONCEPTS_INDEX || [];
            conceptsPool.forEach(c => {
                if (targetCourseTag && c.courseTag !== targetCourseTag) return;
                
                const nameMatch = c.name && c.name.toLowerCase().includes(q);
                const enNameMatch = c.enName && c.enName.toLowerCase().includes(q);
                const aliasMatch = Array.isArray(c.aliases) && c.aliases.some(a => a.toLowerCase().includes(q));
                const formulaMatch = c.formula && c.formula.toLowerCase().includes(q);
                const descMatch = c.description && c.description.toLowerCase().includes(q);
                
                if (nameMatch || enNameMatch || aliasMatch || formulaMatch || descMatch) {
                    let score = 0;
                    if (nameMatch) score += 100;
                    if (aliasMatch) score += 80;
                    if (enNameMatch) score += 60;
                    if (formulaMatch) score += 40;
                    if (descMatch) score += 20;

                    conceptMatches.push({
                        type: 'concept',
                        id: c.id,
                        category: c.category || 'concept',
                        categoryLabel: c.categoryLabel || '💡 מושג מפתח',
                        courseTag: c.courseTag,
                        courseTitle: c.courseTitle,
                        title: c.name,
                        enName: c.enName,
                        formula: c.formula,
                        description: c.description,
                        url: c.url,
                        lectureName: c.lectureName,
                        score: score
                    });
                }
            });

            // Sort concept matches by score descending
            conceptMatches.sort((a, b) => b.score - a.score);

            // 2. Search lectures, homework, and exams`;

// Replace search body
const searchRegex = /search:\s*function\(query,\s*courseCodeFilter\s*=\s*null\)\s*\{[\s\S]*?\/\/ Match in lectures/;
fileContent = fileContent.replace(searchRegex, newSearchCode + '\n\n            const targetTags = courseCodeFilter \n                ? [this.codeToTag[courseCodeFilter] || courseCodeFilter]\n                : Object.keys(PANGEA_CATALOG);\n\n            targetTags.forEach(tag => {\n                const course = PANGEA_CATALOG[tag];\n                if (!course) return;\n\n                // Match in lectures');

// Update return statement of search to return [...conceptMatches, ...results].slice(0, 35)
fileContent = fileContent.replace(
    'return results.slice(0, 30); // Top 30 matches',
    'return [...conceptMatches, ...results].slice(0, 35); // Prioritize concept matches + catalog'
);

// Update renderGlobalSearchResults
const oldRenderStart = 'renderGlobalSearchResults: function(query) {';
const oldRenderPattern = /renderGlobalSearchResults:\s*function\(query\)\s*\{[\s\S]*?container\.innerHTML\s*=\s*results\.map\(r => `[\s\S]*?`\)\.join\(''\);\s*\}/;

const newRenderCode = `renderGlobalSearchResults: function(query) {
            const container = document.getElementById('pangea-global-search-results');
            if (!container) return;
            if (!query || !query.trim()) {
                container.innerHTML = \`
                    <div style="text-align: center; color: #94a3b8; padding: 30px 10px; font-size: 0.85rem;">
                        <span>💡 הקלד מושג, משפט או נושא (למשל: <em>שטיינר</em>, <em>ברנולי</em>, <em>מור</em>, <em>פון מיזס</em>, <em>לפלס</em>, <em>קרנו</em>, <em>2024</em>) לחיפוש מיידי ב-38 קורסי הטכניון בפנגייה.</span>
                    </div>
                \`;
                return;
            }

            const results = this.search(query);
            if (results.length === 0) {
                container.innerHTML = \`
                    <div style="text-align: center; color: #94a3b8; padding: 25px 10px;">
                        <p style="font-size: 0.88rem; margin-bottom: 12px;">לא נמצאו תוצאות ישירות בפנגייה עבור <strong>"\${query}"</strong></p>
                        <a href="https://idofangbentov.uk/?q=\${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="border-color: #38bdf8; color: #38bdf8; text-decoration: none;">
                            🌐 חפש באתר הראשי של פנגייה ↗
                        </a>
                    </div>
                \`;
                return;
            }

            container.innerHTML = results.map(r => {
                const safeTitle = (r.title || '').replace(/'/g, "\\\\'");
                if (r.type === 'concept') {
                    return \`
                        <div class="pangea-search-result-card pangea-concept-card" onclick="window.PangeaHub.openQuickPeek('\${r.url}', '\${safeTitle}', '\${r.url}')" style="border: 1px solid rgba(56, 189, 248, 0.45); background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85)); box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-right: 4px solid #38bdf8; margin-bottom: 8px; padding: 12px 14px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="pangea-result-badge" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.35); padding: 2px 7px; border-radius: 4px; font-size: 0.72rem;">\${r.categoryLabel}</span>
                                    <span style="font-size: 0.74rem; color: #94a3b8; font-style: italic;">\${r.enName || ''}</span>
                                </div>
                                <span class="pangea-result-course" style="color: #a78bfa; font-weight: 600; font-size: 0.75rem;">\${r.courseTitle}</span>
                            </div>
                            <div class="pangea-result-title" style="font-size: 0.95rem; font-weight: 700; color: #f8fafc; margin-bottom: 6px;">
                                \${r.title}
                            </div>
                            \${r.formula ? \`
                                <div class="pangea-concept-formula" style="background: rgba(2, 6, 23, 0.85); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 6px 10px; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 0.82rem; color: #38bdf8; direction: ltr; text-align: left; margin-bottom: 6px; overflow-x: auto;">
                                    <code>\${r.formula}</code>
                                </div>
                            \` : ''}
                            <div class="pangea-concept-desc" style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.45; margin-bottom: 6px;">
                                \${r.description}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.72rem; color: #64748b;">
                                <span>📖 לחץ לצפייה בסיכום המלא בפנגייה</span>
                                <span style="color: #38bdf8;">פתח קריאה מהירה ↗</span>
                            </div>
                        </div>
                    \`;
                }

                return \`
                    <div class="pangea-search-result-card" onclick="window.PangeaHub.openQuickPeek('\${r.url}', '\${safeTitle}', '\${r.url}')">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span class="pangea-result-badge">\${r.categoryLabel}</span>
                            <span class="pangea-result-course">\${r.courseTitle}</span>
                        </div>
                        <div class="pangea-result-title">\${r.title}</div>
                    </div>
                \`;
            }).join('');
        }`;

fileContent = fileContent.replace(oldRenderPattern, newRenderCode);

fs.writeFileSync(targetFilePath, fileContent, 'utf8');
console.log('Successfully injected PANGEA_CONCEPTS_INDEX and updated PangeaHub in pangea_knowledge_hub.js!');
