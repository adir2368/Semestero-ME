import re

with open('app.js', 'r', encoding='utf-8') as f:
    code = f.read()

crlf = '\r\n' in code

def norm(text):
    return text.replace('\n', '\r\n') if crlf else text.replace('\r\n', '\n')

def replace_exact(full_text, target, repl, label):
    t_norm = norm(target)
    r_norm = norm(repl)
    if t_norm not in full_text:
        raise ValueError(f"Target for {label} not found in app.js!")
    print(f"Applying: {label}")
    return full_text.replace(t_norm, r_norm, 1)

# 1. syncScheduleToCloudGist
t1 = """// Asynchronous background update to GitHub Gist
async function syncScheduleToCloudGist(showToast = true) {
    if (!CLOUD_GIST_SYNC.token || !CLOUD_GIST_SYNC.token.trim()) {
        // No personal access token configured - gracefully skip cloud gist update without throwing 401
        return false;
    }"""
r1 = """// Asynchronous background update to GitHub Gist
async function syncScheduleToCloudGist(showToast = true) {
    if (!CLOUD_GIST_SYNC.token || !CLOUD_GIST_SYNC.token.trim()) {
        const indicator = document.getElementById("sync-status-indicator");
        if (indicator) indicator.innerText = "⚪ אינו מחובר לסנכרון ענן";
        if (showToast) {
            showToastNotification("⚠️ אינך מחובר לסנכרון ענן (Google Calendar)! לא הוגדר טוקן סנכרון פעיל.", 'warning');
        }
        return false;
    }"""
code = replace_exact(code, t1, r1, "syncScheduleToCloudGist")

# 2. openCalendarSyncModal triggerBtn
t2 = """    const triggerBtn = document.getElementById("btn-trigger-cloud-sync");
    if (triggerBtn) {
        if (!isConnected) {
            triggerBtn.style.display = "none";
        } else {
            triggerBtn.style.display = "inline-flex";
            triggerBtn.onclick = () => {
                triggerBtn.disabled = true;
                triggerBtn.innerText = "🔄 מסנכרן...";
                syncScheduleToCloudGist(true).finally(() => {
                    triggerBtn.disabled = false;
                    triggerBtn.innerText = "🔄 סנכרן עכשיו לענן";
                });
            };
        }
    }"""
r2 = """    const triggerBtn = document.getElementById("btn-trigger-cloud-sync");
    if (triggerBtn) {
        triggerBtn.style.display = "inline-flex";
        if (!isConnected) {
            triggerBtn.onclick = () => {
                showToastNotification("⚠️ אינך מחובר לסנכרון ענן (Google Calendar). התחבר לחשבונך תחילה.", "warning");
                const indicator = document.getElementById("sync-status-indicator");
                if (indicator) indicator.innerText = "⚪ אינו מחובר לסנכרון ענן";
            };
        } else {
            triggerBtn.onclick = () => {
                triggerBtn.disabled = true;
                triggerBtn.innerText = "🔄 מסנכרן...";
                syncScheduleToCloudGist(true).finally(() => {
                    triggerBtn.disabled = false;
                    triggerBtn.innerText = "🔄 סנכרן עכשיו לענן";
                });
            };
        }
    }"""
code = replace_exact(code, t2, r2, "openCalendarSyncModal triggerBtn")

# 3. exportTimetableCancellationICS
t3 = """    icsLines.push('END:VCALENDAR');

    const icsContent = icsLines.join('\\r\\n');
    downloadICSFile(icsContent, 'Semestero_ME_Cancel_And_Delete_Classes.ics');"""
r3 = """    icsLines.push('END:VCALENDAR');

    if (totalCancelled === 0) {
        if (typeof showToastNotification === 'function') {
            showToastNotification('לא נמצאו שיעורים פעילים במערכת השעות לביטול ביומן 📅', 'warning');
        }
        return;
    }

    const icsContent = icsLines.join('\\r\\n');
    downloadICSFile(icsContent, 'Semestero_ME_Cancel_And_Delete_Classes.ics');"""
code = replace_exact(code, t3, r3, "exportTimetableCancellationICS")

# 4. renderSettingsPage
t4 = """    if (webhookInput) webhookInput.value = gameState.googleAppsScriptWebhookUrl || "";
    if (syncFreqSelect) syncFreqSelect.value = gameState.syncFrequencyHours || 1;

    // 3. Populate Section 4: Academic Goals & Reminders"""
r4 = """    if (webhookInput) webhookInput.value = gameState.googleAppsScriptWebhookUrl || "";
    if (syncFreqSelect) syncFreqSelect.value = gameState.syncFrequencyHours || 1;

    // Update settings Google Calendar status badge truthfully
    const gcalStatusBadge = document.getElementById("settings-gcal-status-badge");
    const examsVal = calExamsInput ? calExamsInput.value.trim() : "";
    const hwVal = calHwInput ? calHwInput.value.trim() : "";
    const practiceVal = calPracticeInput ? calPracticeInput.value.trim() : "";
    const webhookVal = webhookInput ? webhookInput.value.trim() : "";
    const isGcalConnected = !!(examsVal || hwVal || practiceVal || webhookVal);

    if (gcalStatusBadge) {
        if (isGcalConnected) {
            gcalStatusBadge.innerText = "🟢 מחובר ליומני Google (מזהים או Webhook מוגדרים)";
            gcalStatusBadge.style.background = "rgba(16, 185, 129, 0.15)";
            gcalStatusBadge.style.color = "#34d399";
            gcalStatusBadge.style.borderColor = "rgba(16, 185, 129, 0.4)";
        } else {
            gcalStatusBadge.innerText = "⚪ אינו מחובר ליומני Google — הזן מזהי יומן או Webhook לסנכרון";
            gcalStatusBadge.style.background = "rgba(148, 163, 184, 0.15)";
            gcalStatusBadge.style.color = "#94a3b8";
            gcalStatusBadge.style.borderColor = "rgba(148, 163, 184, 0.4)";
        }
    }

    // 3. Populate Section 4: Academic Goals & Reminders"""
code = replace_exact(code, t4, r4, "renderSettingsPage Google Calendar Badge")

# 5. saveCalendarsSection
t5 = """    notifyStateChanged({ tab: 'settings' });
    const statusDiv = document.getElementById("webhook-save-status");
    if (statusDiv) {
        statusDiv.innerText = "✓ הגדרות יומנים נשמרו!";
        setTimeout(() => { statusDiv.innerText = ""; }, 3000);
    }
    showToastNotification("✅ הגדרות יומני Google נשמרו בהצלחה!", "success");"""
r5 = """    notifyStateChanged({ tab: 'settings' });

    const isGcalConnected = !!(
        (gameState.calendarIds && (gameState.calendarIds.exams || gameState.calendarIds.hw || gameState.calendarIds.practice)) ||
        gameState.googleAppsScriptWebhookUrl
    );

    const gcalStatusBadge = document.getElementById("settings-gcal-status-badge");
    if (gcalStatusBadge) {
        if (isGcalConnected) {
            gcalStatusBadge.innerText = "🟢 מחובר ליומני Google (מזהים או Webhook מוגדרים)";
            gcalStatusBadge.style.background = "rgba(16, 185, 129, 0.15)";
            gcalStatusBadge.style.color = "#34d399";
            gcalStatusBadge.style.borderColor = "rgba(16, 185, 129, 0.4)";
        } else {
            gcalStatusBadge.innerText = "⚪ אינו מחובר ליומני Google — הזן מזהי יומן או Webhook לסנכרון";
            gcalStatusBadge.style.background = "rgba(148, 163, 184, 0.15)";
            gcalStatusBadge.style.color = "#94a3b8";
            gcalStatusBadge.style.borderColor = "rgba(148, 163, 184, 0.4)";
        }
    }

    const statusDiv = document.getElementById("webhook-save-status");
    if (statusDiv) {
        statusDiv.innerText = isGcalConnected ? "✓ הגדרות יומנים נשמרו!" : "⚠️ נשמר (אינו מחובר ליומני Google)";
        setTimeout(() => { statusDiv.innerText = ""; }, 3000);
    }

    if (!isGcalConnected) {
        showToastNotification("⚠️ הגדרות נשמרו (שימו לב: אינך מחובר ליומני Google — טרם הוגדרו מזהים)", "info");
    } else {
        showToastNotification("✅ מחובר! הגדרות יומני Google נשמרו בהצלחה.", "success");
    }"""
code = replace_exact(code, t5, r5, "saveCalendarsSection Truthful Status")

# 6. renderPhoneAndNotificationPreferences
t6 = """    if (phoneStatus) {
        if (phone) {
            phoneStatus.className = "phone-status-badge badge-verified";
            phoneStatus.innerText = `✓ מספר מעודכן (${phone})`;
        } else {
            phoneStatus.className = "phone-status-badge badge-pending";
            phoneStatus.innerText = "⚠️ לא הוגדר מספר";
        }
    }"""
r6 = """    const phoneDesc = document.getElementById("phone-status-desc");
    const isCloudUser = window.AuthSync && typeof window.AuthSync.isLoggedIn === 'function' && window.AuthSync.isLoggedIn();
    if (phoneStatus) {
        if (phone) {
            phoneStatus.className = "phone-status-badge badge-verified";
            phoneStatus.innerText = isCloudUser ? `🟢 מחובר לענן (${phone})` : `📱 מוגדר מקומית (${phone})`;
        } else {
            phoneStatus.className = "phone-status-badge badge-pending";
            phoneStatus.innerText = "⚪ אינו מחובר — לא הוגדר מספר";
        }
    }
    if (phoneDesc) {
        if (phone) {
            phoneDesc.innerText = isCloudUser ? "מספר הטלפון מוגדר ומאובטח בפרטי החשבון ומסונכרן לענן" : "מספר הטלפון שמור במכשיר המקומי (אינך מחובר לחשבון ענן)";
        } else {
            phoneDesc.innerText = "ערוץ התראות אינו מחובר — הזן מספר טלפון להפעלת התראות";
        }
    }"""
code = replace_exact(code, t6, r6, "renderPhoneAndNotificationPreferences status")

# 6b. drawerPhoneBadge in drawer
t6b = """    if (drawerPhoneBadge) {
        if (phone) {
            drawerPhoneBadge.className = "drawer-phone-badge has-phone";
            drawerPhoneBadge.innerText = `✓ ${phone}`;
        } else {
            drawerPhoneBadge.className = "drawer-phone-badge";
            drawerPhoneBadge.innerText = "⚠️ לא הוגדר";
        }
    }"""
r6b = """    if (drawerPhoneBadge) {
        if (phone) {
            drawerPhoneBadge.className = "drawer-phone-badge has-phone";
            drawerPhoneBadge.innerText = `✓ ${phone}`;
        } else {
            drawerPhoneBadge.className = "drawer-phone-badge";
            drawerPhoneBadge.innerText = "⚪ לא מחובר";
        }
    }"""
code = replace_exact(code, t6b, r6b, "drawerPhoneBadge in drawer")

# 7. testSendPhoneNotification
t7 = """function testSendPhoneNotification() {
    ensureNotificationPreferencesDefaults();
    const phone = (gameState.userProfile && gameState.userProfile.phone) || "";
    if (!phone) {
        showToastNotification("אנא הזן ושמור מספר טלפון תחילה כדי לבצע בדיקה.", "warning");
        const phoneInput = document.getElementById("setting-phone-number");
        if (phoneInput) phoneInput.focus();
        return;
    }

    showToastNotification(`📲 נשלחה התראת בדיקה למספר ${phone}! ערוץ הנייד מחובר בהצלחה.`, "success");"""
r7 = """function testSendPhoneNotification() {
    ensureNotificationPreferencesDefaults();
    const phone = (gameState.userProfile && gameState.userProfile.phone) || "";
    if (!phone) {
        showToastNotification("⚠️ אינך מחובר לערוץ התראות טלפון! אנא הזן ושמור מספר טלפון תחילה כדי לבצע בדיקה.", "warning");
        const phoneInput = document.getElementById("setting-phone-number");
        if (phoneInput) phoneInput.focus();
        return;
    }

    const isCloudUser = window.AuthSync && typeof window.AuthSync.isLoggedIn === 'function' && window.AuthSync.isLoggedIn();
    const statusNote = isCloudUser ? "ערוץ הנייד מחובר ומסונכרן לענן" : "ערוץ הנייד מוגדר מקומית";
    showToastNotification(`📲 נשלחה התראת בדיקה למספר ${phone}! ${statusNote}.`, "success");"""
code = replace_exact(code, t7, r7, "testSendPhoneNotification warning guard")

# 8. generateMorning730BriefingData
t8 = """        const schedule = getActiveTimetableSchedule();
        const dayConfig = (schedule && schedule.days) ? schedule.days.find(d => d.dayIndex === dayOfWeek) : null;
        const classes = (dayConfig && !dayConfig.isFree && dayConfig.classes) ? dayConfig.classes : [];

        let title = '';
        const bodyLines = [];

        if (classes.length === 0) {
            title = `🌅 תוכנית הבוקר (07:30) • יום ${dayName}`;
            bodyLines.push(`🏖️ יום חופשי מלימודים!`);
            bodyLines.push(`אין היום הרצאות או תרגולים במערכת השעות.`);
            bodyLines.push(`זמן מצוין למנוחה, שיעורי בית או הכנה להמשך השבוע.`);
        } else {"""
r8 = """        const schedule = getActiveTimetableSchedule();
        const hasAnyClasses = schedule && schedule.days && schedule.days.some(d => d.classes && d.classes.length > 0);
        const dayConfig = (schedule && schedule.days) ? schedule.days.find(d => d.dayIndex === dayOfWeek) : null;
        const classes = (dayConfig && !dayConfig.isFree && dayConfig.classes) ? dayConfig.classes : [];

        let title = '';
        const bodyLines = [];

        if (!hasAnyClasses) {
            title = `🌅 תוכנית הבוקר (07:30) • יום ${dayName}`;
            bodyLines.push(`📅 טרם הוגדרה או סונכרנה מערכת שעות פעילה.`);
            bodyLines.push(`כדי לקבל תוכנית בוקר עם הרצאות ותרגולים, סנכרן את מערכת השעות מ-CheeseFork בלשונית מערכת שעות.`);
        } else if (classes.length === 0) {
            title = `🌅 תוכנית הבוקר (07:30) • יום ${dayName}`;
            bodyLines.push(`🏖️ יום חופשי מלימודים!`);
            bodyLines.push(`אין היום הרצאות או תרגולים במערכת השעות.`);
            bodyLines.push(`זמן מצוין למנוחה, שיעורי בית או הכנה להמשך השבוע.`);
        } else {"""
code = replace_exact(code, t8, r8, "generateMorning730BriefingData timetable notice")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("All app.js replacements completed successfully!")
