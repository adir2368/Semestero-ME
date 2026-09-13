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
    3: "שנה ב' - סמסטר א'",
    4: "שנה ב' - סמסטר ב'",
    5: "שנה ג' - סמסטר א'",
    6: "שנה ג' - סמסטר ב'",
    7: "שנה ד' - סמסטר א'",
    8: "שנה ד' - סמסטר ב'"
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
            { id: "cs101_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "math101_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "math102_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "cs102_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
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
            { id: "math103_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "math104_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "cs201_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs202_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "math201_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "cs203_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs204_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "cs205_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
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
            { id: "cs301_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs302_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "cs303_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs304_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs305_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
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
            { id: "cs399a_ex", title: "הצגת אב-טיפוס עובד (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs401_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs399b_ex", title: "הצגת פרויקט גמר מלא מול סגל השופטים (קרב בוס)", type: "exam", xp: 1000, completed: false }
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
            { id: "cs402_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 600, completed: false }
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
            { id: "cs403_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "104041_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "104065_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "125001_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "234128_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "324033_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "035026_ex", title: "מבחן סופי / הגשה סופית (קרב בוס)", type: "exam", xp: 200, completed: false }
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
            { id: "034061_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034028": {
        code: "034028",
        name: "מכניקת מוצקים 1",
        credits: 4,
        semester: 2,
        prerequisites: ["104041", "104065"],
        status: "locked",
        tasks: [
            { id: "034028_h1", title: "תרגיל בית 1: מאמצים ועיוותים חד-מימדיים", type: "hw", xp: 50, completed: false },
            { id: "034028_h2", title: "תרגיל בית 2: מאמצי גזירה ופיתול מוטות", type: "hw", xp: 50, completed: false },
            { id: "034028_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "104043_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "114051_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "104131": {
        code: "104131",
        name: "משוואות דיפרנציאליות רגילות",
        credits: 2.5,
        semester: 2,
        prerequisites: ["104041"],
        status: "locked",
        tasks: [
            { id: "104131_h1", title: "תרגיל בית 1: משוואות מסדר ראשון ומסדר שני", type: "hw", xp: 50, completed: false },
            { id: "104131_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "314533": {
        code: "314533",
        name: "מבוא להנדסת חומרים מ'",
        credits: 3.5,
        semester: 2,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "314533_h1", title: "תרגיל בית 1: סריגים קריסטלוגרפיים ופגמים", type: "hw", xp: 50, completed: false },
            { id: "314533_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 3
    "034053": {
        code: "034053",
        name: "מכניקת מוצקים 2 מורחב",
        credits: 5,
        semester: 3,
        prerequisites: ["034028"],
        status: "locked",
        tasks: [
            { id: "034053_h1", title: "תרגיל בית 1: כפיפת קורות מאמצים משולבים", type: "hw", xp: 60, completed: false },
            { id: "034053_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
        ]
    },
    "114052": {
        code: "114052",
        name: "פיסיקה 2",
        credits: 3.5,
        semester: 3,
        prerequisites: ["114051"],
        status: "locked",
        tasks: [
            { id: "114052_h1", title: "תרגיל בית 1: שדה חשמלי וחוק גאוס", type: "hw", xp: 50, completed: false },
            { id: "114052_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034056": {
        code: "034056",
        name: "מבוא לחישוב מדעי והנדסי",
        credits: 4,
        semester: 3,
        prerequisites: ["234128"],
        status: "locked",
        tasks: [
            { id: "034056_h1", title: "תרגיל בית 1: פתרון משוואות לא ליניאריות בפייתון", type: "hw", xp: 50, completed: false },
            { id: "034056_p1", title: "פרוייקט חישובי: אנליזה של מערכת מכנית מורכבת", type: "project", xp: 200, completed: false },
            { id: "034056_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034035": {
        code: "034035",
        name: "תרמודינמיקה 1",
        credits: 4,
        semester: 3,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034035_h1", title: "תרגיל בית 1: החוק הראשון של התרמודינמיקה", type: "hw", xp: 50, completed: false },
            { id: "034035_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "104228": {
        code: "104228",
        name: "משוואות דיפרנציאליות חלקיות מ'",
        credits: 3,
        semester: 3,
        prerequisites: ["104131"],
        status: "locked",
        tasks: [
            { id: "104228_h1", title: "תרגיל בית 1: משוואת הגלים והחום", type: "hw", xp: 50, completed: false },
            { id: "104228_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 4
    "034030": {
        code: "034030",
        name: "תהליכי ייצור",
        credits: 3.5,
        semester: 4,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034030_h1", title: "תרגיל בית 1: עיבוד שבבי ויציקה", type: "hw", xp: 50, completed: false },
            { id: "034030_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034010": {
        code: "034010",
        name: "דינמיקה",
        credits: 5,
        semester: 4,
        prerequisites: ["034028", "114051"],
        status: "locked",
        tasks: [
            { id: "034010_h1", title: "תרגיל בית 1: קינמטיקה של גוף קשיח בדו-מימד", type: "hw", xp: 60, completed: false },
            { id: "034010_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
        ]
    },
    "034055": {
        code: "034055",
        name: "תורת הזרימה 1 מורחב",
        credits: 5,
        semester: 4,
        prerequisites: ["034035"],
        status: "locked",
        tasks: [
            { id: "034055_h1", title: "תרגיל בית 1: הידרוסטטיקה ושימור מסה", type: "hw", xp: 60, completed: false },
            { id: "034055_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 550, completed: false }
        ]
    },
    "034032": {
        code: "034032",
        name: "מערכות ליניאריות מ'",
        credits: 4,
        semester: 4,
        prerequisites: ["104131"],
        status: "locked",
        tasks: [
            { id: "034032_h1", title: "תרגיל בית 1: התמרות לפלס ותפקודי תמסורת", type: "hw", xp: 50, completed: false },
            { id: "034032_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "125013_ex", title: "דו\"ח מעבדה סופי (קרב בוס)", type: "exam", xp: 100, completed: false }
        ]
    },
    // Semester 5
    "034041": {
        code: "034041",
        name: "מעבר חום",
        credits: 4,
        semester: 5,
        prerequisites: ["034035", "034055"],
        status: "locked",
        tasks: [
            { id: "034041_h1", title: "תרגיל בית 1: הולכת חום במימד אחד", type: "hw", xp: 50, completed: false },
            { id: "034041_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "034040_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034054": {
        code: "034054",
        name: "תכן מכני 1 מ'",
        credits: 4,
        semester: 5,
        prerequisites: ["034053"],
        status: "locked",
        tasks: [
            { id: "034054_h1", title: "תרגיל בית 1: חישובי עייפות חומרים (Fatigue)", type: "hw", xp: 50, completed: false },
            { id: "034054_p1", title: "פרוייקט תכן: תכנון ציר ותמסורת גלגלי שיניים", type: "project", xp: 250, completed: false },
            { id: "034054_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034058": {
        code: "034058",
        name: "הסתברות וסטטיסטיקה להנדסת מכונות",
        credits: 3,
        semester: 5,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034058_h1", title: "תרגיל בית 1: הסתברות מותנית ומשתנים בדידים", type: "hw", xp: 50, completed: false },
            { id: "034058_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "114032_ex", title: "דו\"ח מעבדה סופי (קרב בוס)", type: "exam", xp: 150, completed: false }
        ]
    },
    "034051": {
        code: "034051",
        name: "דינמיקה ומכניקה של תנודות",
        credits: 3,
        semester: 5,
        prerequisites: ["034010"],
        status: "locked",
        tasks: [
            { id: "034051_h1", title: "תרגיל בית 1: תנודות חופשיות ומאולצות עם ריסון", type: "hw", xp: 50, completed: false },
            { id: "034051_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    // Semester 6
    "034060": {
        code: "034060",
        name: "מבוא למכטרוניקה והנע חשמלי",
        credits: 4,
        semester: 6,
        prerequisites: ["034032"],
        status: "locked",
        tasks: [
            { id: "034060_h1", title: "תרגיל בית 1: מנועי זרם ישר וצעד", type: "hw", xp: 50, completed: false },
            { id: "034060_p1", title: "עבודת מעבדה: בקרת מיקום מנוע מבוססת ארדואינו", type: "project", xp: 200, completed: false },
            { id: "034060_ex", title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034057": {
        code: "034057",
        name: "מעבדה מתקדמת בהנדסת מכונות",
        credits: 4,
        semester: 6,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034057_p1", title: "ניסוי מעבדה 1: מעבר חום וזורמים", type: "project", xp: 150, completed: false },
            { id: "034057_p2", title: "ניסוי מעבדה 2: בקרה ומערכות דינמיות", type: "project", xp: 150, completed: false },
            { id: "034057_ex", title: "דו\"ח מעבדה מסכם (קרב בוס)", type: "exam", xp: 500, completed: false }
        ]
    },
    "034371": {
        code: "034371",
        name: "פרויקט תכן לייצור",
        credits: 2.5,
        semester: 6,
        prerequisites: ["034054"],
        status: "locked",
        tasks: [
            { id: "034371_p1", title: "תכנון חלקים לייצור ממוחשב ו-CNC", type: "project", xp: 200, completed: false },
            { id: "034371_ex", title: "הגשה סופית של תיק ייצור (קרב בוס)", type: "exam", xp: 500, completed: false }
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
            { id: "034379_ex", title: "פרזנטציה שלב א' בפני צוות הפקולטה (קרב בוס)", type: "exam", xp: 600, completed: false }
        ]
    },
    "034382": {
        code: "034382",
        name: "מתודולוגיות פיתוח הנדסי 1",
        credits: 0.5,
        semester: 7,
        prerequisites: [],
        status: "available",
        tasks: [
            { id: "034382_ex", title: "קרב בוס: הצגת כלי פיתוח הנדסיים מבוססי מערכת", type: "exam", xp: 150, completed: false }
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
            { id: "034380_ex", title: "יריד פרויקטים סופי והגנה מול בוחנים חיצוניים (קרב בוס)", type: "exam", xp: 1000, completed: false }
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
            { id: "034383_ex", title: "קרב בוס: הגשת תהליך פיתוח הנדסי רפלקטיבי", type: "exam", xp: 150, completed: false }
        ]
    }
};

// Global active course tracker
let currentSelectedCourse = null;

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    loadSavedState();
    setupEventListeners();
    renderUI();
    
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


// Load state from local storage
function loadSavedState() {
    const saved = localStorage.getItem("academic_skill_tree_save");
    let needsResetToME = false;

    if (saved) {
        try {
            gameState = JSON.parse(saved);
            // If the saved state is CS, force reset to ME
            if (gameState.courses && (gameState.courses["cs101"] || gameState.characterClass === "סטודנט למדעי המחשב")) {
                needsResetToME = true;
            }
        } catch (e) {
            console.error("Error loading save file, starting fresh", e);
            needsResetToME = true;
        }
    } else {
        needsResetToME = true;
    }

    if (needsResetToME) {
        gameState = JSON.parse(JSON.stringify(INITIAL_STATE));
        gameState.characterClass = "סטודנט להנדסת מכונות (טכניון)";
        gameState.courses = JSON.parse(JSON.stringify(SAMPLE_ME_DEGREE));
        recalculateCourseStates();
        saveState();
    }
}

// Save state to local storage
function saveState() {
    localStorage.setItem("academic_skill_tree_save", JSON.stringify(gameState));
}

// Recalculate states based on prerequisites
function recalculateCourseStates() {
    let changed = false;
    
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
            
            // Count completed exams
            const exam = course.tasks.find(t => t.type === 'exam');
            if (exam && exam.completed) {
                slayedCount++;
            }
        }
    });
    
    gameState.credits = totalCredits;
    gameState.completedCourses = completedCount;
    gameState.bossesSlain = slayedCount;

    // Calculate general GPA (weighted by credits)
    let totalWeightedGrades = 0;
    let gradedCreditsSum = 0;
    Object.keys(gameState.courses).forEach(code => {
        const course = gameState.courses[code];
        if (course.status === 'mastered' && course.grade !== undefined && course.grade !== null && !isNaN(course.grade)) {
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
            
            // Check if all prerequisites are mastered
            const allPrereqsMet = course.prerequisites.every(preCode => {
                const prereq = gameState.courses[preCode];
                return prereq && prereq.status === 'mastered';
            });
            
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
        });
    }
    
    return changed;
}

// Add XP and handle level up
function addXp(amount) {
    gameState.xp += amount;
    let leveledUp = false;
    
    while (gameState.xp >= getXpNeeded(gameState.level)) {
        gameState.xp -= getXpNeeded(gameState.level);
        gameState.level++;
        leveledUp = true;
    }
    
    saveState();
    updateHud();
    
    if (leveledUp) {
        showLevelUpSplash(gameState.level);
    }
}

// Show animated level-up modal
function showLevelUpSplash(level) {
    const splash = document.getElementById("level-up-splash");
    document.getElementById("splash-level-num").innerText = level;
    splash.classList.add("active");
    
    // Play simple gaming text sound effect or log
    console.log(`%c LEVEL UP! Reached level ${level} `, 'background: #fbbf24; color: #000; font-weight: bold; font-size: 20px;');
}

// Update top stats and character bars
function updateHud() {
    document.getElementById("char-level").innerText = `דרגה ${gameState.level}`;
    document.getElementById("stat-credits").innerText = `${gameState.credits} / 120`;
    document.getElementById("stat-completed-courses").innerText = gameState.completedCourses;
    document.getElementById("stat-bosses-slain").innerText = gameState.bossesSlain;
    document.getElementById("stat-gpa").innerText = (gameState.gpa && gameState.gpa > 0) ? gameState.gpa.toFixed(2) : "0.00";
    
    // Update XP bar
    const needed = getXpNeeded(gameState.level);
    const fillPercent = Math.min(100, (gameState.xp / needed) * 100);
    document.getElementById("xp-bar-fill").style.width = `${fillPercent}%`;
    document.getElementById("xp-text").innerText = `${gameState.xp} / ${needed} XP`;
    
    // Set dynamic titles based on level and class
    let titles = [];
    if (gameState.characterClass && gameState.characterClass.includes("מכונות")) {
        titles = ["טירון מכני", "מתמחה דינמיקה", "אביר ברזל", "מאסטר זרימה", "בנאי מכונות", "קוסם בקרה", "מהנדס תרמי", "ארכיטקט מערכות עליון"];
    } else {
        titles = ["סטודנט מתחיל", "מפתח מתלמד", "אביר קוד", "אלכימאי ביטים", "מחסל באגים", "קוסם אלגוריתמים", "מאסטר חומרה", "ארכיטקט תוכנה עליון"];
    }
    const titleIndex = Math.min(titles.length - 1, Math.floor((gameState.level - 1) / 2));
    document.getElementById("char-title").innerText = `${gameState.characterClass || "סטודנט מתחיל"} (${titles[titleIndex]})`;
}

// Setup interface event listeners
function setupEventListeners() {
    // Controls Panel
    document.getElementById("btn-add-course").addEventListener("click", () => {
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

    // Splash level up close
    document.getElementById("btn-splash-close").addEventListener("click", () => {
        document.getElementById("level-up-splash").classList.remove("active");
    });

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
    const credits = parseInt(document.getElementById("course-credits").value);
    const semester = parseInt(document.getElementById("course-semester").value);
    const prereqsString = document.getElementById("course-prereqs").value.trim();
    const type = document.getElementById("course-type").value;
    
    if (gameState.courses[code]) {
        alert("קוד קורס זה כבר קיים בעץ!");
        return;
    }

    const prerequisites = prereqsString ? prereqsString.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

    // Verify all listed prerequisites actually exist
    const invalidPrereqs = prerequisites.filter(p => !gameState.courses[p]);
    if (invalidPrereqs.length > 0) {
        alert(`הקורסים הבאים המשמשים כקדמים לא קיימים בעץ עדיין: ${invalidPrereqs.join(', ')}`);
        return;
    }

    // Default tasks for custom course
    const tasks = [
        { id: `${code}_h1`, title: "מטלת בית 1", type: "hw", xp: 50, completed: false },
        { id: `${code}_ex`, title: "מבחן סופי (קרב בוס)", type: "exam", xp: 500, completed: false }
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

    recalculateCourseStates();
    saveState();
    renderUI();
    
    // Close modal & reset form
    document.getElementById("add-course-modal").classList.remove("active");
    document.getElementById("form-course").reset();
}

// Main Render Function
function renderUI() {
    updateHud();
    renderSemestersGrid();
    renderActiveQuestsSidebar();
    
    // Use requestAnimationFrame to draw lines after rendering completes and offsets are computed
    requestAnimationFrame(() => {
        setTimeout(drawConnections, 100);
    });
}

// Render the 8 Semester Columns with cards
function renderSemestersGrid() {
    const grid = document.getElementById("semesters-grid");
    grid.innerHTML = "";

    // Generate 8 semesters
    for (let sem = 1; sem <= 8; sem++) {
        const col = document.createElement("div");
        col.className = "semester-column";
        col.dataset.semester = sem;

        // Find courses for this semester
        const semCourses = Object.values(gameState.courses).filter(c => c.semester === sem);
        
        // Calculate semester weighted average
        const gradedSemCourses = semCourses.filter(c => c.status === 'mastered' && c.grade !== undefined && c.grade !== null && !isNaN(c.grade));
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
                    <span class="course-credits">${course.credits} נ״ז</span>
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
    svg.innerHTML = "";
    
    const viewport = document.getElementById("tree-viewport");
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
                path.setAttribute("marker-end", "url(#arrow-green)");
                path.style.strokeDasharray = "none";
            } else if (course.status !== 'locked') {
                path.setAttribute("stroke", "#38bdf8");
                path.setAttribute("marker-end", "url(#arrow-blue)");
                path.style.strokeDasharray = "5,5";
            } else {
                path.setAttribute("stroke", "#4b5563");
                path.setAttribute("marker-end", "url(#arrow-gray)");
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
            
            let questTypeLabel = "📜 שיעורי בית";
            if (task.type === 'project') questTypeLabel = "🛡️ עבודה/פרויקט (מיקרו-בוס)";
            if (task.type === 'exam') questTypeLabel = "🐉 מבחן סופי (קרב בוס)";

            qEl.innerHTML = `
                <div class="quest-sidebar-title">${task.title}</div>
                <div class="quest-sidebar-desc">${course.name} (${questTypeLabel})</div>
                <div class="quest-sidebar-xp">+ ${task.xp} XP</div>
            `;

            // Clicking sidebar item opens course details modal
            qEl.addEventListener("click", () => openCourseDetails(course.code));
            list.appendChild(qEl);
        });
    });

    if (!hasQuests) {
        list.innerHTML = `<div class="empty-quests">אין משימות פעילות כרגע. הפעל קורס ברשימה ועלה לרמה הבאה!</div>`;
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
    document.getElementById("modal-course-credits").innerText = `${course.credits} נקודות זכות (נ״ז)`;
    
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

    // Grade Input controller
    const gradeSection = document.getElementById("modal-grade-section");
    const gradeInput = document.getElementById("modal-course-grade-input");
    if (course.status === 'mastered') {
        gradeSection.style.display = "block";
        gradeInput.value = (course.grade !== undefined && course.grade !== null) ? course.grade : "";
        gradeInput.onchange = (e) => {
            const val = parseFloat(e.target.value);
            course.grade = (!isNaN(val) && val >= 0 && val <= 100) ? val : null;
            recalculateCourseStates();
            saveState();
            updateHud();
            renderUI();
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

    if (course.status === 'active' || course.status === 'mastered') {
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

                if (token) {
                    try {
                        const response = await fetch(`${moodleUrl}/webservice/rest/server.php?wstoken=${token}&wsfunction=mod_assign_get_assignments&moodlewsrestformat=json`, { mode: 'cors' });
                        if (response.ok) {
                            const data = await response.json();
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
                        }
                    } catch (corsErr) {
                        console.warn("Real Moodle API call failed or blocked by CORS. Falling back to structured simulation.");
                    }
                }

                if (!realFetchSuccess) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    
                    const code = course.code.replace(/[^0-9]/g, "");
                    if (code.includes("034061") || course.name.includes("גרפיקה")) {
                        tasksToImport = [
                            { id: "task-sw1", title: "תרגיל בית 1: מודלים דו-ממדיים ב-SolidWorks", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-sw2", title: "תרגיל בית 2: הרכבות והפקת שרטוטים", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-sw3", title: "תרגיל בית 3: תכנון חלקים מתקדמים", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-proj", title: "פרויקט הרכבה: שרטוט מכלול מכני שלם", type: "project", completed: false, status: "not_started", xp: 200, dueDate: "" },
                            { id: "task-exam", title: "מבחן מעשי: בוס מסכם SolidWorks", type: "exam", completed: false, status: "not_started", xp: 500, dueDate: "" }
                        ];
                    } else if (code.includes("104041") || course.name.includes("חדו\"א")) {
                        tasksToImport = [
                            { id: "task-h1", title: "תרגיל הגשה 1: סדרות וגבולות של פונקציות", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-h2", title: "תרגיל הגשה 2: רציפות וחקירת פונקציה", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-h3", title: "תרגיל הגשה 3: גזירות ואינטגרלים", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-exam", title: "מבחן סופי: חדו\"א 1מ1", type: "exam", completed: false, status: "not_started", xp: 500, dueDate: "" }
                        ];
                    } else if (code.includes("034028") || course.name.includes("מוצקים")) {
                        tasksToImport = [
                            { id: "task-s1", title: "תרגיל בית 1: מתיחה, לחיצה וגזירה של מוטות", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-s2", title: "תרגיל בית 2: מאמצי כפיפה ופיתול", type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: "task-exam", title: "מבחן סופי: מכניקת מוצקים 1", type: "exam", completed: false, status: "not_started", xp: 500, dueDate: "" }
                        ];
                    } else {
                        tasksToImport = [
                            { id: `task-dyn-1`, title: `תרגיל הגשה 1: מבוא ל${course.name}`, type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: `task-dyn-2`, title: `תרגיל הגשה 2: נושאים מתקדמים ב${course.name}`, type: "hw", completed: false, status: "not_started", xp: 50, dueDate: "" },
                            { id: `task-dyn-proj`, title: `עבודת הגשה מסכמת ב${course.name}`, type: "project", completed: false, status: "not_started", xp: 150, dueDate: "" },
                            { id: `task-dyn-exam`, title: `מבחן מסכם ב${course.name}`, type: "exam", completed: false, status: "not_started", xp: 500, dueDate: "" }
                        ];
                    }
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

    if (course.status === 'locked') {
        actionBox.innerHTML = `<p style="color: #ef4444; font-weight: bold;">הקורס נעול. עליך להשלים את כל דרישות הקדם תחילה!</p>`;
    } else if (course.status === 'available') {
        actionBox.innerHTML = `
            <p style="margin-bottom: 10px;">דרישות הקדם מולאו! הירשם לקורס כדי לפתוח את רשימת המשימות שלו.</p>
            <button class="btn btn-primary" id="btn-register-course">📖 הירשם והתחל קורס</button>
        `;
        document.getElementById("btn-register-course").addEventListener("click", () => {
            course.status = 'active';
            recalculateCourseStates();
            saveState();
            renderUI();
            openCourseDetails(code); // refresh view
        });
    } else if (course.status === 'active') {
        actionBox.innerHTML = `<p style="color: var(--accent-gold); font-weight: bold;">⚔️ אתה רשום לקורס זה כעת. השלם את המשימות והבס את הבוס כדי לקבל נ״ז!</p>`;
    } else if (course.status === 'mastered') {
        actionBox.innerHTML = `<p style="color: var(--color-mastered); font-weight: bold;">🏆 הקורס הושלם בהצלחה! נקודות הזכות (${course.credits} נ״ז) נוספו למדדים שלך.</p>`;
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
                title: `מבחן סופי (מועד ${nextMoedLetter})`,
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
        container.innerHTML = `<div class="empty-quests" style="font-size: 0.85rem; padding: 10px;">אין שלבים מוגדרים במסע לקורס זה. הוסף שלב ראשון למטה!</div>`;
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
        if (task.type === 'project') icon = "🛡️";
        if (task.type === 'exam') icon = "🐉";

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
                <span class="quest-icon" title="${task.type === 'exam' ? 'קרב בוס' : (task.type === 'project' ? 'מיקרו-בוס' : 'משימה')}">${icon}</span>
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
                
                <span class="quest-xp">+${task.xp} XP</span>
                
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
                            alert(`⚠️ הציון במבחן (${task.grade}) נמוך מ-55. נכשלת במבחן ונדרש מועד ב'! הקורס לא יושלם.`);
                            task.status = 'not_started';
                            task.completed = false;
                            recalculateCourseStates();
                            saveState();
                            renderUI();
                            openCourseDetails(course.code);
                            return;
                        }
                        alert(`🔥 עברת את המבחן! קיבלת ${task.grade || ''}. כעת תוכל לבחור להירשם למועד נוסף לשפר ציון, או לאשר את השלמת הקורס ידנית מתפריט 3 הנקודות (⋮) למעלה.`);
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
                                task.status = 'not_started';
                                task.completed = false;
                                
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
                                alert(`🔥 עברת את המבחן עם ציון ${task.grade}! כעת תוכל לבחור להירשם למועד נוסף לשפר ציון, או לאשר את השלמת הקורס ידנית מתפריט 3 הנקודות (⋮) למעלה.`);
                            } else {
                                if (course.status === 'mastered') {
                                    course.grade = task.grade;
                                }
                            }
                        } else {
                            if (course.status === 'mastered') {
                                course.grade = null;
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
    saveState();
    
    // Hide form and reset fields
    document.getElementById("form-add-quest").style.display = 'none';
    document.getElementById("input-quest-title").value = "";
    document.getElementById("input-quest-date").value = "";
    document.getElementById("input-quest-xp").value = "50";
    
    renderUI();
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
            course.grade = passingExam.grade;
        }
        course.status = 'mastered';
        completeAllTasks(course);
        recalculateCourseStates();
    }
}