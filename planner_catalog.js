// ==========================================================================
// Official Technion Mechanical Engineering Curriculum Catalog 2025/2026 (תשפ"ו)
// Faculty of Mechanical Engineering (03) | תוכנית לימודים לתואר בוגר
// ==========================================================================

(function(global) {
    'use strict';

    const DEGREE_RULES = {
        totalCredits: 157.5,
        mandatoryCredits: 107.0,
        finalProjectCredits: 6.0,
        freeElectiveCredits: 12.0, // 6 MALAG, 4 Technion-wide, 2 PE
        advancedElectiveCredits: 32.5, // Lists A - E
        listA_minCourses: 1, // Computational (קורסים חישוביים)
        listB_minCourses: 2, // Core topics (נושאי ליבה)
        listC_minCourses: 2, // Applied & integrative (יישומיים ושילוביים)
        listD_minCourses: 1, // General science (מדעיים כלליים)
        listsBCD_minCredits: 14.0 // Combined min credits for B + C + D
    };

    // Mandatory Semester Layout (שיבוץ מומלץ רשמי - סמסטרים 1 עד 8)
    const SUGGESTED_MANDATORY_SYLLABUS = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳",
            targetCredits: 17.0,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "02340128", altCode: "234128", name: "שפת פייתון", credits: 4.0, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳",
            targetCredits: 21.5,
            courses: [
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "01040043", altCode: "104043", name: "חדו\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5, type: "mandatory", prereqs: [] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳ (חורף נוכחי)",
            targetCredits: 19.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5, type: "mandatory", prereqs: ["01140051", "01040043"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["02340128", "01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳ (אביב)",
            targetCredits: 17.5,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] }
            ]
        },
        {
            semester: 5,
            title: "שנה ג׳ - סמסטר ה׳",
            targetCredits: 18.0,
            courses: [
                { code: "00340041", altCode: "034041", name: "מעבר חום", credits: 4.0, type: "mandatory", prereqs: ["00340035", "00340055", "01040228"] },
                { code: "00340040", altCode: "034040", name: "מבוא לבקרה", credits: 3.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340054", altCode: "034054", name: "תכן מכני 1 מ'", credits: 4.0, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340058", altCode: "034058", name: "הסתברות וסטטיסטיקה מה' מכ'", credits: 3.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01140032", altCode: "114032", name: "מעב' לפיזיקה 1 ח", credits: 1.0, type: "mandatory", prereqs: ["01140051", "01140052"] },
                { code: "00340051", altCode: "034051", name: "דינמיקה ומכניקה של תנודות", credits: 3.0, type: "mandatory", prereqs: ["00340010", "00340032"] }
            ]
        },
        {
            semester: 6,
            title: "שנה ג׳ - סמסטר ו׳",
            targetCredits: 10.5,
            courses: [
                { code: "00340060", altCode: "034060", name: "מבוא למכטרוניקה והנע חשמלי", credits: 4.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340057", altCode: "034057", name: "מעבדה מתקדמת הנ. מכונות", credits: 4.0, type: "mandatory", prereqs: ["00340041", "00340051", "01140032"] },
                { code: "00340371", altCode: "034371", name: "פרויקט תכן לייצור", credits: 2.5, type: "mandatory", prereqs: ["00340030", "00340054"] }
            ]
        },
        {
            semester: 7,
            title: "שנה ד׳ - סמסטר ז׳",
            targetCredits: 3.5,
            courses: [
                { code: "00340379", altCode: "034379", name: "פרויקט גמר הנדסי 1", credits: 3.0, type: "final_project", prereqs: ["00340054", "00340371"] },
                { code: "00340382", altCode: "034382", name: "מתודולוגיות פיתוח הנדסי 1", credits: 0.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 8,
            title: "שנה ד׳ - סמסטר ח׳",
            targetCredits: 3.5,
            courses: [
                { code: "00340380", altCode: "034380", name: "פרויקט גמר הנדסי 2", credits: 3.0, type: "final_project", prereqs: ["00340379"] },
                { code: "00340383", altCode: "034383", name: "מתודולוגיות פיתוח הנדסי 2", credits: 0.5, type: "mandatory", prereqs: ["00340382"] }
            ]
        }
    ];

    // ==========================================================================
    // Categorized Electives (רשימות בחירה מתקדמות א׳-ה׳)
    // ==========================================================================
    const ELECTIVE_CATALOG = {
        // רשימה א' - קורסים חישוביים (Computational)
        A: [
            { code: "00350022", altCode: "035022", name: "אלמנטים סופיים לאנליזה הנדסית", credits: 3.0, list: "A", prereqs: ["00340053", "00340056"] },
            { code: "00360015", altCode: "036015", name: "שיטות אלמנטים סופיים בהנדסה 1", credits: 3.0, list: "A", prereqs: ["00340053", "00340056"] },
            { code: "00350199", altCode: "035199", name: "שימוש המחשב בתורת הזרימה", credits: 3.0, list: "A", prereqs: ["00340055", "00340056"] },
            { code: "00350013", altCode: "035013", name: "שיטות מספריות בהנדסת מכונות", credits: 2.5, list: "A", prereqs: ["00340056"] },
            { code: "00350039", altCode: "035039", name: "עיבוד אותות", credits: 3.0, list: "A", prereqs: ["00340032"] },
            { code: "00350054", altCode: "035054", name: "מבוא ללמידה ובינה בהנדסת מכונות", credits: 2.5, list: "A", prereqs: ["02340128", "00340056"] }
        ],

        // רשימה ב' - קורסי נושאי ליבה (Core Topics)
        B: [
            { code: "00350035", altCode: "035035", name: "תורת הזרימה 2", credits: 2.5, list: "B", prereqs: ["00340055"] },
            { code: "00350091", altCode: "035091", name: "תרמודינמיקה 2", credits: 3.5, list: "B", prereqs: ["00340035"] },
            { code: "00360009", altCode: "036009", name: "מעבר חום ומסה", credits: 3.0, list: "B", prereqs: ["00340041"] },
            { code: "00350188", altCode: "035188", name: "תורת הבקרה", credits: 3.5, list: "B", prereqs: ["00340040"] },
            { code: "00350001", altCode: "035001", name: "מבוא לרובוטיקה", credits: 2.5, list: "B", prereqs: ["00340010"] },
            { code: "00360005", altCode: "036005", name: "דינמיקה אנליטית", credits: 3.0, list: "B", prereqs: ["00340010"] },
            { code: "00350003", altCode: "035003", name: "מערכות תיב\"מ 1", credits: 3.0, list: "B", prereqs: ["00340061", "00340056"] },
            { code: "00340016", altCode: "034016", name: "תכן מכני 2", credits: 3.0, list: "B", prereqs: ["00340054"] },
            { code: "00350123", altCode: "035123", name: "מבוא למערכות יצור 1", credits: 2.5, list: "B", prereqs: ["00340030"] },
            { code: "00350043", altCode: "035043", name: "מבוא לתורת האלסטיות", credits: 3.0, list: "B", prereqs: ["00340053"] },
            { code: "00350041", altCode: "035041", name: "מכניקת מיקרו-מערכות", credits: 3.5, list: "B", prereqs: ["00340053"] },
            { code: "00350034", altCode: "035034", name: "כשל חומרים", credits: 2.5, list: "B", prereqs: ["00340053", "03140533"] },
            { code: "00350050", altCode: "035050", name: "תכנון מערכות אופטיות", credits: 3.5, list: "B", prereqs: ["01140052"] },
            { code: "00350052", altCode: "035052", name: "אופטיקה לינארית ויישומים 1", credits: 3.5, list: "B", prereqs: ["01140052"] },
            { code: "00360049", altCode: "036049", name: "רשתות עצביות לבקרה ודיאגנוסטיקה", credits: 2.5, list: "B", prereqs: ["00340032"] },
            { code: "00350062", altCode: "035062", name: "אנליזה של מבנים", credits: 2.5, list: "B", prereqs: ["00340053"] }
        ],

        // רשימה ג' - קורסים יישומיים ושילוביים (אינטגרטיביים - Applied & Integrative)
        C: [
            { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות", credits: 2.5, list: "C", prereqs: [] },
            { code: "00350032", altCode: "035032", name: "תכן מוצרים מבוססי מיקרו-מעבד", credits: 3.0, list: "C", prereqs: ["00340060"] },
            { code: "00340401", altCode: "034401", name: "מעבדה מתקדמת לרובוטים", credits: 2.5, list: "C", prereqs: ["00340060"] },
            { code: "00340404", altCode: "034404", name: "מעבדה מתקדמת בתיב\"מ", credits: 2.0, list: "C", prereqs: ["00350003"] },
            { code: "00340406", altCode: "034406", name: "מעבדה מתקדמת לבקרה ואוטומציה", credits: 2.5, list: "C", prereqs: ["00340040"] },
            { code: "00340410", altCode: "034410", name: "מעבדה מתקדמת לאנרגיה", credits: 2.5, list: "C", prereqs: ["00340041"] },
            { code: "00340411", altCode: "034411", name: "מע' מתק' למנועי שריפה", credits: 2.5, list: "C", prereqs: ["00340041"] },
            { code: "00340413", altCode: "034413", name: "מעבדה לתכן ייצור", credits: 2.0, list: "C", prereqs: ["00340371"] },
            { code: "00340420", altCode: "034420", name: "מעבדה מתק' באנרגיה מתחדשת", credits: 2.5, list: "C", prereqs: ["00340041"] },
            { code: "00340422", altCode: "034422", name: "מעבדה באופטיקה", credits: 2.5, list: "C", prereqs: ["00350050"] },
            { code: "00350048", altCode: "035048", name: "תכן משולב אנליזה", credits: 2.5, list: "C", prereqs: ["00340054", "00350022"] },
            { code: "00350051", altCode: "035051", name: "תכן אופטומכני", credits: 4.0, list: "C", prereqs: ["00340054", "00350050"] },
            { code: "00360063", altCode: "036063", name: "מידול מערכות בניסוי", credits: 3.0, list: "C", prereqs: ["00340058"] },
            { code: "00340047", altCode: "034047", name: "מעבדה מתקדמת בזרימה", credits: 2.0, list: "C", prereqs: ["00340055"] },
            { code: "00360027", altCode: "036027", name: "דינמיקה של מבנים ימיים", credits: 3.0, list: "C", prereqs: ["00340055", "00340010"] }
        ],

        // רשימה ד' - קורסים מדעיים כלליים (General Science)
        D: [
            { code: "01340058", altCode: "134058", name: "ביולוגיה 1", credits: 3.0, list: "D", prereqs: [] },
            { code: "00360001", altCode: "036001", name: "שיטות אנליטיות 1", credits: 4.0, list: "D", prereqs: ["01040043", "01040131"] },
            { code: "01140054", altCode: "114054", name: "פיזיקה 3", credits: 3.5, list: "D", prereqs: ["01140052"] },
            { code: "01140073", altCode: "114073", name: "פיזיקה קוונטית להנדסה", credits: 3.5, list: "D", prereqs: ["01140052"] },
            { code: "01040215", altCode: "104215", name: "פונקציות מרוכבות א", credits: 2.5, list: "D", prereqs: ["01040043"] },
            { code: "01040221", altCode: "104221", name: "פונקציות מרוכבות והתמרות", credits: 4.0, list: "D", prereqs: ["01040043"] },
            { code: "01140086", altCode: "114086", name: "גלים", credits: 3.5, list: "D", prereqs: ["01140052"] },
            { code: "00460241", altCode: "046241", name: "מכניקה קוונטית", credits: 3.0, list: "D", prereqs: ["01140052"] },
            { code: "01140036", altCode: "114036", name: "פיסיקה סטטיסטית ותרמית", credits: 5.0, list: "D", prereqs: ["00340035", "01140052"] },
            { code: "01160041", altCode: "116041", name: "פיז. של לייזרים ואופטיקה קוונטית", credits: 3.5, list: "D", prereqs: ["01140073"] }
        ],

        // רשימה ה' - בחירה פקולטית כללית (General Faculty Electives)
        E: [
            { code: "00350141", altCode: "035141", name: "מתקני כוח וחום", credits: 2.5, list: "E", prereqs: ["00340035"] },
            { code: "00350053", altCode: "035053", name: "אנרגיה מתחדשת ובת-קיימא", credits: 3.0, list: "E", prereqs: ["00340035"] },
            { code: "03501460", altCode: "350146", name: "מבוא למנועי שריפה פנימית", credits: 2.5, list: "E", prereqs: ["00340035"] },
            { code: "00340045", altCode: "034045", name: "החלטות כלכליות", credits: 2.5, list: "E", prereqs: [] },
            { code: "00140603", altCode: "014603", name: "כלכלה הנדסית", credits: 2.5, list: "E", prereqs: [] },
            { code: "00350023", altCode: "035023", name: "קרור ונהול תרמי של רכיבים אלק'", credits: 2.5, list: "E", prereqs: ["00340041"] },
            { code: "00350028", altCode: "035028", name: "זרימה ותרמודינמיקה של טורבו מכונות", credits: 2.5, list: "E", prereqs: ["00340055", "00340035"] },
            { code: "00350033", altCode: "035033", name: "מבוא למער' משולבות חיישנים", credits: 3.0, list: "E", prereqs: ["00340060"] },
            { code: "00360010", altCode: "036010", name: "תורת הסיכה ההידרודינמית", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00360032", altCode: "036032", name: "מכניקת זורמים אנליטית", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00360038", altCode: "036038", name: "תהליכי מעבר בפן ביני", credits: 3.0, list: "E", prereqs: ["00340041"] },
            { code: "00360035", altCode: "036035", name: "מבוא להנדסת שריפה", credits: 3.0, list: "E", prereqs: ["00340035"] },
            { code: "00360079", altCode: "036079", name: "בקרת פליטת מזהמים מכלי רכב", credits: 3.0, list: "E", prereqs: ["00340035"] },
            { code: "00360076", altCode: "036076", name: "אלקטרוקינטיקה בננו ומיקרו זרימה", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00360074", altCode: "036074", name: "בקרה אקטיבית ופסיבית של זרימה", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00360082", altCode: "036082", name: "עקרונות מנועי שריפה פנימית", credits: 3.0, list: "E", prereqs: ["00340035"] },
            { code: "00360080", altCode: "036080", name: "מערכות הנעה רכב מתקדמות", credits: 3.0, list: "E", prereqs: ["00340060"] },
            { code: "00360096", altCode: "036096", name: "מערכות זרימה אלקטרוכימיות", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00540452", altCode: "054452", name: "זיהום אויר", credits: 2.5, list: "E", prereqs: [] },
            { code: "00350036", altCode: "035036", name: "תכן מערכות בקרה", credits: 2.5, list: "E", prereqs: ["00340040"] },
            { code: "00360026", altCode: "036026", name: "קינמ. דינמיקה ובקרה של רובוטים", credits: 2.5, list: "E", prereqs: ["00340010", "00340040"] },
            { code: "00360050", altCode: "036050", name: "בקרה לא ליניארית", credits: 3.0, list: "E", prereqs: ["00340040"] },
            { code: "00350008", altCode: "035008", name: "אוטומציה תעשייתית", credits: 2.5, list: "E", prereqs: ["00340060"] },
            { code: "00360041", altCode: "036041", name: "תכן הנדסי מתקדם", credits: 3.0, list: "E", prereqs: ["00340054"] },
            { code: "00360007", altCode: "036007", name: "תנודות במבנים", credits: 3.0, list: "E", prereqs: ["00340051"] },
            { code: "00360012", altCode: "036012", name: "מערכות בקרה ליניאריות", credits: 3.0, list: "E", prereqs: ["00340040"] },
            { code: "00360013", altCode: "036013", name: "אופטימיזציה של תהליכים", credits: 3.0, list: "E", prereqs: ["00340056"] },
            { code: "00360081", altCode: "036081", name: "התקנים מיקרומכניים", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00360042", altCode: "036042", name: "דינמיקה של מער' מסתובבות", credits: 3.0, list: "E", prereqs: ["00340051"] },
            { code: "00360048", altCode: "036048", name: "רטט לא ליניארי", credits: 3.0, list: "E", prereqs: ["00340051"] },
            { code: "00360087", altCode: "036087", name: "דינמיקה היברידית", credits: 3.0, list: "E", prereqs: ["00340010"] },
            { code: "00360092", altCode: "036092", name: "בקרת תנועה ביולוגית", credits: 3.0, list: "E", prereqs: ["00340040"] },
            { code: "00350024", altCode: "035024", name: "טריבולוגיה שימושית", credits: 2.5, list: "E", prereqs: ["00340054"] },
            { code: "00350124", altCode: "035124", name: "אנליזת תהליכי עבוד", credits: 2.5, list: "E", prereqs: ["00340030"] },
            { code: "00360003", altCode: "036003", name: "מבוא למכניקת הרצף", credits: 3.0, list: "E", prereqs: ["00340053", "01040228"] },
            { code: "00360004", altCode: "036004", name: "מכניקת השבר", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00360006", altCode: "036006", name: "גלי מאמצים", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00360031", altCode: "036031", name: "טריבולוגיה עיונית", credits: 3.0, list: "E", prereqs: ["00340054"] },
            { code: "00360062", altCode: "036062", name: "מכניקת מגע", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00360093", altCode: "036093", name: "מכניקה של חומרים מרוכבים", credits: 3.0, list: "E", prereqs: ["00340053", "03140533"] },
            { code: "00360097", altCode: "036097", name: "דינמיקה של מרוכבים ומטא-חומרים", credits: 3.0, list: "E", prereqs: ["00340051"] },
            { code: "00860576", altCode: "086576", name: "תורת האלסטיות", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00360088", altCode: "036088", name: "ננומכניקה חישובית של מוצקים", credits: 3.0, list: "E", prereqs: ["00340053", "00340056"] },
            { code: "00360065", altCode: "036065", name: "אלקטרו ומגנטו מכניקה", credits: 3.0, list: "E", prereqs: ["00340053", "01140052"] },
            { code: "00360071", altCode: "036071", name: "ביומכניקה של תאים ומולקולות", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "03140309", altCode: "314309", name: "תהלכי יצור ועיבוד חומרים", credits: 2.5, list: "E", prereqs: ["03140533"] },
            { code: "03140311", altCode: "314311", name: "חומרים קרמיים", credits: 2.5, list: "E", prereqs: ["03140533"] },
            { code: "03140312", altCode: "314312", name: "חומרים פלסטיים", credits: 2.5, list: "E", prereqs: ["03140533"] },
            { code: "00360058", altCode: "036058", name: "מיקרומכניקת מוצקים 1", credits: 3.0, list: "E", prereqs: ["00340053"] },
            { code: "00350018", altCode: "035018", name: "מבוא לאמינות של מע' מכניות", credits: 2.5, list: "E", prereqs: ["00340058"] },
            { code: "00360020", altCode: "036020", name: "גיאומטריה חישובית 1", credits: 2.5, list: "E", prereqs: ["00340056"] },
            { code: "00340205", altCode: "034205", name: "תכן מער' הדראוליות ופנאומטיות 1", credits: 3.0, list: "E", prereqs: ["00340055"] },
            { code: "00340206", altCode: "034206", name: "תכן מער' הדראוליות ופנאומטיות 2", credits: 3.0, list: "E", prereqs: ["00340205"] },
            { code: "00350010", altCode: "035010", name: "קינמטיקה של מכניזמים", credits: 2.5, list: "E", prereqs: ["00340010"] },
            { code: "00350046", altCode: "035046", name: "ניהול פרויקטים", credits: 2.5, list: "E", prereqs: [] },
            { code: "00360045", altCode: "036045", name: "גיאומטריה חישובית ומודלים בתיב\"ם 2", credits: 3.0, list: "E", prereqs: ["00350003"] },
            { code: "0940202", altCode: "094202", name: "מבוא לניתוח נתונים", credits: 3.5, list: "E", prereqs: ["02340128"] },
            { code: "2340268", altCode: "234268", name: "מבני נתונים ואלגוריתמים", credits: 3.0, list: "E", prereqs: ["02340128"] },
            { code: "03240033", altCode: "324033", name: "אנגלית טכנית מתקדמים ב'", credits: 3.0, list: "E", prereqs: [] },
            { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות (רשות)", credits: 2.5, list: "E", prereqs: [] }
        ]
    };

    // Helper: Build course lookup index by code and altCode
    const ALL_COURSES_MAP = {};
    SUGGESTED_MANDATORY_SYLLABUS.forEach(sem => {
        sem.courses.forEach(c => {
            ALL_COURSES_MAP[c.code] = c;
            if (c.altCode) ALL_COURSES_MAP[c.altCode] = c;
        });
    });
    Object.keys(ELECTIVE_CATALOG).forEach(catKey => {
        ELECTIVE_CATALOG[catKey].forEach(c => {
            ALL_COURSES_MAP[c.code] = c;
            if (c.altCode) ALL_COURSES_MAP[c.altCode] = c;
        });
    });

    // Expose to window / global
    global.PLANNER_CATALOG = {
        DEGREE_RULES: DEGREE_RULES,
        SUGGESTED_MANDATORY_SYLLABUS: SUGGESTED_MANDATORY_SYLLABUS,
        ELECTIVE_CATALOG: ELECTIVE_CATALOG,
        ALL_COURSES_MAP: ALL_COURSES_MAP
    };

})(typeof window !== 'undefined' ? window : global);
