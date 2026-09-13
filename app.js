// Calculates semester-specific metrics: GPA, graded credits, and completion status
function getSemesterStats(semNumber) {
    if (!gameState || !gameState.courses) {
        return { isCompleted: false, gpa: 0, gradedCredits: 0, totalCredits: 0, list: [] };
    }
    const list = Object.values(gameState.courses).filter(c => (c.semester || 1) == semNumber);
    if (!list || list.length === 0) {
        return { isCompleted: false, gpa: 0, gradedCredits: 0, totalCredits: 0, list: [] };
    }

    let totalCredits = 0;
    let gradedCredits = 0;
    let weightedSum = 0;
    let allMastered = true;

    list.forEach(c => {
        const cr = c.credits || 0;
        totalCredits += cr;
        if (c.status !== 'mastered') {
            allMastered = false;
        }
        if (c.status === 'mastered' && c.grade !== undefined && c.grade !== null && !isNaN(c.grade) && c.grade >= 55) {
            gradedCredits += cr;
            weightedSum += (c.grade * cr);
        }
    });

    const isCompleted = allMastered && list.length > 0;
    const gpa = gradedCredits > 0 ? (weightedSum / gradedCredits) : 0;
    return {
        isCompleted,
        gpa,
        gradedCredits,
        totalCredits,
        list
    };
}

// Short course abbreviations matching user's Google Tasks setup
const COURSE_SHORT_NAMES = {
    '104041': 'חדו"א 1מ1',
    '104065': 'אלגברה ליניארית',
    '114051': 'פיסיקה 1',
    '125001': 'כימיה כללית',
    '234128': 'פייתון',
    '104043': 'חדו"א 2',
    '104131': 'מד"ר',
    '125013': 'מעבדה בכימיה',
    '314533': 'חומרים',
    '034061': 'גרפיקה הנדסית',
    '034028': 'מוצקים 1',
    // Semester 3 (Current)
    '104228': 'מד"ח',
    '114052': 'פיסיקה 2',
    '034053': 'מוצקים 2',
    '034056': 'חישוב מדעי והנדסי',
    '034035': 'תרמודינמיקה 1',
    '03940805': 'יוגה',
    // Semester 4 (Next)
    '034030': 'תהליכי ייצור',
    '034010': 'דינמיקה',
    '034055': 'זרימה 1',
    '034032': 'מערכות ליניאריות'
};

// Dedicated Notion-style course icons matching user's custom Notion workspace
const COURSE_NOTION_ICONS = {
    // 104131 ODEs / מד"ר -> Blue mathematical Sigma Σ (exact match to user Notion screenshot)
    '104131': {
        color: '#2563eb',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4H5l7 8-7 8h14"/></svg>`
    },
    // 104043 Calculus 2 / חדו"א 2 -> Purple area curve / graph (exact match to user Notion screenshot)
    '104043': {
        color: '#a855f7',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M3 4v16a1 1 0 0 0 1 1h17" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/><path d="M5 17c3-1 5-9 8-9s4 6 6 6v3H5v-0z" fill="rgba(168, 85, 247, 0.35)" stroke="#a855f7" stroke-width="2" stroke-linejoin="round"/></svg>`
    },
    // 104041 Calculus 1M1 / חדו"א 1מ1 -> Purple area curve / graph (Calculus family)
    '104041': {
        color: '#a855f7',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M3 4v16a1 1 0 0 0 1 1h17" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/><path d="M5 17c3-1 5-9 8-9s4 6 6 6v3H5v-0z" fill="rgba(168, 85, 247, 0.35)" stroke="#a855f7" stroke-width="2" stroke-linejoin="round"/></svg>`
    },
    // 034061 Engineering Graphics & CAD / תכנון הנדסי -> Red double gears (exact match to user Notion screenshot)
    '034061': {
        color: '#ef4444',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ef4444" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="2.5"/><path d="M9 4.5v1.2m0 6.6v1.2m4.5-4.5h-1.2m-6.6 0H4.5m1.3-3.2l.9.9m4.2 4.2l.9.9m0-6l-.9.9m-4.2 4.2l-.9.9"/><circle cx="16.5" cy="16.5" r="2"/><path d="M16.5 13.5v.8m0 4.4v.8m3-3h-.8m-4.4 0h-.8m1-2l.6.6m3 3l.6.6m0-4.2l-.6.6m-3 3l-.6.6"/></svg>`
    },
    // 034028 Solid Mechanics 1 / מכניקת מוצקים 1 -> Warm brown portal bridge / truss arch (exact match to user Notion screenshot)
    '034028': {
        color: '#b45309',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12"/><path d="M4 10h16"/><path d="M4 15c4-3 12-3 16 0"/><line x1="8" y1="6" x2="8" y2="10"/><line x1="16" y1="6" x2="16" y2="10"/></svg>`
    },
    // 034053 Solid Mechanics 2 / מכניקת מוצקים 2 מורחב -> Warm brown portal bridge / truss arch (Solid Mechanics family)
    '034053': {
        color: '#b45309',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12"/><path d="M4 10h16"/><path d="M4 15c4-3 12-3 16 0"/><line x1="8" y1="6" x2="8" y2="10"/><line x1="16" y1="6" x2="16" y2="10"/></svg>`
    },
    // 314533 Materials Science / מבוא להנדסת חומרים -> Amber yellow crystal lattice atom (exact match to user Notion screenshot)
    '314533': {
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5" fill="#eab308"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="6" cy="8.5" r="1.5"/><circle cx="18" cy="15.5" r="1.5"/><circle cx="6" cy="15.5" r="1.5"/><circle cx="18" cy="8.5" r="1.5"/><line x1="12" y1="9.5" x2="12" y2="6.5"/><line x1="12" y1="14.5" x2="12" y2="17.5"/><line x1="9.8" y1="10.7" x2="7.5" y2="9.4"/><line x1="14.2" y1="13.3" x2="16.5" y2="14.6"/><line x1="9.8" y1="13.3" x2="7.5" y2="14.6"/><line x1="14.2" y1="10.7" x2="16.5" y2="9.4"/></svg>`
    },
    // 125001 General Chemistry / כימיה כללית -> Emerald green Erlenmeyer flask (exact match to user Notion screenshot)
    '125001': {
        color: '#10b981',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4m-2 0v6l5.5 10a1.5 1.5 0 0 1-1.3 2H7.8a1.5 1.5 0 0 1-1.3-2L12 9V3"/><path d="M8.5 16h7" stroke-dasharray="1 2"/></svg>`
    },
    // 125013 Chemistry Lab / מעבדה בכימיה -> Emerald green Erlenmeyer flask
    '125013': {
        color: '#10b981',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3h4m-2 0v6l5.5 10a1.5 1.5 0 0 1-1.3 2H7.8a1.5 1.5 0 0 1-1.3-2L12 9V3"/><path d="M8.5 16h7" stroke-dasharray="1 2"/></svg>`
    },
    // 104228 PDEs / מד"ח -> Sky blue Nabla operator ∇
    '104228': {
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="4 6 20 6 12 20 4 6"/><line x1="10" y1="12" x2="14" y2="12" stroke-width="1.8"/></svg>`
    },
    // 114051 Physics 1 / פיסיקה 1 -> Amber orbital mechanics
    '114051': {
        color: '#f59e0b',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-25 12 12)"/><circle cx="12" cy="12" r="3" fill="#f59e0b"/></svg>`
    },
    // 114052 Physics 2 / פיסיקה 2 -> Cyan electric lightning bolt
    '114052': {
        color: '#06b6d4',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(6,182,212,0.25)"/></svg>`
    },
    // 114032 Physics Lab 1H / מעבדה לפיזיקה 1ח -> Teal laser optics / microscope
    '114032': {
        color: '#14b8a6',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h12M9 14h6m-4-10v8m-2-6l4 4"/><circle cx="12" cy="7" r="2"/></svg>`
    },
    // 234128 Python / פייתון -> Python blue code brackets
    '234128': {
        color: '#3b82f6',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
    },
    // 034056 Scientific & Engineering Computing / חישוב מדעי והנדסי -> Engineering calculator with display & math operators (+, -, ×, =)
    '034056': {
        color: '#6366f1',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2.5"/><rect x="7" y="5" width="10" height="3.5" rx="1" fill="rgba(99,102,241,0.25)"/><path d="M8 12h2m-1-1v2m4-1h3m-7 4l2 2m-2 0l2-2m3 0h3m-3 2h3"/></svg>`
    },
    // 034035 Thermodynamics 1 / תרמודינמיקה 1 -> Vibrant thermal flame 🔥
    '034035': {
        color: '#f97316',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="rgba(249, 115, 22, 0.25)" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
    },
    // 104065 Linear Algebra / אלגברה ליניארית -> Indigo matrix brackets
    '104065': {
        color: '#6366f1',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4H4v16h3m10-16h3v16h-3"/><circle cx="9" cy="9" r="1.2" fill="#6366f1"/><circle cx="15" cy="9" r="1.2" fill="#6366f1"/><circle cx="9" cy="15" r="1.2" fill="#6366f1"/><circle cx="15" cy="15" r="1.2" fill="#6366f1"/></svg>`
    },
    // 03940805 Physical Ed / יוגה -> Rose wellness lotus
    '03940805': {
        color: '#ec4899',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c2 4 6 6 8 8-2 3-5 5-8 5s-6-2-8-5c2-2 6-4 8-8z" fill="rgba(236,72,153,0.2)"/><circle cx="12" cy="12" r="2" fill="#ec4899"/></svg>`
    },
    // 034030 Manufacturing Processes / תהליכי ייצור -> Steel tooling / factory
    '034030': {
        color: '#78716c',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#78716c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
    },
    // 034010 Dynamics / דינמיקה -> Amber kinetic rotation
    '034010': {
        color: '#d97706',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`
    },
    // 034055 Fluid Mechanics / תורת הזרימה 1 -> Ocean blue streamline
    '034055': {
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c3-4 6-4 10 0s7 4 10 0M2 17c3-4 6-4 10 0s7 4 10 0"/></svg>`
    },
    // 034032 Linear Systems / מערכות ליניאריות -> Violet signal waveform
    '034032': {
        color: '#8b5cf6',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 6 16 3-8h4"/></svg>`
    },
    // 034041 Heat Transfer / מעבר חום -> Thermal radiation waves
    '034041': {
        color: '#ea580c',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M8 5a8 8 0 0 0 0 14M16 5a8 8 0 0 1 0 14M4 8a14 14 0 0 0 0 8M20 8a14 14 0 0 1 0 8"/></svg>`
    },
    // 034040 Control Theory / מבוא לבקרה -> Feedback control loop
    '034040': {
        color: '#06b6d4',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/></svg>`
    },
    // 034054 Mechanical Design 1 / תכן מכני 1 מ' -> Caliper / mechanical drafting
    '034054': {
        color: '#d97706',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0-9 9v9h9a9 9 0 0 0 9-9 9 9 0 0 0-9-9z"/><circle cx="12" cy="12" r="3"/></svg>`
    },
    // 034058 Probability & Stats / הסתברות וסטטיסטיקה -> Bell curve distribution
    '034058': {
        color: '#8b5cf6',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M4 18c3 0 4-14 8-14s5 14 8 14"/></svg>`
    },
    // 034051 Vibrations & Dynamics / תנודות ודינמיקה -> Harmonic oscillation wave
    '034051': {
        color: '#ec4899',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-8 5.5-8 8 0s5.5 8 8 0 3.5-4 4-4"/></svg>`
    },
    // 034060 Mechatronics / מבוא למכטרוניקה והנע חשמלי -> Motor & circuit coil
    '034060': {
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>`
    },
    // 034057 Advanced ME Lab / מעבדה מתקדמת -> Testing probe
    '034057': {
        color: '#14b8a6',
        svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v14m-5-5l5 5 5-5M5 20h14"/></svg>`
    },
    // Senior Projects (034371, 034379, 034382, 034380, 034383) -> Capstone trophy / medal
    '034371': { color: '#eab308', svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    '034379': { color: '#eab308', svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    '034382': { color: '#eab308', svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    '034380': { color: '#eab308', svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
    '034383': { color: '#eab308', svg: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` }
};

// ==========================================================================
// Notion-Style Course Icon & Color Customizer
// ==========================================================================

const NOTION_COLORS = [
    { key: 'blue', label: 'כחול', hex: '#3b82f6' },
    { key: 'cyan', label: 'טורקיז', hex: '#06b6d4' },
    { key: 'green', label: 'ירוק', hex: '#10b981' },
    { key: 'yellow', label: 'צהוב', hex: '#eab308' },
    { key: 'orange', label: 'כתום', hex: '#f97316' },
    { key: 'red', label: 'אדום', hex: '#ef4444' },
    { key: 'purple', label: 'סגול', hex: '#a855f7' },
    { key: 'pink', label: 'ורוד', hex: '#ec4899' },
    { key: 'brown', label: 'חום', hex: '#b45309' },
    { key: 'gray', label: 'אפור', hex: '#94a3b8' }
];

const NOTION_ICON_LIBRARY = {
    // ==========================================
    // --- MATHEMATICS (מתמטיקה) ---
    // ==========================================
    'sigma': {
        category: 'math',
        title: 'Sigma Summation / ODEs',
        hebrew: 'מד"ר (סגמא Σ)',
        keywords: 'sigma sum math ode differential מדר סגמא משוואות דיפרנציאליות רגילות 104131',
        svg: `<path d="M19 4H5l7 8-7 8h14" stroke-width="2.6"/>`
    },
    'diff-deriv': {
        category: 'math',
        title: 'Derivative dy/dx',
        hebrew: 'נגזרת ודיפרנציאל dy/dx',
        keywords: 'derivative dy dx ode diff נגזרת דיפרנציאל מדר',
        svg: `<path d="M7 14c-2 0-3-1-3-3s1-3 3-3c2 0 3 1 3 3v8M10 8V3M14 21l6-18M17 11l4 6M21 11l-4 6"/>`
    },
    'nabla': {
        category: 'math',
        title: 'Nabla Operator / PDEs',
        hebrew: 'מד"ח (נבלא ∇)',
        keywords: 'nabla pde differential vector calc מדח נבלא משוואות חלקיות 104228 104136',
        svg: `<polygon points="4 6 20 6 12 20 4 6" stroke-width="2.4"/><line x1="8" y1="11" x2="16" y2="11" stroke-width="2"/>`
    },
    'curve': {
        category: 'math',
        title: 'Calculus Area Curve',
        hebrew: 'חדו"א (גרף אינטגרל ושטח)',
        keywords: 'calculus curve integral area hadva חדווא אינטגרל שטח 104041 104043 104013',
        svg: `<path d="M3 4v16a1 1 0 0 0 1 1h17"/><path d="M5 17c3-1 5-9 8-9s4 6 6 6v3H5z" fill="currentColor" fill-opacity="0.25"/>`
    },
    'matrix': {
        category: 'math',
        title: 'Matrix / Linear Algebra',
        hebrew: 'אלגברה ליניארית (מטריצה)',
        keywords: 'matrix linear algebra brackets אלגברה ליניארית מטריצה 104166 104016 104065',
        svg: `<path d="M7 4H4v16h3m10-16h3v16h-3"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/>`
    },
    'bell-curve': {
        category: 'math',
        title: 'Gaussian Bell Curve / Stats',
        hebrew: 'הסתברות וסטטיסטיקה (פעמון גאוס)',
        keywords: 'bell curve normal distribution stats gauss הסתברות סטטיסטיקה גאוס 034058',
        svg: `<path d="M3 20h18M4 18c3 0 4-14 8-14s5 14 8 14"/>`
    },
    'integral': {
        category: 'math',
        title: 'Integral Symbol',
        hebrew: 'אינטגרל מסוים (∫)',
        keywords: 'integral calculus math אינטגרל חדווא',
        svg: `<path d="M16 3c-2 0-3.5 1.5-3.5 5v8c0 3.5-1.5 5-3.5 5s-3.5-1.5-3.5-5" stroke-width="2.4"/>`
    },
    'pi': {
        category: 'math',
        title: 'Pi Constant',
        hebrew: 'פאי (π)',
        keywords: 'pi math constant circle פאי מעגל',
        svg: `<path d="M4 7h16M7 7v13M17 7c0 4.5 1 9 3 13" stroke-width="2.2"/>`
    },
    'infinity': {
        category: 'math',
        title: 'Infinity / Limits',
        hebrew: 'אינסוף וגבולות (∞)',
        keywords: 'infinity limit math אינסוף גבול',
        svg: `<path d="M18.18 8c5.1 0 5.1 8 0 8-5.1 0-7.26-8-12.36-8-5.1 0-5.1 8 0 8 5.1 0 7.26-8 12.36-8z" stroke-width="2.2"/>`
    },
    'sqrt': {
        category: 'math',
        title: 'Square Root & Algebra',
        hebrew: 'שורש ריבועי (√x)',
        keywords: 'sqrt root radical שורש חזקה',
        svg: `<path d="M3 14l3 3 5-13h10" stroke-width="2.2"/><line x1="13" y1="11" x2="19" y2="17"/><line x1="19" y1="11" x2="13" y2="17"/>`
    },
    'delta': {
        category: 'math',
        title: 'Delta / Difference',
        hebrew: 'דלתא / הפרש (Δ)',
        keywords: 'delta triangle change diff דלתא הפרש שינוי',
        svg: `<polygon points="12 4 21 20 3 20 12 4" stroke-width="2.2"/>`
    },
    'function': {
        category: 'math',
        title: 'Function f(x)',
        hebrew: 'פונקציה מתמטית f(x)',
        keywords: 'function fx math פונקציה פונקציות',
        svg: `<path d="M9 18c2 0 3-1 3-3V6c0-2 1-3 3-3"/><line x1="7" y1="11" x2="15" y2="11"/><line x1="17" y1="14" x2="21" y2="18"/><line x1="21" y1="14" x2="17" y2="18"/>`
    },
    'percent': {
        category: 'math',
        title: 'Percent & Probability',
        hebrew: 'אחוזים והסתברות (%)',
        keywords: 'percent probability statistics אחוז הסתברות סטטיסטיקה',
        svg: `<line x1="19" y1="5" x2="5" y2="19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>`
    },
    'geometry': {
        category: 'math',
        title: 'Geometry & Right Triangle',
        hebrew: 'גיאומטריה ומשולש ישר זווית',
        keywords: 'geometry triangle trig גיאומטריה משולש פיתגורס',
        svg: `<path d="M4 20h16L4 4v16z"/><rect x="4" y="16" width="4" height="4"/>`
    },
    'math-ops': {
        category: 'math',
        title: 'Arithmetic Operations (+, -, ×, ÷)',
        hebrew: 'פעולות חשבון (+, -, ×, ÷)',
        keywords: 'arithmetic operations math plus minus divide חשבון פעולות',
        svg: `<line x1="6" y1="6" x2="10" y2="6"/><line x1="8" y1="4" x2="8" y2="8"/><line x1="14" y1="6" x2="18" y2="6"/><line x1="5" y1="15" x2="9" y2="19"/><line x1="9" y1="15" x2="5" y2="19"/><line x1="14" y1="17" x2="18" y2="17"/>`
    },

    // ==========================================
    // --- PHYSICS (פיזיקה) ---
    // ==========================================
    'lightning': {
        category: 'physics',
        title: 'Electricity & Lightning Bolt',
        hebrew: 'פיזיקה 2 (חשמל וברק ⚡)',
        keywords: 'lightning electric current circuit פיזיקה 2 חשמל מתח זרם ברק 114052',
        svg: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fill-opacity="0.25"/>`
    },
    'atom': {
        category: 'physics',
        title: 'Modern Physics Atom',
        hebrew: 'פיזיקה מודרנית (מבנה האטום ⚛️)',
        keywords: 'atom physics quantum nuclear פיזיקה אטום קוונטים מודרנית',
        svg: `<circle cx="12" cy="12" r="2.5" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)"/>`
    },
    'orbit': {
        category: 'physics',
        title: 'Orbital Mechanics & Gravity',
        hebrew: 'פיזיקה 1 (כבידה ומסלול שמימי 🪐)',
        keywords: 'orbit gravity space planet פיזיקה 1 כבידה מסלולים מכניקה 114051',
        svg: `<ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-25 12 12)"/><circle cx="12" cy="12" r="3.5" fill="currentColor"/>`
    },
    'magnet': {
        category: 'physics',
        title: 'Electromagnetism & Magnet',
        hebrew: 'מגנטיות ושדות (מגנט 🧲)',
        keywords: 'magnet magnetic electricity em מגנט שדה מגנטי חשמל',
        svg: `<path d="M4 4v7a8 8 0 0 0 16 0V4M4 9h4M16 9h4"/>`
    },
    'wave': {
        category: 'physics',
        title: 'Oscillations & Wave Motion',
        hebrew: 'תנודות וגלים (גל סינוסי 〰️)',
        keywords: 'wave sine frequency oscillation גלים תנודות תדר',
        svg: `<path d="M2 12c2.5-5 5.5-5 8 0s5.5 5 8 0 4-5 4-5" stroke-width="2.2"/>`
    },
    'sun': {
        category: 'physics',
        title: 'Optics & Solar Radiation',
        hebrew: 'אופטיקה וקרינה (שמש ☀️)',
        keywords: 'sun light optics radiation אור אופטיקה קרינה שמש',
        svg: `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`
    },
    'prism': {
        category: 'physics',
        title: 'Prism & Light Refraction',
        hebrew: 'שבירת אור ומנסרה אופטית',
        keywords: 'prism optics refraction spectrum מנסרה אופטיקה ספקטרום',
        svg: `<polygon points="12 3 22 20 2 20 12 3"/><line x1="2" y1="14" x2="9" y2="10"/><line x1="15" y1="10" x2="22" y2="7"/><line x1="15" y1="12" x2="22" y2="14"/>`
    },
    'laser': {
        category: 'physics',
        title: 'Laser & Physics Lab Optics',
        hebrew: 'מעבדת פיזיקה (לייזר ומדידות)',
        keywords: 'laser physics lab optics מעבדה פיזיקה לייזר 114032',
        svg: `<path d="M6 18h12M9 14h6m-4-10v8m-2-6l4 4"/><circle cx="12" cy="7" r="2"/>`
    },
    'compass': {
        category: 'physics',
        title: 'Vector Compass',
        hebrew: 'מצפן ושדה וקטורי 🧭',
        keywords: 'compass direction vector מצפן וקטורים כיוון',
        svg: `<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fill-opacity="0.3"/>`
    },
    'battery': {
        category: 'physics',
        title: 'Battery & Electric Energy',
        hebrew: 'סוללה ואנרגיה חשמלית 🔋',
        keywords: 'battery power electric energy סוללה מתח זרם אנרגיה',
        svg: `<rect x="2" y="7" width="16" height="10" rx="2"/><line x1="20" y1="10" x2="20" y2="14"/><line x1="7" y1="12" x2="13" y2="12"/><line x1="10" y1="9" x2="10" y2="15"/>`
    },
    'telescope': {
        category: 'physics',
        title: 'Telescope & Space',
        hebrew: 'טלסקופ ואסטרופיזיקה 🔭',
        keywords: 'telescope stars astronomy space טלסקופ אסטרונומיה חלל',
        svg: `<circle cx="12" cy="12" r="3"/><path d="M3 21l6-6M21 3l-6 6M10.5 4.5l9 9"/>`
    },
    'satellite': {
        category: 'physics',
        title: 'Satellite & Communication',
        hebrew: 'לוויין ותקשורת חלל 🛰️',
        keywords: 'satellite space comm לוויין תקשורת חלל',
        svg: `<path d="M13 2L3 12l3 3 10-10z"/><path d="M14.5 9.5l4 4"/><path d="M6 18l-3 3"/><path d="M17 3l4 4"/>`
    },

    // ==========================================
    // --- MECHANICAL ENGINEERING (הנדסת מכונות) ---
    // ==========================================
    'bridge': {
        category: 'mechanical',
        title: 'Truss Arch Bridge / Solid Mechanics',
        hebrew: 'מכניקת מוצקים (גשר ומסבכים 🌉)',
        keywords: 'bridge solid mechanics truss arch beam מוצקים קורות גשר מסבכים 034028 034053 034015',
        svg: `<path d="M4 20V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12"/><path d="M4 10h16"/><path d="M4 15c4-3 12-3 16 0"/><line x1="8" y1="6" x2="8" y2="10"/><line x1="16" y1="6" x2="16" y2="10"/>`
    },
    'dual-gears': {
        category: 'mechanical',
        title: 'Interlocking Gears / CAD & Graphics',
        hebrew: 'תכנון הנדסי וגרפיקה (גלגלי שיניים ⚙️)',
        keywords: 'gears cad engineering graphics drafting תכן גרפיקה גלגלי שיניים 034061',
        svg: `<circle cx="9" cy="9" r="2.5"/><path d="M9 4.5v1.2m0 6.6v1.2m4.5-4.5h-1.2m-6.6 0H4.5m1.3-3.2l.9.9m4.2 4.2l.9.9m0-6l-.9.9m-4.2 4.2l-.9.9"/><circle cx="16.5" cy="16.5" r="2"/><path d="M16.5 13.5v.8m0 4.4v.8m3-3h-.8m-4.4 0h-.8m1-2l.6.6m3 3l.6.6m0-4.2l-.6.6m-3 3l-.6.6"/>`
    },
    'flame': {
        category: 'mechanical',
        title: 'Thermal Flame / Thermodynamics',
        hebrew: 'תרמודינמיקה (להבה תרמית 🔥)',
        keywords: 'flame heat fire thermal thermo תרמודינמיקה חום להבה 034035 034056',
        svg: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" fill="currentColor" fill-opacity="0.2"/>`
    },
    'dynamics': {
        category: 'mechanical',
        title: 'Kinetic Rotation / Dynamics',
        hebrew: 'דינמיקה (סיבוב ותנועה קינטית 🔄)',
        keywords: 'dynamics rotation kinetic motion דינמיקה תנועה סיבוב 034010',
        svg: `<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>`
    },
    'streamlines': {
        category: 'mechanical',
        title: 'Fluid Streamlines / Flow 1',
        hebrew: 'מכניקת זורמים (קווי זרימה 🌊)',
        keywords: 'fluid flow streamline aero זרימה זורמים נוזלים אוויר 034055',
        svg: `<path d="M2 12c3-4 6-4 10 0s7 4 10 0M2 17c3-4 6-4 10 0s7 4 10 0"/>`
    },
    'waveform': {
        category: 'mechanical',
        title: 'Signal Waveform / Linear Systems',
        hebrew: 'מערכות ליניאריות (אות וגל 📈)',
        keywords: 'waveform signal linear systems אותות מערכות ליניאריות 034032',
        svg: `<path d="M2 12h4l3-8 6 16 3-8h4"/>`
    },
    'heat-radiation': {
        category: 'mechanical',
        title: 'Heat Transfer & Radiation',
        hebrew: 'מעבר חום (קרינה והולכה ♨️)',
        keywords: 'heat transfer radiation thermal מעבר חום קרינה תרמי 034041',
        svg: `<path d="M12 2v20M8 5a8 8 0 0 0 0 14M16 5a8 8 0 0 1 0 14M4 8a14 14 0 0 0 0 8M20 8a14 14 0 0 1 0 8"/>`
    },
    'control-loop': {
        category: 'mechanical',
        title: 'Feedback Control Loop',
        hebrew: 'תורת הבקרה (חוג בקרה ומשוב 🎯)',
        keywords: 'control feedback loop בקרה חוג משוב 034040',
        svg: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/>`
    },
    'caliper': {
        category: 'mechanical',
        title: 'Caliper & Drafting / ME Design 1',
        hebrew: 'תכן מכני 1 (קליבר ומדידה מדויקת 📐)',
        keywords: 'caliper design mechanical measurement תכן מכני קליבר מדידה 034054',
        svg: `<path d="M12 3a9 9 0 0 0-9 9v9h9a9 9 0 0 0 9-9 9 9 0 0 0-9-9z"/><circle cx="12" cy="12" r="3"/>`
    },
    'harmonic-wave': {
        category: 'mechanical',
        title: 'Harmonic Vibration & Resonance',
        hebrew: 'תורת הרטט (תנודה והדהוד 〰️)',
        keywords: 'vibrations resonance harmonic wave רטט תנודות תהודה 034051',
        svg: `<path d="M2 12c2.5-8 5.5-8 8 0s5.5 8 8 0 3.5-4 4-4"/>`
    },
    'mechatronics': {
        category: 'mechanical',
        title: 'Motor Coil / Mechatronics',
        hebrew: 'מכטרוניקה (מנוע ובקרה ספרתית 🎛️)',
        keywords: 'mechatronics motor coil electronics מכטרוניקה מנועים סליל 034060',
        svg: `<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>`
    },
    'test-probe': {
        category: 'mechanical',
        title: 'Advanced Testing Probe / ME Lab',
        hebrew: 'מעבדת הנדסת מכונות (מכשור ובדיקה 🧪)',
        keywords: 'test probe lab sensors מעבדה מכונות בדיקה 034057',
        svg: `<path d="M12 2v14m-5-5l5 5 5-5M5 20h14"/>`
    },
    'gear': {
        category: 'mechanical',
        title: 'Single Cog / Machine Elements',
        hebrew: 'גלגל שיניים בודד (אלמנט מכני)',
        keywords: 'gear cog mechanical מכונות גלגל שיניים',
        svg: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>`
    },
    'wrench': {
        category: 'mechanical',
        title: 'Mechanic Wrench & Tools',
        hebrew: 'מפתח ברגים וכלי עבודה 🔧',
        keywords: 'wrench tool repair maintenance מפתח ברגים כלים',
        svg: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`
    },
    'thermometer': {
        category: 'mechanical',
        title: 'Thermometer & Temperature',
        hebrew: 'מדחום ומדידת טמפרטורה 🌡️',
        keywords: 'thermometer temperature heat מדחום טמפרטורה חום',
        svg: `<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><circle cx="11.5" cy="17.5" r="2" fill="currentColor"/>`
    },
    'gauge': {
        category: 'mechanical',
        title: 'Pressure Gauge & Sensor',
        hebrew: 'מד לחץ ובקרת מערכות ⏱️',
        keywords: 'gauge pressure meter sensor לחץ מד חיישנים',
        svg: `<circle cx="12" cy="12" r="9"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><path d="M6 12a6 6 0 0 1 12 0"/>`
    },
    'droplet': {
        category: 'mechanical',
        title: 'Hydraulics & Fluid Droplet',
        hebrew: 'הידראוליקה ונוזלים (טיפה 💧)',
        keywords: 'droplet water liquid fluid hydro הידראוליקה נוזלים טיפה',
        svg: `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fill-opacity="0.2"/>`
    },
    'spring': {
        category: 'mechanical',
        title: 'Coil Spring & Elasticity',
        hebrew: 'קפיץ סלילי ואלסטיות 🌀',
        keywords: 'spring vibration resonance coil קפיץ רטט אלסטיות',
        svg: `<path d="M7 4c2-2 6-2 8 0s-2 5-6 5 8 0 8 3-4 3-8 3 8 0 8 3-2 5-6 5" stroke-width="2.2"/>`
    },
    'anvil': {
        category: 'mechanical',
        title: 'Anvil & Manufacturing',
        hebrew: 'סדן ותהליכי ייצור (034030 ⚒️)',
        keywords: 'anvil metallurgy materials manufacturing סדן ייצור מתכות 034030',
        svg: `<path d="M3 8h18l-3 4H8L4 18h16v2H2l2-8H2V8h1z"/>`
    },
    'hammer': {
        category: 'mechanical',
        title: 'Hammer & Machine Workshop',
        hebrew: 'פטיש וסדנא מכנית 🔨',
        keywords: 'hammer tool build workshop פטיש סדנא עבודה',
        svg: `<path d="M14 4l6 6-3 3-6-6zM8 10l6 6-9 7-2-2z"/>`
    },
    'fan': {
        category: 'mechanical',
        title: 'Turbomachinery & Fan',
        hebrew: 'מאוורר וטורבו-מכונות 💨',
        keywords: 'fan blower turbo ventilation מאוורר טורבינה זרימה',
        svg: `<circle cx="12" cy="12" r="2.5"/><path d="M12 9.5V3a2.5 2.5 0 0 1 3.5 2.5v4M14.5 12H21a2.5 2.5 0 0 1-2.5 3.5h-4M12 14.5V21a2.5 2.5 0 0 1-3.5-2.5v-4M9.5 12H3a2.5 2.5 0 0 1 2.5-3.5h4"/>`
    },
    'car': {
        category: 'mechanical',
        title: 'Automotive & Vehicle Dynamics',
        hebrew: 'הנדסת רכב ומערכות הנעה 🚗',
        keywords: 'car vehicle automotive transport רכב מכונית תחבורה הנעה',
        svg: `<path d="M5 17h14M6 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5M2 13h20"/>`
    },
    'airplane': {
        category: 'mechanical',
        title: 'Aero & Aviation',
        hebrew: 'תעופה ואווירודינמיקה ✈️',
        keywords: 'airplane aero aviation flight מטוס תעופה טיסה',
        svg: `<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>`
    },
    'rocket': {
        category: 'mechanical',
        title: 'Rocket Propulsion & Space',
        hebrew: 'הנעה רקטית וטילים 🚀',
        keywords: 'rocket space propulsion טיל רקטה חלל מנועים',
        svg: `<path d="M12 2c3 3 5 7 5 12l-5 3-5-3c0-5 2-9 5-12zM7 14l-4 3v3l4-1M17 14l4 3v3l-4-1"/>`
    },

    // ==========================================
    // --- CHEMISTRY & MATERIALS (כימיה וחומרים) ---
    // ==========================================
    'lattice': {
        category: 'chemistry',
        title: 'Crystal Lattice / Materials Science',
        hebrew: 'מבוא לחומרים (שריג גבישי ואטומים 💠)',
        keywords: 'materials lattice crystal atom חומרים שריג גביש 314533',
        svg: `<circle cx="12" cy="12" r="2.5" fill="currentColor"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="6" cy="8.5" r="1.5"/><circle cx="18" cy="15.5" r="1.5"/><circle cx="6" cy="15.5" r="1.5"/><circle cx="18" cy="8.5" r="1.5"/><line x1="12" y1="9.5" x2="12" y2="6.5"/><line x1="12" y1="14.5" x2="12" y2="17.5"/><line x1="9.8" y1="10.7" x2="7.5" y2="9.4"/><line x1="14.2" y1="13.3" x2="16.5" y2="14.6"/><line x1="9.8" y1="13.3" x2="7.5" y2="14.6"/><line x1="14.2" y1="10.7" x2="16.5" y2="9.4"/>`
    },
    'flask': {
        category: 'chemistry',
        title: 'Erlenmeyer Flask / Chemistry',
        hebrew: 'כימיה כללית ומעבדה (ארלנמייר 🧪)',
        keywords: 'flask beaker chemistry chem lab כימיה מעבדה ארלנמייר 125001 125013',
        svg: `<path d="M10 3h4m-2 0v6l5.5 10a1.5 1.5 0 0 1-1.3 2H7.8a1.5 1.5 0 0 1-1.3-2L12 9V3"/><path d="M8.5 16h7" stroke-dasharray="1 2"/>`
    },
    'beaker': {
        category: 'chemistry',
        title: 'Beaker & Solutions',
        hebrew: 'כוס כימית ותמיסות 🫗',
        keywords: 'beaker cup chemistry solution כוס כימית תמיסה',
        svg: `<path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12"/>`
    },
    'test-tube': {
        category: 'chemistry',
        title: 'Test Tube & Organic Chemistry',
        hebrew: 'מבחנה וכימיה אורגנית 🧪',
        keywords: 'test tube lab chemistry מבחנה מעבדה',
        svg: `<path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5V2M8.5 2h7M9.5 12h5"/>`
    },
    'molecule': {
        category: 'chemistry',
        title: 'Molecule & Chemical Bonds',
        hebrew: 'מולקולה וקשרים כימיים 🧬',
        keywords: 'molecule chemical bond atom מולקולה קשרים כימיה',
        svg: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`
    },
    'microscope': {
        category: 'chemistry',
        title: 'Microscope & Materials Analysis',
        hebrew: 'מיקרוסקופ ומעבדת חומרים 🔬',
        keywords: 'microscope materials lab optics מיקרוסקופ חומרים מעבדה',
        svg: `<path d="M6 18h8M3 22h18M14 22a7 7 0 1 0 0-14h-1M9 14h2M9 12a2 2 0 0 1 2-2h1V3H8v7a2 2 0 0 1 1 2z"/>`
    },
    'dna': {
        category: 'chemistry',
        title: 'DNA Double Helix & Biotech',
        hebrew: 'סליל DNA והנדסה ביו-רפואית 🧬',
        keywords: 'dna helix bio genetic די אן איי ביוטכנולוגיה',
        svg: `<path d="M2 15c6.667-6 13.333 0 20-6M2 9c6.667 6 13.333 0 20 6M9 11.5v3M15 9.5v3"/>`
    },
    'scale': {
        category: 'chemistry',
        title: 'Analytical Precision Scale',
        hebrew: 'מאזניים אנליטיים ומדידת מסה ⚖️',
        keywords: 'scale weight balance analytical מאזניים משקל דיוק',
        svg: `<path d="M12 3v18M6 8l-4 6h8l-4-6zm12 0l-4 6h8l-4-6zM3 21h18"/>`
    },

    // ==========================================
    // --- TECH & COMPUTING (חישוב ותכנות) ---
    // ==========================================
    'calc-scientific': {
        category: 'tech',
        title: 'Scientific Computing Calculator',
        hebrew: 'חישוב מדעי והנדסי (מחשבון 🧮)',
        keywords: 'calculator computing numerical scientific חישוב מדעי הנדסי מחשבון 034056 034042',
        svg: `<rect x="4" y="2" width="16" height="20" rx="2.5"/><rect x="7" y="5" width="10" height="3.5" rx="1" fill="currentColor" fill-opacity="0.2"/><path d="M8 12h2m-1-1v2m4-1h3m-7 4l2 2m-2 0l2-2m3 0h3m-3 2h3"/>`
    },
    'code': {
        category: 'tech',
        title: 'Python Code Brackets {;}',
        hebrew: 'פייתון ותכנות (סוגרי קוד {;})',
        keywords: 'code brackets programming dev python תכנות פייתון קוד 234128',
        svg: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`
    },
    'terminal': {
        category: 'tech',
        title: 'Terminal CLI & Shell',
        hebrew: 'טרמינל ושורת פקודה (>_)',
        keywords: 'terminal cli console bash shell טרמינל קונסול',
        svg: `<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>`
    },
    'cpu': {
        category: 'tech',
        title: 'CPU Microprocessor & Hardware',
        hebrew: 'מעבד מחשב וחומרה ספרתית 🔲',
        keywords: 'cpu processor chip hardware מעבד חומרה מחשב',
        svg: `<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>`
    },
    'database': {
        category: 'tech',
        title: 'Database & SQL Storage',
        hebrew: 'בסיס נתונים ו-SQL 🗄️',
        keywords: 'database sql data storage מסד נתונים מאגר',
        svg: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>`
    },
    'server': {
        category: 'tech',
        title: 'Cloud Server Stack',
        hebrew: 'שרת ותשתיות ענן 🖥️',
        keywords: 'server host cloud network שרת ענן רשת',
        svg: `<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>`
    },
    'chip': {
        category: 'tech',
        title: 'Integrated Circuit Chip',
        hebrew: 'שבב משולב ואלקטרוניקה 🔌',
        keywords: 'chip ic microchip circuit מעגל משולב שבב',
        svg: `<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/>`
    },
    'cloud': {
        category: 'tech',
        title: 'Cloud Network & Web',
        hebrew: 'ענן ורשת אינטרנט ☁️',
        keywords: 'cloud network web storage ענן רשת אחסון',
        svg: `<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>`
    },
    'robot-head': {
        category: 'tech',
        title: 'AI Robot & Autonomous Agent',
        hebrew: 'רובוט ובינה מלאכותית 🤖',
        keywords: 'robot ai bot agent רובוט בינה מלאכותית',
        svg: `<rect x="4" y="6" width="16" height="14" rx="3"/><circle cx="9" cy="11" r="2" fill="currentColor"/><circle cx="15" cy="11" r="2" fill="currentColor"/><path d="M9 16h6"/><line x1="12" y1="2" x2="12" y2="6"/>`
    },
    'brain': {
        category: 'tech',
        title: 'Neural Network & Deep Learning',
        hebrew: 'רשתות נוירונים ולמידת מכונה 🧠',
        keywords: 'brain neural network ai ml מוח נוירונים בינה',
        svg: `<path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .4.1.8.2 1.2A3.5 3.5 0 0 0 4 12a3.5 3.5 0 0 0 2.2 3.3c-.1.4-.2.8-.2 1.2A3.5 3.5 0 0 0 9.5 20c1.3 0 2.4-.7 3-1.7.6 1 1.7 1.7 3 1.7a3.5 3.5 0 0 0 3.5-3.5c0-.4-.1-.8-.2-1.2A3.5 3.5 0 0 0 21 12a3.5 3.5 0 0 0-2.2-3.3c.1-.4.2-.8.2-1.2A3.5 3.5 0 0 0 15.5 4c-1.3 0-2.4.7-3 1.7-.6-1-1.7-1.7-3-1.7z"/><path d="M12 6v12"/>`
    },

    // ==========================================
    // --- SPORTS, YOGA & WELLNESS (ספורט ויוגה) ---
    // ==========================================
    'lotus': {
        category: 'sports',
        title: 'Yoga Lotus Flower (PE 03940805)',
        hebrew: 'יוגה - פרח לוטוס (03940805 🪷)',
        keywords: 'yoga lotus sport meditation flower יוגה לוטוס ספורט חינוך גופני 03940805 מדיטציה',
        svg: `<path d="M12 4c2 4 6 6 8 8-2 3-5 5-8 5s-6-2-8-5c2-2 6-4 8-8z" fill="currentColor" fill-opacity="0.2"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/>`
    },
    'yoga-pose': {
        category: 'sports',
        title: 'Yoga Meditation Pose',
        hebrew: 'יוגה - תנוחת מדיטציה ויציבה 🧘',
        keywords: 'yoga pose meditation zen stretch יוגה מדיטציה מתיחות גמישות יציבה ספורט',
        svg: `<circle cx="12" cy="4" r="2.2" fill="currentColor"/><path d="M12 8v5M8 11l4 2 4-2M5 19c1.5-3 3.5-4 7-4s5.5 1 7 4M6 19h12"/>`
    },
    'dumbbell': {
        category: 'sports',
        title: 'Gym & Weight Training',
        hebrew: 'כושר ומשקולות (חדר כושר 🏋️)',
        keywords: 'dumbbell weights gym fitness sport משקולות חדר כושר אימון כוח ספורט',
        svg: `<path d="M6 7v10M18 7v10M4 9v6M20 9v6M6 12h12M2 10v4M22 10v4"/>`
    },
    'running': {
        category: 'sports',
        title: 'Running & Athletics',
        hebrew: 'ריצה ואימון אירובי 🏃',
        keywords: 'running cardio sport athlete ריצה אתלטיקה אירובי ספורט',
        svg: `<circle cx="14" cy="4" r="2" fill="currentColor"/><path d="M5 20l4-4 2 2 3-4-3-3 4-2M15 11l4 1M8 13l-3 1"/>`
    },
    'swimming': {
        category: 'sports',
        title: 'Swimming Pool',
        hebrew: 'שחייה ובריכה 🏊',
        keywords: 'swimming pool water sport שחייה בריכה מים ספורט',
        svg: `<circle cx="6" cy="7" r="2" fill="currentColor"/><path d="M3 17c3-1.5 5-1.5 8 0s5 1.5 8 0M3 20c3-1.5 5-1.5 8 0s5 1.5 8 0M9 9l4 2 4-2"/>`
    },
    'bicycle': {
        category: 'sports',
        title: 'Cycling & Bicycle',
        hebrew: 'אופניים ורכיבה 🚴',
        keywords: 'bicycle cycling bike sport אופניים רכיבה ספורט',
        svg: `<circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path d="M6 16l4-7h4l3 7M10 9l3 7M14 9l1-3h3"/>`
    },
    'heartbeat': {
        category: 'sports',
        title: 'Heart Pulse & Cardio',
        hebrew: 'דופק לב ובריאות 💓',
        keywords: 'heart pulse cardio health דופק לב אימון בריאות ספורט',
        svg: `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><polyline points="4 12 8 12 10 9 14 15 16 12 20 12"/>`
    },

    // ==========================================
    // --- ACADEMIC & GENERAL (אקדמי וכללי) ---
    // ==========================================
    'trophy': {
        category: 'academic',
        title: 'Capstone Trophy & Excellence',
        hebrew: 'פרויקט גמר ומצוינות (גביע 🏆)',
        keywords: 'trophy capstone project senior award גביע פרויקט גמר הצטיינות 034371 034379 034382 034380 034383',
        svg: `<path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2m12 6h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v7a6 6 0 0 1-12 0V3zM9 21h6M12 16v5"/>`
    },
    'star-medal': {
        category: 'academic',
        title: 'Honors Star Medal',
        hebrew: 'מדליית הצטיינות וכוכב ⭐',
        keywords: 'star medal honors award הצטיינות כוכב פרס מדליה',
        svg: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor" fill-opacity="0.2"/>`
    },
    'grad-cap': {
        category: 'academic',
        title: 'Graduation Cap / Degree',
        hebrew: 'כובע סיום תואר 🎓',
        keywords: 'graduation degree cap academic תואר סיום בוגר כובע',
        svg: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="6 9.5 6 16 12 19 18 16 18 9.5"/><path d="M22 10v6"/>`
    },
    'book': {
        category: 'academic',
        title: 'Course Textbook',
        hebrew: 'ספר לימוד וקריאה 📖',
        keywords: 'book reading study course ספר לימוד קריאה',
        svg: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`
    },
    'library': {
        category: 'academic',
        title: 'Library & References',
        hebrew: 'ספרייה ומאגר ידע 📚',
        keywords: 'library bookshelf books ספרייה ספרים מאגר',
        svg: `<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10v20H6.5A2.5 2.5 0 0 1 4 19.5zM10 2h4v20h-4zM14 2h3.5A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 1-2.5 2.5H14z"/>`
    },
    'pen-tool': {
        category: 'academic',
        title: 'Pen Tool & Technical CAD',
        hebrew: 'עט שרטוט ו-CAD ✒️',
        keywords: 'pen tool cad drawing draft שרטוט גרפיקה הנדסית',
        svg: `<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/>`
    },
    'pencil': {
        category: 'academic',
        title: 'Pencil & Study Notes',
        hebrew: 'עיפרון ומחברת סיכומים ✏️',
        keywords: 'pencil write notes draw עיפרון כתיבה סיכום מחברת',
        svg: `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>`
    },
    'lightbulb': {
        category: 'academic',
        title: 'Idea & Creative Solution',
        hebrew: 'רעיון ויצירתיות 💡',
        keywords: 'idea lightbulb creative insight רעיון יצירתיות פתרון',
        svg: `<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/>`
    },
    'target': {
        category: 'academic',
        title: 'Semester Target & Goal',
        hebrew: 'מטרה ויעד סמסטר 🎯',
        keywords: 'target goal aim bullseye מטרה יעד פגיעה',
        svg: `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/>`
    },
    'calendar': {
        category: 'academic',
        title: 'Exam Calendar & Schedule',
        hebrew: 'לוח שנה ומועדי בחינות 📅',
        keywords: 'calendar date schedule exam יומן לוח שנה מועד',
        svg: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`
    },
    'clock': {
        category: 'academic',
        title: 'Clock & Time Management',
        hebrew: 'שעון וניהול זמנים ⏰',
        keywords: 'clock time timer hour שעון זמן שעות',
        svg: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`
    },
    'check-circle': {
        category: 'academic',
        title: 'Completed Task Checkmark',
        hebrew: 'הושלם בהצלחה (וי ירוק ✅)',
        keywords: 'check mark done complete וי הצלחה הושלם',
        svg: `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" stroke-width="2.5"/>`
    },
    'globe': {
        category: 'academic',
        title: 'Globe & WebWork (WWW)',
        hebrew: 'גלובוס ורשת עולמית (WWW 🌐)',
        keywords: 'globe world webwork planet גלובוס עולם אינטרנט וובוורק',
        svg: `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`
    },
    'flag': {
        category: 'academic',
        title: 'Milestone Flag',
        hebrew: 'דגל וציון דרך 🚩',
        keywords: 'flag milestone achievement דגל אבן דרך יעד',
        svg: `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>`
    },
    'coffee': {
        category: 'academic',
        title: 'Coffee Break & Focus',
        hebrew: 'קפה והתרעננות בלמידה ☕',
        keywords: 'coffee break focus cafe קפה הפסקה ריכוז',
        svg: `<path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>`
    },
    'layers': {
        category: 'academic',
        title: 'Layers & Stack Architecture',
        hebrew: 'שכבות וארכיטקטורה 🥞',
        keywords: 'layers stack architecture שכבות מבנה רב שכבתי',
        svg: `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`
    },
    'curly-brackets': {
        category: 'tech',
        title: 'Curly Brackets / Code & Algorithms',
        hebrew: 'סוגריים מסולסלים {...} (קוד ואלגוריתמים)',
        keywords: 'curly brackets code algorithm syntax סוגריים מסולסלים אלגוריתמים קוד תכנות פיתוח',
        svg: `<path d="M8 3c-1.5 0-2.5 1-2.5 2.5v4c0 1-.5 1.8-1.5 2.2 1 .4 1.5 1.2 1.5 2.2v4c0 1.5 1 2.5 2.5 2.5M16 3c1.5 0 2.5 1 2.5 2.5v4c0 1 .5 1.8 1.5 2.2-1 .4-1.5 1.2-1.5 2.2v4c0 1.5-1 2.5-2.5 2.5"/><circle cx="9.5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="14.5" cy="12" r="1" fill="currentColor"/>`
    },
    'network-nodes': {
        category: 'tech',
        title: 'Network Nodes / Graph Theory',
        hebrew: 'רשת צמתים ותורת הגרפים 🕸️',
        keywords: 'network nodes graph topology רשת גרפים צמתים תקשורת מבני נתונים',
        svg: `<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><line x1="7.2" y1="7.2" x2="10.8" y2="15.8"/><line x1="16.8" y1="7.2" x2="13.2" y2="15.8"/><line x1="7.5" y1="6" x2="16.5" y2="6"/>`
    },
    'tree-diagram': {
        category: 'tech',
        title: 'Hierarchy / Tree Diagram & AST',
        hebrew: 'תרשים עץ ומבנה היררכי 🌲',
        keywords: 'tree hierarchy ast flowchart עץ היררכיה תרשים מבני נתונים',
        svg: `<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="17" width="5" height="4" rx="1"/><rect x="10" y="17" width="5" height="4" rx="1"/><rect x="17" y="17" width="5" height="4" rx="1"/><line x1="12" y1="7" x2="12" y2="12"/><line x1="5.5" y1="12" x2="19.5" y2="12"/><line x1="5.5" y1="12" x2="5.5" y2="17"/><line x1="12.5" y1="12" x2="12.5" y2="17"/><line x1="19.5" y1="12" x2="19.5" y2="17"/>`
    },
    'sliders-eq': {
        category: 'tech',
        title: 'Control Sliders / Signals & Tuning',
        hebrew: 'סליידרים ובקרה (אותות ומערכות 🎚️)',
        keywords: 'sliders equalizer tuning control signals בקרה אותות כיוונון אלקטרוניקה',
        svg: `<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><circle cx="4" cy="12" r="2"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><circle cx="12" cy="10" r="2"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="20" cy="14" r="2"/>`
    },
    'git-branch': {
        category: 'tech',
        title: 'Git Version Control Branch',
        hebrew: 'ענף גיט ובקרת גרסאות (Git 🌿)',
        keywords: 'git branch commit version control גיט ענף גרסאות פיתוח תוכנה',
        svg: `<line x1="6" y1="3" x2="6" y2="21"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="9" r="3"/><path d="M6 18a9 9 0 0 1 9-9h3"/>`
    },
    'qr-code': {
        category: 'tech',
        title: 'QR Code / Digital Systems',
        hebrew: 'קוד QR ומערכות דיגיטליות 📱',
        keywords: 'qr code barcode digital vision קוד דיגיטלי סריקה',
        svg: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5.5" y="5.5" width="2" height="2" fill="currentColor"/><rect x="16.5" y="5.5" width="2" height="2" fill="currentColor"/><rect x="5.5" y="16.5" width="2" height="2" fill="currentColor"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="14" y1="17.5" x2="21" y2="17.5"/><line x1="17.5" y1="14" x2="21" y2="14"/><line x1="17.5" y1="21" x2="21" y2="21"/>`
    },
    'terminal-prompt': {
        category: 'tech',
        title: 'Command Line Prompt (>_)',
        hebrew: 'שורת פקודה ולינוקס (>_)',
        keywords: 'terminal prompt bash linux command line טרמינל לינוקס שורת פקודה פיתוח',
        svg: `<rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="7 9 10 12 7 15"/><line x1="13" y1="15" x2="17" y2="15"/>`
    },
    'incognito': {
        category: 'tech',
        title: 'Incognito / Cyber Security',
        hebrew: 'אבטחת מידע וסייבר 🕵️',
        keywords: 'incognito security cyber crypto privacy סייבר אבטחת מידע פרטיות קריפטוגרפיה',
        svg: `<path d="M3 11h18M5 11l2-6h10l2 6"/><circle cx="8" cy="16" r="2.5"/><circle cx="16" cy="16" r="2.5"/><path d="M10.5 16h3"/>`
    },
    'balance-scale': {
        category: 'mechanical',
        title: 'Balance Scale / Statics & Ethics',
        hebrew: 'מאזניים (שיווי משקל, סטטיקה ואתיקה ⚖️)',
        keywords: 'scale balance equilibrium statics ethics law מאזניים שיווי משקל סטטיקה אתיקה',
        svg: `<line x1="12" y1="3" x2="12" y2="21"/><path d="M5 21h14M3 7l9-2 9 2"/><path d="M3 7l-2 7a5 5 0 0 0 8 0L7 7M17 7l-2 7a5 5 0 0 0 8 0L21 7"/>`
    },
    'ruler': {
        category: 'mechanical',
        title: 'Measurement Ruler & Drafting',
        hebrew: 'סרגל מדידה ושרטוט 📏',
        keywords: 'ruler measure draft scale סרגל מדידה שרטוט הנדסי גיאומטריה',
        svg: `<path d="M21.3 8.7L15.3 2.7a2 2 0 0 0-2.8 0L2.7 12.5a2 2 0 0 0 0 2.8l6 6a2 2 0 0 0 2.8 0l9.8-9.8a2 2 0 0 0 0-2.8z"/><line x1="8.5" y1="8.5" x2="10" y2="10"/><line x1="11.5" y1="11.5" x2="14" y2="14"/><line x1="14.5" y1="14.5" x2="16" y2="16"/><line x1="17.5" y1="17.5" x2="20" y2="20"/>`
    },
    'screwdriver': {
        category: 'mechanical',
        title: 'Screwdriver / Workshop Assembly',
        hebrew: 'מברג והרכבה מכנית 🪛',
        keywords: 'screwdriver tool repair assembly מברג כלי עבודה הרכבה מעבדה בית מלאכה',
        svg: `<path d="M19 5l-2-2a2 2 0 0 0-2.8 0L8.5 8.7l4.8 4.8L19 7.8a2 2 0 0 0 0-2.8z"/><path d="M8.5 8.7L3 14.2V17h2.8l5.5-5.5"/><line x1="2" y1="22" x2="4.5" y2="19.5"/>`
    },
    'crane': {
        category: 'mechanical',
        title: 'Tower Crane / Heavy Machinery',
        hebrew: 'עגורן ומכונות הרמה 🏗️',
        keywords: 'crane construction lifting mechanics machinery עגורן מנוף הרמה מכונות מבנים',
        svg: `<line x1="7" y1="22" x2="7" y2="4"/><polygon points="7 4 3 6 7 2 21 6 7 4"/><line x1="18" y1="6" x2="18" y2="14"/><rect x="16" y="14" width="4" height="3" rx="0.5"/><line x1="4" y1="22" x2="10" y2="22"/>`
    },
    'wind-gust': {
        category: 'mechanical',
        title: 'Wind & Airflow / Aerodynamics',
        hebrew: 'משב רוח ואווירודינמיקה 💨',
        keywords: 'wind air flow aerodynamics רוח זרימה אווירודינמיקה מכונות זורמים',
        svg: `<path d="M9.6 4.5A2.6 2.6 0 1 0 7 7h10a2.5 2.5 0 1 1-2.2 3.7"/><path d="M4 12h14a2.5 2.5 0 1 0-2.2-3.7"/><path d="M8 17h8a2.5 2.5 0 1 1-2.2 3.7"/>`
    },
    'brick-wall': {
        category: 'mechanical',
        title: 'Brick Wall / Structural Mechanics',
        hebrew: 'חומת לבנים וחוזק מבנים 🧱',
        keywords: 'wall brick structure materials civil קיר לבנים חוזק חומרים מבנים בטון',
        svg: `<rect x="3" y="4" width="18" height="16" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="4" x2="9" y2="9"/><line x1="15" y1="4" x2="15" y2="9"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="8" y1="15" x2="8" y2="20"/><line x1="16" y1="15" x2="16" y2="20"/>`
    },
    'train': {
        category: 'mechanical',
        title: 'High-Speed Rail / Transit Systems',
        hebrew: 'רכבת מהירה ותחבורה 🚆',
        keywords: 'train transit rail vehicle רכבת תחבורה מהירה מסילות',
        svg: `<rect x="4" y="3" width="16" height="15" rx="3"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8.5" cy="15" r="1.5"/><circle cx="15.5" cy="15" r="1.5"/><line x1="7" y1="21" x2="5" y2="18"/><line x1="17" y1="21" x2="19" y2="18"/><line x1="4" y1="7" x2="20" y2="7"/>`
    },
    'motorcycle': {
        category: 'mechanical',
        title: 'Motorcycle Dynamics',
        hebrew: 'אופנוע ודינמיקה דו-גלגלית 🏍️',
        keywords: 'motorcycle bike dynamics vehicle אופנוע דינמיקה תחבורה',
        svg: `<circle cx="5" cy="16" r="3"/><circle cx="19" cy="16" r="3"/><path d="M5 16l4-7h5l3 7M9 9l3 7h4M13 6h3"/>`
    },
    'helicopter': {
        category: 'mechanical',
        title: 'Helicopter / Rotorcraft Aerodynamics',
        hebrew: 'מסוק ואווירונאוטיקה 🚁',
        keywords: 'helicopter aero rotor flight flight mechanics מסוק אווירונאוטיקה תעופה',
        svg: `<line x1="4" y1="4" x2="20" y2="4"/><line x1="12" y1="4" x2="12" y2="8"/><path d="M6 13a5 5 0 0 0 10 0v-4H6v4zM16 11l6-2v4l-6-2M21 7v6M5 19h12M8 17v2M14 17v2"/>`
    },
    'gas-pump': {
        category: 'mechanical',
        title: 'Fuel Pump / Combustion & Engines',
        hebrew: 'משאבת דלק ומנועי בעירה ⛽',
        keywords: 'fuel gas pump combustion engine דלק משאבה מנועי בעירה אנרגיה',
        svg: `<path d="M3 21h10M4 21V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16M4 11h8M13 8l3-2a2 2 0 0 1 3 2v9a2 2 0 0 1-2 2h-1"/>`
    },
    'fire-extinguisher': {
        category: 'mechanical',
        title: 'Fire Extinguisher / Plant Safety',
        hebrew: 'מטף כיבוי ובטיחות מעבדות 🧯',
        keywords: 'fire extinguisher safety lab plant מטף כיבוי בטיחות מפעל מעבדה',
        svg: `<rect x="7" y="8" width="10" height="13" rx="4"/><line x1="12" y1="4" x2="12" y2="8"/><path d="M9 4h6M9 4l-4 2M12 4l3 1 3-1"/>`
    },
    'ship-helm': {
        category: 'mechanical',
        title: 'Ship Helm / Marine Control',
        hebrew: 'הגה ספינה והנדסה ימית ☸️',
        keywords: 'helm ship rudder marine control הגה ספינה הנדסה ימית שליטה',
        svg: `<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="19.1" y2="4.9"/>`
    },
    'anchor': {
        category: 'mechanical',
        title: 'Naval Anchor / Ocean Engineering',
        hebrew: 'עוגן ימי והנדסת אוקיינוסים ⚓',
        keywords: 'anchor ocean naval marine civil עוגן ימי ספנות הנדסה ימית',
        svg: `<circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="21"/><line x1="8" y1="11" x2="16" y2="11"/><path d="M4 13a8 8 0 0 0 16 0M3 13l2-1M21 13l-2-1"/>`
    },
    'inclined-plane': {
        category: 'physics',
        title: 'Inclined Plane / Classical Mechanics',
        hebrew: 'מישור משופע (מכניקה קלאסית 📐)',
        keywords: 'inclined plane ramp friction gravity newton מישור משופע חיכוך מכניקה פיזיקה 1 114051',
        svg: `<polygon points="3 20 21 20 21 7 3 20"/><rect x="12" y="9.5" width="4" height="3" rx="0.5" transform="rotate(-33 14 11)" fill="currentColor" fill-opacity="0.25"/>`
    },
    'horseshoe-magnet': {
        category: 'physics',
        title: 'Horseshoe Magnet / Electromagnetism',
        hebrew: 'מגנט פרסה (אלקטרומגנטיות 🧲)',
        keywords: 'magnet magnetism physics electromagnet מגנט שדה מגנטי פיזיקה 2 114075',
        svg: `<path d="M5 10V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5a1 1 0 0 0 2 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5c0 5-3.5 9-8.5 9S5 15 5 10z"/><line x1="5" y1="8" x2="9" y2="8"/><line x1="15" y1="8" x2="19" y2="8"/>`
    },
    'snowflake': {
        category: 'physics',
        title: 'Snowflake / Cryogenics & Heat Transfer',
        hebrew: 'פתית שלג וקירור ❄️',
        keywords: 'snowflake cold ice crypto freeze שלג קור מעבר חום קירור',
        svg: `<line x1="12" y1="2" x2="12" y2="22"/><line x1="3.3" y1="7" x2="20.7" y2="17"/><line x1="3.3" y1="17" x2="20.7" y2="7"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5M5.5 10.5L8 12l-.5 3.5M18.5 13.5L16 12l.5-3.5"/>`
    },
    'planet-ring': {
        category: 'physics',
        title: 'Saturn Planet / Astrodynamics',
        hebrew: 'כוכב שבתאי עם טבעות 🪐',
        keywords: 'planet saturn rings space orbit כוכב שבתאי חלל מסלולים אסטרונומיה',
        svg: `<circle cx="12" cy="12" r="6"/><path d="M2.5 15.5c4-4 15-4 19 0-4 4-15 4-19 0z"/>`
    },
    'sound-speaker': {
        category: 'physics',
        title: 'Acoustics & Sound Speaker',
        hebrew: 'רמקול ואקוסטיקה (גלי קול 🔊)',
        keywords: 'sound speaker wave audio acoustics רמקול קול אקוסטיקה גלים',
        svg: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/>`
    },
    'telescope-tripod': {
        category: 'physics',
        title: 'Telescope on Tripod / Space & Optics',
        hebrew: 'טלסקופ חלל ואופטיקה 🔭',
        keywords: 'telescope optics astronomy space טלסקופ אופטיקה חלל אסטרונומיה',
        svg: `<line x1="6" y1="14" x2="19" y2="5"/><polygon points="4 15 7 13 21 6 18 8 4 15"/><circle cx="13" cy="10" r="1.5"/><line x1="13" y1="11.5" x2="7" y2="21"/><line x1="13" y1="11.5" x2="19" y2="21"/><line x1="13" y1="11.5" x2="13" y2="21"/>`
    },
    'apple-gravity': {
        category: 'physics',
        title: 'Newton\'s Apple / Gravitation',
        hebrew: 'תפוח ניוטון וכבידה 🍏',
        keywords: 'apple newton gravity force physics 1 תפוח ניוטון כבידה כוחות פיזיקה 1',
        svg: `<path d="M12 4c1-2 2-2 3-2 0 1-1 2-2 3M12 21c-3.5 0-7-3-7-7.5C5 9 8.5 7 12 7c3.5 0 7 2 7 6.5 0 4.5-3.5 7.5-7 7.5z"/>`
    },
    'antenna': {
        category: 'physics',
        title: 'Radio Antenna / RF & Wireless',
        hebrew: 'אנטנת רדיו ותקשורת אלחוטית 📡',
        keywords: 'antenna radio rf wireless telecomm אנטנה שידור קליטה אלחוטי גלים',
        svg: `<line x1="12" y1="2" x2="12" y2="22"/><line x1="7" y1="5" x2="17" y2="5"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><circle cx="12" cy="2" r="1" fill="currentColor"/>`
    },
    'plug': {
        category: 'physics',
        title: 'Electric Plug & Circuits',
        hebrew: 'תקע חשמלי ומעגלים 🔌',
        keywords: 'plug electric circuit power electronics תקע חשמל מעגלים אלקטרוניקה',
        svg: `<rect x="6" y="8" width="12" height="8" rx="2"/><line x1="9" y1="4" x2="9" y2="8"/><line x1="15" y1="4" x2="15" y2="8"/><path d="M12 16v5a1 1 0 0 1-1 1H8"/>`
    },
    'pill': {
        category: 'chemistry',
        title: 'Medicine Pill / Pharmacology & Bio',
        hebrew: 'גלולה ופרמקולוגיה 💊',
        keywords: 'pill capsule medicine bio pharma גלולה תרופה ביו כימיה פרמקולוגיה',
        svg: `<line x1="6.5" y1="17.5" x2="17.5" y2="6.5"/><path d="M9.5 4.5l-5 5a5 5 0 1 0 7 7l5-5a5 5 0 0 0-7-7z"/>`
    },
    'syringe': {
        category: 'chemistry',
        title: 'Syringe / Biomedical Engineering',
        hebrew: 'מזרק והנדסה ביו-רפואית 💉',
        keywords: 'syringe medical bio injection biomedical מזרק הנדסה ביו רפואית רפואה',
        svg: `<line x1="18" y1="2" x2="22" y2="6"/><line x1="14" y1="6" x2="18" y2="10"/><path d="M15 9l-8.5 8.5H4v-2.5L12.5 6.5M10 14l3-3M2 22l3.5-3.5"/>`
    },
    'lungs': {
        category: 'chemistry',
        title: 'Lungs / Biomechanics & Physiology',
        hebrew: 'ריאות וביומכניקה של הנשימה 🫁',
        keywords: 'lungs anatomy biomechanics physiology ריאות ביומכניקה פיזיולוגיה',
        svg: `<path d="M12 4v8M12 7c-2 0-4 1-5 3v5a4 4 0 0 0 6 3.5M12 7c2 0 4 1 5 3v5a4 4 0 0 1-6 3.5"/>`
    },
    'soccer-ball': {
        category: 'sports',
        title: 'Soccer Ball / Team Sports',
        hebrew: 'כדורגל וספורט קבוצתי ⚽',
        keywords: 'soccer football ball sport game כדורגל ספורט משחקי כדור',
        svg: `<circle cx="12" cy="12" r="9"/><polygon points="12 8 15 10.5 14 14 10 14 9 10.5 12 8" fill="currentColor" fill-opacity="0.25"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="15" y1="10.5" x2="19.5" y2="8.5"/><line x1="14" y1="14" x2="17.5" y2="17.5"/><line x1="10" y1="14" x2="6.5" y2="17.5"/><line x1="9" y1="10.5" x2="4.5" y2="8.5"/>`
    },
    'tennis-ball': {
        category: 'sports',
        title: 'Tennis & Racquet Sports',
        hebrew: 'טניס ומשחקי מחבט 🎾',
        keywords: 'tennis ball racquet sport טניס מחבט כדור ספורט',
        svg: `<circle cx="12" cy="12" r="9"/><path d="M6 4.5a10 10 0 0 1 0 15M18 4.5a10 10 0 0 0 0 15"/>`
    },
    'basketball': {
        category: 'sports',
        title: 'Basketball / Court Sports',
        hebrew: 'כדורסל וספורט אולמות 🏀',
        keywords: 'basketball ball court sport כדורסל משחקי כדור ספורט',
        svg: `<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/><path d="M5.5 5.5a10.5 10.5 0 0 1 0 13M18.5 5.5a10.5 10.5 0 0 0 0 13"/>`
    },
    'snorkel': {
        category: 'sports',
        title: 'Snorkel & Diving Mask',
        hebrew: 'שנורקל ומסכת צלילה 🤿',
        keywords: 'snorkel diving mask water swim צלילה שנורקל מים בריכה ספורט',
        svg: `<path d="M19 3v13a4 4 0 0 1-8 0v-2"/><path d="M4 8h10a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="11.5" cy="11.5" r="1.5"/>`
    },
    'sailboat': {
        category: 'sports',
        title: 'Sailboat & Maritime Navigation',
        hebrew: 'מפרשית ושיט ימי ⛵',
        keywords: 'sailboat sail boat yacht navigation שיט מפרשית ימאות ספורט',
        svg: `<path d="M3 18l2 3h14l2-3H3z"/><line x1="12" y1="3" x2="12" y2="18"/><polygon points="12 4 19 14 12 14 12 4" fill="currentColor" fill-opacity="0.2"/><polygon points="11 6 5 15 11 15 11 6"/>`
    },
    'mountain': {
        category: 'sports',
        title: 'Mountain Peak & Outdoor Navigation',
        hebrew: 'פסגת הר וניווט שטח ⛰️',
        keywords: 'mountain peak hike trail navigation הר פסגה טיולים ניווט שטח',
        svg: `<polygon points="8 3 1 18 15 18 8 3"/><polygon points="16 7 11 18 21 18 16 7"/><polyline points="5.5 13 8 11 10.5 13"/><polyline points="14 13 16 11 18 13"/>`
    },
    'whistle': {
        category: 'sports',
        title: 'Referee Whistle & Coaching',
        hebrew: 'משרוקית אימון ושיפוט',
        keywords: 'whistle coach referee training משרוקית מאמן אימון ספורט',
        svg: `<circle cx="8" cy="14" r="5"/><path d="M13 14h8v-4h-9.5"/><circle cx="8" cy="14" r="2" fill="currentColor"/><path d="M5 10.5L3 8"/>`
    },
    'yin-yang': {
        category: 'sports',
        title: 'Yin Yang / Balance & Mind-Body',
        hebrew: 'יין ויאנג (איזון גוף ונפש ☯️)',
        keywords: 'yin yang balance tao meditation יין יאנג איזון מדיטציה גוף ונפש',
        svg: `<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9" fill="currentColor" fill-opacity="0.3"/><circle cx="12" cy="7.5" r="1.5" fill="currentColor"/><circle cx="12" cy="16.5" r="1.5" fill="currentColor"/>`
    },
    'university-hall': {
        category: 'academic',
        title: 'Classical Academy / Faculty Hall',
        hebrew: 'בניין הפקולטה והאקדמיה 🏛️',
        keywords: 'academy university campus hall columns בניין פקולטה אקדמיה טכניון קמפוס',
        svg: `<polygon points="12 3 2 8 22 8 12 3"/><line x1="4" y1="8" x2="4" y2="18"/><line x1="9" y1="8" x2="9" y2="18"/><line x1="15" y1="8" x2="15" y2="18"/><line x1="20" y1="8" x2="20" y2="18"/><line x1="2" y1="18" x2="22" y2="18"/><line x1="1" y1="21" x2="23" y2="21"/>`
    },
    'chalkboard-easel': {
        category: 'academic',
        title: 'Lecture Whiteboard / Presentation',
        hebrew: 'לוח הרצאות ומצגת 🖼️',
        keywords: 'board easel presentation lecture class לוח הרצאה מצגת כיתה שיעור',
        svg: `<rect x="4" y="4" width="16" height="11" rx="1"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="7" y1="15" x2="4" y2="21"/><line x1="17" y1="15" x2="20" y2="21"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="8" y1="8" x2="13" y2="8"/><line x1="8" y1="11" x2="16" y2="11"/>`
    },
    'laptop': {
        category: 'academic',
        title: 'Laptop Computer / Digital Study',
        hebrew: 'מחשב נייד ולמידה 💻',
        keywords: 'laptop computer study code work מחשב נייד למידה עבודה',
        svg: `<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 19h20a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1z"/>`
    },
    'keyboard': {
        category: 'academic',
        title: 'Computer Keyboard / Typing',
        hebrew: 'מקלדת מחשב ⌨️',
        keywords: 'keyboard typing input computer מקלדת הקלדה מחשב',
        svg: `<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="9" x2="6" y2="9.01"/><line x1="10" y1="9" x2="10" y2="9.01"/><line x1="14" y1="9" x2="14" y2="9.01"/><line x1="18" y1="9" x2="18" y2="9.01"/><line x1="6" y1="12" x2="6" y2="12.01"/><line x1="10" y1="12" x2="10" y2="12.01"/><line x1="14" y1="12" x2="14" y2="12.01"/><line x1="18" y1="12" x2="18" y2="12.01"/><line x1="8" y1="15" x2="16" y2="15"/>`
    },
    'paper-plane': {
        category: 'academic',
        title: 'Paper Airplane / Project Launch',
        hebrew: 'מטוס נייר והגשת פרויקט ✈️',
        keywords: 'paper plane send aero fly aeronautics מטוס נייר שיגור הגשה פרויקט',
        svg: `<polygon points="22 2 11 13 22 2"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>`
    },
    'languages': {
        category: 'academic',
        title: 'Languages & Technical English',
        hebrew: 'שפות וכתיבה טכנית (עברית ואנגלית 文/A)',
        keywords: 'language translate english hebrew שפות תרגום אנגלית טכנית הומניסטי עברית',
        svg: `<path d="M5 8h8M9 5v3c0 4-2 7-5 9M7 13c1.5-1.5 2.5-3.5 3-5M15 19l4-9 4 9M16.5 16h5"/>`
    },
    'pushpin': {
        category: 'academic',
        title: 'Pushpin / Notice & Priority',
        hebrew: 'נעץ ותזכורת חשובה 📌',
        keywords: 'pushpin pin notice reminder priority נעץ לוח מודעות תזכורת',
        svg: `<path d="M16 3l5 5-2.5 2.5-1-1L13 14l1 3-2 2-4-4-4 4-2-2 4-4-4-4 2-2 3 1 4.5-4.5-1-1L16 3z"/>`
    },
    'menorah': {
        category: 'academic',
        title: 'Menorah / Heritage & Culture Elective',
        hebrew: 'מנורת שבעת הקנים (מורשת ותרבות 🕎)',
        keywords: 'menorah israel culture heritage menorah מנורה מורשת תרבות הומניסטי שבעת הקנים',
        svg: `<line x1="12" y1="3" x2="12" y2="21"/><path d="M9 6v3a3 3 0 0 0 6 0V6M6 8v2a6 6 0 0 0 12 0V8M3 10v1a9 9 0 0 0 18 0v-1"/><line x1="8" y1="21" x2="16" y2="21"/><circle cx="12" cy="2.5" r="0.8" fill="currentColor"/><circle cx="9" cy="5.5" r="0.8" fill="currentColor"/><circle cx="15" cy="5.5" r="0.8" fill="currentColor"/><circle cx="6" cy="7.5" r="0.8" fill="currentColor"/><circle cx="18" cy="7.5" r="0.8" fill="currentColor"/><circle cx="3" cy="9.5" r="0.8" fill="currentColor"/><circle cx="21" cy="9.5" r="0.8" fill="currentColor"/>`
    },
    'stopwatch': {
        category: 'academic',
        title: 'Stopwatch / Exam Time Management',
        hebrew: 'סטופר וניהול זמנים במבחן ⏱️',
        keywords: 'stopwatch timer countdown exam זמן שעון עצר מבחן טיימר',
        svg: `<circle cx="12" cy="13" r="8"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="13" x2="15" y2="15"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="10" y1="2" x2="14" y2="2"/>`
    },
    'gamepad': {
        category: 'academic',
        title: 'Gamepad Controller / Graphics & Gaming',
        hebrew: 'שלט משחק וגרפיקה ממוחשבת 🎮',
        keywords: 'gamepad game controller graphics משחקים גרפיקה שלט פנאי',
        svg: `<path d="M6 11h4M8 9v4M15 11h.01M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="6"/>`
    },
    'music-notes': {
        category: 'academic',
        title: 'Music Notes / Acoustics & Arts',
        hebrew: 'תווי מוזיקה ואמנות 🎵',
        keywords: 'music note sound tune art מוזיקה תווים שיר אקוסטיקה הומניסטי',
        svg: `<circle cx="6" cy="18" r="3"/><circle cx="18" cy="15" r="3"/><line x1="9" y1="18" x2="9" y2="6"/><line x1="21" y1="15" x2="21" y2="3"/><polygon points="9 6 21 3 21 6 9 9" fill="currentColor"/>`
    },
    'theater-masks': {
        category: 'academic',
        title: 'Theater Masks / Humanities & Arts',
        hebrew: 'מסכות תיאטרון ומדעי הרוח 🎭',
        keywords: 'theater masks drama culture arts drama תיאטרון דרמה אמנות קורס הומניסטי',
        svg: `<path d="M3 10a5 5 0 0 1 10 0v2a5 5 0 0 1-10 0v-2z"/><circle cx="6" cy="10" r="0.8" fill="currentColor"/><circle cx="10" cy="10" r="0.8" fill="currentColor"/><path d="M6 13c.7.7 1.3.7 2 0"/><path d="M13 6a5 5 0 0 1 8 0v2a5 5 0 0 1-8 0V6z"/><circle cx="15.5" cy="7.5" r="0.8" fill="currentColor"/><circle cx="18.5" cy="7.5" r="0.8" fill="currentColor"/><path d="M16 10c.5-.5 1-.5 1.5 0"/>`
    },
    'gavel': {
        category: 'academic',
        title: 'Gavel / Engineering Ethics & Law',
        hebrew: 'פטיש שופטים (אתיקה ומשפט ⚖️)',
        keywords: 'gavel law justice ethics judge פטיש שופט אתיקה משפט הנדסי',
        svg: `<path d="M14 13l5-5-2-2-5 5M7 16l4-4M3 20l4-4M16 6l2-2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8l-2 2"/>`
    },
    'grade-a': {
        category: 'academic',
        title: 'Grade A+ / Academic Excellence',
        hebrew: 'ציון A+ והצטיינות במבחנים 📄',
        keywords: 'grade a plus exam test gpa 100 ציון פקטור הצטיינות מבחן מאה',
        svg: `<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 15l3-7 3 7M9 13h4M17 9v4M15 11h4"/>`
    },
    'alarm-clock': {
        category: 'academic',
        title: 'Alarm Clock / Morning Deadlines',
        hebrew: 'שעון מעורר ודד-ליין ⏰',
        keywords: 'alarm clock deadline time wakeup שעון מעורר זמן השכמה הגשה',
        svg: `<circle cx="12" cy="13" r="7"/><polyline points="12 9 12 13 14 15"/><path d="M5 3L2 6M19 3l3 3M7 20l-2 2M17 20l2 2"/>`
    },
    'backpack': {
        category: 'academic',
        title: 'Student Backpack / Campus Gear',
        hebrew: 'תיק גב סטודנטיאלי 🎒',
        keywords: 'backpack bag campus study school תיק גב לימודים קמפוס',
        svg: `<rect x="5" y="8" width="14" height="13" rx="3"/><path d="M9 8V5a3 3 0 0 1 6 0v3M9 13h6v4H9z"/>`
    },
    'bar-chart': {
        category: 'academic',
        title: 'Bar Chart / Statistics & Analytics',
        hebrew: 'גרף עמודות וסטטיסטיקה 📊',
        keywords: 'bar chart stats analytics data גרף עמודות סטטיסטיקה ניתוח נתונים',
        svg: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="3" y1="20" x2="21" y2="20"/>`
    },
    'line-chart': {
        category: 'academic',
        title: 'Trend Line Graph / Performance',
        hebrew: 'גרף מגמה ושיפור ביצועים 📈',
        keywords: 'line chart trend graph performance growth גרף מגמה עלייה שיפור ביצועים',
        svg: `<path d="M3 3v18h18"/><polyline points="18 9 13 14 9 10 5 14"/><polyline points="14 9 18 9 18 13"/>`
    },
    'pie-chart': {
        category: 'academic',
        title: 'Pie Chart / Distributions',
        hebrew: 'דיאגרמת עוגה והתפלגות 🥧',
        keywords: 'pie chart share distribution stats דיאגרמת עוגה התפלגות נתונים',
        svg: `<path d="M21.2 15.8A10 10 0 1 1 11 2.8V12h9.2a9.9 9.9 0 0 1 1 3.8z"/><path d="M14 2.2A10 10 0 0 1 21.8 10H14V2.2z"/>`
    },
    'chess-knight': {
        category: 'academic',
        title: 'Chess Knight / Strategy & Logic',
        hebrew: 'פרש שחמט ואסטרטגיה ♞',
        keywords: 'chess knight strategy game logic שחמט פרש אסטרטגיה היגיון משחקים',
        svg: `<path d="M8 20h8M9 20v-3c0-1-1-2-2-3-1.5-1.5-1-4 1-5l1-1V5c0-1 1-2 2-2 2 0 4 2 4 5 0 2-1 3-1 5 1 1 1 2 1 4v3"/>`
    },
    'paperclip': {
        category: 'academic',
        title: 'Paperclip / File Attachments',
        hebrew: 'מהדק ניירות וקבצים מצורפים 📎',
        keywords: 'paperclip clip attach file מהדק נייר קובץ מצורף הגשה',
        svg: `<path d="M21.4 11.1l-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7L9.4 17.5a2 2 0 0 1-2.8-2.8l8.5-8.5"/>`
    },
    'feather-quill': {
        category: 'academic',
        title: 'Feather Quill / Scientific Writing',
        hebrew: 'נוצת כתיבה אקדמית 🪶',
        keywords: 'feather quill pen write essay נוצה כתיבה חיבור אקדמי מאמר',
        svg: `<path d="M20.2 3.8C15 4 10 8 7 13l-4 8 8-4c5-3 9-8 9.2-13.2z"/><line x1="7" y1="17" x2="13" y2="11"/>`
    },
    'clover': {
        category: 'academic',
        title: 'Four-Leaf Clover / Exam Luck',
        hebrew: 'תלתן 4 עלים והצלחה במבחנים 🍀',
        keywords: 'clover luck success exam תלתן מזל הצלחה מבחן',
        svg: `<path d="M12 12c-2-3-5-3-7-1s-2 5 1 7c2 1 5 1 6-2m0-4c3-2 3-5 1-7s-5-2-7 1c-1 2-1 5 2 6m4 0c2 3 5 3 7 1s2-5-1-7c-2-1-5-1-6 2m0 4c-3 2-3 5-1 7s5 2 7-1c1-2 1-5-2-6M12 14v8"/>`
    },
    'camera': {
        category: 'academic',
        title: 'Camera / Vision & Photography Lab',
        hebrew: 'מצלמה ומעבדת ראייה ממוחשבת 📷',
        keywords: 'camera photo vision lab מצלמה צילום מעבדה ראייה ממוחשבת',
        svg: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`
    },
    'headphones': {
        category: 'academic',
        title: 'Headphones / Focus & Study Flow',
        hebrew: 'אוזניות וריכוז בלמידה 🎧',
        keywords: 'headphones audio sound focus music אוזניות מוזיקה ריכוז למידה',
        svg: `<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>`
    }
};

// State variables for active icon customizer modal
let activeIconPickerCourseCode = null;
let activeIconPickerKey = 'book';
let activeIconPickerColor = '#3b82f6';
let activeIconPickerCategory = 'all';
let activeIconPickerSearch = '';

function getCourseNotionIconHtml(courseCode) {
    if (!courseCode) return `<span class="notion-course-icon">📘</span>`;
    
    // 1. Check custom user icon in gameState
    if (window.gameState && gameState.courseCustomIcons && gameState.courseCustomIcons[courseCode]) {
        const custom = gameState.courseCustomIcons[courseCode];
        const iconDef = NOTION_ICON_LIBRARY[custom.iconKey];
        if (iconDef) {
            return `<span class="notion-course-icon" data-course-code="${courseCode}" title="לחץ לשינוי סמל וצבע הקורס" style="color: ${custom.color};"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="${custom.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconDef.svg}</svg></span>`;
        }
    }
    
    // 2. Predefined default in COURSE_NOTION_ICONS
    const defaultDef = COURSE_NOTION_ICONS[courseCode];
    if (defaultDef) {
        return `<span class="notion-course-icon" data-course-code="${courseCode}" title="לחץ לשינוי סמל וצבע הקורס" style="color: ${defaultDef.color};">${defaultDef.svg}</span>`;
    }
    
    // 3. Fallback generic academic book
    return `<span class="notion-course-icon" data-course-code="${courseCode}" title="לחץ לשינוי סמל וצבע הקורס" style="color: #3b82f6;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>`;
}

// Find default icon key for existing course
function getDefaultCourseIconKey(courseCode) {
    if (courseCode === '104131') return 'sigma';
    if (['104043', '104041', '104013'].includes(courseCode)) return 'curve';
    if (['104166', '104016', '104065'].includes(courseCode)) return 'matrix';
    if (courseCode === '104228' || courseCode === '104136') return 'nabla';
    if (courseCode === '114052') return 'lightning';
    if (courseCode === '114051') return 'orbit';
    if (courseCode === '114032') return 'laser';
    if (courseCode === '125001' || courseCode === '125013') return 'flask';
    if (courseCode === '314533' || courseCode === '314534') return 'lattice';
    if (['034028', '034053', '034015'].includes(courseCode)) return 'bridge';
    if (courseCode === '034061') return 'dual-gears';
    if (courseCode === '034056' || courseCode === '034042') return 'calc-scientific';
    if (courseCode === '034035') return 'flame';
    if (courseCode === '034010') return 'dynamics';
    if (courseCode === '034055') return 'streamlines';
    if (courseCode === '034032') return 'waveform';
    if (courseCode === '034041') return 'heat-radiation';
    if (courseCode === '034040') return 'control-loop';
    if (courseCode === '034054') return 'caliper';
    if (courseCode === '034058') return 'bell-curve';
    if (courseCode === '034051') return 'harmonic-wave';
    if (courseCode === '034060') return 'mechatronics';
    if (courseCode === '034057') return 'test-probe';
    if (courseCode === '03940805' || courseCode === '3940805') return 'lotus';
    if (courseCode === '234128') return 'code';
    if (['034371', '034379', '034382', '034380', '034383'].includes(courseCode)) return 'trophy';
    return 'book';
}

function openCourseIconPicker(courseCode) {
    if (!courseCode) return;
    activeIconPickerCourseCode = courseCode;
    activeIconPickerCategory = 'all';
    activeIconPickerSearch = '';
    
    // Determine active icon key and color
    if (window.gameState && gameState.courseCustomIcons && gameState.courseCustomIcons[courseCode]) {
        activeIconPickerKey = gameState.courseCustomIcons[courseCode].iconKey || getDefaultCourseIconKey(courseCode);
        activeIconPickerColor = gameState.courseCustomIcons[courseCode].color || '#3b82f6';
    } else if (COURSE_NOTION_ICONS[courseCode]) {
        activeIconPickerKey = getDefaultCourseIconKey(courseCode);
        activeIconPickerColor = COURSE_NOTION_ICONS[courseCode].color || '#3b82f6';
    } else {
        activeIconPickerKey = 'book';
        activeIconPickerColor = '#3b82f6';
    }
    
    // Set course name / title
    const courseObj = (window.gameState && gameState.courses && gameState.courses[courseCode]) || null;
    const courseName = courseObj ? courseObj.name : (HEBREW_COURSE_NAMES[courseCode] || courseCode);
    const titleEl = document.getElementById('icon-picker-course-title');
    if (titleEl) {
        titleEl.innerText = `${courseName} (${courseCode})`;
    }
    
    // Clear search input
    const searchInput = document.getElementById('icon-picker-search');
    const clearBtn = document.getElementById('btn-clear-icon-search');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    
    // Reset category pills
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(p => {
        if (p.dataset.cat === 'all') {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });
    
    renderIconPickerPalette();
    renderIconPickerGrid();
    updateIconPickerPreview();
    
    const modal = document.getElementById('notion-icon-picker-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeCourseIconPicker() {
    const modal = document.getElementById('notion-icon-picker-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    activeIconPickerCourseCode = null;
}

function renderIconPickerPalette() {
    const paletteContainer = document.getElementById('notion-color-palette');
    if (!paletteContainer) return;
    
    paletteContainer.innerHTML = NOTION_COLORS.map(c => `
        <div class="color-circle ${c.hex.toLowerCase() === activeIconPickerColor.toLowerCase() ? 'active' : ''}" 
             data-hex="${c.hex}" 
             title="${c.label}" 
             style="background: ${c.hex};"></div>
    `).join('');
}

function renderIconPickerGrid() {
    const gridContainer = document.getElementById('icon-picker-grid');
    if (!gridContainer) return;
    
    const query = activeIconPickerSearch.trim().toLowerCase();
    const cat = activeIconPickerCategory;
    
    const matchingKeys = Object.keys(NOTION_ICON_LIBRARY).filter(key => {
        const item = NOTION_ICON_LIBRARY[key];
        if (cat !== 'all' && item.category !== cat) return false;
        if (!query) return true;
        const haystack = `${key} ${item.title} ${item.hebrew} ${item.keywords}`.toLowerCase();
        return haystack.includes(query);
    });
    
    if (matchingKeys.length === 0) {
        gridContainer.innerHTML = `<div class="icon-picker-empty">לא נמצאו סמלים תואמים לחיפוש "${query}"</div>`;
        return;
    }
    
    gridContainer.innerHTML = matchingKeys.map(key => {
        const item = NOTION_ICON_LIBRARY[key];
        const isSelected = key === activeIconPickerKey;
        return `
            <div class="icon-grid-item ${isSelected ? 'selected' : ''}" data-icon-key="${key}" title="${item.hebrew} (${item.title})" style="color: ${activeIconPickerColor};">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${activeIconPickerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${item.svg}
                </svg>
            </div>
        `;
    }).join('');
}

function updateIconPickerPreview() {
    const previewBox = document.getElementById('icon-picker-preview-box');
    const descEl = document.getElementById('icon-picker-selected-desc');
    if (!previewBox) return;
    
    const iconDef = NOTION_ICON_LIBRARY[activeIconPickerKey] || NOTION_ICON_LIBRARY['book'];
    previewBox.style.color = activeIconPickerColor;
    previewBox.style.borderColor = activeIconPickerColor;
    previewBox.style.boxShadow = `0 0 12px ${activeIconPickerColor}33`;
    previewBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="${activeIconPickerColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            ${iconDef.svg}
        </svg>
    `;
    
    if (descEl && iconDef) {
        descEl.innerHTML = `<span style="color: ${activeIconPickerColor}; font-weight: 700;">${iconDef.hebrew}</span> • <span style="color: #94a3b8;">${iconDef.title}</span>`;
    }
}

function saveCourseIcon() {
    if (!activeIconPickerCourseCode || !activeIconPickerKey || !activeIconPickerColor) return;
    if (!window.gameState) return;
    if (!gameState.courseCustomIcons) {
        gameState.courseCustomIcons = {};
    }
    
    gameState.courseCustomIcons[activeIconPickerCourseCode] = {
        iconKey: activeIconPickerKey,
        color: activeIconPickerColor
    };
    
    saveState();
    
    // Refresh views that display course icons
    if (typeof renderNotionTasksTable === 'function') {
        renderNotionTasksTable();
    }
    if (typeof renderNotionCalendarMonthView === 'function') {
        renderNotionCalendarMonthView();
    }
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
    
    closeCourseIconPicker();
}

function resetCourseIcon() {
    if (!activeIconPickerCourseCode || !window.gameState) return;
    if (gameState.courseCustomIcons && gameState.courseCustomIcons[activeIconPickerCourseCode]) {
        delete gameState.courseCustomIcons[activeIconPickerCourseCode];
        saveState();
        if (typeof renderNotionTasksTable === 'function') {
            renderNotionTasksTable();
        }
        if (typeof renderNotionCalendarMonthView === 'function') {
            renderNotionCalendarMonthView();
        }
        if (typeof updateDashboardStats === 'function') {
            updateDashboardStats();
        }
    }
    closeCourseIconPicker();
}

function setupNotionIconPickerEvents() {
    // 1. Close & Cancel buttons
    const closeBtn = document.getElementById('btn-close-icon-picker');
    const cancelBtn = document.getElementById('btn-cancel-icon-picker');
    const modal = document.getElementById('notion-icon-picker-modal');
    
    if (closeBtn) closeBtn.addEventListener('click', closeCourseIconPicker);
    if (cancelBtn) cancelBtn.addEventListener('click', closeCourseIconPicker);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCourseIconPicker();
            }
        });
    }
    
    // 2. Save & Reset buttons
    const saveBtn = document.getElementById('btn-save-course-icon');
    const resetBtn = document.getElementById('btn-reset-course-icon');
    if (saveBtn) saveBtn.addEventListener('click', saveCourseIcon);
    if (resetBtn) resetBtn.addEventListener('click', resetCourseIcon);
    
    // 3. Color palette selection
    const palette = document.getElementById('notion-color-palette');
    if (palette) {
        palette.addEventListener('click', (e) => {
            const circle = e.target.closest('.color-circle');
            if (circle && circle.dataset.hex) {
                activeIconPickerColor = circle.dataset.hex;
                renderIconPickerPalette();
                renderIconPickerGrid();
                updateIconPickerPreview();
            }
        });
    }
    
    // 4. Icon grid selection & hover details
    const grid = document.getElementById('icon-picker-grid');
    const descEl = document.getElementById('icon-picker-selected-desc');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const item = e.target.closest('.icon-grid-item');
            if (item && item.dataset.iconKey) {
                activeIconPickerKey = item.dataset.iconKey;
                renderIconPickerGrid();
                updateIconPickerPreview();
            }
        });

        grid.addEventListener('mouseover', (e) => {
            const item = e.target.closest('.icon-grid-item');
            if (item && item.dataset.iconKey && NOTION_ICON_LIBRARY[item.dataset.iconKey] && descEl) {
                const hoveredDef = NOTION_ICON_LIBRARY[item.dataset.iconKey];
                descEl.innerHTML = `<span style="color: ${activeIconPickerColor}; font-weight: 700;">${hoveredDef.hebrew}</span> • <span style="color: #cbd5e1;">${hoveredDef.title}</span>`;
            }
        });

        grid.addEventListener('mouseleave', () => {
            updateIconPickerPreview();
        });
    }
    
    // 5. Category pills
    const categoriesContainer = document.getElementById('icon-picker-categories');
    if (categoriesContainer) {
        categoriesContainer.addEventListener('click', (e) => {
            const pill = e.target.closest('.category-pill');
            if (pill && pill.dataset.cat) {
                document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeIconPickerCategory = pill.dataset.cat;
                renderIconPickerGrid();
            }
        });
    }
    
    // 6. Search filtering
    const searchInput = document.getElementById('icon-picker-search');
    const clearBtn = document.getElementById('btn-clear-icon-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            activeIconPickerSearch = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = activeIconPickerSearch ? 'block' : 'none';
            }
            renderIconPickerGrid();
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                activeIconPickerSearch = '';
                clearBtn.style.display = 'none';
                renderIconPickerGrid();
                searchInput.focus();
            }
        });
    }
    
    // 7. Click delegation for course icons & course tags across workspace
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.notion-course-icon') || e.target.closest('.notion-course-tag');
        if (trigger) {
            // Avoid triggering when user clicks contenteditable, input, button, or task badge
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'BUTTON' || 
                e.target.isContentEditable || 
                e.target.closest('.notion-title-editable') || 
                e.target.closest('.notion-task-badge') ||
                e.target.closest('.notion-status-pill')) {
                return;
            }
            const courseCode = trigger.dataset.courseCode || trigger.getAttribute('data-course-code');
            if (courseCode) {
                e.stopPropagation();
                openCourseIconPicker(courseCode);
            }
        }
    });
}

// Generates dedicated task type badge (WWW for WebWork, Exam, Lab, Project, Homework)
function getTaskTypeBadgeHtml(task) {
    const title = (task.title || "").toLowerCase();
    const type = task.type || "";
    
    // 1. WebWork: dedicated "planet with lines" WWW globe icon
    if (title.includes("webwork") || type === "webwork") {
        return `<span class="notion-task-badge webwork" title="WebWork"><span class="badge-icon">🌐</span><span class="badge-text">WebWork</span></span>`;
    }
    
    // 2. Exam: official exam indicator
    if (type === "exam" || title.includes("מועד") || title.includes("מבחן")) {
        const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
        return `<span class="notion-task-badge exam ${isDone ? 'done' : ''}" title="מבחן סמסטר"><span class="badge-icon">🎓</span><span class="badge-text">${isDone ? 'הושלם' : 'מבחן'}</span></span>`;
    }
    
    // 3. Lab: Microscope / Flask
    if (type === "lab" || title.includes("מעבדה") || title.includes("דוח") || title.includes("דו\"ח")) {
        return `<span class="notion-task-badge lab" title="מעבדה / דו&quot;ח"><span class="badge-icon">🧪</span><span class="badge-text">מעבדה</span></span>`;
    }
    
    // 4. Project: Shield / Engineering Project
    if (type === "project" || title.includes("פרויקט") || title.includes("פרוייקט")) {
        return `<span class="notion-task-badge project" title="פרויקט"><span class="badge-icon">🚀</span><span class="badge-text">פרויקט</span></span>`;
    }
    
    // 5. Homework / Sheet (גיליון / תרגיל בית)
    if (title.includes("גיליון") || title.includes("תרגיל בית") || title.includes("מטלת בית") || title.includes("מטלה") || type === "hw") {
        return `<span class="notion-task-badge hw" title="שיעורי בית / גיליון"><span class="badge-icon">📝</span><span class="badge-text">גיליון</span></span>`;
    }
    
    return `<span class="notion-task-badge general" title="משימה"><span class="badge-icon">📋</span><span class="badge-text">משימה</span></span>`;
}

// Academic Skill Tree - Core JS logic

// Initial state structure
const INITIAL_STATE = {
    characterClass: "סטודנט למדעי המחשב",
    xp: 0,
    level: 1,
    credits: 0,
    completedCourses: 0,
    bossesSlain: 0,
    courses: {}
};

let gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
window.gameState = gameState;
let currentViewMode = 'flowchart'; // 'flowchart' | 'constellation' | 'grid'
let currentHoveredCourseCode = null;
let currentCalendarMonth = 7; // 0-indexed: 7 = August
let currentCalendarYear = 2026;
let currentRunwayView = 'calendar';

// XP needed for next level
function getXpNeeded(level) {
    if (level === 1) return 300;
    if (level === 2) return 600;
    if (level === 3) return 1000;
    if (level === 4) return 1500;
    if (level === 5) return 2100;
    if (level === 6) return 2800;
    if (level === 7) return 3600;
    return level * 1000;
}

// Hebrew Semester Labels
const SEMESTER_LABELS = {
    1: "שנה א' - סמסטר א'",
    2: "שנה א' - סמסטר ב'",
    3: "שנה ב' - סמסטר ג'",
    4: "שנה ב' - סמסטר ד'",
    5: "שנה ג' - סמסטר ה'",
    6: "שנה ג' - סמסטר ו'",
    7: "שנה ד' - סמסטר ז'",
    8: "שנה ד' - סמסטר ח'"
};

// Course Status Labels
const STATUS_LABELS = {
    'locked': 'נעול 🔒',
    'available': 'פתוח לרישום 📖',
    'active': 'פעיל ⚔️',
    'mastered': 'הושלם 🏆'
};

// Default sample CS Degree data
const SAMPLE_CS_DEGREE = {};
const SAMPLE_CS_DEGREE_DISABLED = {
    "cs101": {
        code: "cs101",
        name: "מבוא למדעי המחשב",
        credits: 4,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "cs101_h1", title: "תרגיל בית 1: משתנים ותנאים", type: "hw", xp: 50, completed: false },
            { id: "cs101_h2", title: "תרגיל בית 2: לולאות ומערכים", type: "hw", xp: 50, completed: false },
            { id: "cs101_p1", title: "פרויקט אמצע: מיני-משחק פייתון", type: "project", xp: 150, completed: false },
            { id: "cs101_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "math101": {
        code: "math101",
        name: "חדו\"א 1",
        credits: 5,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "math101_h1", title: "תרגיל בית 1: גבולות ורציפות", type: "hw", xp: 50, completed: false },
            { id: "math101_h2", title: "תרגיל בית 2: נגזרות ומשפטים", type: "hw", xp: 50, completed: false },
            { id: "math101_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "math102": {
        code: "math102",
        name: "מתמטיקה דיסקרטית",
        credits: 4,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "math102_h1", title: "תרגיל בית 1: לוגיקה ותורת הקבוצות", type: "hw", xp: 50, completed: false },
            { id: "math102_h2", title: "תרגיל בית 2: קומבינטוריקה ויחסים", type: "hw", xp: 50, completed: false },
            { id: "math102_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "cs102": {
        code: "cs102",
        name: "מבני נתונים",
        credits: 4,
        semester: 2,
        prerequisites: ["cs101"],
        status: "locked",
        tasks: [
            { id: "cs102_h1", title: "תרגיל בית 1: רשימות מקושרות וערימות", type: "hw", xp: 60, completed: false },
            { id: "cs102_h2", title: "תרגיל בית 2: עצי חיפוש בינאריים", type: "hw", xp: 60, completed: false },
            { id: "cs102_p1", title: "פרויקט תכנות: מימוש עץ AVL ומפות גיבוב", type: "project", xp: 180, completed: false },
            { id: "cs102_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "math103": {
        code: "math103",
        name: "חדו\"א 2",
        credits: 5,
        semester: 2,
        prerequisites: ["math101"],
        status: "locked",
        tasks: [
            { id: "math103_h1", title: "תרגיל בית 1: אינטגרלים רב-ממדיים", type: "hw", xp: 50, completed: false },
            { id: "math103_h2", title: "תרגיל בית 2: טורים והתכנסות", type: "hw", xp: 50, completed: false },
            { id: "math103_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "math104": {
        code: "math104",
        name: "אלגברה ליניארית",
        credits: 5,
        semester: 2,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "math104_h1", title: "תרגיל בית 1: מטריצות ומערכות משוואות", type: "hw", xp: 50, completed: false },
            { id: "math104_h2", title: "תרגיל בית 2: מרחבים וקטוריים ודטרמיננטות", type: "hw", xp: 50, completed: false },
            { id: "math104_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "cs201": {
        code: "cs201",
        name: "אלגוריתמים 1",
        credits: 4,
        semester: 3,
        prerequisites: ["cs102", "math102"],
        status: "locked",
        tasks: [
            { id: "cs201_h1", title: "תרגיל בית 1: אלגוריתמי גרפים (BFS, DFS)", type: "hw", xp: 60, completed: false },
            { id: "cs201_h2", title: "תרגיל בית 2: אלגוריתמים חמדניים ותכנון דינמי", type: "hw", xp: 60, completed: false },
            { id: "cs201_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs202": {
        code: "cs202",
        name: "מבנה המחשב ושפת סף",
        credits: 4,
        semester: 3,
        prerequisites: ["cs101"],
        status: "locked",
        tasks: [
            { id: "cs202_h1", title: "תרגיל בית 1: שערים לוגיים ומעגלים", type: "hw", xp: 50, completed: false },
            { id: "cs202_p1", title: "עבודת מעבדה: מימוש מעבד פשוט באסמבלי", type: "project", xp: 200, completed: false },
            { id: "cs202_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "math201": {
        code: "math201",
        name: "הסתברות למדעי המחשב",
        credits: 4,
        semester: 3,
        prerequisites: ["math103", "math102"],
        status: "locked",
        tasks: [
            { id: "math201_h1", title: "תרגיל בית 1: הסתברות מותנית ובייז", type: "hw", xp: 50, completed: false },
            { id: "math201_h2", title: "תרגיל בית 2: משתנים מקריים והתפלגויות", type: "hw", xp: 50, completed: false },
            { id: "math201_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "cs203": {
        code: "cs203",
        name: "מערכות הפעלה",
        credits: 4,
        semester: 4,
        prerequisites: ["cs202", "cs102"],
        status: "locked",
        tasks: [
            { id: "cs203_h1", title: "תרגיל בית 1: תהליכים, חוטים וסנכרון", type: "hw", xp: 60, completed: false },
            { id: "cs203_p1", title: "פרויקט תכנות: פיתוח Shell וניהול זיכרון ב-C", type: "project", xp: 250, completed: false },
            { id: "cs203_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs204": {
        code: "cs204",
        name: "מערכות בסיסי נתונים",
        credits: 3,
        semester: 4,
        prerequisites: ["cs102"],
        status: "locked",
        tasks: [
            { id: "cs204_h1", title: "תרגיל בית 1: מודל ישויות-קשרים ושאילתות SQL", type: "hw", xp: 50, completed: false },
            { id: "cs204_p1", title: "פרויקט קורס: הקמת בסיס נתונים ואפליקציית ווב", type: "project", xp: 200, completed: false },
            { id: "cs204_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "cs205": {
        code: "cs205",
        name: "חישוביות ואוטומטים",
        credits: 4,
        semester: 4,
        prerequisites: ["math102"],
        status: "locked",
        tasks: [
            { id: "cs205_h1", title: "תרגיל בית 1: אוטומטים סופיים דטרמיניסטיים ושפות רגולריות", type: "hw", xp: 50, completed: false },
            { id: "cs205_h2", title: "תרגיל בית 2: מכונות טיורינג ובעיות אי-כריעות", type: "hw", xp: 50, completed: false },
            { id: "cs205_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "cs301": {
        code: "cs301",
        name: "רשתות תקשורת מחשבים",
        credits: 4,
        semester: 5,
        prerequisites: ["cs203"],
        status: "locked",
        tasks: [
            { id: "cs301_h1", title: "תרגיל בית 1: פרוטוקולי TCP/UDP וניתוב", type: "hw", xp: 60, completed: false },
            { id: "cs301_p1", title: "עבודת מעבדה: מימוש פרוטוקול העברת קבצים אמין", type: "project", xp: 250, completed: false },
            { id: "cs301_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs302": {
        code: "cs302",
        name: "הנדסת תוכנה",
        credits: 4,
        semester: 5,
        prerequisites: ["cs102"],
        status: "locked",
        tasks: [
            { id: "cs302_h1", title: "תרגיל בית 1: תבניות עיצוב (Design Patterns)", type: "hw", xp: 50, completed: false },
            { id: "cs302_p1", title: "פרויקט קבוצתי: תכנון ומימוש מערכת מונחית עצמים", type: "project", xp: 300, completed: false },
            { id: "cs302_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "cs303": {
        code: "cs303",
        name: "קומפילציה",
        credits: 4,
        semester: 5,
        prerequisites: ["cs205"],
        status: "locked",
        tasks: [
            { id: "cs303_h1", title: "תרגיל בית 1: ניתוח לקסיקלי וסינטקטי", type: "hw", xp: 50, completed: false },
            { id: "cs303_p1", title: "פרויקט תכנות: כתיבת מפרש/קומפיילר לשפה פשוטה", type: "project", xp: 300, completed: false },
            { id: "cs303_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs304": {
        code: "cs304",
        name: "מערכות מבוזרות",
        credits: 4,
        semester: 6,
        prerequisites: ["cs301"],
        status: "locked",
        tasks: [
            { id: "cs304_h1", title: "תרגיל בית 1: אלגוריתמי קונצנזוס (Raft/Paxos)", type: "hw", xp: 60, completed: false },
            { id: "cs304_p1", title: "פרויקט גמר קורס: פיתוח Key-Value store מבוזר", type: "project", xp: 300, completed: false },
            { id: "cs304_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs305": {
        code: "cs305",
        name: "מבוא לבינה מלאכותית",
        credits: 4,
        semester: 6,
        prerequisites: ["cs201", "math201"],
        status: "locked",
        tasks: [
            { id: "cs305_h1", title: "תרגיל בית 1: אלגוריתמי חיפוש ומשחקים (Minimax)", type: "hw", xp: 60, completed: false },
            { id: "cs305_p1", title: "פרויקט תכנות: סוכן פקמן חכם מבוסס בינה מלאכותית", type: "project", xp: 250, completed: false },
            { id: "cs305_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "cs399a": {
        code: "cs399a",
        name: "פרויקט גמר א'",
        credits: 3,
        semester: 6,
        prerequisites: ["cs302"],
        status: "locked",
        tasks: [
            { id: "cs399a_p1", title: "הגשת מסמך אפיון ותכנון ארכיטקטורה", type: "project", xp: 300, completed: false },
            { id: "cs399a_ex", title: "הצגת אב-טיפוס עובד", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs401": {
        code: "cs401",
        name: "אבטחת סייבר",
        credits: 4,
        semester: 7,
        prerequisites: ["cs301"],
        status: "locked",
        tasks: [
            { id: "cs401_h1", title: "תרגיל בית 1: קריפטוגרפיה ופרוטוקולי אבטחה", type: "hw", xp: 50, completed: false },
            { id: "cs401_p1", title: "מעבדת פריצה והגנה: CTF (Capture the Flag)", type: "project", xp: 300, completed: false },
            { id: "cs401_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs399b": {
        code: "cs399b",
        name: "פרויקט גמר ב'",
        credits: 3,
        semester: 7,
        prerequisites: ["cs399a"],
        status: "locked",
        tasks: [
            { id: "cs399b_p1", title: "בדיקות, אינטגרציה ופריסה לענן", type: "project", xp: 300, completed: false },
            { id: "cs399b_ex", title: "הצגת פרויקט גמר מלא מול סגל השופטים", type: "exam", xp: 1000, completed: false }
        ]
    },
    "cs402": {
        code: "cs402",
        name: "למידת מכונה (ML)",
        credits: 4,
        semester: 8,
        prerequisites: ["cs305"],
        status: "locked",
        tasks: [
            { id: "cs402_h1", title: "תרגיל בית 1: רגרסיה ליניארית ועצי החלטה", type: "hw", xp: 60, completed: false },
            { id: "cs402_p1", title: "פרויקט תכנות: אימון רשת נוירונים לזיהוי תמונות", type: "project", xp: 350, completed: false },
            { id: "cs402_ex", title: "מבחן סוף", type: "exam", xp: 600, completed: false }
        ]
    },
    "cs403": {
        code: "cs403",
        name: "מחשוב ענן ו-DevOps",
        credits: 3,
        semester: 8,
        prerequisites: ["cs304"],
        status: "locked",
        tasks: [
            { id: "cs403_h1", title: "תרגיל בית 1: קונטיינרים (Docker) ו-CI/CD", type: "hw", xp: 50, completed: false },
            { id: "cs403_p1", title: "פרויקט תכנות: הקמת מערך Kubernetes מאובטח", type: "project", xp: 250, completed: false },
            { id: "cs403_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    }
};

const SAMPLE_ME_DEGREE = {
    // Semester 1
    "104041": {
        code: "104041",
        name: "חדו\"א 1מ1",
        credits: 5,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "104041_h1", title: "מטלת בית 1: גבולות וסדרות", type: "hw", xp: 50, completed: false },
            { id: "104041_h2", title: "מטלת בית 2: רציפות וגזירות", type: "hw", xp: 50, completed: false },
            { id: "104041_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "104065": {
        code: "104065",
        name: "אלגברה ליניארית 1מ5",
        credits: 5,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "104065_h1", title: "מטלת בית 1: מערכות משוואות ומטריצות", type: "hw", xp: 50, completed: false },
            { id: "104065_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "125001": {
        code: "125001",
        name: "כימיה כללית",
        credits: 3,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "125001_h1", title: "מטלת בית 1: מבנה האטום והקשר הכימי", type: "hw", xp: 50, completed: false },
            { id: "125001_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "234128": {
        code: "234128",
        name: "מבוא למחשב - שפת פייתון",
        credits: 4,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "234128_h1", title: "מטלת תכנות 1: יסודות ולולאות", type: "hw", xp: 50, completed: false },
            { id: "234128_p1", title: "פרויקט תכנות: עיבוד נתונים מדעיים", type: "project", xp: 150, completed: false },
            { id: "234128_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "324033": {
        code: "324033",
        name: "אנגלית טכנית מתקדמים ב'",
        credits: 3,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "324033_h1", title: "קריאת מאמרים מדעיים והרחבת אוצר מילים", type: "hw", xp: 50, completed: false },
            { id: "324033_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "035026": {
        code: "035026",
        name: "מבוא יצירתי להנדסת מכונות (רשות)",
        credits: 2.5,
        semester: 1,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "035026_ex", title: "מבחן סוף / הגשה סופית", type: "exam", xp: 200, completed: false }
        ]
    },
    // Semester 2
    "034061": {
        code: "034061",
        name: "מבוא לגרפיקה ותכנון הנדסי",
        credits: 3.5,
        semester: 2,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034061_h1", title: "תרגיל שרטוט ידני והיטלים", type: "hw", xp: 50, completed: false },
            { id: "034061_p1", title: "פרויקט SolidWorks: מידול והרכבת מנוע", type: "project", xp: 200, completed: false },
            { id: "034061_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034028": {
        code: "034028",
        name: "מכניקת מוצקים 1",
        credits: 4,
        semester: 2,
        prerequisites: ["104041","104065","114051"],
        status: "locked",
        tasks: [
            { id: "034028_h1", title: "תרגיל בית 1: מאמצים ועיוותים חד-מימדיים", type: "hw", xp: 50, completed: false },
            { id: "034028_h2", title: "תרגיל בית 2: מאמצי גזירה ופיתול מוטות", type: "hw", xp: 50, completed: false },
            { id: "034028_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "104043": {
        code: "104043",
        name: "חדו\"א 2מ'",
        credits: 5,
        semester: 2,
        prerequisites: ["104041"],
        status: "locked",
        tasks: [
            { id: "104043_h1", title: "תרגיל בית 1: פונקציות של מספר משתנים וגרדיאנט", type: "hw", xp: 50, completed: false },
            { id: "104043_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "114051": {
        code: "114051",
        name: "פיסיקה 1",
        credits: 3.5,
        semester: 2,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "114051_h1", title: "תרגיל בית 1: קינמטיקה וחוקי ניוטון", type: "hw", xp: 50, completed: false },
            { id: "114051_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "104131": {
        code: "104131",
        name: "משוואות דיפרנציאליות רגילות",
        credits: 2.5,
        semester: 2,
        prerequisites: ["104041","104065"],
        status: "locked",
        tasks: [
            { id: "104131_h1", title: "תרגיל בית 1: משוואות מסדר ראשון ומסדר שני", type: "hw", xp: 50, completed: false },
            { id: "104131_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "314533": {
        code: "314533",
        name: "מבוא להנדסת חומרים מ'",
        credits: 3.5,
        semester: 2,
        prerequisites: ["125001"],
        status: "available",
        tasks: [
            { id: "314533_h1", title: "תרגיל בית 1: סריגים קריסטלוגרפיים ופגמים", type: "hw", xp: 50, completed: false },
            { id: "314533_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 3
    "034053": {
        code: "034053",
        name: "מכניקת מוצקים 2 מורחב",
        credits: 5,
        semester: 3,
        prerequisites: ["034028","104043","104065"],
        status: "locked",
        tasks: [
            { id: "034053_h1", title: "תרגיל בית 1: כפיפת קורות מאמצים משולבים", type: "hw", xp: 60, completed: false },
            { id: "034053_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "114052": {
        code: "114052",
        name: "פיסיקה 2",
        credits: 3.5,
        semester: 3,
        prerequisites: ["114051","104041"],
        status: "locked",
        tasks: [
            { id: "114052_h1", title: "תרגיל בית 1: שדה חשמלי וחוק גאוס", type: "hw", xp: 50, completed: false },
            { id: "114052_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034056": {
        code: "034056",
        name: "מבוא לחישוב מדעי והנדסי",
        credits: 4,
        semester: 3,
        prerequisites: ["234128","104131"],
        status: "locked",
        tasks: [
            { id: "034056_h1", title: "תרגיל בית 1: פתרון משוואות לא ליניאריות בפייתון", type: "hw", xp: 50, completed: false },
            { id: "034056_p1", title: "פרוייקט חישובי: אנליזה של מערכת מכנית מורכבת", type: "project", xp: 200, completed: false },
            { id: "034056_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034035": {
        code: "034035",
        name: "תרמודינמיקה 1",
        credits: 4,
        semester: 3,
        prerequisites: ["104043","104041"],
        status: "available",
        tasks: [
            { id: "034035_h1", title: "תרגיל בית 1: החוק הראשון של התרמודינמיקה", type: "hw", xp: 50, completed: false },
            { id: "034035_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "104228": {
        code: "104228",
        name: "משוואות דיפרנציאליות חלקיות מ'",
        credits: 3,
        semester: 3,
        prerequisites: ["104043","104131"],
        status: "locked",
        tasks: [
            { id: "104228_h1", title: "תרגיל בית 1: משוואת הגלים והחום", type: "hw", xp: 50, completed: false },
            { id: "104228_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 4
    "034030": {
        code: "034030",
        name: "תהליכי ייצור",
        credits: 3.5,
        semester: 4,
        prerequisites: ["034053","034061","314533"],
        status: "available",
        tasks: [
            { id: "034030_h1", title: "תרגיל בית 1: עיבוד שבבי ויציקה", type: "hw", xp: 50, completed: false },
            { id: "034030_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034010": {
        code: "034010",
        name: "דינמיקה",
        credits: 5,
        semester: 4,
        prerequisites: ["034028","114051","104043","104131"],
        status: "locked",
        tasks: [
            { id: "034010_h1", title: "תרגיל בית 1: קינמטיקה של גוף קשיח בדו-מימד", type: "hw", xp: 60, completed: false },
            { id: "034010_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "034055": {
        code: "034055",
        name: "תורת הזרימה 1 מורחב",
        credits: 5,
        semester: 4,
        prerequisites: ["034035","104131","104228"],
        status: "locked",
        tasks: [
            { id: "034055_h1", title: "תרגיל בית 1: הידרוסטטיקה ושימור מסה", type: "hw", xp: 60, completed: false },
            { id: "034055_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]
    },
    "034032": {
        code: "034032",
        name: "מערכות ליניאריות מ'",
        credits: 4,
        semester: 4,
        prerequisites: ["104131","104065"],
        status: "locked",
        tasks: [
            { id: "034032_h1", title: "תרגיל בית 1: התמרות לפלס ותפקודי תמסורת", type: "hw", xp: 50, completed: false },
            { id: "034032_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "125013": {
        code: "125013",
        name: "מעבדה בכימיה",
        credits: 0.5,
        semester: 4,
        prerequisites: ["125001"],
        status: "locked",
        tasks: [
            { id: "125013_ex", title: "דו\"ח מעבדה סופי", type: "exam", xp: 100, completed: false }
        ]
    },
    // Semester 5
    "034041": {
        code: "034041",
        name: "מעבר חום",
        credits: 4,
        semester: 5,
        prerequisites: ["034035","034055"],
        status: "locked",
        tasks: [
            { id: "034041_h1", title: "תרגיל בית 1: הולכת חום במימד אחד", type: "hw", xp: 50, completed: false },
            { id: "034041_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034040": {
        code: "034040",
        name: "מבוא לבקרה",
        credits: 3,
        semester: 5,
        prerequisites: ["034032"],
        status: "locked",
        tasks: [
            { id: "034040_h1", title: "תרגיל בית 1: יציבות מערכות דינמיות (הורוויץ)", type: "hw", xp: 50, completed: false },
            { id: "034040_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034054": {
        code: "034054",
        name: "תכן מכני 1 מ'",
        credits: 4,
        semester: 5,
        prerequisites: ["034053","034030","034061","314533"],
        status: "locked",
        tasks: [
            { id: "034054_h1", title: "תרגיל בית 1: חישובי עייפות חומרים (Fatigue)", type: "hw", xp: 50, completed: false },
            { id: "034054_p1", title: "פרוייקט תכן: תכנון ציר ותמסורת גלגלי שיניים", type: "project", xp: 250, completed: false },
            { id: "034054_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034058": {
        code: "034058",
        name: "הסתברות וסטטיסטיקה להנדסת מכונות",
        credits: 3,
        semester: 5,
        prerequisites: ["104043"],
        status: "available",
        tasks: [
            { id: "034058_h1", title: "תרגיל בית 1: הסתברות מותנית ומשתנים בדידים", type: "hw", xp: 50, completed: false },
            { id: "034058_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "114032": {
        code: "114032",
        name: "מעבדה לפיזיקה 1ח'",
        credits: 1.0,
        semester: 5,
        prerequisites: ["114052"],
        status: "locked",
        tasks: [
            { id: "114032_ex", title: "דו\"ח מעבדה סופי", type: "exam", xp: 150, completed: false }
        ]
    },
    "034051": {
        code: "034051",
        name: "דינמיקה ומכניקה של תנודות",
        credits: 3,
        semester: 5,
        prerequisites: ["034010","034032","034053","034056","104228"],
        status: "locked",
        tasks: [
            { id: "034051_h1", title: "תרגיל בית 1: תנודות חופשיות ומאולצות עם ריסון", type: "hw", xp: 50, completed: false },
            { id: "034051_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 6
    "034060": {
        code: "034060",
        name: "מבוא למכטרוניקה והנע חשמלי",
        credits: 4,
        semester: 6,
        prerequisites: ["034032","114052"],
        status: "locked",
        tasks: [
            { id: "034060_h1", title: "תרגיל בית 1: מנועי זרם ישר וצעד", type: "hw", xp: 50, completed: false },
            { id: "034060_p1", title: "עבודת מעבדה: בקרת מיקום מנוע מבוססת ארדואינו", type: "project", xp: 200, completed: false },
            { id: "034060_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]
    },
    "034057": {
        code: "034057",
        name: "מעבדה מתקדמת בהנדסת מכונות",
        credits: 4,
        semester: 6,
        prerequisites: ["034041","034040","034051","034058","114032"],
        status: "available",
        tasks: [
            { id: "034057_p1", title: "ניסוי מעבדה 1: מעבר חום וזורמים", type: "project", xp: 150, completed: false },
            { id: "034057_p2", title: "ניסוי מעבדה 2: בקרה ומערכות דינמיות", type: "project", xp: 150, completed: false },
            { id: "034057_ex", title: "דו\"ח מעבדה מסכם", type: "exam", xp: 500, completed: false }
        ]
    },
    "034371": {
        code: "034371",
        name: "פרויקט תכן לייצור",
        credits: 2.5,
        semester: 6,
        prerequisites: ["034054","034030"],
        status: "locked",
        tasks: [
            { id: "034371_p1", title: "תכנון חלקים לייצור ממוחשב ו-CNC", type: "project", xp: 200, completed: false },
            { id: "034371_ex", title: "הגשה סופית של תיק ייצור", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 7
    "034379": {
        code: "034379",
        name: "פרויקט גמר הנדסי 1",
        credits: 3,
        semester: 7,
        prerequisites: ["034371"],
        status: "locked",
        tasks: [
            { id: "034379_p1", title: "הגשת ספר פרויקט - שלב תכנון רעיוני", type: "project", xp: 250, completed: false },
            { id: "034379_ex", title: "פרזנטציה שלב א' בפני צוות הפקולטה", type: "exam", xp: 600, completed: false }
        ]
    },
    "034382": {
        code: "034382",
        name: "מתודולוגיות פיתוח הנדסי 1",
        credits: 0.5,
        semester: 7,
        prerequisites: ["034054"],
        status: "available",
        tasks: [
            { id: "034382_ex", title: "הצגת כלי פיתוח הנדסיים מבוססי מערכת", type: "exam", xp: 150, completed: false }
        ]
    },
    // Semester 8
    "034380": {
        code: "034380",
        name: "פרויקט גמר הנדסי 2",
        credits: 3,
        semester: 8,
        prerequisites: ["034379"],
        status: "locked",
        tasks: [
            { id: "034380_p1", title: "בניית אב טיפוס, בדיקות שטח וביצועים", type: "project", xp: 350, completed: false },
            { id: "034380_ex", title: "יריד פרויקטים סופי והגנה מול בוחנים חיצוניים", type: "exam", xp: 1000, completed: false }
        ]
    },
    "034383": {
        code: "034383",
        name: "מתודולוגיות פיתוח הנדסי 2",
        credits: 0.5,
        semester: 8,
        prerequisites: ["034382"],
        status: "locked",
        tasks: [
            { id: "034383_ex", title: "הגשת תהליך פיתוח הנדסי רפלקטיבי", type: "exam", xp: 150, completed: false }
        ]
    }
};

// Global active course tracker
let currentSelectedCourse = null;
let editingCourseCode = null;

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadSavedState();
    setupEventListeners();
    setupNotionDashboard();
    setupStudyRunway();
    setupFinalsMode();
    setupNotionIconPickerEvents();
    renderUI();
    setupDailyTimetable();
    setupMobileNotifications();
    
    // Periodically update paths on window resize
    window.addEventListener("resize", drawConnections);
});

// Moodle Sync Logic
async function performMoodleSync(moodleUrl, token) {
    const statusDiv = document.getElementById("moodle-sync-status");
    statusDiv.style.color = "var(--text-light)";
    statusDiv.innerText = "Connecting to Moodle...";

    try {
        const coursesUrl = `${moodleUrl}/webservice/rest/server.php?wstoken=${token}&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json`;
        const response = await fetch(coursesUrl);
        if (!response.ok) throw new Error("Connection failed");
        
        const moodleCourses = await response.json();
        if (moodleCourses.exception) {
            throw new Error(moodleCourses.message || "Invalid Token");
        }

        if (!Array.isArray(moodleCourses)) {
            throw new Error("Invalid response format");
        }

        let syncCount = 0;
        for (const mCourse of moodleCourses) {
            const match = mCourse.shortname.match(/\d{8}/) || mCourse.fullname.match(/\d{8}/) || mCourse.idnumber.match(/\d{8}/);
            if (!match) continue;

            const moodleCode = match[0];
            // Normalize 8-digit Moodle code to 6-digit game state code
            const cleanCode = (moodleCode.length === 8) ? (moodleCode.substring(1, 4) + moodleCode.substring(5)) : moodleCode;
            
            const course = gameState.courses[cleanCode];
            if (!course) continue;

            if (course.status !== 'mastered') {
                course.status = 'active';
            }
            syncCount++;
        }

        recalculateCourseStates();
        saveState();
        renderUI();

        statusDiv.style.color = "var(--color-mastered)";
        statusDiv.innerText = `Synced ${syncCount} courses from Moodle successfully!`;

    } catch (e) {
        console.error("Moodle sync error:", e);
        statusDiv.style.color = "#ef4444";
        statusDiv.innerHTML = `Moodle connection error (CORS or Invalid Token).<br><span style="cursor:pointer;text-decoration:underline;" id="btn-moodle-mock-trigger">Click here to run Mock Sync Simulation</span>`;
        
        // Wait a tick to bind the mock trigger event listener
        setTimeout(() => {
            const trigger = document.getElementById("btn-moodle-mock-trigger");
            if (trigger) {
                trigger.addEventListener("click", () => {
                    runMockMoodleSync();
                });
            }
        }, 100);
    }
}

function runMockMoodleSync() {
    const statusDiv = document.getElementById("moodle-sync-status");
    statusDiv.style.color = "var(--text-light)";
    statusDiv.innerText = "Running Mock Sync...";

    setTimeout(() => {
        let loadedNew = false;
        // Check if ME courses are loaded by looking up Calculus 1M1 (104041)
        if (!gameState.courses["104041"]) {
            gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
            gameState.characterClass = "Student of Mechanical Engineering (Technion)";
            gameState.courses = JSON.parse(JSON.stringify(SAMPLE_ME_DEGREE));
            loadedNew = true;
        }

        // Grades from the Moodle screenshot:
        // 100.00: Algebra 2M1 (01040065 -> 104065)
        // 100.00: General Chemistry (01250001 -> 125001)
        // 94: Chemistry Lab (01250013 -> 125013)
        // 100.00: Physics 1 (01140051 -> 114051)
        const gradedCourses = {
            "104065": 100.00,
            "125001": 100.00,
            "125013": 94.00,
            "114051": 100.00
        };

        // Active registered courses from screenshot:
        // 00340061 -> 034061 (Graphics), 01040041 -> 104041 (Calc 1M1), 01040043 -> 104043 (Calc 2M1), 
        // 03140533 -> 314533 (Materials), 02340128 -> 234128 (Python), 00340028 -> 034028 (Solids 1), 
        // 01040131 -> 104131 (ODE)
        const activeCourses = ["034061", "104041", "104043", "314533", "234128", "034028", "104131"];

        let masteredAdded = 0;
        let activeAdded = 0;
        let xpGained = 0;

        // Process active courses
        activeCourses.forEach(code => {
            const course = gameState.courses[code];
            if (course && course.status !== 'mastered') {
                course.status = 'active';
                activeAdded++;
            }
        });

        // Process graded courses (mastered!)
        Object.keys(gradedCourses).forEach(code => {
            const course = gameState.courses[code];
            if (course) {
                course.grade = gradedCourses[code];
                if (course.status !== 'mastered') {
                    course.status = 'mastered';
                    masteredAdded++;
                    
                    // Mark all tasks in this course as completed and collect XP
                    course.tasks.forEach(task => {
                        task.status = 'done';
                        if (task.type === 'exam') {
                            task.grade = course.grade;
                        }
                        if (!task.completed) {
                            task.completed = true;
                            xpGained += task.xp;
                        }
                    });
                }
            }
        });

        recalculateCourseStates();
        if (xpGained > 0) {
            addXp(xpGained);
        } else {
            saveState();
            renderUI();
        }

        statusDiv.style.color = "var(--color-mastered)";
        statusDiv.innerHTML = `Mock Sync Complete! Synced 11 courses from Technion Moodle.`;

        let alertMsg = `Moodle Mock Sync Complete!\n\nImported:\n- ${masteredAdded} Completed Courses (Graded 90-100)\n- ${activeAdded} Active Courses (Registered)\n- Earned +${xpGained} XP!`;
        if (loadedNew) {
            alertMsg = `Mechanical Engineering (Technion) curriculum loaded automatically!\n\n` + alertMsg;
        }
        alert(alertMsg);

    }, 1200);
}


const PRELOADED_USER_STATE = {
  "characterClass": "סטודנט להנדסת מכונות (טכניון)",
  "xp": 1250,
  "level": 6,
  "credits": 39.5,
  "completedCourses": 11,
  "bossesSlain": 11,
  "courses": {
    "104041": {
      "code": "104041",
      "name": "חדו\"א 1מ1",
      "credits": 5,
      "semester": 1,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "104041_h1",
          "title": "מטלת בית 1: גבולות וסדרות",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "104041_h2",
          "title": "מטלת בית 2: רציפות וגזירות",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "104041_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": ""
        }
      ],
      "grade": 84
    },
    "104043": {
      "code": "104043",
      "name": "חדו\"א 2מ'",
      "credits": 5,
      "semester": 2,
      "prerequisites": [
        "104041"
      ],
      "status": "mastered",
      "tasks": [
        {
          "id": "104043_h1",
          "title": "תרגיל בית 1: פונקציות של מספר משתנים וגרדיאנט",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done"
        },
        {
          "id": "104043_ex",
          "title": "מועד א חדו״א 1pm",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": "2026-08-05",
          "grade": 65
        },
        {
          "id": "task_104043_lectures",
          "title": "לצפות בכל ההרצאות של חדו״א",
          "dueDate": "2026-08-22",
          "type": "hw",
          "completed": true
        }
      ],
      "grade": 70
    },
    "104065": {
      "code": "104065",
      "name": "אלגברה ליניארית 1מ",
      "credits": 5,
      "semester": 1,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "104065_h1",
          "title": "מטלת בית 1: מערכות משוואות ומטריצות",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "104065_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": ""
        }
      ],
      "grade": 87,
      "type": "core"
    },
    "104131": {
      "code": "104131",
      "name": "משוואות דיפרנציאליות רגילות",
      "credits": 2.5,
      "semester": 2,
      "prerequisites": [
        "104041",
        "104065"
      ],
      "status": "mastered",
      "tasks": [
        {
          "id": "task-dyn-1",
          "title": "תרגיל הגשה 1: מבוא למשוואות דיפרנציאליות רגילות",
          "type": "hw",
          "completed": true,
          "status": "done",
          "xp": 50,
          "dueDate": ""
        },
        {
          "id": "task-dyn-2",
          "title": "תרגיל הגשה 2: נושאים מתקדמים במשוואות דיפרנציאליות רגילות",
          "type": "hw",
          "completed": true,
          "status": "done",
          "xp": 50,
          "dueDate": ""
        },
        {
          "id": "task-dyn-proj",
          "title": "עבודת הגשה מסכמת במשוואות דיפרנציאליות רגילות",
          "type": "project",
          "completed": true,
          "status": "done",
          "xp": 150,
          "dueDate": ""
        },
        {
          "id": "task-dyn-exam",
          "title": "מועד א מד״ר 9am",
          "type": "exam",
          "completed": true,
          "status": "done",
          "xp": 500,
          "dueDate": "2026-08-13",
          "grade": 71
        }
      ],
      "grade": 74
    },
    "104228": {
      "code": "104228",
      "name": "משוואות דיפרנציאליות חלקיות מ'",
      "credits": 3,
      "semester": 3,
      "prerequisites": [
        "104043",
        "104131"
      ],
      "status": "active",
      "tasks": [
        {
          "id": "104228_h1",
          "title": "תרגיל בית 1: משוואות מסדר ראשון ומאפיינים",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "104228_ww1",
          "title": "WebWork 1: משוואת הגלים והפרדת משתנים",
          "type": "webwork",
          "xp": 40,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "104228_ex",
          "title": "מועד א",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-02-24"
        },
        {
          "id": "104228_ex_b",
          "title": "מועד ב'",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-03-26"
        }
      ],
      "faculty": "הפקולטה למתמטיקה",
      "syllabus": "מבוא למשוואות דיפרנציאליות חלקיות מסדר ראשון ושני. מיון משוואות לינאריות וחצי-לינאריות מסדר שני: היפרבוליות, פרבוליות ואליפטיות. משוואת הגלים בממד אחד ובשלושה ממדים (נוסחת דלאמבר, פתרון פואסון). משוואת החום: פתרון בעיית התחלה על הישר, עקרון המקסימום. שיטת הפרדת משתנים וטורי פורייה. משוואת לפלס ופואסון בתחומים שונים.",
      "lecturers": "פרופ' מתמטיקה",
      "moedA": "2027-02-24",
      "moedB": "2027-03-26",
      "schedule": [
        {
          "type": "תרגול",
          "group": 21,
          "day": "רביעי",
          "hours": "10:30 - 12:30",
          "lecturer": "",
          "room": ""
        },
        {
          "type": "הרצאה",
          "group": 20,
          "day": "חמישי",
          "hours": "10:30 - 12:30",
          "lecturer": "",
          "room": ""
        }
      ]
    },
    "114032": {
      "code": "114032",
      "name": "מעבדה לפיזיקה 1ח'",
      "credits": 1,
      "semester": 5,
      "prerequisites": [
        "114052"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "114032_ex",
          "title": "דו\"ח מעבדה סופי",
          "type": "exam",
          "xp": 150,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "114051": {
      "code": "114051",
      "name": "פיסיקה 1",
      "credits": 3.5,
      "semester": 1,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "114051_h1",
          "title": "תרגיל בית 1: קינמטיקה וחוקי ניוטון",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "114051_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": ""
        }
      ],
      "grade": 100
    },
    "114052": {
      "code": "114052",
      "name": "פיסיקה 2",
      "credits": 3.5,
      "semester": 3,
      "prerequisites": [
        "114051",
        "104041"
      ],
      "status": "active",
      "tasks": [
        {
          "id": "114052_h1",
          "title": "תרגיל בית 1: שדה חשמלי וחוק גאוס",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "114052_ww1",
          "title": "WebWork 1: חוק קולון ושדה חשמלי",
          "type": "webwork",
          "xp": 40,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "114052_ex",
          "title": "מועד א",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-02-01"
        },
        {
          "id": "114052_ex_b",
          "title": "מועד ב'",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-03-02"
        }
      ],
      "faculty": "הפקולטה לפיסיקה",
      "syllabus": "חשמל ומגנטיות: חוק קולון, שדה חשמלי, חוק גאוס, פוטנציאל אלקטרוסטטי, קיבול וקבלים, דיאלקטריים, זרם והתנגדות, כוח אלקטרו-מניע ומעגלי זרם ישר. שדה מגנטי, חוק ביו-סבר, חוק אמפר, השראה אלקטרומגנטית, חוק פראדיי, השראות, זרם חילופין, משוואות מקסוול וגלים אלקטרומגנטיים.",
      "lecturers": "ד\"ר גדעון אלון",
      "moedA": "2027-02-01",
      "moedB": "2027-03-02",
      "schedule": [
        {
          "type": "הרצאה",
          "group": 10,
          "day": "שני",
          "hours": "08:30 - 10:30",
          "lecturer": "ד\"ר גדעון אלון",
          "room": ""
        },
        {
          "type": "הרצאה",
          "group": 10,
          "day": "רביעי",
          "hours": "08:30 - 09:30",
          "lecturer": "ד\"ר גדעון אלון",
          "room": ""
        },
        {
          "type": "תרגול",
          "group": 13,
          "day": "רביעי",
          "hours": "09:30 - 10:30",
          "lecturer": "",
          "room": ""
        }
      ]
    },
    "125001": {
      "code": "125001",
      "name": "כימיה כללית",
      "credits": 3,
      "semester": 1,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "125001_h1",
          "title": "מטלת בית 1: מבנה האטום והקשר הכימי",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "125001_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": ""
        }
      ],
      "grade": 96
    },
    "125013": {
      "code": "125013",
      "name": "מעבדה בכימיה",
      "credits": 0.5,
      "semester": 2,
      "prerequisites": [
        "125001"
      ],
      "status": "mastered",
      "tasks": [
        {
          "id": "task-dyn-1",
          "title": "תרגיל הגשה 1: מבוא למעבדה בכימיה",
          "type": "hw",
          "completed": true,
          "status": "done",
          "xp": 50,
          "dueDate": ""
        },
        {
          "id": "task-dyn-2",
          "title": "תרגיל הגשה 2: נושאים מתקדמים במעבדה בכימיה",
          "type": "hw",
          "completed": true,
          "status": "done",
          "xp": 50,
          "dueDate": ""
        },
        {
          "id": "task-dyn-proj",
          "title": "עבודת הגשה מסכמת במעבדה בכימיה",
          "type": "project",
          "completed": true,
          "status": "done",
          "xp": 150,
          "dueDate": ""
        },
        {
          "id": "task-dyn-exam",
          "title": "מבחן מסכם במעבדה בכימיה",
          "type": "exam",
          "completed": true,
          "status": "done",
          "xp": 500,
          "dueDate": ""
        }
      ],
      "grade": 94
    },
    "234128": {
      "code": "234128",
      "name": "מבוא למחשב - שפת פייתון",
      "credits": 4,
      "semester": 1,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "234128_h1",
          "title": "מטלת תכנות 1: יסודות ולולאות",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "234128_p1",
          "title": "פרויקט תכנות: עיבוד נתונים מדעיים",
          "type": "project",
          "xp": 150,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "234128_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": ""
        }
      ],
      "grade": 87
    },
    "314533": {
      "code": "314533",
      "name": "מבוא להנדסת חומרים מ'",
      "credits": 3.5,
      "semester": 2,
      "prerequisites": [
        "125001"
      ],
      "status": "mastered",
      "tasks": [
        {
          "id": "314533_h1",
          "title": "תרגיל בית 1: סריגים קריסטלוגרפיים ופגמים",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "314533_ex",
          "title": "מועד א הנדסת חומרים 9am",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": "2026-08-11"
        }
      ],
      "grade": 90,
      "type": "core"
    },
    "034061": {
      "code": "034061",
      "name": "מבוא לגרפיקה ותכנון הנדסי",
      "credits": 3.5,
      "semester": 2,
      "prerequisites": [],
      "status": "mastered",
      "tasks": [
        {
          "id": "034061_p1",
          "title": "פרויקט SolidWorks: מידול והרכבת מנוע",
          "type": "project",
          "xp": 200,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "034061_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": "",
          "grade": 99
        },
        {
          "id": "task_034061_defense",
          "title": "הגנה על פרויקט סוף גרפיקה",
          "dueDate": "2026-08-27",
          "type": "project",
          "completed": true
        }
      ],
      "grade": 99,
      "assignmentsGrade": 99
    },
    "034028": {
      "code": "034028",
      "name": "מכניקת מוצקים 1",
      "credits": 4,
      "semester": 2,
      "prerequisites": [
        "104041",
        "104065",
        "114051"
      ],
      "status": "mastered",
      "tasks": [
        {
          "id": "034028_h1",
          "title": "תרגיל בית 1: מאמצים ועיוותים חד-מימדיים",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "034028_h2",
          "title": "תרגיל בית 2: מאמצי גזירה ופיתול מוטות",
          "type": "hw",
          "xp": 50,
          "completed": true,
          "status": "done",
          "dueDate": ""
        },
        {
          "id": "034028_ex",
          "title": "מועד א מכניקת מוצקים 9am",
          "type": "exam",
          "xp": 500,
          "completed": true,
          "status": "done",
          "dueDate": "2026-08-19",
          "grade": 79
        }
      ],
      "grade": 82
    },
    "034053": {
      "code": "034053",
      "name": "מכניקת מוצקים 2מ",
      "credits": 5,
      "semester": 3,
      "prerequisites": [
        "034028",
        "104043",
        "104065"
      ],
      "status": "active",
      "tasks": [
        {
          "id": "034053_h1",
          "title": "תרגיל בית 1: כפיפת קורות ומאמצים משולבים",
          "type": "hw",
          "xp": 60,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "034053_ex",
          "title": "מועד א",
          "type": "exam",
          "xp": 550,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-02-18"
        },
        {
          "id": "034053_ex_b",
          "title": "מועד ב'",
          "type": "exam",
          "xp": 550,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-03-18"
        }
      ],
      "faculty": "הפקולטה להנדסת מכונות",
      "syllabus": "מאמצים, עיבורים, קשרי מאמץ-עיבור (חוק הוק המוכלל), קריטריוני כניעה וכשל (פון-מיזס, טרסקה). מבוא לתורת האלסטיות, פונקציית מאמצים של איירי. כפיפת קורות אסימטריות, מרכז גזירה. פיתול של מוטות בעלי חתך לא עגול וחתכים דקי-דופן. קריסת עמודים (אוילר). שיטות אנרגיה: משפט קסטיליאנו, עבודה מדומה.",
      "lecturers": "פרופ' יוסף גבלי",
      "moedA": "2027-02-18",
      "moedB": "2027-03-18",
      "schedule": [
        {
          "type": "הרצאה",
          "group": 10,
          "day": "שני",
          "hours": "10:30 - 14:30",
          "lecturer": "פרופ' יוסף גבלי",
          "room": ""
        },
        {
          "type": "תרגול",
          "group": 21,
          "day": "חמישי",
          "hours": "12:30 - 14:30",
          "lecturer": "",
          "room": ""
        }
      ]
    },
    "034056": {
      "code": "034056",
      "name": "מבוא לחישוב מדעי והנדסי",
      "credits": 4,
      "semester": 3,
      "prerequisites": [
        "234128",
        "104131"
      ],
      "status": "active",
      "tasks": [
        {
          "id": "034056_h1",
          "title": "תרגיל בית 1: פתרון משוואות לא ליניאריות בפייתון",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "034056_p1",
          "title": "פרוייקט חישובי: אנליזה נומרית של מערכת מכנית",
          "type": "project",
          "xp": 200,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "034056_ex",
          "title": "מועד א",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-02-11"
        },
        {
          "id": "034056_ex_b",
          "title": "מועד ב'",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-03-10"
        }
      ],
      "faculty": "הפקולטה להנדסת מכונות",
      "syllabus": "1. הקדמה לחישוב מדעי ואלגוריתמיקה. 2. שיטות פתרון למשוואות לינאריות: שיטת גאוס, פירוק LU, שיטות איטרטיביות (יעקובי, גאוס-זיידל). 3. שורשים של משוואות לא לינאריות: חצייה, ניוטון-רפסון. 4. אינטרפולציה וקירוב פונקציות. 5. גזירה ואינטגרציה נומרית. 6. פתרון נומרי של משוואות דיפרנציאליות רגילות (ODE) - שיטות אוילר ורונגה-קוטה. יישומים מעשיים בפייתון.",
      "lecturers": "ד\"ר דניאל הקסנר",
      "moedA": "2027-02-11",
      "moedB": "2027-03-10",
      "schedule": [
        {
          "type": "תרגול",
          "group": 14,
          "day": "שני",
          "hours": "14:30 - 16:30",
          "lecturer": "",
          "room": ""
        },
        {
          "type": "הרצאה",
          "group": 10,
          "day": "רביעי",
          "hours": "14:30 - 17:30",
          "lecturer": "ד\"ר דניאל הקסנר",
          "room": ""
        }
      ]
    },
    "034035": {
      "code": "034035",
      "name": "תרמודינמיקה 1",
      "credits": 4,
      "semester": 3,
      "prerequisites": [
        "104043",
        "104041"
      ],
      "status": "active",
      "tasks": [
        {
          "id": "034035_h1",
          "title": "תרגיל בית 1: החוק הראשון של התרמודינמיקה",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        },
        {
          "id": "034035_ex",
          "title": "מועד א",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-02-07"
        },
        {
          "id": "034035_ex_b",
          "title": "מועד ב'",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started",
          "dueDate": "2027-03-05"
        }
      ],
      "faculty": "הפקולטה להנדסת מכונות",
      "syllabus": "מושגי יסוד, מערכת, תכונות, מצב, תהליך, חוק האפס והחוק הראשון. אנרגיה. אנתלפיה. שינויי פאזה וחומר טהור. משוואות מצב, גז אידיאלי וגז אמיתי. ניתוח נפח בקרה: שימור מסה ושימור אנרגיה. החוק השני של התרמודינמיקה: נצילות קרנו, אי-שוויון קלאוזיוס, אנטרופיה ומאזן אנטרופיה. אקסרגיה, מחזורי כוח וקירור.",
      "lecturers": "פרופ' לאוניד טרטקובסקי",
      "moedA": "2027-02-07",
      "moedB": "2027-03-05",
      "schedule": [
        {
          "type": "הרצאה",
          "group": 10,
          "day": "שלישי",
          "hours": "08:30 - 11:30",
          "lecturer": "פרופ' לאוניד טרטקובסקי",
          "room": ""
        },
        {
          "type": "תרגול",
          "group": 11,
          "day": "שלישי",
          "hours": "12:30 - 14:30",
          "lecturer": "",
          "room": ""
        }
      ]
    },
    "034030": {
      "code": "034030",
      "name": "תהליכי ייצור",
      "credits": 3.5,
      "semester": 4,
      "prerequisites": [
        "034053",
        "034061",
        "314533"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034030_h1",
          "title": "תרגיל בית 1: עיבוד שבבי ויציקה",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034030_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034010": {
      "code": "034010",
      "name": "דינמיקה",
      "credits": 5,
      "semester": 4,
      "prerequisites": [
        "034028",
        "114051",
        "104043",
        "104131"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034010_h1",
          "title": "תרגיל בית 1: קינמטיקה של גוף קשיח בדו-מימד",
          "type": "hw",
          "xp": 60,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034010_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 550,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034055": {
      "code": "034055",
      "name": "תורת הזרימה 1 מורחב",
      "credits": 5,
      "semester": 4,
      "prerequisites": [
        "034035",
        "104131",
        "104228"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034055_h1",
          "title": "תרגיל בית 1: הידרוסטטיקה ושימור מסה",
          "type": "hw",
          "xp": 60,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034055_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 550,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034032": {
      "code": "034032",
      "name": "מערכות ליניאריות מ'",
      "credits": 4,
      "semester": 4,
      "prerequisites": [
        "104131",
        "104065"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034032_h1",
          "title": "תרגיל בית 1: התמרות לפלס ותפקודי תמסורת",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034032_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034041": {
      "code": "034041",
      "name": "מעבר חום",
      "credits": 4,
      "semester": 5,
      "prerequisites": [
        "034035",
        "034055"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034041_h1",
          "title": "תרגיל בית 1: הולכת חום במימד אחד",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034041_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034040": {
      "code": "034040",
      "name": "מבוא לבקרה",
      "credits": 3,
      "semester": 5,
      "prerequisites": [
        "034032"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034040_h1",
          "title": "תרגיל בית 1: יציבות מערכות דינמיות (הורוויץ)",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034040_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034054": {
      "code": "034054",
      "name": "תכן מכני 1 מ'",
      "credits": 4,
      "semester": 5,
      "prerequisites": [
        "034053",
        "034030",
        "034061",
        "314533"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034054_h1",
          "title": "תרגיל בית 1: חישובי עייפות חומרים (Fatigue)",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034054_p1",
          "title": "פרוייקט תכן: תכנון ציר ותמסורת גלגלי שיניים",
          "type": "project",
          "xp": 250,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034054_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034058": {
      "code": "034058",
      "name": "הסתברות וסטטיסטיקה להנדסת מכונות",
      "credits": 3,
      "semester": 5,
      "prerequisites": [
        "104043"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034058_h1",
          "title": "תרגיל בית 1: הסתברות מותנית ומשתנים בדידים",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034058_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034051": {
      "code": "034051",
      "name": "דינמיקה ומכניקה של תנודות",
      "credits": 3,
      "semester": 5,
      "prerequisites": [
        "034010",
        "034032",
        "034053",
        "034056",
        "104228"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034051_h1",
          "title": "תרגיל בית 1: תנודות חופשיות ומאולצות עם ריסון",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034051_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034060": {
      "code": "034060",
      "name": "מבוא למכטרוניקה והנע חשמלי",
      "credits": 4,
      "semester": 6,
      "prerequisites": [
        "034032",
        "114052"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034060_h1",
          "title": "תרגיל בית 1: מנועי זרם ישר וצעד",
          "type": "hw",
          "xp": 50,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034060_p1",
          "title": "עבודת מעבדה: בקרת מיקום מנוע מבוססת ארדואינו",
          "type": "project",
          "xp": 200,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034060_ex",
          "title": "מבחן סוף",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034057": {
      "code": "034057",
      "name": "מעבדה מתקדמת בהנדסת מכונות",
      "credits": 4,
      "semester": 6,
      "prerequisites": [
        "034041",
        "034040",
        "034051",
        "034058",
        "114032"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034057_p1",
          "title": "ניסוי מעבדה 1: מעבר חום וזורמים",
          "type": "project",
          "xp": 150,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034057_p2",
          "title": "ניסוי מעבדה 2: בקרה ומערכות דינמיות",
          "type": "project",
          "xp": 150,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034057_ex",
          "title": "דו\"ח מעבדה מסכם",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034371": {
      "code": "034371",
      "name": "פרויקט תכן לייצור",
      "credits": 2.5,
      "semester": 6,
      "prerequisites": [
        "034054",
        "034030"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034371_p1",
          "title": "תכנון חלקים לייצור ממוחשב ו-CNC",
          "type": "project",
          "xp": 200,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034371_ex",
          "title": "הגשה סופית של תיק ייצור",
          "type": "exam",
          "xp": 500,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034379": {
      "code": "034379",
      "name": "פרויקט גמר הנדסי 1",
      "credits": 3,
      "semester": 7,
      "prerequisites": [
        "034371"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034379_p1",
          "title": "הגשת ספר פרויקט - שלב תכנון רעיוני",
          "type": "project",
          "xp": 250,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034379_ex",
          "title": "פרזנטציה שלב א' בפני צוות הפקולטה",
          "type": "exam",
          "xp": 600,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034382": {
      "code": "034382",
      "name": "מתודולוגיות פיתוח הנדסי 1",
      "credits": 0.5,
      "semester": 7,
      "prerequisites": [
        "034054"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034382_ex",
          "title": "הצגת כלי פיתוח הנדסיים מבוססי מערכת",
          "type": "exam",
          "xp": 150,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034380": {
      "code": "034380",
      "name": "פרויקט גמר הנדסי 2",
      "credits": 3,
      "semester": 8,
      "prerequisites": [
        "034379"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034380_p1",
          "title": "בניית אב טיפוס, בדיקות שטח וביצועים",
          "type": "project",
          "xp": 350,
          "completed": false,
          "status": "not_started"
        },
        {
          "id": "034380_ex",
          "title": "יריד פרויקטים סופי והגנה מול בוחנים חיצוניים",
          "type": "exam",
          "xp": 1000,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "034383": {
      "code": "034383",
      "name": "מתודולוגיות פיתוח הנדסי 2",
      "credits": 0.5,
      "semester": 8,
      "prerequisites": [
        "034382"
      ],
      "status": "locked",
      "tasks": [
        {
          "id": "034383_ex",
          "title": "הגשת תהליך פיתוח הנדסי רפלקטיבי",
          "type": "exam",
          "xp": 150,
          "completed": false,
          "status": "not_started"
        }
      ]
    },
    "03940805": {
      "code": "03940805",
      "name": "חינוך גופני - אתלטיקה קלה / יוגה",
      "credits": 1,
      "semester": 3,
      "prerequisites": [],
      "status": "active",
      "tasks": [
        {
          "id": "03940805_att",
          "title": "נוכחות פעילה בשיעורי יוגה (חובת 80%)",
          "type": "hw",
          "xp": 100,
          "completed": false,
          "status": "not_started",
          "dueDate": ""
        }
      ],
      "type": "sports",
      "faculty": "היחידה ללימודי ספורט",
      "syllabus": "תרגול יוגה שבועי: נשימה, גמישות, שיווי משקל וחיזוק שרירי ליבה. חובת נוכחות פעילה בלפחות 80% מהשיעורים לאורך הסמסטר.",
      "lecturers": "היחידה לחינוך גופני",
      "moedA": null,
      "moedB": null,
      "schedule": [
        {
          "type": "יוגה",
          "group": 24,
          "day": "חמישי",
          "hours": "07:30 - 09:00",
          "lecturer": "",
          "room": "אולם ספורט"
        }
      ]
    }
  },
  "gpa": 86.39240506329114,
  "openTasks": 25,
  "pastExamSchedule": [
    {
      "id": "pe_104131_2026-08-05_0",
      "courseCode": "104131",
      "date": "2026-08-05",
      "title": "מד״ר: חורף 2020 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-06_1",
      "courseCode": "104131",
      "date": "2026-08-06",
      "title": "מד״ר: אביב 2023 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-06_2",
      "courseCode": "104131",
      "date": "2026-08-06",
      "title": "מד״ר: חורף 2015 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-06_3",
      "courseCode": "104131",
      "date": "2026-08-06",
      "title": "מד״ר: חורף 2022 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-07_4",
      "courseCode": "104131",
      "date": "2026-08-07",
      "title": "מד״ר: אביב 2023 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-07_5",
      "courseCode": "104131",
      "date": "2026-08-07",
      "title": "מד״ר: חורף 2018 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-07_6",
      "courseCode": "104131",
      "date": "2026-08-07",
      "title": "מד״ר: חורף 2018 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-11_7",
      "courseCode": "104131",
      "date": "2026-08-11",
      "title": "מד״ר: אביב 2024 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-11_8",
      "courseCode": "104131",
      "date": "2026-08-11",
      "title": "מד״ר: חורף 2022 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-11_9",
      "courseCode": "104131",
      "date": "2026-08-11",
      "title": "מד״ר: אביב 2024 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-12_10",
      "courseCode": "104131",
      "date": "2026-08-12",
      "title": "מד״ר: חורף 2025 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-12_11",
      "courseCode": "104131",
      "date": "2026-08-12",
      "title": "מד״ר: חורף 2026 מועד א",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-12_12",
      "courseCode": "104131",
      "date": "2026-08-12",
      "title": "מד״ר: חורף 2026 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104131_2026-08-12_13",
      "courseCode": "104131",
      "date": "2026-08-12",
      "title": "מד״ר: חורף 2021 מועד א",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-08_14",
      "courseCode": "314533",
      "date": "2026-08-08",
      "title": "חומרים: 2019 קיץ א",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-08_15",
      "courseCode": "314533",
      "date": "2026-08-08",
      "title": "חומרים: אביב 2021 מועד ג",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-08_16",
      "courseCode": "314533",
      "date": "2026-08-08",
      "title": "חומרים: אביב 2022 מועד א",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-09_17",
      "courseCode": "314533",
      "date": "2026-08-09",
      "title": "חומרים: 2018 מועד א (נייר)",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-09_18",
      "courseCode": "314533",
      "date": "2026-08-09",
      "title": "חומרים: אביב 2024 מועד א",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-09_19",
      "courseCode": "314533",
      "date": "2026-08-09",
      "title": "חומרים: אביב 2024 מועד ב",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-09_20",
      "courseCode": "314533",
      "date": "2026-08-09",
      "title": "חומרים: מאגר שאלות 2022",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-09_21",
      "courseCode": "314533",
      "date": "2026-08-09",
      "title": "חומרים: מאגר שאלות נוסף",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-10_22",
      "courseCode": "314533",
      "date": "2026-08-10",
      "title": "חומרים: 2018 מועד ב (נייר)",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-10_23",
      "courseCode": "314533",
      "date": "2026-08-10",
      "title": "חומרים: אביב 2025 מועד א",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-10_24",
      "courseCode": "314533",
      "date": "2026-08-10",
      "title": "חומרים: אביב 2025 מועד ב",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-10_25",
      "courseCode": "314533",
      "date": "2026-08-10",
      "title": "חומרים: מאגר שאלות 2021",
      "completed": true
    },
    {
      "id": "pe_314533_2026-08-10_26",
      "courseCode": "314533",
      "date": "2026-08-10",
      "title": "חומרים: סימולציה מסכמת",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-13_27",
      "courseCode": "034028",
      "date": "2026-08-13",
      "title": "מוצקים: אביב 2015 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-14_28",
      "courseCode": "034028",
      "date": "2026-08-14",
      "title": "מוצקים: אביב 2016 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-14_29",
      "courseCode": "034028",
      "date": "2026-08-14",
      "title": "מוצקים: אביב 2018 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-15_30",
      "courseCode": "034028",
      "date": "2026-08-15",
      "title": "מוצקים: אביב 2019 מועד ב",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-15_31",
      "courseCode": "034028",
      "date": "2026-08-15",
      "title": "מוצקים: אביב 2020 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-16_32",
      "courseCode": "034028",
      "date": "2026-08-16",
      "title": "מוצקים: אביב 2021 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-16_33",
      "courseCode": "034028",
      "date": "2026-08-16",
      "title": "מוצקים: אביב 2021 מועד ב",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-17_34",
      "courseCode": "034028",
      "date": "2026-08-17",
      "title": "מוצקים: אביב 2022 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-17_35",
      "courseCode": "034028",
      "date": "2026-08-17",
      "title": "מוצקים: אביב 2022 מועד ב",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-17_36",
      "courseCode": "034028",
      "date": "2026-08-17",
      "title": "מוצקים: אביב 2023 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-18_37",
      "courseCode": "034028",
      "date": "2026-08-18",
      "title": "מוצקים: 2023 מועד א 2",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-18_38",
      "courseCode": "034028",
      "date": "2026-08-18",
      "title": "מוצקים: אביב 2024 מועד א",
      "completed": true
    },
    {
      "id": "pe_034028_2026-08-18_39",
      "courseCode": "034028",
      "date": "2026-08-18",
      "title": "מוצקים: אביב 2025 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-22_40",
      "courseCode": "104043",
      "date": "2026-08-22",
      "title": "חדו״א 2: אביב 2016 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-23_41",
      "courseCode": "104043",
      "date": "2026-08-23",
      "title": "חדו״א 2: אביב 2017 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-23_42",
      "courseCode": "104043",
      "date": "2026-08-23",
      "title": "חדו״א 2: אביב 2017 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-24_43",
      "courseCode": "104043",
      "date": "2026-08-24",
      "title": "חדו״א 2: אביב 2018 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-24_44",
      "courseCode": "104043",
      "date": "2026-08-24",
      "title": "חדו״א 2: אביב 2018 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-25_45",
      "courseCode": "104043",
      "date": "2026-08-25",
      "title": "חדו״א 2: אביב 2019 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-25_46",
      "courseCode": "104043",
      "date": "2026-08-25",
      "title": "חדו״א 2: אביב 2019 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-26_47",
      "courseCode": "104043",
      "date": "2026-08-26",
      "title": "חדו״א 2: אביב 2020 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-26_48",
      "courseCode": "104043",
      "date": "2026-08-26",
      "title": "חדו״א 2: אביב 2020 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-27_49",
      "courseCode": "104043",
      "date": "2026-08-27",
      "title": "חדו״א 2: אביב 2022 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-27_50",
      "courseCode": "104043",
      "date": "2026-08-27",
      "title": "חדו״א 2: אביב 2022 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-28_51",
      "courseCode": "104043",
      "date": "2026-08-28",
      "title": "חדו״א 2: אביב 2024 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-28_52",
      "courseCode": "104043",
      "date": "2026-08-28",
      "title": "חדו״א 2: אביב 2024 מועד ב",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-29_53",
      "courseCode": "104043",
      "date": "2026-08-29",
      "title": "חדו״א 2: אביב 2025 מועד א",
      "completed": true
    },
    {
      "id": "pe_104043_2026-08-29_54",
      "courseCode": "104043",
      "date": "2026-08-29",
      "title": "חדו״א 2: אביב 2025 מועד ב",
      "completed": true
    }
  ],
  "hasLoadedSemesterBExcel": true,
  "customCalendarEvents": [],
  "hasLoadedGoogleCalendarAugust": true,
  "pastExamsBank": {
    "104043": {
      "name": "חדו״א 2 (104043)",
      "earliestYear": 2015,
      "examDate": "2026-08-05",
      "studyStartDate": "2026-08-05",
      "exams": [
        {
          "id": "exam_104043_2016_40",
          "year": "2016",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-22",
          "completed": true
        },
        {
          "id": "exam_104043_2017_41",
          "year": "2017",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-23",
          "completed": true
        },
        {
          "id": "exam_104043_2017_42",
          "year": "2017",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-23",
          "completed": true
        },
        {
          "id": "exam_104043_2018_43",
          "year": "2018",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-24",
          "completed": true
        },
        {
          "id": "exam_104043_2018_44",
          "year": "2018",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-24",
          "completed": true
        },
        {
          "id": "exam_104043_2019_45",
          "year": "2019",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-25",
          "completed": true
        },
        {
          "id": "exam_104043_2019_46",
          "year": "2019",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-25",
          "completed": true
        },
        {
          "id": "exam_104043_2020_47",
          "year": "2020",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-26",
          "completed": true
        },
        {
          "id": "exam_104043_2020_48",
          "year": "2020",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-26",
          "completed": true
        },
        {
          "id": "exam_104043_2022_49",
          "year": "2022",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-27",
          "completed": true
        },
        {
          "id": "exam_104043_2022_50",
          "year": "2022",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-27",
          "completed": true
        },
        {
          "id": "exam_104043_2024_51",
          "year": "2024",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-28",
          "completed": true
        },
        {
          "id": "exam_104043_2024_52",
          "year": "2024",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-28",
          "completed": true
        },
        {
          "id": "exam_104043_2025_53",
          "year": "2025",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-29",
          "completed": true
        },
        {
          "id": "exam_104043_2025_54",
          "year": "2025",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-29",
          "completed": true
        }
      ]
    },
    "104131": {
      "name": "מד״ר (104131)",
      "earliestYear": 2015,
      "examDate": "2026-08-13",
      "studyStartDate": "2026-08-05",
      "exams": [
        {
          "id": "exam_104131_2020_0",
          "year": "2020",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-05",
          "completed": true
        },
        {
          "id": "exam_104131_2023_1",
          "year": "2023",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-06",
          "completed": true
        },
        {
          "id": "exam_104131_2015_2",
          "year": "2015",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-06",
          "completed": true
        },
        {
          "id": "exam_104131_2022_3",
          "year": "2022",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-06",
          "completed": true
        },
        {
          "id": "exam_104131_2023_4",
          "year": "2023",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-07",
          "completed": true
        },
        {
          "id": "exam_104131_2018_5",
          "year": "2018",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-07",
          "completed": true
        },
        {
          "id": "exam_104131_2018_6",
          "year": "2018",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-07",
          "completed": true
        },
        {
          "id": "exam_104131_2024_7",
          "year": "2024",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-11",
          "completed": true
        },
        {
          "id": "exam_104131_2022_8",
          "year": "2022",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-11",
          "completed": true
        },
        {
          "id": "exam_104131_2024_9",
          "year": "2024",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-11",
          "completed": true
        },
        {
          "id": "exam_104131_2025_10",
          "year": "2025",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-12",
          "completed": true
        },
        {
          "id": "exam_104131_2026_11",
          "year": "2026",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-12",
          "completed": true
        },
        {
          "id": "exam_104131_2026_12",
          "year": "2026",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-12",
          "completed": true
        },
        {
          "id": "exam_104131_2021_13",
          "year": "2021",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-12",
          "completed": true
        }
      ]
    },
    "104228": {
      "name": "משוואות דיפרנציאליות חלקיות מ' (104228)",
      "examDate": "2027-02-24",
      "moedBDate": "2027-03-26",
      "studyStartDate": "2027-02-24",
      "earliestYear": 2018,
      "exams": [
        {
          "id": "exam_104228_2024_1",
          "year": "2024",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_104228_2024_2",
          "year": "2024",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_104228_2023_1",
          "year": "2023",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_104228_2023_2",
          "year": "2023",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        }
      ]
    },
    "114052": {
      "name": "פיסיקה 2 (114052)",
      "examDate": "2027-02-01",
      "moedBDate": "2027-03-02",
      "studyStartDate": "2027-02-01",
      "earliestYear": 2018,
      "exams": [
        {
          "id": "exam_114052_2024_1",
          "year": "2024",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_114052_2024_2",
          "year": "2024",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_114052_2023_1",
          "year": "2023",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_114052_2023_2",
          "year": "2023",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        }
      ]
    },
    "314533": {
      "name": "הנדסת חומרים (314533)",
      "earliestYear": 2015,
      "examDate": "2026-08-11",
      "studyStartDate": "2026-08-05",
      "exams": [
        {
          "id": "exam_314533_2019_14",
          "year": "2019",
          "moed": "קיץ מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-08",
          "completed": true
        },
        {
          "id": "exam_314533_2021_15",
          "year": "2021",
          "moed": "אביב מועד ג",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-08",
          "completed": true
        },
        {
          "id": "exam_314533_2022_16",
          "year": "2022",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-08",
          "completed": true
        },
        {
          "id": "exam_314533_2018_17",
          "year": "2018",
          "moed": "מועד א (נייר)",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-09",
          "completed": true
        },
        {
          "id": "exam_314533_2024_18",
          "year": "2024",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-09",
          "completed": true
        },
        {
          "id": "exam_314533_2024_19",
          "year": "2024",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-09",
          "completed": true
        },
        {
          "id": "exam_314533_2022_20",
          "year": "2022",
          "moed": "מאגר שאלות",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-09",
          "completed": true
        },
        {
          "id": "exam_314533_2022_21",
          "year": "2022",
          "moed": "מאגר שאלות נוסף",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-09",
          "completed": true
        },
        {
          "id": "exam_314533_2018_22",
          "year": "2018",
          "moed": "מועד ב (נייר)",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-10",
          "completed": true
        },
        {
          "id": "exam_314533_2025_23",
          "year": "2025",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-10",
          "completed": true
        },
        {
          "id": "exam_314533_2025_24",
          "year": "2025",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-10",
          "completed": true
        },
        {
          "id": "exam_314533_2021_25",
          "year": "2021",
          "moed": "מאגר שאלות",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-10",
          "completed": true
        },
        {
          "id": "exam_314533_2026_26",
          "year": "2026",
          "moed": "סימולציה מסכמת",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-10",
          "completed": true
        }
      ]
    },
    "034028": {
      "name": "מכניקת מוצקים (034028)",
      "earliestYear": 2015,
      "examDate": "2026-08-19",
      "studyStartDate": "2026-08-05",
      "exams": [
        {
          "id": "exam_034028_2015_27",
          "year": "2015",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-13",
          "completed": true
        },
        {
          "id": "exam_034028_2016_28",
          "year": "2016",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-14",
          "completed": true
        },
        {
          "id": "exam_034028_2018_29",
          "year": "2018",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-14",
          "completed": true
        },
        {
          "id": "exam_034028_2019_30",
          "year": "2019",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-15",
          "completed": true
        },
        {
          "id": "exam_034028_2020_31",
          "year": "2020",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-15",
          "completed": true
        },
        {
          "id": "exam_034028_2021_32",
          "year": "2021",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-16",
          "completed": true
        },
        {
          "id": "exam_034028_2021_33",
          "year": "2021",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-16",
          "completed": true
        },
        {
          "id": "exam_034028_2022_34",
          "year": "2022",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-17",
          "completed": true
        },
        {
          "id": "exam_034028_2022_35",
          "year": "2022",
          "moed": "אביב מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-17",
          "completed": true
        },
        {
          "id": "exam_034028_2023_36",
          "year": "2023",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-17",
          "completed": true
        },
        {
          "id": "exam_034028_2023_37",
          "year": "2023",
          "moed": "מועד א 2",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-18",
          "completed": true
        },
        {
          "id": "exam_034028_2024_38",
          "year": "2024",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-18",
          "completed": true
        },
        {
          "id": "exam_034028_2025_39",
          "year": "2025",
          "moed": "אביב מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "2026-08-18",
          "completed": true
        }
      ]
    },
    "034035": {
      "name": "תרמודינמיקה 1 (034035)",
      "examDate": "2027-02-07",
      "moedBDate": "2027-03-05",
      "studyStartDate": "2027-02-07",
      "earliestYear": 2018,
      "exams": [
        {
          "id": "exam_034035_2024_1",
          "year": "2024",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034035_2024_2",
          "year": "2024",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034035_2023_1",
          "year": "2023",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034035_2023_2",
          "year": "2023",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        }
      ]
    },
    "034056": {
      "name": "מבוא לחישוב מדעי והנדסי (034056)",
      "examDate": "2027-02-11",
      "moedBDate": "2027-03-10",
      "studyStartDate": "2027-02-11",
      "earliestYear": 2018,
      "exams": [
        {
          "id": "exam_034056_2024_1",
          "year": "2024",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034056_2024_2",
          "year": "2024",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034056_2023_1",
          "year": "2023",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034056_2023_2",
          "year": "2023",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        }
      ]
    },
    "034053": {
      "name": "מכניקת מוצקים 2מ (034053)",
      "examDate": "2027-02-18",
      "moedBDate": "2027-03-18",
      "studyStartDate": "2027-02-18",
      "earliestYear": 2018,
      "exams": [
        {
          "id": "exam_034053_2024_1",
          "year": "2024",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034053_2024_2",
          "year": "2024",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034053_2023_1",
          "year": "2023",
          "moed": "חורף מועד א",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        },
        {
          "id": "exam_034053_2023_2",
          "year": "2023",
          "moed": "חורף מועד ב",
          "solution": "פתרון קיים",
          "exists": true,
          "scheduledDate": "",
          "completed": false
        }
      ]
    }
  },
  "semesterGuardMode": "locked",
  "currentActiveSemester": 3
};

const AUGUST_2026_SCHEDULE = [];
const AUGUST_2026_PERSONAL_EVENTS = [];

// Load state from local storage
function loadSavedState() {

    const saved = localStorage.getItem("academic_skill_tree_save");
    let needsRestoreFromPreload = false;

    if (saved) {
        try {
            gameState = JSON.parse(saved);
            if (!gameState.courses || Object.keys(gameState.courses).length === 0 || (gameState.credits === 0 && gameState.completedCourses === 0)) {
                needsRestoreFromPreload = true;
            } else {
                Object.values(gameState.courses).forEach(course => {
                    if (course.status === 'mastered' && course.tasks) {
                        course.tasks.forEach(task => {
                            task.completed = true;
                            task.status = 'done';
                        });
                    }
                });
            }
        } catch (e) {
            console.error("Error loading save file, loading user preloaded progress", e);
            needsRestoreFromPreload = true;
        }
    } else {
        needsRestoreFromPreload = true;
    }

    if (needsRestoreFromPreload) {
        console.log("Restoring user's website progress into local storage...");
        gameState = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
        recalculateCourseStates();
    }

    // 1. Sanitize all course tasks: remove any boss battle text and obsolete/erroneous dates
    if (gameState.courses) {
        Object.values(gameState.courses).forEach(c => {
            if (!c.tasks) return;
            // Remove redundant/duplicate tasks
            c.tasks = c.tasks.filter(t => t.id !== 'task-moed-b-1786656028960');
            c.tasks.forEach(t => {
                if (t.title) {
                    t.title = t.title.replace(/\s*\(קרב בוס\)/g, "")
                                     .replace(/קרב בוס:\s*/g, "")
                                     .replace(/\s*\(מיקרו-בוס\)/g, "")
                                     .trim();
                    // Sanitize exam titles to clean Moed A / Moed B
                    if (t.title === "מבחן סופי" || t.title === "מבחן סוף") {
                        t.title = "מועד א";
                    } else if (t.title.includes("מועד ב") && (t.title.includes("מבחן סופי") || t.title.includes("מבחן סוף"))) {
                        t.title = "מועד ב'";
                    } else if (t.title.includes("מועד א") && (t.title.includes("מבחן סופי") || t.title.includes("מבחן סוף"))) {
                        t.title = "מועד א";
                    } else {
                        t.title = t.title.replace(/מבחן סופי\s*\(מועד ב'\)/g, "מועד ב'")
                                         .replace(/מבחן סופי\s*\(מועד ב\)/g, "מועד ב'")
                                         .replace(/מבחן סופי\s*\(מועד א'\)/g, "מועד א")
                                         .replace(/מבחן סופי\s*\(מועד א\)/g, "מועד א")
                                         .replace(/מבחן סופי/g, "מועד א");
                    }
                }
                // Remove incorrect homework due date on Solids exam day Aug 19
                if (t.id === '104043_h1') {
                    delete t.dueDate;
                }
            });
        });
        saveState();

        // Ensure official Winter 2026/2027 (Semester 3) exam dates & CheeseFork schedules are strictly synchronized
        if (gameState.courses['114052']) {
            const c = gameState.courses['114052'];
            if (!c.tasks) c.tasks = [];
            let exA = c.tasks.find(t => t.id === '114052_ex' || t.title === 'מועד א');
            if (exA) { exA.dueDate = '2027-02-01'; exA.title = 'מועד א'; }
            let exB = c.tasks.find(t => t.id === '114052_ex_b' || t.title === "מועד ב'");
            if (exB) { exB.dueDate = '2027-03-02'; exB.title = "מועד ב'"; }
            else { c.tasks.push({ id: '114052_ex_b', title: "מועד ב'", type: 'exam', xp: 500, completed: false, status: 'not_started', dueDate: '2027-03-02' }); }
        }
        if (gameState.courses['034035']) {
            const c = gameState.courses['034035'];
            if (!c.tasks) c.tasks = [];
            let exA = c.tasks.find(t => t.id === '034035_ex' || t.title === 'מועד א');
            if (exA) { exA.dueDate = '2027-02-07'; exA.title = 'מועד א'; }
            let exB = c.tasks.find(t => t.id === '034035_ex_b' || t.title === "מועד ב'");
            if (exB) { exB.dueDate = '2027-03-05'; exB.title = "מועד ב'"; }
            else { c.tasks.push({ id: '034035_ex_b', title: "מועד ב'", type: 'exam', xp: 500, completed: false, status: 'not_started', dueDate: '2027-03-05' }); }
        }
        if (gameState.courses['034056']) {
            const c = gameState.courses['034056'];
            if (!c.tasks) c.tasks = [];
            let exA = c.tasks.find(t => t.id === '034056_ex' || t.title === 'מועד א');
            if (exA) { exA.dueDate = '2027-02-11'; exA.title = 'מועד א'; }
            let exB = c.tasks.find(t => t.id === '034056_ex_b' || t.title === "מועד ב'");
            if (exB) { exB.dueDate = '2027-03-10'; exB.title = "מועד ב'"; }
            else { c.tasks.push({ id: '034056_ex_b', title: "מועד ב'", type: 'exam', xp: 500, completed: false, status: 'not_started', dueDate: '2027-03-10' }); }
        }
        if (gameState.courses['034053']) {
            const c = gameState.courses['034053'];
            if (!c.tasks) c.tasks = [];
            let exA = c.tasks.find(t => t.id === '034053_ex' || t.title === 'מועד א');
            if (exA) { exA.dueDate = '2027-02-18'; exA.title = 'מועד א'; }
            let exB = c.tasks.find(t => t.id === '034053_ex_b' || t.title === "מועד ב'");
            if (exB) { exB.dueDate = '2027-03-18'; exB.title = "מועד ב'"; }
            else { c.tasks.push({ id: '034053_ex_b', title: "מועד ב'", type: 'exam', xp: 550, completed: false, status: 'not_started', dueDate: '2027-03-18' }); }
        }
        if (gameState.courses['104228']) {
            const c = gameState.courses['104228'];
            if (!c.tasks) c.tasks = [];
            let exA = c.tasks.find(t => t.id === '104228_ex' || t.title === 'מועד א');
            if (exA) { exA.dueDate = '2027-02-24'; exA.title = 'מועד א'; }
            let exB = c.tasks.find(t => t.id === '104228_ex_b' || t.title === "מועד ב'");
            if (exB) { exB.dueDate = '2027-03-26'; exB.title = "מועד ב'"; }
            else { c.tasks.push({ id: '104228_ex_b', title: "מועד ב'", type: 'exam', xp: 500, completed: false, status: 'not_started', dueDate: '2027-03-26' }); }
        }
        if (gameState.courses['03940805']) {
            const c = gameState.courses['03940805'];
            c.name = 'חינוך גופני - אתלטיקה קלה / יוגה';
            if (c.tasks) c.tasks = c.tasks.filter(t => t.type !== 'exam');
            if (!c.tasks || c.tasks.length === 0) {
                c.tasks = [{ id: '03940805_att', title: 'נוכחות פעילה בשיעורי יוגה (חובת 80%)', type: 'hw', completed: false, status: 'not_started', xp: 100, dueDate: '' }];
            }
        }

        // Synchronize pastExamsBank for Semester 3
        if (!gameState.pastExamsBank) gameState.pastExamsBank = {};
        const sem3ExamInfo = {
            '114052': { name: 'פיסיקה 2 (114052)', examDate: '2027-02-01', moedBDate: '2027-03-02' },
            '034035': { name: 'תרמודינמיקה 1 (034035)', examDate: '2027-02-07', moedBDate: '2027-03-05' },
            '034056': { name: 'מבוא לחישוב מדעי והנדסי (034056)', examDate: '2027-02-11', moedBDate: '2027-03-10' },
            '034053': { name: 'מכניקת מוצקים 2 מורחב (034053)', examDate: '2027-02-18', moedBDate: '2027-03-18' },
            '104228': { name: "משוואות דיפרנציאליות חלקיות מ' (104228)", examDate: '2027-02-24', moedBDate: '2027-03-26' }
        };
        for (const [cd, inf] of Object.entries(sem3ExamInfo)) {
            if (!gameState.pastExamsBank[cd]) {
                gameState.pastExamsBank[cd] = { name: inf.name, examDate: inf.examDate, moedBDate: inf.moedBDate, studyStartDate: inf.examDate };
            } else {
                gameState.pastExamsBank[cd].examDate = inf.examDate;
                gameState.pastExamsBank[cd].moedBDate = inf.moedBDate;
            }
        }

        // Ensure official exam dates are strictly synchronized to the August 2026 calendar
        if (gameState.courses['104043']) {
            const ex = gameState.courses['104043'].tasks.find(t => t.type === 'exam');
            if (ex) { ex.dueDate = '2026-08-05'; ex.title = 'מועד א חדו״א 1pm'; }
        }
        if (gameState.courses['314533']) {
            const ex = gameState.courses['314533'].tasks.find(t => t.type === 'exam');
            if (ex) { ex.dueDate = '2026-08-11'; ex.title = 'מועד א הנדסת חומרים 9am'; }
        }
        if (gameState.courses['104131']) {
            const ex = gameState.courses['104131'].tasks.find(t => t.type === 'exam');
            if (ex) { ex.dueDate = '2026-08-13'; ex.title = 'מועד א מד״ר 9am'; }
        }
        if (gameState.courses['034028']) {
            const ex = gameState.courses['034028'].tasks.find(t => t.type === 'exam');
            if (ex) { ex.dueDate = '2026-08-19'; ex.title = 'מועד א מכניקת מוצקים 9am'; }
        }
        if (gameState.courses['034061']) {
            const proj = gameState.courses['034061'].tasks.find(t => t.title && t.title.includes('הגנה'));
            if (proj) { proj.dueDate = '2026-08-27'; }
        }
    }

    // 2. Synchronize August 2026 schedule from Google Calendar if available
    if (typeof AUGUST_2026_SCHEDULE !== 'undefined' && Array.isArray(AUGUST_2026_SCHEDULE) && AUGUST_2026_SCHEDULE.length > 0) {
        gameState.pastExamSchedule = JSON.parse(JSON.stringify(AUGUST_2026_SCHEDULE));
    } else if (!gameState.pastExamSchedule) {
        gameState.pastExamSchedule = [];
    }
    if (typeof AUGUST_2026_PERSONAL_EVENTS !== 'undefined' && Array.isArray(AUGUST_2026_PERSONAL_EVENTS) && AUGUST_2026_PERSONAL_EVENTS.length > 0) {
        gameState.customCalendarEvents = JSON.parse(JSON.stringify(AUGUST_2026_PERSONAL_EVENTS));
    } else if (!gameState.customCalendarEvents) {
        gameState.customCalendarEvents = [];
    }
    
        // Ensure official Technion Mechanical Engineering prerequisites are synchronized
        const OFFICIAL_PREREQUISITES = {
          "104041": [],
          "104043": [
                    "104041"
          ],
          "104065": [],
          "104131": [
                    "104041",
                    "104065"
          ],
          "104228": [
                    "104043",
                    "104131"
          ],
          "114032": [
                    "114052"
          ],
          "114051": [],
          "114052": [
                    "114051",
                    "104041"
          ],
          "125001": [],
          "125013": [
                    "125001"
          ],
          "234128": [],
          "314533": [
                    "125001"
          ],
          "324033": [],
          "035026": [],
          "034061": [],
          "034028": [
                    "104041",
                    "104065",
                    "114051"
          ],
          "034053": [
                    "034028",
                    "104043",
                    "104065"
          ],
          "034056": [
                    "234128",
                    "104131"
          ],
          "034035": [
                    "104043",
                    "104041"
          ],
          "03940805": [],
          "034030": [
                    "034053",
                    "034061",
                    "314533"
          ],
          "034010": [
                    "034028",
                    "114051",
                    "104043",
                    "104131"
          ],
          "034055": [
                    "034035",
                    "104131",
                    "104228"
          ],
          "034032": [
                    "104131",
                    "104065"
          ],
          "034041": [
                    "034035",
                    "034055"
          ],
          "034040": [
                    "034032"
          ],
          "034054": [
                    "034053",
                    "034030",
                    "034061",
                    "314533"
          ],
          "034058": [
                    "104043"
          ],
          "034051": [
                    "034010",
                    "034032",
                    "034053",
                    "034056",
                    "104228"
          ],
          "034060": [
                    "034032",
                    "114052"
          ],
          "034057": [
                    "034041",
                    "034040",
                    "034051",
                    "034058",
                    "114032"
          ],
          "034371": [
                    "034054",
                    "034030"
          ],
          "034379": [
                    "034371"
          ],
          "034382": [
                    "034054"
          ],
          "034380": [
                    "034379"
          ],
          "034383": [
                    "034382"
          ]
        };
        if (gameState.courses) {
            Object.entries(OFFICIAL_PREREQUISITES).forEach(([code, pres]) => {
                if (gameState.courses[code]) {
                    gameState.courses[code].prerequisites = pres;
                }
            });
        }
        gameState.hasLoadedGoogleCalendarAugustV3 = true;
        gameState.semesterGuardMode = gameState.semesterGuardMode || 'locked';
        gameState.currentActiveSemester = gameState.currentActiveSemester || 3;

    // Strict Enforcement: Future semester courses CANNOT be active or available if previous semester is not completed
    if (gameState.courses) {
        Object.values(gameState.courses).forEach(course => {
            const sem = course.semester || 1;
            if (sem > 1) {
                const prevStats = getSemesterStats(sem - 1);
                if (!prevStats.isCompleted) {
                    course.status = 'locked';
                    if (course.tasks) {
                        course.tasks.forEach(t => {
                            t.completed = false;
                            t.status = 'not_started';
                        });
                    }
                }
            }
        });
    }

    recalculateCourseStates();
    saveState();
    window.gameState = gameState;
}


// ==========================================================================
// Centralized Zero-Latency Reactive State System
// ==========================================================================
window.currentActiveTab = 'curriculum';
let isStateNotifying = false;
const viewsDirtyState = {
    curriculum: false,
    tasks: false,
    calendar: false,
    settings: false
};

function markInactiveViewsDirty(activeView) {
    Object.keys(viewsDirtyState).forEach(view => {
        if (view !== activeView) {
            viewsDirtyState[view] = true;
        } else {
            viewsDirtyState[view] = false;
        }
    });
}

// Save state to local storage safely
function saveState() {
    try {
        localStorage.setItem("academic_skill_tree_save", JSON.stringify(gameState));
    } catch (err) {
        console.error("Failed to save state to localStorage:", err);
    }
    if (typeof triggerCloudGistSyncDebounced === "function") {
        triggerCloudGistSyncDebounced();
    }
}

// Universal zero-latency state change dispatcher
function notifyStateChanged(options = {}) {
    if (isStateNotifying) return;
    isStateNotifying = true;
    try {
        if (options.recalculate !== false) {
            recalculateCourseStates();
        }

        saveState();
        window.gameState = gameState;

        // 1. Instant HUD update (<1ms)
        updateHud();

        // 2. Instant Reminders Banner update
        if (typeof renderTasksReminderBanner === 'function') {
            renderTasksReminderBanner();
        }

        // 2b. Notification Bell badge update
        if (typeof updateNotificationBadge === 'function') {
            updateNotificationBadge();
        }

        // 3. Instant update for currently active tab
        const currentTab = window.currentActiveTab || 'curriculum';
        if (currentTab === 'tasks') {
            if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
            if (typeof populateNotionCourseFilter === 'function') populateNotionCourseFilter();
            if (typeof renderExamGapRunway === 'function') renderExamGapRunway();
        } else if (currentTab === 'calendar') {
            if (typeof renderFinalsCalendar === 'function') renderFinalsCalendar();
            if (typeof renderExamGapRunway === 'function') renderExamGapRunway();
        } else if (currentTab === 'curriculum') {
            if (typeof renderFlowchartTree === 'function') renderFlowchartTree();
            if (typeof renderActiveQuestsSidebar === 'function') renderActiveQuestsSidebar();
        } else if (currentTab === 'settings') {
            if (typeof renderSettingsPage === 'function') renderSettingsPage();
        }

        markInactiveViewsDirty(currentTab);

        // 4. Refresh open course modal if visible
        const courseModal = document.getElementById("course-modal");
        if (courseModal && courseModal.classList.contains("active") && window.currentModalCourseCode) {
            const activeCourse = gameState.courses[window.currentModalCourseCode];
            if (activeCourse && typeof renderModalTaskList === 'function') {
                renderModalTaskList(activeCourse);
            }
        }
    } finally {
        isStateNotifying = false;
    }
}


// Automatically changes tasks with less than 1 week (<= 7 days) remaining to 'in_progress'
function autoUpdateTaskStatusesByDueDate() {
    let changed = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.values(gameState.courses).forEach(course => {
        if (!course.tasks || !Array.isArray(course.tasks)) return;
        if (course.status === 'mastered' || course.status === 'active') return; // Mastered courses have tasks marked as done

        course.tasks.forEach(task => {
            if (task.completed || task.status === 'done' || task.status === 'submitted') return;

            if (task.dueDate) {
                const due = new Date(task.dueDate);
                due.setHours(0, 0, 0, 0);
                const diffTime = due - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // If less than or equal to 7 days remaining (<= 7 days), auto transition to in_progress
                if (diffDays <= 7 && (task.status === 'not_started' || task.status === 'todo' || !task.status)) {
                    task.status = 'in_progress';
                    changed = true;
                }
            }
        });
    });

    return changed;
}

// Recalculate states based on prerequisites
function recalculateCourseStates() {
    let changed = false;
    autoUpdateTaskStatusesByDueDate();
    
    // Clear and recalculate stats
    let totalCredits = 0;
    let completedCount = 0;
    let slayedCount = 0;
    
    Object.keys(gameState.courses).forEach(code => {
        const course = gameState.courses[code];
        
        // Sum completed stats
        if (course.status === 'mastered') {
            totalCredits += course.credits;
            completedCount++;
            
            // Automatically mark all tasks under mastered courses as completed
            if (course.tasks && Array.isArray(course.tasks)) {
                course.tasks.forEach(task => {
                    task.completed = true;
                    task.status = 'done';
                });
            }
            
            // Count completed exams
            const exam = course.tasks.find(t => t.type === 'exam');
            if (exam && exam.completed) {
                slayedCount++;
            }
        }
    });
    
    // Calculate total open tasks count (across unlocked active/available courses)
    let openTasksCount = 0;
    Object.keys(gameState.courses).forEach(code => {
        const course = gameState.courses[code];
        if (course.status !== 'locked' && course.status !== 'mastered' && course.tasks && Array.isArray(course.tasks)) {
            course.tasks.forEach(task => {
                if (!task.completed && task.status !== 'done') {
                    openTasksCount++;
                }
            });
        }
    });

    gameState.credits = totalCredits;
    gameState.completedCourses = completedCount;
    gameState.bossesSlain = slayedCount;
    gameState.openTasks = openTasksCount;

    // Calculate general GPA (weighted by credits - ONLY passing grades >= 55)
    let totalWeightedGrades = 0;
    let gradedCreditsSum = 0;
    Object.keys(gameState.courses).forEach(code => {
        const course = gameState.courses[code];
        if (course.status === 'mastered' && course.grade !== undefined && course.grade !== null && !isNaN(course.grade) && course.grade >= 55) {
            totalWeightedGrades += (course.grade * course.credits);
            gradedCreditsSum += course.credits;
        }
    });
    gameState.gpa = gradedCreditsSum > 0 ? (totalWeightedGrades / gradedCreditsSum) : 0.00;

    // Check pre-reqs status loop to unlock available courses
    let loopChanged = true;
    while (loopChanged) {
        loopChanged = false;
        Object.keys(gameState.courses).forEach(code => {
            const course = gameState.courses[code];
            if (course.status === 'mastered') return;

            // Strict Semester Progression Guard:
            const guardMode = gameState.semesterGuardMode || 'locked';
            const sem = course.semester || 1;
            const prevSemStats = sem > 1 ? getSemesterStats(sem - 1) : { isCompleted: true };
            const isPriorSemCompleted = prevSemStats.isCompleted;

            // Check if all prerequisites are mastered
            const allPrereqsMet = !course.prerequisites || course.prerequisites.length === 0 || course.prerequisites.every(preCode => {
                const prereq = gameState.courses[preCode];
                return prereq && prereq.status === 'mastered';
            });

            // If locked mode is on and previous semester is incomplete, course MUST be locked
            if (guardMode === 'locked' && sem > 1 && !isPriorSemCompleted) {
                if (course.status !== 'locked') {
                    course.status = 'locked';
                    if (course.tasks) {
                        course.tasks.forEach(t => {
                            t.completed = false;
                            t.status = 'not_started';
                        });
                    }
                    loopChanged = true;
                    changed = true;
                }
            } else if (course.status !== 'active') {
                if (allPrereqsMet) {
                    if (course.status === 'locked') {
                        course.status = 'available';
                        loopChanged = true;
                        changed = true;
                    }
                } else {
                    if (course.status !== 'locked') {
                        course.status = 'locked';
                        loopChanged = true;
                        changed = true;
                    }
                }
            }
        });
    }
    
    return changed;
}

// Academic state update
function addXp(amount) {
    saveState();
    updateHud();
}

function showLevelUpSplash(level) {
    // Level up splash disabled
}

// Update top stats and character bars
function updateHud() {
    const totalDegreeCredits = gameState.totalDegreeCredits || (gameState.academicGoals && gameState.academicGoals.degreeCredits) || 157.5;
    const earnedCredits = gameState.credits || 0;
    const progressPercent = Math.min(100, (earnedCredits / totalDegreeCredits) * 100);

    const charTitle = document.getElementById("char-title");
    if (charTitle) charTitle.innerText = gameState.characterClass || "הנדסת מכונות (B.Sc.)";

    const charLevel = document.getElementById("char-level");
    if (charLevel) charLevel.innerText = `${progressPercent.toFixed(1)}% הושלמו`;

    const xpFill = document.getElementById("xp-bar-fill");
    if (xpFill) {
        xpFill.style.width = `${progressPercent}%`;
        xpFill.style.background = 'linear-gradient(90deg, #059669, #10b981, #34d399)';
    }

    const xpText = document.getElementById("xp-text");
    if (xpText) {
        xpText.innerHTML = `<bdi dir="ltr">${earnedCredits} / ${totalDegreeCredits}</bdi> נק״ז`;
    }

    const statCredits = document.getElementById("stat-credits");
    if (statCredits) {
        statCredits.innerHTML = `<bdi dir="ltr">${earnedCredits} / ${totalDegreeCredits}</bdi>`;
    }

    const statCompleted = document.getElementById("stat-completed-courses");
    if (statCompleted) statCompleted.innerText = gameState.completedCourses || 0;

    const openTasksEl = document.getElementById("stat-open-tasks");
    if (openTasksEl) {
        openTasksEl.innerText = gameState.openTasks !== undefined ? gameState.openTasks : 0;
    }

    const statGpa = document.getElementById("stat-gpa");
    if (statGpa) statGpa.innerText = (gameState.gpa && gameState.gpa > 0) ? gameState.gpa.toFixed(2) : "0.00";

    const statGpaHint = document.getElementById("stat-gpa-semesters-hint");
    if (statGpaHint) {
        const completedGpaList = [];
        const termNames = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳"];
        for (let s = 1; s <= 8; s++) {
            const stats = getSemesterStats(s);
            if (stats.isCompleted && stats.gpa > 0) {
                completedGpaList.push(`סמסטר ${termNames[s]}: ${stats.gpa.toFixed(2)}`);
            }
        }
        if (completedGpaList.length > 0) {
            statGpaHint.innerText = completedGpaList.join(" | ");
            statGpaHint.style.display = "block";
        } else {
            statGpaHint.style.display = "none";
        }
    }
}

// Setup interface event listeners
function setupEventListeners() {
    // Controls Panel
    document.getElementById("btn-add-course").addEventListener("click", () => {
        editingCourseCode = null;
        document.getElementById("add-course-modal-title").innerText = "הוספת קורס חדש";
        document.getElementById("add-course-submit-btn").innerText = "הוסף קורס לעץ";
        document.getElementById("form-course").reset();
        document.getElementById("add-course-modal").classList.add("active");
    });
    
    document.getElementById("add-course-close").addEventListener("click", () => {
        document.getElementById("add-course-modal").classList.remove("active");
    });

    document.getElementById("form-course").addEventListener("submit", handleAddCourseSubmit);

    document.getElementById("btn-load-me").addEventListener("click", () => {
        if (confirm("טעינת תואר בהנדסת מכונות תדרוס את השינויים הנוכחיים שלך. האם להמשיך?")) {
            gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
            gameState.characterClass = "סטודנט להנדסת מכונות (טכניון)";
            gameState.courses = JSON.parse(JSON.stringify(SAMPLE_ME_DEGREE));
            recalculateCourseStates();
            saveState();
            renderUI();
        }
    });

    document.getElementById("btn-export").addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "academic_skill_tree_save.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    document.getElementById("btn-import").addEventListener("click", () => {
        document.getElementById("import-text").value = "";
        document.getElementById("import-modal").classList.add("active");
    });

    document.getElementById("import-modal-close").addEventListener("click", () => {
        document.getElementById("import-modal").classList.remove("active");
    });

    document.getElementById("btn-import-submit").addEventListener("click", () => {
        const text = document.getElementById("import-text").value;
        try {
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object' && parsed.courses) {
                gameState = parsed;
                recalculateCourseStates();
                saveState();
                renderUI();
                document.getElementById("import-modal").classList.remove("active");
                alert("הנתונים יובאו בהצלחה!");
            } else {
                alert("פורמט שמירה לא תקין. הקובץ חייב להכיל מבנה קורסים.");
            }
        } catch (e) {
            alert("שגיאה בפענוח JSON. ודא שהעתקת את כל הקוד בשלמותו.");
        }
    });

    document.getElementById("btn-reset").addEventListener("click", () => {
        if (confirm("האם אתה בטוח שברצונך לאפס את כל התקדמות התואר? פעולה זו תמחק הכל!")) {
            gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
            recalculateCourseStates();
            saveState();
            renderUI();
        }
    });

    // Close Modals on Overlay Click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("active");
            }
        });
    });

    // Course Details modal close button
    document.getElementById("course-modal-close").addEventListener("click", () => {
        document.getElementById("course-modal").classList.remove("active");
    });

    // Splash level up close (safe null check)
    const splashCloseBtn = document.getElementById("btn-splash-close");
    if (splashCloseBtn) {
        splashCloseBtn.addEventListener("click", () => {
            const splashEl = document.getElementById("level-up-splash");
            if (splashEl) splashEl.classList.remove("active");
        });
    }

    // Quest timeline add toggle
    document.getElementById("btn-add-quest-trigger").addEventListener("click", () => {
        const form = document.getElementById("form-add-quest");
        form.style.display = form.style.display === "flex" ? "none" : "flex";
    });

    // Save Quest Button
    document.getElementById("btn-save-quest").addEventListener("click", saveQuest);

    // Modal settings dropdown trigger
    const settingsTrigger = document.getElementById("modal-settings-trigger");
    const settingsDropdown = document.getElementById("modal-settings-dropdown");
    settingsTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        settingsDropdown.style.display = settingsDropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
        if (settingsDropdown) {
            settingsDropdown.style.display = "none";
        }
    });

    // Moodle Sync Button
    document.getElementById("btn-moodle-sync").addEventListener("click", () => {
        const url = document.getElementById("moodle-url").value.trim();
        const token = document.getElementById("moodle-token").value.trim();
        if (!token) {
            runMockMoodleSync();
        } else {
            performMoodleSync(url, token);
        }
    });

    // Cheesefork Import Button
    document.getElementById("btn-cheesefork-import").addEventListener("click", () => {
        const url = document.getElementById("cheesefork-url").value.trim();
        if (!url) {
            alert("נא להזין קישור שיתוף של CheeseFork!");
            return;
        }
        importFromCheesefork(url);
    });
}

// Toggle display of inline task forms in modal
function toggleForm(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

// Handle Add Course Form Submission
function handleAddCourseSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("course-name").value.trim();
    const code = document.getElementById("course-code").value.trim().toLowerCase();
    const credits = parseFloat(document.getElementById("course-credits").value);
    const semester = parseInt(document.getElementById("course-semester").value);
    const prereqsString = document.getElementById("course-prereqs").value.trim();
    const type = document.getElementById("course-type").value;
    
    const prerequisites = prereqsString ? prereqsString.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

    // Verify all listed prerequisites actually exist
    const invalidPrereqs = prerequisites.filter(p => !gameState.courses[p]);
    if (invalidPrereqs.length > 0) {
        alert(`הקורסים הבאים המשמשים כקדמים לא קיימים בעץ עדיין: ${invalidPrereqs.join(', ')}`);
        return;
    }

    if (editingCourseCode) {
        const oldCode = editingCourseCode;
        if (code !== oldCode && gameState.courses[code]) {
            alert("קוד קורס זה כבר קיים בעץ!");
            return;
        }
        
        if (prerequisites.includes(code)) {
            alert("קורס לא יכול להיות קדם של עצמו!");
            return;
        }

        const courseObj = gameState.courses[oldCode];
        
        // If code changed, perform renaming
        if (code !== oldCode) {
            // 1. Rename task IDs for tasks inside this course (replacing the old code prefix)
            if (courseObj.tasks) {
                courseObj.tasks.forEach(task => {
                    if (task.id.startsWith(oldCode + "_")) {
                        task.id = task.id.replace(oldCode + "_", code + "_");
                    }
                });
            }
            
            // 2. Rename references in other courses' prerequisites
            Object.values(gameState.courses).forEach(otherCourse => {
                if (otherCourse.prerequisites) {
                    otherCourse.prerequisites = otherCourse.prerequisites.map(p => p === oldCode ? code : p);
                }
            });
            
            // 3. Move the course object in the gameState
            gameState.courses[code] = courseObj;
            delete gameState.courses[oldCode];
            
            courseObj.code = code;
        }

        // Update properties
        courseObj.name = name;
        courseObj.credits = credits;
        courseObj.semester = semester;
        courseObj.type = type;
        courseObj.prerequisites = prerequisites;

        editingCourseCode = null;
    } else {
        // Normal Add logic
        if (gameState.courses[code]) {
            alert("קוד קורס זה כבר קיים בעץ!");
            return;
        }

        // Default tasks for custom course
        const tasks = [
            { id: `${code}_h1`, title: "מטלת בית 1", type: "hw", xp: 50, completed: false },
            { id: `${code}_ex`, title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ];

        gameState.courses[code] = {
            code,
            name,
            credits,
            semester,
            prerequisites,
            status: 'locked',
            tasks,
            type
        };
    }

    recalculateCourseStates();
    saveState();
    renderUI();
    
    // Close modal & reset form
    document.getElementById("add-course-modal").classList.remove("active");
    document.getElementById("form-course").reset();
}

// Main Render Function
function renderUI() {
    renderFlowchartTree();
    updateHud();
    renderActiveQuestsSidebar();
}

// Render the 8 Semester Columns with cards
function renderSemestersGrid() {
    const grid = document.getElementById("semesters-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // Generate 8 semesters
    for (let sem = 1; sem <= 8; sem++) {
        const col = document.createElement("div");
        col.className = "semester-column";
        col.dataset.semester = sem;

        // Find courses for this semester
        const semCourses = Object.values(gameState.courses).filter(c => c.semester === sem);
        
        // Calculate semester weighted average (excluding failing grades < 55)
        const gradedSemCourses = semCourses.filter(c => c.status === 'mastered' && c.grade !== undefined && c.grade !== null && !isNaN(c.grade) && c.grade >= 55);
        let semAverageText = "";
        if (gradedSemCourses.length > 0) {
            let weightedSum = 0;
            let creditsSum = 0;
            gradedSemCourses.forEach(c => {
                weightedSum += (c.grade * c.credits);
                creditsSum += c.credits;
            });
            const semAvg = weightedSum / creditsSum;
            semAverageText = ` (ממוצע: ${semAvg.toFixed(1)})`;
        }

        const header = document.createElement("div");
        header.className = "semester-header";
        header.innerText = (SEMESTER_LABELS[sem] || `סמסטר ${sem}`) + semAverageText;
        col.appendChild(header);
        
        semCourses.forEach(course => {
            const card = document.createElement("div");
            card.className = `course-card ${course.status} type-${course.type || 'core'}`;
            card.id = `node-${course.code}`;
            card.dataset.code = course.code;

            // Icon for status
            let statusIcon = "🔒";
            if (course.status === 'available') statusIcon = "📖";
            if (course.status === 'active') statusIcon = "⚔️";
            if (course.status === 'mastered') statusIcon = "🏆";

            let typeLabel = "";
            const type = course.type || 'core';
            if (type === 'elective') typeLabel = "בחירה";
            else if (type === 'humanities') typeLabel = "מל״ג/הומניסטי";
            else if (type === 'sports') typeLabel = "ספורט";
            else typeLabel = "חובה";

            // Generate semester options for quick shift
            let semOptions = "";
            for (let i = 1; i <= 8; i++) {
                semOptions += `<option value="${i}" ${course.semester === i ? 'selected' : ''}>סמסטר ${i}</option>`;
            }

            card.innerHTML = `
                <div class="course-header-row">
                    <div class="course-code">${course.code.toUpperCase()}</div>
                    <div class="course-card-actions">
                        <select class="card-sem-select" title="הזז סמסטר">
                            ${semOptions}
                        </select>
                    </div>
                </div>
                <div class="course-name">${course.name}</div>
                <div class="course-meta-row">
                    <span class="course-type-tag type-${type}">${typeLabel}</span>
                    <span class="course-credits">${course.credits} נק״ז</span>
                    <span class="course-status-icon">${statusIcon}</span>
                </div>
            `;

            // Semester select listener
            const semSelect = card.querySelector(".card-sem-select");
            semSelect.addEventListener("click", (e) => e.stopPropagation());
            semSelect.addEventListener("change", (e) => {
                e.stopPropagation();
                const newSem = parseInt(e.target.value);
                course.semester = newSem;
                recalculateCourseStates();
                saveState();
                renderUI();
            });

            // Card click event
            card.addEventListener("click", () => openCourseDetails(course.code));
            col.appendChild(card);
        });

        grid.appendChild(col);
    }
}

// Render missing pre-req tree connector lines
function drawConnections() {
    const svg = document.getElementById("connections-svg");
    if (!svg) return;
    svg.innerHTML = "";
    
    const viewport = document.getElementById("tree-viewport");
    if (!viewport) return;
    const viewportRect = viewport.getBoundingClientRect();
    
    // Make SVG overlay match scrolling container width & height
    svg.style.width = `${viewport.scrollWidth}px`;
    svg.style.height = `${viewport.scrollHeight}px`;

    // Define standard arrow marker in SVG
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
        <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981"/>
        </marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
        </marker>
        <marker id="arrow-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#4b5563"/>
        </marker>
    `;
    svg.appendChild(defs);

    Object.values(gameState.courses).forEach(course => {
        const destCard = document.getElementById(`node-${course.code}`);
        if (!destCard) return;

        const destRect = destCard.getBoundingClientRect();
        
        course.prerequisites.forEach(preCode => {
            const srcCard = document.getElementById(`node-${preCode}`);
            if (!srcCard) return;

            const srcRect = srcCard.getBoundingClientRect();

            // Calculate coordinate offsets relative to the scrolling viewport container
            // Since we're in RTL, pre-req columns sit on the right and move left.
            // Source card (prerequisite) is on the right, target card is on the left.
            // Point A (source): left edge of source card
            // Point B (destination): right edge of destination card
            const scrollLeft = viewport.scrollLeft;
            const scrollTop = viewport.scrollTop;

            const xSource = (srcRect.left - viewportRect.left) + scrollLeft;
            const ySource = (srcRect.top - viewportRect.top) + (srcRect.height / 2) + scrollTop;

            const xDest = (destRect.right - viewportRect.left) + scrollLeft;
            const yDest = (destRect.top - viewportRect.top) + (destRect.height / 2) + scrollTop;

            // Draw pretty bezier curve or clean linear steps
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            
            // Control points for curve
            const dx = Math.abs(xSource - xDest) * 0.4;
            // Curves start at source and direct left (in RTL: source left -> dest right)
            const d = `M ${xSource} ${ySource} C ${xSource - dx} ${ySource}, ${xDest + dx} ${yDest}, ${xDest} ${yDest}`;
            
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke-width", "2.5");

            // Line colors matching prerequisite completion state
            const prereqCourse = gameState.courses[preCode];
            if (prereqCourse && prereqCourse.status === 'mastered') {
                path.setAttribute("stroke", "#10b981");
                                path.style.strokeDasharray = "none";
            } else if (course.status !== 'locked') {
                path.setAttribute("stroke", "#38bdf8");
                                path.style.strokeDasharray = "5,5";
            } else {
                path.setAttribute("stroke", "#4b5563");
                                path.style.strokeDasharray = "5,5";
            }

            svg.appendChild(path);
        });
    });
}

// Side-bar listing of all homework/tasks for active courses
function renderActiveQuestsSidebar() {
    const list = document.getElementById("active-quests-list");
    list.innerHTML = "";

    let hasQuests = false;

    Object.values(gameState.courses).forEach(course => {
        if (course.status !== 'active') return;

        course.tasks.forEach(task => {
            if (task.completed) return;

            hasQuests = true;

            const qEl = document.createElement("div");
            qEl.className = "quest-item-sidebar";
            
            let questTypeLabel = "📝 שיעורי בית / גיליון";
            if (task.type === 'project') questTypeLabel = "🚀 עבודה / פרויקט";
            if (task.type === 'exam') questTypeLabel = "🎓 מבחן";
            if (task.type === 'lab') questTypeLabel = "🧪 מעבדה";

            qEl.innerHTML = `
                <div class="quest-sidebar-title">${task.title}</div>
                <div class="quest-sidebar-desc">${course.name} (${questTypeLabel})</div>
            `;

            // Clicking sidebar item opens course details modal
            qEl.addEventListener("click", () => openCourseDetails(course.code));
            list.appendChild(qEl);
        });
    });

    if (!hasQuests) {
        list.innerHTML = `<div class="empty-quests">אין משימות פעילות כרגע.</div>`;
    }
}

// Open and load details into Course Details Modal
function openCourseDetails(code) {
    const course = gameState.courses[code];
    if (!course) return;

    currentSelectedCourse = course;

    // Header values
    document.getElementById("modal-course-name").innerText = course.name;
    document.getElementById("modal-course-code").innerText = course.code.toUpperCase();
    document.getElementById("modal-course-credits").innerText = `${course.credits} נקודות זכות (נק״ז)`;
    
    // Status Badge
    const badge = document.getElementById("modal-course-status");
    badge.className = `course-status-badge ${course.status}`;
    badge.innerText = STATUS_LABELS[course.status] || course.status;

    // Set current semester select value
    const semesterSelect = document.getElementById("modal-course-semester-select");
    semesterSelect.value = course.semester;
    semesterSelect.onchange = (e) => {
        course.semester = parseInt(e.target.value);
        saveState();
        renderUI();
    };

    // Grade Input & Breakdown Controller (Separating Exam Grade from Final Course Grade)
    const gradeSection = document.getElementById("modal-grade-section");
    const gradeInput = document.getElementById("modal-course-grade-input");
    const calcExamInput = document.getElementById("calc-exam-grade");
    const calcWeightInput = document.getElementById("calc-exam-weight");
    const calcHwInput = document.getElementById("calc-hw-grade");
    const calcPreview = document.getElementById("calc-preview-grade");
    const applyCalcBtn = document.getElementById("btn-apply-calculated-grade");

    const courseExams = (course.tasks || []).filter(t => t.type === 'exam');
    const latestExam = courseExams.length > 0 ? (courseExams.find(t => t.grade !== undefined && t.grade !== null) || courseExams[0]) : null;

    if (course.status === 'mastered' || (course.status === 'active' && latestExam && latestExam.grade !== undefined && latestExam.grade !== null)) {
        gradeSection.style.display = "block";
        
        // Populate inputs
        const examGradeVal = (latestExam && latestExam.grade !== undefined && latestExam.grade !== null) ? latestExam.grade : "";
        calcExamInput.value = examGradeVal;
        calcWeightInput.value = (course.examWeight !== undefined && course.examWeight !== null) ? course.examWeight : 70;
        calcHwInput.value = (course.assignmentsGrade !== undefined && course.assignmentsGrade !== null) ? course.assignmentsGrade : 100;
        gradeInput.value = (course.grade !== undefined && course.grade !== null) ? course.grade : "";

        // Function to recalculate live preview
        function updateCalcPreview() {
            const eg = parseFloat(calcExamInput.value);
            const ew = parseFloat(calcWeightInput.value);
            const hg = parseFloat(calcHwInput.value);

            if (!isNaN(eg) && !isNaN(ew) && !isNaN(hg) && ew >= 0 && ew <= 100) {
                const combined = Math.round((eg * (ew / 100)) + (hg * ((100 - ew) / 100)));
                calcPreview.innerText = combined;
                return combined;
            } else if (!isNaN(eg)) {
                calcPreview.innerText = Math.round(eg);
                return Math.round(eg);
            } else {
                calcPreview.innerText = "--";
                return null;
            }
        }

        updateCalcPreview();

        // Listeners for calculator inputs
        calcExamInput.onchange = (e) => {
            const val = parseFloat(e.target.value);
            if (latestExam) {
                latestExam.grade = (!isNaN(val) && val >= 0 && val <= 100) ? val : null;
            }
            updateCalcPreview();
            saveState();
        };

        calcWeightInput.onchange = (e) => {
            const val = parseFloat(e.target.value);
            course.examWeight = (!isNaN(val) && val >= 0 && val <= 100) ? val : 70;
            updateCalcPreview();
            saveState();
        };

        calcHwInput.onchange = (e) => {
            const val = parseFloat(e.target.value);
            course.assignmentsGrade = (!isNaN(val) && val >= 0 && val <= 100) ? val : 100;
            updateCalcPreview();
            saveState();
        };

        // Apply calculated grade button
        applyCalcBtn.onclick = () => {
            const previewVal = updateCalcPreview();
            if (previewVal !== null) {
                gradeInput.value = previewVal;
                course.grade = previewVal;
                notifyStateChanged();
            }
        };

        // Official course grade input listener (Independent from exam grade)
        gradeInput.onchange = (e) => {
            const val = parseFloat(e.target.value);
            course.grade = (!isNaN(val) && val >= 0 && val <= 100) ? val : null;
            notifyStateChanged();
        };
    } else {
        gradeSection.style.display = "none";
        gradeInput.value = "";
        gradeInput.onchange = null;
    }

    // Syllabus & Moodle Import Box controller
    const importSection = document.getElementById("modal-import-section");
    const moodleFetchBtn = document.getElementById("btn-fetch-moodle-course");
    const toggleSyllabusBtn = document.getElementById("btn-show-syllabus-paste");
    const syllabusPasteArea = document.getElementById("syllabus-paste-area");
    const submitSyllabusBtn = document.getElementById("btn-import-syllabus-submit");
    const syllabusTextArea = document.getElementById("input-syllabus-text");

    if (course.status === 'active') {
        importSection.style.display = "block";
        syllabusPasteArea.style.display = "none";
        toggleSyllabusBtn.innerText = "📝 הדבק סילבוס ידנית";
        syllabusTextArea.value = "";
        
        toggleSyllabusBtn.onclick = () => {
            if (syllabusPasteArea.style.display === "none") {
                syllabusPasteArea.style.display = "flex";
                toggleSyllabusBtn.innerText = "✖️ סגור סילבוס";
            } else {
                syllabusPasteArea.style.display = "none";
                toggleSyllabusBtn.innerText = "📝 הדבק סילבוס ידנית";
            }
        };

        moodleFetchBtn.onclick = async () => {
            const token = document.getElementById("moodle-token") ? document.getElementById("moodle-token").value.trim() : "";
            const moodleUrl = document.getElementById("moodle-url") ? document.getElementById("moodle-url").value.trim() : "https://moodle25.technion.ac.il";
            
            moodleFetchBtn.disabled = true;
            moodleFetchBtn.innerText = "🔄 מושך נתונים...";

            try {
                let tasksToImport = [];
                let realFetchSuccess = false;

                if (!token) {
                    throw new Error("נא להזין מפתח אבטחה (Token) בהגדרות לטובת סנכרון אמיתי.");
                }

                try {
                    const response = await fetch(`${moodleUrl}/webservice/rest/server.php?wstoken=${token}&wsfunction=mod_assign_get_assignments&moodlewsrestformat=json`, { mode: 'cors' });
                    if (!response.ok) {
                        throw new Error(`שגיאת שרת: ${response.status} ${response.statusText}`);
                    }
                    const data = await response.json();
                    if (data && data.exception) {
                        throw new Error(data.message || "מפתח אבטחה (Token) אינו תקין.");
                    }
                    if (data && data.courses) {
                        const moodleCourse = data.courses.find(c => c.shortname.toLowerCase().includes(course.code.toLowerCase()) || c.fullname.toLowerCase().includes(course.code.toLowerCase()));
                        if (moodleCourse && moodleCourse.assignments) {
                            tasksToImport = moodleCourse.assignments.map((assign, idx) => {
                                let type = 'hw';
                                let xp = 50;
                                const name = assign.name.toLowerCase();
                                if (name.includes('project') || name.includes('פרויקט') || name.includes('עבודה מסכמת') || name.includes('מעבדה') || name.includes('lab')) {
                                    type = 'project';
                                    xp = 150;
                                }
                                return {
                                    id: `task-${Date.now()}-${idx}`,
                                    title: assign.name,
                                    type: type,
                                    completed: false,
                                    status: 'not_started',
                                    xp: xp,
                                    dueDate: assign.duedate ? new Date(assign.duedate * 1000).toISOString().split('T')[0] : ""
                                };
                            });
                            realFetchSuccess = true;
                        }
                    }
                } catch (fetchErr) {
                    throw new Error("שגיאת חיבור לשרת מודל (ייתכן עקב חסימת CORS או בעיית רשת): " + fetchErr.message);
                }

                if (!realFetchSuccess) {
                    throw new Error("לא נמצא קורס מתאים במודל או שאין לו מטלות זמינות לייבוא.");
                }

                course.tasks = tasksToImport;
                saveState();
                recalculateCourseStates();
                alert(`🚀 בהצלחה! יובאו בהצלחה ${tasksToImport.length} משימות משרת מודל עבור קורס זה.`);
                renderModalTaskList(course);
                renderUI();
            } catch (err) {
                alert("שגיאה בייבוא ממודל: " + err.message);
            } finally {
                moodleFetchBtn.disabled = false;
                moodleFetchBtn.innerText = "🔄 משוך ממודל (Moodle)";
            }
        };

        submitSyllabusBtn.onclick = () => {
            const text = syllabusTextArea.value.trim();
            if (!text) {
                alert("אנא הדבק סילבוס קורס בתיבת הטקסט.");
                return;
            }

            const lines = text.split('\n');
            const tasksToImport = [];

            lines.forEach((line, index) => {
                const cleanLine = line.trim();
                if (!cleanLine) return;

                let type = null;
                let xp = 50;
                const lLow = cleanLine.toLowerCase();

                if (lLow.includes("מבחן") || lLow.includes("בוחן") || lLow.includes("exam") || lLow.includes("test")) {
                    type = "exam";
                    xp = 500;
                } else if (lLow.includes("פרויקט") || lLow.includes("עבודה") || lLow.includes("project") || lLow.includes("assignment") || lLow.includes("מעבדה") || lLow.includes("lab")) {
                    type = "project";
                    xp = 150;
                } else if (lLow.includes("תרגיל") || lLow.includes("מטלה") || lLow.includes("hw") || lLow.includes("homework") || lLow.includes("ex")) {
                    type = "hw";
                    xp = 50;
                }

                if (type) {
                    tasksToImport.push({
                        id: `syllabus-task-${Date.now()}-${index}`,
                        title: cleanLine.substring(0, 100),
                        type: type,
                        completed: false,
                        status: 'not_started',
                        xp: xp,
                        dueDate: ""
                    });
                }
            });

            if (tasksToImport.length === 0) {
                alert("לא הצלחנו לזהות משימות בטקסט שהזנת. נסה להשתמש במילים כמו 'תרגיל', 'פרויקט' או 'מבחן'.");
                return;
            }

            if (!tasksToImport.some(t => t.type === 'exam')) {
                tasksToImport.push({
                    id: `syllabus-task-auto-exam-${Date.now()}`,
                    title: `מבחן מסכם: ${course.name}`,
                    type: "exam",
                    completed: false,
                    status: 'not_started',
                    xp: 500,
                    dueDate: ""
                });
            }

            course.tasks = tasksToImport;
            saveState();
            recalculateCourseStates();
            alert(`📝 ניתוח הסילבוס הושלם! יובאו ${tasksToImport.length} משימות למסע הלמידה.`);
            
            syllabusTextArea.value = "";
            syllabusPasteArea.style.display = "none";
            toggleSyllabusBtn.innerText = "📝 הדבק סילבוס ידנית";
            
            renderModalTaskList(course);
            renderUI();
        };
    } else {
        importSection.style.display = "none";
    }

    // Hide dropdown menu by default on open
    document.getElementById("modal-settings-dropdown").style.display = "none";

    // Modal complete course listener
    const completeCourseBtn = document.getElementById("modal-btn-complete-course");
    if (course.status === 'mastered') {
        completeCourseBtn.innerText = "🏆 בטל השלמת קורס";
    } else {
        completeCourseBtn.innerText = "🏆 סמן כהושלם";
    }
    completeCourseBtn.onclick = () => {
        toggleCourseCompletion(course.code);
        openCourseDetails(course.code);
    };

    // Modal edit course listener
    const editCourseBtn = document.getElementById("modal-btn-edit-course");
    editCourseBtn.onclick = () => {
        // Hide details modal
        document.getElementById("course-modal").classList.remove("active");
        
        // Open edit course modal
        document.getElementById("add-course-modal").classList.add("active");
        
        // Set editing state
        editingCourseCode = course.code;
        
        // Update modal title and button text
        document.getElementById("add-course-modal-title").innerText = `עריכת קורס: ${course.name}`;
        document.getElementById("add-course-submit-btn").innerText = "שמור שינויים";
        
        // Pre-fill form fields
        document.getElementById("course-name").value = course.name;
        document.getElementById("course-code").value = course.code;
        document.getElementById("course-credits").value = course.credits;
        document.getElementById("course-semester").value = course.semester;
        document.getElementById("course-type").value = course.type || 'core';
        document.getElementById("course-prereqs").value = course.prerequisites ? course.prerequisites.join(", ") : "";
    };

    // Modal delete course listener
    const deleteCourseBtn = document.getElementById("modal-btn-delete-course");
    deleteCourseBtn.onclick = () => {
        if (confirm(`האם אתה בטוח שברצונך למחוק את הקורס ${course.name} (${course.code.toUpperCase()}) מהעץ?`)) {
            document.getElementById("course-modal").classList.remove("active");
            deleteCourse(course.code);
        }
    };

    // Register / Activate trigger panel
    const actionBox = document.getElementById("register-action-box");
    actionBox.innerHTML = "";

    const courseSem = course.semester || 1;
    const prevSemNumber = courseSem - 1;
    const isPriorSemCompleted = prevSemNumber <= 0 || getSemesterStats(prevSemNumber).isCompleted;

    if (course.status === 'locked') {
        actionBox.innerHTML = `<p style="color: #ef4444; font-weight: bold;">הקורס נעול. עליך להשלים את כל דרישות הקדם תחילה!</p>`;
    } else if (course.status === 'available') {
        if (!isPriorSemCompleted) {
            actionBox.innerHTML = `
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 12px; color: #fbbf24; font-size: 0.9rem; line-height: 1.5;">
                    🔒 <strong>הרשמה חסומה:</strong> דרישות הקדם לקורס זה הושלמו, אך לא ניתן להתחיל קורסים מסמסטר ${courseSem} עד להשלמת כל קורסי סמסטר ${prevSemNumber}!
                </div>
            `;
        } else {
            actionBox.innerHTML = `
                <p style="margin-bottom: 10px;">דרישות הקדם מולאו! הירשם לקורס כדי לפתוח את רשימת המשימות שלו.</p>
                <button class="btn btn-primary" id="btn-register-course">📖 הירשם והתחל קורס</button>
            `;
            document.getElementById("btn-register-course").addEventListener("click", () => {
                if (!isPriorSemCompleted) {
                    alert(`לא ניתן להתחיל קורסים מסמסטר ${courseSem} עד להשלמת כל קורסי סמסטר ${prevSemNumber}!`);
                    return;
                }
                course.status = 'active';
                notifyStateChanged();
                openCourseDetails(code); // refresh view
            });
        }
    } else if (course.status === 'active') {
        actionBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <p style="color: var(--accent-blue); font-weight: bold; margin: 0;">📚 אתה רשום לקורס זה כעת. השלם את המשימות והמבחן כדי להשלים את הקורס בהצלחה.</p>
                <button class="btn btn-outline" id="btn-unregister-course" style="border-color: #ef4444; color: #ef4444; padding: 4px 12px; font-size: 0.85rem;" title="בטל רישום והחזר קורס למצב ממתין/פתוח">↩️ בטל רישום לקורס</button>
            </div>
        `;
        const btnUnregister = document.getElementById("btn-unregister-course");
        if (btnUnregister) {
            btnUnregister.addEventListener("click", () => {
                if (confirm(`האם לבטל את הרישום לקורס ${course.name}? המשימות שלו יוסרו מרשימת המשימות הפעילות.`)) {
                    course.status = 'available';
                    if (course.tasks) {
                        course.tasks.forEach(t => {
                            if (t.status !== 'done') {
                                t.completed = false;
                                t.status = 'not_started';
                            }
                        });
                    }
                    notifyStateChanged();
                    openCourseDetails(code);
                }
            });
        }
    } else if (course.status === 'mastered') {
        actionBox.innerHTML = `<p style="color: var(--color-mastered); font-weight: bold;">🏆 הקורס הושלם בהצלחה! נקודות הזכות (${course.credits} נק״ז) נוספו למדדים שלך.</p>`;
    }

    // Render Completion/Improvement Banner if applicable
    let bannerDiv = document.getElementById("course-completion-banner");
    if (!bannerDiv) {
        bannerDiv = document.createElement("div");
        bannerDiv.id = "course-completion-banner";
        actionBox.parentNode.insertBefore(bannerDiv, actionBox.nextSibling);
    }

    const exams = course.tasks.filter(t => t.type === 'exam');
    const passingExam = exams.find(t => t.status === 'done' && t.grade !== undefined && t.grade !== null && t.grade >= 55);

    if (passingExam && course.status !== 'mastered') {
        bannerDiv.style.display = "block";
        bannerDiv.style.background = "rgba(16, 185, 129, 0.08)";
        bannerDiv.style.border = "2px solid var(--color-mastered)";
        bannerDiv.style.borderRadius = "8px";
        bannerDiv.style.padding = "15px";
        bannerDiv.style.margin = "15px 0";
        bannerDiv.style.textAlign = "center";
        
        bannerDiv.innerHTML = `
            <h4 style="color: var(--color-mastered); margin-top: 0; margin-bottom: 8px;">🎉 עברת את המבחן! (ציון: ${passingExam.grade})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">האם ברצונך לסיים את הקורס רשמית, או לנסות לשפר את הציון במבחן נוסף?</p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-sm" id="btn-banner-confirm-complete" style="background-color: var(--color-mastered); color: #fff; font-weight: bold; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 0.8rem;">🏆 אשר סיום קורס</button>
                <button class="btn btn-sm" id="btn-banner-improve" style="background-color: #fbbf24; color: #000; font-weight: bold; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 0.8rem;">⚡ ברצוני לשפר ציון</button>
            </div>
        `;

        document.getElementById("btn-banner-confirm-complete").onclick = () => {
            toggleCourseCompletion(course.code);
            openCourseDetails(course.code);
        };

        document.getElementById("btn-banner-improve").onclick = () => {
            const currentExams = course.tasks.filter(t => t.type === 'exam');
            const nextMoedLetter = currentExams.length === 1 ? "ב'" : (currentExams.length === 2 ? "ג'" : "ד'");
            
            course.tasks.push({
                id: `task-moed-${Date.now()}`,
                title: `מבחן סוף (מועד ${nextMoedLetter})`,
                type: "exam",
                completed: false,
                status: "not_started",
                xp: 500,
                dueDate: ""
            });
            
            saveState();
            recalculateCourseStates();
            alert(`⚡ נוסף מועד ${nextMoedLetter} למסע הקורס. בהצלחה בשיפור הציון!`);
            renderUI();
            openCourseDetails(course.code);
        };
    } else {
        bannerDiv.style.display = "none";
    }

    // Prerequisites list
    const prereqsContainer = document.getElementById("modal-prereqs-list");
    prereqsContainer.innerHTML = "";
    if (course.prerequisites.length === 0) {
        prereqsContainer.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">אין דרישות קדם לקורס זה.</span>`;
    } else {
        course.prerequisites.forEach(preCode => {
            const preCourse = gameState.courses[preCode];
            if (!preCourse) return;

            const isPassed = preCourse.status === 'mastered';
            const tag = document.createElement("span");
            tag.className = `prereq-tag ${isPassed ? 'passed' : 'missing'}`;
            tag.innerHTML = `${isPassed ? '✅' : '❌'} ${preCourse.name} (${preCode.toUpperCase()})`;
            prereqsContainer.appendChild(tag);
        });
    }

    // Hide inline add-forms
    document.getElementById("form-add-quest").style.display = 'none';

    // Reset inputs
    document.getElementById("input-quest-title").value = "";
    document.getElementById("input-quest-date").value = "";

    // CheeseFork Schedule & Exam Information Section
    const cfContainer = document.getElementById("modal-cheesefork-container");
    if (cfContainer) {
        cfContainer.innerHTML = "";
        const hasSchedule = Array.isArray(course.schedule) && course.schedule.length > 0;
        const hasExams = Boolean(course.moedA || course.moedB);
        const hasSyllabus = Boolean(course.syllabus);

        if (hasSchedule || hasExams || hasSyllabus) {
            let scheduleItemsHtml = "";
            if (hasSchedule) {
                scheduleItemsHtml = course.schedule.map(s => `
                    <div class="modal-schedule-item">
                        <div class="modal-schedule-item-time">⏰ יום ${s.day} | ${s.hours}</div>
                        <div class="modal-schedule-item-desc">${s.type} ${s.group ? `(קבוצה ${s.group})` : ''} ${s.room ? `• ${s.room}` : ''}</div>
                        ${s.lecturer ? `<div class="modal-schedule-item-lecturer">מרצה: ${s.lecturer}</div>` : ''}
                    </div>
                `).join("");
            }

            let examsHtml = "";
            if (hasExams) {
                examsHtml = `
                    <div class="modal-exam-dates-strip">
                        ${course.moedA ? `<span class="modal-exam-date-badge">🎓 מועד א': ${course.moedA}</span>` : ''}
                        ${course.moedB ? `<span class="modal-exam-date-badge">🎓 מועד ב': ${course.moedB}</span>` : ''}
                    </div>
                `;
            }

            let syllabusHtml = "";
            if (hasSyllabus) {
                syllabusHtml = `
                    <div style="margin-top: 10px; font-size: 0.78rem; color: #94a3b8; line-height: 1.45; max-height: 85px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <strong style="color: #cbd5e1; display: block; margin-bottom: 2px;">📖 תקציר סילבוס (ספר הקורסים):</strong>
                        ${course.syllabus}
                    </div>
                `;
            }

            cfContainer.innerHTML = `
                <div class="modal-cheesefork-section">
                    <div class="modal-cheesefork-header">
                        <div class="modal-cheesefork-title">
                            <span>🧀 מערכת שעות ופרטי קורס (CheeseFork)</span>
                        </div>
                        ${course.faculty ? `<span style="font-size: 0.75rem; color: var(--text-muted);">${course.faculty}</span>` : ''}
                    </div>
                    ${hasSchedule ? `<div class="modal-cheesefork-grid">${scheduleItemsHtml}</div>` : ''}
                    ${examsHtml}
                    ${syllabusHtml}
                </div>
            `;
        }
    }

    // Render task items
    renderModalTaskList(course);

    // Show modal
    document.getElementById("course-modal").classList.add("active");
}

// Render course questline journey (Notion Style Timeline) in modal
function renderModalTaskList(course) {
    const container = document.getElementById("modal-questline-container");
    if (!container) return;
    
    container.innerHTML = "";

    if (!course.tasks || course.tasks.length === 0) {
        container.innerHTML = `<div class="empty-quests" style="font-size: 0.85rem; padding: 10px;">אין משימות מוגדרות לקורס זה.</div>`;
        return;
    }

    // Sort tasks: homework first, then projects, then exams
    const sortedTasks = [...course.tasks].sort((a, b) => {
        const typeOrder = { hw: 1, project: 2, exam: 3 };
        return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
    });

    const isInteractive = course.status === 'active';

    sortedTasks.forEach(task => {
        // Initialize status and due date if missing
        if (!task.status) {
            task.status = task.completed ? 'done' : 'not_started';
        }
        if (task.dueDate === undefined) {
            task.dueDate = "";
        }

        const row = document.createElement("div");
        row.className = `quest-row ${task.status === 'done' ? 'done' : ''} ${task.status === 'in_progress' ? 'in-progress' : ''}`;
        row.dataset.id = task.id;

        // Select task icon based on type
        let icon = "📝";
        if (task.type === 'project') icon = "🚀";
        if (task.type === 'exam') icon = "🎓";
        if (task.type === 'lab') icon = "🧪";
        if (task.title && task.title.toLowerCase().includes('webwork')) icon = "🌐";

        // Generate status select options
        const statuses = [
            { value: 'not_started', label: '🔴 טרם התחיל' },
            { value: 'in_progress', label: '🟡 בתהליך' },
            { value: 'done', label: '🟢 הוגש' },
            { value: 'late', label: '❌ באיחור' }
        ];
        let statusOptions = "";
        statuses.forEach(s => {
            statusOptions += `<option value="${s.value}" ${task.status === s.value ? 'selected' : ''}>${s.label}</option>`;
        });

        const gradeInputHtml = task.type === 'exam' ? `
            <div style="display: flex; align-items: center; gap: 4px;">
                <label style="font-size: 0.7rem; color: var(--text-muted);">ציון:</label>
                <input type="number" class="exam-grade-input" min="0" max="100" value="${task.grade !== undefined && task.grade !== null ? task.grade : ''}" ${isInteractive ? '' : 'disabled'} placeholder="--" style="width: 45px; background: var(--bg-deep); border: 1px solid var(--border-color); color: var(--text-light); border-radius: 4px; padding: 2px 4px; font-size: 0.75rem; text-align: center; font-family: inherit;">
            </div>
        ` : '';

        row.innerHTML = `
            <div class="quest-main">
                <span class="quest-icon" title="${task.type === 'exam' ? 'מבחן סוף' : (task.type === 'project' ? 'מיקרו-בוס' : 'משימה')}">${icon}</span>
                <span class="quest-title" title="${task.title}">${task.title}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <!-- Date Picker -->
                <input type="date" class="quest-date-picker" value="${task.dueDate}" ${isInteractive ? '' : 'disabled'} title="תאריך הגשה">
                
                <!-- Exam Grade Input -->
                ${gradeInputHtml}

                <!-- Notion Status Select -->
                <select class="quest-status-select ${task.status.replace('_', '-')}" ${isInteractive ? '' : 'disabled'}>
                    ${statusOptions}
                </select>
                
                
                
                <!-- Delete Quest step -->
                <button class="btn-delete-quest" title="מחק שלב מהמסע" ${isInteractive ? '' : 'disabled'}>&times;</button>
            </div>
        `;

        // Add Listeners if active
        if (isInteractive) {
            // Status Select listener
            const statusSelect = row.querySelector(".quest-status-select");
            statusSelect.addEventListener("change", (e) => {
                const oldStatus = task.status;
                const newStatus = e.target.value;

                task.status = newStatus;
                task.completed = (newStatus === 'done');

                // Adjust status classes
                statusSelect.className = `quest-status-select ${newStatus.replace('_', '-')}`;
                if (newStatus === 'done') {
                    row.classList.add("done");
                    row.classList.remove("in-progress");
                } else if (newStatus === 'in_progress') {
                    row.classList.add("in-progress");
                    row.classList.remove("done");
                } else {
                    row.classList.remove("done", "in-progress");
                }

                // XP changes
                if (newStatus === 'done' && oldStatus !== 'done') {
                    addXp(task.xp);
                } else if (oldStatus === 'done' && newStatus !== 'done') {
                    addXp(-task.xp);
                }

                // Journey check: If the final exam / boss battle is marked 'done', check grade, but do NOT complete course automatically
                if (task.type === 'exam') {
                    if (newStatus === 'done') {
                        if (task.grade !== undefined && task.grade !== null && task.grade < 55) {
                            showToastNotification(`⚠️ הציון במבחן (${task.grade}) נמוך מ-55. נכשלת במבחן ונדרש מועד ב'! הקורס לא יושלם.`, 'error');
                            // Allow marking exam as done even if failed, but course remains unmastered
                            task.status = 'done';
                            task.completed = true;
                            
                            const hasMoedB = course.tasks.some(t => t.title.includes("מועד ב") || t.title.toLowerCase().includes("moed b"));
                            if (!hasMoedB) {
                                course.tasks.push({
                                    id: `task-moed-b-${Date.now()}`,
                                    title: `${task.title.replace(" (מועד ב')", "")} (מועד ב')`,
                                    type: "exam",
                                    completed: false,
                                    status: "not_started",
                                    xp: 500,
                                    dueDate: ""
                                });
                            }
                            
                            recalculateCourseStates();
                            saveState();
                            renderUI();
                            openCourseDetails(course.code);
                            return;
                        }
                        showToastNotification(`🔥 עברת את המבחן! ${task.grade ? 'ציון: ' + task.grade : ''}`, 'success');
                        recalculateCourseStates();
                        saveState();
                        renderUI();
                        openCourseDetails(course.code);
                        return;
                    } else if (newStatus !== 'done' && course.status === 'mastered') {
                        course.status = 'active';
                        uncompleteAllTasks(course);
                        recalculateCourseStates();
                        saveState();
                        renderUI();
                        openCourseDetails(course.code);
                        return;
                    }
                }

                saveState();
                renderUI();
            });

            // Exam Grade input listener
            if (task.type === 'exam') {
                const gradeInput = row.querySelector(".exam-grade-input");
                if (gradeInput) {
                    gradeInput.addEventListener("change", (e) => {
                        const val = parseInt(e.target.value);
                        task.grade = (!isNaN(val) && val >= 0 && val <= 100) ? val : null;
                        
                        // Failing grade logic
                        if (task.grade !== null && task.grade < 55) {
                            const isMoedBOrC = task.title.includes("מועד ב") || task.title.includes("מועד ג");
                            
                            if (isMoedBOrC) {
                                alert(`⚠️ נכשלת ב${task.title} (ציון ${task.grade} מתוך 100).\n\nעליך לחזור על הקורס כולו. הקורס יאופס ויועבר לסמסטר עתידי.`);
                                
                                const moveTwo = confirm("האם להעביר את הקורס לשנה הבאה (בעוד 2 סמסטרים)? לחץ ביטול כדי להעביר לסמסטר הבא.");
                                const currentSem = course.semester;
                                const nextSem = moveTwo ? Math.min(8, currentSem + 2) : Math.min(8, currentSem + 1);
                                
                                course.semester = nextSem;
                                course.status = 'available'; // Set status back to available (requires re-registration)
                                course.grade = null;
                                
                                // Reset all tasks
                                course.tasks.forEach(t => {
                                    t.status = 'not_started';
                                    t.completed = false;
                                    t.grade = null;
                                });
                                // Filter out extra Moed tasks to start clean next year
                                course.tasks = course.tasks.filter(t => !t.title.includes("מועד ב") && !t.title.includes("מועד ג"));
                                
                                recalculateCourseStates();
                                saveState();
                                document.getElementById("course-modal").classList.remove("active"); // close modal since course moved semesters
                                renderUI();
                                return;
                            } else {
                                alert(`⚠️ נכשל במבחן (ציון ${task.grade} מתוך 100). נדרש מועד ב'!`);
                                if (task.status !== 'done') {
                                    task.status = 'done';
                                    task.completed = true;
                                    addXp(task.xp);
                                }
                                
                                if (course.status === 'mastered') {
                                    course.status = 'active';
                                    uncompleteAllTasks(course);
                                }
                                
                                const hasMoedB = course.tasks.some(t => t.title.includes("מועד ב") || t.title.toLowerCase().includes("moed b"));
                                if (!hasMoedB && confirm("האם ברצונך להוסיף משימת מועד ב' למסע הקורס?")) {
                                    course.tasks.push({
                                        id: `task-moed-b-${Date.now()}`,
                                        title: `${task.title.replace(" (מועד ב')", "")} (מועד ב')`,
                                        type: "exam",
                                        completed: false,
                                        status: "not_started",
                                        xp: 500,
                                        dueDate: ""
                                    });
                                }
                            }
                        } else if (task.grade !== null && task.grade >= 55) {
                            if (task.status !== 'done') {
                                task.status = 'done';
                                task.completed = true;
                                alert(`🔥 עברת את המבחן עם ציון ${task.grade}! שים לב: ציון זה הוא ציון המבחן בלבד. הציון הסופי בקורס מורכב מחלקו של ציון המבחן יחד עם שאר המטלות.`);
                            }
                        }
                        
                        recalculateCourseStates();
                        saveState();
                        renderUI();
                        openCourseDetails(course.code);
                    });
                }
            }

            // Date picker listener
            const datePicker = row.querySelector(".quest-date-picker");
            datePicker.addEventListener("change", (e) => {
                task.dueDate = e.target.value;
                saveState();
            });

            // Delete task listener
            const deleteQuestBtn = row.querySelector(".btn-delete-quest");
            deleteQuestBtn.addEventListener("click", () => {
                if (confirm(`האם אתה בטוח שברצונך למחוק את המשימה "${task.title}" מהמסע?`)) {
                    if (task.completed || task.status === 'done') {
                        addXp(-task.xp);
                    }
                    course.tasks = course.tasks.filter(t => t.id !== task.id);
                    saveState();
                    renderUI();
                    renderModalTaskList(course);
                }
            });
        }

        container.appendChild(row);
    });
}

// Save dynamic task inside course details
function saveQuest() {
    const course = currentSelectedCourse;
    if (!course) return;

    const title = document.getElementById("input-quest-title").value.trim();
    const type = document.getElementById("input-quest-type").value;
    const date = document.getElementById("input-quest-date").value;
    const xp = parseInt(document.getElementById("input-quest-xp").value) || 50;

    if (!title) {
        alert("נא להזין תיאור משימה!");
        return;
    }

    // For exam type, ensure only one exists (or overwrite existing exam)
    if (type === 'exam') {
        course.tasks = course.tasks.filter(t => t.type !== 'exam');
    }

    const newTask = {
        id: `${course.code}_${type}_${Date.now()}`,
        title,
        type,
        xp,
        completed: false,
        status: 'not_started',
        dueDate: date
    };

    course.tasks.push(newTask);
    notifyStateChanged();
    
    // Hide form and reset fields
    document.getElementById("form-add-quest").style.display = 'none';
    document.getElementById("input-quest-title").value = "";
    document.getElementById("input-quest-date").value = "";
    document.getElementById("input-quest-xp").value = "50";
    
    renderModalTaskList(course);
}


async function importFromCheesefork(url) {
    const statusDiv = document.getElementById("cheesefork-import-status");
    statusDiv.style.color = "var(--text-light)";
    statusDiv.innerText = "Connecting to CheeseFork...";

    try {
        const urlObj = new URL(url);
        const semester = urlObj.searchParams.get("semester");
        const uid = urlObj.searchParams.get("uid");

        if (!uid || !semester) {
            throw new Error("Invalid link format. Must contain semester and uid.");
        }

        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/cheesefork-de9af/databases/(default)/documents/users/${uid}/semesters/${semester}`;
        
        const response = await fetch(firestoreUrl);
        if (!response.ok) throw new Error("Schedule not found on server.");
        
        const data = await response.json();
        
        const coursesField = data.fields[`${semester}_courses`];
        if (!coursesField || !coursesField.arrayValue || !coursesField.arrayValue.values) {
            throw new Error("No courses found in this schedule.");
        }

        const moodleCodes = coursesField.arrayValue.values.map(v => v.stringValue);
        
        // Ensure ME preset is loaded
        if (!gameState.courses["104041"]) {
            gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
            gameState.characterClass = "Student of Mechanical Engineering (Technion)";
            gameState.courses = JSON.parse(JSON.stringify(SAMPLE_ME_DEGREE));
        }

        let activatedCount = 0;
        let addedMissingCount = 0;
        moodleCodes.forEach(moodleCode => {
            const cleanCode = (moodleCode.length === 8) ? (moodleCode.substring(1, 4) + moodleCode.substring(5)) : moodleCode;
            let course = gameState.courses[cleanCode];
            if (course) {
                if (course.status !== 'mastered') {
                    course.status = 'active';
                    activatedCount++;
                }
            } else {
                // Dynamically create missing elective/sport course!
                gameState.courses[cleanCode] = {
                    code: cleanCode,
                    name: `קורס בחירה ${cleanCode}`,
                    credits: 3.0,
                    semester: 1, // default to semester 1
                    status: 'active',
                    prerequisites: [],
                    type: 'elective',
                    tasks: [
                        { id: `task-${Date.now()}-h1`, title: "תרגיל הגשה 1", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                        { id: `task-${Date.now()}-h2`, title: "תרגיל הגשה 2", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                        { id: `task-${Date.now()}-exam`, title: `מבחן מסכם בקורס ${cleanCode}`, type: "exam", completed: false, status: "not_started", xp: 500, dueDate: "" }
                    ]
                };
                addedMissingCount++;
            }
        });

        recalculateCourseStates();
        saveState();
        renderUI();

        statusDiv.style.color = "var(--color-mastered)";
        statusDiv.innerText = `Successfully imported ${moodleCodes.length} courses from CheeseFork!`;
        alert(`CheeseFork schedule imported successfully!\n\nImported ${moodleCodes.length} courses:\n- ${activatedCount} marked as Active in your skill tree.\n- ${addedMissingCount} missing elective/sport courses created dynamically.`);

    } catch (e) {
        console.error("CheeseFork import error:", e);
        statusDiv.style.color = "#ef4444";
        statusDiv.innerText = `Error: ${e.message || "Network error"}`;
    }
}

function deleteCourse(code) {
    const course = gameState.courses[code];
    if (!course) return;

    let xpRefund = 0;
    course.tasks.forEach(task => {
        if (task.completed) {
            xpRefund += task.xp;
        }
    });

    // Delete from tree
    delete gameState.courses[code];
    
    // Remove from prerequisites of all other courses
    Object.keys(gameState.courses).forEach(cCode => {
        const c = gameState.courses[cCode];
        c.prerequisites = c.prerequisites.filter(p => p !== code);
    });

    recalculateCourseStates();
    if (xpRefund > 0) {
        addXp(-xpRefund); // subtract the XP gained from this course
    } else {
        saveState();
        renderUI();
    }
}

function completeAllTasks(course) {
    let xpGained = 0;
    course.tasks.forEach(task => {
        if (task.status !== 'done') {
            task.status = 'done';
            task.completed = true;
            xpGained += task.xp;
        }
    });
    if (xpGained > 0) {
        addXp(xpGained);
    }
}

function uncompleteAllTasks(course) {
    let xpLost = 0;
    course.tasks.forEach(task => {
        if (task.status === 'done') {
            task.status = 'not_started';
            task.completed = false;
            xpLost += task.xp;
        }
    });
    if (xpLost > 0) {
        addXp(-xpLost);
    }
}

function toggleCourseCompletion(code) {
    const course = gameState.courses[code];
    if (!course) return;

    if (course.status === 'mastered') {
        course.status = 'active';
        uncompleteAllTasks(course);
        recalculateCourseStates();
    } else {
        const exams = course.tasks.filter(t => t.type === 'exam');
        if (exams.length > 0) {
            const passingExam = exams.find(t => t.grade !== undefined && t.grade !== null && t.grade >= 55);
            if (!passingExam) {
                alert(`⚠️ לא ניתן לסמן את הקורס כהושלם! נדרש להזין ציון מעבר (55 ומעלה) במבחן הסופי תחילה.`);
                return;
            }
            // If official final course grade is not set yet, calculate it from exam weight + homework rather than overwriting with exam grade alone
            if (course.grade === undefined || course.grade === null) {
                const weight = (course.examWeight !== undefined && course.examWeight !== null) ? course.examWeight : 70;
                const hwGrade = (course.assignmentsGrade !== undefined && course.assignmentsGrade !== null) ? course.assignmentsGrade : 100;
                course.grade = Math.round((passingExam.grade * (weight / 100)) + (hwGrade * ((100 - weight) / 100)));
            }
        }
        course.status = 'mastered';
        completeAllTasks(course);
        recalculateCourseStates();
    }
}

/* ==========================================================================
   Notion-Style Tasks Dashboard Logic
   ========================================================================== */

let currentNotionTask = null; // Holds the {courseCode, taskId} of the currently peeking task

// Initialize overlay, tab selectors, and filter events
// Toast notification helper
function showToastNotification(msg, type = 'info') {
    const existing = document.querySelector('.ast-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'ast-toast';
    const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


function getTaskCategoryKey(task) {
    const title = (task.title || "").toLowerCase();
    if (title.includes("webwork")) return "webwork";
    if (title.includes("גיליון") || title.includes("תרגיל בית") || title.includes("מטלת בית") || title.includes("מטלה") || task.type === "hw") return "hw";
    if (title.includes("מעבדה") || title.includes("דוח") || task.type === "lab") return "lab";
    if (title.includes("פרויקט") || title.includes("פרוייקט") || task.type === "project") return "project";
    if (task.type === "exam" || title.includes("מועד") || title.includes("מבחן")) return "exam";
    return task.type || "other";
}


// Renders the Reminder Banner for Incomplete Tasks
function renderTasksReminderBanner() {
    const banner = document.getElementById("tasks-reminders-banner");
    const container = document.getElementById("reminders-banner-body");
    const countBadge = document.getElementById("reminders-total-count");
    if (!banner || !container) return;

    container.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Group active, incomplete tasks by (course.code + "_" + category)
    const tasksByCategory = {};

    Object.values(gameState.courses).forEach(course => {
        if (course.status !== 'active') return;
        (course.tasks || []).forEach(task => {
            const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
            if (isDone) return;

            const category = getTaskCategoryKey(task);
            const groupKey = `${course.code}_${category}`;
            if (!tasksByCategory[groupKey]) {
                tasksByCategory[groupKey] = [];
            }
            tasksByCategory[groupKey].push({ course, task });
        });
    });

    // 2. Pick ONLY the first incomplete task from each category group
    // Sort group tasks: if dueDate is set, earlier date first; otherwise keep syllabus order
    const candidateItems = [];
    Object.values(tasksByCategory).forEach(groupList => {
        if (groupList.length === 0) return;
        groupList.sort((a, b) => {
            if (a.task.dueDate && b.task.dueDate) {
                return new Date(a.task.dueDate) - new Date(b.task.dueDate);
            }
            if (a.task.dueDate) return -1;
            if (b.task.dueDate) return 1;
            return 0;
        });
        candidateItems.push(groupList[0]);
    });

    // 3. Filter candidates: ONLY tasks due in less than 2 weeks (diffDays <= 14 or overdue diffDays < 0)
    const openItems = [];
    candidateItems.forEach(({ course, task }) => {
        if (!task.dueDate) {
            // No due date set: do not clutter urgent reminders banner; accessible in table below
            return;
        }

        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays > 14) {
            // Due in more than 2 weeks -> excluded from reminders
            return;
        }

        let urgency = 'upcoming';
        let urgencyText = `עוד ${diffDays} ימים`;

        if (diffDays < 0) {
            urgency = 'overdue';
            urgencyText = `🔴 באיחור של ${Math.abs(diffDays)} ימים`;
        } else if (diffDays === 0) {
            urgency = 'today';
            urgencyText = `🟠 להגשה היום!`;
        } else if (diffDays === 1) {
            urgency = 'tomorrow';
            urgencyText = `🟡 להגשה מחר!`;
        } else if (diffDays <= 7) {
            urgency = 'upcoming';
            urgencyText = `🔵 עוד ${diffDays} ימים`;
        }

        openItems.push({
            course,
            task,
            urgency,
            diffDays,
            urgencyText
        });
    });

    // 4. Sort openItems by urgency: overdue -> today -> tomorrow -> upcoming
    const urgencyOrder = { overdue: 0, today: 1, tomorrow: 2, upcoming: 3 };
    openItems.sort((a, b) => {
        const oA = urgencyOrder[a.urgency];
        const oB = urgencyOrder[b.urgency];
        if (oA !== oB) return oA - oB;
        return a.diffDays - b.diffDays;
    });

    if (countBadge) {
        countBadge.innerText = `${openItems.length} דחופות`;
    }
    if (gameState.remindersCollapsed) {
        container.classList.add("collapsed");
        const btnToggle = document.getElementById("btn-toggle-reminders-collapse");
        if (btnToggle) btnToggle.innerText = "▼";
    }

    if (openItems.length === 0) {
        container.innerHTML = `
            <div style="font-size: 0.82rem; color: #10b981; padding: 6px 0; display: flex; align-items: center; gap: 8px;">
                <span>🎉</span> <strong>אין משימות דחופות לשבועיים הקרובים! כל המשימות מוצגות בטבלה למטה.</strong>
            </div>
        `;
        return;
    }

    openItems.forEach(item => {
        const shortName = COURSE_SHORT_NAMES[item.course.code] || item.course.name;
        const chip = document.createElement("div");
        chip.className = `reminder-chip ${item.urgency}`;
        chip.dataset.courseCode = item.course.code;
        chip.dataset.taskId = item.task.id;
        chip.title = `לחץ לצפייה בפרטי המשימה (${item.course.name})`;

        chip.innerHTML = `
            <span class="reminder-quick-check" title="לחץ לסימון כהושלם">✓</span>
            <span class="reminder-urgency-badge">${item.urgencyText}</span>
            <span class="reminder-course-tag">[${shortName}]</span>
            <span class="reminder-task-title">${item.task.title}</span>
        `;

        const checkBtn = chip.querySelector(".reminder-quick-check");
        if (checkBtn) {
            checkBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleTaskStatusInState(item.course.code, item.task.id, 'done');
                saveState();
                renderNotionTasksTable();
                renderFinalsCalendar();
                renderUI();
                showToastNotification(`✅ [${shortName}] ${item.task.title} סומן כהושלם!`, 'success');
            });
        }

        chip.addEventListener("click", () => {
            openTaskSidePeek(item.course.code, item.task.id);
        });

        container.appendChild(chip);
    });
}

// System/Desktop notification for impending tasks
function triggerDueTasksDesktopNotification() {
    if (!("Notification" in window)) return;
    
    const sendNotice = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueTasks = [];

        Object.values(gameState.courses).forEach(course => {
            if (course.status !== 'active') return;
            (course.tasks || []).forEach(task => {
                const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
                if (!isDone && task.dueDate) {
                    const due = new Date(task.dueDate);
                    due.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 1) {
                        const shortName = COURSE_SHORT_NAMES[course.code] || course.name;
                        dueTasks.push({ course: shortName, task: task.title, diffDays });
                    }
                }
            });
        });

        if (dueTasks.length > 0) {
            const first = dueTasks[0];
            const timing = first.diffDays < 0 ? "באיחור!" : (first.diffDays === 0 ? "להגשה היום!" : "להגשה מחר!");
            new Notification(`🔔 תזכורת משימה: [${first.course}]`, {
                body: `${first.task} (${timing})\nישנן עוד ${dueTasks.length - 1} משימות להגשה בקרוב.`,
                icon: 'icon.png'
            });
        }
    };

    if (Notification.permission === "granted") {
        sendNotice();
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(perm => {
            if (perm === "granted") sendNotice();
        });
    }
}

function setupNotionDashboard() {
    // 1. Create and append the peek background overlay
    const overlay = document.createElement("div");
    overlay.className = "peek-overlay";
    overlay.id = "peek-overlay";
    document.body.appendChild(overlay);
    
    // Bind overlay click to close peek
    overlay.addEventListener("click", closeTaskSidePeek);
    
    // Bind side peek close button
    const closeBtn = document.getElementById("peek-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeTaskSidePeek);
    }
    
    // 2. Unified Tab Navigation Listeners (Curriculum / Tasks / Calendar / Timetable / Settings)
    const tabCurriculum = document.getElementById("tab-curriculum");
    const tabTasks = document.getElementById("tab-tasks");
    const tabCalendar = document.getElementById("tab-calendar");
    const tabTimetable = document.getElementById("tab-timetable");
    const tabSettings = document.getElementById("tab-settings");
    
    const curriculumWorkspace = document.getElementById("curriculum-tree-workspace");
    const tasksWorkspace = document.getElementById("notion-tasks-workspace");
    const timetableWorkspace = document.getElementById("timetable-workspace");
    const settingsWorkspace = document.getElementById("settings-workspace");
    const tablePane = document.getElementById("tasks-table-view-pane");
    const calPane = document.getElementById("tasks-calendar-view-pane");

    function setActiveMainTab(activeTabId) {
        window.currentActiveTab = activeTabId;
        if (tabCurriculum) tabCurriculum.classList.toggle("active", activeTabId === 'curriculum');
        if (tabTasks) tabTasks.classList.toggle("active", activeTabId === 'tasks');
        if (tabCalendar) tabCalendar.classList.toggle("active", activeTabId === 'calendar');
        if (tabTimetable) tabTimetable.classList.toggle("active", activeTabId === 'timetable');
        if (tabSettings) tabSettings.classList.toggle("active", activeTabId === 'settings');

        if (activeTabId === 'curriculum') {
            if (curriculumWorkspace) curriculumWorkspace.style.display = "flex";
            if (tasksWorkspace) tasksWorkspace.style.display = "none";
            if (timetableWorkspace) timetableWorkspace.style.display = "none";
            if (settingsWorkspace) settingsWorkspace.style.display = "none";
            if (viewsDirtyState.curriculum) {
                renderFlowchartTree();
                renderActiveQuestsSidebar();
                viewsDirtyState.curriculum = false;
            }
        } else if (activeTabId === 'tasks') {
            if (curriculumWorkspace) curriculumWorkspace.style.display = "none";
            if (tasksWorkspace) tasksWorkspace.style.display = "flex";
            if (timetableWorkspace) timetableWorkspace.style.display = "none";
            if (settingsWorkspace) settingsWorkspace.style.display = "none";
            if (tablePane) tablePane.style.display = "block";
            if (calPane) calPane.style.display = "none";
            if (viewsDirtyState.tasks) {
                populateNotionCourseFilter();
                renderNotionTasksTable();
                renderExamGapRunway();
                viewsDirtyState.tasks = false;
            } else {
                renderTasksReminderBanner();
            }
        } else if (activeTabId === 'calendar') {
            if (curriculumWorkspace) curriculumWorkspace.style.display = "none";
            if (tasksWorkspace) tasksWorkspace.style.display = "flex";
            if (timetableWorkspace) timetableWorkspace.style.display = "none";
            if (settingsWorkspace) settingsWorkspace.style.display = "none";
            if (tablePane) tablePane.style.display = "none";
            if (calPane) calPane.style.display = "block";
            if (viewsDirtyState.calendar) {
                renderFinalsCalendar();
                renderExamGapRunway();
                viewsDirtyState.calendar = false;
            }
        } else if (activeTabId === 'timetable') {
            if (curriculumWorkspace) curriculumWorkspace.style.display = "none";
            if (tasksWorkspace) tasksWorkspace.style.display = "none";
            if (timetableWorkspace) timetableWorkspace.style.display = "flex";
            if (settingsWorkspace) settingsWorkspace.style.display = "none";
            if (typeof updateDailyTimetableFocus === 'function') {
                updateDailyTimetableFocus();
            }
        } else if (activeTabId === 'settings') {
            if (curriculumWorkspace) curriculumWorkspace.style.display = "none";
            if (tasksWorkspace) tasksWorkspace.style.display = "none";
            if (timetableWorkspace) timetableWorkspace.style.display = "none";
            if (settingsWorkspace) settingsWorkspace.style.display = "flex";
            if (viewsDirtyState.settings) {
                renderSettingsPage();
                viewsDirtyState.settings = false;
            }
        }
    }

    window.setActiveMainTab = setActiveMainTab;
    window.setTasksSubview = (view) => setActiveMainTab(view === 'calendar' ? 'calendar' : (view === 'timetable' ? 'timetable' : 'tasks'));

    if (tabCurriculum) tabCurriculum.addEventListener("click", () => setActiveMainTab('curriculum'));
    if (tabTasks) tabTasks.addEventListener("click", () => setActiveMainTab('tasks'));
    if (tabCalendar) tabCalendar.addEventListener("click", () => setActiveMainTab('calendar'));
    if (tabTimetable) tabTimetable.addEventListener("click", () => setActiveMainTab('timetable'));
    if (tabSettings) tabSettings.addEventListener("click", () => setActiveMainTab('settings'));
    
    // 3. Filter Change Listeners & Popover Setup
    const filterCourse = document.getElementById("filter-course");
    const filterType = document.getElementById("filter-type");
    const searchInput = document.getElementById("search-tasks");
    
    if (filterCourse) filterCourse.addEventListener("change", renderNotionTasksTable);
    if (filterType) filterType.addEventListener("change", renderNotionTasksTable);
    if (searchInput) searchInput.addEventListener("input", renderNotionTasksTable);
    
    setupNotionFilterPopover();
    setupFlowchartViewMode();
    
    // High-performance Event Delegation for Notion Table (zero-latency interaction)
    const tableBody = document.getElementById("notion-tasks-table-body");
    if (tableBody && !tableBody.dataset.delegationBound) {
        tableBody.dataset.delegationBound = "true";

        tableBody.addEventListener("click", (e) => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const courseCode = tr.dataset.courseCode;
            const taskId = tr.dataset.taskId;
            if (!courseCode || !taskId) return;

            // 1. Checkbox click -> surgical status toggle with zero latency
            if (e.target.classList.contains("notion-row-checkbox")) {
                e.stopPropagation();
                const checked = e.target.checked;
                toggleTaskStatusInState(courseCode, taskId, checked ? 'done' : 'not_started', true);
                notifyStateChanged({ tab: 'tasks' });
                return;
            }

            // 2. Status pill click -> open inline dropdown
            if (e.target.classList.contains("notion-status-pill")) {
                e.stopPropagation();
                const course = gameState.courses[courseCode];
                const task = course ? (course.tasks || []).find(t => t.id === taskId) : null;
                showNotionStatusDropdown(e, courseCode, taskId, task ? task.status : 'not_started');
                return;
            }

            // 3. Open Peek button
            if (e.target.classList.contains("notion-open-peek-btn")) {
                e.stopPropagation();
                openTaskSidePeek(courseCode, taskId);
                return;
            }
        });

        tableBody.addEventListener("change", (e) => {
            const tr = e.target.closest("tr");
            if (!tr) return;
            const courseCode = tr.dataset.courseCode;
            const taskId = tr.dataset.taskId;
            if (!courseCode || !taskId) return;

            if (e.target.classList.contains("notion-inline-date-input")) {
                const course = gameState.courses[courseCode];
                const task = course ? (course.tasks || []).find(t => t.id === taskId) : null;
                if (task) {
                    task.dueDate = e.target.value;
                    autoUpdateTaskStatusesByDueDate();
                    notifyStateChanged({ tab: 'tasks' });
                }
            }
        });

        tableBody.addEventListener("focusout", (e) => {
            if (e.target.classList.contains("notion-title-editable")) {
                const tr = e.target.closest("tr");
                if (!tr) return;
                const courseCode = tr.dataset.courseCode;
                const taskId = tr.dataset.taskId;
                const course = gameState.courses[courseCode];
                const task = course ? (course.tasks || []).find(t => t.id === taskId) : null;
                if (task) {
                    const newText = e.target.innerText.trim();
                    if (newText && newText !== task.title) {
                        task.title = newText;
                        notifyStateChanged({ tab: 'tasks' });
                    } else {
                        e.target.innerText = task.title;
                    }
                }
            }
        });

        tableBody.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.target.classList.contains("notion-title-editable")) {
                e.preventDefault();
                e.target.blur();
            }
        });
    }

    // Select all checkbox listener
    const selectAllCheckbox = document.getElementById("select-all-tasks-checkbox");
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const checked = e.target.checked;
            const rows = document.querySelectorAll("#notion-tasks-table-body tr");
            rows.forEach(row => {
                const cb = row.querySelector(".notion-row-checkbox");
                if (cb && cb.checked !== checked) {
                    cb.checked = checked;
                    const courseCode = row.dataset.courseCode;
                    const taskId = row.dataset.taskId;
                    toggleTaskStatusInState(courseCode, taskId, checked ? 'done' : 'not_started');
                }
            });
            renderNotionTasksTable();
            renderUI();
        });
    }
    
    // 4. Subviews & Custom Task Modal Setup
    setupNotionWorkspaceSubviews();
    setupAddCustomTaskModal();
    setupSettingsPageButtons();
    // Hook new buttons for Semester 4 and Sync
    const btnSyncTasksIcs = document.getElementById("btn-sync-tasks-ics");
    if (btnSyncTasksIcs) btnSyncTasksIcs.addEventListener("click", openCalendarSyncModal);

    const btnCopyGtasksTop = document.getElementById("btn-copy-gtasks-top");
    if (btnCopyGtasksTop) btnCopyGtasksTop.addEventListener("click", copyScheduleToGoogleTasks);

    const btnToggleReminders = document.getElementById("btn-toggle-reminders-collapse");
    if (btnToggleReminders) {
        btnToggleReminders.onclick = toggleRemindersBannerCollapse;
        // Apply saved collapse state
        const body = document.getElementById("reminders-banner-body");
        if (body && gameState.remindersCollapsed) {
            body.classList.add("collapsed");
            btnToggleReminders.innerText = "▼";
        }
    }

    // Trigger impending task reminders
    setTimeout(triggerDueTasksDesktopNotification, 1500);

    
    // 5. Comment Add Click
    const addCommentBtn = document.getElementById("peek-btn-add-comment");
    if (addCommentBtn) {
        addCommentBtn.addEventListener("click", handlePeekAddComment);
    }
    
    // Textarea shift+enter support
    const commentTextarea = document.getElementById("peek-new-comment-text");
    if (commentTextarea) {
        commentTextarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePeekAddComment();
            }
        });
    }
}

// Fill Course filter dropdown with currently active courses
function populateNotionCourseFilter() {
    const select = document.getElementById("filter-course");
    if (!select) return;
    
    const currentVal = select.value || "all";
    select.innerHTML = '<option value="all">הכל (כל הקורסים)</option>';

    Object.values(gameState.courses).forEach(course => {
        if (course.status === 'active') {
            const opt = document.createElement("option");
            opt.value = course.code;
            const shortName = COURSE_SHORT_NAMES[course.code] || course.name;
            opt.innerText = `${shortName} - ${course.name} (${course.code.toUpperCase()})`;
            select.appendChild(opt);
        }
    });

    select.value = currentVal;
}

// Compute days remaining and return a styled info object
function calculateTimeRemaining(dueDateStr, isCompleted) {
    if (isCompleted) {
        return { text: "הושלם (Completed)", className: "completed" };
    }
    if (!dueDateStr) {
        return { text: "ללא תאריך", className: "normal" };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return { text: `באיחור של ${Math.abs(diffDays)} ימים`, className: "late" };
    } else if (diffDays === 0) {
        return { text: "היום! (Today)", className: "warning" };
    } else if (diffDays === 1) {
        return { text: "מחר! (Tomorrow)", className: "warning" };
    } else if (diffDays <= 3) {
        return { text: `נותרו עוד ${diffDays} ימים`, className: "warning" };
    } else {
        return { text: `נותרו עוד ${diffDays} ימים`, className: "normal" };
    }
}

// Renders the Notion Tasks Table body dynamically
function renderNotionTasksTable() {
    renderTasksReminderBanner();
    const tableBody = document.getElementById("notion-tasks-table-body");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    const courseFilterEl = document.getElementById("filter-course");
    const courseFilter = (courseFilterEl && courseFilterEl.value) ? courseFilterEl.value : "all";
    const activeStatusFilters = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : [];
    const typeFilterEl = document.getElementById("filter-type");
    const typeFilter = (typeFilterEl && typeFilterEl.value) ? typeFilterEl.value : "all";
    const searchInput = document.getElementById("search-tasks");
    const searchQuery = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : "";
    
    let allTasks = [];
    
    // Gather tasks
    Object.values(gameState.courses).forEach(course => {
        if (course.status !== 'active' && course.status !== 'mastered') return;
        if (courseFilter !== 'all' && course.code !== courseFilter) return;
        
        course.tasks.forEach(task => {
            allTasks.push({
                course: course,
                task: task
            });
        });
    });
    
    // Apply filters
    allTasks = allTasks.filter(item => {
        const t = item.task;
        
        // 1. Status Filter (Multi-select)
        const currentTaskStatus = t.status || 'not_started';
        if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(currentTaskStatus)) {
            return false;
        }
        
        // 2. Type Filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        
        // 3. Search Query
        if (searchQuery) {
            const matchesTitle = t.title.toLowerCase().includes(searchQuery);
            const matchesCourse = item.course.name.toLowerCase().includes(searchQuery) || item.course.code.toLowerCase().includes(searchQuery);
            if (!matchesTitle && !matchesCourse) return false;
        }
        
        return true;
    });
    
    // Sort tasks: Incomplete first, then by due date ascending
    allTasks.sort((a, b) => {
        const aDone = a.task.status === 'done' || a.task.status === 'submitted';
        const bDone = b.task.status === 'done' || b.task.status === 'submitted';
        if (aDone !== bDone) {
            return aDone ? 1 : -1; // Incomplete first
        }
        if (!a.task.dueDate) return 1;
        if (!b.task.dueDate) return -1;
        return new Date(a.task.dueDate) - new Date(b.task.dueDate);
    });
    
    // Render rows
    if (allTasks.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">לא נמצאו משימות מתאימות.</td></tr>`;
        return;
    }
    
    let rowsHtml = "";
    allTasks.forEach(item => {
        const c = item.course;
        const t = item.task;
        const isDone = (t.status === 'done' || t.status === 'submitted');
        const timeInfo = calculateTimeRemaining(t.dueDate, isDone);
        
        const taskBadgeHtml = getTaskTypeBadgeHtml(t);
        
        let statusClass = t.status || 'not_started';
        let displayLabel = 'not started';
        if (t.status === 'in_progress') displayLabel = 'In progress';
        else if (t.status === 'submitted') displayLabel = 'Submitted';
        else if (t.status === 'done') displayLabel = 'done';
        else if (t.status === 'late') displayLabel = 'Late';
        else if (t.status === 'not_started') displayLabel = 'not started';
        else displayLabel = STATUS_LABELS[t.status] || t.status;
        
        rowsHtml += `
            <tr data-course-code="${c.code}" data-task-id="${t.id}">
                <td><input type="checkbox" class="notion-row-checkbox" ${isDone ? 'checked' : ''}></td>
                <td>
                    <div class="notion-title-cell">
                        <span class="notion-course-tag">
                            ${taskBadgeHtml}
                            <span class="notion-title-editable" contenteditable="true" spellcheck="false" title="לחץ לעריכת שם המשימה">${t.title}</span>
                        </span>
                        <button class="notion-open-peek-btn" title="פתח תצוגת צד">🔲 OPEN</button>
                    </div>
                </td>
                <td>
                    <span class="notion-course-tag" data-course-code="${c.code}" style="cursor: pointer;" title="לחץ לשינוי סמל וצבע הקורס">
                        ${getCourseNotionIconHtml(c.code)}
                        <span>${c.name}</span>
                    </span>
                </td>
                <td class="notion-table-date-cell">
                    <input type="date" class="notion-inline-date-input" value="${t.dueDate || ''}" title="לחץ לעריכת תאריך הגשה">
                </td>
                <td><span class="time-remaining ${timeInfo.className}">${timeInfo.text}</span></td>
                <td style="position: relative;">
                    <span class="notion-status-pill ${statusClass}" title="שנה סטטוס ישירות מהרשימה">${displayLabel}</span>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = rowsHtml;
}

// Global Notion Status Dropdown Menu Component
let globalNotionDropdown = null;
let activeDropdownTaskId = null;

function initGlobalNotionDropdown() {
    if (globalNotionDropdown) return;
    
    globalNotionDropdown = document.createElement("div");
    globalNotionDropdown.className = "notion-status-dropdown-menu";
    globalNotionDropdown.id = "notion-status-dropdown-menu";
    document.body.appendChild(globalNotionDropdown);
    
    // Close on outside click
    document.addEventListener("mousedown", (e) => {
        if (globalNotionDropdown && globalNotionDropdown.style.display === "flex") {
            if (!globalNotionDropdown.contains(e.target) && !e.target.closest(".notion-status-pill")) {
                hideNotionStatusDropdown();
            }
        }
    });
    
    // Close on Esc
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            hideNotionStatusDropdown();
        }
    });
    
    // Close on scroll
    window.addEventListener("scroll", () => {
        if (globalNotionDropdown && globalNotionDropdown.style.display === "flex") {
            hideNotionStatusDropdown();
        }
    }, true);
}

function hideNotionStatusDropdown() {
    if (globalNotionDropdown) {
        globalNotionDropdown.style.display = "none";
    }
    activeDropdownTaskId = null;
}

function showNotionStatusDropdown(event, courseCode, taskId, currentStatus) {
    initGlobalNotionDropdown();
    
    // If clicking the same open dropdown pill, toggle close
    if (activeDropdownTaskId === taskId && globalNotionDropdown.style.display === "flex") {
        hideNotionStatusDropdown();
        return;
    }
    
    activeDropdownTaskId = taskId;
    
    const pill = event.currentTarget;
    const rect = pill.getBoundingClientRect();
    
    // Calculate viewport-relative coordinates (fixed positioning)
    const dropdownHeight = 220;
    let top = rect.bottom + 4;
    if (top + dropdownHeight > window.innerHeight) {
        top = Math.max(10, rect.top - dropdownHeight - 4);
    }
    let left = Math.max(10, Math.min(window.innerWidth - 200, rect.left));
    
    globalNotionDropdown.style.top = `${top}px`;
    globalNotionDropdown.style.left = `${left}px`;
    globalNotionDropdown.style.display = "flex";
    
    const options = [
        { id: "not_started", label: "not started", group: "To-do", pillClass: "not_started" },
        { id: "in_progress", label: "In progress", group: "In progress", pillClass: "in_progress" },
        { id: "done", label: "done", group: "Complete", pillClass: "done" },
        { id: "submitted", label: "Submitted", group: "Complete", pillClass: "submitted" }
    ];
    
    let html = ``;
    let currentGroup = "";
    
    options.forEach(opt => {
        if (opt.group !== currentGroup) {
            currentGroup = opt.group;
            html += `<div class="notion-dropdown-section-title">${currentGroup}</div>`;
        }
        const isSelected = (currentStatus === opt.id) ? "selected" : "";
        html += `
            <div class="notion-dropdown-item ${isSelected}" data-status-id="${opt.id}">
                <span class="notion-status-pill ${opt.pillClass}" style="pointer-events: none;">${opt.label}</span>
            </div>
        `;
    });
    
    html += `
        <div class="notion-dropdown-footer">
            <div class="notion-dropdown-action" id="notion-dropdown-edit-action">
                <span>⚙️</span>
                <span>פתח תצוגת צד (Side Peek)</span>
            </div>
        </div>
    `;
    
    globalNotionDropdown.innerHTML = html;
    
    // Bind status option clicks
    const items = globalNotionDropdown.querySelectorAll(".notion-dropdown-item");
    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            const newStatus = item.dataset.statusId;
            hideNotionStatusDropdown();
            toggleTaskStatusInState(courseCode, taskId, newStatus);
            notifyStateChanged({ tab: 'tasks' });
        });
    });
    
    // Bind Side Peek button in footer
    const editAction = globalNotionDropdown.querySelector("#notion-dropdown-edit-action");
    if (editAction) {
        editAction.addEventListener("click", (e) => {
            e.stopPropagation();
            hideNotionStatusDropdown();
            openTaskSidePeek(courseCode, taskId);
        });
    }
}

// Modify status inside our global game state and handle XP triggers
function toggleTaskStatusInState(courseCode, taskId, newStatus, skipRecalcAndSave = false) {
    const course = gameState.courses[courseCode];
    if (!course) return;
    const task = course.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;
    if (oldStatus === newStatus) return;
    
    task.status = newStatus;
    task.completed = (newStatus === 'done');
    
    const wasComplete = (oldStatus === 'done' || oldStatus === 'submitted');
    const isComplete = (newStatus === 'done' || newStatus === 'submitted');
    task.completed = isComplete;

    // Add/remove XP
    if (!wasComplete && isComplete) {
        addXp(task.xp);
    } else if (wasComplete && !isComplete) {
        addXp(-task.xp);
    }
    
    // Handle exam logic if exam status changed
    if (task.type === 'exam') {
        if (isComplete) {
            if (task.grade !== undefined && task.grade !== null && task.grade < 55) {
                showToastNotification(`⚠️ הציון במבחן (${task.grade}) נמוך מ-55. נכשלת במבחן ונדרש מועד ב'! הקורס לא יושלם.`, 'error');
                task.status = 'done';
                task.completed = true;
                
                const hasMoedB = course.tasks.some(t => t.title.includes("מועד ב") || t.title.toLowerCase().includes("moed b"));
                if (!hasMoedB) {
                    course.tasks.push({
                        id: `task-moed-b-${Date.now()}`,
                        title: `${task.title.replace(" (מועד ב')", "")} (מועד ב')`,
                        type: "exam",
                        completed: false,
                        status: "not_started",
                        xp: 500,
                        dueDate: ""
                    });
                }
            } else {
                showToastNotification(`🔥 עברת את המבחן! ${task.grade ? 'ציון: ' + task.grade : ''}`, 'success');
            }
        } else if (newStatus !== 'done' && course.status === 'mastered') {
            course.status = 'active';
            uncompleteAllTasks(course);
        }
    }
    
    if (!skipRecalcAndSave) {
        recalculateCourseStates();
        saveState();
    }
}

// Slide-in Side Peek panel rendering and control binding
function openTaskSidePeek(courseCode, taskId) {
    const course = gameState.courses[courseCode];
    if (!course) return;
    const task = course.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentNotionTask = { courseCode, taskId };
    
    document.getElementById("task-side-peek").classList.add("active");
    document.getElementById("peek-overlay").classList.add("active");
    
    document.getElementById("peek-task-title").value = task.title;
    document.getElementById("peek-property-course").innerText = `${course.name} (${course.code.toUpperCase()})`;
    
    let typeLabel = "📝 שיעורי בית / גיליון";
    if (task.type === 'project') typeLabel = "🚀 עבודה / פרויקט";
    if (task.type === 'exam') typeLabel = "🎓 מבחן";
    if (task.type === 'lab') typeLabel = "🧪 מעבדה";
    if (task.title && task.title.toLowerCase().includes('webwork')) typeLabel = "🌐 WebWork";
    document.getElementById("peek-property-type").innerText = typeLabel;
    
    document.getElementById("peek-property-xp").innerText = `+${task.xp} XP`;
    document.getElementById("peek-property-date").value = task.dueDate || "";
    
    const statusSelect = document.getElementById("peek-property-status");
    statusSelect.innerHTML = "";
    
    const statuses = [
        { val: 'not_started', label: '🔴 Not Started' },
        { val: 'in_progress', label: '🟡 In Progress' },
        { val: 'done', label: '🟢 Submitted / Done' }
    ];
    
    statuses.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.val;
        opt.innerText = s.label;
        if (task.status === s.val) {
            opt.selected = true;
        }
        statusSelect.appendChild(opt);
    });
    
    statusSelect.onchange = (e) => {
        toggleTaskStatusInState(courseCode, taskId, e.target.value);
        notifyStateChanged({ tab: 'tasks' });
    };
    
    const titleInput = document.getElementById("peek-task-title");
    titleInput.onchange = (e) => {
        task.title = e.target.value.trim() || "משימה ללא שם";
        renderNotionTasksTable();
        renderUI();
        saveState();
    };
    
    const dateInput = document.getElementById("peek-property-date");
    dateInput.onchange = (e) => {
        task.dueDate = e.target.value;
        autoUpdateTaskStatusesByDueDate();
        renderNotionTasksTable();
        renderUI();
        saveState();
    };
    
    const gradeRow = document.getElementById("peek-property-grade-row");
    const gradeInput = document.getElementById("peek-property-grade");
    if (task.type === 'exam') {
        gradeRow.style.display = "grid";
        gradeInput.value = (task.grade !== undefined && task.grade !== null) ? task.grade : "";
        
        gradeInput.onchange = (e) => {
            const val = parseInt(e.target.value);
            task.grade = (!isNaN(val) && val >= 0 && val <= 100) ? val : null;
            
            if (task.grade !== null && task.grade < 55) {
                const isMoedBOrC = task.title.includes("מועד ב") || task.title.includes("מועד ג");
                if (isMoedBOrC) {
                    showToastNotification(`⚠️ נכשלת ב${task.title} (ציון ${task.grade} מתוך 100). הקורס יועבר לסמסטר הבא.`, 'error');
                    
                    const moveTwo = false;
                    const currentSem = course.semester;
                    const nextSem = moveTwo ? Math.min(8, currentSem + 2) : Math.min(8, currentSem + 1);
                    
                    course.semester = nextSem;
                    course.status = 'available';
                    course.grade = null;
                    
                    course.tasks.forEach(t => {
                        t.status = 'not_started';
                        t.completed = false;
                        t.grade = null;
                    });
                    course.tasks = course.tasks.filter(t => !t.title.includes("מועד ב") && !t.title.includes("מועד ג"));
                    
                    closeTaskSidePeek();
                } else {
                    showToastNotification(`⚠️ נכשל במבחן (ציון ${task.grade} מתוך 100). נדרש מועד ב'!`, 'warning');
                    if (task.status !== 'done') {
                        task.status = 'done';
                        task.completed = true;
                        addXp(task.xp);
                    }
                    
                    if (course.status === 'mastered') {
                        course.status = 'active';
                        uncompleteAllTasks(course);
                    }
                    
                    const hasMoedB = course.tasks.some(t => t.title.includes("מועד ב") || t.title.toLowerCase().includes("moed b"));
                    if (!hasMoedB) {
                        course.tasks.push({
                            id: `task-moed-b-${Date.now()}`,
                            title: `${task.title.replace(" (מועד ב')", "")} (מועד ב')`,
                            type: "exam",
                            completed: false,
                            status: "not_started",
                            xp: 500,
                            dueDate: ""
                        });
                    }
                    openTaskSidePeek(courseCode, taskId);
                }
            } else if (task.grade !== null && task.grade >= 55) {
                if (task.status !== 'done') {
                    task.status = 'done';
                    task.completed = true;
                    addXp(task.xp);
                    showToastNotification(`🔥 עברת את המבחן עם ציון ${task.grade}!`, 'success');
                }
            }
            
            recalculateCourseStates();
            saveState();
            renderNotionTasksTable();
            renderUI();
        };
    } else {
        gradeRow.style.display = "none";
        gradeInput.onchange = null;
    }
    
    renderPeekComments(task);
}

// Closes the slide-in side peek
function closeTaskSidePeek() {
    document.getElementById("task-side-peek").classList.remove("active");
    document.getElementById("peek-overlay").classList.remove("active");
    currentNotionTask = null;
}

// Renders the comments log inside the side peek
function renderPeekComments(task) {
    const list = document.getElementById("peek-comments-list");
    if (!list) return;
    
    list.innerHTML = "";
    
    if (!task.comments || task.comments.length === 0) {
        list.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 15px 0;">אין הערות עדיין. הוסף הערה למטה כדי לשמור הערות למידה!</div>`;
        return;
    }
    
    task.comments.forEach(c => {
        const item = document.createElement("div");
        item.className = "peek-comment-item";
        const dateStr = new Date(c.date).toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        
        item.innerHTML = `
            <div class="peek-comment-header">
                <span style="font-weight: bold; color: var(--accent-blue);">👤 סטודנט</span>
                <span>${dateStr}</span>
            </div>
            <div class="peek-comment-text">${c.text}</div>
        `;
        list.appendChild(item);
    });
    
    list.scrollTop = list.scrollHeight;
}

// Handles submitting a new comment to the currently open task
function handlePeekAddComment() {
    if (!currentNotionTask) return;
    const { courseCode, taskId } = currentNotionTask;
    const textarea = document.getElementById("peek-new-comment-text");
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) return;
    
    const course = gameState.courses[courseCode];
    if (!course) return;
    const task = course.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (!task.comments) {
        task.comments = [];
    }
    
    task.comments.push({
        text: text,
        date: new Date().toISOString()
    });
    
    textarea.value = "";
    saveState();
    renderPeekComments(task);
}

// ==============================================================================
// Tasks Workspace Subviews (Table vs Calendar) & Exam Gap Runway
// ==============================================================================

function setupNotionWorkspaceSubviews() {
    // Sub-tabs are now merged into unified top navigation tabs (tab-curriculum, tab-tasks, tab-calendar)
    if (gameState.isFinalsMode && typeof window.setActiveMainTab === 'function') {
        window.setActiveMainTab('calendar');
    }
    renderExamGapRunway();
}

// Retrieves all active degree courses with upcoming exam dates (filters out past/completed exams)
function getDegreeExamDates(filterPast = true) {
    const exams = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check pastExamsBank
    if (gameState.pastExamsBank) {
        Object.keys(gameState.pastExamsBank).forEach(cCode => {
            const bank = gameState.pastExamsBank[cCode];
            if (bank && bank.examDate) {
                const examDate = new Date(bank.examDate);
                const examDay = new Date(examDate);
                examDay.setHours(0, 0, 0, 0);

                // Exclude past exams if filterPast is true
                if (filterPast && examDay < today) {
                    return;
                }

                const course = gameState.courses[cCode];
                const name = course ? course.name : (bank.name || cCode);
                exams.push({
                    courseCode: cCode,
                    courseName: name,
                    dateStr: bank.examDate,
                    date: examDate
                });
            }
        });
    }

    // 2. Check course tasks
    Object.values(gameState.courses).forEach(course => {
        if (!course.tasks) return;
        const examTask = course.tasks.find(t => t.type === 'exam' && t.dueDate);
        if (examTask && !exams.some(e => e.courseCode === course.code)) {
            const examDate = new Date(examTask.dueDate);
            const examDay = new Date(examDate);
            examDay.setHours(0, 0, 0, 0);

            const isDone = examTask.completed || examTask.status === 'completed' || examTask.status === 'done';

            // Exclude past or already completed exams if filterPast is true
            if (filterPast && (examDay < today || isDone)) {
                return;
            }

            exams.push({
                courseCode: course.code,
                courseName: course.name,
                dateStr: examTask.dueDate,
                date: examDate
            });
        }
    });

    const validExams = exams.filter(e => !isNaN(e.date.getTime()));
    validExams.sort((a, b) => a.date - b.date);
    return validExams;
}

function getHebrewDayOfWeek(d) {
    const days = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];
    return days[d.getDay()] || "";
}

// Renders the visual chart of days between consecutive exams (מרווחי ימים בין מבחן למבחן ועד המבחן הבא)
function renderExamGapRunway() {
    const track = document.getElementById("exam-gap-runway-track");
    if (!track) return;

    // Filter out exams that have already passed
    const exams = getDegreeExamDates(true);
    const subtitleEl = document.querySelector(".runway-subtitle");

    if (exams.length === 0) {
        track.innerHTML = `<div style="color: var(--text-muted); font-size: 0.82rem; padding: 12px; display: flex; align-items: center; gap: 8px;"><span>🎉</span><span>אין מבחנים עתידיים בלוח (כל המבחנים שהוגדרו כבר עברו או שהושלמו בהצלחה).</span></div>`;
        if (subtitleEl) subtitleEl.innerText = "כל מועדי הבחינות של הסמסטר הסתיימו בהצלחה! 🏆";
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayFormatted = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    const todayHebrewDay = getHebrewDayOfWeek(today);

    // First upcoming exam calculations
    const firstExam = exams[0];
    const firstExamDay = new Date(firstExam.date);
    firstExamDay.setHours(0, 0, 0, 0);
    const msUntilFirst = firstExamDay - today;
    const daysUntilFirst = Math.max(0, Math.round(msUntilFirst / (1000 * 60 * 60 * 24)));
    const firstExamFormatted = `${String(firstExam.date.getDate()).padStart(2, '0')}.${String(firstExam.date.getMonth() + 1).padStart(2, '0')}.${firstExam.date.getFullYear()}`;

    if (subtitleEl) {
        if (daysUntilFirst === 0) {
            subtitleEl.innerHTML = `🎯 <strong>היום:</strong> בחינה ב-${firstExam.courseName}! בהצלחה!`;
        } else if (daysUntilFirst === 1) {
            subtitleEl.innerHTML = `🎯 <strong>מחר:</strong> בחינה ב-${firstExam.courseName}!`;
        } else {
            subtitleEl.innerHTML = `🎯 <strong>המבחן הבא:</strong> ${firstExam.courseName} בעוד <strong>${daysUntilFirst} ימים</strong> (${firstExamFormatted})`;
        }
    }

    let countdownLabel = `עוד ${daysUntilFirst} ימים למבחן הבא`;
    if (daysUntilFirst === 0) countdownLabel = `היום המבחן!`;
    else if (daysUntilFirst === 1) countdownLabel = `מחר המבחן!`;

    let html = `
        <!-- Starting Point: Today -->
        <div class="runway-today-node" title="היום: ${todayFormatted}">
            <div class="runway-node-badge today">📍 היום</div>
            <div class="runway-node-title">תאריך נוכחי</div>
            <div class="runway-node-date">${todayFormatted}</div>
            <div class="runway-node-day">${todayHebrewDay}</div>
        </div>

        <!-- Connector from Today to First Upcoming Exam -->
        <div class="runway-connector countdown-to-next">
            <div class="runway-line"></div>
            <div class="runway-badge" title="נותרו עוד ${daysUntilFirst} ימים עד למבחן הבא (${firstExam.courseName})">
                <span class="runway-days">${countdownLabel}</span>
            </div>
            <div class="runway-line"></div>
        </div>
    `;

    exams.forEach((exam, idx) => {
        const d = exam.date;
        const dayFormatted = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
        const hebrewDay = getHebrewDayOfWeek(d);
        const isFirst = (idx === 0);

        const badgeText = isFirst ? `🎯 המבחן הבא` : `📝 מבחן סוף`;
        const badgeClass = isFirst ? `runway-node-badge next-up` : `runway-node-badge`;
        const nodeClass = isFirst ? `runway-exam-node is-next-exam` : `runway-exam-node`;

        html += `
            <div class="${nodeClass}" data-course-code="${exam.courseCode}" title="לחץ לפתיחת פרטי ${exam.courseName}">
                <div class="${badgeClass}">${badgeText}</div>
                <div class="runway-node-title">${exam.courseName}</div>
                <div class="runway-node-date">${dayFormatted}</div>
                <div class="runway-node-day">${hebrewDay}</div>
            </div>
        `;

        if (idx < exams.length - 1) {
            const nextExam = exams[idx + 1];
            const diffMs = nextExam.date - d;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            let paceClass = "comfortable";
            if (diffDays <= 2) {
                paceClass = "urgent";
            } else if (diffDays <= 5) {
                paceClass = "moderate";
            }

            // Only display the days number inside the badge, no text underneath
            html += `
                <div class="runway-connector ${paceClass}">
                    <div class="runway-line"></div>
                    <div class="runway-badge" title="מרווח למידה: ${diffDays} ימים">
                        <span class="runway-days">${diffDays} ימים</span>
                    </div>
                    <div class="runway-line"></div>
                </div>
            `;
        }
    });

    track.innerHTML = html;

    track.querySelectorAll(".runway-exam-node").forEach(node => {
        node.addEventListener("click", () => {
            const cCode = node.dataset.courseCode;
            if (cCode) openCourseDetails(cCode);
        });
    });
}

// ==============================================================================
// Smart Custom Task Creation Modal (Type Selection & Sequential Auto-Numbering)
// ==============================================================================

let currentTaskModalPrefix = "גיליון";
let currentTaskModalType = "hw";

function computeNextTaskNumber(courseCode, prefix) {
    const course = gameState.courses[courseCode];
    if (!course || !course.tasks || course.tasks.length === 0) return 1;

    let maxNum = 0;
    let count = 0;
    const cleanPrefix = (prefix || "").trim().toLowerCase();

    course.tasks.forEach(task => {
        const title = (task.title || "").trim();
        const lowerTitle = title.toLowerCase();

        if (lowerTitle.includes(cleanPrefix)) {
            count++;
            const regex = new RegExp(`${cleanPrefix}[\\s#_\\-]*(\\d+)`, 'i');
            const match = title.match(regex);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        }
    });

    return (maxNum > 0 ? maxNum : count) + 1;
}

function setupAddCustomTaskModal() {
    const modal = document.getElementById("modal-add-custom-task");
    const openBtn1 = document.getElementById("btn-open-add-task-modal");
    const openBtn2 = document.getElementById("btn-add-custom-task");
    const closeBtn = document.getElementById("modal-add-custom-task-close");
    const cancelBtn = document.getElementById("btn-cancel-add-task");
    const submitBtn = document.getElementById("btn-submit-add-task");
    const courseSelect = document.getElementById("new-task-course-select");
    const typePills = document.querySelectorAll(".task-type-pill");

    if (!modal) return;

    if (openBtn1) openBtn1.addEventListener("click", () => openAddCustomTaskModal());
    if (openBtn2) openBtn2.addEventListener("click", () => openAddCustomTaskModal());
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
    if (cancelBtn) cancelBtn.addEventListener("click", () => modal.style.display = "none");

    typePills.forEach(pill => {
        pill.addEventListener("click", () => {
            typePills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentTaskModalPrefix = pill.dataset.prefix;
            currentTaskModalType = pill.dataset.type;

            const xpInput = document.getElementById("new-task-xp-input");
            if (xpInput) {
                if (currentTaskModalType === 'project') xpInput.value = "150";
                else if (currentTaskModalType === 'lab') xpInput.value = "75";
                else xpInput.value = "50";
            }

            updateTaskAutoNumbering();
        });
    });

    if (courseSelect) {
        courseSelect.addEventListener("change", updateTaskAutoNumbering);
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", handleCreateTaskSubmit);
    }
}

function openAddCustomTaskModal(prefilledDate = "") {
    const modal = document.getElementById("modal-add-custom-task");
    const courseSelect = document.getElementById("new-task-course-select");
    const dateInput = document.getElementById("new-task-due-date");
    if (!modal || !courseSelect) return;

        courseSelect.innerHTML = "";
    const activeCourses = Object.values(gameState.courses).filter(c => c.status === 'active');
    if (activeCourses.length === 0) {
        alert("על מנת להוסיף משימה, עליך להפעיל קורס אחד לפחות בעץ!");
        return;
    }

    const filterCourse = document.getElementById("filter-course");
    const currentFilterVal = (filterCourse && filterCourse.value !== 'all') ? filterCourse.value : "";

    activeCourses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.code;
        const shortName = COURSE_SHORT_NAMES[c.code] || c.name;
        opt.innerText = `${shortName} - ${c.name} (${c.code.toUpperCase()})`;
        if (currentFilterVal === c.code) opt.selected = true;
        courseSelect.appendChild(opt);
    });

    if (dateInput) {
        dateInput.value = prefilledDate || "";
    }

    // Default to first pill (גיליון)
    const pills = document.querySelectorAll(".task-type-pill");
    pills.forEach(p => p.classList.remove("active"));
    const defaultPill = document.querySelector('.task-type-pill[data-prefix="גיליון"]');
    if (defaultPill) defaultPill.classList.add("active");
    currentTaskModalPrefix = "גיליון";
    currentTaskModalType = "hw";

    updateTaskAutoNumbering();
    modal.style.display = "flex";
}

function updateTaskAutoNumbering() {
    const courseSelect = document.getElementById("new-task-course-select");
    const titleInput = document.getElementById("new-task-title-input");
    const hintEl = document.getElementById("new-task-autonum-hint");
    if (!courseSelect || !titleInput) return;

    const courseCode = courseSelect.value;
    const course = gameState.courses[courseCode];
    if (!course) return;

    const nextNum = computeNextTaskNumber(courseCode, currentTaskModalPrefix);
    titleInput.value = `${currentTaskModalPrefix} ${nextNum}`;

    if (hintEl) {
        hintEl.innerText = `💡 ממוספר אוטומטית לפי היסטוריית הקורס (${course.name}): ${currentTaskModalPrefix} ${nextNum}`;
    }
}

function handleCreateTaskSubmit() {
    const modal = document.getElementById("modal-add-custom-task");
    const courseSelect = document.getElementById("new-task-course-select");
    const titleInput = document.getElementById("new-task-title-input");
    const dateInput = document.getElementById("new-task-due-date");
    const xpInput = document.getElementById("new-task-xp-input");

    if (!courseSelect || !titleInput) return;

    const courseCode = courseSelect.value;
    const course = gameState.courses[courseCode];
    if (!course) {
        alert("קורס לא תקין!");
        return;
    }

    const title = titleInput.value.trim();
    if (!title) {
        alert("נא להזין שם למשימה!");
        return;
    }

    const dueDate = dateInput ? dateInput.value : "";
    const xp = xpInput ? (parseInt(xpInput.value, 10) || 50) : 50;

    if (!course.tasks) course.tasks = [];
    course.tasks.push({
        id: `task-${Date.now()}`,
        title: title,
        type: currentTaskModalType,
        completed: false,
        status: "not_started",
        xp: xp,
        dueDate: dueDate
    });

    notifyStateChanged();

    if (modal) modal.style.display = "none";
    showToastNotification(`🚀 המשימה "${title}" נוספה בהצלחה!`, 'success');
}


// Setup Notion Filter Popover listeners
function setupNotionFilterPopover() {
    const btn = document.getElementById("notion-status-filter-btn");
    const popover = document.getElementById("notion-status-filter-popover");
    const clearBtn = document.getElementById("notion-filter-clear-btn");
    
    if (!btn || !popover) return;
    
    // Toggle popover on button click
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.toggle("show");
        btn.classList.toggle("active", popover.classList.contains("show"));
    });
    
    // Close on outside click
    document.addEventListener("mousedown", (e) => {
        if (!popover.contains(e.target) && !btn.contains(e.target)) {
            popover.classList.remove("show");
            btn.classList.remove("active");
        }
    });
    
    // Group checkbox changes
    const grpCheckboxes = popover.querySelectorAll(".notion-filter-grp-cb");
    grpCheckboxes.forEach(grpCb => {
        grpCb.addEventListener("change", (e) => {
            const grp = grpCb.dataset.group;
            const optCheckboxes = popover.querySelectorAll(`.notion-filter-opt-cb[data-group="${grp}"]`);
            optCheckboxes.forEach(optCb => {
                optCb.checked = grpCb.checked;
            });
            updateFilterSummary();
            renderNotionTasksTable();
        });
    });
    
    // Option checkbox changes
    const optCheckboxes = popover.querySelectorAll(".notion-filter-opt-cb");
    optCheckboxes.forEach(optCb => {
        optCb.addEventListener("change", (e) => {
            const grp = optCb.dataset.group;
            const grpCb = popover.querySelector(`.notion-filter-grp-cb[data-group="${grp}"]`);
            const siblingOpts = popover.querySelectorAll(`.notion-filter-opt-cb[data-group="${grp}"]`);
            
            const allChecked = Array.from(siblingOpts).every(cb => cb.checked);
            const someChecked = Array.from(siblingOpts).some(cb => cb.checked);
            
            if (grpCb) {
                grpCb.checked = allChecked;
                grpCb.indeterminate = !allChecked && someChecked;
            }
            
            updateFilterSummary();
            renderNotionTasksTable();
        });
    });
    
    // Clear selection click
    if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            optCheckboxes.forEach(cb => cb.checked = false);
            grpCheckboxes.forEach(cb => {
                cb.checked = false;
                cb.indeterminate = false;
            });
            updateFilterSummary();
            renderNotionTasksTable();
        });
    }
}

function getActiveStatusFilters() {
    const popover = document.getElementById("notion-status-filter-popover");
    if (!popover) return ['not_started', 'in_progress', 'done', 'submitted'];
    
    const checkedOpts = popover.querySelectorAll(".notion-filter-opt-cb:checked");
    return Array.from(checkedOpts).map(cb => cb.dataset.status);
}

function updateFilterSummary() {
    const summarySpan = document.getElementById("notion-status-filter-summary");
    if (!summarySpan) return;
    
    const activeFilters = getActiveStatusFilters();
    if (activeFilters.length === 4) {
        summarySpan.innerText = "הכל (4)";
    } else if (activeFilters.length === 0) {
        summarySpan.innerText = "ללא סינון";
    } else {
        summarySpan.innerText = `${activeFilters.length} נבחרו`;
    }
}



/* ==========================================================================
   Star Wars Jedi Radial Constellation Skill Tree Engine (Spacious Radial Layout)
   ========================================================================== */

// Global view modes declared at top

// 8 Generously Spaced Concentric Semester Radii (Origin: cx=750, cy=750)
const SEMESTER_RADII = {
    1: 160, // סמסטר א'
    2: 240, // סמסטר ב'
    3: 320, // סמסטר ג'
    4: 400, // סמסטר ד'
    5: 480, // סמסטר ה'
    6: 560, // סמסטר ו'
    7: 640, // סמסטר ז'
    8: 720  // סמסטר ח'
};

const SEMESTER_RING_NAMES = {
    1: "סמסטר א'",
    2: "סמסטר ב'",
    3: "סמסטר ג'",
    4: "סמסטר ד'",
    5: "סמסטר ה'",
    6: "סמסטר ו'",
    7: "סמסטר ז'",
    8: "סמסטר ח'"
};

// Handcrafted wide-span angular placements (Zero Collisions guaranteed!)
const DEGREE_CONSTELLATION_ANGLES = {
    // === LEFT PILLAR: Mathematics & Sciences (115° - 165°) ===
    "125001": { sem: 1, angle: 165, branch: "math" }, // כימיה כללית
    "104065": { sem: 1, angle: 140, branch: "math" }, // אלגברה ליניארית
    "104041": { sem: 1, angle: 115, branch: "math" }, // חדו״א 1מ1
    "114051": { sem: 2, angle: 165, branch: "math" }, // פיזיקה 1
    "104131": { sem: 2, angle: 140, branch: "math" }, // מד״ר
    "104043": { sem: 2, angle: 115, branch: "math" }, // חדו״א 2מ'
    "114052": { sem: 3, angle: 160, branch: "math" }, // פיזיקה 2
    "104228": { sem: 3, angle: 130, branch: "math" }, // שיטות נומריות
    "125013": { sem: 4, angle: 150, branch: "math" }, // כימיה פיזיקלית
    "114032": { sem: 5, angle: 150, branch: "math" }, // מעבדה בפיזיקה

    // === CENTER PILLAR: Mechanics, Design & Materials (75° - 105°) ===
    "035026": { sem: 1, angle: 90,  branch: "mechanics" }, // מבוא יצירתי
    "034061": { sem: 2, angle: 105, branch: "mechanics" }, // גרפיקה ותכן
    "034028": { sem: 2, angle: 90,  branch: "mechanics" }, // מוצקים 1
    "314533": { sem: 2, angle: 75,  branch: "mechanics" }, // מבוא לחומרים
    "034053": { sem: 3, angle: 95,  branch: "mechanics" }, // מוצקים 2
    "034056": { sem: 3, angle: 75,  branch: "mechanics" }, // שיטות ייצור
    "034030": { sem: 4, angle: 105, branch: "mechanics" }, // אלסטיות
    "034010": { sem: 4, angle: 85,  branch: "mechanics" }, // דינמיקה
    "034054": { sem: 5, angle: 105, branch: "mechanics" }, // תכן מכני 1
    "034051": { sem: 5, angle: 90,  branch: "mechanics" }, // מוצקים 3
    "034058": { sem: 5, angle: 75,  branch: "mechanics" }, // תהליכי ייצור
    "034057": { sem: 6, angle: 105, branch: "mechanics" }, // מעבדה מתקדמת
    "034371": { sem: 6, angle: 88,  branch: "mechanics" }, // תכן מכני 2
    "034379": { sem: 7, angle: 90,  branch: "mechanics" }, // פרויקט תכן 1
    "034380": { sem: 8, angle: 90,  branch: "mechanics" }, // פרויקט תכן 2

    // === RIGHT PILLAR: Thermo-Fluids, Energy & Electives (25° - 65°) ===
    "234128": { sem: 1, angle: 60,  branch: "thermo" }, // פייתון
    "324033": { sem: 1, angle: 25,  branch: "thermo" }, // אנגלית
    "034035": { sem: 3, angle: 45,  branch: "thermo" }, // תרמודינמיקה 1
    "034055": { sem: 4, angle: 50,  branch: "thermo" }, // תורת הזרימה 1
    "034032": { sem: 4, angle: 25,  branch: "thermo" }, // מערכות תרמיות
    "034041": { sem: 5, angle: 50,  branch: "thermo" }, // תרמו 2 / חום
    "034040": { sem: 5, angle: 25,  branch: "thermo" }, // בקרה
    "034060": { sem: 6, angle: 35,  branch: "thermo" }, // מעבדה לתרמו
    "034382": { sem: 7, angle: 35,  branch: "thermo" }, // פרויקט אנרגיה 1
    "034383": { sem: 8, angle: 35,  branch: "thermo" }  // פרויקט אנרגיה 2
};

function setupConstellationViewMode() {
    const btnConstellation = document.getElementById("btn-mode-constellation");
    const btnGrid = document.getElementById("btn-mode-grid");
    const constellationViewport = document.getElementById("constellation-viewport");
    const gridViewport = document.getElementById("tree-viewport");
    
    if (btnConstellation && btnGrid && constellationViewport && gridViewport) {
        btnConstellation.addEventListener("click", () => {
            currentViewMode = 'constellation';
            btnConstellation.classList.add("active");
            btnGrid.classList.remove("active");
            constellationViewport.style.display = "block";
            gridViewport.style.display = "none";
            renderConstellationTree();
        });
        
        btnGrid.addEventListener("click", () => {
            currentViewMode = 'grid';
            btnGrid.classList.add("active");
            btnConstellation.classList.remove("active");
            gridViewport.style.display = "block";
            constellationViewport.style.display = "none";
            setTimeout(drawConnections, 50);
        });
    }
}

// Computes exact (x, y) sitting directly on concentric semester ring
function getCourseConstellationPosition(course, customIndex) {
    const originX = 750;
    const originY = 750;
    
    let sem = course.semester || 1;
    if (sem < 1) sem = 1;
    if (sem > 8) sem = 8;
    
    const r = SEMESTER_RADII[sem] || (sem * 80 + 80);
    
    let angle = 90;
    let branch = "mechanics";
    
    if (DEGREE_CONSTELLATION_ANGLES[course.code]) {
        angle = DEGREE_CONSTELLATION_ANGLES[course.code].angle;
        branch = DEGREE_CONSTELLATION_ANGLES[course.code].branch;
    } else {
        const code = (course.code || "").toLowerCase();
        const name = (course.name || "").toLowerCase();
        if (code.startsWith("104") || code.startsWith("114") || name.includes('מתמטיקה') || name.includes('פיזיקה')) {
            branch = "math";
            angle = 145 + ((customIndex % 3) - 1) * 15;
        } else if (code.includes("034005") || name.includes("תרמו") || name.includes("זרימה") || course.type === 'elective') {
            branch = "thermo";
            angle = 40 + ((customIndex % 3) - 1) * 15;
        } else {
            branch = "mechanics";
            angle = 90 + ((customIndex % 3) - 1) * 16;
        }
    }
    
    const rad = angle * (Math.PI / 180);
    const x = Math.round(originX + r * Math.cos(rad));
    const y = Math.round(originY - r * Math.sin(rad));
    
    return { x, y, r, angle, branch, sem };
}

// Renders the Star Wars Radial Constellation Skill Tree (Concentric Semester Rings)
function renderConstellationTree() {
    const bgGuides = document.getElementById("constellation-bg-guides");
    const connectionsGroup = document.getElementById("constellation-connections");
    
    if (!bgGuides || !connectionsGroup) return;
    
    bgGuides.innerHTML = "";
    connectionsGroup.innerHTML = "";
    
    const originX = 750;
    const originY = 750;
    
    // 1. Draw Concentric Semester Orbit Rings and Sector Titles
    let bgHtml = `
        <text x="750" y="440" class="constellation-watermark-text">SKILL TREE</text>
        <text x="350" y="50" class="constellation-sector-label">MATH & SCIENCE</text>
        <text x="750" y="35" class="constellation-sector-label">MECHANICS & DESIGN</text>
        <text x="1150" y="50" class="constellation-sector-label">THERMO & ENERGY</text>
    `;
    
    // Draw 8 Concentric Semester Orbit Rings from 170° (Left) to 10° (Right)
    for (let sem = 1; sem <= 8; sem++) {
        const r = SEMESTER_RADII[sem];
        const startX = originX + r * Math.cos(170 * Math.PI / 180);
        const startY = originY - r * Math.sin(170 * Math.PI / 180);
        const endX = originX + r * Math.cos(10 * Math.PI / 180);
        const endY = originY - r * Math.sin(10 * Math.PI / 180);
        
        bgHtml += `
            <path d="M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}" 
                  class="semester-orbit-arc" 
                  id="orbit-sem-${sem}" 
                  data-semester="${sem}" />
            <!-- Left Arc Semester Label -->
            <text x="${startX - 12}" y="${startY + 4}" class="semester-orbit-label" text-anchor="end">${SEMESTER_RING_NAMES[sem]}</text>
            <!-- Right Arc Semester Label -->
            <text x="${endX + 12}" y="${endY + 4}" class="semester-orbit-label" text-anchor="start">${SEMESTER_RING_NAMES[sem]}</text>
        `;
    }
    
    // Sector dividing dotted radial rays
    [64, 116].forEach(angle => {
        const rad = angle * Math.PI / 180;
        const x2 = originX + 740 * Math.cos(rad);
        const y2 = originY - 740 * Math.sin(rad);
        bgHtml += `<line x1="${originX}" y1="${originY}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.04)" stroke-width="1.5" stroke-dasharray="8 6" />`;
    });
    
    // Central Root Origin Icon
    bgHtml += `
        <circle cx="${originX}" cy="${originY}" r="22" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5" />
        <text x="${originX}" y="${originY + 5}" text-anchor="middle" font-size="14" fill="#38bdf8">🎓</text>
    `;
    
    bgGuides.innerHTML = bgHtml;
    
    // 2. Resolve coordinates for each course
    const courseCoords = {};
    let customIdx = 0;
    
    Object.values(gameState.courses).forEach(course => {
        courseCoords[course.code] = getCourseConstellationPosition(course, customIdx++);
    });
    
    // 3. Draw Connecting Constellation Beams
    let beamsHtml = "";
    Object.values(gameState.courses).forEach(course => {
        const targetPos = courseCoords[course.code];
        if (!targetPos) return;
        
        if (course.prerequisites && course.prerequisites.length > 0) {
            course.prerequisites.forEach(preCode => {
                const sourcePos = courseCoords[preCode];
                if (!sourcePos) return;
                
                const preCourse = gameState.courses[preCode];
                let beamClass = "locked";
                if (preCourse && preCourse.status === 'mastered' && course.status === 'mastered') {
                    beamClass = "mastered";
                } else if (preCourse && (preCourse.status === 'mastered' || preCourse.status === 'active')) {
                    beamClass = "active";
                }
                
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;
                
                beamsHtml += `
                    <path d="M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}" 
                          class="constellation-beam ${beamClass}" 
                          data-from="${preCode}" 
                          data-to="${course.code}" 
                          fill="none" />
                `;
            });
        } else if (course.semester === 1) {
            // Foundational trunk beam to origin
            const beamClass = course.status === 'mastered' ? 'mastered' : (course.status === 'active' ? 'active' : 'locked');
            const midX = (originX + targetPos.x) / 2;
            const midY = (originY + targetPos.y) / 2 + 10;
            
            beamsHtml += `
                <path d="M ${originX} ${originY} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}" 
                      class="constellation-beam ${beamClass}" 
                      data-from="root" 
                      data-to="${course.code}" 
                      fill="none" />
            `;
        }
    });
    connectionsGroup.innerHTML = beamsHtml;
    
    // 4. Render Nodes inside SVG Layer
    let nodesSvg = document.getElementById("constellation-svg-nodes");
    if (!nodesSvg) {
        nodesSvg = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodesSvg.id = "constellation-svg-nodes";
        document.getElementById("constellation-svg").appendChild(nodesSvg);
    }
    nodesSvg.innerHTML = "";
    
    Object.values(gameState.courses).forEach(course => {
        const pos = courseCoords[course.code];
        if (!pos) return;
        
        let icon = "⚙️";
        const branch = pos.branch;
        if (branch === "math") icon = "📐";
        else if (branch === "thermo") icon = "🌊";
        else if (branch === "mechanics") icon = "⚙️";
        if (course.type === 'sports') icon = "⚽";
        if (course.status === 'mastered') icon = "🏆";
        
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `constellation-node-group ${course.status || 'locked'}`);
        g.setAttribute("data-code", course.code);
        g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
        
        const labelText = course.name.length > 13 ? (course.name.substring(0, 11) + "..") : course.name;
        
        g.innerHTML = `
            <circle class="node-outer-ring" r="26" fill="none" />
            <circle class="node-body" r="21" />
            <text class="node-icon-svg" text-anchor="middle" dy=".35em">${icon}</text>
            <text class="node-label-svg" y="34" text-anchor="middle">${labelText}</text>
        `;
        
        // Hover listeners: Update inspector, highlight path & highlight semester orbit ring
        g.addEventListener("mouseenter", () => {
            updateSkillInspector(course);
            highlightConstellationPath(course.code);
            highlightSemesterOrbit(pos.sem);
            g.classList.add("selected");
        });
        
        g.addEventListener("mouseleave", () => {
            g.classList.remove("selected");
            clearConstellationHighlight();
            clearSemesterOrbitHighlight();
        });
        
        g.addEventListener("click", () => {
            openCourseDetails(course.code);
        });
        
        nodesSvg.appendChild(g);
    });
    
    // 5. Update Credits Counter & Progress Fill
    const creditsCounter = document.getElementById("constellation-credits-count");
    const xpFill = document.getElementById("constellation-xp-fill");
    if (creditsCounter) {
        creditsCounter.innerText = gameState.credits || 0;
    }
    if (xpFill) {
        const maxCredits = 120;
        const pct = Math.min(100, Math.round(((gameState.credits || 0) / maxCredits) * 100));
        xpFill.style.width = `${pct}%`;
    }
}

// Updates the Star Wars HUD Inspector Card in Bottom-Left
function updateSkillInspector(course) {
    const nameEl = document.getElementById("inspector-course-name");
    const creditsEl = document.getElementById("inspector-course-credits");
    const codeEl = document.getElementById("inspector-course-code");
    const descEl = document.getElementById("inspector-course-desc");
    const statusValEl = document.getElementById("inspector-status-val");
    const semValEl = document.getElementById("inspector-sem-val");
    const openBtn = document.getElementById("inspector-open-btn");
    
    if (!nameEl) return;
    
    nameEl.innerText = course.name;
    creditsEl.innerText = `${course.credits} נק״ז | דרג ${course.semester || 1}`;
    codeEl.innerText = `קוד: ${course.code.toUpperCase()} • ${course.type === 'core' ? 'חובה' : 'בחירה'}`;
    
    let desc = "";
    if (course.prerequisites && course.prerequisites.length > 0) {
        const preNames = course.prerequisites.map(pCode => {
            const p = gameState.courses[pCode];
            return p ? p.name : pCode.toUpperCase();
        });
        desc += `🔗 דרישות קדם: ${preNames.join(", ")}.

`;
    } else {
        desc += `✨ קורס יסוד (ללא דרישות קדם).

`;
    }
    
    const completedTasks = course.tasks ? course.tasks.filter(t => t.completed || t.status === 'done').length : 0;
    const totalTasks = course.tasks ? course.tasks.length : 0;
    desc += `🎯 משימות: ${completedTasks} / ${totalTasks}`;
    
    descEl.innerText = desc;
    
    let statusText = "🔒 נעול (Locked)";
    if (course.status === 'available') statusText = "🔓 פתוח לרישום (Available)";
    else if (course.status === 'active') statusText = "⚔️ בלמידה פעילה (In Progress)";
    else if (course.status === 'mastered') statusText = `🏆 הושלם (ציון: ${course.grade || '--'})`;
    
    statusValEl.innerText = statusText;
    semValEl.innerText = SEMESTER_RING_NAMES[course.semester || 1] || `סמסטר ${course.semester || 1}`;
    
    if (openBtn) {
        openBtn.style.display = "block";
        openBtn.onclick = () => openCourseDetails(course.code);
    }
}

// Highlights incoming and outgoing connection paths on hover
function highlightConstellationPath(courseCode) {
    const beams = document.querySelectorAll(".constellation-beam");
    beams.forEach(beam => {
        if (beam.dataset.from === courseCode || beam.dataset.to === courseCode) {
            beam.classList.add("highlighted");
        } else {
            beam.classList.remove("highlighted");
        }
    });
}

function clearConstellationHighlight() {
    const beams = document.querySelectorAll(".constellation-beam");
    beams.forEach(beam => beam.classList.remove("highlighted"));
}

// Highlights the corresponding semester orbit ring on hover
function highlightSemesterOrbit(sem) {
    const orbit = document.getElementById(`orbit-sem-${sem}`);
    if (orbit) orbit.classList.add("highlighted");
}

function clearSemesterOrbitHighlight() {
    const orbits = document.querySelectorAll(".semester-orbit-arc");
    orbits.forEach(o => o.classList.remove("highlighted"));
}


/* ==========================================================================
   Cheesefork-Style Study Runway Logic
   ========================================================================== */

let currentRunwayMoedFilter = 'a'; // 'a' | 'b' | 'all'

// Built-in Cheesefork Technion Exam Dates Dictionary (from raw_cheesefork.json)
const CHEESEFORK_EXAM_DATES = {
    "114052": { moedA: "2027-02-01", moedB: "2027-03-02", name: "פיזיקה 2" },
    "034035": { moedA: "2027-02-07", moedB: "2027-03-05", name: "תרמודינמיקה 1" },
    "034056": { moedA: "2027-02-11", moedB: "2027-03-10", name: "שיטות ייצור" },
    "034053": { moedA: "2027-02-18", moedB: "2027-03-18", name: "מוצקים 2" },
    "104228": { moedA: "2027-02-24", moedB: "2027-03-26", name: "שיטות נומריות" },
    "104131": { moedA: "2026-10-17", moedB: "2026-11-12", name: "מד\"ר" },
    "104043": { moedA: "2026-10-20", moedB: "2026-11-15", name: "חדו\"א 2" },
    "034061": { moedA: "2026-12-20", moedB: "2027-01-15", name: "גרפיקה ותכן" }
};

function setupStudyRunway() {
    // 1. Hook Moed filter buttons
    const filterBtns = document.querySelectorAll(".runway-btn-filter");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentRunwayMoedFilter = btn.dataset.moed || 'a';
            renderStudyRunway();
        });
    });

    // 2. Hook Term End Date picker
    const termEndInput = document.getElementById("runway-term-end-input");
    if (termEndInput) {
        if (!gameState.termEndDate) {
            gameState.termEndDate = "2027-01-20";
        }
        termEndInput.value = gameState.termEndDate;
        termEndInput.addEventListener("change", (e) => {
            gameState.termEndDate = e.target.value;
            saveState();
            renderStudyRunway();
        });
    }

    // 3. Hook Cheesefork Sync Button
    const syncBtn = document.getElementById("btn-sync-cheesefork-exams");
    if (syncBtn) {
        syncBtn.addEventListener("click", () => {
            syncCheeseforkExamDates();
            renderStudyRunway();
            renderNotionTasksTable();
            alert("🧀 סונכרנו בהצלחה תאריכי מבחנים מקובץ צ'יזפורק עבור הקורסים הפעילים!");
        });
    }

    // Auto-seed exam dates from Cheesefork on first load if missing
    syncCheeseforkExamDates(false);
}

// Syncs official Technion Cheesefork exam dates into gameState.courses
function syncCheeseforkExamDates(forceNotify = true) {
    let syncedCount = 0;
    Object.keys(CHEESEFORK_EXAM_DATES).forEach(code => {
        const course = gameState.courses[code];
        if (course && course.tasks) {
            const data = CHEESEFORK_EXAM_DATES[code];
            
            // Moed A Exam Task
            let examA = course.tasks.find(t => t.type === 'exam' && !t.title.includes("מועד ב") && !t.title.includes("מועד ג"));
            if (!examA) {
                examA = {
                    id: `task-${code}-exam-a`,
                    title: `מועד א`,
                    type: "exam",
                    completed: false,
                    status: "not_started",
                    xp: 500,
                    dueDate: data.moedA
                };
                course.tasks.push(examA);
                syncedCount++;
            } else if (!examA.dueDate || forceNotify) {
                examA.dueDate = data.moedA;
                if (examA.title.includes("מבחן סופי") || examA.title.includes("מבחן סוף")) {
                    examA.title = "מועד א";
                }
                syncedCount++;
            }

            // Moed B Exam Task
            let examB = course.tasks.find(t => t.type === 'exam' && t.title.includes("מועד ב"));
            if (!examB && data.moedB) {
                course.tasks.push({
                    id: `task-${code}-exam-b`,
                    title: `מועד ב'`,
                    type: "exam",
                    completed: false,
                    status: "not_started",
                    xp: 500,
                    dueDate: data.moedB
                });
                syncedCount++;
            } else if (examB && (!examB.dueDate || forceNotify)) {
                examB.dueDate = data.moedB;
                if (examB.title.includes("מבחן סופי") || examB.title.includes("מבחן סוף")) {
                    examB.title = "מועד ב'";
                }
                syncedCount++;
            }
        }
    });

    if (syncedCount > 0) {
        saveState();
    }
}

// Renders the horizontal Study Runway track
function renderStudyRunway() {
    const track = document.getElementById("study-runway-track");
    if (!track) return;

    track.innerHTML = "";

    const termEndDateStr = (gameState && gameState.termEndDate) ? gameState.termEndDate : "2027-01-20";
    
    // 1. Gather all scheduled exam tasks across active/available courses
    const allExams = [];

    Object.values(gameState.courses).forEach(course => {
        if (!course.tasks) return;

        course.tasks.forEach(task => {
            if (task.type !== 'exam') return;
            if (!task.dueDate) return; // Only show exams that have a scheduled date

            const isMoedB = task.title.includes("מועד ב") || task.title.toLowerCase().includes("moed b");
            const moedType = isMoedB ? 'b' : 'a';

            // Filter check
            if (currentRunwayMoedFilter === 'a' && moedType !== 'a') return;
            if (currentRunwayMoedFilter === 'b' && moedType !== 'b') return;

            allExams.push({
                courseCode: course.code,
                courseName: course.name,
                task: task,
                date: new Date(task.dueDate),
                dateStr: task.dueDate,
                moedType: moedType
            });
        });
    });

    // 2. Sort chronologically
    allExams.sort((a, b) => a.date - b.date);

    // 3. Render Start Node (Term end / Today)
    const termEndDate = new Date(termEndDateStr);
    const termEndFmt = !isNaN(termEndDate) ? `${termEndDate.getMonth() + 1}/${termEndDate.getDate()}` : "--";

    let html = `
        <div class="runway-node-card term-end" title="תאריך סיום הסמסטר">
            <div class="runway-node-title">Term end</div>
            <div class="runway-node-date">${termEndFmt}</div>
        </div>
    `;

    if (allExams.length === 0) {
        html += `
            <div style="color: var(--text-muted); font-size: 0.8rem; padding: 0 25px;">
                אין מבחנים מתוזמנים להצגה. לחץ על "🧀 סנכרן תאריכים" או הוסף תאריכי יעד למבחנים.
            </div>
        `;
        track.innerHTML = html;
        return;
    }

    // 4. Render Gaps and Exam Cards
    let prevDate = termEndDate;

    allExams.forEach((item, index) => {
        // Calculate days between previous exam/term-end and this exam
        const diffMs = item.date - prevDate;
        let diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 0) diffDays = 0;

        // Color class: 5d+ green, 3-4d yellow, <3d red
        let colorClass = "green";
        if (diffDays <= 2) {
            colorClass = "red";
        } else if (diffDays <= 4) {
            colorClass = "yellow";
        }

        // Format exam date e.g. "2/1" or "02/01"
        const examFmt = `${item.date.getMonth() + 1}/${item.date.getDate()}`;
        const moedLabel = item.moedType === 'b' ? "Moed B" : "Moed A";

        html += `
            <!-- Runway Gap Connector -->
            <div class="runway-gap-connector">
                <div class="runway-gap-pill ${colorClass}">
                    ${diffDays}d
                </div>
                <div class="runway-gap-label">TO STUDY</div>
            </div>

            <!-- Exam Card -->
            <div class="runway-node-card" data-course-code="${item.courseCode}" data-task-id="${item.task.id}" title="${item.courseName} - ${item.task.title} (לחץ לפתיחה)">
                <div class="runway-node-title">
                    <span class="runway-node-moed-badge">${moedLabel}</span>
                    ${item.courseName}
                </div>
                <div class="runway-node-date">
                    📅 ${examFmt}
                </div>
            </div>
        `;

        prevDate = item.date;
    });

    track.innerHTML = html;

    // 5. Bind click listener on cards to open course or task peek
    const cards = track.querySelectorAll(".runway-node-card:not(.term-end)");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            const courseCode = card.dataset.courseCode;
            const taskId = card.dataset.taskId;
            if (taskId) {
                openTaskSidePeek(courseCode, taskId);
            } else {
                openCourseDetails(courseCode);
            }
        });
    });
}


/* ==========================================================================
   Mermaid-Style Flowchart DAG Engine (Dynamic, Aligned Columns & Smooth Zoom)
   ========================================================================== */

let flowchartZoom = 1.0;
let isFlowchartFitWidth = false;

const BASE_FLOWCHART_WIDTH = 1560;
const BASE_FLOWCHART_HEIGHT = 1380;

function setupFlowchartViewMode() {
    const btnFlowchart = document.getElementById("btn-mode-flowchart");
    const btnConstellation = document.getElementById("btn-mode-constellation");
    const btnGrid = document.getElementById("btn-mode-grid");

    const fcViewport = document.getElementById("flowchart-viewport");
    const constViewport = document.getElementById("constellation-viewport");
    const gridViewport = document.getElementById("tree-viewport");

    function setMode(mode) {
        currentViewMode = mode;
        if (btnFlowchart) btnFlowchart.classList.toggle("active", mode === 'flowchart');
        if (btnConstellation) btnConstellation.classList.toggle("active", mode === 'constellation');
        if (btnGrid) btnGrid.classList.toggle("active", mode === 'grid');

        if (fcViewport) fcViewport.style.display = (mode === 'flowchart') ? 'flex' : 'none';
        if (constViewport) constViewport.style.display = (mode === 'constellation') ? 'block' : 'none';
        if (gridViewport) gridViewport.style.display = (mode === 'grid') ? 'block' : 'none';

        if (mode === 'flowchart') {
            renderFlowchartTree();
            initFlowchartZoom();
        } else if (mode === 'constellation') {
            renderConstellationTree();
        } else if (mode === 'grid') {
            renderSemestersGrid();
            setTimeout(drawConnections, 50);
        }
    }

    if (btnFlowchart) btnFlowchart.addEventListener("click", () => setMode('flowchart'));
    if (btnConstellation) btnConstellation.addEventListener("click", () => setMode('constellation'));
    if (btnGrid) btnGrid.addEventListener("click", () => setMode('grid'));

    // Zoom Buttons
    const zoomInBtn = document.getElementById("btn-fc-zoom-in");
    const zoomOutBtn = document.getElementById("btn-fc-zoom-out");
    const zoomResetBtn = document.getElementById("btn-fc-zoom-reset");
    const toggleFitBtn = document.getElementById("btn-fc-toggle-fit");

    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", () => {
            isFlowchartFitWidth = false;
            if (toggleFitBtn) toggleFitBtn.classList.remove("active");
            setFlowchartZoom(flowchartZoom + 0.15);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", () => {
            isFlowchartFitWidth = false;
            if (toggleFitBtn) toggleFitBtn.classList.remove("active");
            setFlowchartZoom(flowchartZoom - 0.15);
        });
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener("click", () => {
            isFlowchartFitWidth = false;
            if (toggleFitBtn) toggleFitBtn.classList.remove("active");
            setFlowchartZoom(1.0);
        });
    }

    if (toggleFitBtn) {
        toggleFitBtn.addEventListener("click", () => {
            isFlowchartFitWidth = !isFlowchartFitWidth;
            if (isFlowchartFitWidth) {
                fitFlowchartToWidth();
            } else {
                toggleFitBtn.classList.remove("active");
                setFlowchartZoom(1.0);
            }
        });
    }

    // Auto resize listener to maintain fit-width when window changes
    window.addEventListener("resize", () => {
        if (currentViewMode === 'flowchart' && isFlowchartFitWidth) {
            fitFlowchartToWidth();
        }
    });

    // Pan & Mouse Wheel
    setupFlowchartPanAndWheel();

    // Default to flowchart view on start
    setMode('flowchart');
}

function initFlowchartZoom() {
    if (window.innerWidth <= 768) {
        fitFlowchartToWidth();
    } else {
        // User instruction: Default zoom on opening desktop is strictly 100%
        setFlowchartZoom(1.0);
        isFlowchartFitWidth = false;
        const toggleFitBtn = document.getElementById("btn-fc-toggle-fit");
        if (toggleFitBtn) toggleFitBtn.classList.remove("active");
    }
}

function fitFlowchartToWidth() {
    const scrollWrap = document.getElementById("flowchart-scroll-wrapper");
    const toggleFitBtn = document.getElementById("btn-fc-toggle-fit");
    if (!scrollWrap) return;

    const availableWidth = scrollWrap.clientWidth || (window.innerWidth - 20);
    const minFactor = (window.innerWidth <= 768) ? 0.24 : 0.6;
    const fitFactor = Math.max(minFactor, Math.min(1.4, (availableWidth - 18) / BASE_FLOWCHART_WIDTH));
    setFlowchartZoom(fitFactor);
    isFlowchartFitWidth = true;
    if (toggleFitBtn) toggleFitBtn.classList.add("active");
}

function setFlowchartZoom(zoomVal) {
    const minZoom = (window.innerWidth <= 768) ? 0.22 : 0.55;
    flowchartZoom = Math.max(minZoom, Math.min(2.0, Math.round(zoomVal * 100) / 100));

    const svgEl = document.getElementById("flowchart-svg");
    const indicator = document.getElementById("btn-fc-zoom-reset");

    if (indicator) {
        indicator.innerText = `${Math.round(flowchartZoom * 100)}%`;
    }

    if (svgEl) {
        const targetW = Math.round(BASE_FLOWCHART_WIDTH * flowchartZoom);
        const targetH = Math.round(BASE_FLOWCHART_HEIGHT * flowchartZoom);
        svgEl.style.width = `${targetW}px`;
        svgEl.style.minWidth = `${targetW}px`;
        svgEl.style.height = `${targetH}px`;
    }
}

function setupFlowchartPanAndWheel() {
    const scrollWrap = document.getElementById("flowchart-scroll-wrapper");
    if (!scrollWrap) return;

    scrollWrap.addEventListener("wheel", (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            isFlowchartFitWidth = false;
            const toggleFitBtn = document.getElementById("btn-fc-toggle-fit");
            if (toggleFitBtn) toggleFitBtn.classList.remove("active");
            setFlowchartZoom(flowchartZoom + delta);
        }
    }, { passive: false });

    let isPanning = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    scrollWrap.addEventListener("mousedown", (e) => {
        if (e.target.closest(".fc-node-group") || e.target.closest("button")) return;
        isPanning = true;
        scrollWrap.classList.add("panning");
        startX = e.pageX - scrollWrap.offsetLeft;
        startY = e.pageY - scrollWrap.offsetTop;
        scrollLeft = scrollWrap.scrollLeft;
        scrollTop = scrollWrap.scrollTop;
    });

    let panRafId = null;
    let targetScrollLeft = 0;
    let targetScrollTop = 0;

    window.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const x = e.pageX - scrollWrap.offsetLeft;
        const y = e.pageY - scrollWrap.offsetTop;
        const walkX = (x - startX) * 1.2;
        const walkY = (y - startY) * 1.2;
        targetScrollLeft = scrollLeft - walkX;
        targetScrollTop = scrollTop - walkY;

        if (!panRafId) {
            panRafId = requestAnimationFrame(() => {
                scrollWrap.scrollLeft = targetScrollLeft;
                scrollWrap.scrollTop = targetScrollTop;
                panRafId = null;
            });
        }
    });

    window.addEventListener("mouseup", () => {
        if (isPanning) {
            isPanning = false;
            scrollWrap.classList.remove("panning");
            if (panRafId) {
                cancelAnimationFrame(panRafId);
                panRafId = null;
            }
        }
    });

    // Mobile Touch Gesture Support: Single-finger pan & Two-finger pinch-to-zoom
    let touchStartDist = 0;
    let initialPinchZoom = flowchartZoom;
    let touchStartX = 0, touchStartY = 0;
    let touchScrollLeft = 0, touchScrollTop = 0;
    let isTouchPanning = false;

    scrollWrap.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            initialPinchZoom = flowchartZoom;
        } else if (e.touches.length === 1) {
            if (e.target.closest(".fc-node-group") || e.target.closest("button")) return;
            isTouchPanning = true;
            touchStartX = e.touches[0].pageX - scrollWrap.offsetLeft;
            touchStartY = e.touches[0].pageY - scrollWrap.offsetTop;
            touchScrollLeft = scrollWrap.scrollLeft;
            touchScrollTop = scrollWrap.scrollTop;
        }
    }, { passive: true });

    scrollWrap.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && touchStartDist > 0) {
            const currentDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const scaleFactor = currentDist / touchStartDist;
            isFlowchartFitWidth = false;
            const toggleFitBtn = document.getElementById("btn-fc-toggle-fit");
            if (toggleFitBtn) toggleFitBtn.classList.remove("active");
            setFlowchartZoom(initialPinchZoom * scaleFactor);
        } else if (e.touches.length === 1 && isTouchPanning) {
            const x = e.touches[0].pageX - scrollWrap.offsetLeft;
            const y = e.touches[0].pageY - scrollWrap.offsetTop;
            const walkX = (x - touchStartX) * 1.15;
            const walkY = (y - touchStartY) * 1.15;
            scrollWrap.scrollLeft = touchScrollLeft - walkX;
            scrollWrap.scrollTop = touchScrollTop - walkY;
        }
    }, { passive: true });

    scrollWrap.addEventListener("touchend", () => {
        touchStartDist = 0;
        isTouchPanning = false;
    }, { passive: true });
}

// Renders the clean Mermaid-style Flowchart DAG of courses with aligned tracks & NO arrow heads
function renderFlowchartTree() {
    const svgEl = document.getElementById("flowchart-svg");
    const bgGuides = document.getElementById("flowchart-bg-guides");
    const connectionsGroup = document.getElementById("flowchart-connections");
    const nodesGroup = document.getElementById("flowchart-nodes");

    if (!svgEl || !bgGuides || !connectionsGroup || !nodesGroup) return;

    bgGuides.innerHTML = "";
    connectionsGroup.innerHTML = "";
    nodesGroup.innerHTML = "";

    const TOTAL_WIDTH = BASE_FLOWCHART_WIDTH;
    const ROW_HEIGHT = 168; // Golden ratio vertical spacing (84px card + 84px gap)
    const TOTAL_SEMESTERS = 8;
    const TOTAL_HEIGHT = BASE_FLOWCHART_HEIGHT;
    const LEFT_MARGIN = 175; // Left margin for row title
    const RIGHT_MARGIN = 35;
    const USABLE_WIDTH = TOTAL_WIDTH - LEFT_MARGIN - RIGHT_MARGIN; // 1350px
    const NUM_COLS = 6;
    const colSpacing = USABLE_WIDTH / NUM_COLS; // 225px
    const nodeWidth = 196; // Generous card width so all Hebrew titles fit completely
    const nodeHeight = 84;

    svgEl.setAttribute("viewBox", `0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`);

    // 1. Draw Semester Background Bands & Labels (Never cut off in RTL or LTR)
    const SEMESTER_ROWS = [
        { sem: 1, year: "שנה א׳", term: "סמסטר א׳" },
        { sem: 2, year: "שנה א׳", term: "סמסטר ב׳" },
        { sem: 3, year: "שנה ב׳", term: "סמסטר ג׳" },
        { sem: 4, year: "שנה ב׳", term: "סמסטר ד׳" },
        { sem: 5, year: "שנה ג׳", term: "סמסטר ה׳" },
        { sem: 6, year: "שנה ג׳", term: "סמסטר ו׳" },
        { sem: 7, year: "שנה ד׳", term: "סמסטר ז׳" },
        { sem: 8, year: "שנה ד׳", term: "סמסטר ח׳" }
    ];

    let bgHtml = "";
    SEMESTER_ROWS.forEach((row, idx) => {
        const topY = idx * ROW_HEIGHT + 6;
        const h = ROW_HEIGHT - 12;
        const centerY = topY + (h / 2);
        const altClass = idx % 2 === 0 ? "fc-semester-band" : "fc-semester-band alt";

        bgHtml += `
            <rect x="0" y="${topY}" width="${TOTAL_WIDTH}" height="${h}" rx="10" class="${altClass}" />
            <line x1="16" y1="${topY}" x2="${TOTAL_WIDTH - 16}" y2="${topY}" class="fc-semester-divider" />
            <line x1="${LEFT_MARGIN - 15}" y1="${topY}" x2="${LEFT_MARGIN - 15}" y2="${topY + h}" class="fc-semester-col-divider" />
            
            <!-- Dynamic Semester Badge: shows GPA if completed, in-progress tag if active -->
            ${(() => {
                const semStats = getSemesterStats(row.sem);
                const hasActive = Object.values(gameState.courses).some(c => (c.semester || 1) == row.sem && c.status === 'active');
                
                if (semStats.isCompleted && semStats.gpa > 0) {
                    const gpaFormatted = semStats.gpa.toFixed(2);
                    const breakdown = (semStats.list || []).map(c => `• ${c.name}: ${c.grade || '-'}`).join('&#10;');
                    const tooltip = `${row.year} / ${row.term} הושלם בהצלחה!&#10;ממוצע סמסטריאלי: ${gpaFormatted} (${semStats.gradedCredits} נק״ז)&#10;${breakdown}`;
                    return `
                        <g class="fc-semester-badge-group completed" title="${tooltip}">
                            <rect x="16" y="${centerY - 34}" width="134" height="68" rx="10" class="fc-semester-badge-rect completed" />
                            <text x="83" y="${centerY - 16}" text-anchor="middle" class="fc-sem-year">${row.year}</text>
                            <text x="83" y="${centerY - 1}" text-anchor="middle" class="fc-sem-term">${row.term}</text>
                            <rect x="24" y="${centerY + 8}" width="118" height="20" rx="6" class="fc-sem-gpa-pill" />
                            <text x="83" y="${centerY + 22}" text-anchor="middle" class="fc-sem-gpa-text">ממוצע: ${gpaFormatted}</text>
                        </g>
                    `;
                } else if (hasActive) {
                    return `
                        <g class="fc-semester-badge-group active" title="${row.year} / ${row.term} - סמסטר פעיל בלימודים">
                            <rect x="18" y="${centerY - 32}" width="130" height="64" rx="10" class="fc-semester-badge-rect active" />
                            <text x="83" y="${centerY - 14}" text-anchor="middle" class="fc-sem-year">${row.year}</text>
                            <text x="83" y="${centerY + 2}" text-anchor="middle" class="fc-sem-term">${row.term}</text>
                            <rect x="28" y="${centerY + 10}" width="110" height="18" rx="5" class="fc-sem-status-pill in-progress" />
                            <text x="83" y="${centerY + 23}" text-anchor="middle" class="fc-sem-status-text">סמסטר נוכחי</text>
                        </g>
                    `;
                } else {
                    return `
                        <g class="fc-semester-badge-group" title="${row.year} / ${row.term}">
                            <rect x="20" y="${centerY - 24}" width="126" height="48" rx="8" class="fc-semester-badge-rect" />
                            <text x="83" y="${centerY - 5}" text-anchor="middle" class="fc-sem-year">${row.year}</text>
                            <text x="83" y="${centerY + 14}" text-anchor="middle" class="fc-sem-term">${row.term}</text>
                        </g>
                    `;
                }
            })()}
        `;
    });
    bgGuides.innerHTML = bgHtml;

    // 2. Group all courses by their ACTUAL semester in gameState.courses
    const semesterCourses = {};
    for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
        semesterCourses[s] = [];
    }

    Object.values(gameState.courses).forEach(course => {
        const sem = Math.max(1, Math.min(TOTAL_SEMESTERS, course.semester || 1));
        semesterCourses[sem].push(course);
    });

    // 3. Optimal 6-Column Grid Coordinates
    // Columns: 0=Chem/Mat/Sport, 1=Math, 2=Mechanics, 3=Thermal/Fluids, 4=Physics/Comp/Controls, 5=Design/Mfg/Projects
    const COURSE_COLUMNS = {
        // Semester 1 (5 courses)
        "125001": 0, "104041": 1, "104065": 2, "114051": 3, "234128": 4,
        // Semester 2 (6 courses)
        "125013": 0, "104043": 1, "104131": 2, "034028": 3, "314533": 4, "034061": 5,
        // Semester 3 (6 courses)
        "104228": 0, "034035": 1, "034053": 2, "114052": 3, "034056": 4, "03940805": 5,
        // Semester 4 (4 courses)
        "034055": 1, "034032": 2, "034010": 3, "034030": 5,
        // Semester 5 (6 courses)
        "034058": 0, "034041": 1, "034051": 2, "114032": 3, "034040": 4, "034054": 5,
        // Semester 6 (3 courses)
        "034057": 2, "034060": 3, "034371": 5,
        // Semester 7 (2 courses)
        "034379": 4, "034382": 5,
        // Semester 8 (2 courses)
        "034380": 4, "034383": 5
    };

    const coursePositions = {};

    function getColCenterX(colIdx) {
        return LEFT_MARGIN + colIdx * colSpacing + (colSpacing / 2);
    }

    for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
        const list = semesterCourses[s];
        if (!list || list.length === 0) continue;

        const nodeY = (s - 1) * ROW_HEIGHT + (ROW_HEIGHT / 2) + 4;
        const usedColsInSem = new Set();

        list.forEach(course => {
            let col = COURSE_COLUMNS[course.code];
            if (col === undefined || usedColsInSem.has(col)) {
                // Find first free column 0..5
                for (let c = 0; c < NUM_COLS; c++) {
                    if (!usedColsInSem.has(c)) {
                        col = c;
                        break;
                    }
                }
            }
            usedColsInSem.add(col);

            const nodeX = getColCenterX(col);
            coursePositions[course.code] = {
                x: nodeX,
                y: nodeY,
                sem: s,
                col: col,
                w: nodeWidth,
                h: nodeHeight
            };
        });
    }

    // 4. Draw Clean Connecting Bezier Curves (WITHOUT arrow heads)
    let connectionsHtml = "";
    Object.values(gameState.courses).forEach(course => {
        const dest = coursePositions[course.code];
        if (!dest) return;

        if (course.prerequisites && course.prerequisites.length > 0) {
            course.prerequisites.forEach(preCode => {
                const src = coursePositions[preCode];
                if (!src) return;

                const preCourse = gameState.courses[preCode];
                let beamClass = "locked";

                if (preCourse && preCourse.status === 'mastered') {
                    beamClass = "mastered";
                } else if (course.status !== 'locked') {
                    beamClass = "active";
                }

                const x1 = src.x;
                const y1 = src.y + (src.h / 2);
                const x2 = dest.x;
                const y2 = dest.y - (dest.h / 2);

                const dy = y2 - y1;
                let d = "";

                if (Math.abs(x1 - x2) < 4) {
                    d = `M ${x1} ${y1} L ${x2} ${y2}`;
                } else {
                    const cpOffset = Math.min(Math.max(dy * 0.45, 30), 90);
                    d = `M ${x1} ${y1} C ${x1} ${y1 + cpOffset}, ${x2} ${y2 - cpOffset}, ${x2} ${y2}`;
                }

                connectionsHtml += `
                    <path d="${d}" 
                          class="fc-beam ${beamClass}" 
                          data-from="${preCode}" 
                          data-to="${course.code}" />
                `;
            });
        }
    });
    connectionsGroup.innerHTML = connectionsHtml;

    // 5. Render Course Cards with High Contrast & Legible Multi-line Typography
    nodesGroup.innerHTML = "";
    Object.values(gameState.courses).forEach(course => {
        const pos = coursePositions[course.code];
        if (!pos) return;

        const leftX = pos.x - (pos.w / 2);
        const topY = pos.y - (pos.h / 2);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", `fc-node-group ${course.status || 'locked'}`);
        g.setAttribute("data-code", course.code);

        let badgeText = "🔒 נעול";
        if (course.status === 'available') badgeText = "🔓 פתוח";
        else if (course.status === 'active') badgeText = "📘 פעיל";
        else if (course.status === 'mastered') badgeText = course.grade ? `✓ הושלם (${course.grade})` : "✓ הושלם";

        // Balanced title wrapping: never truncate course names
        let titleSvg = "";
        let subY = topY + 49;
        let badgeY = topY + 68;

        if (course.name.length <= 15) {
            titleSvg = `<text x="${pos.x}" y="${topY + 28}" text-anchor="middle" class="fc-node-title single-line">${course.name}</text>`;
        } else {
            const words = course.name.split(" ");
            if (words.length <= 1) {
                titleSvg = `<text x="${pos.x}" y="${topY + 28}" text-anchor="middle" class="fc-node-title single-line">${course.name}</text>`;
            } else {
                let bestSplit = 1;
                let bestDiff = 999;
                for (let i = 1; i < words.length; i++) {
                    const l1 = words.slice(0, i).join(" ");
                    const l2 = words.slice(i).join(" ");
                    const diff = Math.abs(l1.length - l2.length);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestSplit = i;
                    }
                }
                const line1 = words.slice(0, bestSplit).join(" ");
                const line2 = words.slice(bestSplit).join(" ");
                titleSvg = `
                    <text x="${pos.x}" y="${topY + 21}" text-anchor="middle" class="fc-node-title multi-line">
                        <tspan x="${pos.x}" dy="0">${line1}</tspan>
                        <tspan x="${pos.x}" dy="15">${line2}</tspan>
                    </text>
                `;
                subY = topY + 53;
                badgeY = topY + 71;
            }
        }

        g.innerHTML = `
            <rect x="${leftX}" y="${topY}" width="${pos.w}" height="${pos.h}" rx="8" class="fc-node-rect" />
            <!-- Line 1: Course Title (Complete, never truncated) -->
            ${titleSvg}
            <!-- Line 2: Subtitle: Code + Credits -->
            <text x="${pos.x}" y="${subY}" text-anchor="middle" class="fc-node-sub">${course.code} • ${course.credits} נק״ז</text>
            <!-- Line 3: Status Badge -->
            <text x="${pos.x}" y="${badgeY}" text-anchor="middle" class="fc-node-badge">${badgeText}</text>
        `;

        // Hover effect: highlight incoming prerequisites AND outgoing dependents
        g.addEventListener("mouseenter", () => {
            highlightFlowchartPath(course.code);
        });
        g.addEventListener("mouseleave", () => {
            clearFlowchartHighlight();
        });

        // Click opens Course Details Modal
        g.addEventListener("click", () => {
            openCourseDetails(course.code);
        });

        nodesGroup.appendChild(g);
    });
}

// Highlights incoming and outgoing flowchart lines and related course cards (NO arrowheads)
function highlightFlowchartPath(code) {
    const svgEl = document.getElementById("flowchart-svg");
    if (svgEl) svgEl.classList.add("has-highlight");

    const beams = document.querySelectorAll(".fc-beam");
    const activeNodes = new Set([code]);

    beams.forEach(b => {
        if (b.dataset.from === code || b.dataset.to === code) {
            b.classList.add("highlighted");
            if (b.dataset.from) activeNodes.add(b.dataset.from);
            if (b.dataset.to) activeNodes.add(b.dataset.to);
        } else {
            b.classList.remove("highlighted");
        }
    });

    const nodeGroups = document.querySelectorAll(".fc-node-group");
    nodeGroups.forEach(ng => {
        const cCode = ng.getAttribute("data-code");
        if (activeNodes.has(cCode)) {
            ng.classList.add("highlighted-node");
        } else {
            ng.classList.remove("highlighted-node");
        }
    });
}

function clearFlowchartHighlight() {
    const svgEl = document.getElementById("flowchart-svg");
    if (svgEl) svgEl.classList.remove("has-highlight");

    const beams = document.querySelectorAll(".fc-beam");
    beams.forEach(b => {
        b.classList.remove("highlighted");
    });

    const nodeGroups = document.querySelectorAll(".fc-node-group");
    nodeGroups.forEach(ng => ng.classList.remove("highlighted-node"));
}


// ==============================================================================
// Past Exams Comprehensive Bank & Smart Scheduling Engine (from User's Excel)
// ==============================================================================

// Generates all academic terms from previous completed semester (2026 Winter) back to earliestYear
function generateAllTermsList(earliestYear = 2018) {
    const list = [];
    const currentYear = 2026;
    
    // 1. Previous completed semester of 2026 (Winter / סמסטר א׳ תשפ״ו)
    list.push({
        id: `term_2026_w_b`,
        year: "2026",
        moed: "סמסטר חורף - מועד ב'",
        solution: "פתרון קיים",
        exists: false,
        scheduledDate: "",
        completed: false
    });
    list.push({
        id: `term_2026_w_a`,
        year: "2026",
        moed: "סמסטר חורף - מועד א'",
        solution: "פתרון קיים",
        exists: false,
        scheduledDate: "",
        completed: false
    });

    // 2. Preceding years down to earliestYear
    for (let y = currentYear - 1; y >= earliestYear; y--) {
        list.push({
            id: `term_${y}_sum_a`,
            year: String(y),
            moed: "סמסטר קיץ - מועד א'",
            solution: "פתרון קיים",
            exists: false,
            scheduledDate: "",
            completed: false
        });
        list.push({
            id: `term_${y}_s_b`,
            year: String(y),
            moed: "סמסטר אביב - מועד ב'",
            solution: "פתרון קיים",
            exists: false,
            scheduledDate: "",
            completed: false
        });
        list.push({
            id: `term_${y}_s_a`,
            year: String(y),
            moed: "סמסטר אביב - מועד א'",
            solution: "פתרון קיים",
            exists: false,
            scheduledDate: "",
            completed: false
        });
        list.push({
            id: `term_${y}_w_b`,
            year: String(y),
            moed: "סמסטר חורף - מועד ב'",
            solution: "פתרון קיים",
            exists: false,
            scheduledDate: "",
            completed: false
        });
        list.push({
            id: `term_${y}_w_a`,
            year: String(y),
            moed: "סמסטר חורף - מועד א'",
            solution: "פתרון קיים",
            exists: false,
            scheduledDate: "",
            completed: false
        });
    }

    return list;
}

// Synchronizes course exams with a new earliest year while preserving existing user selections & dates
function syncCourseExamsWithEarliestYear(cData, targetEarliestYear) {
    if (!cData.exams) cData.exams = [];
    cData.earliestYear = targetEarliestYear;

    const existingMap = {};
    cData.exams.forEach(ex => {
        const key = `${ex.year}_${ex.moed}`;
        existingMap[key] = ex;
    });

    const fullList = generateAllTermsList(targetEarliestYear);
    const mergedList = fullList.map(item => {
        const key = `${item.year}_${item.moed}`;
        if (existingMap[key]) {
            return existingMap[key];
        }
        return item; // new item, exists: false
    });

    // Preserve any custom user-added exams
    cData.exams.forEach(ex => {
        if (ex.isCustom && !mergedList.some(m => m.id === ex.id)) {
            mergedList.push(ex);
        }
    });

    cData.exams = mergedList;
}

const INITIAL_PAST_EXAMS_BANK = {
    "104131": {
        name: "מד״ר (104131)",
        earliestYear: 2018,
        examDate: "2026-08-13",
        studyStartDate: "2026-08-05",
        exams: generateAllTermsList(2018)
    },
    "314533": {
        name: "הנדסת חומרים (314533)",
        earliestYear: 2018,
        examDate: "2026-08-11",
        studyStartDate: "2026-08-08",
        exams: generateAllTermsList(2018)
    },
    "034028": {
        name: "מכניקת מוצקים (034028)",
        earliestYear: 2018,
        examDate: "2026-08-19",
        studyStartDate: "2026-08-14",
        exams: generateAllTermsList(2018)
    },
    "104043": {
        name: "חדו״א 2 (104043)",
        earliestYear: 2018,
        examDate: "2026-08-30",
        studyStartDate: "2026-08-22",
        exams: generateAllTermsList(2018)
    }
};

let currentPemCourseCode = "104131";

// Builds pastExamSchedule from pastExamsBank
function syncScheduleFromBank() {
    const schedule = [];
    Object.keys(gameState.pastExamsBank).forEach(courseCode => {
        const cData = gameState.pastExamsBank[courseCode];
        if (!cData || !cData.exams) return;
        cData.exams.forEach(exam => {
            if (exam.exists && exam.scheduledDate) {
                schedule.push({
                    id: exam.id,
                    courseCode: courseCode,
                    date: exam.scheduledDate,
                    title: `${cData.name.split(' ')[0]}: ${exam.moed} ${exam.year}`,
                    completed: !!exam.completed
                });
            }
        });
    });
    gameState.pastExamSchedule = schedule;
}

function setupFinalsMode() {
    // 1. Initialize pastExamsBank in gameState
    if (!gameState.pastExamsBank || Object.keys(gameState.pastExamsBank).length === 0 || !gameState.pastExamsBank["104131"] || !gameState.pastExamsBank["104131"].earliestYear) {
        gameState.pastExamsBank = JSON.parse(JSON.stringify(INITIAL_PAST_EXAMS_BANK));
    }
    if (!gameState.pastExamSchedule || gameState.pastExamSchedule.length === 0) {
        syncScheduleFromBank();
    }

    // 2. Hook Toggle Switch for Finals Mode
    const toggleInput = document.getElementById("toggle-finals-mode");
    if (toggleInput) {
        toggleInput.checked = !!gameState.isFinalsMode;
        toggleInput.addEventListener("change", (e) => {
            toggleFinalsMode(e.target.checked);
        });
    }

    // 3. Calendar Month navigation
    const prevBtn = document.getElementById("cal-nav-prev");
    const nextBtn = document.getElementById("cal-nav-next");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            renderFinalsCalendar();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            renderFinalsCalendar();
        });
    }

    // 4. Hook Past Exams Manager Modal triggers
    const openMgrBtn = document.getElementById("btn-open-past-exams-mgr");
    const modal = document.getElementById("past-exams-modal");
    const closeBtn = document.getElementById("past-exams-modal-close");
    const cancelBtn = document.getElementById("btn-pem-close");
    const saveBtn = document.getElementById("btn-pem-save");

    if (openMgrBtn && modal) {
        openMgrBtn.addEventListener("click", () => {
            renderPastExamsModal();
            modal.style.display = "flex";
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
    }
    if (cancelBtn && modal) {
        cancelBtn.addEventListener("click", () => { modal.style.display = "none"; });
    }
    if (saveBtn && modal) {
        saveBtn.addEventListener("click", () => {
            syncScheduleFromBank();
            saveState();
            renderFinalsCalendar();
            modal.style.display = "none";
            alert("השיבוצים עודכנו בהצלחה בלוח השנה של האפליקציה!");
        });
    }

    // 5. Hook Earliest Year dropdown
    const earliestYearSelect = document.getElementById("pem-earliest-year");
    if (earliestYearSelect) {
        earliestYearSelect.addEventListener("change", (e) => {
            const y = parseInt(e.target.value, 10) || 2018;
            const cData = gameState.pastExamsBank[currentPemCourseCode];
            if (cData) {
                syncCourseExamsWithEarliestYear(cData, y);
                renderPastExamsTable(currentPemCourseCode);
            }
        });
    }

    // 6. Hook Selection Toolbar Buttons
    const selectMoedABtn = document.getElementById("btn-pem-select-moed-a");
    if (selectMoedABtn) {
        selectMoedABtn.addEventListener("click", () => {
            const cData = gameState.pastExamsBank[currentPemCourseCode];
            if (cData && cData.exams) {
                cData.exams.forEach(ex => {
                    ex.exists = ex.moed.includes("מועד א");
                    if (!ex.exists) ex.scheduledDate = "";
                });
                renderPastExamsTable(currentPemCourseCode);
            }
        });
    }

    const selectAllBtn = document.getElementById("btn-pem-select-all-btn");
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", () => {
            const cData = gameState.pastExamsBank[currentPemCourseCode];
            if (cData && cData.exams) {
                cData.exams.forEach(ex => ex.exists = true);
                renderPastExamsTable(currentPemCourseCode);
            }
        });
    }

    const deselectAllBtn = document.getElementById("btn-pem-deselect-all-btn");
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener("click", () => {
            const cData = gameState.pastExamsBank[currentPemCourseCode];
            if (cData && cData.exams) {
                cData.exams.forEach(ex => {
                    ex.exists = false;
                    ex.scheduledDate = "";
                });
                renderPastExamsTable(currentPemCourseCode);
            }
        });
    }

    // 7. Hook Auto-Scheduler button
    const autoSchedBtn = document.getElementById("btn-pem-auto-schedule");
    if (autoSchedBtn) {
        autoSchedBtn.addEventListener("click", () => {
            autoScheduleCourseExams(currentPemCourseCode);
        });
    }

    // 8. Hook Clear Dates button
    const clearDatesBtn = document.getElementById("btn-pem-clear-dates");
    if (clearDatesBtn) {
        clearDatesBtn.addEventListener("click", () => {
            const cData = gameState.pastExamsBank[currentPemCourseCode];
            if (cData && cData.exams) {
                cData.exams.forEach(ex => ex.scheduledDate = "");
                renderPastExamsTable(currentPemCourseCode);
            }
        });
    }

    // 9. Hook Add Custom Exam
    const addCustomBtn = document.getElementById("btn-pem-add-custom");
    if (addCustomBtn) {
        addCustomBtn.addEventListener("click", () => {
            addCustomExamToBank(currentPemCourseCode);
        });
    }

    // 10. Hook Google Calendar / Tasks Exports
    const exportIcsBtn = document.getElementById("btn-pem-export-ics");
    const headerExportBtn = document.getElementById("btn-export-google-tasks");
    const copyTasksBtn = document.getElementById("btn-pem-copy-google-tasks");

    if (exportIcsBtn) exportIcsBtn.addEventListener("click", exportScheduleToICS);
    if (headerExportBtn) headerExportBtn.addEventListener("click", exportScheduleToICS);
    if (copyTasksBtn) copyTasksBtn.addEventListener("click", copyScheduleToGoogleTasks);

    // Initialize state on boot
    toggleFinalsMode(!!gameState.isFinalsMode);
}

function toggleFinalsMode(enable) {
    gameState.isFinalsMode = !!enable;
    saveState();

    // 1. Sync toggle switch UI
    const toggleInput = document.getElementById("toggle-finals-mode");
    if (toggleInput) {
        toggleInput.checked = gameState.isFinalsMode;
    }
    const descEl = document.getElementById("finals-switch-desc");
    if (descEl) {
        descEl.innerText = gameState.isFinalsMode ? "פעיל (Finals Mode)" : "כבוי (סמסטר רגיל)";
        descEl.style.color = gameState.isFinalsMode ? "#f59e0b" : "var(--text-muted)";
    }

    // 2. Ensure Calendar Card is always displayed (never hidden!)
    const calCard = document.getElementById("finals-calendar-card");
    if (calCard) {
        calCard.style.display = "block";
    }

    // 3. In Finals Mode: automatically switch to unified Calendar tab
    if (gameState.isFinalsMode) {
        if (typeof window.setActiveMainTab === 'function') {
            window.setActiveMainTab('calendar');
        } else {
            renderFinalsCalendar();
        }
    } else {
        renderFinalsCalendar();
    }

    // 4. Update runway and tasks table
    renderExamGapRunway();
    renderNotionTasksTable();
}

// Renders the Course Tabs inside the Manager Modal
function renderPastExamsModal() {
    const tabsContainer = document.getElementById("pem-course-tabs");
    if (!tabsContainer) return;
    tabsContainer.innerHTML = "";

    // Gather active courses from gameState.courses or pastExamsBank
    const activeCourses = Object.values(gameState.courses).filter(c => c.status === 'active');
    
    // Ensure active courses exist in pastExamsBank
    activeCourses.forEach(c => {
        if (!gameState.pastExamsBank[c.code]) {
            gameState.pastExamsBank[c.code] = {
                name: `${c.name} (${c.code})`,
                earliestYear: 2018,
                studyStartDate: "2026-08-05",
                examDate: "2026-08-13",
                exams: generateAllTermsList(2018)
            };
        }
    });

    const courseCodes = Object.keys(gameState.pastExamsBank);
    if (!courseCodes.includes(currentPemCourseCode) && courseCodes.length > 0) {
        currentPemCourseCode = courseCodes[0];
    }

    courseCodes.forEach(cCode => {
        const cData = gameState.pastExamsBank[cCode];
        if (!cData.earliestYear) cData.earliestYear = 2018;
        if (!cData.exams || cData.exams.length === 0) {
            cData.exams = generateAllTermsList(cData.earliestYear);
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `pem-course-tab-btn ${cCode === currentPemCourseCode ? 'active' : ''}`;
        btn.setAttribute("data-code", cCode);
        
        const count = (cData.exams || []).filter(e => e.exists).length;
        btn.innerHTML = `<span>${cData.name}</span> <span class="pem-badge-count">${count} מבחנים לתרגול</span>`;
        btn.addEventListener("click", () => {
            currentPemCourseCode = cCode;
            document.querySelectorAll(".pem-course-tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderPastExamsTable(cCode);
        });
        tabsContainer.appendChild(btn);
    });

    renderPastExamsTable(currentPemCourseCode);
}

// Renders the past exams table for the selected course
function renderPastExamsTable(courseCode) {
    const cData = gameState.pastExamsBank[courseCode];
    if (!cData) return;

    if (!cData.earliestYear) cData.earliestYear = 2018;
    if (!cData.exams || cData.exams.length === 0) {
        cData.exams = generateAllTermsList(cData.earliestYear);
    }

    // Set Earliest Year dropdown
    const yearSelect = document.getElementById("pem-earliest-year");
    if (yearSelect) {
        yearSelect.value = String(cData.earliestYear);
    }

    // Set study inputs
    const startInput = document.getElementById("pem-study-start");
    const examInput = document.getElementById("pem-exam-date");
    if (startInput) startInput.value = cData.studyStartDate || "2026-08-05";
    if (examInput) examInput.value = cData.examDate || "2026-08-13";

    // Update selection counter
    updateSelectionSummary(courseCode);

    const tbody = document.getElementById("pem-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    cData.exams.forEach((exam, idx) => {
        const tr = document.createElement("tr");
        tr.className = exam.exists ? "selected" : "unselected";

        const solutionHtml = exam.solution ? `<span class="pem-solution-tag">${exam.solution}</span>` : `<span style="color: var(--text-muted);">-</span>`;

        tr.innerHTML = `
            <td style="text-align: center;">
                <input type="checkbox" class="pem-exam-check" data-idx="${idx}" ${exam.exists ? 'checked' : ''} title="סמן אם מבחן לתרגול זה קיים לתרגול">
            </td>
            <td style="font-weight: 700; color: #f8fafc;">${exam.year}</td>
            <td>${exam.moed}</td>
            <td>${solutionHtml}</td>
            <td>
                <input type="date" class="pem-date-picker" data-idx="${idx}" value="${exam.scheduledDate || ''}" ${!exam.exists ? 'disabled' : ''}>
            </td>
            <td class="pem-status-cell">${getExamStatusPill(exam)}</td>
            <td style="text-align: center;">
                <button type="button" class="pem-btn-del" data-idx="${idx}" title="מחק מבחן לתרגול">🗑️</button>
            </td>
        `;

        // Checkbox listener
        tr.querySelector(".pem-exam-check").addEventListener("change", (e) => {
            exam.exists = e.target.checked;
            if (!exam.exists) exam.scheduledDate = "";

            tr.className = exam.exists ? "selected" : "unselected";
            const datePicker = tr.querySelector(".pem-date-picker");
            datePicker.disabled = !exam.exists;
            if (!exam.exists) datePicker.value = "";

            const statusCell = tr.querySelector(".pem-status-cell");
            if (statusCell) statusCell.innerHTML = getExamStatusPill(exam);

            updateSelectionSummary(courseCode);
        });

        // Date picker listener
        tr.querySelector(".pem-date-picker").addEventListener("change", (e) => {
            exam.scheduledDate = e.target.value;
            const statusCell = tr.querySelector(".pem-status-cell");
            if (statusCell) statusCell.innerHTML = getExamStatusPill(exam);
        });

        // Delete button listener
        tr.querySelector(".pem-btn-del").addEventListener("click", () => {
            cData.exams.splice(idx, 1);
            renderPastExamsTable(courseCode);
        });

        tbody.appendChild(tr);
    });

    // Master select all checkbox in table header
    const selectAllCb = document.getElementById("pem-select-all");
    if (selectAllCb) {
        selectAllCb.checked = cData.exams.length > 0 && cData.exams.every(e => e.exists);
        selectAllCb.onchange = (e) => {
            cData.exams.forEach(ex => {
                ex.exists = e.target.checked;
                if (!ex.exists) ex.scheduledDate = "";
            });
            renderPastExamsTable(courseCode);
        };
    }
}

function getExamStatusPill(exam) {
    if (!exam.exists) {
        return `<span class="pem-status-pill unscheduled">לא סומן</span>`;
    }
    if (exam.completed) {
        return `<span class="pem-status-pill done">✓ הושלם</span>`;
    }
    if (exam.scheduledDate) {
        return `<span class="pem-status-pill scheduled">📅 שובץ (${exam.scheduledDate.substring(5)})</span>`;
    }
    return `<span class="pem-status-pill" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">⏳ טרם שובץ</span>`;
}

function updateSelectionSummary(courseCode) {
    const cData = gameState.pastExamsBank[courseCode];
    if (!cData || !cData.exams) return;

    const count = cData.exams.filter(e => e.exists).length;
    const total = cData.exams.length;

    const countEl = document.getElementById("pem-selection-count");
    if (countEl) {
        countEl.innerText = `סומנו: ${count} מתוך ${total} מועדים`;
    }

    // Update tab badge
    const tabBtn = document.querySelector(`.pem-course-tab-btn[data-code="${courseCode}"]`);
    if (tabBtn) {
        const badge = tabBtn.querySelector(".pem-badge-count");
        if (badge) badge.innerText = `${count} מבחנים לתרגול`;
    }
}

// Auto-distribution algorithm: spreads selected exams chronologically across study dates before the exam
function autoScheduleCourseExams(courseCode) {
    const cData = gameState.pastExamsBank[courseCode];
    if (!cData) return;

    const startDateStr = document.getElementById("pem-study-start").value;
    const examDateStr = document.getElementById("pem-exam-date").value;
    const examsPerDay = parseInt(document.getElementById("pem-exams-per-day").value, 10) || 2;

    if (!startDateStr || !examDateStr) {
        alert("נא להזין תאריך תחילת מרתון ותאריך מועד המבחן!");
        return;
    }

    cData.studyStartDate = startDateStr;
    cData.examDate = examDateStr;

    const start = new Date(startDateStr);
    const end = new Date(examDateStr);

    if (start >= end) {
        alert("תאריך תחילת המרתון חייב להיות לפני תאריך המבחן!");
        return;
    }

    // Build array of available study dates (excluding the exam day itself)
    const availableDates = [];
    const curr = new Date(start);
    while (curr < end) {
        availableDates.push(curr.toISOString().split("T")[0]);
        curr.setDate(curr.getDate() + 1);
    }

    if (availableDates.length === 0) {
        alert("אין ימי למידה פנויים בין התאריכים!");
        return;
    }

    // Filter exams that are marked as existing
    const selectedExams = cData.exams.filter(e => e.exists);
    if (selectedExams.length === 0) {
        alert("לא סומנו מבחנים לתרגול לתרגול! נא לסמן בתיבת הסימון (☑️) את המבחנים לתרגול שקיימים עבורך.");
        return;
    }

    // Clear previous scheduled dates
    cData.exams.forEach(e => {
        if (!e.exists) e.scheduledDate = "";
    });

    // Sort chronologically: oldest exams first, saving the newest simulations for the final marathon days
    selectedExams.sort((a, b) => {
        const yA = parseInt(a.year, 10) || 0;
        const yB = parseInt(b.year, 10) || 0;
        if (yA !== yB) return yA - yB;
        return a.moed.localeCompare(b.moed);
    });

    // Distribute exams across availableDates
    let dateIdx = 0;
    let countOnDate = 0;

    selectedExams.forEach((exam) => {
        if (dateIdx >= availableDates.length) {
            dateIdx = availableDates.length - 1; // pack into last study day before exam
        }
        exam.scheduledDate = availableDates[dateIdx];
        countOnDate++;
        if (countOnDate >= examsPerDay) {
            countOnDate = 0;
            if (dateIdx < availableDates.length - 1) {
                dateIdx++;
            }
        }
    });

    renderPastExamsTable(courseCode);
    alert(`⚡ שובצו בהצלחה ${selectedExams.length} מבחנים לתרגול לאורך ${availableDates.length} ימי למידה!`);
}

// Add custom exam to current course bank
function addCustomExamToBank(courseCode) {
    const cData = gameState.pastExamsBank[courseCode];
    if (!cData) return;

    const year = (document.getElementById("pem-new-year").value || "2026").trim();
    const moed = (document.getElementById("pem-new-moed").value || "מועד א").trim();
    const solution = (document.getElementById("pem-new-solution").value || "פתרון קיים").trim();
    const date = document.getElementById("pem-new-date").value || "";

    cData.exams.unshift({
        id: `custom_${Date.now()}`,
        year: year,
        moed: moed,
        solution: solution,
        exists: true,
        isCustom: true,
        scheduledDate: date,
        completed: false
    });

    // Reset inputs
    document.getElementById("pem-new-moed").value = "";
    document.getElementById("pem-new-solution").value = "";

    renderPastExamsTable(courseCode);
}

// Generates and downloads a standard .ics Calendar File for Google Calendar / Apple Calendar

// Automated Cloud Calendar Sync (Google Calendar Webcal via GitHub Gist)
const CLOUD_GIST_SYNC = {
    gistId: "71ec3efb9e46b0abafa44532f0e2aab1",
    token: localStorage.getItem("academic_skill_tree_github_token") || "",
    rawUrl: "https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics",
    webcalUrl: "webcal://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics"
};

let cloudSyncDebounceTimer = null;

function triggerCloudGistSyncDebounced() {
    if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = setTimeout(() => {
        syncScheduleToCloudGist(false);
    }, 2500);
}

// Generate pure ICS string from current gameState
function generateFullICSString() {
    let icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Academic Skill Tree//Technion Live Calendar Sync//HE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:טכניון - לוח משימות ומבחנים (Academic Skill Tree)",
        "X-WR-TIMEZONE:Asia/Jerusalem"
    ];

    let count = 0;

    if (gameState.isFinalsMode) {
        const schedule = gameState.pastExamSchedule || [];
        schedule.forEach(item => {
            if (!item.date) return;
            count++;
            const cleanDate = item.date.replace(/-/g, "");
            const uid = `pe-${item.id}-${cleanDate}@academicskilltree.local`;
            icsContent.push(
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTAMP:${cleanDate}T080000Z`,
                `DTSTART;VALUE=DATE:${cleanDate}`,
                `DTEND;VALUE=DATE:${cleanDate}`,
                `SUMMARY:📝 מבחן לתרגול: ${item.title}`,
                `DESCRIPTION:מבחן עבר לפתרון לקראת הבחינה. הושלם: ${item.completed ? 'כן' : 'לא'}`,
                "STATUS:CONFIRMED",
                "END:VEVENT"
            );
        });
    } else {
        Object.values(gameState.courses).forEach(course => {
            if (course.status !== 'active') return;
            const shortCourse = COURSE_SHORT_NAMES[course.code] || course.name;
            (course.tasks || []).forEach(task => {
                if (!task.dueDate) return;
                count++;
                const cleanDate = task.dueDate.replace(/-/g, "");
                const uid = `task-${course.code}-${task.id}-${cleanDate}@academicskilltree.local`;
                const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
                icsContent.push(
                    "BEGIN:VEVENT",
                    `UID:${uid}`,
                    `DTSTAMP:${cleanDate}T080000Z`,
                    `DTSTART;VALUE=DATE:${cleanDate}`,
                    `DTEND;VALUE=DATE:${cleanDate}`,
                    `SUMMARY:📝 [${shortCourse}] ${task.title}`,
                    `DESCRIPTION:משימה בקורס ${course.name} (${course.code}).\nסטטוס: ${isDone ? 'הושלם' : 'פתוח'}.`,
                    `CATEGORIES:${shortCourse},Tasks,משימות`,
                    `STATUS:${isDone ? 'COMPLETED' : 'CONFIRMED'}`,
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    `DESCRIPTION:תזכורת: ${task.title} ב-${shortCourse} להגשה מחר!`,
                    "TRIGGER:-P1D",
                    "END:VALARM",
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    `DESCRIPTION:תזכורת דחופה: ${task.title} ב-${shortCourse} להגשה היום!`,
                    "TRIGGER:-PT3H",
                    "END:VALARM",
                    "END:VEVENT"
                );
            });
        });
    }

    if (count === 0) {
        const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, "");
        icsContent.push(
            "BEGIN:VEVENT",
            `UID:welcome-feed-${todayStr}@academicskilltree.local`,
            `DTSTAMP:${todayStr}T000000Z`,
            `DTSTART;VALUE=DATE:${todayStr}`,
            `DTEND;VALUE=DATE:${todayStr}`,
            "SUMMARY:🎓 Academic Skill Tree: סמסטר ג' מחובר ומסונכרן",
            "DESCRIPTION:יומן המשימות והמבחנים מחובר ומסונכרן אוטומטית. ברגע שתוסיף מועדי הגשה למשימות או מבחנים, הם יופיעו כאן אוטומטית!",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        );
    }

    icsContent.push("END:VCALENDAR");
    return { icsString: icsContent.join("\r\n"), count };
}

// Asynchronous background update to GitHub Gist
async function syncScheduleToCloudGist(showToast = true) {
    const indicator = document.getElementById("sync-status-indicator");
    if (indicator) indicator.innerText = "🔄 מסנכרן...";

    const { icsString, count } = generateFullICSString();

    try {
        const response = await fetch(`https://api.github.com/gists/${CLOUD_GIST_SYNC.gistId}`, {
            method: "PATCH",
            headers: {
                "Authorization": `token ${CLOUD_GIST_SYNC.token}`,
                "User-Agent": "AcademicSkillTree-Client",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                files: {
                    "technion_schedule.ics": {
                        content: icsString
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`שגיאת תקשורת עם GitHub (${response.status})`);
        }

        if (indicator) indicator.innerText = "🟢 מסונכרן כעת";
        if (showToast) {
            showToastNotification(`✅ סנכרון יומן הושלם בהצלחה! ${count} אירועים עודכנו ב-Google Calendar.`, 'success');
        }
        console.log(`[CalendarSync] Successfully synced ${count} items to GitHub Gist.`);
        return true;
    } catch (err) {
        console.warn("[CalendarSync] Error syncing to Gist:", err);
        if (indicator) indicator.innerText = "⚠️ שגיאה זמנית";
        if (showToast) {
            showToastNotification(`⚠️ שגיאה בסנכרון לענן: ${err.message}`, 'error');
        }
        return false;
    }
}

// Open Calendar Auto-Sync Modal
function openCalendarSyncModal() {
    const modal = document.getElementById("calendar-sync-modal");
    if (!modal) return;
    modal.style.display = "flex";

    const copyBtn = document.getElementById("btn-copy-webcal-url");
    const input = document.getElementById("sync-webcal-url-input");
    const hint = document.getElementById("copy-webcal-url-hint");
    if (copyBtn && input) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(input.value).then(() => {
                copyBtn.innerText = "✓ הועתק!";
                if (hint) hint.innerText = "✓ הקישור הועתק ללוח! הדבק אותו ב-Google Calendar תחת 'הוסף יומן מכתובת URL'.";
                setTimeout(() => {
                    copyBtn.innerText = "📋 העתק קישור";
                }, 2500);
            });
        };
    }

    const triggerBtn = document.getElementById("btn-trigger-cloud-sync");
    if (triggerBtn) {
        triggerBtn.onclick = () => {
            triggerBtn.disabled = true;
            triggerBtn.innerText = "🔄 מסנכרן...";
            syncScheduleToCloudGist(true).finally(() => {
                triggerBtn.disabled = false;
                triggerBtn.innerText = "🔄 סנכרן עכשיו לענן";
            });
        };
    }

    const manualBtn = document.getElementById("btn-manual-download-ics");
    if (manualBtn) {
        manualBtn.onclick = () => {
            exportScheduleToICS();
        };
    }

    const closeBtn = document.getElementById("btn-close-sync-modal");
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = "none";
        };
    }
}

function exportScheduleToICS() {
    if (gameState.isFinalsMode) {
        syncScheduleFromBank();
        const schedule = gameState.pastExamSchedule || [];

        if (schedule.length === 0) {
            alert("אין מבחנים לתרגול עם תאריך משובץ לייצוא!");
            return;
        }

        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Academic Skill Tree//Finals Marathon Scheduler//HE",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:מרתון מבחני עבר ומבחנים לתרגול",
            "X-WR-TIMEZONE:Asia/Jerusalem"
        ];

        schedule.forEach((item) => {
            if (!item.date) return;
            const cleanDate = item.date.replace(/-/g, "");
            const uid = `pe-${item.id}-${cleanDate}@academicskilltree.local`;
            
            icsContent.push(
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTAMP:${cleanDate}T080000Z`,
                `DTSTART;VALUE=DATE:${cleanDate}`,
                `DTEND;VALUE=DATE:${cleanDate}`,
                `SUMMARY:📝 מבחן לתרגול: ${item.title}`,
                `DESCRIPTION:מבחן עבר לפתרון לקראת בחינת הסמסטר. הושלם: ${item.completed ? 'כן' : 'לא'}`,
                "STATUS:CONFIRMED",
                "END:VEVENT"
            );
        });

        icsContent.push("END:VCALENDAR");
        downloadICSFile(icsContent.join("\r\n"), "Past_Exams_Marathon_Schedule.ics");
        alert("קובץ Past_Exams_Marathon_Schedule.ics הורד בהצלחה!\nניתן לפתוח אותו או לייבא ישירות ל-Google Calendar / Google Tasks.");
    } else {
        // Normal Semester Mode: Export All Tasks & Homework to Google Calendar with Automatic VALARM Reminders!
        let icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Academic Skill Tree//Course Tasks Scheduler//HE",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:משימות ושיעורי בית - סמסטר אקדמי",
            "X-WR-TIMEZONE:Asia/Jerusalem"
        ];

        let taskCount = 0;
        Object.values(gameState.courses).forEach(course => {
            if (course.status !== 'active') return;
            (course.tasks || []).forEach(task => {
                if (!task.dueDate) return;
                taskCount++;
                const cleanDate = task.dueDate.replace(/-/g, "");
                const uid = `task-${course.code}-${task.id}-${cleanDate}@academicskilltree.local`;
                const shortCourse = COURSE_SHORT_NAMES[course.code] || course.name;
                const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
                
                icsContent.push(
                    "BEGIN:VEVENT",
                    `UID:${uid}`,
                    `DTSTAMP:${cleanDate}T080000Z`,
                    `DTSTART;VALUE=DATE:${cleanDate}`,
                    `DTEND;VALUE=DATE:${cleanDate}`,
                    `SUMMARY:📝 [${shortCourse}] ${task.title}`,
                    `DESCRIPTION:משימה בקורס ${course.name} (${course.code}).\\nסטטוס: ${isDone ? 'הושלם' : 'פתוח'}.`,
                    `CATEGORIES:${shortCourse},Tasks,משימות`,
                    `STATUS:${isDone ? 'COMPLETED' : 'CONFIRMED'}`,
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    `DESCRIPTION:תזכורת: ${task.title} ב-${shortCourse} להגשה מחר!`,
                    "TRIGGER:-P1D",
                    "END:VALARM",
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    `DESCRIPTION:תזכורת דחופה: ${task.title} ב-${shortCourse} להגשה היום!`,
                    "TRIGGER:-PT3H",
                    "END:VALARM",
                    "END:VEVENT"
                );
            });
        });

        if (taskCount === 0) {
            alert("שים לב: אין כרגע משימות עם תאריך יעד משובץ לייצוא ליומן.\nניתן לקבוע תאריך הגשה למשימות דרך עמוד המשימה (Side Peek) או בלחיצה על ➕ בלוח השנה.");
            return;
        }

        icsContent.push("END:VCALENDAR");
        downloadICSFile(icsContent.join("\r\n"), "Semester_Tasks_Homework_Schedule.ics");
        showToastNotification(`📅 הורד קובץ Semester_Tasks_Homework_Schedule.ics עם ${taskCount} משימות ותזכורות אוטומטיות!`, 'success');
        alert(`סנכרון הושלם!\nהורד קובץ Semester_Tasks_Homework_Schedule.ics עם ${taskCount} משימות ושיעורי בית.\nהקובץ כולל תזכורות אוטומטיות (VALARM) יום לפני ובבוקר ההגשה ב-Google Calendar / Apple Calendar.`);
    }
}

function downloadICSFile(content, fileName) {
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Formats tasks with due dates to easily paste into Google Tasks
function copyScheduleToGoogleTasks() {
    if (gameState.isFinalsMode) {
        syncScheduleFromBank();
        const schedule = gameState.pastExamSchedule || [];

        if (schedule.length === 0) {
            alert("אין מבחנים לתרגול עם תאריכים מוגדרים להעתקה!");
            return;
        }

        const sorted = [...schedule].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

        let text = "📋 רשימת מרתון מבחנים לתרגול (Google Tasks List):\n\n";
        sorted.forEach(item => {
            text += `[ ] ${item.title} (תאריך יעד: ${item.date})\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            alert("רשימת המבחנים לתרגול הועתקה ללוח!\nניתן להדביק אותה ישירות ב-Google Tasks או ב-Google Keep.");
        }).catch(() => {
            prompt("העתק את הרשימה הבאה להדבקה ב-Google Tasks:", text);
        });
    } else {
        // Normal Semester Mode: Formatted directly by course matching user's exact Google Tasks setup!
        let text = "📋 משימות ושיעורי בית לפי קורסים (Google Tasks List):\n\n";
        let taskTotal = 0;

        Object.values(gameState.courses).forEach(course => {
            if (course.status !== 'active') return;
            const tasks = (course.tasks || []).filter(t => t.type !== 'exam');
            if (tasks.length === 0) return;
            
            const shortName = COURSE_SHORT_NAMES[course.code] || course.name;
            text += `🔹 ${shortName}:\n`;
            tasks.forEach(t => {
                taskTotal++;
                const isDone = t.completed || t.status === 'done' || t.status === 'submitted';
                const check = isDone ? "[x]" : "[ ]";
                const due = t.dueDate ? ` (תאריך יעד: ${t.dueDate})` : "";
                text += `${check} ${t.title}${due}\n`;
            });
            text += "\n";
        });

        if (taskTotal === 0) {
            alert("אין משימות פעילות להעתקה!");
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            showToastNotification(`📋 רשימת המשימות הועתקה ללוח עבור Google Tasks!`, 'success');
            alert("רשימת המשימות ושיעורי הבית סודרה לפי קורסים והועתקה ללוח!\nניתן להדביק ישירות ב-Google Tasks תחת הקורסים המתאימים.");
        }).catch(() => {
            prompt("העתק את הרשימה הבאה להדבקה ב-Google Tasks:", text);
        });
    }
}

// Renders the Google Calendar-style daily past exams grid
function renderFinalsCalendar() {
    const grid = document.getElementById("finals-calendar-grid");
    const titleEl = document.getElementById("cal-current-month-title");
    if (!grid) return;

    grid.innerHTML = "";

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (titleEl) {
        titleEl.innerText = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    }

    const subTitleEl = document.querySelector(".finals-calendar-header-bar .cal-subtitle");
    const headerTitleEl = document.querySelector(".finals-calendar-header-bar .finals-calendar-title");
    const headerExportBtn = document.getElementById("btn-export-google-tasks");

    if (gameState.isFinalsMode) {
        if (headerTitleEl) headerTitleEl.innerText = "📅 מרתון מבחני עבר ומועדי בחינות";
        if (subTitleEl) subTitleEl.innerText = "תצוגה חודשית של כל מועדי הבחינות, מרתון מבחני עבר ומבחנים לתרגול";
        if (headerExportBtn) headerExportBtn.innerText = "📤 ייצוא מרתון ל-Google";
    } else {
        if (headerTitleEl) headerTitleEl.innerText = "📅 לוח שנה: משימות ושיעורי בית לפי קורסים";
        if (subTitleEl) subTitleEl.innerText = "סנכרון מלא של כל משימות הקורסים, שיעורי בית, WebWork, מעבדות ותאריכי יעד";
        if (headerExportBtn) headerExportBtn.innerText = "📅 סנכרן משימות ליומן / Tasks";
    }

    // Days of week header
    const isMobile = window.innerWidth <= 768;
    const daysOfWeek = isMobile
        ? ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
        : ["ראשון (Sun)", "שני (Mon)", "שלישי (Tue)", "רביעי (Wed)", "חמישי (Thu)", "שישי (Fri)", "שבת (Sat)"];
    daysOfWeek.forEach((dName, idx) => {
        const h = document.createElement("div");
        h.className = "cal-day-header";
        h.innerText = dName;
        if (isMobile) {
            h.title = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "יום שבת"][idx];
        }
        grid.appendChild(h);
    });

    // Calendar date calculations
    const firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

    // Map scheduled items by date string (YYYY-MM-DD)
    const itemsByDate = {};
    (gameState.pastExamSchedule || []).forEach(item => {
        if (!itemsByDate[item.date]) itemsByDate[item.date] = [];
        itemsByDate[item.date].push(item);
    });

    // Also map real course exams and all active course tasks (גיליון, WebWork, מעבדה, פרויקט, etc.)
    Object.values(gameState.courses).forEach(course => {
        if (!course.tasks) return;
        course.tasks.forEach(task => {
            if (!task.dueDate) return;
            if (!itemsByDate[task.dueDate]) itemsByDate[task.dueDate] = [];

            if (task.type === 'exam') {
                const isExamDone = task.completed || task.status === 'done' || task.status === 'submitted';
                const todayObj = new Date();
                todayObj.setHours(0, 0, 0, 0);
                const taskDateObj = new Date(task.dueDate);
                taskDateObj.setHours(0, 0, 0, 0);
                const isPassed = isExamDone || (taskDateObj < todayObj);

                let titleStr = task.title;
                if (isPassed) {
                    titleStr = titleStr.replace(/^🔴\s*/, '');
                    if (!titleStr.startsWith('🟢') && !titleStr.startsWith('✓')) {
                        titleStr = `🟢 ${titleStr}`;
                    }
                } else {
                    titleStr = titleStr.startsWith('🔴') ? titleStr : `🔴 ${task.title}`;
                }

                itemsByDate[task.dueDate].push({
                    isExamEvent: true,
                    isPassed: isPassed,
                    title: titleStr,
                    courseCode: course.code,
                    courseName: course.name,
                    taskId: task.id
                });
            } else {
                // Determine task styling and category icon
                const lowerTitle = (task.title || "").toLowerCase();
                let typeClass = "sheet";
                let icon = "📝";

                if (task.type === 'lab' || lowerTitle.includes('מעבדה') || lowerTitle.includes('lab')) {
                    typeClass = "lab";
                    icon = "🧪";
                } else if (lowerTitle.includes('webwork')) {
                    typeClass = "webwork";
                    icon = "🌐";
                } else if (task.type === 'project' || lowerTitle.includes('פרויקט') || lowerTitle.includes('project')) {
                    typeClass = "project";
                    icon = "🚀";
                } else if (lowerTitle.includes('גיליון') || lowerTitle.includes('מטלה') || task.type === 'hw') {
                    typeClass = "sheet";
                    icon = "📝";
                } else {
                    typeClass = "sheet";
                    icon = "📋";
                }

                const isDone = task.completed || task.status === 'completed' || task.status === 'done';
                const shortCourse = COURSE_SHORT_NAMES[course.code] || course.name;
                const displayTitle = `${icon} [${shortCourse}] ${task.title}`;

                itemsByDate[task.dueDate].push({
                    isTaskEvent: true,
                    title: task.title,
                    displayTitle: displayTitle,
                    courseCode: course.code,
                    courseName: course.name,
                    taskId: task.id,
                    typeClass: typeClass,
                    completed: isDone
                });
            }
        });
    });

    // Also map custom personal calendar events (from Google Calendar)
    (gameState.customCalendarEvents || []).forEach(ev => {
        if (!ev.date) return;
        if (!itemsByDate[ev.date]) itemsByDate[ev.date] = [];
        itemsByDate[ev.date].push({
            isPersonalEvent: true,
            title: ev.title,
            completed: !!ev.completed
        });
    });

    // Previous month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const cell = document.createElement("div");
        cell.className = "cal-day-cell other-month";
        cell.innerHTML = `<div class="cal-day-num">${daysInPrevMonth - i}</div>`;
        grid.appendChild(cell);
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayItems = itemsByDate[dateStr] || [];
        const hasActiveExam = dayItems.some(it => it.isExamEvent && !it.isPassed);
        const hasPassedExam = dayItems.some(it => it.isExamEvent && it.isPassed);

        const cell = document.createElement("div");
        let cellClasses = ["cal-day-cell"];
        if (hasPassedExam) cellClasses.push("has-past-exam");
        if (hasActiveExam) cellClasses.push("has-exam");
        cell.className = cellClasses.join(" ");
        cell.dataset.date = dateStr;

        let cellHtml = `
            <div class="cal-day-num">
                <span>${day}</span>
                <button type="button" class="btn-add-day-item" data-date="${dateStr}" title="הוסף משימה או מבחן לתרגול ליום זה">➕</button>
            </div>
            <div class="cal-events-list" style="display: flex; flex-direction: column; gap: 4px;">
        `;

        dayItems.forEach(item => {
            if (item.isExamEvent) {
                const passedClass = item.isPassed ? "passed" : "";
                cellHtml += `
                    <div class="cal-event-pill exam-event ${passedClass}" data-course-code="${item.courseCode}" title="מבחן סוף רשמי! לחץ לפתיחת פרטי ${item.courseName || ''}">
                        ${item.title}
                    </div>
                `;
            } else if (item.isTaskEvent) {
                const doneClass = item.completed ? "done" : "";
                const checkIcon = item.completed ? "☑" : "⚪";
                cellHtml += `
                    <div class="cal-event-pill task-event ${item.typeClass} ${doneClass}" data-course-code="${item.courseCode}" data-task-id="${item.taskId}" title="משימה (${item.courseName}): לחץ לצפייה בעמוד המשימה">
                        <span class="cal-task-check" data-course-code="${item.courseCode}" data-task-id="${item.taskId}" title="לחץ לסימון הושלם/לא הושלם">${checkIcon}</span>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.displayTitle}</span>
                    </div>
                `;
            } else if (item.isPersonalEvent) {
                const doneClass = item.completed ? "done" : "";
                cellHtml += `
                    <div class="cal-event-pill personal-event ${doneClass}" title="${item.title}">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">🔵 ${item.title}</span>
                    </div>
                `;
            } else {
                const completedClass = item.completed ? "completed" : "";
                const checkIcon = item.completed ? "☑" : "⚪";
                cellHtml += `
                    <div class="cal-event-pill past-exam ${completedClass}" data-pe-id="${item.id}" title="מבחן לתרגול (לחץ לסימון ביצוע)">
                        <span class="cal-event-cb">${checkIcon}</span>
                        <span>${item.title}</span>
                    </div>
                `;
            }
        });

        cellHtml += `</div>`;
        cell.innerHTML = cellHtml;

        // Add item button listener -> Opens Add Custom Task Modal prefilled with this cell's date
        const addBtn = cell.querySelector(".btn-add-day-item");
        if (addBtn) {
            addBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                openAddCustomTaskModal(dateStr);
            });
        }

        // Exam event click listener -> Open course details modal
        cell.querySelectorAll(".cal-event-pill.exam-event").forEach(pill => {
            pill.addEventListener("click", (e) => {
                e.stopPropagation();
                const cCode = pill.dataset.courseCode;
                if (cCode) openCourseDetails(cCode);
            });
        });

        // Task event click listener -> Open task side peek
        cell.querySelectorAll(".cal-event-pill.task-event").forEach(pill => {
            pill.addEventListener("click", (e) => {
                e.stopPropagation();
                const cCode = pill.dataset.courseCode;
                const tId = pill.dataset.taskId;
                if (cCode && tId) openTaskSidePeek(cCode, tId);
            });
        });

        // Task checkbox listener inside calendar pill -> Toggle done / not_started
        cell.querySelectorAll(".cal-task-check").forEach(checkSpan => {
            checkSpan.addEventListener("click", (e) => {
                e.stopPropagation();
                const cCode = checkSpan.dataset.courseCode;
                const tId = checkSpan.dataset.taskId;
                const course = gameState.courses[cCode];
                if (!course) return;
                const task = (course.tasks || []).find(t => t.id === tId);
                if (!task) return;
                const isDone = task.completed || task.status === 'completed' || task.status === 'done';
                toggleTaskStatusInState(cCode, tId, isDone ? 'not_started' : 'done');
                saveState();
                renderFinalsCalendar();
                renderNotionTasksTable();
                renderExamGapRunway();
                renderUI();
            });
        });

        // Toggle completed listener for past exams
        cell.querySelectorAll(".cal-event-pill.past-exam").forEach(pill => {
            pill.addEventListener("click", (e) => {
                e.stopPropagation();
                const peId = pill.dataset.peId;
                const peItem = gameState.pastExamSchedule.find(p => p.id === peId);
                if (peItem) {
                    peItem.completed = !peItem.completed;
                    if (peItem.completed) {
                        addXp(40); // 40 XP reward for completing a past exam!
                    } else {
                        addXp(-40);
                    }
                    saveState();
                    renderFinalsCalendar();
                }
            });
        });

        grid.appendChild(cell);
    }
}


// ==============================================================================
// Editable Settings & Revisions Controller
// ==============================================================================

const APP_CURRENT_REVISION = {
    code: "REV-2026.09.12-v3.5",
    build: "178922",
    date: "2026-09-12 23:50",
    description: "סמסטר ג' פעיל, סמסטר ד' נעול עד לסיום סמסטר ג', סנכרון יומני Google דו-כיווני"
};

function ensureBaselineRevisions() {
    if (!gameState.revisions || !Array.isArray(gameState.revisions) || gameState.revisions.length === 0) {
        gameState.revisions = [
            {
                id: "rev-baseline-1",
                name: "רוויזיה 1: סיום שנה א׳ (סמסטרים א׳ ו-ב׳)",
                timestamp: "2026-08-28T12:00:00.000Z",
                note: "סיום מוצלח של שנה א', 11 קורסים הושלמו, ממוצע כללי 86.26",
                gpa: 86.26,
                completedCourses: 11,
                credits: 40.5,
                stateSnapshot: null
            },
            {
                id: "rev-baseline-2",
                name: "רוויזיה 2: פתיחת סמסטר ג׳ ונעילת סמסטר ד׳",
                timestamp: "2026-09-12T18:30:00.000Z",
                note: "הפעלת 6 קורסי סמסטר ג', חסימת רישום לקורסי סמסטר ד' עד להשלמה, הגדרת סנכרון יומנים",
                gpa: 86.26,
                completedCourses: 11,
                credits: 40.5,
                stateSnapshot: JSON.parse(JSON.stringify(gameState))
            }
        ];
    }
}

// Render Settings & Revisions Workspace (Fully Editable)
function renderSettingsPage() {
    ensureBaselineRevisions();

    // 1. Populate Section 1: Revision & Semester Control
    const revCodeInput = document.getElementById("setting-revision-code");
    const activeSemSelect = document.getElementById("setting-active-semester");
    const guardModeSelect = document.getElementById("setting-semester-guard-mode");
    const charClassInput = document.getElementById("setting-character-class");

    if (revCodeInput) revCodeInput.value = gameState.customRevisionCode || APP_CURRENT_REVISION.code;
    if (activeSemSelect) activeSemSelect.value = gameState.currentActiveSemester || 3;
    if (guardModeSelect) guardModeSelect.value = gameState.semesterGuardMode || "locked";
    if (charClassInput) charClassInput.value = gameState.characterClass || "סטודנט להנדסת מכונות - הטכניון";

    // 2. Populate Section 3: Google Calendar IDs & Sync
    const calExamsInput = document.getElementById("setting-cal-id-exams");
    const calHwInput = document.getElementById("setting-cal-id-hw");
    const calPracticeInput = document.getElementById("setting-cal-id-practice");
    const webhookInput = document.getElementById("input-apps-script-webhook");
    const syncFreqSelect = document.getElementById("setting-sync-frequency");

    const defaultCals = {
        exams: "f04b545847cb46d2694500ffc3ac3378bd9005e125ae4a59c2caea5a5f32725c@group.calendar.google.com",
        hw: "a887c830cc1a7b0ca4f97d1751bcf02477d837dd4ca9cf5de8385871f44a6c4d@group.calendar.google.com",
        practice: "d707cbfa99ea0f68a0a31ebc42cb4cd35eae834770a5a118051727eb0c1afdd5@group.calendar.google.com"
    };

    if (calExamsInput) calExamsInput.value = (gameState.calendarIds && gameState.calendarIds.exams) || defaultCals.exams;
    if (calHwInput) calHwInput.value = (gameState.calendarIds && gameState.calendarIds.hw) || defaultCals.hw;
    if (calPracticeInput) calPracticeInput.value = (gameState.calendarIds && gameState.calendarIds.practice) || defaultCals.practice;
    if (webhookInput) webhookInput.value = gameState.googleAppsScriptWebhookUrl || "";
    if (syncFreqSelect) syncFreqSelect.value = gameState.syncFrequencyHours || 1;

    // 3. Populate Section 4: Academic Goals & Reminders
    const degreeCreditsInput = document.getElementById("setting-degree-credits");
    const deansInput = document.getElementById("setting-deans-honor");
    const presidentsInput = document.getElementById("setting-presidents-honor");
    const reminderDaysSelect = document.getElementById("setting-reminder-days-advance");

    if (degreeCreditsInput) degreeCreditsInput.value = gameState.totalDegreeCredits || 157.5;
    if (deansInput) deansInput.value = gameState.deansHonorThreshold || 85.0;
    if (presidentsInput) presidentsInput.value = gameState.presidentsHonorThreshold || 90.0;
    if (reminderDaysSelect) reminderDaysSelect.value = gameState.reminderAdvanceDays || 1;

    // 4. Render Revisions List with Inline Edit capabilities
    const listContainer = document.getElementById("revisions-list-container");
    const countIndicator = document.getElementById("revisions-count-indicator");
    if (listContainer) {
        listContainer.innerHTML = "";
        const revs = gameState.revisions || [];
        if (countIndicator) countIndicator.innerText = `${revs.length} רוויזיות שמורות`;

        revs.forEach((rev, idx) => {
            const itemDiv = document.createElement("div");
            const isLatest = idx === revs.length - 1;
            itemDiv.className = `revision-item ${isLatest ? 'current' : ''}`;

            const dateFormatted = new Date(rev.timestamp).toLocaleString('he-IL', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            itemDiv.innerHTML = `
                <div class="revision-item-info" style="flex: 1;">
                    <div class="revision-item-title-row">
                        <span class="revision-item-title" id="rev-title-${rev.id}">${rev.name}</span>
                        <span class="revision-tag ${isLatest ? 'current' : 'snapshot'}">
                            ${isLatest ? 'רוויזיה פעילה (נוכחית)' : 'רוויזיית גיבוי'}
                        </span>
                    </div>
                    <div class="revision-item-meta">
                        📅 נוצר: ${dateFormatted} | ממוצע: ${rev.gpa || '86.26'} | נק״ז: ${rev.credits || '40.5'}
                        <div id="rev-note-${rev.id}" style="color: #cbd5e1; margin-top: 3px;">${rev.note ? '📝 ' + rev.note : 'ללא הערה'}</div>
                    </div>
                </div>
                <div class="revision-item-actions">
                    <button type="button" class="btn btn-outline btn-xs btn-edit-rev" data-id="${rev.id}" title="ערוך שם והערה עבור רוויזיה זו">
                        ✏️ ערוך
                    </button>
                    <button type="button" class="btn btn-outline btn-xs btn-restore-rev" data-id="${rev.id}" title="שחזר רוויזיה זו כמצב הפעיל של המערכת">
                        🔄 שחזר
                    </button>
                    <button type="button" class="btn btn-outline btn-xs btn-export-rev" data-id="${rev.id}" title="הורד קובץ JSON של רוויזיה זו">
                        📤 הורד JSON
                    </button>
                    ${!rev.id.startsWith('rev-baseline') ? `
                    <button type="button" class="btn btn-outline btn-xs btn-delete-rev" data-id="${rev.id}" style="color: #ef4444; border-color: #ef4444;" title="מחק רוויזיה">
                        🗑️
                    </button>` : ''}
                </div>
            `;

            listContainer.appendChild(itemDiv);
        });

        // Bind Edit buttons
        listContainer.querySelectorAll(".btn-edit-rev").forEach(btn => {
            btn.onclick = () => {
                const rId = btn.getAttribute("data-id");
                editRevisionDetails(rId);
            };
        });

        // Bind Restore buttons
        listContainer.querySelectorAll(".btn-restore-rev").forEach(btn => {
            btn.onclick = () => {
                const rId = btn.getAttribute("data-id");
                restoreRevisionById(rId);
            };
        });

        // Bind Export buttons
        listContainer.querySelectorAll(".btn-export-rev").forEach(btn => {
            btn.onclick = () => {
                const rId = btn.getAttribute("data-id");
                exportRevisionById(rId);
            };
        });

        // Bind Delete buttons
        listContainer.querySelectorAll(".btn-delete-rev").forEach(btn => {
            btn.onclick = () => {
                const rId = btn.getAttribute("data-id");
                deleteRevisionById(rId);
            };
        });
    }
}

// Edit Revision Details (Inline)
function editRevisionDetails(rId) {
    const rev = (gameState.revisions || []).find(r => r.id === rId);
    if (!rev) return;

    const newName = prompt("ערוך שם רוויזיה:", rev.name);
    if (newName === null) return;

    const newNote = prompt("ערוך הערת רוויזיה:", rev.note || "");
    if (newNote === null) return;

    rev.name = newName.trim() || rev.name;
    rev.note = newNote.trim();

    saveState();
    renderSettingsPage();
    showToastNotification("פרטי הרוויזיה עודכנו בהצלחה!", "success");
}

// Save Section 1: Revision & Semester Controls
function saveRevisionSection() {
    const revCodeInput = document.getElementById("setting-revision-code");
    const activeSemSelect = document.getElementById("setting-active-semester");
    const guardModeSelect = document.getElementById("setting-semester-guard-mode");
    const charClassInput = document.getElementById("setting-character-class");

    if (revCodeInput) gameState.customRevisionCode = revCodeInput.value.trim();
    if (activeSemSelect) gameState.currentActiveSemester = parseInt(activeSemSelect.value) || 3;
    if (guardModeSelect) gameState.semesterGuardMode = guardModeSelect.value;
    if (charClassInput) gameState.characterClass = charClassInput.value.trim();

    notifyStateChanged({ tab: 'settings' });
    showToastNotification("✅ הגדרות רוויזיה וסמסטרים נשמרו בהצלחה!", "success");
}

// Save Section 3: Google Calendars
function saveCalendarsSection() {
    const calExamsInput = document.getElementById("setting-cal-id-exams");
    const calHwInput = document.getElementById("setting-cal-id-hw");
    const calPracticeInput = document.getElementById("setting-cal-id-practice");
    const webhookInput = document.getElementById("input-apps-script-webhook");
    const syncFreqSelect = document.getElementById("setting-sync-frequency");

    if (!gameState.calendarIds) gameState.calendarIds = {};
    if (calExamsInput) gameState.calendarIds.exams = calExamsInput.value.trim();
    if (calHwInput) gameState.calendarIds.hw = calHwInput.value.trim();
    if (calPracticeInput) gameState.calendarIds.practice = calPracticeInput.value.trim();
    if (webhookInput) gameState.googleAppsScriptWebhookUrl = webhookInput.value.trim();
    if (syncFreqSelect) gameState.syncFrequencyHours = parseInt(syncFreqSelect.value) || 1;

    notifyStateChanged({ tab: 'settings' });
    const statusDiv = document.getElementById("webhook-save-status");
    if (statusDiv) {
        statusDiv.innerText = "✓ הגדרות יומנים נשמרו!";
        setTimeout(() => { statusDiv.innerText = ""; }, 3000);
    }
    showToastNotification("✅ הגדרות יומני Google נשמרו בהצלחה!", "success");
}

// Save Section 4: Academic Goals
function saveGoalsSection() {
    const degreeCreditsInput = document.getElementById("setting-degree-credits");
    const deansInput = document.getElementById("setting-deans-honor");
    const presidentsInput = document.getElementById("setting-presidents-honor");
    const reminderDaysSelect = document.getElementById("setting-reminder-days-advance");

    if (!gameState.academicGoals) gameState.academicGoals = {};

    if (degreeCreditsInput) {
        const c = parseFloat(degreeCreditsInput.value) || 157.5;
        gameState.totalDegreeCredits = c;
        gameState.academicGoals.degreeCredits = c;
    }
    if (deansInput) {
        const d = parseFloat(deansInput.value) || 85.0;
        gameState.deansHonorThreshold = d;
        gameState.academicGoals.deansHonor = d;
    }
    if (presidentsInput) {
        const p = parseFloat(presidentsInput.value) || 90.0;
        gameState.presidentsHonorThreshold = p;
        gameState.academicGoals.presidentsHonor = p;
    }
    if (reminderDaysSelect) gameState.reminderAdvanceDays = parseInt(reminderDaysSelect.value) || 1;

    notifyStateChanged({ tab: 'settings' });
    showToastNotification("✅ יעדים אקדמיים והתראות נשמרו בהצלחה!", "success");
}

// Master Save: Save all settings at once
function saveAllSettings() {
    saveRevisionSection();
    saveCalendarsSection();
    saveGoalsSection();
    notifyStateChanged({ tab: 'settings' });
    showToastNotification("🌟 כל ההגדרות נשמרו בהצלחה למערכת!", "success");
}

// Bind Global Settings Page Buttons

// Create a new snapshot revision
function createNewRevisionSnapshot() {
    const revName = prompt("הזן שם עבור הרוויזיה החדשה:", `רוויזיה ${new Date().toLocaleDateString('he-IL')}`);
    if (!revName) return;

    const note = prompt("הערה / תיאור לרוויזיה (אופציונלי):", "גיבוי נקודת שחזור");

    ensureBaselineRevisions();
    const newRev = {
        id: `rev-${Date.now()}`,
        name: revName.trim(),
        timestamp: new Date().toISOString(),
        note: note ? note.trim() : "",
        gpa: gameState.gpa ? parseFloat(gameState.gpa.toFixed(2)) : 86.26,
        completedCourses: gameState.completedCourses || 11,
        credits: gameState.credits || 40.5,
        stateSnapshot: JSON.parse(JSON.stringify(gameState))
    };

    gameState.revisions.push(newRev);
    saveState();
    renderSettingsPage();
    showToastNotification(`רוויזיה "${newRev.name}" נוצרה בהצלחה!`, 'success');
}

// Restore a revision by ID
function restoreRevisionById(rId) {
    ensureBaselineRevisions();
    const target = gameState.revisions.find(r => r.id === rId);
    if (!target) {
        alert("רוויזיה לא נמצאה!");
        return;
    }

    if (!confirm(`האם אתה בטוח שברצונך לשחזר את הרוויזיה: "${target.name}"?\nהמצב הנוכחי יוחלף ברוויזיה זו.`)) {
        return;
    }

    if (target.stateSnapshot) {
        const savedRevs = JSON.parse(JSON.stringify(gameState.revisions));
        gameState = JSON.parse(JSON.stringify(target.stateSnapshot));
        gameState.revisions = savedRevs; // retain revisions history
        notifyStateChanged({ tab: 'settings' });
        showToastNotification(`רוויזיה "${target.name}" שוחזרה בהצלחה!`, 'success');
    } else {
        alert("רוויזיה זו היא נקודת ייחוס היסטורית (Baseline).");
    }
}

// Export a revision to standalone JSON file
function exportRevisionById(rId) {
    ensureBaselineRevisions();
    const target = rId ? gameState.revisions.find(r => r.id === rId) : null;
    const dataToExport = target && target.stateSnapshot ? target.stateSnapshot : gameState;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(target ? target.name : 'AcademicSkillTree_Backup').replace(/[^a-zA-Z0-9֐-׿_-]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Delete revision
function deleteRevisionById(rId) {
    if (!confirm("האם למחוק רוויזיה זו?")) return;
    gameState.revisions = (gameState.revisions || []).filter(r => r.id !== rId);
    saveState();
    renderSettingsPage();
    showToastNotification("הרוויזיה נמחקה בהצלחה.", "info");
}

// Toggle reminders banner collapse with persistence
function toggleRemindersBannerCollapse() {
    const body = document.getElementById("reminders-banner-body");
    const btn = document.getElementById("btn-toggle-reminders-collapse");
    if (!body) return;
    
    body.classList.toggle("collapsed");
    const isCollapsed = body.classList.contains("collapsed");
    if (btn) btn.innerText = isCollapsed ? "▼" : "▲";
    gameState.remindersCollapsed = isCollapsed;
    saveState();
}

function setupSettingsPageButtons() {
    const btnSaveAll = document.getElementById("btn-save-all-settings");
    if (btnSaveAll) btnSaveAll.onclick = saveAllSettings;

    const btnSaveRev = document.getElementById("btn-save-section-revision");
    if (btnSaveRev) btnSaveRev.onclick = saveRevisionSection;

    const btnSaveCals = document.getElementById("btn-save-section-calendars");
    if (btnSaveCals) btnSaveCals.onclick = saveCalendarsSection;

    const btnSaveGoals = document.getElementById("btn-save-section-goals");
    if (btnSaveGoals) btnSaveGoals.onclick = saveGoalsSection;

    const btnCreate = document.getElementById("btn-create-revision");
    if (btnCreate) btnCreate.onclick = createNewRevisionSnapshot;

    const btnQuickRev = document.getElementById("btn-quick-new-rev");
    if (btnQuickRev) btnQuickRev.onclick = createNewRevisionSnapshot;

    const btnExport = document.getElementById("btn-export-revision-json");
    if (btnExport) btnExport.onclick = () => exportRevisionById(null);

    const btnImport = document.getElementById("btn-import-revision-json");
    const fileInput = document.getElementById("input-import-revision-file");

    if (btnImport && fileInput) {
        btnImport.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported && imported.courses) {
                        if (confirm(`האם לייבא רוויזיה מקובץ "${file.name}"?`)) {
                            const revs = gameState.revisions || [];
                            gameState = imported;
                            gameState.revisions = revs;
                            recalculateCourseStates();
                            saveState();
                            renderUI();
                            renderSettingsPage();
                            showToastNotification("רוויזיה יובאה בהצלחה!", "success");
                        }
                    } else {
                        alert("מבנה הקובץ אינו תואם לרוויזיית Academic Skill Tree.");
                    }
                } catch (err) {
                    alert("שגיאה בפענוח קובץ ה-JSON: " + err.message);
                }
            };
            reader.readAsText(file, "UTF-8");
        };
    }

    const pullBtn = document.getElementById("btn-trigger-manual-calendar-pull");
    if (pullBtn) {
        pullBtn.onclick = () => {
            pullBtn.disabled = true;
            pullBtn.innerText = "🔄 מושך נתונים...";
            triggerManualCalendarPull().finally(() => {
                pullBtn.disabled = false;
                pullBtn.innerText = "🔄 משוך מיומנים עכשיו";
            });
        };
    }
}

// =======================================================
// Daily Timetable & CheeseFork Auto-Sync System
// =======================================================
const CHEESEFORK_SEMESTER_SCHEDULE = {
    semester: "202601",
    name: "סמסטר חורף 2026/2027",
    freeDays: [0, 5, 6], // Sun, Fri, Sat
    dayNames: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    days: [
        {
            dayIndex: 0,
            name: "ראשון",
            fullName: "יום ראשון",
            isFree: true,
            classes: []
        },
        {
            dayIndex: 1,
            name: "שני",
            fullName: "יום שני",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה (קבוצה 10)",
                    lecturer: "ד\"ר גדעון אלון",
                    room: "כיתת טכניון",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ",
                    type: "הרצאה (קבוצה 10)",
                    lecturer: "פרופ' יוסף גבלי",
                    room: "הנדסת מכונות",
                    startTime: "10:30",
                    endTime: "14:30",
                    duration: "4 שעות",
                    cardClass: "timetable-card-solids"
                },
                {
                    courseId: "034056",
                    courseName: "מבוא לחישוב מדעי והנדסי",
                    type: "תרגול (קבוצה 14)",
                    lecturer: "",
                    room: "חוות מחשבים",
                    startTime: "14:30",
                    endTime: "16:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-computing"
                }
            ]
        },
        {
            dayIndex: 2,
            name: "שלישי",
            fullName: "יום שלישי",
            isFree: false,
            classes: [
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "הרצאה (קבוצה 10)",
                    lecturer: "פרופ' לאוניד טרטקובסקי",
                    room: "אולם הרצאות",
                    startTime: "08:30",
                    endTime: "11:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-thermo"
                },
                {
                    courseId: "034035",
                    courseName: "תרמודינמיקה 1",
                    type: "תרגול (קבוצה 11)",
                    lecturer: "",
                    room: "כיתת תרגול",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-thermo"
                }
            ]
        },
        {
            dayIndex: 3,
            name: "רביעי",
            fullName: "יום רביעי",
            isFree: false,
            classes: [
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "הרצאה (קבוצה 10)",
                    lecturer: "ד\"ר גדעון אלון",
                    room: "אולם פיסיקה",
                    startTime: "08:30",
                    endTime: "09:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "114052",
                    courseName: "פיסיקה 2",
                    type: "תרגול (קבוצה 13)",
                    lecturer: "",
                    room: "כיתת תרגול",
                    startTime: "09:30",
                    endTime: "10:30",
                    duration: "שעה",
                    cardClass: "timetable-card-physics"
                },
                {
                    courseId: "104228",
                    courseName: "משוואות דיפרנציאליות חלקיות מ'",
                    type: "תרגול (קבוצה 21)",
                    lecturer: "",
                    room: "כיתת תרגול",
                    startTime: "10:30",
                    endTime: "12:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-pde"
                },
                {
                    courseId: "034056",
                    courseName: "מבוא לחישוב מדעי והנדסי",
                    type: "הרצאה (קבוצה 10)",
                    lecturer: "ד\"ר דניאל הקסנר",
                    room: "אודיטוריום",
                    startTime: "14:30",
                    endTime: "17:30",
                    duration: "3 שעות",
                    cardClass: "timetable-card-computing"
                }
            ]
        },
        {
            dayIndex: 4,
            name: "חמישי",
            fullName: "יום חמישי",
            isFree: false,
            classes: [
                {
                    courseId: "03940805",
                    courseName: "חינוך גופני - יוגה",
                    type: "יוגה (קבוצה 24)",
                    lecturer: "",
                    room: "אולם ספורט",
                    startTime: "07:30",
                    endTime: "09:00",
                    duration: "שעה וחצי",
                    cardClass: "timetable-card-yoga"
                },
                {
                    courseId: "104228",
                    courseName: "משוואות דיפרנציאליות חלקיות מ'",
                    type: "הרצאה (קבוצה 20)",
                    lecturer: "",
                    room: "אולם מתמטיקה",
                    startTime: "10:30",
                    endTime: "12:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-pde"
                },
                {
                    courseId: "034053",
                    courseName: "מכניקת מוצקים 2מ",
                    type: "תרגול (קבוצה 21)",
                    lecturer: "",
                    room: "כיתת תרגול",
                    startTime: "12:30",
                    endTime: "14:30",
                    duration: "שעתיים",
                    cardClass: "timetable-card-solids"
                }
            ]
        }
    ]
};

let currentMobileDayFilter = 'today';

function getLiveClassStatus(startTime, endTime) {
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();
    
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    
    if (curMin >= sMin && curMin < eMin) {
        return { code: 'live', text: '🟢 מתקיים כעת' };
    } else if (curMin < sMin) {
        const diff = sMin - curMin;
        if (diff <= 90) {
            return { code: 'next', text: `⏳ בעוד ${diff} דקות` };
        }
        return { code: 'upcoming', text: `היום ב-${startTime}` };
    } else {
        return { code: 'done', text: '✔️ הסתיים' };
    }
}

function renderTodayTimetableBanner() {
    const banner = document.getElementById('timetable-today-banner');
    if (!banner) return;
    
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const dayName = hebrewDays[dayOfWeek] || "היום";
    const dateFormatted = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const dayConfig = CHEESEFORK_SEMESTER_SCHEDULE.days.find(d => d.dayIndex === dayOfWeek);
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    const isFree = isWeekend || (dayConfig && dayConfig.isFree) || (!dayConfig);
    const classes = (dayConfig && dayConfig.classes) ? dayConfig.classes : [];

    let headerHtml = `
        <div class="today-banner-header">
            <div class="today-banner-title">
                <span>📅</span>
                <span>הלו״ז שלך להיום - יום ${dayName} (${dateFormatted})</span>
            </div>
            <div class="today-banner-badge ${isFree ? 'free' : ''}">
                ${isFree ? '✨ יום חופשי מלימודים' : `📚 ${classes.length} שיעורים היום`}
            </div>
        </div>
    `;

    let bodyHtml = '';
    if (isFree) {
        let msg = `יום חופשי מלימודים פרונטליים! זמן מומלץ לחזרה, שיעורי בית, פרויקטים ומנוחה.`;
        if (dayOfWeek === 0) {
            msg = `יום ראשון חופשי מלימודים פרונטליים! הזדמנות מעולה לסגור מטלות שבועיות, עבודות בית ו-WebWork.`;
        } else if (dayOfWeek === 5) {
            msg = `יום שישי חופשי! סוף שבוע נעים, מנוחה והכנה לשבוע הבא.`;
        } else if (dayOfWeek === 6) {
            msg = `שבת שלום ומנוחה לקראת השבוע האקדמי החדש.`;
        }

        bodyHtml = `
            <div class="today-free-day-msg">
                <span class="emoji">🏖️</span>
                <div>
                    <div style="font-weight: 700; color: #f1f5f9; font-size: 0.92rem;">${msg}</div>
                    <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 3px;">
                        מערכת השעות מתעדכנת אוטומטית בכל יום לפי הלו״ז האקדמי שלך.
                    </div>
                </div>
            </div>
        `;
    } else {
        bodyHtml = '<div class="today-classes-list">';
        classes.forEach(c => {
            const status = getLiveClassStatus(c.startTime, c.endTime);
            let itemClass = 'today-class-item';
            if (status.code === 'live') itemClass += ' current-live';
            else if (status.code === 'next') itemClass += ' next-upcoming';

            bodyHtml += `
                <div class="${itemClass}" onclick="openCourseDetails('${c.courseId}')">
                    <div class="today-class-top">
                        <span class="today-class-time">⏰ ${c.startTime} - ${c.endTime} (${c.duration})</span>
                        <span class="today-class-status ${status.code}">${status.text}</span>
                    </div>
                    <div class="today-class-name">${c.courseName} (${c.courseId})</div>
                    <div class="today-class-sub">
                        <span>${c.type}</span>
                        ${c.lecturer ? `<span>${c.lecturer}</span>` : ''}
                    </div>
                </div>
            `;
        });
        bodyHtml += '</div>';
    }

    banner.innerHTML = headerHtml + bodyHtml;
}

function updateDailyTimetableFocus() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dateFormatted = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
    
    // 1. Render Today's dynamic live banner
    renderTodayTimetableBanner();

    // 2. Mark .is-today column
    document.querySelectorAll('.timetable-day-col').forEach(col => {
        const colDay = parseInt(col.getAttribute('data-day-col'), 10);
        const isToday = (colDay === dayOfWeek);
        col.classList.toggle('is-today', isToday);

        // Manage ⭐ היום header indicator badge
        const header = col.querySelector('.timetable-day-header');
        if (header) {
            let badge = header.querySelector('.today-star-indicator');
            if (isToday) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'today-star-indicator';
                    badge.innerHTML = '⭐ היום';
                    header.insertBefore(badge, header.firstChild);
                }
            } else {
                if (badge) badge.remove();
            }
        }
    });

    // 3. Update sync bar text
    const syncText = document.getElementById('timetable-sync-text');
    if (syncText) {
        syncText.innerText = `מתעדכן אוטומטית כל יום מ-CheeseFork | עודכן להיום (${dateFormatted})`;
    }

    // 4. Update mobile filter attribute on grid
    applyTimetableMobileFilter(currentMobileDayFilter);
}

function applyTimetableMobileFilter(filter) {
    currentMobileDayFilter = filter;
    const grid = document.getElementById('timetable-grid-container');
    if (!grid) return;

    const now = new Date();
    const dayOfWeek = now.getDay();

    if (filter === 'today') {
        // If Sunday-Thursday, filter to that day. If Fri/Sat, show Sunday or all.
        if (dayOfWeek >= 0 && dayOfWeek <= 4) {
            grid.setAttribute('data-mobile-filter', String(dayOfWeek));
        } else {
            grid.setAttribute('data-mobile-filter', '0'); // show Sunday
        }
    } else {
        grid.setAttribute('data-mobile-filter', filter);
    }

    // Update active state on day pills
    document.querySelectorAll('.day-tab-pill').forEach(pill => {
        const pDay = pill.getAttribute('data-day');
        pill.classList.toggle('active', pDay === filter);
    });
}

function setupDailyTimetable() {
    // 1. Initial focus and render
    updateDailyTimetableFocus();

    // 2. Mobile Day Selector listeners
    document.querySelectorAll('.day-tab-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const day = pill.getAttribute('data-day');
            applyTimetableMobileFilter(day);
        });
    });

    // 3. Manual Sync Button
    const syncBtn = document.getElementById('btn-sync-cheesefork-now');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            syncBtn.disabled = true;
            const btnText = document.getElementById('btn-sync-text');
            if (btnText) btnText.innerText = 'מסנכרן...';

            setTimeout(() => {
                const now = new Date();
                const dateStr = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
                const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
                localStorage.setItem('ast_cheesefork_last_daily_sync', `${dateStr} ${timeStr}`);
                
                updateDailyTimetableFocus();
                
                syncBtn.disabled = false;
                if (btnText) btnText.innerText = 'סנכרן להיום';

                if (typeof showToastNotification === 'function') {
                    showToastNotification(`מערכת השעות סונכרנה ועודכנה להיום (${dateStr})!`, 'success');
                }
            }, 600);
        });
    }

    // 4. Daily minute-ticker to keep "Happening now" / "Next up" strictly accurate
    setInterval(() => {
        const timetableWorkspace = document.getElementById('timetable-workspace');
        if (timetableWorkspace && timetableWorkspace.style.display !== 'none') {
            renderTodayTimetableBanner();
        }
    }, 60000);

    // 5. Check date change once every 5 minutes to trigger midnight roll-over
    let lastCheckedDay = new Date().getDay();
    setInterval(() => {
        const curDay = new Date().getDay();
        if (curDay !== lastCheckedDay) {
            lastCheckedDay = curDay;
            console.log('[Timetable] Date rolled over, updating daily schedule');
            updateDailyTimetableFocus();
        }
    }, 300000);
}

// =======================================================
// Mobile Notifications & Notification Hub System (v1.4.0)
// =======================================================

// 1. Calculates remaining lectures/tutorials scheduled for today
function getRemainingClassesToday() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const curMin = now.getHours() * 60 + now.getMinutes();
    
    const dayConfig = (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' && CHEESEFORK_SEMESTER_SCHEDULE.days)
        ? CHEESEFORK_SEMESTER_SCHEDULE.days.find(d => d.dayIndex === dayOfWeek)
        : null;
        
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);
    const isFree = isWeekend || (dayConfig && dayConfig.isFree) || (!dayConfig);
    const allClasses = (dayConfig && dayConfig.classes) ? dayConfig.classes : [];

    if (isFree || allClasses.length === 0) {
        return {
            count: 0,
            classes: [],
            nextClass: null,
            isFree: true,
            totalToday: 0
        };
    }

    // Filter classes whose endTime is strictly in the future or currently running
    const remaining = allClasses.filter(c => {
        if (!c.endTime) return true;
        const parts = c.endTime.split(':');
        const endMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        return endMin > curMin;
    });

    const nextClass = remaining.length > 0 ? remaining[0] : null;

    return {
        count: remaining.length,
        classes: remaining,
        nextClass,
        isFree: false,
        totalToday: allClasses.length
    };
}

// 2. Calculates upcoming prioritized tasks from active courses
function getUpcomingPriorityTasks(limit = 8) {
    if (!gameState || !gameState.courses) {
        return { totalDueSoon: 0, totalOpen: 0, tasks: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allTasks = [];

    Object.values(gameState.courses).forEach(course => {
        if (course.status === 'locked') return;

        (course.tasks || []).forEach(task => {
            const isDone = task.completed || task.status === 'done' || task.status === 'submitted';
            if (isDone) return;

            let diffDays = 999;
            let timingText = 'ללא תאריך יעד';
            let timingCode = 'none';
            let urgencyRank = 5;

            if (task.dueDate) {
                const due = new Date(task.dueDate);
                due.setHours(0, 0, 0, 0);
                diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    urgencyRank = 1;
                    timingCode = 'overdue';
                    timingText = `באיחור של ${Math.abs(diffDays)} ימים`;
                } else if (diffDays === 0) {
                    urgencyRank = 2;
                    timingCode = 'today';
                    timingText = 'להגשה היום!';
                } else if (diffDays === 1) {
                    urgencyRank = 3;
                    timingCode = 'today';
                    timingText = 'להגשה מחר!';
                } else if (diffDays <= 7) {
                    urgencyRank = 4;
                    timingCode = 'upcoming';
                    timingText = `בעוד ${diffDays} ימים`;
                } else {
                    urgencyRank = 5;
                    timingCode = 'upcoming';
                    timingText = `בעוד ${diffDays} ימים`;
                }
            }

            const courseShortName = (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[course.code])
                ? COURSE_SHORT_NAMES[course.code]
                : course.name;

            allTasks.push({
                id: task.id,
                courseCode: course.code,
                courseName: course.name,
                courseShortName,
                title: task.title,
                type: task.type,
                xp: task.xp || 50,
                dueDate: task.dueDate,
                diffDays,
                urgencyRank,
                timingCode,
                timingText
            });
        });
    });

    // Sort: urgencyRank asc, then diffDays asc, then XP desc
    allTasks.sort((a, b) => {
        if (a.urgencyRank !== b.urgencyRank) return a.urgencyRank - b.urgencyRank;
        if (a.diffDays !== b.diffDays) return a.diffDays - b.diffDays;
        return (b.xp || 0) - (a.xp || 0);
    });

    const urgentCount = allTasks.filter(t => t.diffDays <= 7).length;

    return {
        totalDueSoon: urgentCount,
        totalOpen: allTasks.length,
        tasks: allTasks.slice(0, limit)
    };
}

// 3. Update the Bell Badge counter
function updateNotificationBadge() {
    const badge = document.getElementById('bell-badge-count');
    if (!badge) return;

    const remainingLectures = getRemainingClassesToday();
    const priorityTasks = getUpcomingPriorityTasks();

    const totalUrgent = remainingLectures.count + priorityTasks.totalDueSoon;

    if (totalUrgent > 0) {
        badge.innerText = totalUrgent > 99 ? '99+' : String(totalUrgent);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// 4. Toggle Expand / Collapse for individual cards
function toggleNotificationCard(cardType) {
    const card = document.getElementById(`notif-card-${cardType}`);
    const body = document.getElementById(`notif-body-${cardType}`);
    const header = document.getElementById(`notif-header-${cardType}`);
    if (!card || !body) return;

    const isExpanded = card.classList.toggle('is-expanded');
    body.style.display = isExpanded ? 'block' : 'none';
    if (header) {
        header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }
}

// 5. Render dynamic contents into In-App Notification Hub
function renderInAppNotificationHub() {
    updateNotificationBadge();

    const remainingLectures = getRemainingClassesToday();
    const priorityTasks = getUpcomingPriorityTasks();

    // -------------------------------------------------------------
    // Card 1: Today's Remaining Lectures / Tutorials
    // -------------------------------------------------------------
    const summaryLectures = document.getElementById('notif-summary-lectures');
    const countLectures = document.getElementById('notif-count-lectures');
    const listLectures = document.getElementById('notif-list-lectures');

    if (countLectures) {
        countLectures.innerText = String(remainingLectures.count);
    }

    if (remainingLectures.isFree || remainingLectures.totalToday === 0) {
        if (summaryLectures) {
            summaryLectures.innerText = 'יום חופשי מלימודים פרונטליים! 🏖️';
        }
        if (listLectures) {
            listLectures.innerHTML = `
                <div class="notif-card-empty-msg">
                    🏖️ אין שיעורים מתוכננים להיום. זמן מצוין לעבודה על משימות, חזרה על החומר ומנוחה.
                </div>
            `;
        }
    } else if (remainingLectures.count === 0) {
        if (summaryLectures) {
            summaryLectures.innerText = `כל ${remainingLectures.totalToday} השיעורים להיום הסתיימו ✔️`;
        }
        if (listLectures) {
            listLectures.innerHTML = `
                <div class="notif-card-empty-msg">
                    🎉 סיימת את כל השיעורים להיום! כל הכבוד.
                </div>
            `;
        }
    } else {
        const next = remainingLectures.nextClass;
        if (summaryLectures && next) {
            summaryLectures.innerText = `שיעור קרוב: ${next.type} ב-${next.startTime} • ${next.courseName}`;
        }

        if (listLectures) {
            let html = '';
            remainingLectures.classes.forEach(c => {
                const status = (typeof getLiveClassStatus === 'function')
                    ? getLiveClassStatus(c.startTime, c.endTime)
                    : { code: 'upcoming', text: `⏰ ${c.startTime}` };

                const isLive = status.code === 'live';

                html += `
                    <div class="notif-lecture-item ${isLive ? 'is-live' : ''}" onclick="if (typeof setActiveMainTab === 'function') setActiveMainTab('timetable'); closeNotificationDrawer();">
                        <div class="notif-lecture-item-top">
                            <span class="notif-lecture-item-time">${c.startTime} - ${c.endTime}</span>
                            <span class="notif-lecture-item-status ${status.code}">${status.text}</span>
                        </div>
                        <div class="notif-lecture-item-title">${c.courseName} (${c.courseId})</div>
                        <div class="notif-lecture-item-sub">
                            <span>${c.type}</span>
                            ${c.room ? `<span>📍 ${c.room}</span>` : ''}
                            ${c.lecturer ? `<span>👨‍🏫 ${c.lecturer}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            listLectures.innerHTML = html;
        }
    }

    // -------------------------------------------------------------
    // Card 2: Upcoming Priority Tasks
    // -------------------------------------------------------------
    const summaryTasks = document.getElementById('notif-summary-tasks');
    const countTasks = document.getElementById('notif-count-tasks');
    const listTasks = document.getElementById('notif-list-tasks');

    if (countTasks) {
        countTasks.innerText = String(priorityTasks.tasks.length);
    }

    if (priorityTasks.tasks.length === 0) {
        if (summaryTasks) {
            summaryTasks.innerText = 'אין משימות פתוחות להגשה! כל הכבוד 🎉';
        }
        if (listTasks) {
            listTasks.innerHTML = `
                <div class="notif-card-empty-msg">
                    ✨ אין משימות ממתינות. כל המשימות שלך מעודכנות והושלמו!
                </div>
            `;
        }
    } else {
        const topTask = priorityTasks.tasks[0];
        if (summaryTasks) {
            summaryTasks.innerText = `[${topTask.courseShortName}] ${topTask.title} (${topTask.timingText})`;
        }

        if (listTasks) {
            let html = '';
            priorityTasks.tasks.forEach(task => {
                const isOverdue = task.diffDays < 0;
                html += `
                    <div class="notif-task-item ${isOverdue ? 'is-overdue' : ''}">
                        <input type="checkbox" class="notif-task-checkbox" data-course-code="${task.courseCode}" data-task-id="${task.id}" title="סמן כהושלם">
                        <div class="notif-task-info" onclick="if (typeof openCourseDetails === 'function') openCourseDetails('${task.courseCode}'); closeNotificationDrawer();">
                            <div class="notif-task-title">${task.title}</div>
                            <div class="notif-task-sub">
                                <span class="notif-task-course-tag">[${task.courseShortName}]</span>
                                <span class="notif-task-timing-badge ${task.timingCode}">${task.timingText}</span>
                                <span style="color: #94a3b8; font-size: 0.68rem;">+${task.xp} XP</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            listTasks.innerHTML = html;

            // Bind checkbox listeners
            listTasks.querySelectorAll('.notif-task-checkbox').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const courseCode = chk.getAttribute('data-course-code');
                    const taskId = chk.getAttribute('data-task-id');
                    completeTaskFromNotification(courseCode, taskId);
                });
            });
        }
    }
}

// 6. Complete a task directly from notification hub
function completeTaskFromNotification(courseCode, taskId) {
    if (!gameState || !gameState.courses || !gameState.courses[courseCode]) return;
    const course = gameState.courses[courseCode];
    const task = (course.tasks || []).find(t => t.id === taskId);
    if (!task) return;

    task.completed = true;
    task.status = 'done';
    const xpGained = task.xp || 50;

    if (typeof addXp === 'function') {
        addXp(xpGained);
    }

    if (typeof showToastNotification === 'function') {
        showToastNotification(`משימה הושלמה! +${xpGained} XP עבור [${course.name}]`, 'success');
    }

    notifyStateChanged();
    renderInAppNotificationHub();
}

// 7. Open and close Drawer helpers
function openNotificationDrawer() {
    const overlay = document.getElementById('notif-drawer-overlay');
    if (!overlay) return;
    renderInAppNotificationHub();
    overlay.style.display = 'flex';
}

function closeNotificationDrawer() {
    const overlay = document.getElementById('notif-drawer-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Helper: Show native notification via Service Worker (with fallback)
async function showNativeNotification(title, options) {
    if (!('Notification' in window)) return false;
    
    let permission = Notification.permission;
    if (permission !== 'granted') {
        permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return false;

    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
                await reg.showNotification(title, options);
                return true;
            }
        } catch (err) {
            console.warn('[Notifications] ServiceWorker showNotification fallback:', err);
        }
    }

    try {
        new Notification(title, options);
        return true;
    } catch (e) {
        console.warn('[Notifications] Fallback failed:', e);
        return false;
    }
}

// 8. Trigger high-priority 10-Minute Lecture / Tutorial Reminder
async function trigger10MinClassAlert(classItem, isTest = false) {
    if (!classItem) return;

    const courseName = classItem.courseName || 'שיעור אקדמי';
    const type = classItem.type || 'הרצאה / תרגול';
    const startTime = classItem.startTime || '';
    const endTime = classItem.endTime || '';
    const room = classItem.room ? `📍 כיתה: ${classItem.room}` : '📍 מיקום: כיתת טכניון';
    const lecturer = classItem.lecturer ? `👨‍🏫 מרצה: ${classItem.lecturer}` : '';

    const title = isTest 
        ? `⏰ [בדיקה] בעוד 10 דק׳: ${courseName}`
        : `⏰ בעוד 10 דק׳: ${courseName} (${classItem.type.split(' ')[0]})`;

    const bodyLines = [
        `📚 ${type}`,
        `⏰ שעות: ${startTime} - ${endTime} (${classItem.duration || 'שיעור'})`,
        room
    ];
    if (lecturer) bodyLines.push(lecturer);

    // Check if there are remaining classes today after this one
    const remaining = getRemainingClassesToday();
    const afterThis = remaining.classes.filter(c => c.startTime > startTime);
    if (afterThis.length > 0) {
        bodyLines.push('────────────────────');
        bodyLines.push(`בהמשך היום: עוד ${afterThis.length} שיעורים (הבא ב-${afterThis[0].startTime})`);
    }

    const body = bodyLines.join('\n');
    const tag = `ast-reminder-${classItem.courseId || 'c'}-${(startTime || '0000').replace(':', '')}`;

    const sent = await showNativeNotification(title, {
        body,
        icon: 'icon.png',
        badge: 'icon.png',
        tag,
        renotify: true,
        vibrate: [250, 100, 250, 100, 250],
        data: { tab: 'timetable' },
        actions: [
            { action: 'open-timetable', title: '📍 פתח מערכת שעות' }
        ]
    });

    if (sent && isTest && typeof showToastNotification === 'function') {
        showToastNotification(`התראת 10 דקות עבור [${courseName}] נשלחה בהצלחה!`, 'success');
    }

    return sent;
}

// 9. Automated 10-Minute Class Reminder Engine (Runs continuously)
function checkAndTrigger10MinReminders() {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        return;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const curHours = now.getHours();
    const curMinutes = now.getMinutes();
    const curMin = curHours * 60 + curMinutes;
    const todayDateStr = now.toISOString().split('T')[0];

    const dayConfig = (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' && CHEESEFORK_SEMESTER_SCHEDULE.days)
        ? CHEESEFORK_SEMESTER_SCHEDULE.days.find(d => d.dayIndex === dayOfWeek)
        : null;

    if (!dayConfig || dayConfig.isFree || !dayConfig.classes || dayConfig.classes.length === 0) {
        return;
    }

    dayConfig.classes.forEach(c => {
        if (!c.startTime) return;
        const parts = c.startTime.split(':');
        const startMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        const diffMinutes = startMin - curMin;

        // Target: 8 to 11 minutes prior to class start
        if (diffMinutes >= 8 && diffMinutes <= 11) {
            const reminderKey = `ast_reminded_10m_${todayDateStr}_${c.courseId}_${c.startTime}`;
            if (!localStorage.getItem(reminderKey)) {
                console.log(`[Notifications] Triggering automated 10-min reminder for ${c.courseName} at ${c.startTime}`);
                localStorage.setItem(reminderKey, new Date().toISOString());
                trigger10MinClassAlert(c, false);
            }
        }
    });
}

// 10. Schedule exact timeouts for today's classes when app is loaded
function scheduleTodayClassTimeouts() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const nowMs = now.getTime();
    const todayDateStr = now.toISOString().split('T')[0];

    const dayConfig = (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' && CHEESEFORK_SEMESTER_SCHEDULE.days)
        ? CHEESEFORK_SEMESTER_SCHEDULE.days.find(d => d.dayIndex === dayOfWeek)
        : null;

    if (!dayConfig || dayConfig.isFree || !dayConfig.classes) return;

    dayConfig.classes.forEach(c => {
        if (!c.startTime) return;
        const parts = c.startTime.split(':');
        const classDate = new Date();
        classDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);

        const reminderTimeMs = classDate.getTime() - (10 * 60 * 1000);
        const delayMs = reminderTimeMs - nowMs;

        const reminderKey = `ast_reminded_10m_${todayDateStr}_${c.courseId}_${c.startTime}`;
        if (delayMs > 0 && delayMs < 14 * 60 * 60 * 1000 && !localStorage.getItem(reminderKey)) {
            setTimeout(() => {
                if (!localStorage.getItem(reminderKey)) {
                    localStorage.setItem(reminderKey, new Date().toISOString());
                    trigger10MinClassAlert(c, false);
                }
            }, delayMs);
        }
    });
}

// 11. Dispatch Native Mobile System Notifications (Dual Summary Notifications with clear dividers)
async function dispatchNativeMobileNotifications() {
    if (!('Notification' in window)) {
        if (typeof showToastNotification === 'function') {
            showToastNotification('הדפדפן אינו תומך בהתראות Push', 'warning');
        }
        return;
    }

    let permission = Notification.permission;
    if (permission !== 'granted') {
        permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
        if (typeof showToastNotification === 'function') {
            showToastNotification('יש לאשר הרשאות התראה כדי לקבל עדכונים בנייד', 'warning');
        }
        return;
    }

    const remainingLectures = getRemainingClassesToday();
    const priorityTasks = getUpcomingPriorityTasks();

    // -------------------------------------------------------------
    // Notification 1: Today's Remaining Lectures / Tutorials
    // -------------------------------------------------------------
    let lectureTitle = '';
    let lectureBody = '';

    if (remainingLectures.isFree || remainingLectures.totalToday === 0) {
        lectureTitle = '🎓 מערכת שעות: יום חופשי מלימודים';
        lectureBody = '🏖️ אין שיעורים מתוכננים להיום. יום נעים, פורה ומנוחה טובה!';
    } else if (remainingLectures.count === 0) {
        lectureTitle = '🎓 מערכת שעות: השיעורים הסתיימו';
        lectureBody = `✔️ כל ${remainingLectures.totalToday} השיעורים להיום הושלמו בהצלחה!`;
    } else {
        lectureTitle = `🎓 לו״ז היום (${remainingLectures.count} שיעורים נותרו)`;

        const classBlocks = remainingLectures.classes.map((c, idx) => {
            const isNext = (idx === 0);
            const header = isNext 
                ? `⭐ הבא: ${c.startTime} | ${c.courseName}`
                : `🕒 ${c.startTime} - ${c.endTime} | ${c.courseName}`;
            const details = `   📍 ${c.room || 'טכניון'} • ${c.type}${c.lecturer ? ' (' + c.lecturer + ')' : ''}`;
            return `${header}\n${details}`;
        });

        lectureBody = classBlocks.join('\n\n────────────────────\n\n');
    }

    // -------------------------------------------------------------
    // Notification 2: Upcoming Priority Tasks
    // -------------------------------------------------------------
    let taskTitle = '';
    let taskBody = '';

    if (priorityTasks.tasks.length === 0) {
        taskTitle = '📋 משימות אקדמיות: הכל הושלם!';
        taskBody = '✨ אין משימות ממתינות להגשה. כל הכבוד!';
    } else {
        taskTitle = `📋 משימות דחופות (${priorityTasks.tasks.length} פתוחות)`;

        const taskBlocks = priorityTasks.tasks.slice(0, 5).map(t => {
            const icon = t.diffDays < 0 ? '🚨' : (t.diffDays <= 1 ? '🔥' : '⚡');
            const line1 = `${icon} [${t.courseShortName}] ${t.title}`;
            const line2 = `   ⏳ ${t.timingText} • +${t.xp} XP`;
            return `${line1}\n${line2}`;
        });

        if (priorityTasks.tasks.length > 5) {
            taskBlocks.push(`...ועוד ${priorityTasks.tasks.length - 5} משימות בלוח המשימות`);
        }

        taskBody = taskBlocks.join('\n\n────────────────────\n\n');
    }

    // Dispatch Notification 1: Lectures
    await showNativeNotification(lectureTitle, {
        body: lectureBody,
        icon: 'icon.png',
        badge: 'icon.png',
        tag: 'ast-today-lectures',
        renotify: true,
        data: { tab: 'timetable' },
        actions: [
            { action: 'open-timetable', title: '📅 פתח מערכת שעות' }
        ]
    });

    // Small delay to ensure separate notifications on Android/iOS shade
    setTimeout(async () => {
        // Dispatch Notification 2: Tasks
        await showNativeNotification(taskTitle, {
            body: taskBody,
            icon: 'icon.png',
            badge: 'icon.png',
            tag: 'ast-upcoming-tasks',
            renotify: true,
            data: { tab: 'tasks' },
            actions: [
                { action: 'open-tasks', title: '📋 פתח משימות' }
            ]
        });

        if (typeof showToastNotification === 'function') {
            showToastNotification('התראות סקירה נשלחו בהצלחה למכשיר הנייד!', 'success');
        }
    }, 350);
}

// 12. Main Setup function for mobile notification hub
function setupMobileNotifications() {
    // A. Bell button
    const bellBtn = document.getElementById('btn-notification-bell');
    if (bellBtn) {
        bellBtn.addEventListener('click', () => {
            openNotificationDrawer();
        });
    }

    // B. Close button & overlay click
    const closeBtn = document.getElementById('btn-close-notif-drawer');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeNotificationDrawer);
    }

    const overlay = document.getElementById('notif-drawer-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeNotificationDrawer();
            }
        });
    }

    // C. Expand/Collapse toggles for cards
    const headerLectures = document.getElementById('notif-header-lectures');
    if (headerLectures) {
        headerLectures.addEventListener('click', () => toggleNotificationCard('lectures'));
    }

    const headerTasks = document.getElementById('notif-header-tasks');
    if (headerTasks) {
        headerTasks.addEventListener('click', () => toggleNotificationCard('tasks'));
    }

    // D. Dispatch native mobile notifications button (Daily Summary)
    const dispatchBtn = document.getElementById('btn-dispatch-native-notifs');
    if (dispatchBtn) {
        dispatchBtn.addEventListener('click', () => {
            dispatchNativeMobileNotifications();
        });
    }

    // D2. Test 10-Minute Alert button
    const test10MinBtn = document.getElementById('btn-test-10min-alert');
    if (test10MinBtn) {
        test10MinBtn.addEventListener('click', async () => {
            const remaining = getRemainingClassesToday();
            let targetClass = remaining.nextClass;
            
            // If free day or no class remaining today, pick Monday's flagship class for testing
            if (!targetClass && typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined') {
                const mon = CHEESEFORK_SEMESTER_SCHEDULE.days.find(d => d.dayIndex === 1);
                if (mon && mon.classes && mon.classes.length > 0) {
                    targetClass = mon.classes[0];
                }
            }
            if (!targetClass) {
                targetClass = {
                    courseName: "פיסיקה 2",
                    courseId: "114052",
                    type: "הרצאה (קבוצה 10)",
                    startTime: "08:30",
                    endTime: "10:30",
                    duration: "שעתיים",
                    room: "כיתת טכניון",
                    lecturer: "ד\"ר גדעון אלון"
                };
            }
            await trigger10MinClassAlert(targetClass, true);
        });
    }

    // E. Navigation buttons inside cards
    const btnGoTimetable = document.getElementById('btn-notif-go-timetable');
    if (btnGoTimetable) {
        btnGoTimetable.addEventListener('click', () => {
            if (typeof setActiveMainTab === 'function') {
                setActiveMainTab('timetable');
            }
            closeNotificationDrawer();
        });
    }

    const btnGoTasks = document.getElementById('btn-notif-go-tasks');
    if (btnGoTasks) {
        btnGoTasks.addEventListener('click', () => {
            if (typeof setActiveMainTab === 'function') {
                setActiveMainTab('tasks');
            }
            closeNotificationDrawer();
        });
    }

    // F. Listen to Service Worker messages (e.g. NAVIGATE_TAB when notification is tapped)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NAVIGATE_TAB') {
                const target = event.data.tab || 'timetable';
                if (typeof setActiveMainTab === 'function') {
                    setActiveMainTab(target);
                }
                closeNotificationDrawer();
            }
        });
    }

    // G. Deep linking from URL query params (e.g. ./?tab=timetable or ./?tab=tasks)
    try {
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get('tab');
        if (requestedTab && ['curriculum', 'tasks', 'calendar', 'timetable', 'settings'].includes(requestedTab)) {
            setTimeout(() => {
                if (typeof setActiveMainTab === 'function') {
                    setActiveMainTab(requestedTab);
                }
            }, 100);
        }
    } catch (e) {}

    // H. Initial badge update
    updateNotificationBadge();

    // I. Automated 10-Minute Reminder Scheduling
    scheduleTodayClassTimeouts();
    checkAndTrigger10MinReminders();

    // Interval: Run automated reminder check every 30 seconds
    setInterval(checkAndTrigger10MinReminders, 30000);

    // Also check immediately when app tab is focused or unlocked
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkAndTrigger10MinReminders();
        }
    });
    window.addEventListener('focus', checkAndTrigger10MinReminders);

    // Periodic badge update every 60 seconds
    setInterval(updateNotificationBadge, 60000);
}



