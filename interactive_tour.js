// Semestero ME - Interactive Guided Tour Engine (v2.2.1)
// Provides a friendly step-by-step tour with skip and restart options anytime.

(function(window) {
    'use strict';

    const TOUR_STORAGE_KEY = 'ast_interactive_tour_completed';

    const TOUR_STEPS = [
        {
            icon: '👋',
            title: 'ברוכים הבאים ל-Semestero ME!',
            subtitle: 'מערכת ניווט ותכנון תואר חכמה להנדסת מכונות בטכניון',
            content: `
                שמחים שהצטרפת! המערכת נבנתה במיוחד כדי לעזור לך לתכנן את התואר, לעקוב אחר ממוצע הציונים, ולנהל משימות ומבחנים בקלות.
                <br><br>
                בוא נעבור סיור מהיר של 60 שניות שיעשה לך סדר בכל הפיצ'רים המרכזיים.
            `,
            workspace: 'curriculum',
            highlightSelector: null
        },
        {
            icon: '🌳',
            title: 'עץ הקורסים ודרישות הקדם (Skill Tree)',
            subtitle: 'מפת הלימודים המלאה של הפקולטה',
            content: `
                כל קורסי התואר מסודרים לפי סמסטרים א׳ עד ח׳.
                <br><br>
                • <strong>לחיצה על קורס:</strong> פותחת את כרטיס הקורס (ציונים, מועדי בחינות, שינוי סמסטר).<br>
                • <strong>שרשרת קדמים:</strong> לחיצה מאירה את כל הקדמים ההיסטוריים של הקורס בכחול/זהב, ואת הקורסים העתידיים שהוא פותח בירוק!
            `,
            workspace: 'curriculum',
            highlightSelector: '#flowchart-viewport'
        },
        {
            icon: '📅',
            title: 'מתכנן התואר האישי (Degree Planner)',
            subtitle: 'גרירה, שיבוץ וניהול עומסים',
            content: `
                במסך "תכנון תואר" תוכל להזיז קורסים בין סמסטרים, לתכנן שנות לימוד עתידיות, ולראות את מדדי העומס, השעות והמעבדות מתעדכנים בזמן אמת.
                <br><br>
                תוכל לשמור תוכנית אישית שמסונכרנת ישירות עם עץ הקורסים!
            `,
            workspace: 'planner',
            highlightSelector: '#degree-planner-container'
        },
        {
            icon: '📊',
            title: 'מרכז ביצועים ואנליטיקת ממוצע (GPA Hub)',
            subtitle: 'מעקב מדויק אחר הממוצע וצבירת הנק״ז',
            content: `
                לחיצה על קוביית הממוצע בסרגל העליון פותחת את מרכז הביצועים:
                <br><br>
                • <strong>גרף ממוצעים סמסטריאלי:</strong> עקומת הציונים לאורך התואר.<br>
                • <strong>תרשים פילוח נק״ז לתואר:</strong> חלוקה לקורסי חובה, בחירה פקולטית ובחירה חופשית.<br>
                • <strong>מחשבון שקלול:</strong> הזנת ציון מבחן ומשקל לקבלת ציון סופי מדויק.
            `,
            workspace: 'curriculum',
            highlightSelector: '#stat-item-gpa'
        },
        {
            icon: '📋',
            title: 'לוח שנה, משימות וסנכרון Moodle',
            subtitle: 'כל מה שחשוב במקום אחד',
            content: `
                • <strong>סנכרון Moodle:</strong> משיכת שיעורי בית ומטלות הגשה ישירות מהמודל.<br>
                • <strong>לוח שנה אקדמי:</strong> מועדי בחינות (מועד א' ו-ב') ואירועים אישיים.<br>
                • <strong>סנכרון ענן מאובטח:</strong> הנתונים שלך נשמרים ומסתנכרנים אוטומטית בין המחשב לטלפון!
            `,
            workspace: 'calendar',
            highlightSelector: '#tab-nav-calendar'
        },
        {
            icon: '❓',
            title: 'כפתורי עזרה והסבר בכל חלונית!',
            subtitle: 'אף פעם לא הולכים לאיבוד',
            content: `
                מרגיש מוצף או לא בטוח מה כפתור מסוים עושה?
                <br><br>
                בכל חלונית ומודל במערכת הוספנו כפתור עזרה <strong>"?"</strong> עגול.<br>
                לחיצה עליו פותחת הסבר מפורט על כל האפשרויות והרכיבים בחלונית!
                <br><br>
                תוכל להפעיל את הסיור הזה מחדש בכל עת בראש <strong>הגדרות המערכת ⚙️</strong>.
            `,
            workspace: 'curriculum',
            highlightSelector: null
        }
    ];

    const InteractiveTour = {
        currentStep: 0,
        active: false,

        init() {
            this.injectStyles();

            // Auto-prompt tour on first launch for new users
            setTimeout(() => {
                const tourDone = localStorage.getItem(TOUR_STORAGE_KEY);
                if (tourDone !== 'true') {
                    this.showWelcomeTourPrompt();
                }
            }, 1600);
        },

        injectStyles() {
            if (document.getElementById('tour-custom-styles')) return;
            const style = document.createElement('style');
            style.id = 'tour-custom-styles';
            style.textContent = `
                .tour-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.78);
                    backdrop-filter: blur(4px);
                    z-index: 99998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: tourFadeIn 0.25s ease-out;
                }
                @keyframes tourFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .tour-card {
                    background: #0f172a;
                    border: 1px solid rgba(56, 189, 248, 0.4);
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2);
                    border-radius: 14px;
                    max-width: 520px;
                    width: 92%;
                    direction: rtl;
                    text-align: right;
                    overflow: hidden;
                    animation: tourCardSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    z-index: 99999;
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
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-weight: 700;
                }
                .tour-card-body {
                    padding: 20px 22px;
                    color: #e2e8f0;
                    font-size: 0.88rem;
                    line-height: 1.6;
                }
                .tour-progress-bar {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.08);
                    width: 100%;
                }
                .tour-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #38bdf8, #3b82f6);
                    transition: width 0.3s ease;
                }
                .tour-card-footer {
                    padding: 14px 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    background: rgba(15, 23, 42, 0.6);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .btn-tour-nav {
                    padding: 7px 16px;
                    border-radius: 8px;
                    font-size: 0.84rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.2s;
                }
                .btn-tour-skip {
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 0.82rem;
                    padding: 6px 10px;
                }
                .btn-tour-skip:hover {
                    color: #f1f5f9;
                    text-decoration: underline;
                }
                .btn-hud-tour-trigger {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(56, 189, 248, 0.12);
                    color: #38bdf8;
                    border: 1px solid rgba(56, 189, 248, 0.3);
                    border-radius: 8px;
                    padding: 5px 10px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: inherit;
                    transition: all 0.2s;
                }
                .btn-hud-tour-trigger:hover {
                    background: rgba(56, 189, 248, 0.25);
                    border-color: #38bdf8;
                    color: #fff;
                    box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
                }
            `;
            document.head.appendChild(style);
        },

        showWelcomeTourPrompt() {
            // Prompt user gently on first visit
            const promptEl = document.createElement('div');
            promptEl.id = 'tour-welcome-prompt';
            promptEl.className = 'tour-backdrop';
            promptEl.innerHTML = `
                <div class="tour-card" style="max-width: 460px;">
                    <div class="tour-card-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.5rem;">🧭</span>
                            <span style="font-weight: 800; color: #38bdf8; font-size: 1.1rem;">סיור היכרות עם Semestero ME</span>
                        </div>
                    </div>
                    <div class="tour-card-body">
                        שלום! רוצה סיור קצר של דקה שיסביר לך איך לתכנן את התואר, להזין ציונים, ולהשתמש בכל הפיצ'רים?
                        <div style="margin-top: 10px; font-size: 0.78rem; color: #94a3b8;">
                            תמיד תוכל להפעיל את הסיור מחדש דרך תפריט ההגדרות.
                        </div>
                    </div>
                    <div class="tour-card-footer">
                        <button type="button" class="btn-tour-skip" id="btn-prompt-skip-tour">
                            דלג (אני כבר מכיר)
                        </button>
                        <button type="button" class="btn btn-primary btn-tour-nav" id="btn-prompt-start-tour" style="background: linear-gradient(135deg, #0284c7, #2563eb); border: none;">
                            🚀 התחל סיור מודרך
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(promptEl);

            document.getElementById('btn-prompt-start-tour').onclick = () => {
                promptEl.remove();
                this.startTour();
            };

            document.getElementById('btn-prompt-skip-tour').onclick = () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
                promptEl.remove();
                if (typeof showToastNotification === 'function') {
                    showToastNotification('הסיור דולג. ניתן להפעילו בכל עת מתפריט ההגדרות 🧭', 'info');
                }
            };
        },

        startTour() {
            this.currentStep = 0;
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

            // Switch workspace if needed
            if (step.workspace) {
                if (step.workspace === 'curriculum' && typeof window.switchWorkspace === 'function') {
                    window.switchWorkspace('curriculum');
                } else if (step.workspace === 'planner' && typeof window.switchWorkspace === 'function') {
                    window.switchWorkspace('planner');
                } else if (step.workspace === 'calendar' && typeof window.switchWorkspace === 'function') {
                    window.switchWorkspace('calendar');
                }
            }

            const isLast = this.currentStep === totalSteps - 1;
            const isFirst = this.currentStep === 0;

            container.innerHTML = `
                <div class="tour-card">
                    <div class="tour-progress-bar">
                        <div class="tour-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div class="tour-card-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.5rem;">${step.icon}</span>
                            <div>
                                <h3 style="margin: 0; color: #38bdf8; font-size: 1.05rem; font-weight: 800;">
                                    ${step.title}
                                </h3>
                                <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 1px;">
                                    ${step.subtitle}
                                </div>
                            </div>
                        </div>
                        <span class="tour-step-badge">שלב ${this.currentStep + 1} מתוך ${totalSteps}</span>
                    </div>

                    <div class="tour-card-body">
                        ${step.content}
                    </div>

                    <div class="tour-card-footer">
                        <button type="button" class="btn-tour-skip" id="btn-tour-skip-all">
                            דלג על הסיור
                        </button>
                        <div style="display: flex; gap: 8px;">
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

            if (typeof window.switchWorkspace === 'function') {
                window.switchWorkspace('curriculum');
            }

            if (typeof showToastNotification === 'function') {
                if (skipped) {
                    showToastNotification('הסיור דולג. תוכל להפעילו מחדש בכל עת דרך ההגדרות 🧭', 'info');
                } else {
                    showToastNotification('כל הכבוד! סיימת את הסיור ב-Semestero ME בהצלחה 🎓', 'success');
                }
            }
        }
    };

    window.InteractiveTour = InteractiveTour;
    window.startInteractiveTour = () => InteractiveTour.startTour();

    document.addEventListener('DOMContentLoaded', () => {
        InteractiveTour.init();
    });

})(window);
