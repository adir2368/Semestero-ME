import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG_PATH = os.path.join(ROOT, 'scripts', 'pangea_extracted_catalog.json')
APP_JS_PATH = os.path.join(ROOT, 'app.js')
OUTPUT_JS_PATH = os.path.join(ROOT, 'pangea_knowledge_hub.js')

with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
    raw_catalog = json.load(f)

with open(APP_JS_PATH, 'r', encoding='utf-8') as f:
    app_js = f.read()

# Extract code-to-tag mapping from app.js
map_match = re.search(r'const PANGEA_COURSE_MAP = \{([\s\S]+?)\};', app_js)
code_to_tag = {}
tag_to_codes = {}

if map_match:
    for line in map_match.group(1).splitlines():
        line = line.strip()
        m = re.match(r"['\"]([0-9]+)['\"]\s*:\s*['\"]https://idofangbentov\.uk/Technion/([A-Z0-9]+)/", line)
        if m:
            code, tag = m.group(1), m.group(2)
            code_to_tag[code] = tag
            tag_to_codes.setdefault(tag, []).append(code)

# Known Hebrew course names for Pangea tags
TAG_HEBREW_NAMES = {
    'THE1': 'תרמודינמיקה 1 (034035)',
    'SLD1': 'מכניקת מוצקים 1 (034028)',
    'SLD2': 'מכניקת מוצקים 2 (034053)',
    'DYN1': 'דינמיקה (034010)',
    'FLD1': 'תורת הזרימה 1 (034055)',
    'HTF1': 'מעבר חום (034041)',
    'NUM1': 'מבוא לחישוב מדעי והנדסי (034056)',
    'DVI1': 'דינמיקה ותנודות (034051)',
    'LSY1': 'מערכות לינאריות (034032)',
    'ICT1': 'מבוא לבקרה (034040)',
    'IME1': 'מבוא למכטרוניקה (034022)',
    'MDN1': 'תכן מכני 1 (034054)',
    'MNF1': 'תהליכי ייצור (034030)',
    'ELM1': 'הנע חשמלי (034034)',
    'CAL1': 'חדו״א 1 (104041 / 104042)',
    'CAL2': 'חדו״א 2 (104043 / 104044)',
    'ALG1': 'אלגברה 1 (104016 / 104065)',
    'DEQ1': 'מד״ר 1 (104131)',
    'PDE1': 'מד״ח 1 (104228)',
    'PHY1': 'פיזיקה 1 (114051 / 114071)',
    'PHY2': 'פיזיקה 2 (114052 / 114075)',
    'PHY3': 'פיזיקה 3 (114054)',
    'LPH1': 'מעבדה בפיזיקה 1 (114032)',
    'GCH1': 'כימיה כללית (125001)',
    'IPY1': 'מבוא לתכנות בפייתון (234128)',
    'IMT1': 'מבוא למדע החומרים (314533)',
    'FEM1': 'אלמנטים סופיים לאנליזה הנדסית (035022)',
    'MCS1': 'מכניקת מיקרו-מערכות (035041)',
    'MCS2': 'מכניקת מערכות 2',
    'IRB1': 'מבוא לרובוטיקה (035001)',
    'HDY1': 'דינמיקה היברידית במערכות מכניות (036087)',
    'ICE1': 'מנועי שריפה פנימית',
    'MCP1': 'מעבדה במכטרוניקה 1',
    'MPL1': 'מבוא לפלסטיקה',
    'PDM1': 'פרויקט תכן לייצור (034371)',
    'PSM1': 'הסתברות וסטטיסטיקה למכונות (034058)',
    'BMA1': 'הקדמה למתמטיקה (קדם אקדמי)'
}

# Standardize titles and clean names
for tag, c_data in raw_catalog.items():
    c_data['hebrewName'] = TAG_HEBREW_NAMES.get(tag, c_data.get('title', tag))
    
    # Clean lectures
    for item in c_data.get('lectures', []):
        name = item['name']
        m_num = re.search(r'_0*([0-9]+)-(.*)', name)
        if m_num:
            ch_num = m_num.group(1)
            raw_title = m_num.group(2).replace('-', ' ')
            item['displayTitle'] = f"פרק {ch_num}: {raw_title}"
            item['number'] = int(ch_num)
        else:
            item['displayTitle'] = name.replace('-', ' ')
            item['number'] = 0

    # Clean homework
    for item in c_data.get('homework', []):
        name = item['name']
        m_hw = re.search(r'_HW0*([0-9]+)-(.*)', name, re.I)
        if m_hw:
            hw_num = m_hw.group(1)
            raw_title = m_hw.group(2).replace('-', ' ')
            item['displayTitle'] = f"תרגיל בית {hw_num}: {raw_title}"
            item['hwNumber'] = int(hw_num)
        else:
            m_alt = re.search(r'תרגיל.*?([0-9]+)', name)
            hw_num = m_alt.group(1) if m_alt else "1"
            item['displayTitle'] = name.replace('-', ' ')
            item['hwNumber'] = int(hw_num)

    # Clean exams
    for item in c_data.get('exams', []):
        name = item['name']
        item['displayTitle'] = name.replace('-', ' ')
        m_yr = re.search(r'20[12][0-9]', name)
        item['year'] = m_yr.group(0) if m_yr else ''
        if 'חורף' in name or 'WA' in name or 'WB' in name:
            item['season'] = 'חורף'
        elif 'אביב' in name or 'SA' in name or 'SB' in name or 'SC' in name:
            item['season'] = 'אביב'
        else:
            item['season'] = ''
            
        if "מועד א" in name or 'SA' in name or 'WA' in name:
            item['moed'] = "מועד א׳"
        elif "מועד ב" in name or 'SB' in name or 'WB' in name:
            item['moed'] = "מועד ב׳"
        elif "מועד ג" in name or 'SC' in name:
            item['moed'] = "מועד ג׳"
        else:
            item['moed'] = ""

catalog_json_str = json.dumps(raw_catalog, ensure_ascii=False, indent=2)
code_to_tag_str = json.dumps(code_to_tag, ensure_ascii=False, indent=2)

js_content = f"""/**
 * ==============================================================================
 * Semestero ME - Pangea Knowledge Hub Module (Ido Fang Bentov)
 * Authoritative Offline Catalog, Smart Homework Resolver, Search & In-App Reader
 * ==============================================================================
 */

(function(global) {{
    'use strict';

    const PANGEA_CATALOG = {catalog_json_str};
    const PANGEA_CODE_TO_TAG = {code_to_tag_str};

    const PangeaHub = {{
        catalog: PANGEA_CATALOG,
        codeToTag: PANGEA_CODE_TO_TAG,

        /**
         * Get Pangea course entry by Technion course code or Pangea tag
         */
        getCourseData: function(courseCodeOrTag) {{
            if (!courseCodeOrTag) return null;
            const str = String(courseCodeOrTag).trim();
            if (PANGEA_CATALOG[str]) return PANGEA_CATALOG[str];
            const clean = str.replace(/^0+/, '');
            const tag = PANGEA_CODE_TO_TAG[str] || PANGEA_CODE_TO_TAG[clean] || PANGEA_CODE_TO_TAG['0' + clean] || PANGEA_CODE_TO_TAG['00' + clean];
            if (tag && PANGEA_CATALOG[tag]) {{
                return PANGEA_CATALOG[tag];
            }}
            return null;
        }},

        /**
         * Smart Homework Solution Resolver
         * Takes a course code and task title/details and matches the exact homework slug on Pangea
         */
        resolveTaskHomework: function(courseCode, taskTitle) {{
            const cData = this.getCourseData(courseCode);
            if (!cData || !cData.homework || cData.homework.length === 0) return null;
            if (!taskTitle) return null;

            const title = String(taskTitle).toLowerCase();
            // Try extracting assignment number
            const numMatch = title.match(/(?:תרגיל|גיליון|מטלה|hw|hwk|sheet|assignment)\\s*(?:בית)?\\s*#?\\s*(\\d+)/i) || title.match(/\\b(\\d+)\\b/);
            if (numMatch) {{
                const targetNum = parseInt(numMatch[1], 10);
                const exact = cData.homework.find(h => h.hwNumber === targetNum);
                if (exact) {{
                    return {{
                        url: exact.url,
                        title: exact.displayTitle,
                        slug: exact.slug,
                        hwNumber: exact.hwNumber,
                        isExactMatch: true
                    }};
                }}
            }}

            // Return first or root if available
            return {{
                url: cData.url,
                title: `${{cData.title}} - מאגר שיעורי בית`,
                isExactMatch: false,
                allHomework: cData.homework
            }};
        }},

        /**
         * Live search across Pangea summaries, topics, homework and exams
         */
        search: function(query, courseCodeFilter = null) {{
            if (!query || !query.trim()) return [];
            const q = query.trim().toLowerCase();
            const results = [];

            const targetTags = courseCodeFilter 
                ? [this.codeToTag[courseCodeFilter] || courseCodeFilter]
                : Object.keys(PANGEA_CATALOG);

            targetTags.forEach(tag => {{
                const course = PANGEA_CATALOG[tag];
                if (!course) return;

                // Match in lectures
                (course.lectures || []).forEach(l => {{
                    if (l.name.toLowerCase().includes(q) || (l.displayTitle && l.displayTitle.toLowerCase().includes(q))) {{
                        results.push({{
                            type: 'lecture',
                            categoryLabel: '📚 פרק סיכום',
                            courseTag: tag,
                            courseTitle: course.hebrewName || course.title,
                            title: l.displayTitle || l.name,
                            url: l.url,
                            slug: l.slug
                        }});
                    }}
                }});

                // Match in homework
                (course.homework || []).forEach(h => {{
                    if (h.name.toLowerCase().includes(q) || (h.displayTitle && h.displayTitle.toLowerCase().includes(q))) {{
                        results.push({{
                            type: 'homework',
                            categoryLabel: '📝 תרגיל בית פתור',
                            courseTag: tag,
                            courseTitle: course.hebrewName || course.title,
                            title: h.displayTitle || h.name,
                            url: h.url,
                            slug: h.slug
                        }});
                    }}
                }});

                // Match in exams
                (course.exams || []).forEach(e => {{
                    if (e.name.toLowerCase().includes(q) || (e.displayTitle && e.displayTitle.toLowerCase().includes(q))) {{
                        results.push({{
                            type: 'exam',
                            categoryLabel: '🎓 מבחן עבר פתור',
                            courseTag: tag,
                            courseTitle: course.hebrewName || course.title,
                            title: e.displayTitle || e.name,
                            url: e.url,
                            slug: e.slug
                        }});
                    }}
                }});
            }});

            return results.slice(0, 30); // Top 30 matches
        }},

        /**
         * Open In-App Quick Peek Reader Modal with full external popout option
         */
        openQuickPeek: function(url, title, externalUrl) {{
            if (!url) return;
            const targetExternalUrl = externalUrl || url;
            const modal = document.getElementById('pangea-reader-modal');
            const iframe = document.getElementById('pangea-reader-iframe');
            const titleEl = document.getElementById('pangea-reader-title');
            const extBtn = document.getElementById('pangea-reader-ext-btn');
            const fallbackCard = document.getElementById('pangea-reader-fallback');
            const fallbackBtn = document.getElementById('pangea-fallback-btn');
            const loadingEl = document.getElementById('pangea-reader-loading');

            if (!modal) {{
                if (window.openExternalUrlOrBrowser) {{
                    window.openExternalUrlOrBrowser(targetExternalUrl);
                }} else {{
                    window.open(targetExternalUrl, '_blank', 'noopener,noreferrer');
                }}
                return;
            }}

            if (titleEl) titleEl.innerText = title || 'סיכומי פנגייה (Ido Fang Bentov)';
            
            const handleExtClick = function() {{
                if (window.openExternalUrlOrBrowser) {{
                    window.openExternalUrlOrBrowser(targetExternalUrl);
                }} else {{
                    window.open(targetExternalUrl, '_blank', 'noopener,noreferrer');
                }}
            }};

            if (extBtn) extBtn.onclick = handleExtClick;
            if (fallbackBtn) fallbackBtn.onclick = handleExtClick;

            if (fallbackCard) fallbackCard.style.display = 'none';
            if (loadingEl) loadingEl.style.display = 'flex';

            if (iframe) {{
                iframe.style.display = 'block';
                iframe.onload = function() {{
                    if (loadingEl) loadingEl.style.display = 'none';
                }};
                iframe.onerror = function() {{
                    if (loadingEl) loadingEl.style.display = 'none';
                    if (fallbackCard) fallbackCard.style.display = 'flex';
                    iframe.style.display = 'none';
                }};
                iframe.src = url;
            }}

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }},

        /**
         * Close In-App Reader Modal
         */
        closeQuickPeek: function() {{
            const modal = document.getElementById('pangea-reader-modal');
            const iframe = document.getElementById('pangea-reader-iframe');
            if (iframe) iframe.src = 'about:blank';
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = '';
        }},

        /**
         * Open Global Pangea Search Modal
         */
        openGlobalSearch: function(initialQuery = '') {{
            const modal = document.getElementById('pangea-search-modal');
            const input = document.getElementById('pangea-global-search-input');
            if (!modal) return;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            if (input) {{
                input.value = initialQuery || '';
                setTimeout(() => input.focus(), 100);
                this.renderGlobalSearchResults(initialQuery || '');
            }}
        }},

        /**
         * Close Global Pangea Search Modal
         */
        closeGlobalSearch: function() {{
            const modal = document.getElementById('pangea-search-modal');
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = '';
        }},

        /**
         * Render Global Search Results
         */
        renderGlobalSearchResults: function(query) {{
            const container = document.getElementById('pangea-global-search-results');
            if (!container) return;
            if (!query || !query.trim()) {{
                container.innerHTML = `
                    <div style="text-align: center; color: #94a3b8; padding: 30px 10px; font-size: 0.85rem;">
                        <span>💡 הקלד נושא (למשל: <em>ברנולי</em>, <em>לפלס</em>, <em>קרנו</em>, <em>מאמצים</em>, <em>2024</em>) לחיפוש מיידי ב-38 קורסי הטכניון בפנגייה.</span>
                    </div>
                `;
                return;
            }}

            const results = this.search(query);
            if (results.length === 0) {{
                container.innerHTML = `
                    <div style="text-align: center; color: #94a3b8; padding: 25px 10px;">
                        <p style="font-size: 0.88rem; margin-bottom: 12px;">לא נמצאו תוצאות ישירות בפנגייה עבור <strong>"${{query}}"</strong></p>
                        <a href="https://idofangbentov.uk/?q=${{encodeURIComponent(query)}}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="border-color: #38bdf8; color: #38bdf8; text-decoration: none;">
                            🌐 חפש באתר הראשי של פנגייה ↗
                        </a>
                    </div>
                `;
                return;
            }}

            container.innerHTML = results.map(r => `
                <div class="pangea-search-result-card" onclick="window.PangeaHub.openQuickPeek('${{r.url}}', '${{r.title}}', '${{r.url}}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span class="pangea-result-badge">${{r.categoryLabel}}</span>
                        <span class="pangea-result-course">${{r.courseTitle}}</span>
                    </div>
                    <div class="pangea-result-title">${{r.title}}</div>
                </div>
            `).join('');
        }},

        /**
         * Render Pangea Learning Hub inside Course Details Modal
         */
        renderCoursePangeaSection: function(courseCode, containerEl) {{
            if (!containerEl) return;
            const cData = this.getCourseData(courseCode);
            const cleanCode = String(courseCode).replace(/^0+/, '');

            if (!cData) {{
                // Course without a dedicated Pangea hub
                containerEl.innerHTML = `
                    <div class="pangea-course-hub-empty" style="margin-top: 14px; padding: 12px 14px; background: rgba(14, 165, 233, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="pangea_icon.png" alt="Pangea" width="20" height="20" style="object-fit: contain;">
                            <span style="font-size: 0.82rem; color: #cbd5e1;">חפש סיכומים לקורס זה בפנגייה:</span>
                        </div>
                        <a href="https://idofangbentov.uk/?q=${{encodeURIComponent(cleanCode)}}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline" style="border-color: #38bdf8; color: #38bdf8; text-decoration: none;">
                            פתח חיפוש בפנגייה ↗
                        </a>
                    </div>
                `;
                return;
            }}

            const lectures = cData.lectures || [];
            const homework = cData.homework || [];
            const exams = cData.exams || [];

            containerEl.innerHTML = `
                <div class="pangea-course-hub-card" id="pangea-course-hub-${{cleanCode}}" style="margin-top: 14px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 10px; padding: 14px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="pangea_icon.png" alt="Pangea" width="22" height="22" style="object-fit: contain; border-radius: 4px;">
                            <span style="font-size: 0.92rem; font-weight: 700; color: #38bdf8;">סיכומי פנגייה (Ido Fang Bentov)</span>
                        </div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            <span class="pangea-chip-badge" style="background: rgba(14, 165, 233, 0.2); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; font-weight: 600;">📚 ${{lectures.length}} פרקים</span>
                            <span class="pangea-chip-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; font-weight: 600;">📝 ${{homework.length}} תרגילי בית</span>
                            <span class="pangea-chip-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.72rem; padding: 2px 7px; border-radius: 6px; font-weight: 600;">🎓 ${{exams.length}} מבחנים</span>
                        </div>
                    </div>

                    <!-- In-Course Search Input -->
                    <div style="margin-bottom: 12px;">
                        <input type="text" id="pangea-filter-input-${{cleanCode}}" class="pangea-filter-input" placeholder="🔍 סנן פרקים, תרגילי בית או מבחנים..." oninput="window.PangeaHub.filterCourseHub('${{cleanCode}}', this.value)" style="width: 100%; box-sizing: border-box; background: rgba(11, 15, 25, 0.85); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 7px 10px; color: #fff; font-size: 0.82rem;">
                    </div>

                    <div id="pangea-course-content-${{cleanCode}}">
                        <!-- Homework Section -->
                        ${{homework.length > 0 ? `
                            <div class="pangea-hub-subsection" style="margin-bottom: 12px;">
                                <div style="font-size: 0.82rem; font-weight: 700; color: #34d399; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                                    <span>📝 תרגילי בית פתורים (${{homework.length}}):</span>
                                </div>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    ${{homework.map(h => `
                                        <button type="button" class="pangea-resource-chip pangea-hw-chip" onclick="window.PangeaHub.openQuickPeek('${{h.url}}', '${{h.displayTitle}}', '${{h.url}}')">
                                            <span>${{h.displayTitle}}</span>
                                        </button>
                                    `).join('')}}
                                </div>
                            </div>
                        ` : ''}}

                        <!-- Solved Exams Section -->
                        ${{exams.length > 0 ? `
                            <div class="pangea-hub-subsection" style="margin-bottom: 12px;">
                                <div style="font-size: 0.82rem; font-weight: 700; color: #fbbf24; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                                    <span>🎓 מאגר מבחנים פתורים (${{exams.length}}):</span>
                                </div>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    ${{exams.map(e => `
                                        <button type="button" class="pangea-resource-chip pangea-exam-chip" onclick="window.PangeaHub.openQuickPeek('${{e.url}}', '${{e.displayTitle}}', '${{e.url}}')">
                                            <span>${{e.displayTitle}}</span>
                                        </button>
                                    `).join('')}}
                                </div>
                            </div>
                        ` : ''}}

                        <!-- Lectures Section -->
                        ${{lectures.length > 0 ? `
                            <div class="pangea-hub-subsection" style="margin-bottom: 10px;">
                                <div style="font-size: 0.82rem; font-weight: 700; color: #7dd3fc; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                                    <span>📚 פרקי הרצאה וסיכומים (${{lectures.length}}):</span>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 6px; max-height: 180px; overflow-y: auto; padding-left: 4px;">
                                    ${{lectures.map(l => `
                                        <button type="button" class="pangea-resource-chip pangea-lecture-chip" onclick="window.PangeaHub.openQuickPeek('${{l.url}}', '${{l.displayTitle}}', '${{l.url}}')" style="text-align: right; justify-content: flex-start;">
                                            <span>${{l.displayTitle}}</span>
                                        </button>
                                    `).join('')}}
                                </div>
                            </div>
                        ` : ''}}
                    </div>

                    <!-- Footer Link -->
                    <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.74rem; color: #94a3b8;">צפייה מהירה בתוך המערכת • נגיש גם אופליין</span>
                        <a href="${{cData.url}}" target="_blank" rel="noopener noreferrer" style="font-size: 0.76rem; color: #38bdf8; text-decoration: underline; font-weight: 600;">
                            פתח קורס שלם בפנגייה ↗
                        </a>
                    </div>
                </div>
            `;
        }},

        /**
         * Live filter inside course hub
         */
        filterCourseHub: function(cleanCode, query) {{
            const contentEl = document.getElementById(`pangea-course-content-${{cleanCode}}`);
            if (!contentEl) return;
            const cData = this.getCourseData(cleanCode);
            if (!cData) return;

            if (!query || !query.trim()) {{
                this.renderCoursePangeaSection(cleanCode, document.getElementById(`modal-pangea-container`));
                return;
            }}

            const q = query.trim().toLowerCase();
            const matchedL = (cData.lectures || []).filter(l => l.name.toLowerCase().includes(q) || (l.displayTitle && l.displayTitle.toLowerCase().includes(q)));
            const matchedH = (cData.homework || []).filter(h => h.name.toLowerCase().includes(q) || (h.displayTitle && h.displayTitle.toLowerCase().includes(q)));
            const matchedE = (cData.exams || []).filter(e => e.name.toLowerCase().includes(q) || (e.displayTitle && e.displayTitle.toLowerCase().includes(q)));

            contentEl.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    ${{matchedH.length > 0 ? `
                        <div style="font-size: 0.8rem; font-weight: 700; color: #34d399;">📝 תרגילי בית תואמים (${{matchedH.length}}):</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${{matchedH.map(h => `<button type="button" class="pangea-resource-chip pangea-hw-chip" onclick="window.PangeaHub.openQuickPeek('${{h.url}}', '${{h.displayTitle}}', '${{h.url}}')"><span>${{h.displayTitle}}</span></button>`).join('')}}
                        </div>
                    ` : ''}}
                    ${{matchedE.length > 0 ? `
                        <div style="font-size: 0.8rem; font-weight: 700; color: #fbbf24;">🎓 מבחנים תואמים (${{matchedE.length}}):</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${{matchedE.map(e => `<button type="button" class="pangea-resource-chip pangea-exam-chip" onclick="window.PangeaHub.openQuickPeek('${{e.url}}', '${{e.displayTitle}}', '${{e.url}}')"><span>${{e.displayTitle}}</span></button>`).join('')}}
                        </div>
                    ` : ''}}
                    ${{matchedL.length > 0 ? `
                        <div style="font-size: 0.8rem; font-weight: 700; color: #7dd3fc;">📚 פרקים תואמים (${{matchedL.length}}):</div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                            ${{matchedL.map(l => `<button type="button" class="pangea-resource-chip pangea-lecture-chip" onclick="window.PangeaHub.openQuickPeek('${{l.url}}', '${{l.displayTitle}}', '${{l.url}}')"><span>${{l.displayTitle}}</span></button>`).join('')}}
                        </div>
                    ` : ''}}
                    ${{matchedL.length === 0 && matchedH.length === 0 && matchedE.length === 0 ? `
                        <div style="text-align: center; color: #94a3b8; padding: 12px; font-size: 0.82rem;">לא נמצאו פריטים תואמים לחיפוש בקורס זה.</div>
                    ` : ''}}
                </div>
            `;
        }}
    }};

    global.PangeaHub = PangeaHub;
    if (typeof module !== 'undefined' && module.exports) {{
        module.exports = PangeaHub;
    }}
}})(typeof window !== 'undefined' ? window : globalThis);
"""

with open(OUTPUT_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Generated {OUTPUT_JS_PATH} successfully! ({len(js_content)} bytes)")
