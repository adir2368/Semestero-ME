const fs = require('fs');
const path = require('path');

const ROOT = __dirname ? path.resolve(__dirname, '..') : process.cwd();

// 1. Update index.html
const indexPath = path.join(ROOT, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const oldSearchInput = '<input type="text" id="planner-elective-search-input" name="planner_elective_search" aria-label="חיפוש קורס בחירה לפי שם או מספר" class="planner-search-input" placeholder="🔍 חיפוש קורס לפי שם או מספר...">';
const newSearchInput = '<input type="text" id="planner-elective-search-input" name="planner_elective_search" aria-label="חיפוש קורס בכלל קורסי הטכניון לפי שם או מספר" class="planner-search-input" placeholder="🔍 חיפוש קורס בכלל קורסי הטכניון (שם או מספר)...">';

if (indexHtml.includes(oldSearchInput)) {
    indexHtml = indexHtml.replace(oldSearchInput, newSearchInput);
    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('[index.html] Search input placeholder updated successfully');
} else {
    console.log('[index.html] Target search input already updated or not found');
}

// 2. Update app.js
const appPath = path.join(ROOT, 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

const exportTarget = '    return results;\n}\n\n// ==============================================================================\n// Prerequisite Interactive Chips';
const exportTargetCRLF = '    return results;\r\n}\r\n\r\n// ==============================================================================\r\n// Prerequisite Interactive Chips';

const exportCode = `    return results;
}

if (typeof window !== 'undefined') {
    window.findCheeseForkCourse = findCheeseForkCourse;
    window.searchCheeseForkCourses = searchCheeseForkCourses;
    window.ensureCheeseForkDatabase = ensureCheeseForkDatabase;
    window.initCheeseForkDatabase = initCheeseForkDatabase;
}

// ==============================================================================
// Prerequisite Interactive Chips`;

if (appJs.includes(exportTargetCRLF)) {
    appJs = appJs.replace(exportTargetCRLF, exportCode.replace(/\n/g, '\r\n'));
    fs.writeFileSync(appPath, appJs, 'utf8');
    console.log('[app.js] CheeseFork functions exported to window successfully (CRLF)');
} else if (appJs.includes(exportTarget)) {
    appJs = appJs.replace(exportTarget, exportCode);
    fs.writeFileSync(appPath, appJs, 'utf8');
    console.log('[app.js] CheeseFork functions exported to window successfully (LF)');
} else {
    console.log('[app.js] Notice: Export block already present or target not matched');
}

// 3. Update planner_module.js
const plannerPath = path.join(ROOT, 'planner_module.js');
let plannerJs = fs.readFileSync(plannerPath, 'utf8');

// A. Update resolveCourseObject
const oldResolveCf = `        // 6. CHEESEFORK_DB
        if (typeof CHEESEFORK_DB !== 'undefined') {
            for (const k of cKeys) {
                if (CHEESEFORK_DB[k]) {
                    const cf = CHEESEFORK_DB[k];
                    return {
                        code: k,
                        altCode: cf.altCode || null,
                        name: cf.name,
                        credits: cf.credits || 3.0,
                        prereqs: cf.prerequisites || []
                    };
                }
            }
        }`;

const newResolveCf = `        // 6. CHEESEFORK_DB / Technion-wide course catalog (2,784 Technion courses)
        let cf = null;
        if (typeof window !== 'undefined' && typeof window.findCheeseForkCourse === 'function') {
            for (const k of cKeys) {
                cf = window.findCheeseForkCourse(k);
                if (cf) break;
            }
        }
        if (!cf && typeof window !== 'undefined' && Array.isArray(window.CHEESEFORK_DB)) {
            cf = window.CHEESEFORK_DB.find(item => {
                const itemKeys = getNormalizedCodes(item.code6, item.rawNum);
                return itemKeys.some(nk => cKeys.has(nk));
            });
        }
        if (!cf && typeof CHEESEFORK_DB !== 'undefined' && Array.isArray(CHEESEFORK_DB)) {
            cf = CHEESEFORK_DB.find(item => {
                const itemKeys = getNormalizedCodes(item.code6, item.rawNum);
                return itemKeys.some(nk => cKeys.has(nk));
            });
        }
        if (cf) {
            const detectedType = cf.detectedType || (cf.faculty && (cf.faculty.includes('ספורט') || cf.faculty.includes('גופני')) ? 'sports' : (cf.faculty && (cf.faculty.includes('הומניסטיים') || cf.faculty.includes('אמנות')) ? 'humanities' : 'elective'));
            return {
                code: cf.code6 || cf.rawNum,
                altCode: cf.rawNum || cf.code6,
                name: cf.name,
                credits: typeof cf.credits === 'number' ? cf.credits : (parseFloat(cf.credits) || 3.0),
                faculty: cf.faculty || '',
                syllabus: cf.syllabus || '',
                prereqs: cf.parsedPrereqs || (typeof cf.prereqs === 'string' ? (cf.prereqs.match(/\\d{6,8}/g) || []) : (cf.prerequisites || [])),
                type: detectedType,
                list: detectedType === 'sports' ? 'SPORTS' : (detectedType === 'humanities' ? 'MALAG' : 'E'),
                isTechnionWide: true
            };
        }`;

if (plannerJs.includes(oldResolveCf.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(oldResolveCf.replace(/\n/g, '\r\n'), newResolveCf.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] resolveCourseObject upgraded for CHEESEFORK_DB (CRLF)');
} else if (plannerJs.includes(oldResolveCf)) {
    plannerJs = plannerJs.replace(oldResolveCf, newResolveCf);
    console.log('[planner_module.js] resolveCourseObject upgraded for CHEESEFORK_DB (LF)');
}

// B. Update renderAddElectivesSection: search Technion database
const searchElectivesTarget = `            const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E', 'SPORTS', 'MALAG'] : [selectedCategory];
            cats.forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push(course);
                });
            });
        }`;

const searchElectivesReplacement = `            const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E', 'SPORTS', 'MALAG'] : [selectedCategory];
            cats.forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push(course);
                });
            });

            // 3b. Search Technion-wide course catalog (CHEESEFORK_DB - 2,784 Technion courses) when a search query is active
            if ((normQ.length >= 2 || cleanDigitsQ.length >= 2) && (selectedCategory === 'ALL' || selectedCategory === 'E' || selectedCategory === 'MALAG' || selectedCategory === 'SPORTS')) {
                const technionDb = (typeof window !== 'undefined' && Array.isArray(window.CHEESEFORK_DB))
                    ? window.CHEESEFORK_DB
                    : ((typeof cheeseForkList !== 'undefined' && Array.isArray(cheeseForkList)) ? cheeseForkList : []);

                if (technionDb.length > 0) {
                    technionDb.forEach(c => {
                        const cCode = c.code6 || c.rawNum;
                        const cAlt = c.rawNum || c.code6;
                        const keys = getNormalizedCodes(cCode, cAlt);

                        // Skip if already placed in plan
                        if (keys.some(k => placedCodes.has(k))) return;

                        // Skip if already completed
                        if (isCourseCompleted(cCode, cAlt)) return;

                        // Skip if already in coursesToShow
                        if (coursesToShow.some(item => {
                            const itemKeys = getNormalizedCodes(item.code, item.altCode);
                            return itemKeys.some(k => keys.includes(k));
                        })) return;

                        const detectedType = c.detectedType || (c.faculty && (c.faculty.includes('ספורט') || c.faculty.includes('גופני')) ? 'sports' : (c.faculty && (c.faculty.includes('הומניסטיים') || c.faculty.includes('אמנות')) ? 'humanities' : 'elective'));

                        // Honor category filter if user selected specific filter
                        if (selectedCategory === 'SPORTS' && detectedType !== 'sports') return;
                        if (selectedCategory === 'MALAG' && detectedType !== 'humanities') return;
                        if (selectedCategory === 'E' && detectedType !== 'elective') return;

                        // Check search match
                        const normName = (c.name || '').replace(/["'״׳\`]/g, '').toLowerCase();
                        const matchName = normName.includes(normQ) || (c.name || '').toLowerCase().includes(q);

                        let matchCode = (cCode || '').includes(q) || (cAlt && cAlt.includes(q));
                        if (!matchCode && cleanDigitsQ && cleanDigitsQ.length >= 2) {
                            const cDigits = (cCode || '').replace(/\\D/g, '');
                            const aDigits = (cAlt || '').replace(/\\D/g, '');
                            matchCode = cDigits.includes(cleanDigitsQ) || aDigits.includes(cleanDigitsQ) ||
                                        cDigits.replace(/^0+/, '').includes(cleanDigitsQ.replace(/^0+/, '')) ||
                                        aDigits.replace(/^0+/, '').includes(cleanDigitsQ.replace(/^0+/, ''));
                        }

                        if (matchName || matchCode) {
                            const creds = typeof c.credits === 'number' ? c.credits : (parseFloat(c.credits) || 3.0);
                            const assignedList = detectedType === 'sports' ? 'SPORTS' : (detectedType === 'humanities' ? 'MALAG' : 'E');
                            coursesToShow.push({
                                code: cCode,
                                altCode: cAlt,
                                name: c.name,
                                credits: creds,
                                faculty: c.faculty || '',
                                syllabus: c.syllabus || '',
                                prereqs: c.parsedPrereqs || (typeof c.prereqs === 'string' ? (c.prereqs.match(/\\d{6,8}/g) || []) : (c.prerequisites || [])),
                                type: detectedType,
                                list: assignedList,
                                isTechnionWide: true
                            });
                        }
                    });
                }
            }
        }`;

if (plannerJs.includes(searchElectivesTarget.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(searchElectivesTarget.replace(/\n/g, '\r\n'), searchElectivesReplacement.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] Technion-wide course search injected into pool (CRLF)');
} else if (plannerJs.includes(searchElectivesTarget)) {
    plannerJs = plannerJs.replace(searchElectivesTarget, searchElectivesReplacement);
    console.log('[planner_module.js] Technion-wide course search injected into pool (LF)');
}

// C. Update cardsHtml tags & labels
const oldCardTag = `            const cardsHtml = visibleCourses.map(course => {
                const isSportItem = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagItem = course.list === 'MALAG' || course.type === 'humanities';
                const isMandatoryItem = course.isMandatoryCatalogItem;

                const tagClass = course.isUnassignedItem 
                    ? 'tag-mandatory' 
                    : (isMandatoryItem
                        ? (course.isPlaced ? 'tag-placed-mandatory' : 'tag-missing-mandatory')
                        : (isSportItem ? 'tag-sports' : (isMalagItem ? 'tag-malag' : (course.list ? \`tag-list-\${course.list}\` : 'tag-mandatory'))));
                
                const tagLabel = course.isUnassignedItem 
                    ? 'שלא שובץ' 
                    : (isMandatoryItem
                        ? (course.isPlaced ? \`✓ משובץ בסמ' \${course.placedSem}\` : '⚠️ חסר בתכנון')
                        : (isSportItem ? '🏃 ספורט' : (isMalagItem ? '🎭 מל״ג' : (course.list ? \`רשימה \${course.list}׳\` : 'חובה'))));`;

const newCardTag = `            const cardsHtml = visibleCourses.map(course => {
                const isSportItem = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagItem = course.list === 'MALAG' || course.type === 'humanities';
                const isMandatoryItem = course.isMandatoryCatalogItem;
                const isTechnionWide = course.isTechnionWide;

                const tagClass = course.isUnassignedItem 
                    ? 'tag-mandatory' 
                    : (isMandatoryItem
                        ? (course.isPlaced ? 'tag-placed-mandatory' : 'tag-missing-mandatory')
                        : (isSportItem ? 'tag-sports' : (isMalagItem ? 'tag-malag' : (isTechnionWide ? 'tag-technion-wide' : (course.list ? \`tag-list-\${course.list}\` : 'tag-mandatory')))));
                
                const tagLabel = course.isUnassignedItem 
                    ? 'שלא שובץ' 
                    : (isMandatoryItem
                        ? (course.isPlaced ? \`✓ משובץ בסמ' \${course.placedSem}\` : '⚠️ חסר בתכנון')
                        : (isSportItem ? '🏃 ספורט' : (isMalagItem ? '🎭 מל״ג' : (isTechnionWide ? '🌐 בחירה חופשית' : (course.list ? \`רשימה \${course.list}׳\` : 'חובה')))));`;

if (plannerJs.includes(oldCardTag.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(oldCardTag.replace(/\n/g, '\r\n'), newCardTag.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] cardsHtml tag & label logic updated (CRLF)');
} else if (plannerJs.includes(oldCardTag)) {
    plannerJs = plannerJs.replace(oldCardTag, newCardTag);
    console.log('[planner_module.js] cardsHtml tag & label logic updated (LF)');
}

// Add faculty preview to pool item meta if available
const oldPoolMeta = `                                <span>\${escapeHtml(course.code)}</span>
                                <span>• \${course.credits} נק״ז</span>
                            </div>`;

const newPoolMeta = `                                <span>\${escapeHtml(course.code)}</span>
                                <span>• \${course.credits} נק״ז</span>
                                \${course.faculty ? \`<span style="color: #94a3b8; font-size: 0.68rem; margin-right: 4px;" title="\${escapeHtml(course.faculty)}">• \${escapeHtml(course.faculty.replace('הפקולטה ל', '').replace('המחלקה ל', ''))}</span>\` : ''}
                            </div>`;

if (plannerJs.includes(oldPoolMeta.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(oldPoolMeta.replace(/\n/g, '\r\n'), newPoolMeta.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] Added faculty preview to pool meta (CRLF)');
} else if (plannerJs.includes(oldPoolMeta)) {
    plannerJs = plannerJs.replace(oldPoolMeta, newPoolMeta);
    console.log('[planner_module.js] Added faculty preview to pool meta (LF)');
}

// D. Update renderSemesterColumns: tagClass and tagLabel for semester cards
const oldSemCardTag = `                const isSportCourse = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagCourse = course.list === 'MALAG' || course.type === 'humanities';
                const tagClass = completed ? 'tag-completed' : (isSportCourse ? 'tag-sports' : (isMalagCourse ? 'tag-malag' : (course.list ? \`tag-list-\${course.list}\` : (course.type ? \`tag-\${course.type}\` : 'tag-mandatory'))));
                const tagLabel = completed ? (grade ? \`✓ הושלם [\${grade}]\` : '✓ הושלם') : (isSportCourse ? '🏃 ספורט' : (isMalagCourse ? '🎭 מל״ג' : (course.list ? \`בחירה \${course.list}׳\` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה'))));`;

const newSemCardTag = `                const isSportCourse = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagCourse = course.list === 'MALAG' || course.type === 'humanities';
                const isTechnionWideCourse = course.isTechnionWide;
                const tagClass = completed ? 'tag-completed' : (isSportCourse ? 'tag-sports' : (isMalagCourse ? 'tag-malag' : (isTechnionWideCourse ? 'tag-technion-wide' : (course.list ? \`tag-list-\${course.list}\` : (course.type ? \`tag-\${course.type}\` : 'tag-mandatory')))));
                const tagLabel = completed ? (grade ? \`✓ הושלם [\${grade}]\` : '✓ הושלם') : (isSportCourse ? '🏃 ספורט' : (isMalagCourse ? '🎭 מל״ג' : (isTechnionWideCourse ? '🌐 בחירה חופשית' : (course.list ? \`בחירה \${course.list}׳\` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה')))));`;

if (plannerJs.includes(oldSemCardTag.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(oldSemCardTag.replace(/\n/g, '\r\n'), newSemCardTag.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] Semester card tag & label logic updated (CRLF)');
} else if (plannerJs.includes(oldSemCardTag)) {
    plannerJs = plannerJs.replace(oldSemCardTag, newSemCardTag);
    console.log('[planner_module.js] Semester card tag & label logic updated (LF)');
}

// E. Update search input listener: ensureCheeseForkDatabase on focus and input
const oldSearchInputListener = `        // 6. Search Input Delegation (Debounced 150ms)
        const searchInput = document.getElementById('planner-elective-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    searchQuery = e.target.value.trim();
                    catalogVisibleCount = CATALOG_WINDOW_PAGE_SIZE;
                    renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                }, 150);
            });
        }`;

const newSearchInputListener = `        // 6. Search Input Delegation (Debounced 150ms with Technion Catalog Auto-Warmup)
        const searchInput = document.getElementById('planner-elective-search-input');
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                if (typeof window !== 'undefined' && typeof window.ensureCheeseForkDatabase === 'function') {
                    window.ensureCheeseForkDatabase();
                }
            });
            searchInput.addEventListener('input', (e) => {
                if (typeof window !== 'undefined' && typeof window.ensureCheeseForkDatabase === 'function') {
                    window.ensureCheeseForkDatabase();
                }
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    searchQuery = e.target.value.trim();
                    catalogVisibleCount = CATALOG_WINDOW_PAGE_SIZE;
                    renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                }, 150);
            });
        }`;

if (plannerJs.includes(oldSearchInputListener.replace(/\n/g, '\r\n'))) {
    plannerJs = plannerJs.replace(oldSearchInputListener.replace(/\n/g, '\r\n'), newSearchInputListener.replace(/\n/g, '\r\n'));
    console.log('[planner_module.js] searchInput listener updated (CRLF)');
} else if (plannerJs.includes(oldSearchInputListener)) {
    plannerJs = plannerJs.replace(oldSearchInputListener, newSearchInputListener);
    console.log('[planner_module.js] searchInput listener updated (LF)');
}

fs.writeFileSync(plannerPath, plannerJs, 'utf8');
console.log('All updates written to disk successfully.');
