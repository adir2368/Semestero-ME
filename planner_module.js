// ==========================================================================
// Degree Planner Module (תכנון תואר אקדמי - גרור ושחרר קורסים וחוקי בחירה)
// Atlas ME - Technion Faculty of Mechanical Engineering
// Multi-Pass Audited & Refactored Engine (v1.8.14)
// ==========================================================================

(function(global) {
    'use strict';

    // --------------------------------------------------------------------------
    // Module State & Configuration
    // --------------------------------------------------------------------------
    let currentMode = 'custom'; // 'custom' | 'suggested'
    let selectedTrack = 'year_2026'; // 'year_2026' | 'year_2027' | 'year_2025' | 'year_2024' | 'barak'
    let isReservistDeduction = false;
    let isAtudaTironut = false;
    const PLANNER_ATUDA_KEY = 'ast_planner_atuda_tironut';
    let isEnglishExemption = false;
    let englishLevel = 'none'; // 'exempt_all' | 'exempt_a' | 'none'
    let selectedCategory = 'ALL'; // 'ALL' | 'A' | 'B' | 'C' | 'D' | 'E' | 'UNASSIGNED'
    let searchQuery = '';
    let customPlan = null;
    let unassignedCourses = [];
    let isWhatIfMode = false;
    let whatIfGrades = {};
    let defaultWhatIfGrade = 85;

    // Local Storage Keys & Dynamic User-Scoped Helper
    const PLANNER_STORAGE_KEY_V2 = 'atlas_me_custom_degree_plan_v2';
    const PLANNER_STORAGE_KEY_V1 = 'atlas_me_custom_degree_plan_v1';
    const PLANNER_RESERVIST_KEY = 'semestero_reservist_deduction_active';
    const PLANNER_ENGLISH_LEVEL_KEY = 'semestero_english_level';
    const PLANNER_ENGLISH_EXEMPTION_KEY = 'semestero_english_exemption_active';
    const PLANNER_TRACK_KEY = 'semestero_planner_selected_track';

    function getActiveUserId() {
        if (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'capacitor:')) return 'adir_moshe';
        if (global.AuthSync && typeof global.AuthSync.getActiveUser === 'function') {
            const u = global.AuthSync.getActiveUser();
            return (u && u.id) ? u.id : 'guest';
        }
        return 'guest';
    }

    function isAdirAuthenticated() {
        if (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'capacitor:')) return true;
        return !!(global.AuthSync && typeof global.AuthSync.isAdirActive === 'function' && global.AuthSync.isAdirActive());
    }

    function getPlannerStorageKeyV2() {
        const uid = getActiveUserId();
        return uid === 'adir_moshe' ? `${PLANNER_STORAGE_KEY_V2}_adir` : `${PLANNER_STORAGE_KEY_V2}_${uid}`;
    }

    function getPlannerStorageKeyV1() {
        const uid = getActiveUserId();
        return uid === 'adir_moshe' ? `${PLANNER_STORAGE_KEY_V1}_adir` : `${PLANNER_STORAGE_KEY_V1}_${uid}`;
    }

    // Purged Courses List (Removed/Exempt for user: Creative Intro)
    const PURGED_CODES = new Set([
        '00350026', '035026', '35026',
        '035044'
    ]);

    // Active drag tracking object
    let activeDragPayload = null;

    // Debounce timer for saving state
    let saveDebounceTimer = null;

    // Search input debounce timer
    let searchDebounceTimer = null;

    // --------------------------------------------------------------------------
    // Helper: Code Normalization
    // --------------------------------------------------------------------------
    function getNormalizedCodes(code, altCode) {
        const codes = [];
        const process = (val) => {
            if (!val) return;
            const str = String(val).trim();
            codes.push(str);
            const clean = str.replace(/[-\s]/g, '');
            if (clean && clean !== str) codes.push(clean);
            const stripped = clean.replace(/^0+/, '');
            if (stripped && stripped !== clean) codes.push(stripped);
            // 8-digit Moodle code to 6-digit conversion (e.g., 00340028 -> 034028 or 01040041 -> 104041)
            if (/^\d{8}$/.test(clean) && clean.startsWith('0')) {
                const c6 = clean.slice(1, 4) + clean.slice(5);
                codes.push(c6);
                const strippedC6 = c6.replace(/^0+/, '');
                if (strippedC6 !== c6) codes.push(strippedC6);
            }
            // 6-digit Technion code to 8-digit Moodle code (e.g., 114051 -> 01140051 or 034028 -> 00340028)
            if (/^\d{6}$/.test(clean)) {
                const c8 = '0' + clean.slice(0, 3) + '0' + clean.slice(3);
                codes.push(c8);
            }
        };
        process(code);
        process(altCode);

        // Include seasonal twin equivalents (חורף / אביב)
        if (global.PLANNER_CATALOG && global.PLANNER_CATALOG.SEASONAL_COURSE_MAPPINGS) {
            const sm = global.PLANNER_CATALOG.SEASONAL_COURSE_MAPPINGS;
            [code, altCode].forEach(c => {
                if (c && sm[c]) {
                    if (sm[c].winter) process(sm[c].winter);
                    if (sm[c].spring) process(sm[c].spring);
                    if (sm[c].altWinter) process(sm[c].altWinter);
                    if (sm[c].altSpring) process(sm[c].altSpring);
                }
            });
        }

        // Include Physics variants family equivalents (פיזיקה 1, 1מ', 1פ', 1ת' / פיזיקה 2, 2מ', 2פ', 2ת')
        const phys1Codes = ['01140051', '114051', '01140071', '114071', '01140077', '114077', '01140055', '114055'];
        const phys2Codes = ['01140052', '114052', '01140075', '114075', '01140078', '114078', '01140076', '114076'];
        if (phys1Codes.includes(code) || phys1Codes.includes(altCode)) {
            phys1Codes.forEach(process);
        }
        if (phys2Codes.includes(code) || phys2Codes.includes(altCode)) {
            phys2Codes.forEach(process);
        }

        return Array.from(new Set(codes));
    }

    function isPurgedCourse(code, altCode) {
        if (!code && !altCode) return false;
        const codes = getNormalizedCodes(code, altCode);

        // Explicit user-removed courses always take precedence
        if (global.gameState && Array.isArray(global.gameState.removedCourses)) {
            for (let i = 0; i < codes.length; i++) {
                if (global.gameState.removedCourses.includes(codes[i])) return true;
            }
        }

        // For Adir specifically, PURGED_CODES (English B & Creative Intro) are exempt from his degree
        // But for year_2024 catalog or other students, these courses exist as valid curriculum courses!
        if (isAdirAuthenticated()) {
            for (let i = 0; i < codes.length; i++) {
                if (PURGED_CODES.has(codes[i])) return true;
            }
        }

        return false;
    }

    // --------------------------------------------------------------------------
    // Helpers: Course Completion & Grade Lookup
    // --------------------------------------------------------------------------
    function isCourseCompleted(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return false;
        const candidateCodes = getNormalizedCodes(code, altCode);

        for (let i = 0; i < candidateCodes.length; i++) {
            const cCode = candidateCodes[i];
            // Check global exemptions table first
            if (global.gameState.exemptions && global.gameState.exemptions[cCode]) {
                return true;
            }

            const c = global.gameState.courses[cCode];
            if (c) {
                // Check course-level exemption flag
                if (c.isExempt === true) return true;

                // Priority 1: Numeric passing grade
                if (c.grade !== undefined && c.grade !== null && c.grade !== '') {
                    const num = Number(c.grade);
                    if (!isNaN(num) && num >= 55) return true;
                }
                // Priority 2: Mastered status
                if (c.status === 'mastered') return true;
                // Priority 3: Explicit binary pass only if not locked or available
                if (c.status !== 'locked' && c.status !== 'available' && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS')) {
                    return true;
                }
            }
        }
        return false;
    }

    function isCourseExempt(code, altCode) {
        if (!global.gameState) return false;
        const candidateCodes = getNormalizedCodes(code, altCode);
        for (let i = 0; i < candidateCodes.length; i++) {
            const cCode = candidateCodes[i];
            if (global.gameState.exemptions && global.gameState.exemptions[cCode]) {
                return true;
            }
            const c = global.gameState.courses && global.gameState.courses[cCode];
            if (c && c.isExempt === true) {
                return true;
            }
        }
        return false;
    }

    function applyEnglishLevelState(level) {
        if (level !== 'exempt_all' && level !== 'exempt_a' && level !== 'none') {
            level = 'none';
        }
        englishLevel = level;
        isEnglishExemption = (level === 'exempt_all');
        try {
            localStorage.setItem(PLANNER_ENGLISH_LEVEL_KEY, level);
            localStorage.setItem(PLANNER_ENGLISH_EXEMPTION_KEY, isEnglishExemption ? 'true' : 'false');
        } catch (e) {}

        if (global.gameState) {
            if (!global.gameState.exemptions) global.gameState.exemptions = {};

            if (level === 'exempt_all') {
                // Full Exemption (134+): Both Mitkadmim A (324032) and Mitkadmim B (324033) are exempt
                ['03240032', '324032', '03240033', '324033'].forEach(k => {
                    global.gameState.exemptions[k] = true;
                    if (global.gameState.courses && global.gameState.courses[k]) {
                        global.gameState.courses[k].isExempt = true;
                    }
                });
            } else if (level === 'exempt_a') {
                // Partial Exemption (120-133): Mitkadmim A (324032) is exempt; Mitkadmim B (324033) is NOT exempt (mandatory!)
                ['03240032', '324032'].forEach(k => {
                    global.gameState.exemptions[k] = true;
                    if (global.gameState.courses && global.gameState.courses[k]) {
                        global.gameState.courses[k].isExempt = true;
                    }
                });
                ['03240033', '324033'].forEach(k => {
                    delete global.gameState.exemptions[k];
                    if (global.gameState.courses && global.gameState.courses[k]) {
                        global.gameState.courses[k].isExempt = false;
                    }
                });
            } else { // 'none'
                // No Exemption (104-119): Neither is exempt, both must be taken
                ['03240032', '324032', '03240033', '324033'].forEach(k => {
                    delete global.gameState.exemptions[k];
                    if (global.gameState.courses && global.gameState.courses[k]) {
                        global.gameState.courses[k].isExempt = false;
                    }
                });
            }

            // Remove from removedCourses if student is taking them
            if (Array.isArray(global.gameState.removedCourses)) {
                if (level === 'exempt_a' || level === 'none') {
                    global.gameState.removedCourses = global.gameState.removedCourses.filter(c => c !== '324033' && c !== '03240033');
                }
                if (level === 'none') {
                    global.gameState.removedCourses = global.gameState.removedCourses.filter(c => c !== '324032' && c !== '03240032');
                }
            }
        }
    }

    function getCourseGrade(code, altCode) {
        if (!global.gameState || !global.gameState.courses) return null;
        const candidateCodes = getNormalizedCodes(code, altCode);

        for (let i = 0; i < candidateCodes.length; i++) {
            const c = global.gameState.courses[candidateCodes[i]];
            if (c) {
                // Numeric grade always takes precedence!
                if (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade))) {
                    return String(c.grade);
                }
                if (c.status === 'mastered' && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS')) {
                    return 'עובר';
                }
            }
        }
        return null;
    }

    // --------------------------------------------------------------------------
    // Workload Calculation Engine (CheeseFork Baseline + User Overrides)
    // --------------------------------------------------------------------------
    const WORKLOAD_OVERRIDE_PREFIX = 'ast_course_workload_';

    // Course workload scale: 1.0 to 5.0 (matching CheeseFork 1-5 weights ratio)
    // Labs have low credits (0.5 - 1.5) but high workload (pre/post lab reports)
    const SPECIAL_COURSE_WORKLOAD_BASELINE = {
        // Chemistry & Labs
        '01250001': 3.0, '125001': 3.0, '0124012': 3.0, '124012': 3.0, // כימיה כללית
        '01250013': 3.5, '125013': 3.5, // מעבדה בכימיה
        
        // Physics & Labs
        '01140051': 4.0, '114051': 4.0, '0114005': 4.0, '114005': 4.0, // פיזיקה 1
        '01140071': 4.0, '114071': 4.0, // פיזיקה 1מ'
        '01140052': 4.5, '114052': 4.5, '01140075': 4.5, '114075': 4.5, // פיזיקה 2 / 2מ'
        '01140039': 3.5, '114039': 3.5, // מעבדה לפיזיקה 1מח
        '01140032': 3.5, '114032': 3.5, // מעב' לפיזיקה 1 ח
        
        // Computer Science & Programming
        '02340128': 3.5, '234128': 3.5, '0234012': 3.5, '234012': 3.5, // שפת פייתון / מבוא למחשב
        '02340114': 4.0, '234114': 4.0, // מבוא למדעי המחשב C
        
        // Mathematics
        '01040041': 5.0, '104041': 5.0, // חדו"א 1מ' 1
        '01040013': 5.0, '104013': 5.0, '0104195': 5.0, '104195': 5.0, // חדו"א 1 / 1ת'
        '01040065': 4.5, '104065': 4.5, '01040019': 4.5, '104019': 4.5, // אלגברה 1מ'
        '01040043': 5.0, '104043': 5.0, // חדו"א 2מ' 1
        '01040022': 5.0, '104022': 5.0, // חדו"א 2
        '01040131': 3.5, '104131': 3.5, // מד"ר
        
        // Mechanical Engineering Core
        '00340028': 4.5, '034028': 4.5, // מכניקת מוצקים 1
        '00340053': 5.0, '034053': 5.0, // מכניקת מוצקים 2 מורחב
        '00340010': 5.0, '034010': 5.0, // דינמיקה
        '00340035': 4.5, '034035': 4.5, // תרמודינמיקה 1
        '00340055': 5.0, '034055': 5.0, // מכניקת זורמים 1 מורחב
        '00340061': 3.5, '034061': 3.5, // מבוא לגרפיקה ותכנון הנדסי
        '03140533': 3.5, '314533': 3.5, // מבוא לחומרים מ'
        '00340056': 4.0, '034056': 4.0, // תכנות הנדסי ואנליזה נומרית
        '00340057': 5.0, '034057': 5.0  // מעבדה מתקדמת מכונות
    };

    function getCourseUserWorkload(code, altCode) {
        if (!code && !altCode) return null;
        const candidateCodes = getNormalizedCodes(code, altCode);
        for (let i = 0; i < candidateCodes.length; i++) {
            const val = localStorage.getItem(WORKLOAD_OVERRIDE_PREFIX + candidateCodes[i]);
            if (val !== null && val !== undefined && val !== '') {
                const num = parseFloat(val);
                if (!isNaN(num) && num > 0) {
                    // Clamp between 1.0 and 5.0
                    return Math.max(1.0, Math.min(5.0, parseFloat(num.toFixed(1))));
                }
            }
        }
        return null;
    }

    function setCourseUserWorkload(code, altCode, value) {
        if (!code && !altCode) return;
        const mainCode = code || altCode;
        const normCode = String(mainCode).trim();
        if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
            const candidateCodes = getNormalizedCodes(code, altCode);
            candidateCodes.forEach(c => localStorage.removeItem(WORKLOAD_OVERRIDE_PREFIX + c));
        } else {
            const clampedVal = Math.max(1.0, Math.min(5.0, parseFloat(Number(value).toFixed(1))));
            localStorage.setItem(WORKLOAD_OVERRIDE_PREFIX + normCode, String(clampedVal));
            const stripped = normCode.replace(/^0+/, '');
            if (stripped && stripped !== normCode) {
                localStorage.setItem(WORKLOAD_OVERRIDE_PREFIX + stripped, String(clampedVal));
            }
        }
    }

    function calculateCourseWorkload(course) {
        if (!course) return { score: 0, isOverride: false };
        const userOverride = getCourseUserWorkload(course.code, course.altCode);
        if (userOverride !== null) {
            return { score: userOverride, isOverride: true };
        }

        // Check special baseline
        const candidateCodes = getNormalizedCodes(course.code, course.altCode);
        for (let i = 0; i < candidateCodes.length; i++) {
            const k = candidateCodes[i];
            if (SPECIAL_COURSE_WORKLOAD_BASELINE[k] !== undefined) {
                return { score: SPECIAL_COURSE_WORKLOAD_BASELINE[k], isOverride: false };
            }
        }

        // Standard baseline: credits weight, normalized to 1.0 - 5.0 scale
        const creds = Number(course.credits) || 3.0;
        const clampedScore = Math.max(1.0, Math.min(5.0, parseFloat(creds.toFixed(1))));
        return { score: clampedScore, isOverride: false };
    }

    // SVG Icons matching CheeseFork exactly: Feather, Kettlebell, Dumbbell
    const CHEESEFORK_ICONS = {
        feather: `<svg class="cf-wl-icon cf-feather" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76zm-9.74 5.26H6.5v-3.99l6-6c1.17-1.17 3.07-1.17 4.24 0s1.17 3.07 0 4.24l-6.24 6.25zM3 21h18v1H3z"/></svg>`,
        kettlebellEmpty: `<svg class="cf-wl-icon cf-weight empty" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h10l2 11H5L7 10z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>`,
        kettlebellFilled: `<svg class="cf-wl-icon cf-weight filled" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10h10l2 11H5L7 10z"/><path d="M9 10V6a3 3 0 0 1 6 0v4" fill="none"/></svg>`,
        kettlebellHalf: `<svg class="cf-wl-icon cf-weight half" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="1.5"><defs><linearGradient id="cfHalfGrad" x1="0" y1="0" x2="100%" y2="0"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M7 10h10l2 11H5L7 10z" fill="url(#cfHalfGrad)"/><path d="M9 10V6a3 3 0 0 1 6 0v4" fill="none"/></svg>`,
        scale: `<svg class="cf-wl-icon cf-scale" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
        scaleBadge: `<svg class="cf-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
        kettlebellBadge: `<svg class="cf-badge-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>`,
        dumbbell: `<svg class="cf-wl-icon cf-dumbbell" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 5h2v14H6V5zm10 0h2v14h-2V5zM3 8h2v8H3V8zm16 0h2v8h-2V8zM8 11h8v2H8v-2z"/></svg>`
    };

    function getWorkloadNormalizedWeights(totalScore) {
        if (!totalScore || totalScore <= 0) return 0;
        if (totalScore <= 6) return 1.0;
        if (totalScore <= 10) return 1.0 + ((totalScore - 6) / 4.0) * 1.0; // 6..10 -> 1.0..2.0
        if (totalScore <= 15) return 2.0 + ((totalScore - 10) / 5.0) * 1.0; // 10..15 -> 2.0..3.0 (at 15 => exactly 3.0 weights!)
        if (totalScore <= 21.5) return 3.0 + ((totalScore - 15) / 6.5) * 1.0; // 15..21.5 -> 3.0..4.0 (at 21.5 => exactly 4.0 weights!)
        if (totalScore <= 26) return 4.0 + ((totalScore - 21.5) / 4.5) * 1.0; // 21.5..26 -> 4.0..5.0
        return 5.0;
    }

    function renderCheeseForkWorkloadMeter(totalScore) {
        // Calibrated scale matching Technion student expectations:
        // ~15 pts (Sem 1) = exactly 3 kettlebells
        // ~21.5 pts (Sem 2) = exactly 4 kettlebells
        // >= 25 pts = full heavy dumbbell
        const norm = Math.max(0, Math.min(5, getWorkloadNormalizedWeights(totalScore)));
        
        let weightsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (norm >= i) {
                weightsHtml += CHEESEFORK_ICONS.kettlebellFilled;
            } else if (norm >= i - 0.5) {
                weightsHtml += CHEESEFORK_ICONS.kettlebellHalf;
            } else {
                weightsHtml += CHEESEFORK_ICONS.kettlebellEmpty;
            }
        }

        return `
            <div class="cheesefork-workload-widget" title="עומס סמסטריאלי: ${totalScore} (דירוג משוקלל: ${norm.toFixed(1)} מתוך 5)">
                <div class="cf-wl-header">
                    <span class="cf-wl-title">עומס</span>
                    <span class="cf-wl-score">${totalScore}</span>
                </div>
                <div class="cf-wl-gauge">
                    <span class="cf-wl-end scale" title="עומס מאוזן">${CHEESEFORK_ICONS.scale}</span>
                    <span class="cf-wl-weights">${weightsHtml}</span>
                    <span class="cf-wl-end dumbbell" title="עומס כבד">${CHEESEFORK_ICONS.dumbbell}</span>
                </div>
            </div>
        `;
    }

    function calculateSemesterWorkload(courses) {
        let totalScore = 0;
        let overrideCount = 0;
        (courses || []).forEach(c => {
            const wl = calculateCourseWorkload(c);
            totalScore += wl.score;
            if (wl.isOverride) overrideCount++;
        });

        // Thresholds calibrated to engineering workloads:
        // <= 13.5 Light, 14.0 - 19.5 Balanced, 20.0 - 23.5 Intense, > 23.5 Heavy
        let level = 'מאוזן';
        let levelKey = 'moderate';
        let color = '#10b981'; // Green

        if (totalScore > 23.5) {
            level = 'כבד';
            levelKey = 'heavy';
            color = '#ef4444'; // Red
        } else if (totalScore >= 20.0) {
            level = 'אינטנסיבי';
            levelKey = 'intense';
            color = '#f59e0b'; // Amber
        } else if (totalScore < 14.0) {
            level = 'קל';
            levelKey = 'light';
            color = '#38bdf8'; // Blue
        }

        const scoreRounded = parseFloat(totalScore.toFixed(1));

        return {
            totalScore: scoreRounded,
            level: level,
            levelKey: levelKey,
            color: color,
            overrideCount: overrideCount,
            meterHtml: renderCheeseForkWorkloadMeter(scoreRounded)
        };
    }

    // --------------------------------------------------------------------------
    // State Initialization & Persistence
    // --------------------------------------------------------------------------
    
    // Helper: Ensure essential foundational courses (Physics 1 & Physics 2) exist in degree plan
    function ensureEssentialCoursesInPlan(plan) {
        if (!plan || !Array.isArray(plan)) return;
        const allCodes = new Set();
        plan.forEach(s => (s.courses || []).forEach(c => {
            getNormalizedCodes(c.code, c.altCode).forEach(k => allCodes.add(k));
        }));

        const hasPhys1 = ['01140051', '114051', '01140071', '114071', '01140077', '114077'].some(k => allCodes.has(k));
        if (!hasPhys1) {
            const sem1 = plan.find(s => s.semester === 1) || plan[0];
            if (sem1) {
                sem1.courses = sem1.courses || [];
                sem1.courses.push({
                    code: "01140051",
                    altCode: "114051",
                    name: "פיזיקה 1",
                    credits: 2.5,
                    type: "mandatory",
                    variantGroupId: "physics_1",
                    prereqs: []
                });
                console.log('[Planner] Restored Physics 1 to Semester 1');
            }
        }

        const hasPhys2 = ['01140052', '114052', '01140075', '114075', '01140078', '114078'].some(k => allCodes.has(k));
        if (!hasPhys2) {
            const sem3 = plan.find(s => s.semester === 3) || plan[2] || plan[plan.length - 1];
            if (sem3) {
                sem3.courses = sem3.courses || [];
                sem3.courses.push({
                    code: "01140052",
                    altCode: "114052",
                    name: "פיזיקה 2",
                    credits: 3.5,
                    type: "mandatory",
                    variantGroupId: "physics_2",
                    prereqs: ["01140051", "01040041"]
                });
                console.log('[Planner] Restored Physics 2 to Semester 3');
            }
        }
    }

    function initPlannerState(force = false) {
        if (!force && customPlan && Array.isArray(customPlan) && customPlan.length > 0) {
            return;
        }

        if (!global.PLANNER_CATALOG) {
            console.warn('[Planner] PLANNER_CATALOG not loaded yet');
            return;
        }

        try {
            isReservistDeduction = localStorage.getItem(PLANNER_RESERVIST_KEY) === 'true';
            isAtudaTironut = localStorage.getItem(PLANNER_ATUDA_KEY) === 'true';
            const savedLevel = localStorage.getItem(PLANNER_ENGLISH_LEVEL_KEY);
            if (savedLevel === 'exempt_all' || savedLevel === 'exempt_a' || savedLevel === 'none') {
                englishLevel = savedLevel;
            } else {
                const oldExemption = localStorage.getItem(PLANNER_ENGLISH_EXEMPTION_KEY);
                englishLevel = (oldExemption === 'true') ? 'exempt_all' : 'none';
            }
            applyEnglishLevelState(englishLevel);
            const savedTrack = localStorage.getItem(PLANNER_TRACK_KEY);
            if (savedTrack) {
                if (savedTrack === 'year_2025' || savedTrack === 'year_2024' || savedTrack === 'year_2027' || savedTrack === 'year_2026' || savedTrack === 'barak') {
                    selectedTrack = savedTrack;
                } else if (savedTrack === 'regular_2026') {
                    selectedTrack = 'year_2027';
                }
            }
        } catch (e) {
            console.warn('[Planner] Could not read preferences from localStorage:', e);
        }

        let loadedPlan = null;
        let loadedUnassigned = [];

        const isAdir = isAdirAuthenticated();
        const v2Key = getPlannerStorageKeyV2();
        const v1Key = getPlannerStorageKeyV1();
        const preloadedState = (typeof window !== 'undefined' && window.PRELOADED_USER_STATE) || (typeof global !== 'undefined' && global.PRELOADED_USER_STATE) || (typeof PRELOADED_USER_STATE !== 'undefined' ? PRELOADED_USER_STATE : null);

        // Helper to detect Adir's custom degree plan
        function isAdirCustomPlan(plan) {
            return false; // Disabled heuristic to prevent accidental user plan purging
        }

        // Helper to check if a loaded plan has the required authentic baseline for Adir
        function isAdirPlanAuthentic(plan) {
            if (!plan || !Array.isArray(plan) || plan.length < 3) return false;
            const sem1 = plan.find(s => s.semester === 1);
            const sem2 = plan.find(s => s.semester === 2);
            const sem3 = plan.find(s => s.semester === 3);
            if (!sem1 || !sem2 || !sem3) return false;
            const s1 = (sem1.courses || []).map(c => c.code || c.altCode);
            const s2 = (sem2.courses || []).map(c => c.code || c.altCode);
            const s3 = (sem3.courses || []).map(c => c.code || c.altCode);
            const hasPhys1InS1 = s1.some(c => c === '01140051' || c === '114051');
            const hasChemLabInS2 = s2.some(c => c === '01250013' || c === '125013');
            const hasYogaInS3 = s3.some(c => c === '03940805');
            return hasPhys1InS1 && hasChemLabInS2 && hasYogaInS3;
        }

        // 1. First priority: cloud-synced degreePlan from global gameState
        if (global.gameState && Array.isArray(global.gameState.degreePlan) && global.gameState.degreePlan.length > 0) {
            try {
                if (!isAdir || isAdirPlanAuthentic(global.gameState.degreePlan)) {
                    loadedPlan = JSON.parse(JSON.stringify(global.gameState.degreePlan));
                    loadedUnassigned = Array.isArray(global.gameState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(global.gameState.degreePlanUnassigned)) : [];
                    console.log('[Planner] Initialized plan from gameState.degreePlan');
                } else {
                    console.warn('[Planner] Existing gameState.degreePlan was out-of-date or incomplete for Adir, preferring authentic preloaded plan.');
                }
            } catch (e) {
                console.error('[Planner] Error cloning gameState.degreePlan:', e);
            }
        }

        // 2. Preloaded authentic degreePlan from PRELOADED_USER_STATE (Adir / Capacitor)
        if (!loadedPlan && (isAdir || (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'capacitor:'))) && preloadedState && Array.isArray(preloadedState.degreePlan) && preloadedState.degreePlan.length > 0) {
            try {
                loadedPlan = JSON.parse(JSON.stringify(preloadedState.degreePlan));
                loadedUnassigned = Array.isArray(preloadedState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(preloadedState.degreePlanUnassigned)) : [];
                console.log('[Planner] Initialized plan from PRELOADED_USER_STATE.degreePlan (Adir authentic)');
            } catch (e) {}
        }

        // 3. User-Scoped Local Storage V2
        if (!loadedPlan) {
            try {
                let savedV2 = localStorage.getItem(v2Key) || (isAdir ? localStorage.getItem(PLANNER_STORAGE_KEY_V2) : null);
                if (savedV2) {
                    const parsed = JSON.parse(savedV2);
                    const semCandidate = Array.isArray(parsed.semesters) ? parsed.semesters : (Array.isArray(parsed) ? parsed : null);
                    if (!isAdir || isAdirPlanAuthentic(semCandidate)) {
                        if (parsed && Array.isArray(parsed.semesters) && parsed.semesters.length > 0) {
                            loadedPlan = parsed.semesters;
                            loadedUnassigned = Array.isArray(parsed.unassigned) ? parsed.unassigned : [];
                        } else if (Array.isArray(parsed) && parsed.length > 0) {
                            loadedPlan = parsed;
                            loadedUnassigned = [];
                        }
                    }
                }
            } catch (e) {
                console.error('[Planner] Error parsing saved plan V2:', e);
            }
        }

        // 4. User-Scoped Local Storage V1
        if (!loadedPlan) {
            try {
                let savedV1 = localStorage.getItem(v1Key) || (isAdir ? localStorage.getItem(PLANNER_STORAGE_KEY_V1) : null);
                if (savedV1) {
                    const parsedV1 = JSON.parse(savedV1);
                    const semCandidate = Array.isArray(parsedV1) ? parsedV1 : null;
                    if (!isAdir || isAdirPlanAuthentic(semCandidate)) {
                        if (Array.isArray(parsedV1) && parsedV1.length > 0) {
                            loadedPlan = parsedV1;
                            loadedUnassigned = [];
                        }
                    }
                }
            } catch (e) {
                console.error('[Planner] Error parsing saved plan V1:', e);
            }
        }

        // 5. Preloaded authentic degreePlan fallback for Adir
        if (!loadedPlan && (isAdir || (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'capacitor:'))) && preloadedState && Array.isArray(preloadedState.degreePlan) && preloadedState.degreePlan.length > 0) {
            loadedPlan = JSON.parse(JSON.stringify(preloadedState.degreePlan));
            loadedUnassigned = Array.isArray(preloadedState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(preloadedState.degreePlanUnassigned)) : [];
        }

        // 5. Initialize from official suggested syllabus ONLY if empty
        if (!loadedPlan || !Array.isArray(loadedPlan) || loadedPlan.length === 0) {
            const targetSyllabus = getSuggestedCatalogForTrack(selectedTrack);
            loadedPlan = JSON.parse(JSON.stringify(targetSyllabus || global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS));
            loadedUnassigned = [];
        }

        customPlan = loadedPlan;
        unassignedCourses = loadedUnassigned;

        // 1. Purge removed/exempt courses
        if (customPlan) {
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(c => !isPurgedCourse(c.code, c.altCode));
            });
        }
        if (unassignedCourses) {
            unassignedCourses = unassignedCourses.filter(c => !isPurgedCourse(c.code, c.altCode));
        }

        // 2. Ensure unassigned courses do not appear inside semesters
        if (unassignedCourses && unassignedCourses.length > 0) {
            const unassignedCodes = new Set();
            unassignedCourses.forEach(c => {
                getNormalizedCodes(c.code, c.altCode).forEach(k => unassignedCodes.add(k));
            });
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(c => {
                    const cKeys = getNormalizedCodes(c.code, c.altCode);
                    return !cKeys.some(k => unassignedCodes.has(k));
                });
            });
        }

        // 3. Synchronize courses from gameState into their exact semester
        syncCompletedCoursesFromGameState();
        ensureEssentialCoursesInPlan(customPlan);

        // 4. Persist clean state
        saveCustomPlan(true);
    }

    function syncCourseToGameState(courseObj, targetSemester) {
        if (!global.gameState) return;
        if (!global.gameState.courses) global.gameState.courses = {};
        if (!courseObj || !courseObj.code) return;

        const keys = getNormalizedCodes(courseObj.code, courseObj.altCode);
        let foundKey = null;
        for (let i = 0; i < keys.length; i++) {
            if (global.gameState.courses[keys[i]]) {
                foundKey = keys[i];
                break;
            }
        }

        if (foundKey) {
            global.gameState.courses[foundKey].semester = targetSemester;
        } else if (targetSemester > 0) {
            const code = courseObj.code;
            global.gameState.courses[code] = {
                id: code,
                code: code,
                altCode: courseObj.altCode || '',
                name: courseObj.name || courseObj.title || code,
                credits: Number(courseObj.credits) || 3.0,
                semester: targetSemester,
                prerequisites: courseObj.prereqs || [],
                status: isCourseCompleted(code, courseObj.altCode) ? 'mastered' : 'available',
                tasks: [
                    { id: `${code}_ex`, title: "מועד א", type: "exam", xp: 500, completed: false, status: 'not_started' }
                ],
                type: courseObj.type || 'elective'
            };
        }

        global.gameState.lastModified = Date.now();
        if (typeof global.saveState === 'function') global.saveState(true);
        if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
        if (typeof global.updateHud === 'function') global.updateHud();
    }

    let isSyncingPlannerToTree = false;
    function syncPlannerToTree(skipRerender) {
        if (isSyncingPlannerToTree) return;
        // CRITICAL: Only synchronize "התוכנית שלי" (customPlan), NEVER "שיבוץ מומלץ" (suggested catalog)
        if (currentMode !== 'custom') return;
        if (!global.gameState || !customPlan) return;
        if (!global.gameState.courses) global.gameState.courses = {};

        // Safety: If customPlan is pointing to suggested syllabus template, do not overwrite tree courses
        if (customPlan === global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS) return;

        isSyncingPlannerToTree = true;
        try {
            let changed = false;

            // 1. Purge accidental 8-digit duplicate courses and purged courses from gameState.courses
            const PURGED_TREE_CODES = new Set(['035044', '035026', '35026', '01140071', '114071']);
            Object.keys(global.gameState.courses).forEach(key => {
                if (PURGED_TREE_CODES.has(key)) {
                    delete global.gameState.courses[key];
                    changed = true;
                    return;
                }
                if (/^\d{8}$/.test(key) && !key.startsWith('0394')) {
                    const norm = (key.slice(1, 4) + key.slice(5)).replace(/^0+/, '');
                    const stripped = key.replace(/^0+/, '');
                    if (global.gameState.courses[norm] || global.gameState.courses[stripped] || global.gameState.courses['0' + norm]) {
                        delete global.gameState.courses[key];
                        changed = true;
                    }
                }
            });

            // 2. Sync courses from customPlan
            customPlan.forEach(sem => {
                const semNum = sem.semester;
                (sem.courses || []).forEach(c => {
                    if (!c || !c.code) return;
                    if (isPurgedCourse(c.code, c.altCode)) return;

                    const keys = getNormalizedCodes(c.code, c.altCode);
                    let foundKey = null;
                    for (let i = 0; i < keys.length; i++) {
                        if (global.gameState.courses[keys[i]]) {
                            foundKey = keys[i];
                            break;
                        }
                    }

                    if (foundKey) {
                        const targetCourse = global.gameState.courses[foundKey];
                        if (targetCourse.semester !== semNum) {
                            targetCourse.semester = semNum;
                            changed = true;
                        }
                        if (targetCourse.prerequisites && targetCourse.prerequisites.length > 0) {
                            const cleaned = targetCourse.prerequisites.map(p => {
                                let np = String(p);
                                if (/^\d{8}$/.test(np) && np.startsWith('0') && !np.startsWith('0394')) {
                                    np = np.slice(1, 4) + np.slice(5);
                                }
                                return np;
                            });
                            if (JSON.stringify(cleaned) !== JSON.stringify(targetCourse.prerequisites)) {
                                targetCourse.prerequisites = cleaned;
                                changed = true;
                            }
                        }
                    } else {
                        // DO NOT inject alternative tracks of mandatory courses (e.g. Physics 1M if Physics 1 was taken)
                        if (c.trackGroup === 'physics_1' || c.code === '01140071' || c.code === '114071') return;
                        if (c.code === '00350026' || c.code === '035026' || c.code === '35026') return;

                        // Normalize key to 6-digit course code
                        let normCode = c.altCode || c.code;
                        if (/^\d{8}$/.test(normCode) && normCode.startsWith('0') && !normCode.startsWith('0394')) {
                            normCode = normCode.slice(1, 4) + normCode.slice(5);
                        }
                        const strippedCode = normCode.replace(/^0+/, '');

                        if (global.gameState.courses[normCode] || global.gameState.courses[strippedCode]) {
                            const k = global.gameState.courses[normCode] ? normCode : strippedCode;
                            if (global.gameState.courses[k].semester !== semNum) {
                                global.gameState.courses[k].semester = semNum;
                                changed = true;
                            }
                            return;
                        }

                        // Truly new elective/custom course added in "התוכנית שלי"
                        const normPrereqs = (c.prereqs || c.prerequisites || []).map(p => {
                            let np = String(p);
                            if (/^\d{8}$/.test(np) && np.startsWith('0') && !np.startsWith('0394')) {
                                np = np.slice(1, 4) + np.slice(5);
                            }
                            return np;
                        });

                        global.gameState.courses[normCode] = {
                            id: normCode,
                            code: normCode,
                            altCode: c.altCode || c.code,
                            name: c.name || c.title || normCode,
                            credits: Number(c.credits) || 3.0,
                            semester: semNum,
                            prerequisites: normPrereqs,
                            status: isCourseCompleted(c.code, c.altCode) ? 'mastered' : 'available',
                            grade: c.grade || null,
                            type: c.type || (c.list ? 'elective' : (normCode.startsWith('0394') ? 'sports' : 'mandatory')),
                            tasks: [
                                { id: `${normCode}_ex`, title: "מועד א", type: "exam", xp: 500, completed: false, status: 'not_started' }
                            ]
                        };
                        changed = true;
                    }
                });
            });

            // 3. Courses placed in unassignedCourses should not occupy an active semester on the flowchart tree
            if (unassignedCourses && unassignedCourses.length > 0) {
                unassignedCourses.forEach(u => {
                    if (!u || !u.code) return;
                    const uKeys = getNormalizedCodes(u.code, u.altCode);
                    for (let i = 0; i < uKeys.length; i++) {
                        const k = uKeys[i];
                        if (global.gameState.courses[k]) {
                            if (global.gameState.courses[k].semester !== 0) {
                                global.gameState.courses[k].semester = 0;
                                changed = true;
                            }
                            break;
                        }
                    }
                });
            }

            if (changed) {
                global.gameState.lastModified = Date.now();
                if (typeof global.saveState === 'function') global.saveState(true);
                if (!skipRerender && typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
                if (typeof global.updateHud === 'function') global.updateHud();
            }
        } finally {
            isSyncingPlannerToTree = false;
        }
    }

    function syncAllCoursesFromGameState() {
        if (!global.gameState || !global.gameState.courses || !customPlan) return;

        Object.values(global.gameState.courses).forEach(c => {
            if (!c || !c.code) return;
            if (isPurgedCourse(c.code, c.altCode)) return;

            const actualSem = Number(c.semester);
            const cKeys = new Set(getNormalizedCodes(c.code, c.altCode));

            const hasNumeric = (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade)) && Number(c.grade) >= 55);
            const isBinary = (c.status === 'mastered') && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS');
            const isDone = (c.status === 'mastered') || hasNumeric || isBinary;

            if (actualSem >= 1 && actualSem <= 8) {
                // Remove from unassigned if assigned to a semester
                unassignedCourses = unassignedCourses.filter(u => {
                    const uKeys = getNormalizedCodes(u.code, u.altCode);
                    return !uKeys.some(k => cKeys.has(k));
                });

                // Find if already in customPlan
                let foundCourse = null;
                let foundInSemester = -1;
                customPlan.forEach(sem => {
                    const idx = (sem.courses || []).findIndex(x => {
                        const xKeys = getNormalizedCodes(x.code, x.altCode);
                        return xKeys.some(k => cKeys.has(k));
                    });
                    if (idx !== -1) {
                        foundCourse = sem.courses[idx];
                        foundInSemester = sem.semester;
                    }
                });

                // If the course is in customPlan and its semester in gameState changed, update customPlan!
                if (foundCourse && foundInSemester !== actualSem) {
                    customPlan.forEach(sem => {
                        sem.courses = (sem.courses || []).filter(x => {
                            const xKeys = getNormalizedCodes(x.code, x.altCode);
                            return !xKeys.some(k => cKeys.has(k));
                        });
                    });
                    const targetSemObj = customPlan.find(s => s.semester === actualSem);
                    if (targetSemObj) {
                        targetSemObj.courses = targetSemObj.courses || [];
                        targetSemObj.courses.push(foundCourse);
                    }
                }

                // If not in customPlan, add if completed, active/in_progress, or assigned to current semester
                if (!foundCourse && (isDone || c.status === 'in_progress' || c.status === 'active' || actualSem === 3)) {
                    const catCourse = (global.PLANNER_CATALOG && global.PLANNER_CATALOG.ALL_COURSES_MAP) ? 
                        (global.PLANNER_CATALOG.ALL_COURSES_MAP[c.code] || (c.altCode && global.PLANNER_CATALOG.ALL_COURSES_MAP[c.altCode])) : null;
                    if (catCourse) {
                        foundCourse = { ...catCourse };
                    } else {
                        foundCourse = {
                            code: c.code,
                            altCode: c.altCode || '',
                            name: c.name || c.title || c.code,
                            credits: Number(c.credits) || 3.0,
                            type: c.type || (c.code.startsWith('0394') ? 'sports' : 'elective'),
                            prereqs: c.prerequisites || []
                        };
                    }

                    const targetSemObj = customPlan.find(s => s.semester === actualSem);
                    if (targetSemObj) {
                        targetSemObj.courses = targetSemObj.courses || [];
                        targetSemObj.courses.push(foundCourse);
                    }
                }
            } else if (actualSem === 0) {
                // If course was unassigned in tree, remove from customPlan
                customPlan.forEach(sem => {
                    sem.courses = (sem.courses || []).filter(x => {
                        const xKeys = getNormalizedCodes(x.code, x.altCode);
                        return !xKeys.some(k => cKeys.has(k));
                    });
                });
            }
        });
    }

    // Alias for backwards compatibility
    const syncCompletedCoursesFromGameState = syncAllCoursesFromGameState;

    function resetPlanToSuggested() {
        if (!global.PLANNER_CATALOG) return;
        const targetSyllabus = getSuggestedCatalogForTrack(selectedTrack);
        customPlan = JSON.parse(JSON.stringify(targetSyllabus));
        unassignedCourses = [];
        syncAllCoursesFromGameState();
        saveCustomPlan(true);
    }

    function saveCustomPlan(immediate = false) {
        if (!customPlan) return;

        const performSave = () => {
            try {
                const dataToSave = {
                    semesters: customPlan,
                    unassigned: unassignedCourses
                };
                const jsonStr = JSON.stringify(dataToSave);
                const v2Key = getPlannerStorageKeyV2();
                const v1Key = getPlannerStorageKeyV1();
                localStorage.setItem(v2Key, jsonStr);
                localStorage.setItem(v1Key, JSON.stringify(customPlan));

                if (isAdirAuthenticated()) {
                    localStorage.setItem(PLANNER_STORAGE_KEY_V2, jsonStr);
                    localStorage.setItem(PLANNER_STORAGE_KEY_V1, JSON.stringify(customPlan));
                }

                if (global.gameState) {
                    global.gameState.degreePlan = customPlan;
                    global.gameState.degreePlanUnassigned = unassignedCourses;
                    if (typeof global.saveState === 'function') {
                        global.saveState(true);
                    }
                }

                // Synchronize all planned courses & semesters directly to the Skill Tree
                syncPlannerToTree();

                // Notify other components (HUD, Timetable, Flowchart) of state change
                if (typeof global.notifyStateChanged === 'function') {
                    global.notifyStateChanged({ source: 'planner' });
                }
            } catch (e) {
                console.error('[Planner] Failed to save plan:', e);
            }
        };

        if (immediate) {
            if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
            performSave();
        } else {
            if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
            saveDebounceTimer = setTimeout(performSave, 200);
        }
    }

    function getSuggestedCatalogForTrack(track) {
        if (!global.PLANNER_CATALOG) return [];
        if (track === 'barak' && global.PLANNER_CATALOG.SUGGESTED_BARAK_SYLLABUS) {
            return global.PLANNER_CATALOG.SUGGESTED_BARAK_SYLLABUS;
        }
        if (track === 'year_2027' && global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2027) {
            return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2027;
        }
        if (track === 'year_2026' && global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2026) {
            return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2026;
        }
        if ((track === 'year_2025' || track === 'year_2024') && global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2024) {
            return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2024;
        }
        return global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS || [];
    }

    function getActivePlan() {
        if (currentMode === 'suggested') {
            return getSuggestedCatalogForTrack(selectedTrack);
        }
        return customPlan || getSuggestedCatalogForTrack(selectedTrack);
    }

    function buildCourseSemesterMap(plan) {
        const map = {};
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                const keys = getNormalizedCodes(c.code, c.altCode);
                keys.forEach(k => { map[k] = sem.semester; });
            });
        });
        return map;
    }

    // --------------------------------------------------------------------------
    // Prerequisite Engine & Visual Feedback
    // --------------------------------------------------------------------------
    function checkPrerequisites(course, semesterNum, courseSemMap) {
        if (!course.prereqs || course.prereqs.length === 0) {
            return { valid: true, missing: [], missingCodes: [] };
        }

        const missing = [];
        const missingCodes = [];

        course.prereqs.forEach(prereqCode => {
            if (prereqCode === course.code || prereqCode === course.altCode) {
                // Ignore self-referential prerequisite
                return;
            }
            const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[prereqCode];
            const alt = prereqCourse ? prereqCourse.altCode : null;

            // Check 1: Already completed in student transcript
            if (isCourseCompleted(prereqCode, alt)) {
                return;
            }

            // Check 2: Scheduled in a semester strictly prior to semesterNum
            let pSem = courseSemMap[prereqCode];
            if (pSem === undefined && alt) pSem = courseSemMap[alt];
            if (pSem === undefined) {
                const stripped = prereqCode.replace(/^0+/, '');
                if (stripped) pSem = courseSemMap[stripped];
            }

            const name = prereqCourse ? prereqCourse.name : prereqCode;
            if (pSem === undefined) {
                missing.push(`${name} (${prereqCode})`);
                missingCodes.push(prereqCode);
                if (alt) missingCodes.push(alt);
            } else if (pSem >= semesterNum) {
                missing.push(`${name} (בסמסטר ${pSem})`);
                missingCodes.push(prereqCode);
                if (alt) missingCodes.push(alt);
            }
        });

        return {
            valid: missing.length === 0,
            missing: missing,
            missingCodes: missingCodes
        };
    }

    function getDownstreamDependentViolations(courseObj, targetSemester, plan) {
        if (!courseObj || !plan || !Array.isArray(plan)) return [];
        const courseCodes = new Set(getNormalizedCodes(courseObj.code, courseObj.altCode));
        const violations = [];
        plan.forEach(semObj => {
            const sNum = semObj.semester;
            if (sNum <= targetSemester) {
                (semObj.courses || []).forEach(c => {
                    const cKeys = getNormalizedCodes(c.code, c.altCode);
                    if (cKeys.some(k => courseCodes.has(k))) return; // Ignore self
                    if (isCourseCompleted(c.code, c.altCode)) return;

                    const prereqs = c.prereqs || c.prerequisites || [];
                    const dependsOnThis = prereqs.some(p => {
                        const normP = getNormalizedCodes(p, p);
                        return normP.some(k => courseCodes.has(k));
                    });
                    if (dependsOnThis) {
                        violations.push({
                            dependentCourse: c,
                            dependentSemester: sNum
                        });
                    }
                });
            }
        });
        return violations;
    }

    function highlightMissingPrerequisites(missingCodes, reasonMsg, targetSemester) {
        showPlannerToast(reasonMsg, true);

        // Shake the target semester column to provide immediate visceral feedback
        if (targetSemester) {
            const semCol = document.querySelector(`.planner-semester-col[data-semester="${targetSemester}"]`);
            if (semCol) {
                semCol.classList.remove('semester-col-shake');
                void semCol.offsetWidth; // Force CSS reflow
                semCol.classList.add('semester-col-shake');
                setTimeout(() => {
                    if (semCol) semCol.classList.remove('semester-col-shake');
                }, 1200);
            }
        }

        // Pulse prerequisite beacon cards
        const highlightedEls = [];
        (missingCodes || []).forEach(code => {
            const selector = `[data-code="${code}"], [data-alt-code="${code}"]`;
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                el.classList.add('prereq-pulse-beacon');
                highlightedEls.push(el);
            });
        });

        if (highlightedEls.length > 0) {
            highlightedEls[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        setTimeout(() => {
            highlightedEls.forEach(el => el.classList.remove('prereq-pulse-beacon'));
        }, 4000);
    }

    function showPlannerToast(message, isError = true) {
        let toast = document.getElementById('planner-active-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'planner-active-toast';
            toast.className = 'planner-toast-alert';
            document.body.appendChild(toast);
        }

        if (navigator.vibrate) {
            try { navigator.vibrate([80, 50, 80]); } catch (e) {}
        }

        toast.innerHTML = `
            <span style="font-size: 1.35rem; line-height: 1;">${isError ? '⛔' : 'ℹ️'}</span>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <strong style="font-size: 0.90rem; color: ${isError ? '#f87171' : '#38bdf8'};">${isError ? 'חסימת דרישות קדם' : 'הודעת מערכת'}</strong>
                <span style="font-size: 0.80rem; color: #f1f5f9; line-height: 1.35;">${escapeHtml(message)}</span>
            </div>
        `;
        toast.style.display = 'flex';
        toast.classList.remove('toast-active');
        void toast.offsetWidth;
        toast.classList.add('toast-active');

        if (toast._timer) clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            if (toast) {
                toast.classList.remove('toast-active');
                setTimeout(() => {
                    if (toast && !toast.classList.contains('toast-active')) {
                        toast.style.display = 'none';
                    }
                }, 300);
            }
        }, 5000);
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cycleCourseElectiveList(code) {
        const plan = getActivePlan();
        for (const sem of plan) {
            const c = (sem.courses || []).find(item => item.code === code || item.altCode === code);
            if (c) {
                const listOrder = ['A', 'B', 'C', 'D', 'E'];
                const curList = (c.list || 'B').toUpperCase();
                const curIdx = listOrder.indexOf(curList);
                const nextList = listOrder[(curIdx + 1) % listOrder.length];
                c.list = nextList;
                saveCustomPlan(true);
                renderDegreePlanner();
                const listNames = { 'A': "רשימה א'", 'B': "רשימה ב'", 'C': "רשימה ג'", 'D': "רשימה ד'", 'E': "בחירה חופשית" };
                if (typeof showPlannerToast === 'function') {
                    showPlannerToast(`שיוך הרשימה שונה ל: ${listNames[nextList] || nextList} (עודכן בחישוב התואר)`);
                }
                return;
            }
        }
    }

    // --------------------------------------------------------------------------
    // Degree Rules Engine
    // --------------------------------------------------------------------------
    function evaluateDegreeRules(plan) {
        let countA = 0;
        let countB = 0;
        let countC = 0;
        let countD = 0;
        let creditsBCD = 0;
        let totalElectiveCredits = 0;
        let totalDegreeCredits = 0;

        let countEnglishContent = 0;
        const countedEnglishCodes = new Set();
        const checkEnglishContent = (c) => {
            if (!c || !c.code) return;
            const normCodes = getNormalizedCodes(c.code, c.altCode);
            if (countedEnglishCodes.has(c.code)) return;

            let isEng = c.taughtInEnglish === true || c.isEnglish === true;
            // Language training courses (Mitkadmim A 324032 and Mitkadmim B 324033) officially count towards the 2 English courses requirement in Technion,
            // BUT ONLY IF the student actually studies/takes them (i.e. is NOT exempt from them)!
            // In Technion: an exemption (פטור) from language courses does NOT count as a studied English course.
            const isLanguageTraining = normCodes.some(code => code === '324033' || code === '03240033' || code === '324032' || code === '03240032');
            if (isLanguageTraining) {
                const exempt = isCourseExempt(c.code, c.altCode);
                if (!exempt) {
                    isEng = true;
                }
            }
            if (!isEng && global.gameState && global.gameState.englishContentCourses) {
                if (normCodes.some(code => global.gameState.englishContentCourses[code])) {
                    isEng = true;
                }
            }
            if (!isEng && global.gameState && global.gameState.courses) {
                normCodes.forEach(code => {
                    const st = global.gameState.courses[code];
                    if (st && (st.taughtInEnglish === true || st.isEnglish === true)) {
                        isEng = true;
                    }
                });
            }

            if (isEng) {
                countedEnglishCodes.add(c.code);
                countEnglishContent++;
            }
        };

        let countMalag = 0;
        let creditsMalag = 0;
        let countSport = 0;
        let hasScienceElective = false;
        let hasCapstone = false;

        const checkSpecialRequirements = (c) => {
            if (!c) return;
            const codeStr = String(c.code || '').replace(/^0+/, '');
            const nameStr = String(c.name || '');
            const creds = Number(c.credits) || 0;

            // Malag / Humanities (dept 324, list E/MALAG, type humanities, or name contains מל"ג)
            if (c.list === 'E' || c.list === 'MALAG' || c.type === 'humanities' || codeStr.startsWith('324') || nameStr.includes('מל"ג') || nameStr.includes('מלג')) {
                countMalag++;
                creditsMalag += creds;
            }

            // Sport / Physical Education (dept 394 or 0394, list SPORTS, type sports)
            if (c.list === 'SPORTS' || c.type === 'sports' || codeStr.startsWith('394') || nameStr.includes('ספורט') || nameStr.includes('חינוך גופני')) {
                countSport++;
            }

            // Science elective (125001 general chemistry, 114073 physics 3, 134058 biology, 124120, 124503)
            const scienceCodes = ['125001', '114073', '134058', '124120', '124503'];
            if (scienceCodes.includes(codeStr) || (c.altCode && scienceCodes.includes(String(c.altCode).replace(/^0+/, '')))) {
                hasScienceElective = true;
            }

            // Capstone / Final Project (034045, 035045, Formula Capstone 00340384/00340385, or title contains פרויקט גמר)
            if (codeStr === '34045' || codeStr === '35045' || codeStr === '340384' || codeStr === '340385' || nameStr.includes('פרויקט גמר') || nameStr.includes('פורמולה - פרויקט') || c.hasCapstone === true) {
                hasCapstone = true;
            }
        };

        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                checkEnglishContent(c);
                checkSpecialRequirements(c);
                const creds = Number(c.credits) || 0;
                totalDegreeCredits += creds;

                if (c.list === 'A') {
                    countA++;
                    totalElectiveCredits += creds;
                } else if (c.list === 'B') {
                    countB++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'C') {
                    countC++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'D') {
                    countD++;
                    creditsBCD += creds;
                    totalElectiveCredits += creds;
                } else if (c.list === 'E') {
                    totalElectiveCredits += creds;
                }
            });
        });

        if (unassignedCourses) {
            unassignedCourses.forEach(c => {
                checkEnglishContent(c);
                checkSpecialRequirements(c);
            });
        }
        if (global.gameState && global.gameState.courses) {
            Object.values(global.gameState.courses).forEach(c => {
                if (isCourseCompleted(c.code, c.altCode)) {
                    checkEnglishContent(c);
                    checkSpecialRequirements(c);
                }
            });
        }

        // Atuda Tironut: gives 2.0 binary credits towards degree total and free electives
        const allPlanCourses = [];
        plan.forEach(sem => (sem.courses || []).forEach(c => allPlanCourses.push(c)));
        if (unassignedCourses) {
            unassignedCourses.forEach(c => allPlanCourses.push(c));
        }
        if (global.gameState && global.gameState.courses) {
            Object.values(global.gameState.courses).forEach(c => {
                if (isCourseCompleted(c.code, c.altCode)) {
                    allPlanCourses.push(c);
                }
            });
        }
        const hasAtudaCardInPlan = allPlanCourses.some(c => {
            const name = (c.name || '').toLowerCase();
            return c.code === '00920001' || c.code === '920001' || name.includes('טירונות');
        });
        const atudaBonus = (isAtudaTironut && !hasAtudaCardInPlan) ? 2.0 : 0.0;
        totalDegreeCredits += atudaBonus;
        creditsMalag += atudaBonus;

        const requiredDegreeCredits = isReservistDeduction ? 155.5 : 157.5;
        const requiredElectiveCredits = 32.5;

        const ruleDegreeTotal_met = totalDegreeCredits >= requiredDegreeCredits;
        const ruleTotalElectives_met = totalElectiveCredits >= requiredElectiveCredits;
        const ruleBCD_met = creditsBCD >= 14.0;
        const ruleA_met = countA >= 1;
        const ruleB_met = countB >= 2;
        const ruleC_met = countC >= 2;
        const ruleD_met = countD >= 1;
        const ruleFacultyLists_met = ruleA_met && ruleB_met && ruleC_met && ruleD_met;
        const ruleEnglishContent_met = countEnglishContent >= 2;
        const ruleMalag_met = (creditsMalag + (isReservistDeduction ? 2.0 : 0)) >= 6.0;
        const ruleSport_met = countSport >= 2;
        const ruleScience_met = hasScienceElective === true;
        const ruleCapstone_met = hasCapstone === true;

        const clearanceRules = [
            { id: 'degreeTotal', name: 'סה״כ נק״ז לתואר', score: `${totalDegreeCredits.toFixed(1)} / ${requiredDegreeCredits.toFixed(1)} נק״ז`, isMet: ruleDegreeTotal_met, hint: `מינימום 157.5 נק״ז (${isReservistDeduction ? '155.5 למשרתי מילואים' : '155.5 למילואים'}${isAtudaTironut ? ' • כולל 2 נק״ז טירונות עתודאים' : ''})` },
            { id: 'totalElectives', name: 'נקודות בחירה פקולטיות', score: `${totalElectiveCredits.toFixed(1)} / ${requiredElectiveCredits.toFixed(1)} נק״ז`, isMet: ruleTotalElectives_met, hint: 'לפחות 32.5 נק״ז מרשימות הבחירה' },
            { id: 'creditsBCD', name: 'סל רשימות ב׳+ג׳+ד׳', score: `${creditsBCD.toFixed(1)} / 14.0 נק״ז`, isMet: ruleBCD_met, hint: 'חובת עומק והתמחות הנדסית' },
            { id: 'facultyLists', name: 'חלוקת רשימות (א׳, ב׳, ג׳, ד׳)', score: `א׳: ${countA}/1 • ב׳: ${countB}/2 • ג׳: ${countC}/2 • ד׳: ${countD}/1`, isMet: ruleFacultyLists_met, hint: '1 חישובי, 2 ליבה, 2 יישומי, 1 סמינר' },
            { id: 'englishContent', name: 'קורסים באנגלית (תוכן/מל״ג)', score: `${countEnglishContent} / 2`, isMet: ruleEnglishContent_met, hint: 'חובת הטכניון: 2 קורסים הנלמדים באנגלית' },
            { id: 'malag', name: 'קורסי מל״ג / מדעי הרוח', score: `${creditsMalag.toFixed(1)} / 6.0 נק״ז`, isMet: ruleMalag_met, hint: 'בין 6.0 ל-10.0 נק״ז מל״ג (מילואים מקנה 2 נק״ז)' },
            { id: 'sport', name: 'חינוך גופני (ספורט)', score: `${countSport} / 2 קורסים`, isMet: ruleSport_met, hint: '2 קורסי ספורט בינאריים ללא ציון מספרי' },
            { id: 'scienceCapstone', name: 'בחירה מדעית ופרויקט גמר', score: `מדעי: ${hasScienceElective ? '✅' : '⏳'} • פרויקט: ${hasCapstone ? '✅' : '⏳'}`, isMet: hasScienceElective && hasCapstone, hint: 'כימיה/ביולוגיה/פיזיקה 3 + פרויקט גמר' }
        ];

        const clearanceMetCount = clearanceRules.filter(r => r.isMet).length;
        const clearancePct = Math.round((clearanceMetCount / clearanceRules.length) * 100);
        const isClearanceReady = clearanceMetCount === clearanceRules.length;

        return {
            countA,
            countB,
            countC,
            countD,
            creditsBCD,
            totalElectiveCredits,
            totalDegreeCredits,
            requiredDegreeCredits,
            isReservistDeduction,
            countEnglishContent,
            countMalag,
            creditsMalag,
            countSport,
            hasScienceElective,
            hasCapstone,
            ruleEnglishContent_met,
            ruleA_met,
            ruleB_met,
            ruleC_met,
            ruleD_met,
            ruleBCD_met,
            ruleFacultyLists_met,
            ruleTotalElectives_met,
            ruleDegreeTotal_met,
            ruleMalag_met,
            ruleSport_met,
            ruleScience_met,
            ruleCapstone_met,
            clearanceRules,
            clearanceMetCount,
            clearancePct,
            isClearanceReady
        };
    }

    // --------------------------------------------------------------------------
    // Technion Degree Audit & Graduation Clearance Modal
    // --------------------------------------------------------------------------
    function openGraduationClearanceModal() {
        const plan = getActivePlan();
        const rulesEval = evaluateDegreeRules(plan);

        let modal = document.getElementById('planner-graduation-clearance-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'planner-graduation-clearance-modal';
        modal.className = 'modal-backdrop active';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 16px;';

        const statusColor = rulesEval.isClearanceReady ? '#10b981' : '#38bdf8';
        const statusTitle = rulesEval.isClearanceReady 
            ? '🎓 זכאי לתואר בהנדסת מכונות B.Sc.!' 
            : `⏳ בתהליך השלמת התואר (${rulesEval.clearanceMetCount} מתוך 8 חובות)`;

        modal.innerHTML = `
            <div class="modal-card" style="background: #0f172a; border: 1px solid ${statusColor}; border-radius: 16px; padding: 24px; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; direction: rtl; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                            <span>🎓</span>
                            <span>בדיקת זכאות לתואר וחובות סיום</span>
                        </h2>
                        <span style="font-size: 0.76rem; color: #94a3b8;">הפקולטה להנדסת מכונות • הטכניון מכון טכנולוגי לישראל</span>
                    </div>
                    <button type="button" class="btn-close-clearance-modal" aria-label="סגור חלון" style="background: transparent; border: none; font-size: 1.4rem; color: #94a3b8; cursor: pointer; padding: 4px;">✕</button>
                </div>

                <!-- Clearance Gauge Card -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid ${rulesEval.isClearanceReady ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)'}; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; gap: 14px;">
                    <div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: ${statusColor}; margin-bottom: 4px;">${statusTitle}</div>
                        <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.4;">
                            ${rulesEval.isClearanceReady 
                                ? 'כל דרישות הסף לתואר הושלמו כולל נק״ז, רשימות בחירה, אנגלית, מל״ג, ספורט ופרויקט גמר.' 
                                : `הושלמו ${rulesEval.clearanceMetCount} מתוך 8 חובות (${rulesEval.clearancePct}%). נותרו ${8 - rulesEval.clearanceMetCount} חובות לסיום התואר.`}
                        </div>
                    </div>
                    <div style="font-size: 1.6rem; font-weight: 900; color: ${statusColor}; background: rgba(0,0,0,0.3); border: 1px solid ${statusColor}; border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${rulesEval.clearanceMetCount}/8
                    </div>
                </div>

                <!-- 8-Point Clearance Checklist -->
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                    ${rulesEval.clearanceRules.map(r => `
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 8px; background: ${r.isMet ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${r.isMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'};">
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.95rem;">${r.isMet ? '✅' : '⏳'}</span>
                                    <strong style="font-size: 0.88rem; color: ${r.isMet ? '#f8fafc' : '#cbd5e1'};">${r.name}</strong>
                                </div>
                                <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px; padding-right: 22px;">${r.hint}</div>
                            </div>
                            <div style="font-size: 0.84rem; font-weight: 700; color: ${r.isMet ? '#34d399' : '#38bdf8'}; direction: ltr; white-space: nowrap;">
                                ${r.score}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-sm btn-primary btn-close-clearance-modal" style="background: #38bdf8; color: #082f49; font-weight: 800; padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;">
                        הבנתי, תודה
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelectorAll('.btn-close-clearance-modal').forEach(b => b.addEventListener('click', closeModal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    global.DegreePlanner = global.DegreePlanner || {};
    global.DegreePlanner.openGraduationClearanceModal = openGraduationClearanceModal;

    // --------------------------------------------------------------------------
    // Rendering Sub-systems
    // --------------------------------------------------------------------------
    // --------------------------------------------------------------------------
    // Technion Sports Club & Schedule Conflict Selector Modal
    // --------------------------------------------------------------------------
    function openSportClubSelectorModal(courseCode, semNum) {
        const plan = getActivePlan();
        const sem = plan.find(s => s.semester === semNum);
        if (!sem) return;
        const courseInSem = sem.courses.find(c => c.code === courseCode || c.altCode === courseCode);
        if (!courseInSem) return;

        const sportsList = (window.PLANNER_CATALOG && window.PLANNER_CATALOG.ELECTIVE_CATALOG && window.PLANNER_CATALOG.ELECTIVE_CATALOG.SPORTS) || [];
        const catCourse = sportsList.find(c => c.code === courseCode || c.altCode === courseCode)
            || (window.PLANNER_CATALOG && window.PLANNER_CATALOG.ALL_COURSES_MAP && (window.PLANNER_CATALOG.ALL_COURSES_MAP[courseCode] || window.PLANNER_CATALOG.ALL_COURSES_MAP[String(courseCode).replace(/^0+/, '')]))
            || courseInSem;

        const clubs = (catCourse && catCourse.clubs) || [];

        let modal = document.getElementById('planner-sport-club-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'planner-sport-club-modal';
        modal.className = 'modal-backdrop active';
        modal.style.cssText = 'position: fixed; inset: 0; background: rgba(10, 15, 29, 0.88); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100000; padding: 16px;';

        const clubsWithStatus = clubs.map(club => {
            const conflict = (window.PLANNER_CATALOG && typeof window.PLANNER_CATALOG.checkMeetingConflict === 'function')
                ? window.PLANNER_CATALOG.checkMeetingConflict({ ...club, courseCode: courseCode }, sem.courses)
                : { hasConflict: false };
            const isSelected = (courseInSem.selectedClubId && courseInSem.selectedClubId === club.id)
                || (courseInSem.selectedClub && (courseInSem.selectedClub === club.name || courseInSem.name.includes(club.name)));
            return { club, conflict, isSelected };
        });

        const renderedClubsHtml = clubsWithStatus.length === 0 
            ? `<div style="text-align: center; color: #94a3b8; padding: 20px;">אין חוגים ספציפיים מוגדרים לקורס זה. הרישום מתבצע ישירות בפורטל הטכניון.</div>`
            : clubsWithStatus.map(({ club, conflict, isSelected }) => {
                let conflictBadgeHtml = '';
                if (conflict.hasConflict && conflict.isDefinite) {
                    conflictBadgeHtml = `<div class="club-conflict-badge conflict-busy">⚠️ התנגשות ודאית: חופף ל-${escapeHtml(conflict.conflictingCourse)} ${escapeHtml(conflict.conflictingSlot || '')} (${escapeHtml(conflict.conflictingTime)})</div>`;
                } else if (conflict.hasConflict && !conflict.isDefinite) {
                    conflictBadgeHtml = `<div class="club-conflict-badge conflict-warning">🟡 חפיפה אפשרית: ${escapeHtml(conflict.conflictingCourse)} ${escapeHtml(conflict.conflictingSlot || '')} (${escapeHtml(conflict.note || 'קיימת קבוצה חלופית')})</div>`;
                } else {
                    conflictBadgeHtml = `<div class="club-conflict-badge conflict-free">🟢 פנוי במערכת השעות (ללא התנגשויות)</div>`;
                }

                return `
                    <div class="sport-club-card ${isSelected ? 'is-selected-card' : ''}" data-club-id="${escapeHtml(club.id)}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <div style="font-size: 0.95rem; font-weight: 700; color: #f8fafc;">
                                🏃 ${escapeHtml(club.name)}
                            </div>
                            ${isSelected ? '<span style="font-size: 0.72rem; color: #34d399; font-weight: 700; background: rgba(52, 211, 153, 0.15); border: 1px solid #34d399; padding: 2px 8px; border-radius: 10px;">משובץ כעת ✓</span>' : ''}
                        </div>
                        <div style="margin-top: 6px; font-size: 0.82rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 3px;">
                            <div>📅 <strong>מועד:</strong> יום ${escapeHtml(club.day)} • 🕒 ${escapeHtml(club.time)}</div>
                            <div>📍 <strong>מיקום:</strong> ${escapeHtml(club.room || 'מרכז הספורט הטכניוני')}</div>
                            ${club.note ? `<div style="font-size: 0.75rem; color: #94a3b8;">ℹ️ ${escapeHtml(club.note)}</div>` : ''}
                        </div>
                        <div style="margin-top: 8px;">
                            ${conflictBadgeHtml}
                        </div>
                        <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end;">
                            <button type="button" class="btn-choose-club ${isSelected ? 'btn-selected' : ''}" 
                                    data-club-id="${escapeHtml(club.id)}"
                                    data-code="${escapeHtml(courseCode)}" 
                                    data-sem="${semNum}">
                                ${isSelected ? '✓ חוג זה משובץ' : 'בחר חוג וסנכרן לתכנון'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

        modal.innerHTML = `
            <div class="modal-card" style="background: #0f172a; border: 1px solid #22c55e; border-radius: 16px; padding: 24px; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; direction: rtl; box-shadow: 0 15px 40px rgba(0,0,0,0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 1.15rem; font-weight: 800; color: #4ade80; display: flex; align-items: center; gap: 8px;">
                            🏃 בחירת חוג ומועד - ${escapeHtml(catCourse.name || courseInSem.name)}
                        </div>
                        <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 4px;">
                            קוד קורס: ${escapeHtml(courseCode)} • סמסטר מתוכנן: ${semNum}
                        </div>
                    </div>
                    <button type="button" id="btn-close-sport-modal" style="background: none; border: none; font-size: 1.4rem; color: #94a3b8; cursor: pointer; padding: 4px 8px;">✕</button>
                </div>

                <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; font-size: 0.8rem; color: #bbf7d0; line-height: 1.4;">
                    ⚠️ <strong>חובת נוכחות במועד קבוע:</strong><br>
                    בניגוד לקורסים עיוניים (בהם ניתן להגיע להרצאות או תרגולים מקבילים), רישום לקורס חינוך גופני או מל״ג מחייב הגעה לקבוצה ולשעות שבחרתם. המערכת בודקת באופן אוטומטי חפיפות עם יתר הקורסים המשובצים בסמסטר ${semNum}.
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                    ${renderedClubsHtml}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px; flex-wrap: wrap;">
                    <button type="button" id="btn-open-timetable-from-sport" class="btn-club-timetable-link" title="פתח את מערכת השעות המלאה לבדיקת שיבוץ">
                        📅 פתח במערכת השעות (Timetable Studio)
                    </button>
                    <button type="button" id="btn-close-sport-modal-footer" style="background: #334155; color: #f8fafc; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                        סגור
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        const closeBtn1 = modal.querySelector('#btn-close-sport-modal');
        if (closeBtn1) closeBtn1.onclick = closeModal;
        const closeBtn2 = modal.querySelector('#btn-close-sport-modal-footer');
        if (closeBtn2) closeBtn2.onclick = closeModal;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const ttBtn = modal.querySelector('#btn-open-timetable-from-sport');
        if (ttBtn) {
            ttBtn.onclick = () => {
                closeModal();
                if (window.TimetableGenerator && typeof window.TimetableGenerator.open === 'function') {
                    window.TimetableGenerator.open();
                } else if (window.TimetableStudio && typeof window.TimetableStudio.open === 'function') {
                    window.TimetableStudio.open();
                }
            };
        }

        modal.querySelectorAll('.btn-choose-club').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const clubId = btn.getAttribute('data-club-id');
                const chosenClub = clubs.find(c => c.id === clubId);
                if (!chosenClub) return;

                courseInSem.selectedClub = chosenClub.name;
                courseInSem.selectedClubId = chosenClub.id;
                courseInSem.scheduleSlot = {
                    day: chosenClub.day,
                    time: chosenClub.time,
                    dayIndex: chosenClub.dayIndex,
                    startTime: chosenClub.startTime,
                    endTime: chosenClub.endTime,
                    room: chosenClub.room
                };
                courseInSem.name = `חינוך גופני - ${chosenClub.name}`;

                saveCustomPlan();

                try {
                    const stored = localStorage.getItem('ast_timetable_user_anchors');
                    const anchors = stored ? JSON.parse(stored) : {};
                    const cleanCode = String(courseCode).replace(/^0+/, '');
                    const slotKey = `${courseCode}_sport`;
                    anchors[slotKey] = {
                        slotKey: slotKey,
                        courseCode: courseCode,
                        courseName: courseInSem.name,
                        slotType: 'sport',
                        groupId: chosenClub.groupId || '11',
                        sportName: chosenClub.name,
                        dayIndex: chosenClub.dayIndex,
                        startTime: chosenClub.startTime,
                        endTime: chosenClub.endTime,
                        room: chosenClub.room,
                        isFixed: true
                    };
                    anchors[`${cleanCode}_sport`] = anchors[slotKey];
                    localStorage.setItem('ast_timetable_user_anchors', JSON.stringify(anchors));
                } catch (err) {
                    console.warn('[Planner] Failed to save sport anchor:', err);
                }

                saveCustomPlan();
                renderDegreePlanner();
                if (typeof global.saveState === 'function') global.saveState();
                if (typeof global.renderUI === 'function') global.renderUI();

                closeModal();

                if (typeof window.showToast === 'function') {
                    window.showToast(`חוג "${chosenClub.name}" (${chosenClub.day} ${chosenClub.time}) שובץ בהצלחה לסמסטר ${semNum}!`);
                }
            };
        });
    }

    function renderDegreePlanner() {
        if (!customPlan) {
            initPlannerState();
        }
        if (!global.PLANNER_CATALOG) return;

        requestAnimationFrame(() => {
            const plan = getActivePlan();
            const courseSemMap = buildCourseSemesterMap(plan);
            const rulesEval = evaluateDegreeRules(plan);

            renderHeaderStats(rulesEval);
            renderWhatIfBanner();
            renderSemesterColumns(plan, courseSemMap);
            renderRulesCard(rulesEval);
            renderAddElectivesSection(plan, courseSemMap);
            bindDelegatedPlannerEvents();
        });
    }

    
    // --------------------------------------------------------------------------
    // What-If Degree GPA Simulator Engine
    // --------------------------------------------------------------------------
    function calculateWhatIfGPA() {
        let realWeightedSum = 0;
        let realGradedCredits = 0;

        if (global.gameState && global.gameState.courses) {
            Object.values(global.gameState.courses).forEach(c => {
                if (!c) return;
                const cr = Number(c.credits) || 0;
                const hasNumeric = (c.grade !== undefined && c.grade !== null && c.grade !== '' && !isNaN(Number(c.grade)) && Number(c.grade) >= 55);
                const isBinary = !hasNumeric && (c.isBinaryPass === true || c.grade === 'עובר' || c.grade === 'PASS');
                if (c.status === 'mastered' && hasNumeric && !isBinary) {
                    realWeightedSum += Number(c.grade) * cr;
                    realGradedCredits += cr;
                }
            });
        }

        const realGpa = realGradedCredits > 0 ? (realWeightedSum / realGradedCredits) : 0;

        let whatIfWeightedSum = 0;
        let whatIfCredits = 0;

        const plan = getActivePlan();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                if (isCourseCompleted(c.code, c.altCode)) return;
                if (c.type === 'sports' || (c.name && c.name.includes('חינוך גופני')) || c.isBinaryPass) return;

                const cr = Number(c.credits) || 0;
                const grade = (whatIfGrades[c.code] !== undefined) ? Number(whatIfGrades[c.code]) : defaultWhatIfGrade;
                whatIfWeightedSum += grade * cr;
                whatIfCredits += cr;
            });
        });

        const totalGraded = realGradedCredits + whatIfCredits;
        const projectedGpa = totalGraded > 0 ? ((realWeightedSum + whatIfWeightedSum) / totalGraded) : realGpa;

        return {
            realGpa,
            realGradedCredits,
            whatIfCredits,
            projectedGpa
        };
    }

    function renderWhatIfBanner() {
        const bannerEl = document.getElementById('planner-whatif-container');
        if (!bannerEl) return;
        if (!isWhatIfMode) {
            bannerEl.style.display = 'none';
            bannerEl.innerHTML = '';
            return;
        }

        const stats = calculateWhatIfGPA();
        bannerEl.style.display = 'flex';
        bannerEl.className = 'planner-whatif-banner';
        bannerEl.innerHTML = `
            <div class="whatif-stats-cluster">
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">ממוצע קיים (הושלם)</span>
                    <span class="whatif-stat-val">${stats.realGpa.toFixed(2)}</span>
                </div>
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">נק״ז מדורג קיים</span>
                    <span class="whatif-stat-val">${stats.realGradedCredits.toFixed(1)}</span>
                </div>
                <div class="whatif-stat-box">
                    <span class="whatif-stat-label">נק״ז מתוכנן בסימולציה</span>
                    <span class="whatif-stat-val">${stats.whatIfCredits.toFixed(1)}</span>
                </div>
                <div class="whatif-stat-box" style="border-right: 2px solid rgba(234, 179, 8, 0.4); padding-right: 14px;">
                    <span class="whatif-stat-label" style="color: #fde047;">🎯 ממוצע סיום תואר צפוי</span>
                    <span class="whatif-stat-val highlight">${stats.projectedGpa.toFixed(2)}</span>
                </div>
            </div>
            <div class="whatif-controls">
                <span style="font-size: 0.72rem; color: #94a3b8;">הגדרה גורפת:</span>
                <button type="button" class="btn-whatif-preset" data-preset="80">80</button>
                <button type="button" class="btn-whatif-preset" data-preset="85">85</button>
                <button type="button" class="btn-whatif-preset" data-preset="90">90</button>
                <button type="button" class="btn-whatif-preset" data-preset="95">95</button>
                <button type="button" class="btn-whatif-preset" data-preset="reset" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">איפוס</button>
            </div>
        `;
    }

    function renderHeaderStats(rulesEval) {
        const totalCredsEl = document.getElementById('planner-total-credits-val');
        const electivesCredsEl = document.getElementById('planner-electives-credits-val');
        const reqDegree = rulesEval.requiredDegreeCredits || 157.5;

        if (totalCredsEl) {
            totalCredsEl.innerText = `${rulesEval.totalDegreeCredits.toFixed(1)} / ${reqDegree.toFixed(1)}`;
            totalCredsEl.style.color = rulesEval.ruleDegreeTotal_met ? '#10b981' : '#38bdf8';
        }
        if (electivesCredsEl) {
            electivesCredsEl.innerText = `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5`;
            electivesCredsEl.style.color = rulesEval.ruleTotalElectives_met ? '#10b981' : '#38bdf8';
        }

        const btnCustom = document.getElementById('btn-planner-mode-custom');
        const btnSuggested = document.getElementById('btn-planner-mode-suggested');
        if (btnCustom) btnCustom.classList.toggle('active', currentMode === 'custom');
        if (btnSuggested) btnSuggested.classList.toggle('active', currentMode === 'suggested');

        // Track selector state
        const trackSelect = document.getElementById('planner-track-select');
        if (trackSelect) trackSelect.value = selectedTrack;

        // English level selector & badge state
        const englishSelect = document.getElementById('select-planner-english-level');
        const englishBadge = document.getElementById('planner-english-badge');
        const englishHint = document.getElementById('planner-english-hint');
        const legacyToggle = document.getElementById('toggle-planner-english-exemption');
        if (englishSelect) englishSelect.value = englishLevel;
        if (legacyToggle) legacyToggle.checked = (englishLevel === 'exempt_all');
        if (englishBadge) {
            if (englishLevel === 'exempt_all') {
                englishBadge.style.display = 'inline-block';
                englishBadge.innerText = 'פטור מלא (134+)';
                englishBadge.style.background = '#38bdf8';
                englishBadge.style.color = '#082f49';
            } else if (englishLevel === 'exempt_a') {
                englishBadge.style.display = 'inline-block';
                englishBadge.innerText = 'פטור מ-א׳ (לומד ב׳)';
                englishBadge.style.background = '#f59e0b';
                englishBadge.style.color = '#451a03';
            } else {
                englishBadge.style.display = 'inline-block';
                englishBadge.innerText = 'סיווג א׳ (ללא פטור)';
                englishBadge.style.background = '#64748b';
                englishBadge.style.color = '#f8fafc';
            }
        }
        if (englishHint) {
            if (englishLevel === 'exempt_all') {
                englishHint.innerText = '💡 פטור משני קורסי השפה. עליך להשלים 2 קורסי תוכן/מל״ג הנלמדים באנגלית.';
            } else if (englishLevel === 'exempt_a') {
                englishHint.innerText = '💡 פטור ממתקדמים א׳. חובה ללמוד מתקדמים ב׳ (324033, 3 נק״ז) אשר מכסה 1 מתוך 2 קורסי האנגלית הנדרשים! נדרש בנוסף רק קורס תוכן/מל״ג אחד באנגלית.';
            } else {
                englishHint.innerText = '💡 סיווג למתקדמים א׳. יש לקחת מתקדמים א׳ (324032) ומתקדמים ב׳ (324033) המכסים יחד את חובת 2 הקורסים באנגלית לתואר.';
            }
        }

        // Reservist toggle state
        const reservistToggle = document.getElementById('toggle-planner-reservist');
        const reservistBadge = document.getElementById('planner-reservist-badge');
        if (reservistToggle) reservistToggle.checked = isReservistDeduction;
        if (reservistBadge) reservistBadge.style.display = isReservistDeduction ? 'inline-block' : 'none';

        // Atuda Tironut toggle state
        const atudaToggle = document.getElementById('toggle-planner-atuda');
        const atudaBadge = document.getElementById('planner-atuda-badge');
        if (atudaToggle) atudaToggle.checked = isAtudaTironut;
        if (atudaBadge) atudaBadge.style.display = isAtudaTironut ? 'inline-block' : 'none';
    }

    function renderSemesterColumns(plan, courseSemMap) {
        const container = document.getElementById('planner-semesters-container');
        if (!container) return;

        const chunks = [];
        plan.forEach((sem, idx) => {
            const semNum = sem.semester || (idx + 1);
            let semCredits = 0;
            (sem.courses || []).forEach(c => { semCredits += Number(c.credits) || 0; });

            const semWorkload = calculateSemesterWorkload(sem.courses || []);
            const isSummer = sem.isSummer === true || sem.type === 'summer';
            const semTitle = isSummer ? (sem.title || `סמסטר קיץ ${sem.yearLabel || ''}`) : `סמסטר ${semNum}`;

            chunks.push(`
                <div class="planner-semester-col ${isSummer ? 'planner-summer-col' : ''}" data-semester="${semNum}">
                    <div class="semester-col-header ${isSummer ? 'summer-header' : ''}">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            ${isSummer ? '<span style="font-size: 1rem;">☀️</span>' : ''}
                            <span class="semester-col-title">${escapeHtml(semTitle)}</span>
                        </div>
                        <span class="semester-col-credits">${semCredits.toFixed(1)} נק״ז</span>
                    </div>
                    ${semWorkload.meterHtml}
                    <div class="planner-course-list" data-semester="${semNum}">
            `);

            (sem.courses || []).forEach(course => {
                const isSuggestedMode = currentMode === 'suggested';
                const completed = !isSuggestedMode && isCourseCompleted(course.code, course.altCode);
                const grade = !isSuggestedMode ? getCourseGrade(course.code, course.altCode) : null;
                const prereqStatus = checkPrerequisites(course, semNum, courseSemMap);
                const courseWl = calculateCourseWorkload(course);

                const isSportCourse = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagCourse = course.list === 'MALAG' || course.type === 'humanities';
                const tagClass = completed ? 'tag-completed' : (isSportCourse ? 'tag-sports' : (isMalagCourse ? 'tag-malag' : (course.list ? `tag-list-${course.list}` : (course.type ? `tag-${course.type}` : 'tag-mandatory'))));
                const tagLabel = completed ? (grade ? `✓ הושלם [${grade}]` : '✓ הושלם') : (isSportCourse ? '🏃 ספורט' : (isMalagCourse ? '🎭 מל״ג' : (course.list ? `בחירה ${course.list}׳` : (course.type === 'final_project' ? 'פרויקט גמר' : 'חובה'))));

                const canDrag = currentMode === 'custom' && !completed;
                const canRemove = currentMode === 'custom' && !completed;

                // Origin Badges (Moved / Retake)
                const movedBadge = (course.movedFromSemester !== undefined && course.movedFromSemester !== null)
                    ? `<span class="badge-course-origin moved" title="קורס זה הועבר מסמסטר ${course.movedFromSemester}">הועבר מסמ' ${course.movedFromSemester}</span>`
                    : '';
                const retakeBadge = (course.retakeFromSemester !== undefined && course.retakeFromSemester !== null)
                    ? `<span class="badge-course-origin retake" title="שיפור ציון / נלקח מחדש">נלקח מחדש (סמ' ${course.retakeFromSemester})</span>`
                    : '';

                // Annual Term Offering Tag - suppressed from card face per user request
                // (validation and blocking are enforced upon placement/move)
                const termBadge = '';

                let summerWarningBadge = '';
                if (isSummer) {
                    const summerCheck = global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSummer
                        ? global.PLANNER_CATALOG.isCourseOfferedInSummer(course.code, course)
                        : { offered: true, note: '' };
                    if (!summerCheck.offered) {
                        summerWarningBadge = `<span class="badge-term-offering" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #f87171;" title="שים לב: ${escapeHtml(summerCheck.note)}">⚠️ לא מוצע בקיץ</span>`;
                    }
                }

                chunks.push(`
                    <div class="planner-course-card ${completed ? 'course-card-completed' : ''}" 
                         draggable="${canDrag ? 'true' : 'false'}" 
                         data-code="${escapeHtml(course.code)}" 
                         data-alt-code="${escapeHtml(course.altCode || '')}" 
                         data-semester="${semNum}"
                         title="לחץ לצפייה בסילבוס, מערכת שעות, היסטוגרמות וביקורות ב-CheeseFork 🧀">
                        <div class="course-card-top">
                            <span class="course-card-code">${escapeHtml(course.code)}</span>
                            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                                ${movedBadge}
                                ${retakeBadge}
                                ${summerWarningBadge}
                                <span class="course-card-tag ${tagClass} ${course.list && !completed ? 'tag-interactive-list' : ''}" 
                                      ${course.list && !completed ? `data-action="cycle-list" data-code="${escapeHtml(course.code)}" title="לחץ לשינוי שיוך רשימת בחירה (א׳ / ב׳ / ג׳ / ד׳ / חופשית)" style="cursor: pointer; user-select: none;"` : ''}>
                                    ${tagLabel} ${course.list && !completed ? '▾' : ''}
                                </span>
                            </div>
                        </div>
                        <div class="course-card-title">${escapeHtml(course.name)}</div>
                        ${(() => {
                            const isSport = course.type === 'sports' || course.list === 'SPORTS';
                            const isMalag = course.type === 'humanities' || course.list === 'MALAG';
                            if (isSport && !completed) {
                                const hasClub = !!course.selectedClub;
                                const btnLabel = hasClub 
                                    ? `🏃 ${escapeHtml(course.selectedClub)}${course.scheduleSlot && course.scheduleSlot.time ? ` (${escapeHtml(course.scheduleSlot.day || '')} ${escapeHtml(course.scheduleSlot.time)})` : ''} ▾`
                                    : '🏃 בחר חוג ולו״ז במערכת... ▾';
                                const btnCls = hasClub ? 'btn-select-sport-club has-club' : 'btn-select-sport-club need-club';
                                return `
                                    <div style="margin-top: 4px;">
                                        <button type="button" class="${btnCls}" data-code="${escapeHtml(course.code)}" data-semester="${semNum}" title="בחר חוג ספורט וודא תאימות למערכת השעות">
                                            ${btnLabel}
                                        </button>
                                    </div>
                                `;
                            } else if (isMalag && !completed && course.scheduleSlot) {
                                return `
                                    <div style="margin-top: 4px;">
                                        <span class="badge-malag-schedule" title="חובת נוכחות בשעה קבועה בטכניון">
                                            🕒 יום ${escapeHtml(course.scheduleSlot.day)} ${escapeHtml(course.scheduleSlot.time)}
                                        </span>
                                    </div>
                                `;
                            }
                            return '';
                        })()}
                        <div class="course-card-bottom">
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <span class="course-card-credits">${course.credits} נק״ז</span>
                                <button type="button" class="btn-course-workload ${courseWl.isOverride ? 'has-override' : ''}" 
                                        data-code="${escapeHtml(course.code)}" 
                                        data-alt-code="${escapeHtml(course.altCode || '')}"
                                        data-name="${escapeHtml(course.name)}"
                                        data-workload="${courseWl.score}"
                                        title="${courseWl.isOverride ? `דירוג עומס אישי: ${courseWl.score} מתוך 5 (לחץ לעריכה)` : `דירוג עומס: ${courseWl.score} מתוך 5 (לחץ להזנת דירוג אישי)`}">
                                    ${CHEESEFORK_ICONS.scaleBadge}<span>${courseWl.score}</span>
                                </button>
                            </div>
                            ${isWhatIfMode && !completed ? `
                                <div class="course-card-whatif-wrap" title="ציון משוער בסימולטור">
                                    <span style="font-size: 0.68rem; color: #fde047;">ציון:</span>
                                    <input type="number" min="0" max="100" class="course-card-whatif-input" 
                                           id="whatif-input-${escapeHtml(course.code)}"
                                           name="whatif-input-${escapeHtml(course.code)}"
                                           aria-label="ציון משוער בסימולציה לקורס ${escapeHtml(course.name || course.code)}"
                                           data-code="${escapeHtml(course.code)}" 
                                           value="${whatIfGrades[course.code] !== undefined ? whatIfGrades[course.code] : defaultWhatIfGrade}">
                                </div>
                            ` : ''}
                            <div class="course-card-actions">
                                ${!completed && !prereqStatus.valid ? `
                                    <span class="prereq-warning-pill" title="דרישות קדם חסרות: ${escapeHtml(prereqStatus.missing.join(', '))}">
                                        ⚠️ קדם
                                    </span>
                                ` : ''}
                                ${canRemove ? `
                                    <button type="button" class="btn-card-remove" data-code="${escapeHtml(course.code)}" data-semester="${semNum}" title="הסר קורס זה מהתכנון והעבר לרשימת הקורסים שלא שובצו">
                                        ✕
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `);
            });

            chunks.push(`
                    </div>
                </div>
            `);

            // After each Spring semester (even semesters like 2, 4, 6, 8), render "+ הוסף סמסטר קיץ" if none exists
            if (currentMode === 'custom' && !isSummer && semNum % 2 === 0) {
                const nextSem = plan[idx + 1];
                const hasSummerNext = nextSem && (nextSem.isSummer === true || nextSem.type === 'summer');
                if (!hasSummerNext) {
                    chunks.push(`
                        <div class="planner-add-summer-col-wrap">
                            <button type="button" class="btn-add-summer-col" onclick="window.addSummerSemesterAfter(${semNum})" title="הוסף סמסטר קיץ לאחר סמסטר ${semNum}">
                                + הוסף סמסטר קיץ ☀️
                            </button>
                        </div>
                    `);
                }
            }
        });

        container.innerHTML = chunks.join('');
    }

    function renderRulesCard(rulesEval) {
        const updateRuleRow = (idPrefix, valText, isMet) => {
            const valEl = document.getElementById(`rule-val-${idPrefix}`);
            const statusEl = document.getElementById(`rule-status-${idPrefix}`);
            const rowEl = document.getElementById(`rule-row-${idPrefix}`);
            if (valEl) valEl.innerText = valText;
            if (statusEl) statusEl.innerText = isMet ? '✅' : '⏳';
            if (rowEl) rowEl.classList.toggle('rule-completed', isMet);
        };

        updateRuleRow('A', `${rulesEval.countA} / 1`, rulesEval.ruleA_met);
        updateRuleRow('B', `${rulesEval.countB} / 2`, rulesEval.ruleB_met);
        updateRuleRow('D', `${rulesEval.countD} / 1`, rulesEval.ruleD_met);
        updateRuleRow('C', `${rulesEval.countC} / 2`, rulesEval.ruleC_met);
        updateRuleRow('BCD', `${rulesEval.creditsBCD.toFixed(1)} / 14.0 נק״ז`, rulesEval.ruleBCD_met);
        updateRuleRow('total', `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5 נק״ז`, rulesEval.ruleTotalElectives_met);
        updateRuleRow('english-content', `${rulesEval.countEnglishContent} / 2`, rulesEval.ruleEnglishContent_met);

        const summaryBadge = document.getElementById('planner-rules-summary-badge');
        if (summaryBadge) {
            summaryBadge.innerText = `${rulesEval.totalElectiveCredits.toFixed(1)} / 32.5 נק״ז ${rulesEval.ruleTotalElectives_met ? '✅' : '⏳'}`;
            summaryBadge.style.color = rulesEval.ruleTotalElectives_met ? '#10b981' : '#38bdf8';
        }
    }

    function renderAddElectivesSection(plan, courseSemMap) {
        // 1. Gather all course codes currently placed in plan
        const placedCodes = new Set();
        plan.forEach(sem => {
            (sem.courses || []).forEach(c => {
                getNormalizedCodes(c.code, c.altCode).forEach(k => placedCodes.add(k));
            });
        });

        // 2. Compute "Ready For You" electives
        const readyContainer = document.getElementById('planner-ready-electives-list');
        const readyCourses = [];

        ['A', 'B', 'C', 'D', 'E', 'SPORTS', 'MALAG'].forEach(cat => {
            (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                const keys = getNormalizedCodes(course.code, course.altCode);
                if (keys.some(k => placedCodes.has(k))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;

                const reqs = course.prereqs || [];
                const satisfied = reqs.every(req => {
                    const prereqCourse = global.PLANNER_CATALOG.ALL_COURSES_MAP[req];
                    const alt = prereqCourse ? prereqCourse.altCode : null;
                    const rKeys = getNormalizedCodes(req, alt);
                    return isCourseCompleted(req, alt) || rKeys.some(k => courseSemMap[k] !== undefined);
                });

                if (satisfied && reqs.length > 0) {
                    readyCourses.push(course);
                }
            });
        });

        if (readyContainer) {
            if (readyCourses.length === 0) {
                readyContainer.innerHTML = '<div style="font-size: 0.72rem; color: #94a3b8; padding: 4px;">קורסי החובה המשובצים עדיין אינם פותחים קורסי בחירה מתקדמים.</div>';
            } else {
                readyContainer.innerHTML = readyCourses.slice(0, 6).map(course => `
                    <div class="planner-pool-item" draggable="true" data-code="${escapeHtml(course.code)}" data-alt-code="${escapeHtml(course.altCode || '')}">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${escapeHtml(course.name)}</span>
                            <div class="pool-item-meta">
                                ${
                                    course.list === "SPORTS" || course.type === "sports"
                                        ? '<span class="course-card-tag tag-sports">🏃 ספורט</span>'
                                        : (course.list === "MALAG" || course.type === "humanities"
                                            ? '<span class="course-card-tag tag-malag">🎭 מל״ג</span>'
                                            : `<span class="course-card-tag tag-list-${course.list}">רשימה ${course.list}׳</span>`)
                                }
                                <span>${course.credits} נק״ז</span>
                            </div>
                            ${
                                (course.list === "SPORTS" || course.type === "sports") && course.clubs && course.clubs.length > 0
                                    ? `<div class="pool-clubs-preview">🏃 ${escapeHtml(course.clubs.map(c => c.name.replace('חינוך גופני - ', '')).slice(0, 2).join(' • '))}${course.clubs.length > 2 ? '...' : ''}</div>`
                                    : ((course.list === "MALAG" || course.type === "humanities") && course.scheduleSlot
                                        ? `<div class="pool-schedule-preview">🕒 יום ${escapeHtml(course.scheduleSlot.day)} ${escapeHtml(course.scheduleSlot.time)}</div>`
                                        : '')
                            }
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${escapeHtml(course.code)}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `).join('');
            }
        }

        // 3. Render Filtered Pool
        const poolContainer = document.getElementById('planner-available-electives-list');
        if (!poolContainer) return;

        const coursesToShow = [];
        const q = searchQuery.toLowerCase();

        const normQ = q.replace(/["'״׳`]/g, '').trim();
        const cleanDigitsQ = q.replace(/\D/g, '');

        const matchesSearch = (course) => {
            if (!q) return true;
            const normName = (course.name || '').replace(/["'״׳`]/g, '').toLowerCase();
            const matchName = normName.includes(normQ) || (course.name || '').toLowerCase().includes(q);
            
            let matchCode = (course.code || '').includes(q) || (course.altCode && course.altCode.includes(q));
            if (!matchCode && cleanDigitsQ && cleanDigitsQ.length >= 2) {
                const cDigits = (course.code || '').replace(/\D/g, '');
                const aDigits = (course.altCode || '').replace(/\D/g, '');
                matchCode = cDigits.includes(cleanDigitsQ) || aDigits.includes(cleanDigitsQ) ||
                            cDigits.replace(/^0+/, '').includes(cleanDigitsQ.replace(/^0+/, '')) ||
                            aDigits.replace(/^0+/, '').includes(cleanDigitsQ.replace(/^0+/, ''));
            }
            return matchName || matchCode;
        };

        if (selectedCategory === 'UNASSIGNED') {
            (unassignedCourses || []).forEach(course => {
                const keys = getNormalizedCodes(course.code, course.altCode);
                if (keys.some(k => placedCodes.has(k))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;
                if (!matchesSearch(course)) return;
                coursesToShow.push({ ...course, isUnassignedItem: true });
            });
        } else if (selectedCategory === 'SUMMER') {
            const allCandidates = [];
            (unassignedCourses || []).forEach(c => allCandidates.push({ ...c, isUnassignedItem: true }));
            ['A', 'B', 'C', 'D', 'E', 'SPORTS', 'MALAG'].forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(c => allCandidates.push(c));
            });
            allCandidates.forEach(course => {
                const keys = getNormalizedCodes(course.code, course.altCode);
                if (keys.some(k => placedCodes.has(k))) return;
                if (isCourseCompleted(course.code, course.altCode)) return;
                if (!matchesSearch(course)) return;
                const isSummerAvailable = global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSummer
                    ? global.PLANNER_CATALOG.isCourseOfferedInSummer(course.code, course).offered
                    : false;
                if (isSummerAvailable) {
                    coursesToShow.push(course);
                }
            });
        } else {
            if (selectedCategory === 'ALL') {
                (unassignedCourses || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push({ ...course, isUnassignedItem: true });
                });
            }

            const cats = selectedCategory === 'ALL' ? ['A', 'B', 'C', 'D', 'E', 'SPORTS', 'MALAG'] : [selectedCategory];
            cats.forEach(cat => {
                (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).forEach(course => {
                    const keys = getNormalizedCodes(course.code, course.altCode);
                    if (keys.some(k => placedCodes.has(k))) return;
                    if (isCourseCompleted(course.code, course.altCode)) return;
                    if (!matchesSearch(course)) return;
                    coursesToShow.push(course);
                });
            });
        }

        if (coursesToShow.length === 0) {
            const emptyMsg = selectedCategory === 'UNASSIGNED' 
                ? 'אין כרגע קורסים שלא שובצו. גרור קורסים מכל סמסטר לכאן כדי להסיר אותם מהתכנון.' 
                : (selectedCategory === 'SUMMER' 
                    ? 'לא נמצאו קורסים המוצעים בסמסטר קיץ התואמים לחיפוש.' 
                    : 'לא נמצאו קורסי בחירה מתאימים לסינון.');
            poolContainer.innerHTML = `<div style="font-size: 0.76rem; color: #94a3b8; text-align: center; padding: 16px;">${emptyMsg}</div>`;
        } else {
            poolContainer.innerHTML = coursesToShow.map(course => {
                const isSportItem = course.list === 'SPORTS' || course.type === 'sports';
                const isMalagItem = course.list === 'MALAG' || course.type === 'humanities';
                const tagClass = course.isUnassignedItem 
                    ? 'tag-mandatory' 
                    : (isSportItem ? 'tag-sports' : (isMalagItem ? 'tag-malag' : (course.list ? `tag-list-${course.list}` : 'tag-mandatory')));
                const tagLabel = course.isUnassignedItem 
                    ? 'שלא שובץ' 
                    : (isSportItem ? '🏃 ספורט' : (isMalagItem ? '🎭 מל״ג' : (course.list ? `רשימה ${course.list}׳` : 'חובה')));

                return `
                    <div class="planner-pool-item" draggable="true" data-code="${escapeHtml(course.code)}" data-alt-code="${escapeHtml(course.altCode || '')}" title="לחץ לצפייה בסילבוס, ביקורות והיסטוגרמות ב-CheeseFork 🧀">
                        <div class="pool-item-info">
                            <span class="pool-item-title">${escapeHtml(course.name)}</span>
                            <div class="pool-item-meta">
                                <span class="course-card-tag ${tagClass}">${tagLabel}</span>
                                <span>${escapeHtml(course.code)}</span>
                                <span>• ${course.credits} נק״ז</span>
                            </div>
                            ${(() => {
                                if (isSportItem && course.clubs && course.clubs.length > 0) {
                                    const clubNames = course.clubs.map(c => c.name.replace('חינוך גופני - ', '')).slice(0, 3).join(' • ');
                                    const extra = course.clubs.length > 3 ? '...' : '';
                                    return `<div class="pool-clubs-preview" title="חוגים זמינים ברישום">🏃 ${escapeHtml(clubNames + extra)}</div>`;
                                } else if (isMalagItem && course.scheduleSlot) {
                                    return `<div class="pool-schedule-preview" title="חובת נוכחות במועד קבוע">🕒 יום ${escapeHtml(course.scheduleSlot.day)} ${escapeHtml(course.scheduleSlot.time)}</div>`;
                                }
                                return '';
                            })()}
                        </div>
                        <button type="button" class="btn-add-to-plan" data-code="${escapeHtml(course.code)}" title="הוסף קורס זה לסמסטר">+</button>
                    </div>
                `;
            }).join('');
        }
    }

    // --------------------------------------------------------------------------
    // Event Delegation Architecture (Zero memory leaks, robust lifecycle)
    // --------------------------------------------------------------------------
    let isEventsBound = false;

    function bindDelegatedPlannerEvents() {
        if (isEventsBound) return;
        const plannerTab = document.getElementById('planner-workspace');
        if (!plannerTab) return;
        isEventsBound = true;

        // 1. Drag Start Delegation
        plannerTab.addEventListener('dragstart', (e) => {
            const card = e.target.closest('[draggable="true"]');
            if (!card) return;

            if (card.classList.contains('planner-course-card')) {
                const code = card.getAttribute('data-code');
                const sem = parseFloat(card.getAttribute('data-semester'));
                activeDragPayload = {
                    type: 'semester-course',
                    code: code,
                    sourceSemester: sem
                };
            } else if (card.classList.contains('planner-pool-item')) {
                const code = card.getAttribute('data-code');
                activeDragPayload = {
                    type: 'pool-elective',
                    code: code
                };
            }

            e.dataTransfer.setData('text/plain', JSON.stringify(activeDragPayload));
            card.classList.add('dragging');
        });

        // ----------------------------------------------------------------------
        // Edge Auto-Scroll Engine during Drag & Drop
        // ----------------------------------------------------------------------
        let autoScrollRaf = null;
        let autoScrollSpeedX = 0;
        let autoScrollSpeedY = 0;
        let autoScrollTargetCol = null;

        function runAutoScrollStep() {
            if (!activeDragPayload) {
                stopEdgeAutoScroll();
                return;
            }

            const container = document.getElementById('planner-semesters-container');
            if (autoScrollSpeedX !== 0 && container) {
                container.scrollBy({ left: autoScrollSpeedX, behavior: 'instant' });
            }
            if (autoScrollSpeedY !== 0 && autoScrollTargetCol) {
                autoScrollTargetCol.scrollBy({ top: autoScrollSpeedY, behavior: 'instant' });
            }

            if (autoScrollSpeedX !== 0 || autoScrollSpeedY !== 0) {
                autoScrollRaf = requestAnimationFrame(runAutoScrollStep);
            } else {
                autoScrollRaf = null;
            }
        }

        function triggerEdgeAutoScroll(clientX, clientY) {
            const container = document.getElementById('planner-semesters-container');
            if (!container || !activeDragPayload) {
                stopEdgeAutoScroll();
                return;
            }

            const rect = container.getBoundingClientRect();
            const threshold = 110; // Trigger distance in pixels from viewport / container edge
            const maxSpeed = 26;   // Max velocity in px per frame

            // Check horizontal proximity to container edges
            if (clientX <= rect.left + threshold) {
                const ratio = Math.max(0, (threshold - (clientX - rect.left)) / threshold);
                autoScrollSpeedX = -Math.max(6, Math.round(ratio * maxSpeed));
            } else if (clientX >= rect.right - threshold) {
                const ratio = Math.max(0, (threshold - (rect.right - clientX)) / threshold);
                autoScrollSpeedX = Math.max(6, Math.round(ratio * maxSpeed));
            } else {
                autoScrollSpeedX = 0;
            }

            // Check inner vertical proximity inside semester course lists
            const courseList = document.elementFromPoint(clientX, clientY)?.closest('.planner-course-list');
            if (courseList) {
                const listRect = courseList.getBoundingClientRect();
                const vThresh = 40;
                if (clientY <= listRect.top + vThresh) {
                    const ratio = Math.max(0, (vThresh - (clientY - listRect.top)) / vThresh);
                    autoScrollSpeedY = -Math.max(4, Math.round(ratio * 14));
                    autoScrollTargetCol = courseList;
                } else if (clientY >= listRect.bottom - vThresh) {
                    const ratio = Math.max(0, (vThresh - (listRect.bottom - clientY)) / vThresh);
                    autoScrollSpeedY = Math.max(4, Math.round(ratio * 14));
                    autoScrollTargetCol = courseList;
                } else {
                    autoScrollSpeedY = 0;
                    autoScrollTargetCol = null;
                }
            } else {
                autoScrollSpeedY = 0;
                autoScrollTargetCol = null;
            }

            if (autoScrollSpeedX !== 0 || autoScrollSpeedY !== 0) {
                if (!autoScrollRaf) {
                    autoScrollRaf = requestAnimationFrame(runAutoScrollStep);
                }
            } else {
                stopEdgeAutoScroll();
            }
        }

        function stopEdgeAutoScroll() {
            if (autoScrollRaf) {
                cancelAnimationFrame(autoScrollRaf);
                autoScrollRaf = null;
            }
            autoScrollSpeedX = 0;
            autoScrollSpeedY = 0;
            autoScrollTargetCol = null;
        }

        // Global dragover fallback to ensure auto-scroll continues smoothly near board borders
        document.addEventListener('dragover', (e) => {
            if (activeDragPayload) {
                triggerEdgeAutoScroll(e.clientX, e.clientY);
            }
        });

        // 2. Drag End Delegation
        plannerTab.addEventListener('dragend', (e) => {
            const card = e.target.closest('[draggable="true"]');
            if (card) card.classList.remove('dragging');
            activeDragPayload = null;
            stopEdgeAutoScroll();
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });

        // 3. Drag Over & Drag Leave Delegation
        plannerTab.addEventListener('dragover', (e) => {
            const dropZone = e.target.closest('.planner-course-list, .planner-semester-col, .planner-sidebar, #planner-unassigned-dropzone, .planner-board-area, .planner-semesters-scroll');
            if (dropZone || activeDragPayload) {
                e.preventDefault();
                if (dropZone && dropZone.classList.contains('planner-course-list')) {
                    dropZone.classList.add('drag-over');
                }
            }
            if (activeDragPayload) {
                triggerEdgeAutoScroll(e.clientX, e.clientY);
            }
        });

        plannerTab.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.planner-course-list, .planner-semester-col, .planner-sidebar, #planner-unassigned-dropzone');
            if (dropZone && !dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });

        // 4. Drop Delegation
        plannerTab.addEventListener('drop', (e) => {
            stopEdgeAutoScroll();
            const semZone = e.target.closest('.planner-course-list, .planner-semester-col');
            const sidebarZone = e.target.closest('.planner-sidebar, #planner-unassigned-dropzone');

            let payload = activeDragPayload;
            if (!payload) {
                try {
                    const raw = e.dataTransfer.getData('text/plain');
                    if (raw) payload = JSON.parse(raw);
                } catch (err) {
                    return;
                }
            }
            if (!payload) return;

            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

            if (semZone) {
                e.preventDefault();
                e.stopPropagation();
                let targetSemester = parseFloat(semZone.getAttribute('data-semester'));
                if (isNaN(targetSemester) && semZone.closest('.planner-semester-col')) {
                    targetSemester = parseFloat(semZone.closest('.planner-semester-col').getAttribute('data-semester'));
                }
                if (targetSemester) {
                    handleCourseDrop(payload, targetSemester);
                }
            } else if (sidebarZone && payload.type === 'semester-course') {
                e.preventDefault();
                e.stopPropagation();
                sidebarZone.classList.remove('drag-over');
                handleSidebarDrop(payload);
            }
        });

        // 5. Global Click Delegation inside Planner
        plannerTab.addEventListener('click', (e) => {
            // Elective List Cycle (manual list categorization)
            const cycleTag = e.target.closest('[data-action="cycle-list"]');
            if (cycleTag) {
                const code = cycleTag.getAttribute('data-code');
                if (code) {
                    cycleCourseElectiveList(code);
                    return;
                }
            }

            // Mode buttons
            const modeBtn = e.target.closest('#btn-planner-mode-custom, #btn-planner-mode-suggested');
            if (modeBtn) {
                currentMode = modeBtn.id === 'btn-planner-mode-custom' ? 'custom' : 'suggested';
                renderDegreePlanner();
                return;
            }

            // Rules toggle collapse
            const rulesToggle = e.target.closest('#planner-rules-toggle');
            if (rulesToggle) {
                const body = document.getElementById('planner-rules-body');
                const icon = document.getElementById('planner-rules-toggle-icon');
                if (body) {
                    const isCollapsed = body.classList.toggle('collapsed');
                    body.style.display = isCollapsed ? 'none' : 'flex';
                    if (icon) icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
                }
                return;
            }

            // Add/Remove Semester Manager Button
            const addSemBtn = e.target.closest('#btn-planner-add-semester');
            if (addSemBtn) {
                openSemesterManagerModal();
                return;
            }

            // Reset to Suggested Button
            const resetBtn = e.target.closest('#btn-planner-reset-suggested');
            if (resetBtn) {
                if (confirm('האם אתה בטוח שברצונך לאפס את התוכנית לשיבוץ המומלץ הרשמי של הפקולטה?')) {
                    resetPlanToSuggested();
                    currentMode = 'custom';
                    renderDegreePlanner();
                }
                return;
            }

            // Manual Save Button
            const saveBtn = e.target.closest('#btn-planner-save');
            if (saveBtn) {
                saveCustomPlan(true);
                const oldHtml = saveBtn.innerHTML;
                saveBtn.innerHTML = '<span>✅ נשמר בהצלחה!</span>';
                saveBtn.style.background = '#059669';
                setTimeout(() => {
                    saveBtn.innerHTML = oldHtml;
                    saveBtn.style.background = '#10b981';
                }, 1500);
                return;
            }

            // Filter Pills
            const pill = e.target.closest('.planner-elective-filters .filter-pill');
            if (pill) {
                const filterPills = document.querySelectorAll('.planner-elective-filters .filter-pill');
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedCategory = pill.getAttribute('data-category');
                renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                return;
            }

            // Remove Course Click (✕ button)
            const removeBtn = e.target.closest('.btn-card-remove');
            if (removeBtn) {
                e.stopPropagation();
                const code = removeBtn.getAttribute('data-code');
                const semNum = parseFloat(removeBtn.getAttribute('data-semester'));
                handleSidebarDrop({
                    type: 'semester-course',
                    code: code,
                    sourceSemester: semNum
                });
                return;
            }

            // Add to Plan Click (+ button)
            const addBtn = e.target.closest('.btn-add-to-plan');
            if (addBtn) {
                e.stopPropagation();
                const code = addBtn.getAttribute('data-code');
                promptAddCourseToSemester(code);
                return;
            }

            // What-If GPA Simulator Toggle
            const whatIfBtn = e.target.closest('#btn-planner-what-if');
            if (whatIfBtn) {
                isWhatIfMode = !isWhatIfMode;
                whatIfBtn.classList.toggle('active', isWhatIfMode);
                whatIfBtn.style.background = isWhatIfMode ? '#ca8a04' : '';
                whatIfBtn.style.color = isWhatIfMode ? '#ffffff' : '#fde047';
                renderWhatIfBanner();
                saveCustomPlan();
                renderDegreePlanner();
                if (typeof global.saveState === 'function') global.saveState();
                if (typeof global.renderUI === 'function') global.renderUI();
                return;
            }

            // What-If Presets
            const presetBtn = e.target.closest('.btn-whatif-preset');
            if (presetBtn) {
                const preset = presetBtn.getAttribute('data-preset');
                if (preset === 'reset') {
                    whatIfGrades = {};
                    defaultWhatIfGrade = 85;
                } else {
                    const num = parseInt(preset, 10);
                    if (!isNaN(num)) {
                        defaultWhatIfGrade = num;
                        whatIfGrades = {};
                    }
                }
                renderWhatIfBanner();
                saveCustomPlan();
                renderDegreePlanner();
                if (typeof global.saveState === 'function') global.saveState();
                if (typeof global.renderUI === 'function') global.renderUI();
                return;
            }

            // Export Plan Button
            const exportBtn = e.target.closest('#btn-planner-export');
            if (exportBtn) {
                promptExportPlan();
                return;
            }

            // Graduation Clearance Audit Button
            const clearanceBtn = e.target.closest('#btn-open-graduation-clearance, #planner-rules-summary-badge');
            if (clearanceBtn) {
                openGraduationClearanceModal();
                return;
            }

            // Course Workload Override Button Click (⚡ button)
            const workloadBtn = e.target.closest('.btn-course-workload');
            if (workloadBtn) {
                e.stopPropagation();
                const code = workloadBtn.getAttribute('data-code');
                const altCode = workloadBtn.getAttribute('data-alt-code');
                const name = workloadBtn.getAttribute('data-name');
                const currentWl = workloadBtn.getAttribute('data-workload');
                openWorkloadEditPopover(code, altCode, name, currentWl);
                return;
            }

            // Sport Club Selector Button Click
            const sportClubBtn = e.target.closest('.btn-select-sport-club');
            if (sportClubBtn) {
                e.stopPropagation();
                const code = sportClubBtn.getAttribute('data-code');
                const semNum = parseFloat(sportClubBtn.getAttribute('data-semester'));
                openSportClubSelectorModal(code, semNum);
                return;
            }

            // Course card click/tap -> Open Course Details Modal (CheeseFork info, reviews, histograms & Technion++ resources)
            const card = e.target.closest('.planner-course-card, .planner-pool-item');
            if (card) {
                if (e.target.closest('.course-card-whatif-input, .btn-card-remove, .btn-add-to-plan, .btn-course-workload, .btn-select-sport-club, [data-action="cycle-list"]')) return;

                const code = card.getAttribute('data-code');
                const altCode = card.getAttribute('data-alt-code');
                const targetCode = code || altCode;

                if (targetCode && typeof window.openCourseDetails === 'function') {
                    window.openCourseDetails(targetCode);
                }
                return;
            }
        });

        // 6. What-If input live updates
        plannerTab.addEventListener('input', (e) => {
            const whatIfInput = e.target.closest('.course-card-whatif-input');
            if (whatIfInput) {
                const code = whatIfInput.getAttribute('data-code');
                const val = parseFloat(whatIfInput.value);
                if (!isNaN(val) && val >= 0 && val <= 100) {
                    whatIfGrades[code] = val;
                } else if (whatIfInput.value === '') {
                    delete whatIfGrades[code];
                }
                renderWhatIfBanner();
            }
        });

        // 6. Search Input Delegation (Debounced 150ms)
        const searchInput = document.getElementById('planner-elective-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    searchQuery = e.target.value.trim();
                    renderAddElectivesSection(getActivePlan(), buildCourseSemesterMap(getActivePlan()));
                }, 150);
            });
        }

        // 7. Track & Cohort Selector Change Listener (Auto-Refresh on Change)
        const trackSelect = document.getElementById('planner-track-select');
        if (trackSelect) {
            trackSelect.addEventListener('change', (e) => {
                selectedTrack = e.target.value;
                try {
                    localStorage.setItem(PLANNER_TRACK_KEY, selectedTrack);
                } catch (err) {}

                // Automatically update and align degree plan to new track syllabus
                const targetSyllabus = getSuggestedCatalogForTrack(selectedTrack);
                if (targetSyllabus) {
                    customPlan = JSON.parse(JSON.stringify(targetSyllabus));
                    unassignedCourses = [];
                    syncCompletedCoursesFromGameState();
                    saveCustomPlan(true);
                }

                renderDegreePlanner();
                if (typeof global.renderUI === 'function') global.renderUI();
                if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();

                let trackName = 'תשפ״ז - אוקטובר 2026';
                if (selectedTrack === 'year_2026') trackName = 'תשפ״ו - אוקטובר 2025';
                else if (selectedTrack === 'year_2025') trackName = 'תשפ״ה - אוקטובר 2024';
                else if (selectedTrack === 'year_2024') trackName = 'תשפ״ד - אוקטובר 2023';
                else if (selectedTrack === 'year_2027') trackName = 'תשפ״ז - אוקטובר 2026';
                else if (selectedTrack === 'barak') trackName = 'מסלול ברקים';
                showPlannerToast(`תוכנית/שנתון הלימודים עודכנה ורועננה אוטומטית: ${trackName} 🏛️`, false);
            });
        }

        // 8. Reservist Credit Deduction Toggle Listener
        const reservistToggle = document.getElementById('toggle-planner-reservist');
        if (reservistToggle && !reservistToggle.dataset.bound) {
            reservistToggle.dataset.bound = 'true';
            reservistToggle.addEventListener('change', (e) => {
                isReservistDeduction = e.target.checked;
                try {
                    localStorage.setItem(PLANNER_RESERVIST_KEY, isReservistDeduction ? 'true' : 'false');
                } catch (err) {}
                renderDegreePlanner();
                showPlannerToast(isReservistDeduction ? 'הופעל פטור מילואים: הופחתו 2 נק״ז מדרישות התואר! 🎖️' : 'בוטל פטור מילואים: דרישות התואר חזרו ל-157.5 נק״ז.', true);
            });
        }

        // 8.b Atuda Tironut Toggle Listener
        const atudaToggle = document.getElementById('toggle-planner-atuda');
        if (atudaToggle && !atudaToggle.dataset.bound) {
            atudaToggle.dataset.bound = 'true';
            atudaToggle.addEventListener('change', (e) => {
                isAtudaTironut = e.target.checked;
                try {
                    localStorage.setItem(PLANNER_ATUDA_KEY, isAtudaTironut ? 'true' : 'false');
                } catch (err) {}
                renderDegreePlanner();
                showPlannerToast(isAtudaTironut ? 'הופעלה הכרה בטירונות עתודאים: נוספו 2 נק״ז בינארי לתואר! 🪖' : 'בוטלה הכרה בטירונות עתודאים.', true);
            });
        }

        // 9. English Level Selector Listener
        const englishSelect = document.getElementById('select-planner-english-level');
        if (englishSelect && !englishSelect.dataset.bound) {
            englishSelect.dataset.bound = 'true';
            englishSelect.addEventListener('change', (e) => {
                const newLevel = e.target.value;
                applyEnglishLevelState(newLevel);
                renderDegreePlanner();
                if (typeof renderUI === 'function') renderUI();
                if (typeof renderFlowchartTree === 'function') renderFlowchartTree();

                let toastMsg = 'עודכנה הגדרת סיווג אנגלית.';
                if (newLevel === 'exempt_all') {
                    toastMsg = 'הופעל פטור מלא מקורסי שפה (134+): פטור מ-324033 ו-324032 (חובת 2 קורסי תוכן באנגלית חלה) 🇬🇧';
                } else if (newLevel === 'exempt_a') {
                    toastMsg = 'סיווג מתקדמים ב׳: פטור מ-324032. חובה ללמוד 324033 (3 נק״ז), המכסה 1 מתוך 2 קורסי האנגלית! 🇬🇧';
                } else {
                    toastMsg = 'סיווג מתקדמים א׳: ללא פטור משפה. נדרשים מתקדמים א׳ (324032) ומתקדמים ב׳ (324033). 🇬🇧';
                }
                showPlannerToast(toastMsg, true);
            });
        }

        // Support legacy toggle if present
        const englishToggle = document.getElementById('toggle-planner-english-exemption');
        if (englishToggle && !englishToggle.dataset.bound) {
            englishToggle.dataset.bound = 'true';
            englishToggle.addEventListener('change', (e) => {
                const newLevel = e.target.checked ? 'exempt_all' : 'none';
                applyEnglishLevelState(newLevel);
                renderDegreePlanner();
                if (typeof renderUI === 'function') renderUI();
                if (typeof renderFlowchartTree === 'function') renderFlowchartTree();
                showPlannerToast(e.target.checked ? 'הופעל פטור מקורסי שפה (134+).' : 'בוטל פטור מקורסי שפה.', true);
            });
        }
    }

    // --------------------------------------------------------------------------
    // Interactive User Workload Popover (Micro-Input Editor)
    // --------------------------------------------------------------------------
    function openWorkloadEditPopover(code, altCode, name, currentScore) {
        let overlay = document.getElementById('workload-popover-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'workload-popover-overlay';
            overlay.className = 'workload-popover-overlay';
            document.body.appendChild(overlay);
        }

        const existingOverride = getCourseUserWorkload(code, altCode);
        const displayScore = existingOverride !== null ? existingOverride : currentScore;

        overlay.innerHTML = `
            <div class="workload-popover-box" onclick="event.stopPropagation();">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 class="workload-popover-title" style="display: flex; align-items: center; gap: 8px;">${CHEESEFORK_ICONS.scaleBadge} הגדרת רמת עומס</h4>
                    <span style="font-size: 0.8rem; color: #38bdf8; font-family: monospace; background: rgba(56, 189, 248, 0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">${escapeHtml(code)}</span>
                </div>
                <div class="workload-popover-desc">
                    <strong style="color: #f1f5f9; font-size: 0.92rem;">${escapeHtml(name)}</strong>
                </div>
                <div class="workload-popover-slider-wrap">
                    <div class="workload-slider-hero">
                        <span class="workload-slider-hero-num" id="workload-slider-num">${Number(displayScore).toFixed(1)}</span>
                        <span class="workload-slider-hero-max">/ 5.0</span>
                    </div>
                    <input type="range" id="workload-slider-val" class="workload-range-slider" min="1.0" max="5.0" step="0.5" value="${displayScore}">
                </div>
                <div class="workload-popover-actions">
                    <button type="button" class="btn btn-sm btn-primary" id="btn-workload-save" style="flex: 2; background: #0284c7; border-color: #38bdf8; font-weight: 700;">
                        שמירה
                    </button>
                    ${existingOverride !== null ? `
                    <button type="button" class="btn btn-sm btn-outline" id="btn-workload-reset" style="flex: 1; border-color: rgba(239, 68, 68, 0.5); color: #f87171;" title="איפוס לבייסליין המקורי">
                        איפוס
                    </button>
                    ` : ''}
                    <button type="button" class="btn btn-sm btn-secondary" id="btn-workload-cancel" style="flex: 1;">
                        ביטול
                    </button>
                </div>
            </div>
        `;

        overlay.style.display = 'flex';

        const sliderEl = overlay.querySelector('#workload-slider-val');
        const numDisplayEl = overlay.querySelector('#workload-slider-num');

        const updateSliderDisplay = (val) => {
            if (numDisplayEl) numDisplayEl.textContent = parseFloat(val).toFixed(1);
        };

        if (sliderEl) {
            sliderEl.addEventListener('input', (e) => {
                updateSliderDisplay(e.target.value);
            });
            sliderEl.focus();
        }

        // Close handlers
        const closePopover = () => {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        };

        overlay.onclick = closePopover;
        overlay.querySelector('#btn-workload-cancel').onclick = closePopover;

        overlay.querySelector('#btn-workload-save').onclick = () => {
            const val = parseFloat(sliderEl ? sliderEl.value : displayScore);
            if (!isNaN(val) && val > 0) {
                setCourseUserWorkload(code, altCode, val);
                closePopover();
                renderDegreePlanner();
                showPlannerToast(`עודכן דירוג עומס אישי לקורס ${name}: ${val} מתוך 5`, false);
            } else {
                closePopover();
            }
        };

        const resetBtn = overlay.querySelector('#btn-workload-reset');
        if (resetBtn) {
            resetBtn.onclick = () => {
                setCourseUserWorkload(code, altCode, null);
                closePopover();
                renderDegreePlanner();
                showPlannerToast(`דירוג העומס אופס לבייסליין המערכת לקורס ${name}`, false);
            };
        }
    }

    // --------------------------------------------------------------------------
    // Course Placement & Rejection Engine
    // --------------------------------------------------------------------------
    
    // --------------------------------------------------------------------------
    // Mobile Tap-to-Move Action Sheet (Touch Ergonomics)
    // --------------------------------------------------------------------------
    function openCourseActionSheet(courseCode, currentSemester) {
        const overlay = document.getElementById('planner-action-sheet-overlay');
        const sheet = document.getElementById('planner-action-sheet');
        if (!overlay || !sheet) return;

        let course = null;
        const plan = getActivePlan();
        if (currentSemester) {
            const sem = plan.find(s => s.semester === currentSemester);
            if (sem) course = (sem.courses || []).find(c => c.code === courseCode);
        }
        if (!course) {
            course = unassignedCourses.find(c => c.code === courseCode) ||
                     (global.PLANNER_CATALOG ? global.PLANNER_CATALOG.ALL_COURSES_MAP[courseCode] : null);
        }
        if (!course) return;

        const currentLocText = currentSemester ? `משובץ בסמסטר ${currentSemester}` : `במאגר (לא משובץ)`;

        let semButtonsHtml = '';
        plan.forEach(s => {
            const semNum = s.semester;
            const isCurrent = semNum === currentSemester;
            const isSummer = s.isSummer === true || s.type === 'summer';
            const semTitle = isSummer ? (s.title || (s.yearLabel ? `סמסטר קיץ ${s.yearLabel} ☀️` : 'סמסטר קיץ ☀️')) : `סמסטר ${semNum}`;
            semButtonsHtml += `
                <button type="button" class="sheet-sem-btn ${isCurrent ? 'current' : ''}" data-target-sem="${semNum}">
                    ${escapeHtml(semTitle)} ${isCurrent ? '📍' : ''}
                </button>
            `;
        });

        sheet.innerHTML = `
            <div class="sheet-handle-bar"></div>
            <div class="sheet-header-title">${escapeHtml(course.name)}</div>
            <div class="sheet-header-sub">
                <span>קוד: ${escapeHtml(course.code)}</span>
                <span>•</span>
                <span>${course.credits} נק״ז</span>
                <span>•</span>
                <span style="color: #38bdf8;">${currentLocText}</span>
            </div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #94a3b8; margin-bottom: 8px;">העבר לסמסטר:</div>
            <div class="sheet-semesters-grid">
                ${semButtonsHtml}
            </div>
            <div class="sheet-actions-row">
                ${currentSemester ? `
                    <button type="button" class="sheet-btn-remove" id="sheet-btn-remove-course">
                        🗑️ הסר מהתכנון (העבר למאגר)
                    </button>
                ` : ''}
                <button type="button" class="sheet-btn-cancel" id="sheet-btn-cancel">ביטול</button>
            </div>
        `;

        overlay.classList.add('active');

        const closeSheet = () => {
            overlay.classList.remove('active');
        };

        const cancelBtn = sheet.querySelector('#sheet-btn-cancel');
        if (cancelBtn) cancelBtn.onclick = closeSheet;

        overlay.onclick = (e) => {
            if (e.target === overlay) closeSheet();
        };

        const semBtns = sheet.querySelectorAll('.sheet-sem-btn');
        semBtns.forEach(btn => {
            btn.onclick = () => {
                const targetSem = parseFloat(btn.getAttribute('data-target-sem'));
                closeSheet();
                if (targetSem === currentSemester) return;
                handleCourseDrop({
                    type: currentSemester ? 'semester-course' : 'pool-course',
                    code: courseCode,
                    sourceSemester: currentSemester
                }, targetSem);
            };
        });

        const removeBtn = sheet.querySelector('#sheet-btn-remove-course');
        if (removeBtn) {
            removeBtn.onclick = () => {
                closeSheet();
                handleSidebarDrop({
                    type: 'semester-course',
                    code: courseCode,
                    sourceSemester: currentSemester
                });
            };
        }
    }

    // --------------------------------------------------------------------------
    // Plan Export Engine (Image PNG & Clean Print)
    // --------------------------------------------------------------------------
    function promptExportPlan() {
        const overlay = document.getElementById('planner-export-modal-overlay');
        if (!overlay) return;
        overlay.classList.add('active');

        if (!overlay._isBound) {
            overlay._isBound = true;

            const btnPng = document.getElementById('btn-choice-export-png');
            const btnPdf = document.getElementById('btn-choice-export-pdf');
            const btnClose = document.getElementById('btn-close-export-modal');

            const closeExportModal = () => {
                overlay.classList.remove('active');
            };

            if (btnClose) btnClose.onclick = closeExportModal;
            overlay.onclick = (e) => {
                if (e.target === overlay) closeExportModal();
            };

            if (btnPng) {
                btnPng.onclick = () => {
                    closeExportModal();
                    exportPlanToCanvasPNG();
                };
            }

            if (btnPdf) {
                btnPdf.onclick = () => {
                    closeExportModal();
                    setTimeout(() => {
                        window.print();
                    }, 150);
                };
            }
        }
    }

    function exportPlanToCanvasPNG() {
        try {
            const plan = getActivePlan();
            if (!plan || plan.length === 0) return;

            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');

            // Dark RPG Canvas Background
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Header Banner
            const grad = ctx.createLinearGradient(0, 0, 1920, 0);
            grad.addColorStop(0, '#0284c7');
            grad.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1920, 80);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 26px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('🎓 טכניון - הפקולטה להנדסת מכונות | תוכנית לימודים לתואר ראשון', 1880, 50);

            ctx.font = '16px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(new Date().toLocaleDateString('he-IL'), 40, 50);

            // 8 Semesters Grid (2 rows x 4 cols)
            const colWidth = 430;
            const colGap = 35;
            const startX = 40;
            const rowHeight = 440;
            const startY = 110;

            const drawBox = (x, y, w, h, r) => {
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, w, h, r);
                } else {
                    ctx.rect(x, y, w, h);
                }
                ctx.fill();
                ctx.stroke();
            };

            plan.slice(0, 8).forEach((sem, idx) => {
                const colIdx = idx % 4;
                const rowIdx = Math.floor(idx / 4);
                const x = startX + colIdx * (colWidth + colGap);
                const y = startY + rowIdx * (rowHeight + 40);

                ctx.fillStyle = '#111827';
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 2;
                drawBox(x, y, colWidth, rowHeight, 10);

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 18px Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`סמסטר ${sem.semester || (idx + 1)}`, x + colWidth - 15, y + 30);

                let semCr = 0;
                (sem.courses || []).forEach(c => semCr += Number(c.credits) || 0);
                ctx.fillStyle = '#94a3b8';
                ctx.font = '14px Arial, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${semCr.toFixed(1)} נק״ז`, x + 15, y + 30);

                let curY = y + 45;
                const coursesToRender = (sem.courses || []).slice(0, 7);
                coursesToRender.forEach(c => {
                    const completed = isCourseCompleted(c.code, c.altCode);
                    ctx.fillStyle = completed ? 'rgba(16, 185, 129, 0.15)' : '#1e293b';
                    ctx.strokeStyle = completed ? '#10b981' : '#334155';
                    ctx.lineWidth = 1;
                    drawBox(x + 10, curY, colWidth - 20, 48, 6);

                    ctx.fillStyle = completed ? '#34d399' : '#f8fafc';
                    ctx.font = 'bold 13px Arial, sans-serif';
                    ctx.textAlign = 'right';
                    const rawName = c.name || c.title || c.code || 'קורס';
                    const courseName = rawName.length > 28 ? rawName.substring(0, 26) + '...' : rawName;
                    ctx.fillText(courseName, x + colWidth - 20, curY + 22);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '12px Arial, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${c.code} • ${c.credits || 0} נק״ז`, x + colWidth - 20, curY + 40);

                    if (completed) {
                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 12px Arial, sans-serif';
                        ctx.textAlign = 'left';
                        ctx.fillText('✓ הושלם', x + 20, curY + 30);
                    }

                    curY += 54;
                });

                if ((sem.courses || []).length > 7) {
                    const extra = (sem.courses || []).length - 7;
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 12px Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(`+ עוד ${extra} קורסים בסמסטר זה`, x + (colWidth / 2), curY + 16);
                }
            });

            const link = document.createElement('a');
            link.download = `Technion_ME_Degree_Plan_${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showPlannerToast('✓ תמונת התוכנית נוצרה והורדה בהצלחה!', false);
        } catch (err) {
            console.error('[Export Plan PNG] Error:', err);
            showPlannerToast('שגיאה בייצוא תמונת התכנון.');
        }
    }

    function resolveCourseObject(code) {
        if (!code) return null;
        const cKeys = new Set(getNormalizedCodes(code, code));

        // 1. Unassigned courses
        let found = (unassignedCourses || []).find(c => {
            const uKeys = getNormalizedCodes(c.code, c.altCode);
            return uKeys.some(k => cKeys.has(k));
        });
        if (found) return { ...found };

        // 2. ELECTIVE_CATALOG
        if (global.PLANNER_CATALOG && global.PLANNER_CATALOG.ELECTIVE_CATALOG) {
            for (const cat of Object.keys(global.PLANNER_CATALOG.ELECTIVE_CATALOG)) {
                found = (global.PLANNER_CATALOG.ELECTIVE_CATALOG[cat] || []).find(c => {
                    const uKeys = getNormalizedCodes(c.code, c.altCode);
                    return uKeys.some(k => cKeys.has(k));
                });
                if (found) return { ...found };
            }
        }

        // 3. ALL_COURSES_MAP
        if (global.PLANNER_CATALOG && global.PLANNER_CATALOG.ALL_COURSES_MAP) {
            for (const k of cKeys) {
                if (global.PLANNER_CATALOG.ALL_COURSES_MAP[k]) {
                    return { ...global.PLANNER_CATALOG.ALL_COURSES_MAP[k] };
                }
            }
        }

        // 4. Global gameState
        if (global.gameState && global.gameState.courses) {
            for (const k of cKeys) {
                if (global.gameState.courses[k]) {
                    return { ...global.gameState.courses[k] };
                }
            }
        }

        // 5. CHEESEFORK_DB
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
        }

        return null;
    }

    function handleCourseDrop(data, targetSemester) {
        if (!customPlan) return;

        const targetSemObj = customPlan.find(s => s.semester === targetSemester);
        if (!targetSemObj) return;

        let courseObj = null;
        let sourceSemester = null;

        if (data.type === 'semester-course') {
            sourceSemester = data.sourceSemester;
            if (sourceSemester === targetSemester) return; // Same column, no-op

            const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
            if (!sourceSemObj) return;

            const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
                const keys = getNormalizedCodes(c.code, c.altCode);
                return keys.includes(data.code);
            });
            if (courseIdx === -1) return;
            courseObj = sourceSemObj.courses[courseIdx];

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן להזזה.`);
                return;
            }
        } else {
            courseObj = resolveCourseObject(data.code);

            if (!courseObj) {
                console.warn('[Planner] Could not resolve course for drop:', data.code);
                return;
            }

            if (isCourseCompleted(courseObj.code, courseObj.altCode)) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר הושלם ואינו ניתן לשיבוץ חוזר.`);
                return;
            }

            // Check if already placed in plan
            const cKeys = new Set(getNormalizedCodes(courseObj.code, courseObj.altCode));
            const alreadyInPlan = customPlan.some(s => (s.courses || []).some(c => {
                const placedKeys = getNormalizedCodes(c.code, c.altCode);
                return placedKeys.some(k => cKeys.has(k));
            }));
            if (alreadyInPlan) {
                showPlannerToast(`הקורס "${courseObj.name}" כבר משובץ בתוכנית.`);
                return;
            }
        }

        if (!courseObj) return;

        // Build temporary map excluding moving course
        const activeCourseMap = buildCourseSemesterMap(customPlan);
        if (sourceSemester !== null) {
            getNormalizedCodes(courseObj.code, courseObj.altCode).forEach(k => {
                delete activeCourseMap[k];
            });
        }

        // === PREREQUISITE & TERM OFFERING VALIDATION ===
        const prereqStatus = checkPrerequisites(courseObj, targetSemester, activeCourseMap);
        const dependentViolations = getDownstreamDependentViolations(courseObj, targetSemester, customPlan);
        const isWinter = (targetSemester % 2 === 1 && !targetSemObj.isSummer);
        const isSpring = (targetSemester % 2 === 0 && !targetSemObj.isSummer);
        const isSummer = targetSemObj.isSummer || targetSemObj.type === 'summer';
        const isIntl = !!(global.gameState && global.gameState.isInternationalStudent);

        const termInfo = global.PLANNER_CATALOG && global.PLANNER_CATALOG.COURSE_TERM_OFFERINGS 
            ? (global.PLANNER_CATALOG.COURSE_TERM_OFFERINGS[courseObj.code] || (courseObj.altCode && global.PLANNER_CATALOG.COURSE_TERM_OFFERINGS[courseObj.altCode]))
            : null;

        const violations = [];
        if (!prereqStatus.valid) {
            violations.push({
                type: 'prereqs',
                title: 'חסימת קדם: דרישות קדם טרם הושלמו',
                message: `לא ניתן לשבץ את "${courseObj.name}" בסמסטר ${targetSemester} לפני קורסי הקדם שלו: ${prereqStatus.missing.join(', ')}`,
                codes: prereqStatus.missingCodes
            });
        }

        if (dependentViolations.length > 0) {
            const depList = dependentViolations.map(d => `• ${d.dependentCourse.name} (${d.dependentCourse.code}) בסמסטר ${d.dependentSemester}`).join('\n');
            violations.push({
                type: 'dependent_violation',
                title: 'חסימת הזזה: קורס המשך תלוי בקורס זה כקדם',
                message: `לא ניתן להעביר את "${courseObj.name}" לסמסטר ${targetSemester} מכיוון שקורסים הבאים תלויים בו כקדם ומשובצים בסמסטר מוקדם או זהה:\n${depList}`
            });
        }

        if (termInfo && termInfo.terms) {
            let termAllowed = false;
            if (isWinter && (termInfo.terms.includes('winter') || (isIntl && termInfo.terms.includes('winter_intl')))) termAllowed = true;
            if (isSpring && termInfo.terms.includes('spring')) termAllowed = true;
            if (isSummer && termInfo.terms.includes('summer')) termAllowed = true;
            if (termInfo.terms.includes('both')) termAllowed = true;

            if (!termAllowed) {
                violations.push({
                    type: 'term',
                    title: 'הגבלת מועד קורס (קורס חד-שנתי)',
                    message: `הקורס "${courseObj.name}" ${termInfo.note || 'אינו מוצע בסמסטר זה'}.`
                });
            }
        }

        // Summer semester availability verification
        if (isSummer) {
            const summerCheck = global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSummer
                ? global.PLANNER_CATALOG.isCourseOfferedInSummer(courseObj.code, courseObj)
                : { offered: true, note: '' };
            if (!summerCheck.offered) {
                if (!violations.some(v => v.type === 'term' || v.type === 'summer_offering')) {
                    violations.push({
                        type: 'summer_offering',
                        title: 'קורס אינו מוצע בסמסטר קיץ ☀️',
                        message: `הקורס "${courseObj.name}" (${courseObj.code}) אינו נפתח בסמסטר קיץ בטכניון (${summerCheck.note}).`
                    });
                }
            }
        }

        const applyPlacement = (hasOverride = false) => {
            if (data.type === 'semester-course') {
                const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
                const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
                    const keys = getNormalizedCodes(c.code, c.altCode);
                    return keys.includes(data.code);
                });
                if (courseIdx !== -1) {
                    const [moved] = sourceSemObj.courses.splice(courseIdx, 1);
                    if (sourceSemester !== null && sourceSemester !== targetSemester) {
                        moved.movedFromSemester = sourceSemester;
                    }
                    if (hasOverride) moved.hasOverride = true;
                    checkAndApplySeasonalCode(moved, targetSemester, targetSemObj);
                    if (!targetSemObj.courses) targetSemObj.courses = [];
                    targetSemObj.courses.push(moved);
                }
            } else {
                const newCourse = { ...courseObj };
                if (hasOverride) newCourse.hasOverride = true;
                checkAndApplySeasonalCode(newCourse, targetSemester, targetSemObj);
                if (!targetSemObj.courses) targetSemObj.courses = [];
                targetSemObj.courses.push(newCourse);
                const cKeys = new Set(getNormalizedCodes(data.code, data.code));
                unassignedCourses = unassignedCourses.filter(c => {
                    const uKeys = getNormalizedCodes(c.code, c.altCode);
                    return !uKeys.some(k => cKeys.has(k));
                });
            }

            syncCourseToGameState(courseObj, targetSemester);
            saveCustomPlan();
            renderDegreePlanner();
            if (typeof window.renderUI === 'function') window.renderUI();
            if (hasOverride) {
                showPlannerToast(`אושר שיבוץ חריג עבור "${courseObj.name}" בסמסטר ${targetSemester} ⚡`, false);
            }
        };

        if (violations.length > 0) {
            const isStrictBlocked = violations.some(v => v.type === 'prereqs' || v.type === 'dependent_violation' || v.type === 'term' || v.type === 'summer_offering');
            highlightMissingPrerequisites(
                prereqStatus.missingCodes || [],
                isStrictBlocked 
                    ? `❌ חסימת שיבוץ: לא ניתן לשבץ את הקורס בסמסטר זה!`
                    : `התראת שיבוץ עבור "${courseObj.name}" בסמסטר ${targetSemester}`,
                targetSemester
            );
            openCoursePlacementGuardModal(courseObj, targetSemester, sourceSemester, data, violations, isStrictBlocked ? null : applyPlacement);
            return;
        }

        applyPlacement(false);
    }

    function handleSidebarDrop(data) {
        if (!customPlan) return;
        if (data.type !== 'semester-course') return;

        const sourceSemester = data.sourceSemester;
        const sourceSemObj = customPlan.find(s => s.semester === sourceSemester);
        if (!sourceSemObj) return;

        const courseIdx = (sourceSemObj.courses || []).findIndex(c => {
            const keys = getNormalizedCodes(c.code, c.altCode);
            return keys.includes(data.code);
        });
        if (courseIdx === -1) return;

        const course = sourceSemObj.courses[courseIdx];
        if (isCourseCompleted(course.code, course.altCode)) {
            showPlannerToast(`הקורס "${course.name}" כבר הושלם ואינו ניתן להסרה.`);
            return;
        }

        const [removedCourse] = sourceSemObj.courses.splice(courseIdx, 1);
        const remKeys = new Set(getNormalizedCodes(removedCourse.code, removedCourse.altCode));
        if (!unassignedCourses.some(c => {
            const uKeys = getNormalizedCodes(c.code, c.altCode);
            return uKeys.some(k => remKeys.has(k));
        })) {
            unassignedCourses.push(removedCourse);
        }

        // Synchronize removal to Course Tree (gameState.courses)
        syncCourseToGameState(removedCourse, 0);

        saveCustomPlan();
        renderDegreePlanner();
        showPlannerToast(`הקורס "${removedCourse.name}" הוסר מהתכנון והועבר לרשימת הקורסים שלא שובצו.`);
    }

    // Interactive Non-Blocking Semester Selector Modal
    function promptAddCourseToSemester(code) {
        const course = resolveCourseObject(code);

        if (!course || !customPlan) return;

        // Check completion
        if (isCourseCompleted(course.code, course.altCode)) {
            showPlannerToast(`הקורס "${course.name}" כבר הושלם ואינו ניתן לשיבוץ חוזר.`);
            return;
        }

        const existingModal = document.getElementById('planner-sem-picker-modal');
        if (existingModal) existingModal.remove();

        const activeMap = buildCourseSemesterMap(customPlan);

        const modal = document.createElement('div');
        modal.id = 'planner-sem-picker-modal';
        modal.className = 'modal-backdrop active';
        modal.style.zIndex = '999999';

        const semButtons = customPlan.map(s => {
            const semNum = s.semester;
            const isSummer = s.isSummer === true || s.type === 'summer';
            const semTitle = isSummer ? (s.title || (s.yearLabel ? `סמסטר קיץ ${s.yearLabel} ☀️` : 'סמסטר קיץ ☀️')) : `סמסטר ${semNum}`;
            const prereqCheck = checkPrerequisites(course, semNum, activeMap);
            const isValidPrereq = prereqCheck.valid;
            const depViolations = getDownstreamDependentViolations(course, semNum, customPlan);
            const isValidDep = depViolations.length === 0;
            const summerCheck = isSummer && global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSummer
                ? global.PLANNER_CATALOG.isCourseOfferedInSummer(course.code, course)
                : { offered: true, note: '' };
            const isSummerBlocked = isSummer && !summerCheck.offered;
            const isIntl = !!(global.gameState && global.gameState.isInternationalStudent);
            const termCheck = (global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSemester)
                ? global.PLANNER_CATALOG.isCourseOfferedInSemester(course.code, course, semNum, isIntl)
                : { offered: true, note: '' };
            const isTermBlocked = !termCheck.offered;

            const isValid = isValidPrereq && isValidDep && !isSummerBlocked && !isTermBlocked;

            let statusText = '✓ זמין לשיבוץ';
            let statusColor = '#34d399';
            if (!isValidPrereq) {
                statusText = '⛔ חסום (קדמים חסרים)';
                statusColor = '#ef4444';
            } else if (!isValidDep) {
                statusText = '⛔ חסום (קורס המשך)';
                statusColor = '#ef4444';
            } else if (isSummerBlocked) {
                statusText = '⛔ לא מוצע בקיץ';
                statusColor = '#ef4444';
            } else if (isTermBlocked) {
                statusText = '⛔ לא מוצע בסמסטר זה';
                statusColor = '#ef4444';
            }

            const isStrictlyBlocked = !isValidPrereq || !isValidDep || isSummerBlocked || isTermBlocked;

            return `
                <button type="button" class="btn btn-outline sem-choice-btn" data-semester="${semNum}" ${isStrictlyBlocked ? 'disabled="disabled"' : ''} style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; border-radius: 8px; border: 1px solid ${isValid ? 'rgba(56, 189, 248, 0.35)' : 'rgba(239, 68, 68, 0.35)'}; background: ${isValid ? 'rgba(15, 23, 42, 0.7)' : 'rgba(239, 68, 68, 0.08)'}; cursor: ${isStrictlyBlocked ? 'not-allowed' : 'pointer'}; opacity: ${isStrictlyBlocked ? '0.45' : '1'}; transition: all 0.15s ease;">
                    <span style="font-weight: 700; color: #f8fafc; font-size: 0.95rem;">${escapeHtml(semTitle)}</span>
                    <span style="font-size: 0.72rem; color: ${statusColor}; margin-top: 4px; font-weight: 600;">${statusText}</span>
                </button>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 480px; width: 90%; background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                    <h3 style="font-size: 1.05rem; color: #f8fafc; margin: 0;">שיבוץ קורס: ${escapeHtml(course.name)}</h3>
                    <button type="button" class="btn-close-picker" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;">✕</button>
                </div>
                <p style="font-size: 0.80rem; color: #cbd5e1; margin-bottom: 14px; line-height: 1.4;">
                    בחר את הסמסטר הרצוי לשיבוץ הקורס (${course.credits} נק״ז):
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                    ${semButtons}
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary btn-close-picker">ביטול</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelectorAll('.btn-close-picker').forEach(b => b.addEventListener('click', closeModal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        modal.querySelectorAll('.sem-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;
                const chosenSem = parseFloat(btn.getAttribute('data-semester'));
                closeModal();
                handleCourseDrop({ type: 'pool-elective', code: course.code }, chosenSem);
            });
        });
    }

    // --------------------------------------------------------------------------
    // Public API
    // --------------------------------------------------------------------------
    global.DegreePlanner = {
        saveCustomPlan: saveCustomPlan,
        openSportClubSelectorModal: openSportClubSelectorModal,
        init: initPlannerState,
        renderDegreePlanner: renderDegreePlanner,
        evaluateDegreeRules: evaluateDegreeRules,
        getCustomPlan: () => customPlan,
        getUnassignedCourses: () => unassignedCourses,
        resetPlanToSuggested: resetPlanToSuggested,
        checkPrerequisites: checkPrerequisites,
        isCourseCompleted: isCourseCompleted,
        getCourseGrade: getCourseGrade,
        adoptPlanFromState: function(plan, unassigned) {
            const isAdir = isAdirAuthenticated();
            function isAdirPlan(p) {
                if (!p || !Array.isArray(p) || p.length === 0) return false;
                const sem1 = p.find(s => s.semester === 1);
                if (!sem1 || !Array.isArray(sem1.courses)) return false;
                const hasPhysics1 = sem1.courses.some(c => c.code === '01140051' || c.code === '114051' || c.altCode === '114051');
                const hasPython = sem1.courses.some(c => c.code === '02340128' || c.code === '234128' || c.altCode === '234128');
                return hasPython && !hasPhysics1 && sem1.courses.length <= 4;
            }

            if (Array.isArray(plan) && plan.length > 0 && (isAdir || !isAdirPlan(plan))) {
                customPlan = JSON.parse(JSON.stringify(plan));
                unassignedCourses = Array.isArray(unassigned) ? JSON.parse(JSON.stringify(unassigned)) : [];
                if (customPlan) {
                    customPlan.forEach(sem => {
                        sem.courses = (sem.courses || []).filter(c => !isPurgedCourse(c.code, c.altCode));
                    });
                }
                if (unassignedCourses) {
                    unassignedCourses = unassignedCourses.filter(c => !isPurgedCourse(c.code, c.altCode));
                }
                syncCompletedCoursesFromGameState();
                saveCustomPlan(true);
                renderDegreePlanner();
            } else if (!isAdir) {
                this.resetToCleanSyllabus();
            }
        },
        resetToCleanSyllabus: function() {
            if (!global.PLANNER_CATALOG) return;
            const targetSyllabus = getSuggestedCatalogForTrack(selectedTrack);
            customPlan = JSON.parse(JSON.stringify(targetSyllabus || global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS));
            unassignedCourses = [];
            syncCompletedCoursesFromGameState();
            saveCustomPlan(true);
            renderDegreePlanner();
        },
        syncFromGameState: () => {
            initPlannerState(true);
            renderDegreePlanner();
        },
        syncPlannerToTree: syncPlannerToTree,
        syncTreeToPlanner: () => {
            syncAllCoursesFromGameState();
            saveCustomPlan(true);
            renderDegreePlanner();
        },
        removeCourse: (code) => {
            if (!code) return;
            const keys = new Set(getNormalizedCodes(code, code));
            if (customPlan) {
                customPlan.forEach(sem => {
                    sem.courses = (sem.courses || []).filter(c => {
                        const cKeys = getNormalizedCodes(c.code, c.altCode);
                        return !cKeys.some(k => keys.has(k));
                    });
                });
            }
            if (unassignedCourses) {
                unassignedCourses = unassignedCourses.filter(c => {
                    const uKeys = getNormalizedCodes(c.code, c.altCode);
                    return !uKeys.some(k => keys.has(k));
                });
            }
            saveCustomPlan(true);
            renderDegreePlanner();
        },
        setCourseSemester: function(code, targetSemester) {
            if (!code) return false;
            if (!customPlan) initPlannerState();
            let semNum = parseFloat(targetSemester);
            if (isNaN(semNum) || semNum < 1) return false;
            if (semNum === 9) semNum = 2.5;

            const cKeys = new Set(getNormalizedCodes(code, code));
            let foundCourse = null;

            // 1. Remove from wherever it was in customPlan
            customPlan.forEach(sem => {
                sem.courses = (sem.courses || []).filter(x => {
                    const xKeys = getNormalizedCodes(x.code, x.altCode);
                    if (xKeys.some(k => cKeys.has(k))) {
                        foundCourse = x;
                        return false;
                    }
                    return true;
                });
            });

            // 2. Remove from unassignedCourses if present
            if (unassignedCourses) {
                unassignedCourses = unassignedCourses.filter(u => {
                    const uKeys = getNormalizedCodes(u.code, u.altCode);
                    if (uKeys.some(k => cKeys.has(k))) {
                        if (!foundCourse) foundCourse = u;
                        return false;
                    }
                    return true;
                });
            }

            // If not found in customPlan, reconstruct from resolveCourseObject, gameState or catalog
            if (!foundCourse) {
                foundCourse = resolveCourseObject(code);
            }
            if (!foundCourse) {
                const fromState = global.gameState && global.gameState.courses && (global.gameState.courses[code] || global.gameState.courses[code.replace(/^0+/, '')]);
                if (fromState) {
                    foundCourse = {
                        code: fromState.code,
                        altCode: fromState.altCode || fromState.code,
                        name: fromState.name,
                        credits: fromState.credits,
                        type: fromState.type || 'elective',
                        prereqs: fromState.prerequisites || []
                    };
                } else if (global.PLANNER_CATALOG && global.PLANNER_CATALOG.ALL_COURSES_MAP) {
                    const cat = global.PLANNER_CATALOG.ALL_COURSES_MAP[code] || global.PLANNER_CATALOG.ALL_COURSES_MAP[code.replace(/^0+/, '')];
                    if (cat) foundCourse = { ...cat };
                }
            }

            if (!foundCourse) {
                console.warn('[DegreePlanner.setCourseSemester] Course could not be resolved:', code);
                return false;
            }

            // Strict prerequisite and dependent validation
            const activeMap = buildCourseSemesterMap(customPlan);
            const prereqCheck = checkPrerequisites(foundCourse, semNum, activeMap);
            if (!prereqCheck.valid) {
                console.warn(`[DegreePlanner.setCourseSemester] Prerequisite validation failed for ${foundCourse.name}:`, prereqCheck.missing);
                if (typeof showPlannerToast === 'function') {
                    showPlannerToast(`❌ לא ניתן לשבץ את "${foundCourse.name}" בסמסטר ${semNum}: קורסי קדם חסרים (${prereqCheck.missing.join(', ')})`, true);
                }
                saveCustomPlan(true);
                return false;
            }
            const depViolations = getDownstreamDependentViolations(foundCourse, semNum, customPlan);
            if (depViolations.length > 0) {
                const dep = depViolations[0];
                console.warn(`[DegreePlanner.setCourseSemester] Dependent course violation for ${foundCourse.name}:`, dep);
                if (typeof showPlannerToast === 'function') {
                    showPlannerToast(`❌ לא ניתן להעביר את "${foundCourse.name}" לסמסטר ${semNum}: הקורס "${dep.dependentCourse.name}" משובץ בסמסטר ${dep.dependentSemester} ותלוי בו כקדם!`, true);
                }
                saveCustomPlan(true);
                return false;
            }

            // Term and summer offering validation
            const isIntl = !!(global.gameState && global.gameState.isInternationalStudent);
            if (global.PLANNER_CATALOG && typeof global.PLANNER_CATALOG.isCourseOfferedInSemester === 'function') {
                const termCheck = global.PLANNER_CATALOG.isCourseOfferedInSemester(foundCourse.code, foundCourse, semNum, isIntl);
                if (!termCheck.offered) {
                    console.warn(`[DegreePlanner.setCourseSemester] Term restriction violation for ${foundCourse.name}:`, termCheck.note);
                    if (typeof showPlannerToast === 'function') {
                        showPlannerToast(`❌ לא ניתן לשבץ את "${foundCourse.name}" בסמסטר ${semNum}: ${termCheck.note || 'הקורס אינו מוצע בסמסטר זה'}`, true);
                    }
                    saveCustomPlan(true);
                    return false;
                }
            }

            let targetSemObj = customPlan.find(s => s.semester === semNum);
            if (!targetSemObj) {
                const isSummer = semNum % 1 !== 0;
                const yearNum = Math.ceil(semNum / 2);
                const hebrewYears = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳'];
                const yearLabel = hebrewYears[yearNum - 1] || `${yearNum}`;
                targetSemObj = {
                    semester: semNum,
                    label: isSummer ? `שנה ${yearLabel} - סמסטר קיץ ☀️` : `סמסטר ${semNum}`,
                    title: isSummer ? `סמסטר קיץ ${yearLabel}` : `סמסטר ${semNum}`,
                    isSummer: isSummer,
                    courses: []
                };
                customPlan.push(targetSemObj);
                const getSemOrder = (s) => (s === 9 ? 2.5 : Number(s) || 1);
                customPlan.sort((a, b) => getSemOrder(a.semester) - getSemOrder(b.semester));
            }
            targetSemObj.courses = targetSemObj.courses || [];
            targetSemObj.courses.push(foundCourse);

            // 3. Update in gameState.courses
            syncCourseToGameState(foundCourse, semNum);

            // 4. Save and re-render
            saveCustomPlan(true);
            if (typeof global.saveState === 'function') {
                global.saveState(true);
            }
            renderDegreePlanner();
            if (typeof syncPlannerToTree === 'function') {
                syncPlannerToTree(false);
            }
            if (typeof global.renderFlowchartTree === 'function') {
                global.renderFlowchartTree();
            }
            if (typeof global.renderUI === 'function') {
                global.renderUI();
            }
            if (typeof global.notifyStateChanged === 'function') {
                global.notifyStateChanged({ source: 'planner' });
            }
            return true;
        },
        calculateCourseWorkload: calculateCourseWorkload,
        calculateSemesterWorkload: calculateSemesterWorkload,
        setCourseUserWorkload: setCourseUserWorkload,
        getCourseUserWorkload: getCourseUserWorkload,
        isCourseOfferedInSummer: (code, obj) => {
            return global.PLANNER_CATALOG && global.PLANNER_CATALOG.isCourseOfferedInSummer
                ? global.PLANNER_CATALOG.isCourseOfferedInSummer(code, obj)
                : { offered: true, note: '' };
        }
    };

    // --------------------------------------------------------------------------
    // Seasonal Code Adaptation & Course Placement Guard
    // --------------------------------------------------------------------------
    function checkAndApplySeasonalCode(course, targetSemesterNum, targetSemObj) {
        if (!global.PLANNER_CATALOG || !global.PLANNER_CATALOG.SEASONAL_COURSE_MAPPINGS) return;
        const sm = global.PLANNER_CATALOG.SEASONAL_COURSE_MAPPINGS;
        const entry = sm[course.code] || (course.altCode && sm[course.altCode]);
        if (!entry) return;

        const isWinter = targetSemesterNum % 2 === 1 && !targetSemObj.isSummer;
        const isSpring = targetSemesterNum % 2 === 0 && !targetSemObj.isSummer;

        if (isWinter && entry.winter && course.code !== entry.winter) {
            course.code = entry.winter;
            if (entry.altWinter) course.altCode = entry.altWinter;
            showPlannerToast(`קוד הקורס הותאם לסמסטר חורף: ${entry.winter}`, false);
        } else if (isSpring && entry.spring && course.code !== entry.spring) {
            course.code = entry.spring;
            if (entry.altSpring) course.altCode = entry.altSpring;
            showPlannerToast(`קוד הקורס הותאם לסמסטר אביב: ${entry.spring}`, false);
        }
    }

    function openCoursePlacementGuardModal(courseObj, targetSemester, sourceSemester, data, violations, onConfirmPlacement) {
        let modal = document.getElementById('planner-placement-guard-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'planner-placement-guard-modal';
            modal.className = 'modal-backdrop';
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(10, 15, 29, 0.85); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 10000;';
            document.body.appendChild(modal);
        }

        const isStrictBlocked = violations.some(v => v.type === 'prereqs' || v.type === 'dependent_violation' || v.type === 'term' || v.type === 'summer_offering') || !onConfirmPlacement;

        const violationItemsHtml = violations.map(v => `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 6px; padding: 10px 12px; margin-bottom: 8px;">
                <div style="color: #f87171; font-weight: bold; font-size: 0.85rem; margin-bottom: 3px;">⛔ ${escapeHtml(v.title)}</div>
                <div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.4; white-space: pre-line;">${escapeHtml(v.message)}</div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-card" style="background: #161c2e; border: 1px solid ${isStrictBlocked ? '#ef4444' : '#334155'}; border-radius: 12px; padding: 22px; width: 90%; max-width: 480px; direction: rtl; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <span style="font-size: 1.4rem;">${isStrictBlocked ? '⛔' : '⚠️'}</span>
                    <h3 style="margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 700;">${isStrictBlocked ? 'חסימת שיבוץ קורס' : 'התראת שיבוץ קורס'}: ${escapeHtml(courseObj.name)}</h3>
                </div>
                <div style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 14px;">
                    ניסית לשבץ את הקורס ב<strong>סמסטר ${targetSemester}</strong>, אך התגלו המגבלות הבאות:
                </div>
                <div style="margin-bottom: 18px;">
                    ${violationItemsHtml}
                </div>
                ${isStrictBlocked ? `
                    <div style="background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.5); border-radius: 8px; padding: 10px 12px; margin-bottom: 14px; text-align: center;">
                        <div style="color: #f87171; font-weight: 800; font-size: 0.88rem; margin-bottom: 2px;">⛔ שיבוץ זה אינו מורשה</div>
                        <div style="color: #fecaca; font-size: 0.80rem;">אין אפשרות לשבץ קורס בסמסטר שאינו מוצע בו או לפני קורסי הקדם שלו.</div>
                    </div>
                    <button type="button" id="btn-guard-cancel" style="background: #2563eb; border: none; color: #ffffff; padding: 10px 16px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; cursor: pointer; width: 100%; transition: all 0.15s ease;">
                        ✕ הבנתי, בטל פעולה והשאר את הקורס במקומו
                    </button>
                ` : `
                    <div style="font-size: 0.82rem; color: #f1f5f9; font-weight: 600; margin-bottom: 12px;">
                        מה ברצונך לעשות?
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <button type="button" id="btn-guard-override" style="background: rgba(251, 191, 36, 0.2); border: 1px solid #fbbf24; color: #fbbf24; padding: 9px 14px; border-radius: 6px; font-weight: bold; font-size: 0.85rem; cursor: pointer; text-align: right; transition: all 0.15s ease;">
                            ⚡ שבץ בכל זאת (אישור חריג)
                        </button>
                        <button type="button" id="btn-guard-cancel" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; padding: 9px 14px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; text-align: right; transition: all 0.15s ease;">
                            ✕ בטל פעולה והשאר את הקורס במקומו
                        </button>
                    </div>
                `}
            </div>
        `;

        modal.style.display = 'flex';

        const overrideBtn = document.getElementById('btn-guard-override');
        if (overrideBtn) {
            overrideBtn.onclick = () => {
                modal.style.display = 'none';
                if (typeof onConfirmPlacement === 'function') onConfirmPlacement(true);
            };
        }
        document.getElementById('btn-guard-cancel').onclick = () => {
            modal.style.display = 'none';
        };
    }

    function migratePlanToTrack(newTrack) {
        const newSyllabus = getSuggestedSyllabusForTrack(newTrack);
        if (!newSyllabus || !customPlan) return;

        const placedKeys = new Set();
        customPlan.forEach(s => {
            (s.courses || []).forEach(c => {
                getNormalizedCodes(c.code, c.altCode).forEach(k => placedKeys.add(k));
            });
        });
        unassignedCourses.forEach(c => {
            getNormalizedCodes(c.code, c.altCode).forEach(k => placedKeys.add(k));
        });

        newSyllabus.forEach(sem => {
            (sem.courses || []).forEach(sc => {
                const scKeys = getNormalizedCodes(sc.code, sc.altCode);
                const isAlreadyPresent = scKeys.some(k => placedKeys.has(k));
                if (!isAlreadyPresent && !isPurgedCourse(sc.code, sc.altCode)) {
                    unassignedCourses.push({ ...sc });
                    scKeys.forEach(k => placedKeys.add(k));
                }
            });
        });

        saveCustomPlan();
        if (typeof global.saveState === 'function') global.saveState(true);
    }

    // Global Action Helpers for UI Interaction
    global.addSummerSemesterAfter = function(afterSemesterNum) {
        if (!customPlan) initPlannerState();
        if (!customPlan) return;
        const afterIdx = customPlan.findIndex(s => s.semester === afterSemesterNum);
        if (afterIdx === -1) return;

        const nextSem = customPlan[afterIdx + 1];
        if (nextSem && (nextSem.isSummer || nextSem.type === 'summer')) {
            showPlannerToast('כבר קיים סמסטר קיץ לאחר סמסטר זה!');
            return;
        }

        const yearNumber = Math.ceil(afterSemesterNum / 2);
        const hebrewLetters = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳'];
        const yearLabel = hebrewLetters[yearNumber - 1] || `${yearNumber}`;

        const newSummerSem = {
            semester: afterSemesterNum + 0.5,
            isSummer: true,
            type: 'summer',
            yearLabel: yearLabel,
            title: `סמסטר קיץ ${yearLabel}`,
            targetCredits: 10.0,
            courses: []
        };

        customPlan.splice(afterIdx + 1, 0, newSummerSem);
        saveCustomPlan(true);
        renderDegreePlanner();
        if (typeof syncPlannerToTree === 'function') syncPlannerToTree(false);
        if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
        if (typeof global.renderUI === 'function') global.renderUI();
        if (typeof global.notifyStateChanged === 'function') {
            global.notifyStateChanged({ source: 'planner' });
        }
        showPlannerToast(`סמסטר קיץ ${yearLabel} נוסף בהצלחה! ☀️`, false);
    };

    global.deleteSemester = function(semNum) {
        if (!customPlan) initPlannerState();
        if (!customPlan) return;
        const semIdx = customPlan.findIndex(s => s.semester === semNum);
        if (semIdx === -1) return;
        const sem = customPlan[semIdx];
        const isSummer = sem.isSummer === true || sem.type === 'summer';
        const semTitle = sem.title || (isSummer ? `סמסטר קיץ ${sem.yearLabel || ''}` : `סמסטר ${semNum}`);
        const courseCount = (sem.courses || []).length;

        if (customPlan.length <= 1) {
            showPlannerToast('לא ניתן להסיר את כל הסמסטרים מתכנון התואר.', true);
            return;
        }

        const confirmMsg = courseCount > 0
            ? `האם להסיר את ${semTitle}? ${courseCount} קורסים ששובצו בו יועברו חזרה לרשימת הקורסים שלא שובצו.`
            : `האם להסיר את ${semTitle} מתכנון התואר?`;

        if (!confirm(confirmMsg)) {
            return;
        }

        if (sem.courses && sem.courses.length > 0) {
            sem.courses.forEach(c => {
                const cKeys = getNormalizedCodes(c.code, c.altCode);
                const alreadyInUnassigned = unassignedCourses.some(u => {
                    const uKeys = getNormalizedCodes(u.code, u.altCode);
                    return uKeys.some(k => cKeys.includes(k));
                });
                if (!alreadyInUnassigned) {
                    unassignedCourses.push({ ...c });
                }
            });
        }

        customPlan.splice(semIdx, 1);
        saveCustomPlan(true);
        renderDegreePlanner();
        if (typeof syncPlannerToTree === 'function') syncPlannerToTree(false);
        if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
        if (typeof global.renderUI === 'function') global.renderUI();
        if (typeof global.notifyStateChanged === 'function') {
            global.notifyStateChanged({ source: 'planner' });
        }
        showPlannerToast(`${semTitle} הוסר בהצלחה.`, false);
        const mgrOverlay = document.getElementById('planner-semesters-mgr-modal-overlay');
        if (mgrOverlay && mgrOverlay.classList.contains('active')) {
            openSemesterManagerModal();
        }
    };

    global.deleteSummerSemester = global.deleteSemester;

    global.addNewSemester = function() {
        if (!customPlan) initPlannerState();
        if (!customPlan) return;

        let maxSem = 0;
        customPlan.forEach(s => {
            if (!s.isSummer && s.type !== 'summer' && Number.isInteger(s.semester)) {
                if (s.semester > maxSem) maxSem = s.semester;
            }
        });
        const nextSemNum = maxSem + 1;

        const newSem = {
            semester: nextSemNum,
            isSummer: false,
            title: `סמסטר ${nextSemNum}`,
            targetCredits: 20.0,
            courses: []
        };

        customPlan.push(newSem);
        saveCustomPlan(true);
        renderDegreePlanner();
        if (typeof syncPlannerToTree === 'function') syncPlannerToTree(false);
        if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
        if (typeof global.renderUI === 'function') global.renderUI();
        if (typeof global.notifyStateChanged === 'function') {
            global.notifyStateChanged({ source: 'planner' });
        }
        showPlannerToast(`סמסטר ${nextSemNum} נוסף בהצלחה לתכנון התואר! ➕`, false);

        setTimeout(() => {
            const container = document.getElementById('planner-semesters-container');
            if (container) {
                container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
            }
        }, 80);
    };

    function openSemesterManagerModal() {
        const overlay = document.getElementById('planner-semesters-mgr-modal-overlay');
        if (!overlay) return;
        overlay.classList.add('active');

        const plan = getActivePlan();
        let maxReg = 0;
        plan.forEach(s => {
            if (!s.isSummer && s.type !== 'summer' && Number.isInteger(s.semester)) {
                if (s.semester > maxReg) maxReg = s.semester;
            }
        });
        const nextSemNum = maxReg + 1;
        const nextLabelEl = document.getElementById('txt-mgr-next-sem-label');
        if (nextLabelEl) nextLabelEl.textContent = `סמסטר ${nextSemNum} רגיל לתואר`;

        // Populate removable list
        const listEl = document.getElementById('sem-mgr-removable-list');
        if (listEl) {
            let html = '';
            // Display semesters in reverse order so latest/added semesters appear first
            const reversed = [...plan].reverse();
            reversed.forEach(s => {
                const semNum = s.semester;
                const isSummer = s.isSummer === true || s.type === 'summer';
                const semTitle = isSummer ? (s.title || (s.yearLabel ? `סמסטר קיץ ${s.yearLabel} ☀️` : 'סמסטר קיץ ☀️')) : `סמסטר ${semNum}`;
                const courseCount = (s.courses || []).length;
                let cr = 0;
                (s.courses || []).forEach(c => cr += Number(c.credits) || 0);

                html += `
                    <div class="sem-mgr-row">
                        <div>
                            <div style="font-weight: 700; color: #f8fafc; font-size: 0.86rem; display: flex; align-items: center; gap: 6px;">
                                ${isSummer ? '<span>☀️</span>' : '<span>📅</span>'}
                                <span>${escapeHtml(semTitle)}</span>
                            </div>
                            <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                                ${courseCount > 0 ? `<span style="color: #38bdf8; font-weight: 600;">${courseCount} קורסים</span> • ${cr.toFixed(1)} נק״ז` : '<span style="color: #10b981;">ריק (0 קורסים)</span>'}
                            </div>
                        </div>
                        <button type="button" class="btn-sem-mgr-delete" onclick="window.deleteSemester(${semNum})">
                            🗑️ הסר סמסטר
                        </button>
                    </div>
                `;
            });
            listEl.innerHTML = html;
        }

        if (!overlay._isBound) {
            overlay._isBound = true;
            const btnClose = document.getElementById('btn-close-sem-mgr-modal');
            const close = () => overlay.classList.remove('active');
            if (btnClose) btnClose.onclick = close;
            overlay.onclick = (e) => {
                if (e.target === overlay) close();
            };

            const btnAddReg = document.getElementById('btn-mgr-add-regular-sem');
            if (btnAddReg) {
                btnAddReg.onclick = () => {
                    global.addNewSemester();
                    openSemesterManagerModal();
                };
            }

            const btnAddSummer = document.getElementById('btn-mgr-add-summer-sem');
            if (btnAddSummer) {
                btnAddSummer.onclick = () => {
                    let highestEven = 2;
                    (customPlan || []).forEach(s => {
                        if (!s.isSummer && s.type !== 'summer' && s.semester % 2 === 0 && s.semester > highestEven) {
                            highestEven = s.semester;
                        }
                    });
                    if (typeof global.addNewSummerSemester === 'function') {
                        global.addNewSummerSemester(highestEven);
                    }
                    openSemesterManagerModal();
                };
            }
        }
    }
    global.openSemesterManagerModal = openSemesterManagerModal;

    global.handlePhysicsVariantSelect = function(currentCode, selectedCode, event) {
        if (event) event.stopPropagation();
        if (!customPlan) return;
        let foundCourse = null;

        for (let sem of customPlan) {
            for (let c of (sem.courses || [])) {
                const keys = getNormalizedCodes(c.code, c.altCode);
                if (keys.includes(currentCode)) {
                    foundCourse = c;
                    break;
                }
            }
            if (foundCourse) break;
        }

        if (!foundCourse) {
            foundCourse = unassignedCourses.find(c => getNormalizedCodes(c.code, c.altCode).includes(currentCode));
        }

        if (!foundCourse) return;

        const variantMeta = {
            '01140051': { name: 'פיזיקה 1', credits: 2.5, altCode: '114051' },
            '01140071': { name: "פיזיקה 1מ'", credits: 3.5, altCode: '114071' },
            '01140077': { name: "פיזיקה 1פ'", credits: 4.0, altCode: '114077' },
            '01140055': { name: "פיזיקה 1ת'", credits: 3.5, altCode: '114055' },
            '01140052': { name: 'פיזיקה 2', credits: 3.5, altCode: '114052' },
            '01140075': { name: "פיזיקה 2מ'", credits: 5.0, altCode: '114075' },
            '01140078': { name: "פיזיקה 2פ'", credits: 5.0, altCode: '114078' },
            '01140076': { name: "פיזיקה 2ת'", credits: 5.0, altCode: '114076' }
        }[selectedCode];

        if (variantMeta) {
            foundCourse.code = selectedCode;
            foundCourse.altCode = variantMeta.altCode;
            foundCourse.name = variantMeta.name;
            foundCourse.credits = variantMeta.credits;
        }

        if (!global.gameState.userSettings) global.gameState.userSettings = {};
        if (!global.gameState.userSettings.physicsVariants) global.gameState.userSettings.physicsVariants = {};
        if (['01140051', '01140071', '01140077', '01140055'].includes(selectedCode)) {
            global.gameState.userSettings.physicsVariants.physics1 = selectedCode;
        } else {
            global.gameState.userSettings.physicsVariants.physics2 = selectedCode;
        }

        // Synchronize in gameState.courses so Tree and Flowchart reflect choice immediately
        if (global.gameState && global.gameState.courses) {
            for (let [k, cObj] of Object.entries(global.gameState.courses)) {
                const cNorms = getNormalizedCodes(cObj.code, cObj.altCode);
                if (cNorms.includes(currentCode) || cNorms.includes(selectedCode)) {
                    if (variantMeta) {
                        cObj.name = variantMeta.name;
                        cObj.credits = variantMeta.credits;
                        cObj.code = selectedCode;
                        cObj.altCode = variantMeta.altCode;
                    }
                }
            }
        }

        saveCustomPlan();
        renderDegreePlanner();
        if (typeof global.saveState === 'function') global.saveState();
        if (typeof global.renderUI === 'function') global.renderUI();
        if (typeof global.renderFlowchartTree === 'function') global.renderFlowchartTree();
        showPlannerToast(`עודכנה גרסת הפיזיקה: ${foundCourse.name} (${foundCourse.credits} נק״ז) ⚛️`, false);
    };

    // Public API for English Level State
    global.openSportClubSelectorModal = openSportClubSelectorModal;
    global.applyEnglishLevelState = applyEnglishLevelState;
    global.getEnglishLevel = () => englishLevel;

    // Auto initialize events on DOM load
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initPlannerState();
                bindDelegatedPlannerEvents();
            });
        } else {
            initPlannerState();
            bindDelegatedPlannerEvents();
        }
    }

})(typeof window !== 'undefined' ? window : global);
