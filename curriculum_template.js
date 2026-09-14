// Academic Skill Tree - Clean Mechanical Engineering Curriculum Template
// Technion - Israel Institute of Technology | Faculty of Mechanical Engineering

var SAMPLE_ME_DEGREE = (typeof window !== 'undefined' && window.SAMPLE_ME_DEGREE) || {
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

function getCleanCurriculumState(startingSemester = 1, priorCompletedCourses = {}) {
    const courses = JSON.parse(JSON.stringify(SAMPLE_ME_DEGREE));
    const targetSem = Math.max(1, parseInt(startingSemester) || 1);
    let totalCredits = 0;
    let completedCount = 0;
    let totalWeightedPoints = 0;
    let totalGradedCredits = 0;
    
    // Courses up to targetSem are available, later semesters locked
    Object.values(courses).forEach(c => {
        const sem = c.semester || 1;
        const priorInfo = priorCompletedCourses[c.code];
        const isPriorCompleted = priorInfo && (priorInfo.completed === true || priorInfo === true);

        if (isPriorCompleted) {
            c.status = 'mastered';
            c.completed = true;
            totalCredits += (c.credits || 0);
            completedCount++;
            
            const gradeVal = priorInfo && priorInfo.grade !== undefined && priorInfo.grade !== null && priorInfo.grade !== '' ? parseFloat(priorInfo.grade) : null;
            if (gradeVal !== null && !isNaN(gradeVal)) {
                c.grade = gradeVal;
                totalWeightedPoints += (gradeVal * (c.credits || 0));
                totalGradedCredits += (c.credits || 0);
            } else {
                c.grade = null;
            }

            if (c.tasks) {
                c.tasks.forEach(t => {
                    t.completed = true;
                    t.status = 'done';
                    if (t.type === 'exam' && c.grade !== null) {
                        t.grade = c.grade;
                    }
                });
            }
        } else {
            if (sem <= targetSem) {
                c.status = 'available';
            } else {
                c.status = 'locked';
            }
            c.grade = null;
            c.completed = false;
            if (c.tasks) {
                c.tasks.forEach(t => {
                    t.completed = false;
                    t.status = 'todo';
                });
            }
        }
    });

    const initialGpa = totalGradedCredits > 0 ? parseFloat((totalWeightedPoints / totalGradedCredits).toFixed(2)) : 0;

    return {
        characterClass: 'סטודנט להנדסת מכונות (הטכניון)',
        xp: completedCount * 150,
        level: Math.max(1, Math.floor(completedCount / 3) + 1),
        credits: totalCredits,
        completedCourses: completedCount,
        bossesSlain: completedCount,
        courses: courses,
        gpa: initialGpa,
        openTasks: [],
        pastExamSchedule: [],
        hasLoadedSemesterBExcel: true,
        customCalendarEvents: [],
        hasLoadedGoogleCalendarAugust: false,
        pastExamsBank: {},
        semesterGuardMode: 'locked',
        currentActiveSemester: targetSem,
        isFinalsMode: false
    };
}

if (typeof window !== 'undefined') {
    window.SAMPLE_ME_DEGREE = SAMPLE_ME_DEGREE;
    window.getCleanCurriculumState = getCleanCurriculumState;
}
if (typeof module !== 'undefined') {
    module.exports = { SAMPLE_ME_DEGREE, getCleanCurriculumState };
}
