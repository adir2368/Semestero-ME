const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
let raw = fs.readFileSync(appJsPath, 'utf8');
const isCrlf = raw.includes('\r\n');
let appJs = raw.replace(/\r\n/g, '\n');

// 1. Update ensureCapacitorNotificationChannel to register action types and localNotificationActionPerformed listener
const oldChannelSetup = `let _capChannelInitialized = false;
async function ensureCapacitorNotificationChannel() {
    if (_capChannelInitialized) return;
    if (isCapacitorPlatform() && window.Capacitor?.Plugins?.LocalNotifications) {
        try {
            await window.Capacitor.Plugins.LocalNotifications.createChannel({
                id: 'semestero_alerts',
                name: 'התראות סמסטרו (לו״ז ומשימות)',
                description: 'התראות 10 דקות לפני שיעור, לו״ז יומי ומשימות',
                importance: 5, // IMPORTANCE_HIGH: heads-up notification banner
                visibility: 1, // VISIBILITY_PUBLIC
                vibration: true,
                lights: true,
                lightColor: '#0ea5e9'
            });
            _capChannelInitialized = true;
            console.log('[Notifications] Native Semestero notification channel ready');
        } catch (e) {
            console.warn('[Notifications] Channel setup error:', e);
        }
    }
}`;

const newChannelSetup = `let _capChannelInitialized = false;
let _capNotificationListenerRegistered = false;
async function ensureCapacitorNotificationChannel() {
    if (_capChannelInitialized) return;
    if (isCapacitorPlatform() && window.Capacitor?.Plugins?.LocalNotifications) {
        try {
            const ln = window.Capacitor.Plugins.LocalNotifications;
            await ln.createChannel({
                id: 'semestero_alerts',
                name: 'התראות סמסטרו (לו״ז ומשימות)',
                description: 'התראות 10 דקות לפני שיעור, לו״ז יומי ומשימות',
                importance: 5, // IMPORTANCE_HIGH: heads-up notification banner
                visibility: 1, // VISIBILITY_PUBLIC
                vibration: true,
                lights: true,
                lightColor: '#0ea5e9'
            });

            // Register Action Types for Action Buttons in Android Notification Shade
            if (typeof ln.registerActionTypes === 'function') {
                await ln.registerActionTypes({
                    types: [
                        {
                            id: 'TIMETABLE_ACTIONS',
                            actions: [
                                { id: 'open-timetable', title: '📅 פתח מערכת מלאה' }
                            ]
                        },
                        {
                            id: 'TASKS_ACTIONS',
                            actions: [
                                { id: 'open-tasks', title: '📋 פתח רשימת משימות' }
                            ]
                        }
                    ]
                });
            }

            // Listen to notification tap / action clicks to navigate directly
            if (typeof ln.addListener === 'function' && !_capNotificationListenerRegistered) {
                _capNotificationListenerRegistered = true;
                ln.addListener('localNotificationActionPerformed', (notificationAction) => {
                    console.log('[Notifications] Native action performed:', notificationAction);
                    const notif = notificationAction.notification;
                    const actionId = notificationAction.actionId;
                    const extra = notif?.extra || {};
                    let targetTab = extra.tab || 'timetable';
                    if (actionId === 'open-tasks' || extra.tab === 'tasks') {
                        targetTab = 'tasks';
                    } else if (actionId === 'open-timetable' || extra.tab === 'timetable') {
                        targetTab = 'timetable';
                    }
                    if (typeof setActiveMainTab === 'function') {
                        setActiveMainTab(targetTab);
                    }
                    if (typeof closeNotificationDrawer === 'function') {
                        closeNotificationDrawer();
                    }
                });
            }

            _capChannelInitialized = true;
            console.log('[Notifications] Native Semestero notification channel & action types ready');
        } catch (e) {
            console.warn('[Notifications] Channel setup error:', e);
        }
    }
}`;

if (!appJs.includes(oldChannelSetup)) {
    console.error('ERROR: oldChannelSetup pattern not found in app.js');
    process.exit(1);
}
appJs = appJs.replace(oldChannelSetup, newChannelSetup);
console.log('✓ Replaced ensureCapacitorNotificationChannel');

// 2. Update showNativeNotification to forward inboxList and actionTypeId
const oldShowNativeCap = `                const largeBody = options.largeBody || options.body || '';
                const summaryText = options.summaryText || 'סמסטרו ME';

                await localNotifs.schedule({
                    notifications: [{
                        id: notifId,
                        title: title,
                        body: options.body || '',
                        largeBody: largeBody,
                        summaryText: summaryText,
                        channelId: 'semestero_alerts',
                        schedule: scheduleAt ? { at: scheduleAt } : undefined,
                        smallIcon: 'ic_stat_notification',
                        iconColor: '#38bdf8',
                        extra: options.data || {}
                    }]
                });`;

const newShowNativeCap = `                const largeBody = options.largeBody || options.body || '';
                const summaryText = options.summaryText || 'סמסטרו ME';

                const notifPayload = {
                    id: notifId,
                    title: title,
                    body: options.body || '',
                    largeBody: largeBody,
                    summaryText: summaryText,
                    channelId: 'semestero_alerts',
                    schedule: scheduleAt ? { at: scheduleAt } : undefined,
                    smallIcon: 'ic_stat_notification',
                    iconColor: '#38bdf8',
                    extra: options.data || {}
                };

                if (options.inboxList && Array.isArray(options.inboxList) && options.inboxList.length > 0) {
                    notifPayload.inboxList = options.inboxList;
                }
                if (options.actionTypeId) {
                    notifPayload.actionTypeId = options.actionTypeId;
                }

                await localNotifs.schedule({
                    notifications: [notifPayload]
                });`;

if (!appJs.includes(oldShowNativeCap)) {
    console.error('ERROR: oldShowNativeCap pattern not found in app.js');
    process.exit(1);
}
appJs = appJs.replace(oldShowNativeCap, newShowNativeCap);
console.log('✓ Replaced showNativeNotification payload');

// 3. Update scheduleUpcomingClassReminders: Put room and time on line 1 so it's never cut off
const oldAlarmBody = `                    const alarmBody = \`📚 \${c.type || 'הרצאה / תרגול'}\\n⏰ שעות: \${c.startTime} - \${c.endTime}\\n📍 \${c.room || 'טכניון'}\${c.lecturer ? '\\n👨‍🏫 מרצה/מתרגל: ' + c.lecturer : ''}\`;
                    window.Capacitor.Plugins.LocalNotifications.schedule({
                        notifications: [{
                            id: notifId,
                            title: \`⏰ בעוד 10 דק׳: \${c.courseName || 'שיעור אקדמי'}\`,
                            body: alarmBody,
                            largeBody: alarmBody,
                            summaryText: 'סמסטרו ME • תזכורת שיעור',
                            channelId: 'semestero_alerts',
                            schedule: {
                                at: new Date(reminderTimeMs),
                                allowWhileIdle: true
                            },
                            smallIcon: 'ic_stat_notification',
                            iconColor: '#38bdf8',
                            extra: { tab: 'timetable' }
                        }]
                    })`;

const newAlarmBody = `                    const shortCourse = (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[c.courseId])
                        ? COURSE_SHORT_NAMES[c.courseId]
                        : ((c.courseName || 'שיעור').length > 20 ? (c.courseName || 'שיעור').substring(0, 18) + '..' : (c.courseName || 'שיעור'));
                    const roomStr = c.room || 'טכניון';
                    const alarmTitle = \`⏰ בעוד 10 דק׳: \${shortCourse}\`;
                    const alarmLine1 = \`📍 \${roomStr} • ⏰ \${c.startTime} - \${c.endTime} (\${c.type || 'שיעור'})\`;
                    const alarmBody = c.lecturer ? \`\${alarmLine1}\\n👨‍🏫 \${c.lecturer}\` : alarmLine1;
                    const alarmLargeBody = \`\${alarmBody}\\n\\n📅 הקש לצפייה במערכת השעות השבועית המלאה\`;

                    window.Capacitor.Plugins.LocalNotifications.schedule({
                        notifications: [{
                            id: notifId,
                            title: alarmTitle,
                            body: alarmBody,
                            largeBody: alarmLargeBody,
                            summaryText: 'סמסטרו ME • תזכורת שיעור',
                            inboxList: [alarmLine1, c.lecturer ? \`👨‍🏫 מרצה/מתרגל: \${c.lecturer}\` : '📅 הקש לפתיחת מערכת שעות'],
                            actionTypeId: 'TIMETABLE_ACTIONS',
                            channelId: 'semestero_alerts',
                            schedule: {
                                at: new Date(reminderTimeMs),
                                allowWhileIdle: true
                            },
                            smallIcon: 'ic_stat_notification',
                            iconColor: '#38bdf8',
                            extra: { tab: 'timetable' }
                        }]
                    })`;

if (!appJs.includes(oldAlarmBody)) {
    console.error('ERROR: oldAlarmBody pattern not found in app.js');
    process.exit(1);
}
appJs = appJs.replace(oldAlarmBody, newAlarmBody);
console.log('✓ Replaced scheduleUpcomingClassReminders alarm body');

// 4. Update trigger10MinClassAlert: Put room and time on line 1 so it's never cut off
const oldTriggerAlert = `    let title = '';
    if (isTest) {
        title = isMobile ? \`⏰ [בדיקה] בעוד 10 דק׳: \${courseName}\` : \`💻 [בדיקת מחשב] בעוד 10 דק׳: \${courseName}\`;
    } else if (diffMinutes > 1) {
        title = isMobile
            ? \`⏰ בעוד כ-\${diffMinutes} דק׳: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`
            : \`💻 תזכורת שיעור בעוד \${diffMinutes} דק׳: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    } else if (diffMinutes >= -15) {
        title = isMobile
            ? \`🟢 השיעור מתחיל כעת: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`
            : \`💻 שיעור מתחיל כעת: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    } else {
        title = isMobile
            ? \`🕒 שיעור פעיל: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`
            : \`💻 שיעור פעיל כרגע: \${courseName}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    }

    const bodyLines = [
        \`📚 \${type}\`,
        \`⏰ שעות: \${startTime} - \${endTime} (\${classItem.duration || 'שיעור'})\`,
        room
    ];
    if (lecturer) bodyLines.push(lecturer);

    // Check if there are remaining classes today after this one
    const remaining = getRemainingClassesToday();
    const afterThis = remaining.classes.filter(c => c.startTime > startTime);
    if (afterThis.length > 0) {
        bodyLines.push('────────────────────');
        bodyLines.push(\`בהמשך היום: עוד \${afterThis.length} שיעורים (הבא ב-\${afterThis[0].startTime})\`);
    }

    const body = bodyLines.join('\\n');
    const tag = \`ast-reminder-\${classItem.courseId || 'c'}-\${(startTime || '0000').replace(':', '')}\`;

        if (window.SemesteroBridge && typeof window.SemesteroBridge.sendTestNotificationToWatch === 'function') {
        window.SemesteroBridge.sendTestNotificationToWatch(title, body);
    }
    const sent = await showNativeNotification(title, {
        body,
        icon: 'icon.png',
        badge: 'notification-badge.png',
        tag,
        renotify: true,
        vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
        data: { tab: 'timetable' },
        actions: [
            { action: 'open-timetable', title: '📍 פתח מערכת שעות' }
        ]
    });`;

const newTriggerAlert = `    const shortCourse = (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[classItem.courseId])
        ? COURSE_SHORT_NAMES[classItem.courseId]
        : (courseName.length > 20 ? courseName.substring(0, 18) + '..' : courseName);

    let title = '';
    if (isTest) {
        title = isMobile ? \`⏰ בעוד 10 דק׳: \${shortCourse}\` : \`💻 [בדיקה] בעוד 10 דק׳: \${shortCourse}\`;
    } else if (diffMinutes > 1) {
        title = \`⏰ בעוד \${diffMinutes} דק׳: \${shortCourse}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    } else if (diffMinutes >= -15) {
        title = \`🟢 מתחיל כעת: \${shortCourse}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    } else {
        title = \`🕒 שיעור פעיל: \${shortCourse}\${typeShort ? ' (' + typeShort + ')' : ''}\`;
    }

    const roomText = classItem.room || 'טכניון';
    // Single dense first line so room is NEVER truncated in lockscreen or shade!
    const primaryLine = \`📍 \${roomText} • ⏰ \${startTime} - \${endTime} (\${type})\`;
    const bodyLines = [primaryLine];
    if (lecturer) bodyLines.push(lecturer);

    // Check if there are remaining classes today after this one
    const remaining = getRemainingClassesToday();
    const afterThis = remaining.classes.filter(c => c.startTime > startTime);
    if (afterThis.length > 0) {
        bodyLines.push(\`בהמשך היום: עוד \${afterThis.length} שיעורים (הבא ב-\${afterThis[0].startTime})\`);
    }

    const body = bodyLines.join('\\n');
    const largeBody = bodyLines.join('\\n') + '\\n\\n📅 הקש לצפייה במערכת השעות השבועית המלאה';
    const tag = \`ast-reminder-\${classItem.courseId || 'c'}-\${(startTime || '0000').replace(':', '')}\`;

    if (window.SemesteroBridge && typeof window.SemesteroBridge.sendTestNotificationToWatch === 'function') {
        window.SemesteroBridge.sendTestNotificationToWatch(title, body);
    }
    const sent = await showNativeNotification(title, {
        body,
        largeBody,
        inboxList: bodyLines.slice(0, 5),
        actionTypeId: 'TIMETABLE_ACTIONS',
        summaryText: 'סמסטרו ME • תזכורת שיעור',
        icon: 'icon.png',
        badge: 'notification-badge.png',
        tag,
        renotify: true,
        vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
        data: { tab: 'timetable' },
        actions: [
            { action: 'open-timetable', title: '📅 פתח מערכת שעות' }
        ]
    });`;

if (!appJs.includes(oldTriggerAlert)) {
    console.error('ERROR: oldTriggerAlert pattern not found in app.js');
    process.exit(1);
}
appJs = appJs.replace(oldTriggerAlert, newTriggerAlert);
console.log('✓ Replaced trigger10MinClassAlert body');

// 5. Update dispatchNativeMobileNotifications: Dense format, no bloated dividers, full tasks & timetable
const oldDispatchNotifs = `    // -------------------------------------------------------------
    // Notification 1: Today's Remaining Lectures / Tutorials
    // -------------------------------------------------------------
    let lectureTitle = '';
    let lectureBody = '';

    if (sendLectures) {
        if (!remainingLectures.hasSchedule) {
            lectureTitle = isMobile
                ? '🎓 מערכת שעות: טרם הוגדרה מערכת'
                : '💻 מערכת שעות במחשב: טרם הוגדרה מערכת';
            lectureBody = '📅 כדי לקבל תזכורות להרצאות, סנכרן או בחר מערכת שעות פעילה בלשונית מערכת שעות.';
        } else if (remainingLectures.isFree || remainingLectures.totalToday === 0) {
            lectureTitle = isMobile
                ? '🎓 מערכת שעות: יום חופשי מלימודים'
                : '💻 מערכת שעות במחשב: יום חופשי מלימודים';
            lectureBody = '🏖️ אין שיעורים מתוכננים להיום. יום נעים, פורה ומנוחה טובה!';
        } else if (remainingLectures.count === 0) {
            lectureTitle = isMobile
                ? '🎓 מערכת שעות: השיעורים הסתיימו'
                : '💻 מערכת שעות במחשב: השיעורים להיום הסתיימו';
            lectureBody = \`✔️ כל \${remainingLectures.totalToday} השיעורים להיום הושלמו בהצלחה!\`;
        } else {
            lectureTitle = isMobile
                ? \`🎓 לו״ז היום (\${remainingLectures.count} שיעורים נותרו)\`
                : \`💻 לו״ז היום במחשב (\${remainingLectures.count} שיעורים נותרו)\`;

            const classBlocks = remainingLectures.classes.map((c, idx) => {
                const isNext = (idx === 0);
                const header = isNext 
                    ? \`⭐ הבא: \${c.startTime} | \${c.courseName}\`
                    : \`🕒 \${c.startTime} - \${c.endTime} | \${c.courseName}\`;
                const details = \`   📍 \${c.room || 'טכניון'} • \${c.type}\${c.lecturer ? ' (' + c.lecturer + ')' : ''}\`;
                return \`\${header}\\n\${details}\`;
            });

            lectureBody = classBlocks.join('\\n\\n────────────────────\\n\\n');
        }

        // Dispatch Notification 1: Lectures (Wide & Full BigTextStyle)
        await showNativeNotification(lectureTitle, {
            body: lectureBody,
            largeBody: lectureBody,
            summaryText: 'סמסטרו ME • לו״ז יומי',
            icon: 'icon.png',
            badge: 'notification-badge.png',
            tag: 'ast-today-lectures',
            renotify: true,
            vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
            data: { tab: 'timetable' },
            actions: [
                { action: 'open-timetable', title: '📅 פתח מערכת שעות' }
            ]
        });
    }

    // -------------------------------------------------------------
    // Notification 2: Upcoming Priority Tasks
    // -------------------------------------------------------------
    if (sendTasks) {
        let taskTitle = '';
        let taskBody = '';

        if (priorityTasks.tasks.length === 0) {
            taskTitle = isMobile
                ? '📋 משימות אקדמיות: הכל הושלם!'
                : '💻 משימות אקדמיות במחשב: הכל הושלם!';
            taskBody = '✨ אין משימות ממתינות להגשה. כל הכבוד!';
        } else {
            taskTitle = isMobile
                ? \`📋 משימות דחופות (\${priorityTasks.tasks.length} פתוחות)\`
                : \`💻 משימות דחופות במחשב (\${priorityTasks.tasks.length} פתוחות)\`;

            const maxTasksToShow = Math.min(priorityTasks.tasks.length, 10);
            const taskBlocks = priorityTasks.tasks.slice(0, maxTasksToShow).map(t => {
                const icon = t.diffDays < 0 ? '🚨' : (t.diffDays <= 1 ? '🔥' : '⚡');
                const line1 = \`\${icon} [\${t.courseShortName}] \${t.title}\`;
                const line2 = \`   ⏳ \${t.timingText}\`;
                return \`\${line1}\\n\${line2}\`;
            });

            if (priorityTasks.tasks.length > maxTasksToShow) {
                taskBlocks.push(\`...ועוד \${priorityTasks.tasks.length - maxTasksToShow} משימות נוספות בלוח המשימות\`);
            }

            taskBody = taskBlocks.join('\\n\\n────────────────────\\n\\n');
        }

        const delay = sendLectures ? 350 : 0;
        setTimeout(async () => {
            // Dispatch Notification 2: Tasks (Wide & Full BigTextStyle)
            await showNativeNotification(taskTitle, {
                body: taskBody,
                largeBody: taskBody,
                summaryText: 'סמסטרו ME • משימות פתוחות',
                icon: 'icon.png',
                badge: 'notification-badge.png',
                tag: 'ast-upcoming-tasks',
                renotify: true,
                vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
                data: { tab: 'tasks' },
                actions: [
                    { action: 'open-tasks', title: '📋 פתח משימות' }
                ]
            });`;

const newDispatchNotifs = `    // -------------------------------------------------------------
    // Notification 1: Today's Remaining Lectures / Tutorials (Untruncated)
    // -------------------------------------------------------------
    let lectureTitle = '';
    let lectureBody = '';
    let lectureLargeBody = '';
    let lectureInboxList = [];

    if (sendLectures) {
        if (!remainingLectures.hasSchedule) {
            lectureTitle = isMobile
                ? '🎓 לו״ז: טרם הוגדרה מערכת'
                : '💻 לו״ז: טרם הוגדרה מערכת';
            lectureBody = '📅 לחץ כאן להגדרת מערכת שעות פעילה';
            lectureLargeBody = lectureBody;
        } else if (remainingLectures.isFree || remainingLectures.totalToday === 0) {
            lectureTitle = '🎓 יום חופשי מלימודים 🏖️';
            lectureBody = '🏖️ אין שיעורים מתוכננים להיום. יום נעים, פורה ומנוחה טובה!';
            lectureLargeBody = lectureBody;
        } else if (remainingLectures.count === 0) {
            lectureTitle = '🎓 השיעורים להיום הסתיימו ✔️';
            lectureBody = \`כל \${remainingLectures.totalToday} השיעורים להיום הושלמו! לחץ לצפייה במערכת המלאה.\`;
            lectureLargeBody = lectureBody;
        } else {
            const count = remainingLectures.count;
            lectureTitle = isMobile
                ? (count === 1 ? '🎓 לו״ז היום (שיעור 1 נותר)' : \`🎓 לו״ז היום (\${count} שיעורים נותרו)\`)
                : \`💻 לו״ז היום במחשב (\${count} שיעורים נותרו)\`;

            // Dense, single-line format for each class with room and type
            const classLines = remainingLectures.classes.map((c, idx) => {
                const isNext = (idx === 0);
                const prefix = isNext ? '⭐ ' : '• ';
                const roomStr = c.room ? \` • \${c.room}\` : '';
                const typeStr = c.type ? \` (\${c.type})\` : '';
                return \`\${prefix}\${c.startTime} | \${c.courseName}\${roomStr}\${typeStr}\`;
            });

            // Single line summary for collapsed lockscreen body
            const nextClass = remainingLectures.classes[0];
            const nextRoom = nextClass.room ? \` • \${nextClass.room}\` : '';
            lectureBody = \`הבא: \${nextClass.startTime} | \${nextClass.courseName}\${nextRoom} (עוד \${count} שיעורים להיום)\`;

            lectureLargeBody = classLines.join('\\n') + '\\n\\n📅 הקש לצפייה במערכת השעות השבועית המלאה';
            lectureInboxList = classLines.slice(0, 5);
        }

        // Dispatch Notification 1: Lectures (Wide & Full BigTextStyle + InboxStyle)
        await showNativeNotification(lectureTitle, {
            body: lectureBody,
            largeBody: lectureLargeBody,
            inboxList: lectureInboxList.length > 0 ? lectureInboxList : undefined,
            actionTypeId: 'TIMETABLE_ACTIONS',
            summaryText: 'סמסטרו ME • לו״ז יומי',
            icon: 'icon.png',
            badge: 'notification-badge.png',
            tag: 'ast-today-lectures',
            renotify: true,
            vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
            data: { tab: 'timetable' },
            actions: [
                { action: 'open-timetable', title: '📅 פתח מערכת שעות' }
            ]
        });
    }

    // -------------------------------------------------------------
    // Notification 2: Upcoming Priority Tasks (Untruncated)
    // -------------------------------------------------------------
    if (sendTasks) {
        let taskTitle = '';
        let taskBody = '';
        let taskLargeBody = '';
        let taskInboxList = [];

        if (priorityTasks.tasks.length === 0) {
            taskTitle = '📋 כל המשימות הושלמו! 🎉';
            taskBody = '✨ אין משימות ממתינות להגשה. כל הכבוד!';
            taskLargeBody = taskBody;
        } else {
            const totalTasks = priorityTasks.tasks.length;
            taskTitle = isMobile
                ? (totalTasks === 1 ? '📋 משימה 1 להגשה' : \`📋 \${totalTasks} משימות להגשה\`)
                : \`💻 משימות להגשה במחשב (\${totalTasks})\`;

            const maxTasksToShow = Math.min(totalTasks, 6);
            const taskLines = priorityTasks.tasks.slice(0, maxTasksToShow).map((t, idx) => {
                const icon = t.diffDays < 0 ? '🚨' : (t.diffDays <= 1 ? '🔥' : '📌');
                const courseTag = t.courseShortName ? \`[\${t.courseShortName}] \` : '';
                return \`\${idx + 1}. \${icon} \${courseTag}\${t.title} • \${t.timingText}\`;
            });

            if (totalTasks > maxTasksToShow) {
                taskLines.push(\`...ועוד \${totalTasks - maxTasksToShow} משימות נוספות בלוח המשימות\`);
            }

            // Single line summary for collapsed lockscreen body
            const topTask = priorityTasks.tasks[0];
            const topTag = topTask.courseShortName ? \`[\${topTask.courseShortName}] \` : '';
            taskBody = \`\${totalTasks} משימות פתוחות: הקרובה היא \${topTag}\${topTask.title} (\${topTask.timingText})\`;

            taskLargeBody = taskLines.join('\\n') + '\\n\\n📋 הקש לצפייה בכל המשימות בלוח המשימות';
            taskInboxList = taskLines.slice(0, 5);
        }

        const delay = sendLectures ? 350 : 0;
        setTimeout(async () => {
            // Dispatch Notification 2: Tasks (Wide & Full BigTextStyle + InboxStyle)
            await showNativeNotification(taskTitle, {
                body: taskBody,
                largeBody: taskLargeBody,
                inboxList: taskInboxList.length > 0 ? taskInboxList : undefined,
                actionTypeId: 'TASKS_ACTIONS',
                summaryText: 'סמסטרו ME • משימות פתוחות',
                icon: 'icon.png',
                badge: 'notification-badge.png',
                tag: 'ast-upcoming-tasks',
                renotify: true,
                vibrate: isMobile ? [250, 100, 250, 100, 250] : undefined,
                data: { tab: 'tasks' },
                actions: [
                    { action: 'open-tasks', title: '📋 פתח משימות' }
                ]
            });`;

if (!appJs.includes(oldDispatchNotifs)) {
    console.error('ERROR: oldDispatchNotifs pattern not found in app.js');
    process.exit(1);
}
appJs = appJs.replace(oldDispatchNotifs, newDispatchNotifs);
console.log('✓ Replaced dispatchNativeMobileNotifications formatting');

// Write back with original line endings
const finalOutput = isCrlf ? appJs.replace(/\n/g, '\r\n') : appJs;
fs.writeFileSync(appJsPath, finalOutput, 'utf8');
console.log('🎉 Successfully patched app.js with untruncated notifications & deep-links!');
