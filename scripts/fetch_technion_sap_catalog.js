/**
 * Technion SAP SLcM OData Catalog Ingestor & Consolidator
 * 
 * Fetches authoritative course, schedule, syllabus, staff, anti-requisite,
 * and exam accreditation data directly from Technion SAP and consolidates it
 * into Semestero's offline database (cheesefork_database.js & technion_sap_database.js).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CHEESEFORK_DB_PATH = path.join(ROOT_DIR, 'cheesefork_database.js');
const TECHNION_SAP_DB_PATH = path.join(ROOT_DIR, 'technion_sap_database.js');

const SAP_BASE_URL = 'https://portalex.technion.ac.il/sap/opu/odata/sap/Z_CM_EV_CDIR_DATA_SRV';
const GH_PAGES_SAP_URL = 'https://raw.githubusercontent.com/michael-maltsev/technion-sap-info-fetcher/gh-pages/courses_2026_200.json';

function fetchUrl(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const client = https.get(url, { headers }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location, headers).then(resolve).catch(reject);
            }
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        client.on('error', reject);
    });
}

function parseSapJsonDate(dateStr) {
    if (!dateStr) return null;
    const match = String(dateStr).match(/\/Date\((\d+)\)\//);
    if (!match) return null;
    const ts = parseInt(match[1], 10);
    const d = new Date(ts);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
}

function parseSapPtTime(ptStr) {
    if (!ptStr) return '';
    const match = String(ptStr).match(/PT(\d{2})H(\d{2})M/);
    if (!match) return '';
    return `${match[1]}:${match[2]}`;
}

function toCode6(rawNum) {
    if (!rawNum) return '';
    const str = String(rawNum).trim();
    if (str.length === 6) return str;
    const m = str.match(/^0(\d{3})0(\d{3})$/);
    if (m) {
        return m[1] + m[2];
    }
    const m97 = str.match(/^970300(\d\d)$/);
    if (m97) {
        return '9730' + m97[1];
    }
    if (str.length === 8 && str.startsWith('00')) {
        return '0' + str.slice(2, 4) + str.slice(5);
    }
    return str;
}

async function fetchLiveSapExams() {
    console.log('[SAP Ingest] Fetching live CeObjectSet exams from portalex.technion.ac.il...');
    try {
        const url = `${SAP_BASE_URL}/CeObjectSet?$filter=Peryr%20eq%20'2026'%20and%20Perid%20eq%20'200'&$format=json`;
        const raw = await fetchUrl(url, {
            'Accept': 'application/json',
            'Accept-Language': 'he'
        });
        const parsed = JSON.parse(raw);
        const results = (parsed.d && parsed.d.results) ? parsed.d.results : [];
        console.log(`[SAP Ingest] Fetched ${results.length} live exams from CeObjectSet.`);

        const examMap = new Map();
        results.forEach(e => {
            const courseId = e.ZzSmOtjid ? e.ZzSmOtjid.replace(/^SM/, '') : '';
            if (!courseId) return;

            if (!examMap.has(courseId)) {
                examMap.set(courseId, []);
            }

            const parsedDate = parseSapJsonDate(e.ExamDate);
            const begTime = parseSapPtTime(e.ExamBegTime);
            const endTime = parseSapPtTime(e.ExamEndTime);

            examMap.get(courseId).push({
                category: e.Category || e.Name || 'מבחן',
                date: parsedDate,
                hours: (begTime && endTime && begTime !== '00:00') ? `${begTime} - ${endTime}` : '',
                digital: Boolean(e.ZzHeldDigital),
                approvedTools: (e.ZzApprovedTools || '').trim(),
                extraTimeText: (e.ZzExclusiveExtraTimeStT || '').trim(),
                comment: (e.ZzSeComment || '').trim()
            });
        });
        return examMap;
    } catch (err) {
        console.warn('[SAP Ingest] Live CeObjectSet fetch failed, continuing without extra live attributes:', err.message);
        return new Map();
    }
}

async function run() {
    console.log('=== Semestero Technion SAP Catalog Ingestion & Consolidation ===');

    // 1. Fetch live CeObjectSet exam metadata
    const liveExams = await fetchLiveSapExams();

    // 2. Fetch authoritative courses_2026_200.json
    console.log('[SAP Ingest] Downloading authoritative Winter 2026-2027 SAP dataset...');
    const rawWinterJson = await fetchUrl(GH_PAGES_SAP_URL);
    const winterCourses = JSON.parse(rawWinterJson);
    console.log(`[SAP Ingest] Loaded ${winterCourses.length} courses from Winter 2026-2027 dataset.`);

    // 3. Load existing cheesefork_database.js for base historical coverage
    let existingDb = [];
    if (fs.existsSync(CHEESEFORK_DB_PATH)) {
        try {
            const rawExisting = fs.readFileSync(CHEESEFORK_DB_PATH, 'utf8');
            const sandbox = {};
            eval(rawExisting.replace('typeof window !== \'undefined\' ? window : global', 'sandbox'));
            existingDb = sandbox.CHEESEFORK_DB || [];
            console.log(`[SAP Ingest] Loaded ${existingDb.length} existing courses from cheesefork_database.js.`);
        } catch (e) {
            console.warn('[SAP Ingest] Could not parse existing cheesefork_database.js:', e.message);
        }
    }

    // 4. Index existing database by canonical code
    const canonicalMap = new Map();
    existingDb.forEach(item => {
        const raw = String(item.rawNum || '').trim();
        const c6 = String(item.code6 || toCode6(raw)).trim();
        const key = c6 || raw;
        if (key) {
            canonicalMap.set(key, Object.assign({}, item, { code6: c6, rawNum: raw }));
        }
    });

    // 5. Merge Winter 2026-2027 SAP authoritative courses
    let updatedCount = 0;
    let newCount = 0;

    winterCourses.forEach(c => {
        const gen = c.general || {};
        const rawNum = String(gen['מספר מקצוע'] || '').trim();
        const code6 = toCode6(rawNum);
        const key = code6 || rawNum;
        if (!key) return;

        const name = (gen['שם מקצוע'] || '').trim();
        const credits = parseFloat(gen['נקודות'] || '3') || 3;
        const faculty = (gen['פקולטה'] || '').trim();
        const prereqs = (gen['מקצועות קדם'] || '').trim();
        const antiRequisites = (gen['מקצועות ללא זיכוי נוסף'] || '').trim();
        const responsible = (gen['אחראים'] || '').trim();
        const framework = (gen['מסגרת לימודים'] || '').trim();
        const syllabus = (gen['סילבוס'] || '').trim();
        const moedA = (gen['מועד א'] || '').trim();
        const moedB = (gen['מועד ב'] || '').trim();

        // Convert SAP schedule groups to clean Semestero schedule
        const schedule = (c.schedule || []).map(s => {
            return {
                group: s['קבוצה'] || 0,
                type: s['סוג'] || '',
                day: s['יום'] || '',
                hours: s['שעה'] || '',
                building: s['בניין'] || '',
                room: s['חדר'] || '',
                lecturer: s['מרצה/מתרגל'] || ''
            };
        });

        // Enrich with live CeObjectSet exams
        const sapExams = liveExams.get(rawNum) || [];
        const examDetails = {
            moedA: sapExams.find(e => e.category.includes('מועד א')) || null,
            moedB: sapExams.find(e => e.category.includes('מועד ב')) || null,
            all: sapExams
        };

        const existing = canonicalMap.get(key) || canonicalMap.get(code6) || canonicalMap.get(rawNum);
        if (existing) {
            updatedCount++;
        } else {
            newCount++;
        }

        const mergedEntry = Object.assign({}, existing || {}, {
            rawNum,
            code6,
            name: name || (existing ? existing.name : ''),
            credits: credits || (existing ? existing.credits : 3),
            faculty: faculty || (existing ? existing.faculty : ''),
            prereqs: prereqs || (existing ? existing.prereqs : ''),
            antiRequisites: antiRequisites || (existing ? existing.antiRequisites : ''),
            responsible: responsible || (existing ? existing.responsible : ''),
            framework: framework || (existing ? existing.framework : ''),
            moedA: moedA || (existing ? existing.moedA : ''),
            moedB: moedB || (existing ? existing.moedB : ''),
            syllabus: syllabus || (existing ? existing.syllabus : ''),
            schedule: (schedule && schedule.length > 0) ? schedule : (existing ? existing.schedule : []),
            examDetails: (sapExams.length > 0) ? examDetails : (existing ? existing.examDetails : null),
            dataSource: 'Technion SAP SLcM 2026/27 (תשפ״ז)'
        });

        canonicalMap.set(key, mergedEntry);
    });

    const finalCourses = Array.from(canonicalMap.values());

    // Sort cleanly by course code
    finalCourses.sort((a, b) => (a.code6 || a.rawNum).localeCompare(b.code6 || b.rawNum));

    console.log(`[SAP Ingest] Consolidated database has ${finalCourses.length} courses (${updatedCount} updated, ${newCount} newly added).`);

    // 6. Output to cheesefork_database.js and technion_sap_database.js
    const headerCheesefork = `/**
 * Semestero Consolidated Academic Course Catalog
 * Authoritative data sourced directly from Technion SAP SLcM (portalex.technion.ac.il)
 * Semester: Winter 2026-2027 (תשפ״ז) + Historical Catalog Coverage
 * Total Courses: ${finalCourses.length}
 * Generated: ${new Date().toISOString()}
 */
(typeof window !== 'undefined' ? window : global).CHEESEFORK_DB = `;

    const contentCheesefork = headerCheesefork + JSON.stringify(finalCourses, null, 2) + ';\n';
    fs.writeFileSync(CHEESEFORK_DB_PATH, contentCheesefork, 'utf8');
    console.log(`[SAP Ingest] Successfully written to ${CHEESEFORK_DB_PATH} (${(contentCheesefork.length / 1024 / 1024).toFixed(2)} MB).`);

    const headerSap = `/**
 * Semestero Technion SAP SLcM Course & Exam Database
 * Sourced directly from Technion SAP Gateway (portalex.technion.ac.il / sap-client=700)
 * Includes official anti-requisites, syllabus, instructors, classrooms, and digital exam flags.
 * Semester: Winter 2026-2027 (תשפ״ז)
 */
(typeof window !== 'undefined' ? window : global).TECHNION_SAP_DB = `;

    const contentSap = headerSap + JSON.stringify(finalCourses, null, 2) + ';\n';
    fs.writeFileSync(TECHNION_SAP_DB_PATH, contentSap, 'utf8');
    console.log(`[SAP Ingest] Successfully written to ${TECHNION_SAP_DB_PATH} (${(contentSap.length / 1024 / 1024).toFixed(2)} MB).`);

    console.log('=== Ingestion & Consolidation Complete ===');
}

run().catch(err => {
    console.error('[SAP Ingest Fatal Error]', err);
    process.exit(1);
});
