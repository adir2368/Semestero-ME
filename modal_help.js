// Semestero ME - Interactive Modal & Feature Help Guide Engine (v2.2.1)
// Provides an interactive '❓ מה עושים כאן?' question mark button in every modal and pane
// to explain all features, buttons, and workflows for students who feel lost.

(function(window) {
    'use strict';

    const MODAL_HELP_REGISTRY = {
        'course-modal': {
            title: 'כרטיס קורס: ציונים, סמסטר ודרישות קדם',
            purpose: 'כאן מנהלים את כל המידע על הקורס: ציונים סופיים, הזזת הקורס לסמסטר אחר, בדיקת עומס ודרישות קדם.',
            sections: [
                {
                    icon: '📅',
                    title: 'סמסטר מתוכנן ושינוי מיקום (💾 שמור שינוי)',
                    desc: 'בחירת הסמסטר בו תלמד את הקורס. לחיצה על "💾 שמור שינוי" מעבירה את הקורס בעץ ובתוכנית הלימודים ושומרת את המיקום מיד.'
                },
                {
                    icon: '🎓',
                    title: 'ציונים והרכב הציון הסופי (מחשבון שקלול)',
                    desc: 'הזנת ציון מבחן, אחוז משקל וציון שאר המטלות/מגן. לחיצה על "החל ציון ⚡" מחשבת את הציון המשוקלל ומעבירה אותו כציון סופי.'
                },
                {
                    icon: '📝',
                    title: 'הזנת ציון סופי רשמי',
                    desc: 'הציון הרשמי שמופיע בגיליון הציונים בטכניון ונכנס לחישוב הממוצע המצטבר (GPA).'
                },
                {
                    icon: '✅',
                    title: 'ציון עובר בינארי (Pass)',
                    desc: 'סמן כאן אם הקורס נותן נק״ז אך לא נכנס לממוצע (למשל פטור מילואים, שפות, ספורט או קורסים בציון בינארי).'
                },
                {
                    icon: '⚖️',
                    title: 'סרגל עומס וקושי (1 עד 5)',
                    desc: 'דירוג אישי של רמת הקושי וההשקעה השבועית בקורס לצורך חישוב מאזני העומס הסמסטריאלי.'
                },
                {
                    icon: '🔗',
                    title: 'דרישות קדם ושרשראות קורסים',
                    desc: 'לחיצה על הקורס בעץ מאירה את כל הקדמים שלו אחורה (בכחול/זהב) ואת הקורסים שהם תלויים בו קדימה (בירוק).'
                },
                {
                    icon: '📝',
                    title: 'מועדי בחינות רשמיים',
                    desc: 'מועדי א\' וב\' הרשמיים של המבחנים, זמני שעת הבחינה וקישורים רלוונטיים.'
                }
            ],
            tip: '💡 טיפ: אם שובצת מחדש בסמסטר אחר, שנה את הסמסטר בבורר ולחץ "שמור שינוי" — העץ יתעדכן מיד!'
        },

        'analytics-modal': {
            title: 'מרכז ביצועים, ממוצעים ואנליטיקת תואר',
            purpose: 'תמונת מצב אקדמית מקיפה על ההתקדמות שלך בתואר בהנדסת מכונות.',
            sections: [
                {
                    icon: '📈',
                    title: 'גרף מסלול ממוצעים סמסטריאלי',
                    desc: 'מציג את התפתחות הממוצע שלך בכל סמסטר ואת הממוצע המצטבר. ריחוף מעל נקודה מציג פירוט מדויק.'
                },
                {
                    icon: '📊',
                    title: 'תרשים פילוח נק״ז לתואר',
                    desc: 'פילוח הנק״ז שצברת לפי קורסי חובה, בחירה פקולטית, בחירה חופשית ומדעים, מתוך דרישות התואר (155.5 / 157.5 נק״ז).'
                },
                {
                    icon: '📊',
                    title: 'התפלגות ציונים',
                    desc: 'פילוח הקורסים שעברת לפי מדרגות ציונים (מצויינות 90+, טוב מאוד 80-89, וכדומה).'
                },
                {
                    icon: '⚖️',
                    title: 'מדד עומס סמסטריאלי',
                    desc: 'מאזני עומס המשקללים שעות שבועיות, מעבדות, דוחות ותרגילי בית בכל סמסטר למניעת עומס יתר.'
                }
            ],
            tip: '💡 טיפ: לחץ על כל כרטיס מדד (KPI) כדי לסנן קורסים רלוונטיים באותה קטגוריה.'
        },

        'add-course-modal': {
            title: 'הוספת קורס אישי או עריכת קורס קיים',
            purpose: 'מאפשר להוסיף קורסי בחירה, קורסים מפקולטות אחרות, או לערוך פרטים של קורס שכבר קיים בעץ.',
            sections: [
                {
                    icon: '🔢',
                    title: 'מספר קורס (6 ספרות)',
                    desc: 'קוד הקורס בטכניון (לדוגמה 034013). המערכת תזהה אותו אוטומטית מול קטלוג הקורסים!'
                },
                {
                    icon: '⚡',
                    title: 'זיהוי נתונים אוטומטי',
                    desc: 'ברגע שתזין מספר קורס תקין, המערכת תמשוך לבד את שמו, מספר הנק״ז שלו ומועדי המבחנים.'
                },
                {
                    icon: '📅',
                    title: 'סמסטר מתוכנן',
                    desc: 'איזה סמסטר (א\' עד ח\') הקורס ישויך אליו בעץ ובתוכנית הלימודים.'
                },
                {
                    icon: '🔗',
                    title: 'דרישות קדם (בלוקים בודדים וחיפוש קל)',
                    desc: 'הוספת קדמים בעזרת חיפוש מהיר לפי שם או מספר קורס וניהול תגיות בלחיצה (✕ להסרה).'
                }
            ],
            tip: '💡 טיפ: לקורסי ספורט או פטור בינארי, סמן את התיבה "ציון בינארי (עובר ללא ממוצע)".'
        },

        'auth-modal': {
            title: 'חשבון סטודנט, פרופיל וסנכרון ענן',
            purpose: 'ניהול החשבון האישי שלך, גיבוי הנתונים בענן וסנכרון בזמן אמת בין המחשב לנייד.',
            sections: [
                {
                    icon: '☁️',
                    title: 'סנכרון ענן אוטומטי (Cloud Sync)',
                    desc: 'כל שינוי בתוכנית או בציונים נשמר בענן ומסתנכרן תוך שניות בין כל המכשירים המחוברים שלך.'
                },
                {
                    icon: '👤',
                    title: 'מצב אורח (Guest Mode)',
                    desc: 'שימוש במערכת ללא חשבון — הנתונים נשמרים מקומית במכשיר שלך בלבד (Local-First).'
                },
                {
                    icon: '🔐',
                    title: 'התחברות והרשמה מהירה',
                    desc: 'הרשמה פשוטה באמצעות שם וסיסמה לשמירת תוכנית הלימודים האישית שלך.'
                }
            ],
            tip: '💡 טיפ: מחובר גם מהטלפון וגם מהמחשב? השינויים מופיעים בזמן אמת בשני המכשירים!'
        },

        'site-analytics-modal': {
            title: 'סטטיסטיקת שימוש, משתמשים וכניסות אופליין',
            purpose: 'מעקב אחר פעילות המערכת, כמות הסטודנטים הרשומים והפעלות ללא חיבור אינטרנט.',
            sections: [
                {
                    icon: '👥',
                    title: 'משתמשים רשומים',
                    desc: 'כמות חשבונות הסטודנטים הפעילים הרשומים בענן המאובטח.'
                },
                {
                    icon: '📴',
                    title: 'כניסות בלי חיבור (אופליין)',
                    desc: 'כמות הפעמים שהאפליקציה (PWA) הופעלה במצב מנותק ללא חיבור רשת.'
                },
                {
                    icon: '👤',
                    title: 'כניסות ללא התחברות (אורחים)',
                    desc: 'סשנים של סטודנטים המשתמשים במערכת כאורחים ללא כניסה לחשבון.'
                },
                {
                    icon: '🌐',
                    title: 'סה״כ כניסות לאתר',
                    desc: 'כלל הסשנים והכניסות שבוצעו במערכת.'
                }
            ],
            tip: '💡 טיפ: לחץ על "רענן נתונים" כדי למשוך את הנתונים העדכניים ביותר ישירות מהענן.'
        },

        'moodle-sync-modal': {
            title: 'סנכרון Moodle הטכניון',
            purpose: 'משיכת מטלות, שיעורי בית, מועדי הגשות ומבחנים ישירות ממערכת ה-Moodle של הטכניון.',
            sections: [
                {
                    icon: '🔗',
                    title: 'קישור יומן Moodle (iCal / WebCal)',
                    desc: 'מדביקים כאן את הקישור מ-Moodle (לוח שנה ➔ ייצוא לוח שנה ➔ קבלת כתובת URL של לוח שנה).'
                },
                {
                    icon: '🔄',
                    title: 'סנכרון מטלות ללוח ה-Notion',
                    desc: 'כל שיעורי הבית ומטלות המודל מתווספים ישירות לסרגל המשימות עם זמני יעד.'
                }
            ],
            tip: '💡 טיפ: הקישור הוא אישי שלך ולא מצריך הזנת סיסמת הטכניון באפליקציה!'
        },

        'calendar-sync-modal': {
            title: 'סנכרון לוחות שנה (Google Calendar & WebCal)',
            purpose: 'ייצוא מערכת השעות, שיעורי הבית ומועדי הבחינות ישירות ליומן הטלפון שלך.',
            sections: [
                {
                    icon: '📅',
                    title: 'מנוי ליומן WebCal',
                    desc: 'העתק את הקישור והדבק ביומן Google או Apple — היומן יתעדכן מעצמו בכל שינוי.'
                },
                {
                    icon: '⚡',
                    title: 'סנכרון אירועים אישיים',
                    desc: 'אפשרות ליצירת אירועים ותזכורות לימודים המקושרים לקורסים שלך.'
                }
            ],
            tip: '💡 טיפ: הוספת היומן לטלפון שולחת לך תזכורות על מועדי בחינות והגשות בזמן!'
        },

        'past-exams-modal': {
            title: 'מאגר בחינות ופתרונות עבר',
            purpose: 'איתור והורדה מהירה של בחינות משנים קודמות ופתרונות רשמיים לצורך תרגול ולמידה.',
            sections: [
                {
                    icon: '🔍',
                    title: 'חיפוש וסינון',
                    desc: 'סינון לפי מועד א\', מועד ב\', סמסטר ושנת לימודים.'
                },
                {
                    icon: '📥',
                    title: 'צפייה והורדת PDF',
                    desc: 'פתיחת קובץ הבחינה בלחיצה אחת ישירות מהמכשיר.'
                }
            ],
            tip: '💡 טיפ: מומלץ לתרגל קודם בחינות מהשנתיים האחרונות של אותו מרצה.'
        },

        'modal-add-custom-task': {
            title: 'הוספת משימה או אירוע לימודים',
            purpose: 'יצירת משימה אישית, הכנה למבחן, או תרגיל בית בלוח המשימות בסגנון Notion.',
            sections: [
                {
                    icon: '📝',
                    title: 'שם המשימה ושיוך לקורס',
                    desc: 'הגדרת נושא המשימה ושיוכה לקורס המתאים כדי שתופיע בצבע הנכון.'
                },
                {
                    icon: '⏰',
                    title: 'תאריך יעד ועדיפות',
                    desc: 'קביעת מועד סופי שיקפיץ את המשימה בסרגל המשימות הדחופות (Study Runway).'
                }
            ],
            tip: '💡 טיפ: סימון משימה כבוצעה מוסיף לך נקודות ניסיון (XP) במדד ההתקדמות!'
        },

        'import-modal': {
            title: 'גיבוי, שחזור וייצוא נתונים',
            purpose: 'שמירת עותק גיבוי מלא של תוכנית הלימודים, הציונים וההגדרות בקובץ JSON מקומי.',
            sections: [
                {
                    icon: '📤',
                    title: 'ייצוא גיבוי מלא (Export)',
                    desc: 'הורדת קובץ JSON המכיל את כל הנתונים שלך למחשב או לטלפון.'
                },
                {
                    icon: '📥',
                    title: 'שחזור מקובץ (Import)',
                    desc: 'טעינת קובץ גיבוי שנשמר בעבר לשחזור מהיר של כל הציונים והתוכנית.'
                }
            ],
            tip: '💡 טיפ: מומלץ לייצא גיבוי לפני ביצוע שינויים נרחבים בתוכנית הלימודים.'
        },

        'settings-workspace': {
            title: 'מרכז הגדרות המערכת ורוויזיות',
            purpose: 'קביעת שנתון אקדמי (תשפ״ד/תשפ״ו/תשפ״ז/ברקים), ניהול סמסטרים, הגדרות פרטיות וסנכרון.',
            sections: [
                {
                    icon: '📚',
                    title: 'בחירת שנתון ומסלול לימודים',
                    desc: 'התאמת הסילבוס המומלץ לפי שנת תחילת הלימודים או מסלול ברקים מואץ.'
                },
                {
                    icon: '🔒',
                    title: 'מדיניות פרטיות והגנת מידע',
                    desc: 'הגדרות Local-First ושליטה מלאה בנתונים האישיים שלך.'
                },
                {
                    icon: '🚀',
                    title: 'עדכוני גרסה וסטטיסטיקה',
                    desc: 'בדיקת עדכונים מול GitHub Pages וצפייה ביומן הגרסאות "מה חדש?".'
                }
            ],
            tip: '💡 טיפ: לאחר שינוי הגדרות, לחץ על "💾 שמור את כל השינויים" בראש המסך.'
        },

        'curriculum-tree-workspace': {
            title: 'עץ מפת הקורסים והקשרים האקדמיים (Skill Tree)',
            purpose: 'מפה גרפית אינטראקטיבית של כל הקורסים בתואר בהנדסת מכונות, מסלולי הקדם והקשרים בין הסמסטרים.',
            sections: [
                {
                    icon: '📊',
                    title: 'תרשים זרימה (Flowchart DAG)',
                    desc: 'הצגת כל שרשראות הקורסים לפי סמסטרים, עם זום וגרירה חופשית.'
                },
                {
                    icon: '🔗',
                    title: 'נתיבי קדם ותלויות',
                    desc: 'ריחוף מעל קורס מאיר את כל הקדמים שלו אחורה ואת הקורסים שהוא פותח קדימה.'
                },
                {
                    icon: '📝',
                    title: 'כרטיס קורס',
                    desc: 'לחיצה על קורס פותחת את כרטיס המשימות, הציונים, החלפת סמסטר ועריכת קדמים.'
                },
                {
                    icon: '🎓',
                    title: 'סנכרון Moodle ו-CheeseFork',
                    desc: 'משיכת מטלות ומערכת שעות ישירות מהטכניון.'
                },
                {
                    icon: '➕',
                    title: 'הוספת קורס',
                    desc: 'הוספת קורסי בחירה, ספורט, מל״ג או פרויקטים אישיים ישירות למפה.'
                }
            ],
            tip: '💡 טיפ: רחף עם העכבר מעל כל קורס בעץ כדי לראות את כל שרשרת התלויות שלו מודגשת בזמן אמת!'
        },

        'planner-workspace': {
            title: 'מתכנן התואר האוטומטי (Degree Planner)',
            purpose: 'תכנון פריסת התואר, גרירת קורסים בין סמסטרים, חישובי נק״ז ובדיקת חוקי בחירה פקולטית.',
            sections: [
                {
                    icon: '📋',
                    title: 'התוכנית שלי מול שיבוץ מומלץ',
                    desc: 'מעבר בלחיצה בין התוכנית המותאמת אישית לבין המבנה המומלץ של הפקולטה.'
                },
                {
                    icon: '✋',
                    title: 'גרירה ושחרור (Drag & Drop)',
                    desc: 'הזזת קורסים בין סמסטרים תוך בדיקת עומסים ונק״ז.'
                },
                {
                    icon: '⚖️',
                    title: 'בדיקת חוקי בחירה ודרישות',
                    desc: 'מנוע חוקים אוטומטי המוודא השלמת 32.5 נק״ז בחירה, רשימות א׳-ד׳ ופרויקטים.'
                },
                {
                    icon: '🎓',
                    title: 'סימולטור ממוצע (What-If)',
                    desc: 'חישוב והערכת ממוצע תואר עתידי לפי ציונים צפויים.'
                },
                {
                    icon: '💾',
                    title: 'שמירת שינויים',
                    desc: 'שמירה מהירה של התוכנית לענן ולמכשיר.'
                }
            ],
            tip: '💡 טיפ: השתמש בסימולטור הממוצע כדי לבדוק איך ציון בכל קורס ישפיע על ה-GPA הסופי שלך!'
        },

        'timetable-workspace': {
            title: 'מערכת שעות שבועית ויומית (Timetable)',
            purpose: 'צפייה בלוח הזמנים השבועי, שיעורים, תרגולים ומעבדות, עם התמקדות יומית אוטומטית.',
            sections: [
                {
                    icon: '⭐',
                    title: 'תצוגת היום (Today Focus)',
                    desc: 'מציגה אוטומטית את לו״ז היום הנוכחי וזמני השיעורים הבאים.'
                },
                {
                    icon: '📅',
                    title: 'תצוגה שבועית מלאה',
                    desc: 'פריסה שבועית מראשון עד חמישי עם שעות ומיקומי כיתות.'
                },
                {
                    icon: '🔄',
                    title: 'סנכרון CheeseFork',
                    desc: 'סנכרון ישיר של מערכת השעות המעודכנת מהטכניון.'
                },
                {
                    icon: '📸',
                    title: 'שמירה כתמונה (PNG)',
                    desc: 'ייצוא מערכת השעות לתמונה יפה לשמירה בטלפון או כרקע.'
                }
            ],
            tip: '💡 טיפ: המערכת מתאימה את עצמה ליום הנוכחי ומדגישה את השיעור הקרוב!'
        },

        'notion-tasks-workspace': {
            title: 'לוח משימות, שיעורי בית ומבחנים (Notion Tasks)',
            purpose: 'ניהול מעקב מלא אחרי תרגילי בית, דוחות מעבדה, פרויקטים ומועדי בחינות בסגנון Notion.',
            sections: [
                {
                    icon: '🔔',
                    title: 'התראות דחופות (Study Runway)',
                    desc: 'ריכוז משימות ומטלות שמועד הגשתן מתקרב.'
                },
                {
                    icon: '➕',
                    title: 'משימה אישית חדשה',
                    desc: 'הוספת משימה או אירוע לימודים מקושר לקורס.'
                },
                {
                    icon: '🔍',
                    title: 'סינון וחיפוש',
                    desc: 'סינון משימות לפי קורס, סטטוס (טרם הושלם / הושלם) או סוג (מבחן / בית / פרויקט).'
                },
                {
                    icon: '📅',
                    title: 'סנכרון יומנים',
                    desc: 'ייצוא משימות ל-Google Calendar ו-Google Tasks.'
                }
            ],
            tip: '💡 טיפ: סימון משימות שביצעת מוסיף נקודות ניסיון (XP) לרמת השחקן שלך!'
        },

        'tasks-calendar-view-pane': {
            title: 'לוח שנה אקדמי משולב (Academic Calendar)',
            purpose: 'תצוגה חודשית ושבועית מרכזית של כל מועדי הבחינות (מועד א\' וב\'), מטלות מודל, הגשות WebWork, אירועים אישיים ומרווחי ימי למידה.',
            sections: [
                {
                    icon: '📅',
                    title: 'תצוגת חודש / שבוע',
                    desc: 'מעבר בלחיצה בין פריסה חודשית מלאה לפריסה שבועית ממוקדת.'
                },
                {
                    icon: '➕',
                    title: 'הוספת אירוע / משימה אישית',
                    desc: 'לחיצה על כפתור "אירוע אישי" או לחיצה ישירה על יום בלוח מאפשרת הוספת אירוע יום שלם או לפי שעות.'
                },
                {
                    icon: '📊',
                    title: 'מרווחי ימים בין בחינות (Exam Runway)',
                    desc: 'כרטיס מתקפל בראש הלוח המחשב נטו ימי למידה פנויים בין מועדי המבחנים של הסמסטר.'
                },
                {
                    icon: '🎨',
                    title: 'מקרא צבעים חכם',
                    desc: 'הבחנה ברורה בין ימי מבחן רשמיים, מטלות מודל, מבחנים לתרגול וחופשות.'
                },
                {
                    icon: '📤',
                    title: 'ייצוא ליומן Google',
                    desc: 'סנכרון בלחיצה אחת של כל האירועים והמועדים ישירות ליומן האישי שלך.'
                }
            ],
            tip: '💡 טיפ: לחיצה על כל תא יום בלוח פותחת את פירוט היום ומאפשרת הוספת אירועים ומשימות!'
        }
    };

    window.MODAL_HELP_REGISTRY = MODAL_HELP_REGISTRY;

    const ModalHelp = {
        init() {
            this.injectHelpStyles();
            this.setupAllModalHelpTriggers();

            // Observe DOM for dynamically opened modals
            const observer = new MutationObserver(() => {
                this.setupAllModalHelpTriggers();
            });
            observer.observe(document.body, { childList: true, subtree: true });
        },

        injectHelpStyles() {
            if (document.getElementById('modal-help-styles')) return;
            const style = document.createElement('style');
            style.id = 'modal-help-styles';
            style.textContent = `
                .btn-modal-help {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                    height: 26px;
                    min-width: 26px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
                    color: #ffffff;
                    border: 1.5px solid #fda4af;
                    font-size: 0.88rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: inherit;
                    user-select: none;
                    line-height: 1;
                    padding: 0;
                    box-shadow: 0 0 12px rgba(244, 63, 94, 0.45), 0 2px 4px rgba(0, 0, 0, 0.3);
                    flex-shrink: 0;
                }
                .btn-modal-help:hover {
                    background: linear-gradient(135deg, #fb7185 0%, #f43f5e 100%);
                    border-color: #ffffff;
                    color: #ffffff;
                    box-shadow: 0 0 18px rgba(244, 63, 94, 0.75), 0 3px 6px rgba(0, 0, 0, 0.4);
                    transform: translateY(-1.5px) scale(1.12);
                }
                .modal-help-banner {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(11, 19, 43, 0.98));
                    border: 1px solid rgba(56, 189, 248, 0.35);
                    border-radius: 10px;
                    padding: 14px 16px;
                    margin-bottom: 15px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                    animation: helpBannerFadeIn 0.25s ease-out;
                    direction: rtl;
                    text-align: right;
                }
                @keyframes helpBannerFadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .modal-help-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(56, 189, 248, 0.2);
                    padding-bottom: 8px;
                    margin-bottom: 12px;
                }
                .modal-help-title {
                    font-size: 0.96rem;
                    font-weight: 800;
                    color: #38bdf8;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .modal-help-purpose {
                    font-size: 0.82rem;
                    color: #cbd5e1;
                    margin-bottom: 12px;
                    line-height: 1.5;
                }
                .modal-help-sections {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .modal-help-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 6px 8px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 6px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .modal-help-item-icon {
                    font-size: 1.1rem;
                    line-height: 1.2;
                    flex-shrink: 0;
                }
                .modal-help-item-text strong {
                    color: #f8fafc;
                    font-size: 0.82rem;
                    display: block;
                    margin-bottom: 2px;
                }
                .modal-help-item-text span {
                    color: #94a3b8;
                    font-size: 0.77rem;
                    line-height: 1.4;
                    display: block;
                }
                .modal-help-tip {
                    background: rgba(245, 158, 11, 0.08);
                    border: 1px solid rgba(245, 158, 11, 0.25);
                    border-radius: 6px;
                    padding: 8px 10px;
                    font-size: 0.76rem;
                    color: #fde68a;
                    margin-bottom: 10px;
                }
                .btn-close-help-banner {
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.3);
                    color: #38bdf8;
                    font-size: 0.76rem;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                    text-align: center;
                    transition: all 0.2s;
                }
                .btn-close-help-banner:hover {
                    background: #38bdf8;
                    color: #0f172a;
                }
            `;
            document.head.appendChild(style);
        },

        setupAllModalHelpTriggers() {
            Object.keys(MODAL_HELP_REGISTRY).forEach(modalId => {
                this.setupTriggerForModal(modalId);
            });
        },

        setupTriggerForModal(modalId) {
            const modalEl = document.getElementById(modalId);
            if (!modalEl) return;

            const helpData = MODAL_HELP_REGISTRY[modalId];
            if (!helpData) return;

            // Check if trigger button already exists for this specific modal
            if (modalEl.querySelector(`.btn-modal-help[data-help-target="${modalId}"]`)) return;

            // Find best insertion target in modal header
            let targetContainer = null;
            if (modalId === 'course-modal') {
                targetContainer = modalEl.querySelector('.course-settings-container') || modalEl.querySelector('.modal-header');
            } else if (modalId === 'settings-workspace') {
                targetContainer = modalEl.querySelector('.settings-header-actions') || modalEl.querySelector('.settings-header-banner');
            } else if (modalId === 'curriculum-tree-workspace') {
                targetContainer = modalEl.querySelector('.flowchart-actions') || modalEl.querySelector('.tree-controls');
            } else if (modalId === 'planner-workspace') {
                targetContainer = modalEl.querySelector('.planner-header-right') || modalEl.querySelector('.planner-header-banner');
            } else if (modalId === 'timetable-workspace') {
                targetContainer = modalEl.querySelector('#timetable-day-selector') || modalEl.querySelector('.timetable-day-selector') || modalEl.querySelector('.timetable-container');
            } else if (modalId === 'tasks-calendar-view-pane') {
                targetContainer = modalEl.querySelector('.cal-actions-row') || modalEl.querySelector('.finals-calendar-header-bar') || modalEl.querySelector('.cal-title-group');
            } else if (modalId === 'notion-tasks-workspace') {
                targetContainer = modalEl.querySelector('.notion-tasks-header-actions') || modalEl.querySelector('.notion-tasks-header-main');
            } else {
                targetContainer = modalEl.querySelector('.modal-header') || modalEl.querySelector('.analytics-header-banner') || modalEl.querySelector('.modal-content');
            }

            if (!targetContainer) return;

            // Prevent duplicate button in the same container
            if (targetContainer.querySelector(`.btn-modal-help[data-help-target="${modalId}"]`) || targetContainer.querySelector('.btn-modal-help')) return;

            // Create button
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-modal-help';
            btn.setAttribute('data-help-target', modalId);
            btn.setAttribute('aria-label', 'עזרה והסבר על החלונית');
            btn.title = 'עזרה: מה עושים בחלונית זו ומה כל רכיב עושה?';
            btn.innerHTML = '?';

            if (modalId === 'course-modal') {
                btn.style.marginRight = '8px';
            } else if (modalId.includes('-workspace') || modalId.includes('-pane')) {
                btn.style.marginLeft = '8px';
                btn.style.alignSelf = 'center';
            }

            btn.onclick = (e) => {
                e.stopPropagation();
                this.toggleHelpBanner(modalId);
            };

            // Prepend or append depending on layout
            if (targetContainer.classList && (
                targetContainer.classList.contains('course-settings-container') || 
                targetContainer.classList.contains('flowchart-actions') || 
                targetContainer.classList.contains('timetable-sync-actions') ||
                targetContainer.classList.contains('cal-actions-row') ||
                targetContainer.id === 'timetable-day-selector' ||
                targetContainer.classList.contains('timetable-day-selector')
            )) {
                targetContainer.appendChild(btn);
            } else if (targetContainer.classList && (
                targetContainer.classList.contains('modal-header') || 
                targetContainer.classList.contains('analytics-header-banner') || 
                targetContainer.classList.contains('settings-header-actions') || 
                targetContainer.classList.contains('planner-header-right') || 
                targetContainer.classList.contains('notion-tasks-header-actions')
            )) {
                targetContainer.appendChild(btn);
            } else {
                targetContainer.insertBefore(btn, targetContainer.firstChild);
            }
        },

        toggleHelpBanner(modalId) {
            const modalEl = document.getElementById(modalId);
            if (!modalEl) return;

            const existingBanner = document.querySelector(`.modal-help-banner[data-modal-id="${modalId}"]`);
            if (existingBanner) {
                existingBanner.remove();
                return;
            }

            const helpData = MODAL_HELP_REGISTRY[modalId];
            if (!helpData) return;

            const banner = document.createElement('div');
            banner.className = 'modal-help-banner';
            banner.setAttribute('data-modal-id', modalId);

            const sectionsHtml = (helpData.sections || []).map(s => `
                <div class="modal-help-item">
                    <span class="modal-help-item-icon">${s.icon}</span>
                    <div class="modal-help-item-text">
                        <strong>${s.title}</strong>
                        <span>${s.desc}</span>
                    </div>
                </div>
            `).join('');

            banner.innerHTML = `
                <div class="modal-help-header">
                    <div class="modal-help-title">
                        <span>💡</span> <span>מדריך: ${helpData.title}</span>
                    </div>
                    <button type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; padding: 0 4px;" title="סגור הסבר">&times;</button>
                </div>
                <div class="modal-help-purpose">
                    ${helpData.purpose}
                </div>
                <div class="modal-help-sections">
                    ${sectionsHtml}
                </div>
                ${helpData.tip ? `<div class="modal-help-tip">${helpData.tip}</div>` : ''}
                <button type="button" class="btn-close-help-banner">✓ הבנתי, סגור הסבר</button>
            `;

            // Close button listeners
            const closeX = banner.querySelector('.modal-help-header button');
            if (closeX) closeX.onclick = () => banner.remove();

            const closeBottom = banner.querySelector('.btn-close-help-banner');
            if (closeBottom) closeBottom.onclick = () => banner.remove();

            // Insert banner at the top of modal body or scrollable content
            let bodyTarget = null;
            if (modalId === 'notion-tasks-workspace') {
                bodyTarget = document.getElementById('tasks-table-view-pane') || modalEl.querySelector('.notion-tasks-container');
            } else if (modalId === 'tasks-calendar-view-pane') {
                bodyTarget = modalEl.querySelector('.finals-calendar-card') || modalEl.querySelector('.finals-calendar-container') || document.getElementById('tasks-calendar-view-pane');
            } else {
                bodyTarget = modalEl.querySelector('.modal-body') || 
                             modalEl.querySelector('.finals-calendar-card') ||
                             modalEl.querySelector('.finals-calendar-container') ||
                             modalEl.querySelector('.flowchart-viewport') ||
                             modalEl.querySelector('.planner-main-container') ||
                             modalEl.querySelector('.timetable-container') ||
                             modalEl.querySelector('.notion-tasks-container') ||
                             modalEl.querySelector('.analytics-body-scrollable') || 
                             modalEl.querySelector('#site-analytics-content') || 
                             modalEl.querySelector('.settings-container') ||
                             modalEl.querySelector('.modal-content');
            }

            if (bodyTarget) {
                bodyTarget.insertBefore(banner, bodyTarget.firstChild);
                // Scroll banner into view smoothly
                banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    window.ModalHelp = ModalHelp;

    document.addEventListener('DOMContentLoaded', () => {
        ModalHelp.init();
    });

})(window);
