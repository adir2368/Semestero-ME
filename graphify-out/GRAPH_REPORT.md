# Graph Report - academic-skill-tree  (2026-10-31)

## Corpus Check
- 328 files · ~834,217 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 68 file(s) not represented in the graph (top: .xml 42, (none) 6, .bat 6)

## Summary
- 2105 nodes · 4024 edges · 145 communities (104 shown, 41 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `820c0cf4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SemesteroClassTileService.java
- AppDelegate
- app.js
- wear/MainActivity.java
- ref_assert
- planner_module.js
- android.appwidget.AppWidgetManager
- verify_grade_sheet_transcript.test.js
- verify_galaxy_watch_companion.test.js
- auth_sync.js
- verify_planner_mandatory_restore.test.js
- sys
- re
- SemesteroWidgetBridge
- setupEventListeners
- grade_sheet.js
- package.json
- os
- qa_verify_classification_exams.js
- qa_verify_grade_sheet_browser.js
- qa_verify_planner_mandatory.js
- saveState
- app_restored.js
- json
- audit_external_links.js
- qa_verify_watch_browser.js
- qa_verify_physics_variant.js
- android.content.Context
- semestero/MainActivity.java
- Degree Planner & Workload Visualizer (Submodule 12)
- verify_classification_exams.test.js
- setupMobileNotifications
- setupNotionIconPickerEvents
- timetable_generator_test.js
- test_modal_error.js
- watch_companion.js
- setupFinalsMode
- test_miluim_and_moodle_sync.js
- WearSyncManager.java
- ui_enhancements.js
- SemesteroMiluimWidget
- verify_v2414_flask_gear.js
- SemesteroFinalsGpaWidget
- SemesteroLaunchpadWidget
- ref_path
- moodle_sync.js
- SemesteroScheduleWidget
- curriculum_isolation_and_recommended_tracks.test.js
- verify_zero_default_account_and_apk_security.js
- ref_fs
- gradlew
- interactive_tour.js
- Package.swift
- renderTodayTimetableBanner
- test_app_purge.js
- showToastNotification
- verify_v2413_gear_badge.js
- update_v26_styles_and_hud.js
- verify_all_connections_and_sync_guards.js
- verify_integrations_hub_cdp.js
- verify_system_health.js
- verify_unconnected_sync_guards.js
- sync_from_google_calendars.py
- deep_audit_ecosystem.js
- audit_codebase_integrity.js
- browser_cdp_qa_audit.js
- test_onboarding_auth_flow.js
- verify_guest_isolation_full.js
- verify_local_miluim_and_moodle.js
- verify_pre_anchor_and_clean_ui.js
- ref_child_process
- verify_tasks_multi_select_and_actions.js
- inspect_timetable.js
- verify_admin_telemetry_and_no_quick_login.js
- verify_tasks_refresh_and_dedup.js
- create_github_release.py
- סמסטרו ME (Semestero ME) 🎓⚙️
- fix_modal_zindex.js
- test_infiltrator_purge.js
- verify_v2415_miluim_disclaimer.js
- renderNotionTasksTable
- manifest.json
- apply_v258_upgrade.js
- apply_v259.js
- verify_shortcuts_moodle_and_admin.js
- renderFlowchartTree
- verify_v262_back_to_top.js
- apply_hud_fixes.js
- verify_purges_and_modal.js
- verify_desktop_and_mobile_suite.js
- subprocess
- test_clean_state_isolation.js
- site_analytics.js
- מדיניות פרטיות והגנת מידע (Privacy Policy)
- apply_tutorial_and_widgets_update.js
- update_download_modal_links.js
- auth_session_persistence.test.js
- ref_http
- audit_all_prereqs.js
- update_tour_settings.js
- test_moodle_zoom_filter.test.js
- test_open_modal_sim.js
- unit_dedup_logic.js
- apply_curriculum_separation.py
- accessibility.js
- test_adir_render.py
- _backup_widgets/widgets/ms_ac_exam.json
- _backup_widgets/widgets/ms_ac_semester.json
- _backup_widgets/widgets/ms_ac_tasks.json
- modal_help.js
- bump_version.js
- widgets/ms_ac_exam.json
- widgets/ms_ac_semester.json
- widgets/ms_ac_tasks.json
- mirofish_expanded_swarm.py
- planner_catalog.js
- comprehensive_cross_platform_audit.py
- patch_integrations_hub.py
- apply_app_guards.py
- CapApp-SPM/README.md
- sw.js

## God Nodes (most connected - your core abstractions)
1. `showToastNotification()` - 54 edges
2. `saveState()` - 52 edges
3. `openCourseDetails()` - 35 edges
4. `notifyStateChanged()` - 34 edges
5. `setupNotionDashboard()` - 27 edges
6. `renderNotionTasksTable()` - 27 edges
7. `bindDelegatedPlannerEvents()` - 26 edges
8. `recalculateCourseStates()` - 25 edges
9. `renderUI()` - 24 edges
10. `getNormalizedCodes()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `loadSavedState()` --references--> `INFILTRATORS`  [EXTRACTED]
  app.js → scripts/archive/verify_purges_and_modal.js
- `saveCheeseForkUrl()` --references--> `authSync`  [EXTRACTED]
  auth_sync.js → tests/verify_shortcuts_moodle_and_admin.js
- `saveMoodleUrl()` --references--> `authSync`  [EXTRACTED]
  auth_sync.js → tests/verify_shortcuts_moodle_and_admin.js
- `renderPhoneAndNotificationPreferences()` --references--> `authSync`  [EXTRACTED]
  app.js → tests/verify_shortcuts_moodle_and_admin.js
- `savePhoneAndNotificationPreferences()` --references--> `authSync`  [EXTRACTED]
  app.js → tests/verify_shortcuts_moodle_and_admin.js

## Import Cycles
- None detected.

## Communities (145 total, 41 thin omitted)

### Community 0 - "SemesteroClassTileService.java"
Cohesion: 0.06
Nodes (31): ExampleInstrumentedTest, ExampleUnitTest, Override, SemesteroClassTileService, Override, WearDataSyncService, androidx.test.ext.junit.runners.AndroidJUnit4, androidx.wear.tiles.TileService (+23 more)

### Community 1 - "AppDelegate"
Cohesion: 0.09
Nodes (20): Any, Bool, Capacitor, AppDelegate, UIScene, UISceneSession, UIWindow, SceneDelegate (+12 more)

### Community 2 - "app.js"
Cohesion: 0.03
Nodes (61): _activePrereqCodes, APP_CURRENT_REVISION, AUGUST_2026_PERSONAL_EVENTS, AUGUST_2026_SCHEDULE, AUTHENTIC_TIMETABLE_METADATA, CHEESEFORK_EXAM_DATES, CHEESEFORK_SEMESTER_SCHEDULE, clearConstellationHighlight() (+53 more)

### Community 3 - "wear/MainActivity.java"
Cohesion: 0.12
Nodes (18): android.app.Activity, android.os.Vibrator, android.view.MotionEvent, Override, MainActivity, WearNotificationHelper, android.widget.Button, android.widget.ScrollView (+10 more)

### Community 4 - "ref_assert"
Cohesion: 0.08
Nodes (20): ref_assert, appCode, assert, fs, mockEl, assert, fs, path (+12 more)

### Community 5 - "planner_module.js"
Cohesion: 0.11
Nodes (63): applyEnglishLevelState(), bindDelegatedPlannerEvents(), runAutoScrollStep(), stopEdgeAutoScroll(), triggerEdgeAutoScroll(), buildCourseSemesterMap(), calculateCourseWorkload(), calculateSemesterWorkload() (+55 more)

### Community 6 - "android.appwidget.AppWidgetManager"
Cohesion: 0.23
Nodes (13): Override, SemesteroNextClassWidget, android.appwidget.AppWidgetManager, android.appwidget.AppWidgetProvider, android.content.Intent, componentname, intent, jsonarray (+5 more)

### Community 7 - "verify_grade_sheet_transcript.test.js"
Cohesion: 0.08
Nodes (23): assert, csvText, ctx, data, dataWithBinary, domMock, fs, gradeSheetCode (+15 more)

### Community 8 - "verify_galaxy_watch_companion.test.js"
Cohesion: 0.09
Nodes (22): assert, ctx, domMock, fs, indexHtml, mockElements, path, ROOT (+14 more)

### Community 9 - "auth_sync.js"
Cohesion: 0.14
Nodes (56): clearNativeWidgetsIfAvailable(), clearSessionProof(), closeAuthModal(), deleteAccount(), finishOnboarding(), generateRandomNonce(), getActiveUser(), getIntegrationsHubCardsHtml() (+48 more)

### Community 10 - "verify_planner_mandatory_restore.test.js"
Cohesion: 0.11
Nodes (18): appJs, assert, catalogJs, deletedIdx, fs, indexHtml, mockWindow, path (+10 more)

### Community 13 - "SemesteroWidgetBridge"
Cohesion: 0.20
Nodes (3): SemesteroWidgetBridge, WearSyncManager, android.webkit.JavascriptInterface

### Community 14 - "setupEventListeners"
Cohesion: 0.11
Nodes (26): addPrereqChip(), applyCheeseForkCourse(), ensureCheeseForkDatabase(), escapeHtmlPrereq(), findCheeseForkCourse(), formatAcademicTermForDate(), getCourseCheeseforkExamDates(), getCourseDisplayNameByCode() (+18 more)

### Community 15 - "grade_sheet.js"
Cohesion: 0.24
Nodes (15): applyPreset(), calcTargetGpa(), closeModal(), exportCSV(), getRawCourses(), getSemesterName(), getTranscriptData(), init() (+7 more)

### Community 16 - "package.json"
Cohesion: 0.06
Nodes (35): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, @capacitor/ios, @capacitor/local-notifications, description (+27 more)

### Community 17 - "os"
Cohesion: 0.06
Nodes (3): io, os, pil

### Community 18 - "qa_verify_classification_exams.js"
Cohesion: 0.18
Nodes (12): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, isServerListening() (+4 more)

### Community 19 - "qa_verify_grade_sheet_browser.js"
Cohesion: 0.20
Nodes (11): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, isServerListening() (+3 more)

### Community 20 - "qa_verify_planner_mandatory.js"
Cohesion: 0.20
Nodes (11): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, isServerListening() (+3 more)

### Community 21 - "saveState"
Cohesion: 0.15
Nodes (38): addXp(), autoUpdateTaskStatusesByDueDate(), bulkSetTasksStatus(), closeTaskMoveModal(), completeAllTasks(), createCalendarDayCell(), deleteCourse(), deleteSelectedTasks() (+30 more)

### Community 22 - "app_restored.js"
Cohesion: 0.19
Nodes (30): addXp(), completeAllTasks(), deleteCourse(), drawConnections(), gameState, getXpNeeded(), handleAddCourseSubmit(), importFromCheesefork() (+22 more)

### Community 24 - "audit_external_links.js"
Cohesion: 0.07
Nodes (24): ref_https, https, options, https, options, headers, https, https (+16 more)

### Community 25 - "qa_verify_watch_browser.js"
Cohesion: 0.20
Nodes (11): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, isServerListening() (+3 more)

### Community 26 - "qa_verify_physics_variant.js"
Cohesion: 0.19
Nodes (12): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, isServerListening() (+4 more)

### Community 27 - "android.content.Context"
Cohesion: 0.30
Nodes (5): Override, SemesteroPomodoroWidget, Override, SemesteroTasksExamWidget, android.content.Context

### Community 28 - "semestero/MainActivity.java"
Cohesion: 0.25
Nodes (7): Intent, Override, MainActivity, android.os.Bundle, com.getcapacitor.BridgeActivity, websettings, webview

### Community 29 - "Degree Planner & Workload Visualizer (Submodule 12)"
Cohesion: 0.17
Nodes (8): assert, catalogCode, catalogEnv, catalogFunc, fs, globalScope, indexHtml, path

### Community 30 - "verify_classification_exams.test.js"
Cohesion: 0.17
Nodes (11): appGradle, appJs, assert, fs, indexHtml, path, pkg, plannerJs (+3 more)

### Community 31 - "setupMobileNotifications"
Cohesion: 0.17
Nodes (29): checkAndTrigger10MinReminders(), closeNotificationDrawer(), constructor(), dispatchNativeMobileNotifications(), ensureCapacitorNotificationChannel(), ensureNotificationPreferencesDefaults(), generateMorning730BriefingData(), getActiveTimetableSchedule() (+21 more)

### Community 32 - "setupNotionIconPickerEvents"
Cohesion: 0.31
Nodes (10): closeCourseIconPicker(), getDefaultCourseIconKey(), NOTION_COLORS, openCourseIconPicker(), renderIconPickerGrid(), renderIconPickerPalette(), resetCourseIcon(), saveCourseIcon() (+2 more)

### Community 33 - "timetable_generator_test.js"
Cohesion: 0.11
Nodes (23): assert, coreCourses, customAnchored, m1, m2, m3, m4, opt5 (+15 more)

### Community 34 - "test_modal_error.js"
Cohesion: 0.22
Nodes (7): context, documentMock, elements, fs, path, root, vm

### Community 35 - "watch_companion.js"
Cohesion: 0.36
Nodes (6): enterAmbient(), goToScreen(), nextScreen(), prevScreen(), resetIdleTimer(), wakeFromAmbient()

### Community 36 - "setupFinalsMode"
Cohesion: 0.13
Nodes (24): addCustomExamToBank(), autoScheduleCourseExams(), closeCalendarDayModal(), copyScheduleToGoogleTasks(), generateAllTermsList(), getExamStatusPill(), getHebrewDayOfWeek(), getSundayOfWeek() (+16 more)

### Community 37 - "test_miluim_and_moodle_sync.js"
Cohesion: 0.25
Nodes (7): appJs, assert, convertedCodes, fs, indexHtml, mockCourses, path

### Community 38 - "WearSyncManager.java"
Cohesion: 0.29
Nodes (6): dataitem, log, putdatamaprequest, putdatarequest, task, wearable

### Community 39 - "ui_enhancements.js"
Cohesion: 0.15
Nodes (21): applyFontScale(), attachModalScrollProgress(), buildSearchIndex(), createCommandPaletteModal(), getAll(), has(), initAllEnhancements(), initBackToTop() (+13 more)

### Community 41 - "verify_v2414_flask_gear.js"
Cohesion: 0.40
Nodes (5): fetch(), fs, http, path, verify()

### Community 44 - "ref_path"
Cohesion: 0.09
Nodes (17): { app, BrowserWindow, Menu, ipcMain }, path, { contextBridge, ipcRenderer }, electron, ref_path, { app, BrowserWindow }, fs, path (+9 more)

### Community 45 - "moodle_sync.js"
Cohesion: 0.16
Nodes (34): areTasksDuplicates(), bindUI(), cleanTaskSummary(), closeModal(), deduplicateAllTasks(), deduplicateCourseTasks(), detectTaskType(), extractMoodleId() (+26 more)

### Community 47 - "curriculum_isolation_and_recommended_tracks.test.js"
Cohesion: 0.09
Nodes (17): assert, cleanState, cleanStateSem2, contaminatedGuestState, loadedGuestState, LocalStorageMock, path, s1_phys1 (+9 more)

### Community 48 - "verify_zero_default_account_and_apk_security.js"
Cohesion: 0.16
Nodes (16): assert, CDPClient, collectFilesRecursive(), delay(), fs, getJson(), http, isServerListening() (+8 more)

### Community 49 - "ref_fs"
Cohesion: 0.07
Nodes (23): ref_fs, content, fs, path, targetFile, cfContent, fs, matches (+15 more)

### Community 50 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 51 - "interactive_tour.js"
Cohesion: 0.20
Nodes (17): createOverlayLayers(), endTour(), hideTransitionBanner(), init(), injectStyles(), locateAndHighlightTarget(), nextStep(), positionPopover() (+9 more)

### Community 55 - "renderTodayTimetableBanner"
Cohesion: 0.23
Nodes (17): addNewCustomClassPrompt(), applyTimetableMobileFilter(), deleteClassFromSchedule(), enrichTimetableWithAuthenticRooms(), ensureMutableTimetable(), exportTimetableToCanvasPNG(), formatClassDuration(), getClassDurationMetadata() (+9 more)

### Community 56 - "test_app_purge.js"
Cohesion: 0.20
Nodes (9): ref_vm, cleaned, fs, localStorageMock, parsed, path, raw, root (+1 more)

### Community 59 - "showToastNotification"
Cohesion: 0.16
Nodes (25): completeTaskFromNotification(), createNewRevisionSnapshot(), deleteRevisionById(), downloadICSFile(), editRevisionDetails(), ensureBaselineRevisions(), exportRevisionById(), exportScheduleToICS() (+17 more)

### Community 60 - "verify_v2413_gear_badge.js"
Cohesion: 0.40
Nodes (5): fetch(), fs, http, path, verify()

### Community 61 - "update_v26_styles_and_hud.js"
Cohesion: 0.08
Nodes (24): cfContent, cfMap, courses, curContent, fs, normalizeRawCode(), parsePrereqCodes(), appJs (+16 more)

### Community 62 - "verify_all_connections_and_sync_guards.js"
Cohesion: 0.18
Nodes (11): assert, CDPClient, delay(), fs, getJson(), http, os, path (+3 more)

### Community 63 - "verify_integrations_hub_cdp.js"
Cohesion: 0.18
Nodes (11): assert, CDPClient, delay(), fs, getJson(), http, main(), os (+3 more)

### Community 64 - "verify_system_health.js"
Cohesion: 0.17
Nodes (12): assert, CDPClient, delay(), fs, getJson(), http, isServerListening(), os (+4 more)

### Community 65 - "verify_unconnected_sync_guards.js"
Cohesion: 0.18
Nodes (11): assert, CDPClient, delay(), fs, getJson(), http, os, path (+3 more)

### Community 67 - "sync_from_google_calendars.py"
Cohesion: 0.21
Nodes (14): datetime, glob, build_ics(), load_game_state(), log(), main(), Academic Skill Tree - Automated Daily Calendar Synchronization Script Runs…, sync_to_gist() (+6 more)

### Community 68 - "deep_audit_ecosystem.js"
Cohesion: 0.19
Nodes (10): CDPClient, delay(), fs, getJson(), http, os, path, PROFILE_DIR (+2 more)

### Community 69 - "audit_codebase_integrity.js"
Cohesion: 0.12
Nodes (15): activeFiles, appAudit, appJsPath, appLines, authSyncPath, criticalMissing, fs, htmlContent (+7 more)

### Community 70 - "browser_cdp_qa_audit.js"
Cohesion: 0.19
Nodes (10): CDPClient, delay(), fs, getJson(), http, main(), os, path (+2 more)

### Community 71 - "test_onboarding_auth_flow.js"
Cohesion: 0.18
Nodes (12): assert, CDPClient, delay(), fs, getJson(), http, isServerListening(), os (+4 more)

### Community 72 - "verify_guest_isolation_full.js"
Cohesion: 0.19
Nodes (11): ARTIFACT_DIR, assert, CDPClient, delay(), fs, getJson(), http, path (+3 more)

### Community 73 - "verify_local_miluim_and_moodle.js"
Cohesion: 0.19
Nodes (10): CDPClient, delay(), fs, getJson(), http, main(), os, path (+2 more)

### Community 74 - "verify_pre_anchor_and_clean_ui.js"
Cohesion: 0.19
Nodes (10): CDPClient, delay(), fs, getJson(), http, main(), os, path (+2 more)

### Community 75 - "ref_child_process"
Cohesion: 0.18
Nodes (12): ref_child_process, ARTIFACT_DIR, assert, CDPClient, delay(), fs, getJson(), http (+4 more)

### Community 76 - "verify_tasks_multi_select_and_actions.js"
Cohesion: 0.20
Nodes (11): assert, CDPClient, delay(), fs, getJson(), http, os, path (+3 more)

### Community 77 - "inspect_timetable.js"
Cohesion: 0.19
Nodes (10): CDPClient, delay(), fs, getJson(), http, os, path, PROFILE_DIR (+2 more)

### Community 78 - "verify_admin_telemetry_and_no_quick_login.js"
Cohesion: 0.18
Nodes (9): assert, CDPClient, delay(), fs, http, os, path, PROFILE_DIR (+1 more)

### Community 79 - "verify_tasks_refresh_and_dedup.js"
Cohesion: 0.18
Nodes (12): assert, CDPClient, delay(), fs, getJson(), http, isServerListening(), os (+4 more)

### Community 80 - "create_github_release.py"
Cohesion: 0.17
Nodes (9): argparse, base64, delete_existing_asset_if_any(), get_github_token(), main(), upload_asset(), urllib_error, urllib_parse (+1 more)

### Community 81 - "סמסטרו ME (Semestero ME) 🎓⚙️"
Cohesion: 0.22
Nodes (8): 🌍 English Summary (For Technion Students & Open-Source Contributors), 📥 הורדה וכניסה לכל המכשירים (Direct Access & Downloads), 🛠️ הרצה ופיתוח מקומי (Local Development), 📊 השוואת כלים לסטודנטים בטכניון (Technion Student Tools Comparison), 👨‍💻 יוצר ומפתח המערכת, 📌 כלים מרכזיים במערכת (Key Workspaces), 🤖 מנועי חיפוש ו-AI Discoverability (GEO), סמסטרו ME (Semestero ME) 🎓⚙️

### Community 82 - "fix_modal_zindex.js"
Cohesion: 0.13
Nodes (14): fs, html, indexPath, normNewModal, normOldModal, normStyles, path, rootDir (+6 more)

### Community 83 - "test_infiltrator_purge.js"
Cohesion: 0.13
Nodes (14): catalogCode, context, forbidden, foundForbidden, fs, localStorageMock, path, plan (+6 more)

### Community 84 - "verify_v2415_miluim_disclaimer.js"
Cohesion: 0.13
Nodes (14): appJs, appJsPath, assert, fs, indexHtml, indexHtmlPath, packageJson, packageJsonPath (+6 more)

### Community 87 - "renderNotionTasksTable"
Cohesion: 0.13
Nodes (21): calculateTimeRemaining(), clearTasksSelection(), closeTaskSidePeek(), getActiveStatusFilters(), getCourseNotionIconHtml(), getTaskTypeBadgeHtml(), handlePeekAddComment(), handleTaskRowCheckboxChange() (+13 more)

### Community 90 - "manifest.json"
Cohesion: 0.14
Nodes (13): background_color, description, dir, display, icons, lang, name, orientation (+5 more)

### Community 91 - "apply_v258_upgrade.js"
Cohesion: 0.14
Nodes (13): appJsContent, appJsPath, fs, gradlePath, html, indexHtmlPath, path, pkg (+5 more)

### Community 92 - "apply_v259.js"
Cohesion: 0.14
Nodes (13): appJs, appJsPath, fs, gradlePath, html, indexHtmlPath, path, pkg (+5 more)

### Community 93 - "verify_shortcuts_moodle_and_admin.js"
Cohesion: 0.08
Nodes (20): assert, fs, manualTaskInput, merged, moodleSyncCode, path, testPairs, userCopyDup (+12 more)

### Community 97 - "renderFlowchartTree"
Cohesion: 0.17
Nodes (14): clearFlowchartHighlight(), exportSvgToPng(), findCourseObj(), fitFlowchartToWidth(), highlightFlowchartPath(), initFlowchartZoom(), normalizeCourseCodeForFlowchart(), renderFlowchartTree() (+6 more)

### Community 99 - "verify_v262_back_to_top.js"
Cohesion: 0.15
Nodes (11): appJs, assert, fs, gradle, indexHtml, packageJson, path, ROOT (+3 more)

### Community 101 - "apply_hud_fixes.js"
Cohesion: 0.17
Nodes (11): fs, html, indexPath, path, planner, plannerPath, rootDir, styles (+3 more)

### Community 102 - "verify_purges_and_modal.js"
Cohesion: 0.18
Nodes (10): appCode, assert, cleanedPlan, codes, dirtyPlan, fs, INFILTRATORS, isForbiddenSem4() (+2 more)

### Community 103 - "verify_desktop_and_mobile_suite.js"
Cohesion: 0.17
Nodes (10): appJs, assert, fs, indexHtml, packageJson, path, plannerJs, ROOT (+2 more)

### Community 107 - "subprocess"
Cohesion: 0.18
Nodes (3): shutil, subprocess, zipfile

### Community 110 - "test_clean_state_isolation.js"
Cohesion: 0.18
Nodes (10): anyGrade, authSyncCode, courseKeys, currTemplateCode, fs, guestState, healedState, path (+2 more)

### Community 111 - "site_analytics.js"
Cohesion: 0.40
Nodes (9): fetchStats(), init(), loadLocalCounts(), openModal(), pingCloudTelemetry(), recordSession(), renderModal(), syncPendingOfflineVisits() (+1 more)

### Community 114 - "מדיניות פרטיות והגנת מידע (Privacy Policy)"
Cohesion: 0.20
Nodes (9): 1. מבוא והתחייבות לפרטיות (Introduction), 2. עקרון השמירה המקומית (Local-First Architecture), 3. סנכרון ענן מאובטח (אופציונלי בלבד - Optional Cloud Sync), 4. אינטגרציות אקדמיות (Academic Integrations), 5. אי-שיתוף מידע ומניעת מעקב מסחרי (Zero Data Sharing & No Trackers), 6. זכויות המשתמש, מחיקת נתונים ו"הזכות להישכח" (Your Rights & Data Erasure), 7. אבטחת מידע (Data Security), 8. יצירת קשר ורכז פרטיות (Contact Information) (+1 more)

### Community 115 - "apply_tutorial_and_widgets_update.js"
Cohesion: 0.20
Nodes (9): appJs, appJsPath, fs, html, indexHtmlPath, path, rootDir, uiJs (+1 more)

### Community 116 - "update_download_modal_links.js"
Cohesion: 0.20
Nodes (9): fs, hasCRLF, html, indexPath, normHtml, normNew, normOld, path (+1 more)

### Community 117 - "auth_session_persistence.test.js"
Cohesion: 0.20
Nodes (3): assert, fs, path

### Community 120 - "ref_http"
Cohesion: 0.14
Nodes (12): ref_http, ref_os, fs, http, MIME_TYPES, os, path, server (+4 more)

### Community 121 - "audit_all_prereqs.js"
Cohesion: 0.25
Nodes (8): allCodes, cfContent, cfMap, curContent, fs, normalizeRawCode(), parsePrereqCodes(), savedState

### Community 122 - "update_tour_settings.js"
Cohesion: 0.22
Nodes (8): content, filePath, fs, hasCRLF, normContent, normNew, normOld, path

### Community 123 - "test_moodle_zoom_filter.test.js"
Cohesion: 0.22
Nodes (8): assert, dedupResult, fs, moodleSyncCode, parseResult, path, titles034056, titles114052

### Community 125 - "test_open_modal_sim.js"
Cohesion: 0.25
Nodes (7): ref_jsdom, appJsCode, dom, fs, html, jsdom, plannerCatalogCode

### Community 128 - "unit_dedup_logic.js"
Cohesion: 0.43
Nodes (7): areTasksDuplicates(), deduplicateCourseTaskList(), extractMoodleId(), mergeTaskPair(), normalizeTaskTitle(), res, sampleTasks

### Community 130 - "accessibility.js"
Cohesion: 0.53
Nodes (4): applyA11yClasses(), savePrefs(), setupEventListeners(), updateButtonStates()

### Community 134 - "_backup_widgets/widgets/ms_ac_exam.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 135 - "_backup_widgets/widgets/ms_ac_semester.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 136 - "_backup_widgets/widgets/ms_ac_tasks.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 139 - "modal_help.js"
Cohesion: 0.60
Nodes (5): init(), injectHelpStyles(), setupAllModalHelpTriggers(), setupTriggerForModal(), toggleHelpBanner()

### Community 140 - "bump_version.js"
Cohesion: 0.33
Nodes (5): fs, html, indexPath, path, ROOT

### Community 142 - "widgets/ms_ac_exam.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 143 - "widgets/ms_ac_semester.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 144 - "widgets/ms_ac_tasks.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

## Knowledge Gaps
- **697 isolated node(s):** `type`, `$schema`, `version`, `body`, `actions` (+692 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 976 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `authSync` connect `setupMobileNotifications` to `auth_sync.js`, `verify_shortcuts_moodle_and_admin.js`, `ref_assert`, `auth_session_persistence.test.js`?**
  _High betweenness centrality (0.164) - this node is a cross-community bridge._
- **Why does `savePhoneAndNotificationPreferences()` connect `setupMobileNotifications` to `app.js`, `showToastNotification`, `saveState`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `updateNotificationDrawerDeviceMode()` connect `setupMobileNotifications` to `app.js`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `type`, `$schema`, `version` to the rest of the system?**
  _697 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SemesteroClassTileService.java` be split into smaller, more focused modules?**
  _Cohesion score 0.0641025641025641 - nodes in this community are weakly interconnected._
- **Should `AppDelegate` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03425925925925926 - nodes in this community are weakly interconnected._