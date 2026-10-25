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

    // ==========================================================================
    // 1. Mandatory Semester Layout - Catalog 2024 (תשפ"ד / תשפ"ה / מי שמתחיל באוקטובר 2024)
    // Based on official Technion Faculty of Mechanical Engineering Catalog 2023/2024 & 2024/2025
    // ==========================================================================
    const SUGGESTED_MANDATORY_SYLLABUS_2024 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (חורף)",
            targetCredits: 19.0,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 },
                        { code: "01140055", altCode: "114055", name: "פיזיקה 1ת'", credits: 3.5 }
                    ],
                    prereqs: [] 
                },
                { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות", credits: 2.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳ (אביב)",
            targetCredits: 20.0,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065", "01140051"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01140039", altCode: "114039", name: "מעבדה לפיזיקה 1מח'", credits: 1.0, type: "mandatory", prereqs: ["01140051"] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 18.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "00340043", altCode: "034043", name: "שרטוט הנדסי ממוחשב", credits: 2.5, type: "mandatory", prereqs: ["00340061"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
            targetCredits: 21.0,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2מ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 },
                        { code: "01140076", altCode: "114076", name: "פיזיקה 2ת'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                }
            ]
        },
        {
            semester: 5,
            title: "שנה ג׳ - סמסטר ה׳",
            targetCredits: 20.5,
            courses: [
                { code: "00340041", altCode: "034041", name: "מעבר חום", credits: 4.0, type: "mandatory", prereqs: ["00340035", "00340055", "01040228"] },
                { code: "00340040", altCode: "034040", name: "מבוא לבקרה", credits: 3.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340022", altCode: "034022", name: "מבוא למכטרוניקה", credits: 2.5, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340054", altCode: "034054", name: "תכן מכני 1 מ'", credits: 4.0, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340058", altCode: "034058", name: "הסתברות וסטטיסטיקה מה' מכ'", credits: 3.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01140032", altCode: "114032", name: "מעב' לפיזיקה 1 ח", credits: 1.0, type: "mandatory", prereqs: ["01140051", "01140052"] },
                { code: "00340051", altCode: "034051", name: "דינמיקה ומכניקה של תנודות", credits: 3.0, type: "mandatory", prereqs: ["00340010", "00340032"] }
            ]
        },
        {
            semester: 6,
            title: "שנה ג׳ - סמסטר ו׳",
            targetCredits: 9.0,
            courses: [
                { code: "00340034", altCode: "034034", name: "הנע חשמלי", credits: 2.5, type: "mandatory", prereqs: ["00340032"] },
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
    // 2. Mandatory Semester Layout - Catalog 2027 (תשפ"ז - אוקטובר 2026)
    // קטלוג רישום עדכני עבור מי שמתחיל באוקטובר 2026 (תשפ״ז)
    // ==========================================================================
    const SUGGESTED_MANDATORY_SYLLABUS_2027 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (תשפ״ז)",
            targetCredits: 19.0,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ' 2", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 }
                    ],
                    prereqs: [] 
                },
                { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות", credits: 2.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳",
            targetCredits: 20.0,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065", "01140051"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01140039", altCode: "114039", name: "מעבדה לפיזיקה 1מח'", credits: 1.0, type: "mandatory", prereqs: ["01140051"] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 18.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "00340043", altCode: "034043", name: "שרטוט הנדסי ממוחשב", credits: 2.5, type: "mandatory", prereqs: ["00340061"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
            targetCredits: 21.0,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2ממ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                }
            ]
        },
        {
            semester: 5,
            title: "שנה ג׳ - סמסטר ה׳",
            targetCredits: 20.5,
            courses: [
                { code: "00340041", altCode: "034041", name: "מעבר חום", credits: 4.0, type: "mandatory", prereqs: ["00340035", "00340055", "01040228"] },
                { code: "00340040", altCode: "034040", name: "מבוא לבקרה", credits: 3.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340022", altCode: "034022", name: "מבוא למכטרוניקה", credits: 2.5, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340054", altCode: "034054", name: "תכן מכני 1 מ'", credits: 4.0, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340058", altCode: "034058", name: "הסתברות וסטטיסטיקה מה' מכ'", credits: 3.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01140032", altCode: "114032", name: "מעב' לפיזיקה 1 ח", credits: 1.0, type: "mandatory", prereqs: ["01140051", "01140052"] },
                { code: "00340051", altCode: "034051", name: "דינמיקה ומכניקה של תנודות", credits: 3.0, type: "mandatory", prereqs: ["00340010", "00340032"] }
            ]
        },
        {
            semester: 6,
            title: "שנה ג׳ - סמסטר ו׳",
            targetCredits: 9.0,
            courses: [
                { code: "00340034", altCode: "034034", name: "הנע חשמלי", credits: 2.5, type: "mandatory", prereqs: ["00340032"] },
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
    // 3. Mandatory Semester Layout - Catalog 2026 (תשפ"ו - אוקטובר 2025)
    // קטלוג רישום למתחילים באוקטובר 2025 (תשפ״ו - כולל שפת פייתון 02340128 בסמסטר א׳)
    // ==========================================================================
    const SUGGESTED_MANDATORY_SYLLABUS_2026 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (תשפ״ו)",
            targetCredits: 20.5,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "02340128", altCode: "234128", name: "שפת פייתון", credits: 4.0, type: "mandatory", prereqs: [] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 }
                    ],
                    prereqs: [] 
                }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳",
            targetCredits: 19.0,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065", "01140051"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 20.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2ממ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["02340128", "01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] },
                { code: "03940805", altCode: "03940805", name: "חינוך גופני - אתלטיקה קלה / יוגה", credits: 1.0, type: "sports", prereqs: [] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
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
            { code: "03240032", altCode: "324032", name: "אנגלית - מתקדמים א'", credits: 0.0, list: "E", prereqs: [] },
            { code: "03240033", altCode: "324033", name: "אנגלית טכנית מתקדמים ב'", credits: 3.0, list: "E", prereqs: [] },
            { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות (רשות)", credits: 2.5, list: "E", prereqs: [] }
        ],

                // קורסי ספורט וחינוך גופני (Technion Physical Education & Sports)
        SPORTS: [
            {
                code: "03940808", altCode: "394808", name: "חינוך גופני - פילאטיס ומתיחות", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "pilates_reformer", name: "פילאטיס מכשירים", day: "רביעי", time: "12:30 - 14:00", dayIndex: 3, startTime: "12:30", endTime: "14:00", room: "מרכז הספורט - חדר מכשירים", note: "חובת נוכחות • רישום מראש" },
                    { id: "pilates_mat", name: "פילאטיס מזרן", day: "שני", time: "10:30 - 12:00", dayIndex: 1, startTime: "10:30", endTime: "12:00", room: "אולם סטודיו קנדה", note: "חובת נוכחות" },
                    { id: "pilates_dynamic", name: "פילאטיס דינמי ועיצוב", day: "חמישי", time: "08:30 - 10:00", dayIndex: 4, startTime: "08:30", endTime: "10:00", room: "סטודיו 2", note: "חובת נוכחות" },
                    { id: "pilates_mobility", name: "מתיחות וגמישות", day: "ראשון", time: "14:30 - 16:00", dayIndex: 0, startTime: "14:30", endTime: "16:00", room: "מרכז הספורט", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940805", altCode: "394805", name: "חינוך גופני - אתלטיקה קלה / יוגה", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "yoga_vinyasa", name: "יוגה ויניאסה", day: "שני", time: "08:30 - 10:00", dayIndex: 1, startTime: "08:30", endTime: "10:00", room: "סטודיו דשא", note: "חובת נוכחות" },
                    { id: "yoga_hatha", name: "האטה יוגה", day: "שלישי", time: "12:30 - 14:00", dayIndex: 2, startTime: "12:30", endTime: "14:00", room: "אולם קנדה", note: "חובת נוכחות" },
                    { id: "yoga_ashtanga", name: "אשטנגה יוגה", day: "רביעי", time: "16:30 - 18:00", dayIndex: 3, startTime: "16:30", endTime: "18:00", room: "סטודיו מרכזי", note: "חובת נוכחות" },
                    { id: "yoga_track", name: "אתלטיקה קלה וריצה", day: "ראשון", time: "18:30 - 20:00", dayIndex: 0, startTime: "18:30", endTime: "20:00", room: "אצטדיון הטכניון", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940800", altCode: "394800", name: "חינוך גופני - כושר גופני וחדר כושר", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "gym_general", name: "אימון חדר כושר כללי", day: "א'/ג'/ה'", time: "חלונות גמישים", room: "מרכז הכושר הטכניוני", isFlexible: true, note: "נוכחות נמדדת בצ'ק-אין בקבלה" },
                    { id: "gym_trx", name: "אימון TRX ורצועות", day: "שני", time: "12:30 - 14:00", dayIndex: 1, startTime: "12:30", endTime: "14:00", room: "סטודיו כושר", note: "חובת נוכחות" },
                    { id: "gym_spinning", name: "ספינינג ורכיבה", day: "רביעי", time: "18:00 - 19:30", dayIndex: 3, startTime: "18:00", endTime: "19:30", room: "אולם ספינינג", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940801", altCode: "394801", name: "חינוך גופני - התעמלות ואימון פונקציונלי", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "func_cross", name: "אימון פונקציונלי וקרוספיט", day: "שלישי", time: "16:30 - 18:00", dayIndex: 2, startTime: "16:30", endTime: "18:00", room: "מתחם פונקציונלי", note: "חובת נוכחות" },
                    { id: "func_sculpt", name: "עיצוב וחיטוב הגוף", day: "שני", time: "14:30 - 16:00", dayIndex: 1, startTime: "14:30", endTime: "16:00", room: "סטודיו 1", note: "חובת נוכחות" },
                    { id: "func_aerobic", name: "אירובי ואימון מדרגה", day: "חמישי", time: "12:30 - 14:00", dayIndex: 4, startTime: "12:30", endTime: "14:00", room: "סטודיו מרכזי", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940803", altCode: "394803", name: "חינוך גופני - משחקי כדור (כדורסל/כדורגל/כדורעף)", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "ball_basketball", name: "כדורסל", day: "ראשון", time: "16:30 - 18:00", dayIndex: 0, startTime: "16:30", endTime: "18:00", room: "אולם קנדה", note: "חובת נוכחות" },
                    { id: "ball_volleyball", name: "כדורעף", day: "רביעי", time: "14:30 - 16:00", dayIndex: 3, startTime: "14:30", endTime: "16:00", room: "אולם מרכזי", note: "חובת נוכחות" },
                    { id: "ball_soccer", name: "כדורגל / קטרגל", day: "שלישי", time: "18:30 - 20:00", dayIndex: 2, startTime: "18:30", endTime: "20:00", room: "מגרש עליון", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940804", altCode: "394804", name: "חינוך גופני - משחקי מחבט (טניס/טניס שולחן/בדמינטון)", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "racket_tennis", name: "טניס", day: "שני", time: "14:30 - 16:00", dayIndex: 1, startTime: "14:30", endTime: "16:00", room: "מגרשי טניס עליונים", note: "חובת נוכחות" },
                    { id: "racket_table_tennis", name: "טניס שולחן", day: "רביעי", time: "16:30 - 18:00", dayIndex: 3, startTime: "16:30", endTime: "18:00", room: "אולם טניס שולחן", note: "חובת נוכחות" },
                    { id: "racket_badminton", name: "בדמינטון", day: "חמישי", time: "10:30 - 12:00", dayIndex: 4, startTime: "10:30", endTime: "12:00", room: "אולם קנדה", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940802", altCode: "394802", name: "חינוך גופני - שחייה (סגנונות ואימון)", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "swim_styles", name: "לימוד ושיפור סגנון שחייה", day: "שני", time: "08:30 - 10:00", dayIndex: 1, startTime: "08:30", endTime: "10:00", room: "בריכת הטכניון", note: "חובת נוכחות" },
                    { id: "swim_advanced", name: "אימון שחייה מתקדם", day: "רביעי", time: "07:00 - 08:30", dayIndex: 3, startTime: "07:00", endTime: "08:30", room: "בריכת הטכניון", note: "חובת נוכחות" },
                    { id: "swim_waterpolo", name: "כדורמים", day: "חמישי", time: "16:30 - 18:00", dayIndex: 4, startTime: "16:30", endTime: "18:00", room: "בריכת הטכניון", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940806", altCode: "394806", name: "חינוך גופני - הגנה עצמית וקרב מגע", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "krav_maga", name: "קרב מגע והגנה עצמית", day: "שלישי", time: "18:30 - 20:00", dayIndex: 2, startTime: "18:30", endTime: "20:00", room: "דוג'ו אמנויות לחימה", note: "חובת נוכחות" },
                    { id: "bjj", name: "ג'ו-ג'יטסו ברזילאי (BJJ)", day: "חמישי", time: "18:30 - 20:00", dayIndex: 4, startTime: "18:30", endTime: "20:00", room: "אולם מרכזי", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940807", altCode: "394807", name: "חינוך גופני - כושר גופני מעורב", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "mixed_fitness", name: "כושר גופני מעורב", day: "ראשון", time: "12:30 - 14:00", dayIndex: 0, startTime: "12:30", endTime: "14:00", room: "מרכז הספורט", note: "חובת נוכחות" },
                    { id: "mixed_core", name: "אימון Core וחיזוק", day: "רביעי", time: "10:30 - 12:00", dayIndex: 3, startTime: "10:30", endTime: "12:00", room: "סטודיו 2", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940820", altCode: "394820", name: "חינוך גופני - תנועה, יציבה ומחול", credits: 1.0, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "dance_modern", name: "מחול מודרני ועכשווי", day: "רביעי", time: "14:30 - 16:00", dayIndex: 3, startTime: "14:30", endTime: "16:00", room: "סטודיו מחול", note: "חובת נוכחות" },
                    { id: "dance_salsa", name: "סלסה וריקודי עמים", day: "שני", time: "20:00 - 21:30", dayIndex: 1, startTime: "20:00", endTime: "21:30", room: "אודיטוריום קנדה", note: "חובת נוכחות" },
                    { id: "dance_posture", name: "תנועה ויציבה טיפולית", day: "שלישי", time: "10:30 - 12:00", dayIndex: 2, startTime: "10:30", endTime: "12:00", room: "סטודיו 2", note: "חובת נוכחות" }
                ]
            },
            {
                code: "03940902", altCode: "394902", name: "נבחרות ספורט אס״א טכניון", credits: 1.5, type: "sports", list: "SPORTS", prereqs: [],
                clubs: [
                    { id: "asa_varsity", name: "נבחרות אס״א טכניון", day: "לפי ענף", time: "אימונים שבועיים", room: "מרכז הספורט הטכניוני", note: "חובת נוכחות והשתתפות בתחרויות אס״א" }
                ]
            }
        ],

        // קורסי מל״ג ולימודים הומניסטיים (Technion Humanities & Social Sciences)
        MALAG: [
            // פעילות צבאית ונבחרות ייצוגיות (טירונות עתודאים ופורמולה טכניון)
            { code: "00920001", altCode: "920001", name: "טירונות עתודאים", credits: 2.0, type: "free", list: "MALAG", isBinaryPass: true, prereqs: [], note: "מוכר לעתודאים כ-2 נק״ז בינארי לתואר כבחירה חופשית" },
            { code: "00340091", altCode: "034091", name: "פעילות בנבחרת פורמולה א'", credits: 2.0, type: "free", list: "MALAG", isBinaryPass: true, prereqs: [], note: "מסלול בחירה חופשית - 2 נק״ז בינארי לסמסטר פעיל בנבחרת הפורמולה (שנה א׳ ואילך)" },
            { code: "00340092", altCode: "034092", name: "פעילות בנבחרת פורמולה ב'", credits: 2.0, type: "free", list: "MALAG", isBinaryPass: true, prereqs: [], note: "מסלול בחירה חופשית - 2 נק״ז בינארי לסמסטר פעיל בנבחרת הפורמולה" },
            { code: "00340093", altCode: "034093", name: "פעילות בנבחרת פורמולה ג'", credits: 2.0, type: "free", list: "MALAG", isBinaryPass: true, prereqs: [], note: "מסלול בחירה חופשית - 2 נק״ז בינארי לסמסטר פעיל בנבחרת הפורמולה" },
            { code: "00340384", altCode: "034384", name: "פרויקט גמר - פורמולה SAE 1", credits: 3.0, type: "final_project", prereqs: ["00340054", "00340371"], note: "מסלול פרויקט תכן הנדסי שנה ד׳ בנבחרת הפורמולה (סמסטר א׳ - 3 נק״ז)" },
            { code: "00340385", altCode: "034385", name: "פרויקט גמר - פורמולה SAE 2", credits: 3.0, type: "final_project", prereqs: ["00340384"], note: "מסלול פרויקט תכן הנדסי שנה ד׳ בנבחרת הפורמולה (סמסטר ב׳ - 3 נק״ז)" },
            { code: "03240262", altCode: "324262", name: "מל״ג - תולדות הפילוסופיה והמדע בעת החדשה", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שני", time: "16:30 - 18:30", dayIndex: 1, startTime: "16:30", endTime: "18:30", room: "טאוב 1" } },
            { code: "03240265", altCode: "324265", name: "מל״ג - אקו-פילוסופיה: חשיבה סביבתית", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שני", time: "14:30 - 16:30", dayIndex: 1, startTime: "14:30", endTime: "16:30", room: "אולמן 302" } },
            { code: "03240269", altCode: "324269", name: "מל״ג - אתיקה בפעולה", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שלישי", time: "16:30 - 18:30", dayIndex: 2, startTime: "16:30", endTime: "18:30", room: "אולמן 502" } },
            { code: "03240292", altCode: "324292", name: "מל״ג - משפט, שוויון וצדק חברתי", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "רביעי", time: "14:30 - 16:30", dayIndex: 3, startTime: "14:30", endTime: "16:30", room: "סגו 201" } },
            { code: "03240305", altCode: "324305", name: "מל״ג - היסטוריה של המדע והטכנולוגיה", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "חמישי", time: "10:30 - 12:30", dayIndex: 4, startTime: "10:30", endTime: "12:30", room: "טאוב 2" } },
            { code: "03240442", altCode: "324442", name: "מל״ג - משפט העבודה בישראל", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "ראשון", time: "14:30 - 16:30", dayIndex: 0, startTime: "14:30", endTime: "16:30", room: "אולמן 401" } },
            { code: "03240445", altCode: "324445", name: "מל״ג - הסתגלות למצבי לחץ וקבלת החלטות", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "חמישי", time: "12:30 - 14:30", dayIndex: 4, startTime: "12:30", endTime: "14:30", room: "אולמן 301" } },
            { code: "03240452", altCode: "324452", name: "מל״ג - מעקב וטכנולוגיה: תיאוריה ואתיקה", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שלישי", time: "14:30 - 16:30", dayIndex: 2, startTime: "14:30", endTime: "16:30", room: "אולמן 304" } },
            { code: "03240454", altCode: "324454", name: "מל״ג - מבוא לפילוסופיה של המדע", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "ראשון", time: "16:30 - 18:30", dayIndex: 0, startTime: "16:30", endTime: "18:30", room: "טאוב 3" } },
            { code: "03240463", altCode: "324463", name: "מל״ג - היסטוריה של המזרח התיכון", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שני", time: "12:30 - 14:30", dayIndex: 1, startTime: "12:30", endTime: "14:30", room: "סגו 302" } },
            { code: "03240473", altCode: "324473", name: "מל״ג - מבנה חדשנות מדעית ושינוי פרדיגמה", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "רביעי", time: "16:30 - 18:30", dayIndex: 3, startTime: "16:30", endTime: "18:30", room: "טאוב 1" } },
            { code: "03240474", altCode: "324474", name: "מל״ג - אתיקה: יסודות, נורמה ויישום", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "חמישי", time: "14:30 - 16:30", dayIndex: 4, startTime: "14:30", endTime: "16:30", room: "אולמן 502" } },
            { code: "03240478", altCode: "324478", name: "מל״ג - תכנון וניהול קריירה למהנדסים", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "ראשון", time: "12:30 - 14:30", dayIndex: 0, startTime: "12:30", endTime: "14:30", room: "סגו 101" } },
            { code: "03240250", altCode: "324250", name: "מל״ג - עיצוב גרפי ותקשורת חזותית", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שלישי", time: "10:30 - 12:30", dayIndex: 2, startTime: "10:30", endTime: "12:30", room: "ארכיטקטורה 2" } },
            { code: "03240235", altCode: "324235", name: "מל״ג - תקשורת בין-אישית באמצעי תיאטרון", credits: 1.5, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שני", time: "18:30 - 20:00", dayIndex: 1, startTime: "18:30", endTime: "20:00", room: "אודיטוריום קנדה" } },
            { code: "03240446", altCode: "324446", name: "מל״ג - מבוא להיסטוריה של מוזיקת הג'אז", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "רביעי", time: "18:30 - 20:30", dayIndex: 3, startTime: "18:30", endTime: "20:30", room: "קנדה 1" } },
            { code: "03240282", altCode: "324282", name: "מל״ג - פוליטיקה של זהויות בישראל", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "חמישי", time: "16:30 - 18:30", dayIndex: 4, startTime: "16:30", endTime: "18:30", room: "טאוב 2" } },
            { code: "03240299", altCode: "324299", name: "מל״ג - טרור, ג'יהאד ותגובה מדינית", credits: 2.0, type: "humanities", list: "MALAG", prereqs: [], scheduleSlot: { day: "שלישי", time: "18:30 - 20:30", dayIndex: 2, startTime: "18:30", endTime: "20:30", room: "סגו 201" } }
        ]
    };

    // Helper: Build course lookup index by code and altCode (including normalized formats)
    const ALL_COURSES_MAP = {};
    function indexCourse(c) {
        if (!c || !c.code) return;
        ALL_COURSES_MAP[c.code] = c;
        if (c.altCode) ALL_COURSES_MAP[c.altCode] = c;
        const norm1 = c.code.replace(/^0+/, '');
        if (norm1) ALL_COURSES_MAP[norm1] = c;
        if (c.altCode) {
            const norm2 = c.altCode.replace(/^0+/, '');
            if (norm2) ALL_COURSES_MAP[norm2] = c;
        }
    }
    // Barak (ברקים - תואר מזורז ומצטיינים) Accelerated Layout (7 Semesters)
    const SUGGESTED_BARAK_SYLLABUS = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (ברקים)",
            targetCredits: 22.0,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "02340128", altCode: "234128", name: "שפת פייתון", credits: 4.0, type: "mandatory", prereqs: [] },
                { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳ (ברקים)",
            targetCredits: 23.5,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065", "01140071"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "01140075", altCode: "114075", name: "פיזיקה 2ממ'", credits: 5.0, type: "mandatory", prereqs: ["01140071", "01040043"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳ (ברקים)",
            targetCredits: 22.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["02340128", "01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140071", "01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳ (ברקים)",
            targetCredits: 23.5,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340041", altCode: "034041", name: "מעבר חום", credits: 4.0, type: "mandatory", prereqs: ["00340035", "00340055", "01040228"] },
                { code: "00340040", altCode: "034040", name: "מבוא לבקרה", credits: 3.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340054", altCode: "034054", name: "תכן מכני 1 מ'", credits: 4.0, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340058", altCode: "034058", name: "הסתברות וסטטיסטיקה מה' מכ'", credits: 3.0, type: "mandatory", prereqs: ["01040043"] }
            ]
        },
        {
            semester: 5,
            title: "שנה ג׳ - סמסטר ה׳ (ברקים)",
            targetCredits: 20.0,
            courses: [
                { code: "01140032", altCode: "114032", name: "מעב' לפיזיקה 1 ח", credits: 1.0, type: "mandatory", prereqs: ["01140071", "01140075"] },
                { code: "00340051", altCode: "034051", name: "דינמיקה ומכניקה של תנודות", credits: 3.0, type: "mandatory", prereqs: ["00340010", "00340032"] },
                { code: "00340060", altCode: "034060", name: "מבוא למכטרוניקה והנע חשמלי", credits: 4.0, type: "mandatory", prereqs: ["00340032"] },
                { code: "00340057", altCode: "034057", name: "מעבדה מתקדמת הנ. מכונות", credits: 4.0, type: "mandatory", prereqs: ["00340041", "00340051", "01140032"] },
                { code: "00340371", altCode: "034371", name: "פרויקט תכן לייצור", credits: 2.5, type: "mandatory", prereqs: ["00340030", "00340054"] }
            ]
        },
        {
            semester: 6,
            title: "שנה ג׳ - סמסטר ו׳ (ברקים)",
            targetCredits: 18.0,
            courses: [
                { code: "00340379", altCode: "034379", name: "פרויקט גמר הנדסי 1", credits: 3.0, type: "final_project", prereqs: ["00340054", "00340371"] },
                { code: "00340382", altCode: "034382", name: "מתודולוגיות פיתוח הנדסי 1", credits: 0.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 7,
            title: "שנה ד׳ - סמסטר ז׳ (ברקים)",
            targetCredits: 18.0,
            courses: [
                { code: "00340380", altCode: "034380", name: "פרויקט גמר הנדסי 2", credits: 3.0, type: "final_project", prereqs: ["00340379"] },
                { code: "00340383", altCode: "034383", name: "מתודולוגיות פיתוח הנדסי 2", credits: 0.5, type: "mandatory", prereqs: ["00340382"] }
            ]
        }
    ];

    // Index all catalogs
    SUGGESTED_MANDATORY_SYLLABUS_2024.forEach(sem => {
        (sem.courses || []).forEach(indexCourse);
    });
    SUGGESTED_MANDATORY_SYLLABUS_2027.forEach(sem => {
        (sem.courses || []).forEach(indexCourse);
    });
    SUGGESTED_MANDATORY_SYLLABUS_2026.forEach(sem => {
        (sem.courses || []).forEach(indexCourse);
    });
    SUGGESTED_BARAK_SYLLABUS.forEach(sem => {
        (sem.courses || []).forEach(indexCourse);
    });
    if (typeof ELECTIVE_CATALOG !== 'undefined') {
        Object.values(ELECTIVE_CATALOG).forEach(list => {
            (list || []).forEach(indexCourse);
        });
    }

    // Default authentic Technion Mechanical Engineering syllabus (with Python, Chemistry Lab, Physics 2 in Sem 3)
    const SUGGESTED_MANDATORY_SYLLABUS = SUGGESTED_MANDATORY_SYLLABUS_2026;

    const CURRICULUM_CATALOGS = {
        year_2026: {
            id: 'year_2026',
            title: 'תוכנית הלימודים הרשמית - הנדסת מכונות (תשפ״ה/תשפ״ו)',
            description: 'קטלוג הלימודים הרשמי והעדכני של הפקולטה להנדסת מכונות (כולל שפת פייתון ופיזיקה 1 בסמסטר א׳, מעבדה בכימיה בסמסטר ב׳, פיזיקה 2 ויוגה בסמסטר ג׳)',
            syllabus: SUGGESTED_MANDATORY_SYLLABUS_2026,
            mandatoryCredits: 107.0
        },
        year_2027: {
            id: 'year_2027',
            title: 'תוכנית הלימודים - שנתון תשפ״ז',
            description: 'קטלוג רישום עדכני עבור סטודנטים להנדסת מכונות',
            syllabus: SUGGESTED_MANDATORY_SYLLABUS_2026,
            mandatoryCredits: 107.0
        },
        year_2025: {
            id: 'year_2025',
            title: 'תוכנית הלימודים - שנתון תשפ״ה',
            description: 'קטלוג רישום למתחילים בתשפ״ה',
            syllabus: SUGGESTED_MANDATORY_SYLLABUS_2026,
            mandatoryCredits: 107.0
        },
        year_2024: {
            id: 'year_2024',
            title: 'תוכנית הלימודים - שנתון תשפ״ד',
            description: 'סילבוס קלאסי למתחילים בתשפ״ד',
            syllabus: SUGGESTED_MANDATORY_SYLLABUS_2026,
            mandatoryCredits: 107.0
        },
        barak: {
            id: 'barak',
            title: 'מסלול ברקים',
            description: 'סילבוס קבוע ומואץ לתלמידי תוכנית ברקים (7 סמסטרים)',
            syllabus: SUGGESTED_BARAK_SYLLABUS,
            mandatoryCredits: 120.5
        }
    };

    // ==========================================================================
    // Seasonal Course Equivalencies (חורף / אביב)
    // ==========================================================================
    const SEASONAL_COURSE_MAPPINGS = {
        '01040041': { winter: '01040041', spring: '01040042', altSpring: '01040165', name: "חדו\"א 1מ'" },
        '01040042': { winter: '01040041', spring: '01040042', altSpring: '01040165', name: "חדו\"א 1מ'" },
        '01040165': { winter: '01040041', spring: '01040042', altSpring: '01040165', name: "חדו\"א 1מ'" },
        '104041':   { winter: '01040041', spring: '01040042', altSpring: '01040165', name: "חדו\"א 1מ'" },
        '104042':   { winter: '01040041', spring: '01040042', altSpring: '01040165', name: "חדו\"א 1מ'" },

        '01040043': { winter: '01040044', spring: '01040043', altWinter: '01040166', name: "חדו\"א 2מ'" },
        '01040044': { winter: '01040044', spring: '01040043', altWinter: '01040166', name: "חדו\"א 2מ'" },
        '01040166': { winter: '01040044', spring: '01040043', altWinter: '01040166', name: "חדו\"א 2מ'" },
        '104043':   { winter: '01040044', spring: '01040043', altWinter: '01040166', name: "חדו\"א 2מ'" },
        '104044':   { winter: '01040044', spring: '01040043', altWinter: '01040166', name: "חדו\"א 2מ'" },

        '01040065': { winter: '01040065', spring: '01040064', name: "אלגברה 1 מ'" },
        '01040064': { winter: '01040065', spring: '01040064', name: "אלגברה 1 מ'" },
        '104065':   { winter: '01040065', spring: '01040064', name: "אלגברה 1 מ'" },
        '104064':   { winter: '01040065', spring: '01040064', name: "אלגברה 1 מ'" },

        '01040131': { winter: '01040135', spring: '01040131', name: "משוואות דיפרנציאליות רגילות/ח" },
        '01040135': { winter: '01040135', spring: '01040131', name: "משוואות דיפרנציאליות רגילות/ח" },
        '104131':   { winter: '01040135', spring: '01040131', name: "משוואות דיפרנציאליות רגילות/ח" },
        '104135':   { winter: '01040135', spring: '01040131', name: "משוואות דיפרנציאליות רגילות/ח" },

        '01040228': { winter: '01040228', spring: '01040218', name: "מד\"ח מ'" },
        '01040218': { winter: '01040228', spring: '01040218', name: "מד\"ח מ'" },
        '104228':   { winter: '01040228', spring: '01040218', name: "מד\"ח מ'" },
        '104218':   { winter: '01040228', spring: '01040218', name: "מד\"ח מ'" },

        '00340030': { winter: '00340043', spring: '00340030', name: "תהליכי ייצור" },
        '00340043': { winter: '00340043', spring: '00340030', name: "תהליכי ייצור" },
        '034030':   { winter: '00340043', spring: '00340030', name: "תהליכי ייצור" }
    };

    // ==========================================================================
    // Course Term Offerings & Annual Restrictions (חד-שנתי / בינלאומי / קיץ)
    // ==========================================================================
    const COURSE_TERM_OFFERINGS = {
        '00340010': { terms: ['spring', 'summer', 'winter_intl'], label: 'אביב/קיץ (חורף: בינלאומי)', note: 'מוצע בסמסטר אביב וקיץ לכלל הסטודנטים, ובסמסטר חורף לסטודנטים בינלאומיים' },
        '034010':   { terms: ['spring', 'summer', 'winter_intl'], label: 'אביב/קיץ (חורף: בינלאומי)', note: 'מוצע בסמסטר אביב וקיץ לכלל הסטודנטים, ובסמסטר חורף לסטודנטים בינלאומיים' },
        '00350026': { terms: ['winter'], label: 'חורף בלבד', note: 'מוצע בסמסטר חורף בלבד ואינו נפתח בקיץ' },
        '035026':   { terms: ['winter'], label: 'חורף בלבד', note: 'מוצע בסמסטר חורף בלבד ואינו נפתח בקיץ' },
        '00340057': { terms: ['spring'], label: 'אביב בלבד', note: 'מעבדה מתקדמת – מוצעת באביב בלבד ואינה נפתחת בקיץ' },
        '034057':   { terms: ['spring'], label: 'אביב בלבד', note: 'מעבדה מתקדמת – מוצעת באביב בלבד ואינה נפתחת בקיץ' },
        '00340371': { terms: ['spring'], label: 'אביב בלבד', note: 'פרויקט תכן לייצור – מוצע באביב בלבד ואינו נפתח בקיץ' },
        '034371':   { terms: ['spring'], label: 'אביב בלבד', note: 'פרויקט תכן לייצור – מוצע באביב בלבד ואינו נפתח בקיץ' },
        '00340382': { terms: ['winter'], label: 'חורף בלבד', note: 'מתודולוגיות פיתוח 1 – מוצע בחורף בלבד ואינו נפתח בקיץ' },
        '034382':   { terms: ['winter'], label: 'חורף בלבד', note: 'מתודולוגיות פיתוח 1 – מוצע בחורף בלבד ואינו נפתח בקיץ' },
        '00340383': { terms: ['spring'], label: 'אביב בלבד', note: 'מתודולוגיות פיתוח 2 – מוצע באביב בלבד ואינו נפתח בקיץ' },
        '034383':   { terms: ['spring'], label: 'אביב בלבד', note: 'מתודולוגיות פיתוח 2 – מוצע באביב בלבד ואינו נפתח בקיץ' },
        '01140032': { terms: ['winter'], label: 'חורף בלבד', note: 'מעבדה לפיזיקה 1ח – מוצעת בחורף בלבד ואינה נפתחת בקיץ' },
        '114032':   { terms: ['winter'], label: 'חורף בלבד', note: 'מעבדה לפיזיקה 1ח – מוצעת בחורף בלבד ואינה נפתחת בקיץ' },
        '01140039': { terms: ['spring'], label: 'אביב בלבד', note: 'מעבדה לפיזיקה 1מח – מוצעת באביב בלבד ואינה נפתחת בקיץ' },
        '114039':   { terms: ['spring'], label: 'אביב בלבד', note: 'מעבדה לפיזיקה 1מח – מוצעת באביב בלבד ואינה נפתחת בקיץ' }
    };

    // ==========================================================================
    // Technion Summer Semester Availability Catalog & Verifier (סמסטר קיץ)
    // ==========================================================================
    const SUMMER_CONFIRMED_COURSES = new Set([
        // Math & Basic Sciences
        '104041', '01040041', // חדו"א 1מ' 1
        '104043', '01040043', // חדו"א 2מ' 1
        '104065', '01040065', // אלגברה 1 מ'
        '104016', '01040016', // אלגברה לינארית מ'
        '104019', '01040019', // אלגברה לינארית
        '104131', '01040131', // משוואות דיפרנציאליות רגילות/ח
        '104228', '01040228', // מד"ח מ'
        '104215', '01040215', // פונקציות מרוכבות א'
        '104034', '01040034', // מבוא להסתברות
        '034058', '00340058', // הסתברות וסטטיסטיקה מה' מכ'
        '094411', '00940411', // הסתברות
        '094412', '00940412', // הסתברות וסטטיסטיקה
        // Physics & Chemistry
        '114051', '01140051', '114071', '01140071', '114055', '01140055', '114077', '01140077', // פיזיקה 1 (כל הגרסאות)
        '114052', '01140052', '114075', '01140075', '114078', '01140078', // פיזיקה 2 (כל הגרסאות)
        '125001', '01250001', // כימיה כללית
        // CS & Programming
        '234128', '02340128', // שפת פייתון
        '234114', '02340114', '234117', '02340117', '234124', '02340124', // מבוא למדעי המחשב / C
        // Core Mechanical Engineering (Retakes & Foundations available in Summer)
        '034028', '00340028', // מכניקת מוצקים 1
        '034010', '00340010', // דינמיקה
        '034035', '00340035', // תרמודינמיקה 1
        '034056', '00340056', // מבוא לחישוב מדעי והנדסי
        '034053', '00340053', // מכניקת מוצקים 2 מורחב
        '034055', '00340055', // תורת הזרימה 1 מורחב
        '034032', '00340032', // מערכות ליניאריות
        '034040', '00340040', // מבוא לבקרה
        '314533', '03140533', // מבוא להנדסת חומרים מ'
        '034045', '00340045', // החלטות כלכליות
        '014603', '00140603', // כלכלה הנדסית
        // General Science & English
        '134058', '01340058', // ביולוגיה 1
        '324033', '03240033', // אנגלית טכנית
        '324015', '03240015'  // אנגלית מתקדמים ב'
    ]);

    const getCourseKeys = (c) => {
        if (!c) return [];
        const res = [c];
        const clean = c.replace(/[-\s]/g, '');
        if (clean && clean !== c) res.push(clean);
        const stripped = clean.replace(/^0+/, '');
        if (stripped && stripped !== clean) res.push(stripped);
        if (/^\d{8}$/.test(clean) && clean.startsWith('0')) {
            const c6 = clean.slice(1, 4) + clean.slice(5);
            res.push(c6);
            const sc6 = c6.replace(/^0+/, '');
            if (sc6 !== c6) res.push(sc6);
        }
        return res;
    };

    function isCourseOfferedInSummer(courseCode, courseObj) {
        if (!courseCode && !courseObj) return { offered: true, note: '' };
        const code = String(courseCode || (courseObj && courseObj.code) || '').trim();
        const altCode = String((courseObj && courseObj.altCode) || '').trim();

        const keys = [...new Set([...getCourseKeys(code), ...getCourseKeys(altCode)])];

        // 1. Explicit term offerings in COURSE_TERM_OFFERINGS
        for (const k of keys) {
            if (COURSE_TERM_OFFERINGS[k]) {
                const terms = COURSE_TERM_OFFERINGS[k].terms || [];
                if (terms.includes('summer') || terms.includes('both')) {
                    return { offered: true, note: 'מוצע בסמסטר קיץ' };
                }
                if (!terms.includes('summer')) {
                    return { 
                        offered: false, 
                        note: COURSE_TERM_OFFERINGS[k].note || 'מוצע בסמסטרי חורף/אביב בלבד ואינו נפתח בקיץ' 
                    };
                }
            }
        }

        // 2. Whitelist of confirmed summer courses (Foundation & Core ME)
        if (keys.some(k => SUMMER_CONFIRMED_COURSES.has(k))) {
            return { offered: true, note: 'קורס זה נפתח באופן קבוע בסמסטר קיץ' };
        }

        // 3. Sports courses (394xxx or 0394xxxx)
        if (keys.some(k => k.startsWith('394') || k.startsWith('0394'))) {
            return { offered: true, note: 'קורסי חינוך גופני מוצעים בסמסטר קיץ' };
        }

        // 4. MALAG / Humanities / Free Electives
        if (courseObj && (courseObj.type === 'malag' || courseObj.type === 'humanities' || courseObj.type === 'free' || courseObj.isMalag || courseObj.list === 'MALAG' || keys.some(k => k.startsWith('324') || k.startsWith('0324')))) {
            return { offered: true, note: 'קורסי מל״ג ובחירה חופשית מוצעים בסמסטר קיץ' };
        }

        // 5. Laboratories (Always closed in summer in Technion)
        const name = (courseObj && (courseObj.name || courseObj.title)) || '';
        const isLab = name.includes('מעבדה') ||
                      keys.some(k => k.startsWith('0344') || k.startsWith('344') || ['114032', '01140032', '114039', '01140039', '034057', '00340057'].includes(k));
        if (isLab) {
            return { offered: false, note: 'מעבדות אינן מוצעות בסמסטר קיץ בטכניון' };
        }

        // 6. Capstone / Projects / Design (Always closed in summer)
        const isProject = keys.some(k => ['034371', '00340371', '034382', '00340382', '034383', '00340383', '034054', '00340054', '034016', '00340016', '035026', '00350026'].includes(k)) ||
                          name.includes('פרויקט');
        if (isProject) {
            return { offered: false, note: 'פרויקטי תכן וגמר אינם מוצעים בסמסטר קיץ' };
        }

        // 6. Whitelist of confirmed summer courses (Foundation & Core ME)
        if (keys.some(k => SUMMER_CONFIRMED_COURSES.has(k))) {
            return { offered: true, note: 'קורס זה נפתח באופן קבוע בסמסטר קיץ' };
        }

        // 7. Known mandatory advanced ME courses NOT in summer
        const NOT_IN_SUMMER_ME = new Set([
            '034061', '00340061', // גרפיקה ותכנון הנדסי
            '034030', '00340030', '034043', '00340043', // תהליכי ייצור
            '034041', '00340041', // מעבר חום
            '034022', '00340022', // מבוא למכטרוניקה
            '034034', '00340034', // הנע חשמלי
            '034051', '00340051'  // דינמיקה ותנודות
        ]);
        if (keys.some(k => NOT_IN_SUMMER_ME.has(k))) {
            return { offered: false, note: 'קורס חובה מתקדם זה נלמד בסמסטרי חורף/אביב בלבד ואינו מוצע בקיץ' };
        }

        // 8. Advanced Technical Electives (Lists A-E)
        if (courseObj && (courseObj.list === 'A' || courseObj.list === 'B' || courseObj.list === 'C')) {
            return { offered: false, note: 'קורסי בחירה מתקדמים בפקולטה אינם מוצעים בסמסטר קיץ' };
        }

        // Fallback for general faculty courses
        return { offered: false, note: 'לפי תוכנית הלימודים בטכניון, קורס זה לרוב אינו מוצע בסמסטר קיץ' };
    }

    function isCourseOfferedInSemester(courseCode, courseObj, targetSemester, isIntl) {
        if (!courseCode && !courseObj) return { offered: true, note: '' };
        const code = String(courseCode || (courseObj && courseObj.code) || '').trim();
        const altCode = String((courseObj && courseObj.altCode) || '').trim();
        const semNum = Number(targetSemester);

        const keys = [...new Set([...getCourseKeys(code), ...getCourseKeys(altCode)])];

        // 1. Summer semester check
        const isSummer = (semNum % 1 !== 0) || semNum === 2.5 || semNum === 4.5 || semNum === 6.5 || semNum === 8.5;
        if (isSummer) {
            return isCourseOfferedInSummer(code, courseObj);
        }

        // 2. Winter vs Spring
        const isWinter = (semNum % 2 === 1);
        const isSpring = (semNum % 2 === 0);

        for (const k of keys) {
            if (COURSE_TERM_OFFERINGS[k]) {
                const terms = COURSE_TERM_OFFERINGS[k].terms || [];
                let allowed = false;
                if (terms.includes('both')) allowed = true;
                if (isWinter && (terms.includes('winter') || (isIntl && terms.includes('winter_intl')))) allowed = true;
                if (isSpring && terms.includes('spring')) allowed = true;

                if (!allowed) {
                    if (isWinter && terms.includes('winter_intl') && !isIntl) {
                        return {
                            offered: false,
                            note: 'מוצע בסמסטר חורף לסטודנטים בינלאומיים בלבד (באביב/קיץ לכלל הסטודנטים)'
                        };
                    }
                    return {
                        offered: false,
                        note: COURSE_TERM_OFFERINGS[k].note || `אינו מוצע בסמסטר ${isWinter ? 'חורף' : 'אביב'}`
                    };
                }
                return { offered: true, note: '' };
            }
        }

        return { offered: true, note: '' };
    }

    // Expose to window / global
    
    // Helper: Check schedule conflict between a candidate meeting and active semester courses
    function checkMeetingConflict(candidateMeeting, semesterCourses) {
        if (!candidateMeeting || !candidateMeeting.startTime || !candidateMeeting.endTime || candidateMeeting.dayIndex === undefined) {
            return { hasConflict: false };
        }

        const candDay = candidateMeeting.dayIndex;
        const parseMins = (t) => {
            if (!t) return 0;
            const p = t.split(':').map(Number);
            return (p[0] || 0) * 60 + (p[1] || 0);
        };
        const candStart = parseMins(candidateMeeting.startTime);
        const candEnd = parseMins(candidateMeeting.endTime);

        const groupsCatalog = (global.TimetableGenerator && global.TimetableGenerator.catalog) || {};

        let userAnchors = {};
        try {
            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem('ast_timetable_user_anchors');
                if (stored) userAnchors = JSON.parse(stored);
            }
        } catch (e) {}

        let potentialConflict = null;

        for (const c of (semesterCourses || [])) {
            const code = c.code || c.id;
            if (candidateMeeting.courseCode && (code === candidateMeeting.courseCode || String(code).replace(/^0+/, '') === String(candidateMeeting.courseCode).replace(/^0+/, ''))) {
                continue;
            }

            const clean = String(code).replace(/^0+/, '');
            const cInfo = groupsCatalog[code] || groupsCatalog[clean];
            if (cInfo && cInfo.slots) {
                for (const slot of cInfo.slots) {
                    const slotKey = `${code}_${slot.slotType || 'slot'}`;
                    const slotKeyClean = `${clean}_${slot.slotType || 'slot'}`;
                    const anchor = userAnchors[slotKey] || userAnchors[slotKeyClean];

                    let optionsToCheck = slot.options || [];
                    let isAnchored = false;
                    if (anchor && anchor.groupId) {
                        const anchoredOpt = optionsToCheck.find(o => String(o.groupId) === String(anchor.groupId));
                        if (anchoredOpt) {
                            optionsToCheck = [anchoredOpt];
                            isAnchored = true;
                        }
                    }

                    let allOptionsConflict = true;
                    let conflictingMeetingInfo = null;

                    for (const opt of optionsToCheck) {
                        let optConflicts = false;
                        for (const m of (opt.meetings || [])) {
                            if (m.dayIndex === candDay) {
                                const mStart = parseMins(m.startTime);
                                const mEnd = parseMins(m.endTime);
                                if (Math.max(candStart, mStart) < Math.min(candEnd, mEnd)) {
                                    optConflicts = true;
                                    conflictingMeetingInfo = {
                                        courseName: c.name || cInfo.name || code,
                                        slotName: slot.slotName || '',
                                        groupId: opt.groupId,
                                        time: `${m.dayName || ''} ${m.startTime}-${m.endTime}`,
                                        room: m.room || opt.room || ''
                                    };
                                    break;
                                }
                            }
                        }
                        if (!optConflicts) {
                            allOptionsConflict = false;
                        }
                    }

                    if (conflictingMeetingInfo) {
                        if (isAnchored || allOptionsConflict) {
                            return {
                                hasConflict: true,
                                isDefinite: true,
                                conflictingCourse: conflictingMeetingInfo.courseName,
                                conflictingSlot: `${conflictingMeetingInfo.slotName} (קבוצה ${conflictingMeetingInfo.groupId})`,
                                conflictingTime: conflictingMeetingInfo.time,
                                room: conflictingMeetingInfo.room
                            };
                        } else if (!potentialConflict) {
                            potentialConflict = {
                                hasConflict: true,
                                isDefinite: false,
                                conflictingCourse: conflictingMeetingInfo.courseName,
                                conflictingSlot: `${conflictingMeetingInfo.slotName} (קבוצה ${conflictingMeetingInfo.groupId})`,
                                conflictingTime: conflictingMeetingInfo.time,
                                room: conflictingMeetingInfo.room,
                                note: 'קיימת קבוצה חלופית שאינה מתנגשת'
                            };
                        }
                    }
                }
            }
        }

        if (potentialConflict) {
            return potentialConflict;
        }

        return { hasConflict: false };
    }

    global.PLANNER_CATALOG = {
        DEGREE_RULES: DEGREE_RULES,
        SUGGESTED_MANDATORY_SYLLABUS: SUGGESTED_MANDATORY_SYLLABUS,
        SUGGESTED_MANDATORY_SYLLABUS_2027: SUGGESTED_MANDATORY_SYLLABUS_2027,
        SUGGESTED_MANDATORY_SYLLABUS_2024: SUGGESTED_MANDATORY_SYLLABUS_2024,
        SUGGESTED_MANDATORY_SYLLABUS_2026: SUGGESTED_MANDATORY_SYLLABUS_2026,
        SUGGESTED_BARAK_SYLLABUS: SUGGESTED_BARAK_SYLLABUS,
        CURRICULUM_CATALOGS: CURRICULUM_CATALOGS,
        ELECTIVE_CATALOG: ELECTIVE_CATALOG,
        ALL_COURSES_MAP: ALL_COURSES_MAP,
        SEASONAL_COURSE_MAPPINGS: SEASONAL_COURSE_MAPPINGS,
        COURSE_TERM_OFFERINGS: COURSE_TERM_OFFERINGS,
        SUMMER_CONFIRMED_COURSES: SUMMER_CONFIRMED_COURSES,
        isCourseOfferedInSummer: isCourseOfferedInSummer,
        checkMeetingConflict: checkMeetingConflict,
        isCourseOfferedInSemester: isCourseOfferedInSemester
    };

})(typeof window !== 'undefined' ? window : global);
