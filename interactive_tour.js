/**
 * Semestero ME - Interactive Guided Tour & Tutorial Hub Engine (v2.5.8 Supercharge)
 * 
 * Provides:
 * 1. Step-by-Step Guided Live Tour with real-time workspace switching
 * 2. Visual Tutorial Hub Modal for on-demand feature discovery
 * 3. Interactive tool triggers directly within tour cards
 * 4. Full accessibility and keyboard navigation
 */

(function(window, document) {
    'use strict';

    const TOUR_STORAGE_KEY = 'ast_interactive_tour_completed_v258';

    function switchAppTab(tabKey) {
        if (typeof window.setActiveMainTab === 'function') {
            window.setActiveMainTab(tabKey);
        } else {
            const btn = document.getElementById(`tab-${tabKey}`);
            if (btn) btn.click();
        }
    }

    const TOUR_STEPS = [
        {
            icon: '🧭',
            tag: 'היכרות',
            title: 'ברוכים הבאים ל-Semestero ME 2.5!',
            subtitle: 'מרכז הפיקוד האקדמי שלך להנדסת מכונות בטכניון',
            content: `
                שמחים שהצטרפת! המערכת פותחה במיוחד כדי לעשות לך סדר מוחלט בכל חובות התואר, לוחות הזמנים, המשימות והמבחנים.
                <br><br>
                • <strong>ארכיטקטורת Local-First:</strong> הנתונים שלך נשמרים מקומית במכשירך בלבד, בפרטיות מוחלטת וללא מעקב פרסומי.<br>
                • <strong>סנכרון ענן מאובטח:</strong> אפשרות לגיבוי והמשכיות בין המחשב לטלפון הנייד.<br><br>
                בוא נעבור סיור מודרך מהיר שיחשוף בפניך את כל הפיצ'רים המרכזיים של המערכת!
            `,
            tab: 'curriculum',
            actionBtn: null
        },
        {
            icon: '🌳',
            tag: 'ליבה אקדמית',
            title: 'עץ מיומנויות ותרשים קדמים (Skill Tree)',
            subtitle: 'מפת הלימודים הפקולטית המלאה',
            content: `
                כל קורסי התואר מסודרים לפי סמסטרים רשמיים א׳ עד ח׳, עם תמיכה מלאה בכל שנתוני הלימודים (תשפ״ד, תשפ״ה, תשפ״ו, ותשפ״ז):
                <br><br>
                • <strong>הארת שרשרת קדמים:</strong> לחיצה על כל קורס מאירה מיידית את כל קורסי הקדם שלו בכחול/זהב, ואת הקורסים העתידיים שהוא פותח בירוק!<br>
                • <strong>כרטיס קורס מורחב:</strong> צפייה בסילבוס, מועדי בחינות, קישור להקלטות פנופטו, ומחשבון יעד לציון סופי במועד ב׳.<br>
                • <strong>גמישות מלאה:</strong> בחירת חלופות פיזיקה 1 ו-2 (2.5 נק״ז), מעבדת כימיה, וקורסי קיץ.
            `,
            tab: 'curriculum',
            actionBtn: null
        },
        {
            icon: '🎯',
            tag: 'תכנון תואר',
            title: 'מתכנן התואר הרב-סמסטריאלי (Degree Planner)',
            subtitle: 'גרירה, שיבוץ חופשי ובדיקת זכאות לסיום תואר',
            content: `
                מתכנן התואר מאפשר לך לבנות תוכנית לימודים אישית ומותאמת לקצב שלך:
                <br><br>
                • <strong>גרירה ושחרור (Drag & Drop):</strong> גרירת קורסי חובה ובחירה בין סמסטרים, הוספת סמסטרי קיץ, והסרת קורסים למאגר.<br>
                • <strong>מדדי עומס חיים:</strong> סרגל עומס שבועי, שעות הרצאה ותרגול, ושעות מעבדה ודוחות המתעדכנים בזמן אמת.<br>
                • <strong>בדיקת זכאות לתואר (Graduation Audit 🎓):</strong> בדיקה אוטומטית של כל 157.5 הנק״ז, מילואים (155.5), טירונות עתודה (2 נק״ז), פורמולה SAE, שני קורסי אנגלית, מל״ג וספורט.
            `,
            tab: 'planner',
            actionBtn: {
                label: '🎓 פתח בדיקת זכאות לתואר',
                onClick: () => {
                    if (window.DegreePlanner && window.DegreePlanner.openGraduationAuditModal) {
                        window.DegreePlanner.openGraduationAuditModal();
                    }
                }
            }
        },
        {
            icon: '🕒',
            tag: 'מערכת שעות',
            title: 'מחולל מערכות שעות אלגוריתמי (Timetable Studio)',
            subtitle: 'שילוב כל הקומבינציות מ-CheeseFork ללא התנגשויות',
            content: `
                נמאס לבנות מערכת שעות ידנית? הסטודיו האלגוריתמי עושה הכל בשבילך:
                <br><br>
                • <strong>סנכרון ישיר מ-CheeseFork:</strong> משיכת כל קבוצות ההרצאה, התרגול והמעבדה ישירות מהשרתים.<br>
                • <strong>עוגנים ונעילת מרצים (Pre-Anchoring):</strong> בחר מראש את המרצים והמתרגלים המועדפים עליך ונעל אותם.<br>
                • <strong>חילול קומבינציות חכם:</strong> המערכת מחשבת אלפי שילובים ומדרגת לפי מקסימום ימי חופש, מינימום חלונות והתחלה מאוחרת!
            `,
            tab: 'timetable',
            actionBtn: null
        },
        {
            icon: '📋',
            tag: 'משימות ומודל',
            title: 'לוח משימות, סנכרון Moodle ומסלול מבחנים',
            subtitle: 'כל שיעורי הבית והמטלות במקום אחד',
            content: `
                • <strong>סנכרון חי ממודל 26 (Moodle iCal):</strong> משיכת כל שיעורי הבית ומטלות ההגשה ישירות מהמודל בלחיצה אחת.<br>
                • <strong>לוח קנבן אינטראקטיבי:</strong> ניהול משימות בסטטוסים (טרם התחיל, בתהליך, הושלם), סינון קורסים, ונעיצת משימות דחופות (📌).<br>
                • <strong>Study Runway:</strong> ספירה לאחור של ימים שנותרו עד למועדי א׳ ומועדי ב׳ של כל הקורסים הפעילים.
            `,
            tab: 'tasks',
            actionBtn: null
        },
        {
            icon: '🔍',
            tag: 'חיפוש חכם',
            title: 'שורת פקודות וחיפוש חכם מהיר (Ctrl+K / ⌘K)',
            subtitle: 'הסיידקיק של הסטודנט החרוץ',
            content: `
                לחץ בכל עת על <kbd>Ctrl+K</kbd> (או מקש <kbd>/</kbd>) לפתיחת שורת הפקודות החכמה:
                <br><br>
                • <strong>חיפוש מיידי:</strong> חפש כל קורס לפי מספר (למשל: <code>114051</code>) או שם, משימות פתוחות, טאבים ופעולות מערכת.<br>
                • <strong>ניווט מקלדת מלא:</strong> דפדף בתוצאות עם חצים <kbd>↑</kbd> <kbd>↓</kbd>, בחר ב-<kbd>Enter</kbd>, וסגור ב-<kbd>Esc</kbd>.<br>
                • <strong>זמין מכל מקום:</strong> ניתן לפתוח גם בלחיצה על כפתור הזכוכית המגדלת (🔍) בראש המסך.
            `,
            tab: 'curriculum',
            actionBtn: {
                label: '🔍 נסה את החיפוש החכם עכשיו',
                onClick: () => {
                    if (window.openCommandPalette) window.openCommandPalette();
                }
            }
        },
        {
            icon: '⚖️',
            tag: 'השוואה חכמה',
            title: 'השוואת קורסי בחירה צד-מול-צד (Course Comparator)',
            subtitle: 'בחירה מושכלת ומניעת התנגשויות בחינה',
            content: `
                מתלבט בין שני קורסי בחירה פקולטיים? כלי ההשוואה מאפשר לך לבדוק אותם ראש בראש:
                <br><br>
                • <strong>השוואת נתונים מלאה:</strong> נק״ז, סיווג רשימה פקולטית, פקולטה מלמדת, דרישות קדם וסילבוס.<br>
                • <strong>זיהוי התנגשויות אוטומטי (Exam Clash):</strong> המערכת בודקת אוטומטית אם יש התנגשות בתאריכי מועד א׳ או מועד ב׳ ומציגה התראה אדומה בולטת!<br>
                • <strong>פעולות מהירות:</strong> שמירה לרשימת מועדפים (⭐) והעתקת קוד קורס בלחיצה.
            `,
            tab: 'curriculum',
            actionBtn: {
                label: '⚖️ פתח כלי השוואת קורסים',
                onClick: () => {
                    if (window.openCourseComparisonModal) window.openCourseComparisonModal();
                }
            }
        },
        {
            icon: '📖',
            tag: 'זכויות ונהלים',
            title: 'מדריך זכויות, נהלים ושאלות נפוצות (Technion FAQ)',
            subtitle: 'כל מה שמותר ומגיע לך כסטודנט בטכניון',
            content: `
                מאגר מידע מקיף המרכז את כל ההנחיות והתקנונים הרשמיים:
                <br><br>
                • <strong>משרתי מילואים:</strong> זכאות להפחתת 2 נק״ז בחירה (155.5 נק״ז במקום 157.5), מועדי ג׳ מיוחדים והתאמות.<br>
                • <strong>עתודאים:</strong> הכרה רשמית בטירונות כ-2.0 נק״ז בינאריות (ציון ״עובר״).<br>
                • <strong>נבחרת פורמולה טכניון (Formula SAE):</strong> 2.0 נק״ז לסמסטר בבחירה חופשית, או 6.0 נק״ז פרויקט גמר שנתי.<br>
                • <strong>אנגלית, מל״ג וספורט:</strong> חובת 2 קורסי תוכן באנגלית, 6 נק״ז מל״ג ו-2 קורסי ספורט.
            `,
            tab: 'curriculum',
            actionBtn: {
                label: '📖 פתח מדריך זכויות אקדמיות',
                onClick: () => {
                    if (window.openFaqModal) window.openFaqModal();
                }
            }
        },
        {
            icon: '⌨️',
            tag: 'קיצורים ונגישות',
            title: 'מקשי קיצור גלובליים, כפתור ציפה ובקר נגישות',
            subtitle: 'עבודה מהירה ומקצועית כמו מתכנת אמיתי',
            content: `
                שדרגנו את חוויית השימוש עם מגוון כלי נוחות מתקדמים:
                <br><br>
                • <strong>מעבר מהיר בין טאבים:</strong> מקשים <kbd>1</kbd> עד <kbd>6</kbd> במקלדת.<br>
                • <strong>סגירה ושמירה מהירה:</strong> <kbd>Esc</kbd> לסגירת כל מודאל, <kbd>Ctrl+S</kbd> לשמירה מיידית.<br>
                • <strong>כפתור חזרה לראש העמוד (🔝):</strong> כפתור ירוק צף שמופיע בגלילה ארוכה ומחזיר אותך למעלה בצורה חלקה.<br>
                • <strong>בקר נגישות לגודל טקסט:</strong> התאמת גודל פונט (A- / 100% / A+) בהגדרות לנוחות קריאה מרבית.
            `,
            tab: 'settings',
            actionBtn: {
                label: '⌨️ פתח לוח מקשי קיצור (?)',
                onClick: () => {
                    if (window.openKeyboardShortcutsModal) window.openKeyboardShortcutsModal();
                }
            }
        },
        {
            icon: '🚀',
            tag: 'סיום והפצה',
            title: 'הורדה ישירה לטלפון ולמחשב (Desktop & APK)',
            subtitle: 'האפליקציה איתך בכל מקום',
            content: `
                עכשיו אתה מכיר את כל סודות המערכת!
                <br><br>
                • <strong>הורדה ישירה (חץ ירוק ⬇️):</strong> לחץ על כפתור ההורדה הירוק בראש המסך להורדת אפליקציית אנדרואיד רשמית (APK) או הפצה שולחנית למחשב (Windows .exe).<br>
                • <strong>מרכז הווידג'טים למסך הבית:</strong> זמין ישירות בהגדרות המערכת (Settings ⚙️) לצפייה מקדימה והוספה למסך הבית.<br>
                • <strong>צריך שוב רענון?</strong> תוכל לפתוח את המדריך והסיור הזה בכל רגע בלחיצה על סמל המצפן (🧭) בסרגל העליון!
            `,
            tab: 'curriculum',
            actionBtn: {
                label: '⬇️ פתח מרכז הורדה ישירה',
                onClick: () => {
                    if (window.openDownloadModal) window.openDownloadModal();
                }
            }
        }
    ];

    const TUTORIAL_MODULES = [
        {
            id: 'mod-tree',
            icon: '🌳',
            title: 'עץ מיומנויות ושרשראות קדמים',
            desc: 'ניווט בתרשים הפקולטי, הארת קדמים בכחול וקורסים עתידיים בירוק, וצפייה בסילבוס.',
            tab: 'curriculum',
            stepIndex: 1
        },
        {
            id: 'mod-planner',
            icon: '🎯',
            title: 'תכנון תואר ובדיקת זכאות לסיום',
            desc: 'גרירת קורסים בין סמסטרים, ניהול עומס שבועי, ובדיקת עמידה בכל דרישות התואר (157.5 נק״ז).',
            tab: 'planner',
            stepIndex: 2
        },
        {
            id: 'mod-timetable',
            icon: '🕒',
            title: 'מחולל מערכות שעות אלגוריתמי',
            desc: 'משיכת שעות ישירה מ-CheeseFork, נעילת מרצים אהובים, וחישוב שילובים ללא התנגשויות.',
            tab: 'timetable',
            stepIndex: 3
        },
        {
            id: 'mod-tasks',
            icon: '📋',
            title: 'משימות, סנכרון Moodle ומבחנים',
            desc: 'סנכרון מטלות אוטומטי מיומן מודל 26, קנבן אינטראקטיבי, וספירה לאחור למועדי בחינות.',
            tab: 'tasks',
            stepIndex: 4
        },
        {
            id: 'mod-search',
            icon: '🔍',
            title: 'חיפוש חכם ופקודות מהירות (Ctrl+K)',
            desc: 'איתור מהיר של כל קורס, משימה, טאב או פעולה במערכת בעזרת שורת הפקודות החכמה.',
            tab: 'curriculum',
            stepIndex: 5
        },
        {
            id: 'mod-compare',
            icon: '⚖️',
            title: 'השוואת קורסים צד-מול-צד',
            desc: 'השוואת קורסי בחירה, סילבוס, נק״ז ודרישות קדם, וזיהוי אוטומטי של התנגשויות בחינה.',
            tab: 'curriculum',
            stepIndex: 6
        },
        {
            id: 'mod-faq',
            icon: '📖',
            title: 'מדריך זכויות, נהלים ושאלות נפוצות',
            desc: 'כל מה שחשוב לדעת: מילואים, עתודה, פורמולה טכניון, קורסי אנגלית, מל״ג וספורט.',
            tab: 'curriculum',
            stepIndex: 7
        },
        {
            id: 'mod-shortcuts',
            icon: '⌨️',
            title: 'מקשי קיצור וכלי פרו מתקדמים',
            desc: 'מעבר מהיר עם מקשים 1-6, כפתור חזרה לראש העמוד (🔝), והעתקה בלחיצה אחת.',
            tab: 'settings',
            stepIndex: 8
        }
    ];

    const InteractiveTour = {
        currentStep: 0,
        active: false,

        init() {
            this.injectStyles();

            // Auto-prompt tour on launch ONLY if initial data entry (onboarding) was ALREADY completed
            setTimeout(() => {
                const tourDone = localStorage.getItem(TOUR_STORAGE_KEY);
                const onboardingDone = localStorage.getItem('ast_onboarding_shown') === 'true';
                const onboardingModal = document.getElementById('onboarding-wizard-modal');
                const isOnboardingActive = onboardingModal && (
                    onboardingModal.classList.contains('active') || 
                    onboardingModal.style.display === 'flex' || 
                    onboardingModal.style.display === 'block'
                );

                if (tourDone !== 'true' && onboardingDone && !isOnboardingActive) {
                    this.showWelcomeTourPrompt();
                }
            }, 1800);
        },

        injectStyles() {
            if (document.getElementById('tour-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'tour-custom-styles';
            style.textContent = `
                .tour-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.82);
                    backdrop-filter: blur(8px);
                    z-index: 99998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: tourFadeIn 0.22s ease-out;
                    padding: 16px;
                }
                @keyframes tourFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .tour-card {
                    background: #0f172a;
                    border: 1px solid rgba(56, 189, 248, 0.45);
                    box-shadow: 0 25px 65px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.2);
                    border-radius: 16px;
                    max-width: 560px;
                    width: 100%;
                    direction: rtl;
                    text-align: right;
                    overflow: hidden;
                    animation: tourCardSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                }
                @keyframes tourCardSlideUp {
                    from { transform: translateY(20px) scale(0.96); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
                .tour-card-header {
                    background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(37, 99, 235, 0.12));
                    border-bottom: 1px solid rgba(56, 189, 248, 0.25);
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tour-step-badge {
                    font-size: 0.72rem;
                    background: rgba(56, 189, 248, 0.2);
                    color: #38bdf8;
                    border: 1px solid #38bdf8;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                }
                .tour-tag-pill {
                    font-size: 0.68rem;
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                    border: 1px solid #10b981;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 700;
                    margin-right: 6px;
                }
                .tour-card-body {
                    padding: 20px 24px;
                    color: #e2e8f0;
                    font-size: 0.9rem;
                    line-height: 1.65;
                    max-height: 60vh;
                    overflow-y: auto;
                }
                .tour-card-body kbd {
                    background: #1e293b;
                    border: 1px solid #475569;
                    color: #38bdf8;
                    padding: 1px 6px;
                    border-radius: 4px;
                    font-size: 0.78rem;
                    font-family: inherit;
                    font-weight: 700;
                }
                .tour-action-row {
                    margin-top: 14px;
                    padding: 10px 14px;
                    background: rgba(15, 23, 42, 0.65);
                    border: 1px dashed rgba(56, 189, 248, 0.35);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                }
                .tour-progress-bar {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.08);
                    width: 100%;
                }
                .tour-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #10b981, #38bdf8);
                    transition: width 0.25s ease;
                }
                .tour-card-footer {
                    padding: 14px 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(15, 23, 42, 0.75);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .btn-tour-nav {
                    padding: 8px 18px;
                    border-radius: 8px;
                    font-size: 0.86rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.2s ease;
                }
                .btn-tour-skip {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 0.82rem;
                    padding: 6px 10px;
                    font-family: inherit;
                }
                .btn-tour-skip:hover {
                    color: #f1f5f9;
                    text-decoration: underline;
                }

                /* Tutorial Hub Modal */
                .tutorial-hub-modal {
                    max-width: 800px;
                    width: 95%;
                    max-height: 88vh;
                }
                .tutorial-hub-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 12px;
                    margin-top: 14px;
                }
                .tutorial-hub-card {
                    background: rgba(15, 23, 42, 0.75);
                    border: 1px solid rgba(56, 189, 248, 0.22);
                    border-radius: 12px;
                    padding: 14px 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .tutorial-hub-card:hover {
                    background: rgba(30, 41, 59, 0.75);
                    border-color: #38bdf8;
                    box-shadow: 0 4px 16px rgba(56, 189, 248, 0.2);
                    transform: translateY(-2px);
                }
                .tutorial-hub-card-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                }
                .tutorial-hub-card-title {
                    font-weight: 800;
                    color: #f8fafc;
                    font-size: 0.95rem;
                }
                .tutorial-hub-card-desc {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    line-height: 1.5;
                }
            `;
            document.head.appendChild(style);
        },

        showWelcomeTourPrompt() {
            if (document.getElementById('tour-welcome-prompt') || document.getElementById('interactive-tour-container')) return;
            const onboardingModal = document.getElementById('onboarding-wizard-modal');
            if (onboardingModal && (
                onboardingModal.classList.contains('active') || 
                onboardingModal.style.display === 'flex' || 
                onboardingModal.style.display === 'block'
            )) {
                return;
            }

            const promptEl = document.createElement('div');
            promptEl.id = 'tour-welcome-prompt';
            promptEl.className = 'tour-backdrop';
            promptEl.innerHTML = `
                <div class="tour-card" style="max-width: 480px;">
                    <div class="tour-card-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.6rem;">🧭</span>
                            <span style="font-weight: 800; color: #38bdf8; font-size: 1.15rem;">סיור היכרות והדרכה ב-Semestero ME</span>
                        </div>
                    </div>
                    <div class="tour-card-body">
                        שלום! המערכת כוללת מגוון כלים מתקדמים: עץ מיומנויות, מתכנן תואר עם בדיקת זכאות לסיום, מחולל שעות מ-CheeseFork, שורת פקודות (Ctrl+K), והשוואת קורסים צד-מול-צד.
                        <br><br>
                        רוצה סיור מודרך מהיר של 60 שניות שיעשה לך סדר בהכל?
                        <div style="margin-top: 10px; font-size: 0.78rem; color: #94a3b8;">
                            תוכל לפתוח את הסיור בכל עת באמצעות סמל המצפן (🧭) בסרגל העליון או דרך ההגדרות.
                        </div>
                    </div>
                    <div class="tour-card-footer">
                        <button type="button" class="btn-tour-skip" id="btn-prompt-skip-tour">
                            דלג בינתיים
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-outline btn-tour-nav" id="btn-prompt-open-hub" style="border-color: #38bdf8; color: #38bdf8;">
                                📚 מרכז ההדרכה
                            </button>
                            <button type="button" class="btn btn-primary btn-tour-nav" id="btn-prompt-start-tour" style="background: linear-gradient(135deg, #0284c7, #2563eb); border: none;">
                                🚀 התחל סיור מודרך
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(promptEl);

            document.getElementById('btn-prompt-start-tour').onclick = () => {
                promptEl.remove();
                this.startTour(0);
            };

            document.getElementById('btn-prompt-open-hub').onclick = () => {
                promptEl.remove();
                window.openTutorialHubModal();
            };

            document.getElementById('btn-prompt-skip-tour').onclick = () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
                promptEl.remove();
                if (typeof window.showHudToast === 'function') {
                    window.showHudToast('הסיור דולג. ניתן להפעילו בכל עת באמצעות כפתור המצפן 🧭 בראש המסך', 'info');
                }
            };
        },

        startTour(startIndex = 0) {
            this.currentStep = Math.max(0, Math.min(TOUR_STEPS.length - 1, startIndex));
            this.active = true;
            this.renderStep();
        },

        renderStep() {
            let container = document.getElementById('interactive-tour-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'interactive-tour-container';
                container.className = 'tour-backdrop';
                document.body.appendChild(container);
            }

            const step = TOUR_STEPS[this.currentStep];
            const totalSteps = TOUR_STEPS.length;
            const progressPercent = Math.round(((this.currentStep + 1) / totalSteps) * 100);

            // Switch workspace tab so the student views the live UI!
            if (step.tab) {
                switchAppTab(step.tab);
            }

            const isLast = this.currentStep === totalSteps - 1;
            const isFirst = this.currentStep === 0;

            let actionHtml = '';
            if (step.actionBtn) {
                actionHtml = `
                    <div class="tour-action-row">
                        <span style="font-size: 0.8rem; color: #94a3b8;">נסה כעת ישירות מהסיור:</span>
                        <button type="button" class="btn btn-xs btn-outline" id="btn-tour-step-action" style="border-color: #38bdf8; color: #38bdf8; font-weight: 700; padding: 4px 12px; border-radius: 6px;">
                            ${step.actionBtn.label}
                        </button>
                    </div>
                `;
            }

            container.innerHTML = `
                <div class="tour-card">
                    <div class="tour-progress-bar">
                        <div class="tour-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="tour-card-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.6rem;">${step.icon}</span>
                            <div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <h3 style="margin: 0; color: #38bdf8; font-size: 1.05rem; font-weight: 800;">
                                        ${step.title}
                                    </h3>
                                    ${step.tag ? `<span class="tour-tag-pill">${step.tag}</span>` : ''}
                                </div>
                                <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                                    ${step.subtitle}
                                </div>
                            </div>
                        </div>
                        <span class="tour-step-badge">שלב ${this.currentStep + 1} / ${totalSteps}</span>
                    </div>

                    <div class="tour-card-body">
                        ${step.content}
                        ${actionHtml}
                    </div>

                    <div class="tour-card-footer">
                        <button type="button" class="btn-tour-skip" id="btn-tour-skip-all">
                            דלג על הסיור
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-outline btn-tour-nav" id="btn-tour-open-hub" style="border-color: #475569; color: #94a3b8;">
                                📚 כל הנושאים
                            </button>
                            ${!isFirst ? `<button type="button" class="btn btn-outline btn-tour-nav" id="btn-tour-prev" style="border-color: #334155; color: #cbd5e1;">הקודם</button>` : ''}
                            <button type="button" class="btn btn-primary btn-tour-nav" id="btn-tour-next" style="background: linear-gradient(135deg, #0284c7, #2563eb); border: none;">
                                ${isLast ? 'סיום והתחלת שימוש 🚀' : 'הבא ➔'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Bind listeners
            document.getElementById('btn-tour-skip-all').onclick = () => this.endTour(true);
            document.getElementById('btn-tour-open-hub').onclick = () => {
                const tourEl = document.getElementById('interactive-tour-container');
                if (tourEl) tourEl.remove();
                window.openTutorialHubModal();
            };

            const actionBtnEl = document.getElementById('btn-tour-step-action');
            if (actionBtnEl && step.actionBtn && typeof step.actionBtn.onClick === 'function') {
                actionBtnEl.onclick = () => step.actionBtn.onClick();
            }

            const prevBtn = document.getElementById('btn-tour-prev');
            if (prevBtn) {
                prevBtn.onclick = () => {
                    if (this.currentStep > 0) {
                        this.currentStep--;
                        this.renderStep();
                    }
                };
            }

            document.getElementById('btn-tour-next').onclick = () => {
                if (isLast) {
                    this.endTour(false);
                } else {
                    this.currentStep++;
                    this.renderStep();
                }
            };
        },

        endTour(skipped = false) {
            this.active = false;
            const container = document.getElementById('interactive-tour-container');
            if (container) container.remove();

            localStorage.setItem(TOUR_STORAGE_KEY, 'true');

            if (typeof window.showHudToast === 'function') {
                if (skipped) {
                    window.showHudToast('הסיור דולג. תוכל להפעילו מחדש בכל עת דרך סמל המצפן 🧭', 'info');
                } else {
                    window.showHudToast('סיימת את הסיור המודרך בהצלחה! בהצלחה בתואר 🎓🚀', 'success');
                }
            }
        }
    };

    window.InteractiveTour = InteractiveTour;
    window.startInteractiveTour = (startIndex = 0) => InteractiveTour.startTour(startIndex);

    // =========================================================================
    // Tutorial Hub & Knowledge Academy Modal
    // =========================================================================
    window.openTutorialHubModal = function() {
        let modal = document.getElementById('tutorial-hub-modal');
        if (!modal) {
            createTutorialHubModal();
            modal = document.getElementById('tutorial-hub-modal');
        }
        modal.style.display = 'flex';
        modal.classList.add('active');
    };

    window.closeTutorialHubModal = function() {
        const modal = document.getElementById('tutorial-hub-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
        }
    };

    function createTutorialHubModal() {
        const div = document.createElement('div');
        div.id = 'tutorial-hub-modal';
        div.className = 'modal-overlay';
        div.style.display = 'none';
        div.innerHTML = `
            <div class="modal-content tutorial-hub-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">🧭</span>
                        <div>
                            <h2 style="margin: 0; font-size: 1.22rem; color: #f8fafc; font-weight: 800;">
                                מרכז ההדרכה והפיצ'רים (Semestero ME Academy)
                            </h2>
                            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">
                                כל מה שצריך לדעת על הפלטפורמה — לחץ על כל נושא למעבר ממוקד או הפעל את הסיור המלא
                            </div>
                        </div>
                    </div>
                    <button type="button" class="modal-close" onclick="window.closeTutorialHubModal()">&times;</button>
                </div>

                <div class="modal-body" style="padding-top: 14px;">
                    <div style="background: linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.15)); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <div>
                            <div style="font-weight: 800; color: #38bdf8; font-size: 1rem;">
                                🚀 סיור מודרך מלא של 60 שניות
                            </div>
                            <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 3px;">
                                סיור שלב-אחר-שלב המעביר אותך אוטומטית בין כל מסכי המערכת עם הסבר מפורט.
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" onclick="window.closeTutorialHubModal(); window.startInteractiveTour(0);" style="background: linear-gradient(135deg, #0284c7, #2563eb); border: none; font-weight: 700; padding: 8px 18px; border-radius: 8px;">
                            ▶️ הפעל סיור מלא
                        </button>
                    </div>

                    <div class="tutorial-hub-grid">
                        ${TUTORIAL_MODULES.map(m => `
                            <div class="tutorial-hub-card" onclick="window.closeTutorialHubModal(); window.startInteractiveTour(${m.stepIndex});">
                                <div>
                                    <div class="tutorial-hub-card-header">
                                        <span style="font-size: 1.3rem;">${m.icon}</span>
                                        <span class="tutorial-hub-card-title">${m.title}</span>
                                    </div>
                                    <div class="tutorial-hub-card-desc">${m.desc}</div>
                                </div>
                                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(148, 163, 184, 0.12); padding-top: 8px;">
                                    <span style="font-size: 0.72rem; color: #38bdf8; font-weight: 700;">לחץ להדרכה ממוקדת ➔</span>
                                    <span style="font-size: 0.68rem; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 2px 6px; border-radius: 6px;">שלב ${m.stepIndex + 1}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.78rem; color: #94a3b8;">
                        💡 טיפ: תוכל לפתוח את מרכז ההדרכה בכל עת בלחיצה על <kbd style="background: #1e293b; border: 1px solid #334155; padding: 1px 5px; border-radius: 4px; color: #38bdf8;">Ctrl+K</kbd> וכתיבת "סיור"
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.closeTutorialHubModal()">סגור</button>
                </div>
            </div>
        `;
        div.addEventListener('click', (e) => {
            if (e.target === div) window.closeTutorialHubModal();
        });
        document.body.appendChild(div);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => InteractiveTour.init());
    } else {
        InteractiveTour.init();
    }

})(window, document);
