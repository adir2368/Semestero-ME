import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def build_cards_html():
    return '''        // Generate HTML for Integrations Cards (CheeseFork, Moodle, Google Calendar, Phone Alerts)
        getIntegrationsHubCardsHtml(hasCheeseFork, cfUrl, hasMoodle, moodleUrl, hasPhone, userPhone) {
            return `
                <!-- Card 1: CheeseFork -->
                <div id="integration-card-cheesefork" style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 7px; padding: 12px; margin-bottom: 12px; transition: box-shadow 0.3s, border-color 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.15rem;">🧀</span>
                            <strong style="color: #f8fafc; font-size: 0.88rem;">צ'יזפורק הטכניון (CheeseFork)</strong>
                        </div>
                        <span id="badge-status-cheesefork" style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${hasCheeseFork ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)'}; color: ${hasCheeseFork ? '#10b981' : '#94a3b8'}; border: 1px solid ${hasCheeseFork ? '#10b981' : 'rgba(148, 163, 184, 0.3)'};">
                            ${hasCheeseFork ? '🟢 מחובר ומסונכרן' : '⚪ לא מחובר'}
                        </span>
                    </div>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">
                        סנכרון מערכת שעות שבועית, חדרים ובניינים, ומועדי בחינות ישירות מלוח השעות של הטכניון.
                    </p>
                    <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                        <input type="url" id="integrations-cheesefork-url" class="form-input" style="flex: 1; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.82rem;" placeholder="הדבק קישור שיתוף מ-CheeseFork (לדוגמה: https://cheesefork.cf/...)" value="${cfUrl || ''}">
                        <button type="button" class="btn btn-sm btn-primary" onclick="AuthSync.saveCheeseForkUrl()" style="padding: 7px 12px; font-size: 0.82rem; font-weight: 600; white-space: nowrap; background: #0284c7; border: none; border-radius: 6px; cursor: pointer;">
                            💾 שמור וסנכרן
                        </button>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.73rem;">
                        <a href="https://cheesefork.netlify.app/?semester=202601" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; display: flex; align-items: center; gap: 4px;">
                            <span>🌐</span> <span>פתח את CheeseFork</span>
                        </a>
                        <button type="button" onclick="const h = document.getElementById('cf-help-tooltip'); if(h) h.style.display = h.style.display === 'none' ? 'block' : 'none';" style="background: none; border: none; color: #94a3b8; cursor: pointer; text-decoration: underline; padding: 0;">
                            💡 איך מקבלים קישור שיתוף?
                        </button>
                    </div>
                    <div id="cf-help-tooltip" style="display: none; margin-top: 8px; padding: 8px; background: rgba(15, 23, 42, 0.8); border-radius: 6px; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4; border-right: 3px solid #38bdf8;">
                        1. היכנס למערכת השעות שלך ב-CheeseFork.<br>
                        2. לחץ על כפתור <strong>שיתוף</strong> (Share / 🔗) בראש המסך.<br>
                        3. העתק את הקישור שנוצר, הדבק אותו כאן ולחץ <strong>שמור וסנכרן</strong>.
                    </div>
                </div>

                <!-- Card 2: Moodle -->
                <div id="integration-card-moodle" style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 7px; padding: 12px; margin-bottom: 12px; transition: box-shadow 0.3s, border-color 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.15rem;">🎓</span>
                            <strong style="color: #f8fafc; font-size: 0.88rem;">מודל הטכניון (Moodle Technion)</strong>
                        </div>
                        <span id="badge-status-moodle" style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${hasMoodle ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)'}; color: ${hasMoodle ? '#10b981' : '#94a3b8'}; border: 1px solid ${hasMoodle ? '#10b981' : 'rgba(148, 163, 184, 0.3)'};">
                            ${hasMoodle ? '🟢 מחובר ומסונכרן' : '⚪ לא מחובר'}
                        </span>
                    </div>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">
                        סנכרון אוטומטי של שיעורי בית, תרגילי הגשה ודדליינים ישירות מטבלת המטלות של המודל.
                    </p>
                    <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                        <input type="url" id="integrations-moodle-url" class="form-input" style="flex: 1; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.82rem;" placeholder="הדבק כתובת לוח שנה ממודל (webcal:// או https://moodle...)" value="${moodleUrl || ''}">
                        <button type="button" class="btn btn-sm btn-primary" onclick="AuthSync.saveMoodleUrl()" style="padding: 7px 12px; font-size: 0.82rem; font-weight: 600; white-space: nowrap; background: #0284c7; border: none; border-radius: 6px; cursor: pointer;">
                            💾 שמור וסנכרן
                        </button>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.73rem;">
                        <a href="https://moodle26.technion.ac.il" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; display: flex; align-items: center; gap: 4px;">
                            <span>🌐</span> <span>פתח את Moodle הטכניון</span>
                        </a>
                        <button type="button" onclick="if(window.MoodleSync && typeof window.MoodleSync.openModal==='function') { window.MoodleSync.openModal(); } else { const h=document.getElementById('moodle-help-tooltip'); if(h) h.style.display = h.style.display === 'none' ? 'block' : 'none'; }" style="background: none; border: none; color: #94a3b8; cursor: pointer; text-decoration: underline; padding: 0;">
                            📖 פתח אשף מדריך מודל
                        </button>
                    </div>
                    <div id="moodle-help-tooltip" style="display: none; margin-top: 8px; padding: 8px; background: rgba(15, 23, 42, 0.8); border-radius: 6px; font-size: 0.72rem; color: #cbd5e1; line-height: 1.4; border-right: 3px solid #38bdf8;">
                        1. היכנס למודל הטכניון ובחר ב<strong>לוח שנה</strong>.<br>
                        2. לחץ על <strong>ייצוא לוח שנה</strong> (Export calendar).<br>
                        3. בחר בכל האירועים, לחץ <strong>קבל כתובת URL של לוח שנה</strong>, העתק והדבק כאן.
                    </div>
                </div>

                <!-- Card 3: Google Calendar -->
                <div id="integration-card-gcal" style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 7px; padding: 12px; margin-bottom: 12px; transition: box-shadow 0.3s, border-color 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.15rem;">📅</span>
                            <strong style="color: #f8fafc; font-size: 0.88rem;">יומן גוגל (Google Calendar / Apple)</strong>
                        </div>
                        <span style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981;">
                            🟢 זמין לייצוא וסנכרון
                        </span>
                    </div>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">
                        סנכרן את לוח המבחנים, מערכת השעות ודדליינים ישירות ליומן האישי בטלפון או במחשב.
                    </p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-sm btn-outline" onclick="if(typeof openCalendarSyncModal==='function') openCalendarSyncModal();" style="flex: 1; min-width: 130px; padding: 7px 10px; font-size: 0.80rem; border-color: #38bdf8; color: #38bdf8; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <span>🗓️</span> <span>אשף חיבור ליומן Webcal</span>
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary" onclick="if(typeof exportCalendarToICS==='function') exportCalendarToICS(); else if(typeof exportCalendarData==='function') exportCalendarData();" style="flex: 1; min-width: 130px; padding: 7px 10px; font-size: 0.80rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                            <span>📥</span> <span>הורד קובץ יומן (.ics)</span>
                        </button>
                    </div>
                </div>

                <!-- Card 4: Phone Alerts -->
                <div id="integration-card-phone" style="background: rgba(30, 41, 59, 0.55); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 7px; padding: 12px; margin-bottom: 6px; transition: box-shadow 0.3s, border-color 0.3s;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.15rem;">📱</span>
                            <strong style="color: #f8fafc; font-size: 0.88rem;">התראות ותזכורות לנייד (SMS / WhatsApp)</strong>
                        </div>
                        <span id="badge-status-phone" style="font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; background: ${hasPhone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)'}; color: ${hasPhone ? '#10b981' : '#fbbf24'}; border: 1px solid ${hasPhone ? '#10b981' : '#fbbf24'};">
                            ${hasPhone ? '🟢 מוגדר לקבלת התראות' : '⚠️ לא הוגדר טלפון'}
                        </span>
                    </div>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 8px 0; line-height: 1.4;">
                        תזכורות אוטומטיות לשיעורים 10 דקות לפני ההתחלה, סקירה יומית כל בוקר, והתראות דחופות על דדליינים של שיעורי בית.
                    </p>
                    <div style="font-size: 0.78rem; color: #cbd5e1; display: flex; align-items: center; justify-content: space-between; background: rgba(15, 23, 42, 0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid #334155;">
                        <span>טלפון מוגדר: <strong style="color: #38bdf8;" dir="ltr">${userPhone || 'לא הוגדר עדיין'}</strong></span>
                        <button type="button" onclick="const p=document.getElementById('edit-profile-phone'); if(p){ p.focus(); p.scrollIntoView({behavior:'smooth', block:'center'}); }" style="background: none; border: none; color: #38bdf8; font-size: 0.75rem; cursor: pointer; text-decoration: underline;">
                            ✏️ ערוך מספר בפרטי החשבון
                        </button>
                    </div>
                </div>
            `;
        },
'''

def patch_auth_sync():
    with open('auth_sync.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add toggleIntegrationsHub, saveCheeseForkUrl, saveMoodleUrl, openConnectModal, getIntegrationsHubCardsHtml, renderGuestIntegrationsModal
    new_methods = '''
        // Toggle Integrations & Services Collapsible Drawer
        toggleIntegrationsHub(forceOpen) {
            const content = document.getElementById('integrations-hub-content');
            const arrow = document.getElementById('integrations-hub-toggle-arrow');
            const text = document.getElementById('integrations-hub-toggle-text');
            if (!content) return false;
            const isCurrentlyOpen = content.style.display !== 'none' && content.style.display !== '';
            const shouldOpen = forceOpen !== undefined ? !!forceOpen : !isCurrentlyOpen;
            content.style.display = shouldOpen ? 'block' : 'none';
            if (arrow) {
                arrow.style.transform = shouldOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
            if (text) {
                text.innerText = shouldOpen ? 'הסתר חיבורים' : 'הצג חיבורים';
            }
            return shouldOpen;
        },

        // Save and immediately sync CheeseFork timetable share URL
        async saveCheeseForkUrl(customUrl) {
            let url = typeof customUrl === 'string' ? customUrl.trim() : '';
            if (!url) {
                const input = document.getElementById('integrations-cheesefork-url') || document.getElementById('cheesefork-url');
                if (input) url = input.value.trim();
            }
            if (!url) {
                const msg = '⚠️ נא להזין קישור שיתוף תקין מ-CheeseFork.';
                if (typeof showToastNotification === 'function') {
                    showToastNotification(msg, 'warning');
                } else if (typeof showHudToast === 'function') {
                    showHudToast(msg, 'warning');
                } else {
                    alert(msg);
                }
                return false;
            }
            try {
                localStorage.setItem('ast_cheesefork_url', url);
                const cfInput = document.getElementById('cheesefork-url');
                if (cfInput) cfInput.value = url;
                const curState = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState) || {};
                curState.userProfile = curState.userProfile || {};
                curState.userProfile.cheeseforkUrl = url;
                if (typeof saveState === 'function') saveState();

                const badge = document.getElementById('badge-status-cheesefork');
                if (badge) {
                    badge.innerText = '🟢 מחובר ומסונכרן';
                    badge.style.color = '#10b981';
                    badge.style.background = 'rgba(16, 185, 129, 0.15)';
                    badge.style.borderColor = '#10b981';
                }
                const countBadge = document.getElementById('integrations-hub-count-badge');
                if (countBadge) {
                    const hasMoodle = !!((window.MoodleSync && window.MoodleSync.config && window.MoodleSync.config.url) || localStorage.getItem('ast_moodle_calendar_url'));
                    const hasPhone = !!((window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || (AuthSync.getActiveUser && AuthSync.getActiveUser().phone));
                    const cnt = 1 + (hasMoodle ? 1 : 0) + (hasPhone ? 1 : 0) + 1;
                    countBadge.innerText = `${cnt}/4 מחוברים`;
                }

                const msg = 'קישור CheeseFork נשמר בהצלחה! מסנכרן נתונים... 🧀';
                if (typeof showToastNotification === 'function') {
                    showToastNotification(msg, 'success');
                } else if (typeof showHudToast === 'function') {
                    showHudToast(msg, 'success');
                }

                if (typeof window.syncLiveCheeseForkData === 'function') {
                    await window.syncLiveCheeseForkData(url, true);
                } else if (typeof updateDailyTimetableFocus === 'function') {
                    updateDailyTimetableFocus();
                }

                if (this.isLoggedIn()) {
                    this.triggerDebouncedCloudSync(curState);
                }
                return true;
            } catch (e) {
                console.error('[AuthSync] Error saving CheeseFork URL:', e);
                return false;
            }
        },

        // Save and immediately sync Moodle calendar/tasks URL
        async saveMoodleUrl(customUrl) {
            let url = typeof customUrl === 'string' ? customUrl.trim() : '';
            if (!url) {
                const input = document.getElementById('integrations-moodle-url') || document.getElementById('modal-moodle-calendar-url');
                if (input) url = input.value.trim();
            }
            if (!url) {
                const msg = '⚠️ נא להזין קישור לוח שנה תקין ממודל הטכניון.';
                if (typeof showToastNotification === 'function') {
                    showToastNotification(msg, 'warning');
                } else if (typeof showHudToast === 'function') {
                    showHudToast(msg, 'warning');
                } else {
                    alert(msg);
                }
                return false;
            }
            try {
                localStorage.setItem('ast_moodle_calendar_url', url);
                localStorage.setItem('atlas_me_moodle_sync_default', url);
                if (window.MoodleSync && window.MoodleSync.config) {
                    window.MoodleSync.config.url = url;
                    if (typeof window.MoodleSync.saveConfig === 'function') {
                        window.MoodleSync.saveConfig();
                    }
                }
                const curState = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState) || {};
                curState.moodleCalendarUrl = url;
                if (typeof saveState === 'function') saveState();

                const badge = document.getElementById('badge-status-moodle');
                if (badge) {
                    badge.innerText = '🟢 מחובר ומסונכרן';
                    badge.style.color = '#10b981';
                    badge.style.background = 'rgba(16, 185, 129, 0.15)';
                    badge.style.borderColor = '#10b981';
                }
                const countBadge = document.getElementById('integrations-hub-count-badge');
                if (countBadge) {
                    const hasCheeseFork = !!(localStorage.getItem('ast_cheesefork_url') || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.cheeseforkUrl));
                    const hasPhone = !!((window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || (AuthSync.getActiveUser && AuthSync.getActiveUser().phone));
                    const cnt = (hasCheeseFork ? 1 : 0) + 1 + (hasPhone ? 1 : 0) + 1;
                    countBadge.innerText = `${cnt}/4 מחוברים`;
                }

                const msg = 'קישור מודל הטכניון נשמר בהצלחה! 🎓';
                if (typeof showToastNotification === 'function') {
                    showToastNotification(msg, 'success');
                } else if (typeof showHudToast === 'function') {
                    showHudToast(msg, 'success');
                }

                if (window.MoodleSync && typeof window.MoodleSync.sync === 'function') {
                    window.MoodleSync.sync({ isSilent: false });
                } else if (typeof window.refreshTasks === 'function') {
                    window.refreshTasks({ isSilent: false });
                }

                if (this.isLoggedIn()) {
                    this.triggerDebouncedCloudSync(curState);
                }
                return true;
            } catch (e) {
                console.error('[AuthSync] Error saving Moodle URL:', e);
                return false;
            }
        },

        // Unified Open Connect Modal: jumps directly to the service input and pulses highlight
        openConnectModal(targetService = 'cheesefork') {
            if (this.isLoggedIn()) {
                this.openAuthModal();
            } else {
                this.openAuthModal('integrations');
            }
            this.toggleIntegrationsHub(true);

            const targetKey = String(targetService).toLowerCase();
            const serviceMap = {
                'cheesefork': { card: 'integration-card-cheesefork', input: 'integrations-cheesefork-url' },
                'cf': { card: 'integration-card-cheesefork', input: 'integrations-cheesefork-url' },
                'moodle': { card: 'integration-card-moodle', input: 'integrations-moodle-url' },
                'gcal': { card: 'integration-card-gcal', input: null },
                'google': { card: 'integration-card-gcal', input: null },
                'phone': { card: 'integration-card-phone', input: 'edit-profile-phone' }
            };
            const target = serviceMap[targetKey] || serviceMap['cheesefork'];

            setTimeout(() => {
                const cardEl = document.getElementById(target.card);
                if (cardEl) {
                    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    cardEl.style.boxShadow = '0 0 18px rgba(56, 189, 248, 0.85)';
                    cardEl.style.borderColor = '#38bdf8';
                    setTimeout(() => {
                        if (cardEl) {
                            cardEl.style.boxShadow = '';
                            cardEl.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }
                    }, 2500);
                }
                if (target.input) {
                    const inputEl = document.getElementById(target.input);
                    if (inputEl) {
                        inputEl.focus();
                        if (typeof inputEl.select === 'function') inputEl.select();
                    }
                }
            }, 180);
        },

        // Render standalone integrations modal for guests/unconnected users
        renderGuestIntegrationsModal() {
            const container = document.getElementById('auth-modal-content-container');
            if (!container) return;
            const hasCheeseFork = !!(localStorage.getItem('ast_cheesefork_url') || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.cheeseforkUrl));
            const cfUrl = localStorage.getItem('ast_cheesefork_url') || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.cheeseforkUrl) || '';
            const hasMoodle = !!((window.MoodleSync && window.MoodleSync.config && window.MoodleSync.config.url) || localStorage.getItem('ast_moodle_calendar_url'));
            const moodleUrl = (window.MoodleSync && window.MoodleSync.config && window.MoodleSync.config.url) || localStorage.getItem('ast_moodle_calendar_url') || '';
            const userPhone = (window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || '';
            const hasPhone = !!userPhone;
            const connectedCount = (hasCheeseFork ? 1 : 0) + (hasMoodle ? 1 : 0) + (hasPhone ? 1 : 0) + 1;

            container.innerHTML = `
                <div class="modal-header">
                    <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                        <span>🔗</span> <span>מרכז חיבורים ואינטגרציות</span>
                    </h2>
                    <p style="margin: 6px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
                        סנכרון שירותים אקדמיים (CheeseFork, Moodle, יומן גוגל)
                    </p>
                </div>
                <div class="modal-body" style="padding-top: 14px; max-height: 75vh; overflow-y: auto;">
                    <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <div style="font-size: 0.80rem; color: #cbd5e1;">
                            💡 <strong>התחבר לחשבון</strong> כדי שהשירותים יסונכרנו אוטומטית בין המחשב לאפליקציה בטלפון.
                        </div>
                        <button type="button" class="btn btn-xs btn-primary" onclick="AuthSync.renderAuthModal('login')" style="background: #0284c7; font-weight: 700; padding: 5px 12px; border-radius: 6px;">
                            🔑 התחבר לחשבון
                        </button>
                    </div>

                    ${this.getIntegrationsHubCardsHtml(hasCheeseFork, cfUrl, hasMoodle, moodleUrl, hasPhone, userPhone)}

                    <div style="text-align: center; margin-top: 14px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.12);">
                        <button type="button" class="btn btn-sm btn-outline" onclick="AuthSync.renderAuthModal('login')" style="font-size: 0.82rem;">
                            ⬅️ חזרה למסך התחברות
                        </button>
                    </div>
                </div>
            `;
        },
''' + build_cards_html()

    # Insert new methods before openAccountsModal
    content = content.replace('        openAccountsModal() {', new_methods + '\n        openAccountsModal() {')

    # Also bind window.openConnectModal at the end
    content = content.replace('window.AuthSync = AuthSync;', '''window.AuthSync = AuthSync;
    window.openConnectModal = function(service) {
        if (window.AuthSync && typeof window.AuthSync.openConnectModal === 'function') {
            window.AuthSync.openConnectModal(service);
        }
    };''')

    # In renderAuthModal(activeTab): add activeTab === 'integrations' check
    old_render_start = """        renderAuthModal(activeTab) {
            if (activeTab === 'register') {
                this.closeAuthModal();
                this.openOnboardingWizard();
                return;
            }"""
    new_render_start = """        renderAuthModal(activeTab) {
            if (activeTab === 'register') {
                this.closeAuthModal();
                this.openOnboardingWizard();
                return;
            }
            if (activeTab === 'integrations') {
                this.renderGuestIntegrationsModal();
                return;
            }"""
    content = content.replace(old_render_start, new_render_start)

    # In isLoggedIn branch of renderAuthModal: compute variables and inject collapsible hub
    old_is_logged_in_setup = """                const currentSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : (user.startingSemester || 1);
                const headerAvatar = isDev 
                    ? `<picture><source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp"><img src="adir_avatar_small.png?v=2.3.1" alt="Adir Moshe" width="28" height="28" style="width: 28px; height: 28px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));"></picture>` 
                    : `<span>${user.avatar}</span>`;"""

    new_is_logged_in_setup = """                const currentSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : (user.startingSemester || 1);
                const headerAvatar = isDev 
                    ? `<picture><source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp"><img src="adir_avatar_small.png?v=2.3.1" alt="Adir Moshe" width="28" height="28" style="width: 28px; height: 28px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));"></picture>` 
                    : `<span>${user.avatar}</span>`;

                const hasCheeseFork = !!(localStorage.getItem('ast_cheesefork_url') || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.cheeseforkUrl));
                const cfUrl = localStorage.getItem('ast_cheesefork_url') || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.cheeseforkUrl) || '';
                const hasMoodle = !!((window.MoodleSync && window.MoodleSync.config && window.MoodleSync.config.url) || localStorage.getItem('ast_moodle_calendar_url'));
                const moodleUrl = (window.MoodleSync && window.MoodleSync.config && window.MoodleSync.config.url) || localStorage.getItem('ast_moodle_calendar_url') || '';
                const userPhone = (user && user.phone) || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || '';
                const hasPhone = !!userPhone;
                const connectedCount = (hasCheeseFork ? 1 : 0) + (hasMoodle ? 1 : 0) + (hasPhone ? 1 : 0) + 1;

                const integrationsCollapsibleHtml = `
                    <!-- Collapsible Integrations Center (חלונית נפתחת לאינטגרציות ושירותים) -->
                    <div id="integrations-hub-container" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; margin-bottom: 14px; overflow: hidden; transition: all 0.25s ease;">
                        <div onclick="AuthSync.toggleIntegrationsHub();" style="padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(56, 189, 248, 0.08); user-select: none;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 1.2rem;">🔗</span>
                                <div>
                                    <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem; display: flex; align-items: center; gap: 8px;">
                                        <span>מרכז חיבורים ואינטגרציות</span>
                                        <span id="integrations-hub-count-badge" style="font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 12px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                                            ${connectedCount}/4 מחוברים
                                        </span>
                                    </div>
                                    <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                                        חיבור וסנכרון מערכת שעות מ-CheeseFork, מטלות ממודל, יומן גוגל והתראות
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;" id="integrations-hub-toggle-text">הצג חיבורים</span>
                                <span id="integrations-hub-toggle-arrow" style="font-size: 0.85rem; color: #38bdf8; transition: transform 0.25s ease; display: inline-block;">▼</span>
                            </div>
                        </div>

                        <div id="integrations-hub-content" style="display: none; padding: 14px; border-top: 1px solid rgba(56, 189, 248, 0.15); background: rgba(10, 15, 30, 0.5);">
                            ${this.getIntegrationsHubCardsHtml(hasCheeseFork, cfUrl, hasMoodle, moodleUrl, hasPhone, userPhone)}
                        </div>
                    </div>
                `;"""

    content = content.replace(old_is_logged_in_setup, new_is_logged_in_setup)

    # Insert ${integrationsCollapsibleHtml} right before <!-- Edit Account Form -->
    content = content.replace('<!-- Edit Account Form -->', '${integrationsCollapsibleHtml}\n\n                        <!-- Edit Account Form -->')

    with open('auth_sync.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: auth_sync.js patched cleanly!")

def patch_app_and_timetable():
    # 1. Patch app.js
    with open('app.js', 'r', encoding='utf-8') as f:
        app_content = f.read()

    # In btn-sync-cheesefork-now click handler
    old_cf_sync = """                const cfInput = document.getElementById('cheesefork-url');
                if (cfInput) {
                    cfInput.focus();
                    cfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;"""
    new_cf_sync = """                if (typeof window.openConnectModal === 'function') {
                    window.openConnectModal('cheesefork');
                } else {
                    const cfInput = document.getElementById('cheesefork-url');
                    if (cfInput) {
                        cfInput.focus();
                        cfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                return;"""
    if old_cf_sync in app_content:
        app_content = app_content.replace(old_cf_sync, new_cf_sync)
        print("SUCCESS: btn-sync-cheesefork-now patched in app.js!")

    # In btn-cheesefork-import click handler
    old_cf_import = """                if (urlInput) urlInput.focus();
                return;"""
    new_cf_import = """                if (typeof window.openConnectModal === 'function') {
                    window.openConnectModal('cheesefork');
                } else if (urlInput) {
                    urlInput.focus();
                }
                return;"""
    if old_cf_import in app_content:
        app_content = app_content.replace(old_cf_import, new_cf_import)
        print("SUCCESS: btn-cheesefork-import patched in app.js!")

    # In syncLiveCheeseForkData
    old_cf_live = """        const cfInput = document.getElementById("cheesefork-url");
        if (cfInput) {
            cfInput.focus();
            cfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;"""
    new_cf_live = """        if (typeof window.openConnectModal === 'function') {
            window.openConnectModal('cheesefork');
        } else {
            const cfInput = document.getElementById("cheesefork-url");
            if (cfInput) {
                cfInput.focus();
                cfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return;"""
    if old_cf_live in app_content:
        app_content = app_content.replace(old_cf_live, new_cf_live)
        print("SUCCESS: syncLiveCheeseForkData patched in app.js!")

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_content)

    # 2. Patch timetable_generator.js
    with open('timetable_generator.js', 'r', encoding='utf-8') as f:
        ttg_content = f.read()

    old_ttg_cf = """                        if (typeof showToastNotification === 'function') {
                            showToastNotification(msg, 'warning');
                        } else if (typeof alert === 'function') {
                            alert(msg);
                        }
                        return;"""
    new_ttg_cf = """                        if (typeof showToastNotification === 'function') {
                            showToastNotification(msg, 'warning');
                        } else if (typeof alert === 'function') {
                            alert(msg);
                        }
                        if (typeof window.openConnectModal === 'function') {
                            window.openConnectModal('cheesefork');
                        }
                        return;"""
    if old_ttg_cf in ttg_content:
        ttg_content = ttg_content.replace(old_ttg_cf, new_ttg_cf)
        print("SUCCESS: syncCfBtn patched in timetable_generator.js!")

    with open('timetable_generator.js', 'w', encoding='utf-8') as f:
        f.write(ttg_content)

if __name__ == '__main__':
    patch_auth_sync()
    patch_app_and_timetable()
