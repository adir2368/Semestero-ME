# Graph Report - academic-skill-tree  (2026-11-03)

## Corpus Check
- 346 files · ~851,796 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 87 file(s) not represented in the graph (top: .xml 61, (none) 6, .bat 6)

## Summary
- 2382 nodes · 4516 edges · 161 communities (117 shown, 44 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dad62846`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SemesteroClassTileService.java
- AppDelegate
- app.js
- WearNotificationHelper.java
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
- SemesteroPomodoroWidget
- MainActivity
- Degree Planner & Workload Visualizer (Submodule 12)
- verify_classification_exams.test.js
- setupMobileNotifications
- WearCarouselAdapter
- timetable_generator_test.js
- test_modal_error.js
- watch_companion.js
- notifyStateChanged
- test_miluim_and_moodle_sync.js
- wear/MainActivity.java
- ui_enhancements.js
- SemesteroMiluimWidget
- verify_v2414_flask_gear.js
- verify_class_radar_15m_and_authentic_tasks.test.js
- android.content.Context
- ref_path
- moodle_sync.js
- SemesteroScheduleWidget
- curriculum_isolation_and_recommended_tracks.test.js
- verify_zero_default_account_and_apk_security.js
- ref_fs
- gradlew
- interactive_tour.js
- Package.swift
- showToastNotification
- test_app_purge.js
- verify_phone_watch_dual_sync.test.js
- verify_v2413_gear_badge.js
- update_v26_styles_and_hud.js
- verify_all_connections_and_sync_guards.js
- verify_integrations_hub_cdp.js
- verify_system_health.js
- MainActivity
- sync_from_google_calendars.py
- deep_audit_ecosystem.js
- audit_codebase_integrity.js
- browser_cdp_qa_audit.js
- test_onboarding_auth_flow.js
- verify_guest_isolation_full.js
- verify_local_miluim_and_moodle.js
- verify_pre_anchor_and_clean_ui.js
- verify_spotlight_guided_tour.js
- verify_tasks_multi_select_and_actions.js
- inspect_timetable.js
- verify_admin_telemetry_and_no_quick_login.js
- verify_tasks_refresh_and_dedup.js
- create_github_release.py
- סמסטרו ME (Semestero ME) 🎓⚙️
- fix_modal_zindex.js
- test_infiltrator_purge.js
- verify_v2415_miluim_disclaimer.js
- setupNotionDashboard
- manifest.json
- apply_v258_upgrade.js
- apply_v259.js
- verify_shortcuts_moodle_and_admin.js
- qa_verify_planner_interactive_restore_and_collapse.js
- verify_wear_sync_and_day_detection.test.js
- renderFlowchartTree
- verify_wear_tasks_expand_and_vertical_centering.test.js
- verify_v262_back_to_top.js
- verify_orientation_lock_security.test.js
- apply_hud_fixes.js
- verify_purges_and_modal.js
- verify_desktop_and_mobile_suite.js
- setupAddCustomTaskModal
- qa_verify_performance_browser.js
- verify_performance_toolkit.test.js
- subprocess
- ref_child_process
- verify_native_download_bridge.test.js
- test_clean_state_isolation.js
- site_analytics.js
- verify_physics_variant_persistence.test.js
- check_prereqs.js
- מדיניות פרטיות והגנת מידע (Privacy Policy)
- apply_tutorial_and_widgets_update.js
- update_download_modal_links.js
- auth_session_persistence.test.js
- generate_verified_prereqs.js
- .resolve
- ref_http
- audit_all_prereqs.js
- build_mobile_dist.js
- verify_integrations_hub_and_unconnected_jumps.js
- dfs
- test_open_modal_sim.js
- datamap
- pendingintent
- unit_dedup_logic.js
- apply_curriculum_separation.py
- accessibility.js
- view
- test_adir_render.py
- _backup_widgets/widgets/ms_ac_exam.json
- _backup_widgets/widgets/ms_ac_semester.json
- _backup_widgets/widgets/ms_ac_tasks.json
- modal_help.js
- widgets/ms_ac_exam.json
- widgets/ms_ac_semester.json
- widgets/ms_ac_tasks.json
- mirofish_expanded_swarm.py
- planner_catalog.js
- patch_integrations_hub.py
- apply_app_guards.py
- CapApp-SPM/README.md
- sw.js

## God Nodes (most connected - your core abstractions)
1. `showToastNotification()` - 55 edges
2. `saveState()` - 52 edges
3. `openCourseDetails()` - 37 edges
4. `notifyStateChanged()` - 34 edges
5. `setupNotionDashboard()` - 27 edges
6. `renderNotionTasksTable()` - 27 edges
7. `bindDelegatedPlannerEvents()` - 26 edges
8. `recalculateCourseStates()` - 25 edges
9. `renderUI()` - 24 edges
10. `WearCarouselAdapter` - 23 edges

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

## Communities (161 total, 44 thin omitted)

### Community 0 - "SemesteroClassTileService.java"
Cohesion: 0.08
Nodes (26): actionbuilders, ExampleInstrumentedTest, ExampleUnitTest, Override, SemesteroClassTileService, androidx.test.ext.junit.runners.AndroidJUnit4, androidx.wear.tiles.TileService, assert (+18 more)

### Community 1 - "AppDelegate"
Cohesion: 0.09
Nodes (20): Any, Bool, Capacitor, AppDelegate, UIScene, UISceneSession, UIWindow, SceneDelegate (+12 more)

### Community 2 - "app.js"
Cohesion: 0.03
Nodes (70): _activePrereqCodes, APP_CURRENT_REVISION, AUGUST_2026_PERSONAL_EVENTS, AUGUST_2026_SCHEDULE, AUTHENTIC_TIMETABLE_METADATA, calculateTimeRemaining(), CHEESEFORK_EXAM_DATES, CHEESEFORK_SEMESTER_SCHEDULE (+62 more)

### Community 3 - "WearNotificationHelper.java"
Cohesion: 0.19
Nodes (9): android.os.Vibrator, WearNotificationHelper, build, contextcompat, notificationchannel, notificationcompat, notificationmanager, packagemanager (+1 more)

### Community 4 - "ref_assert"
Cohesion: 0.10
Nodes (16): ref_assert, appCode, assert, fs, mockEl, assert, fs, path (+8 more)

### Community 5 - "planner_module.js"
Cohesion: 0.10
Nodes (65): applyEnglishLevelState(), bindDelegatedPlannerEvents(), runAutoScrollStep(), stopEdgeAutoScroll(), triggerEdgeAutoScroll(), buildCourseSemesterMap(), calculateCourseWorkload(), calculateSemesterWorkload() (+57 more)

### Community 6 - "android.appwidget.AppWidgetManager"
Cohesion: 0.23
Nodes (12): android.app.PendingIntent, Override, SemesteroTasksExamWidget, android.appwidget.AppWidgetManager, android.appwidget.AppWidgetProvider, android.content.Intent, Override, componentname (+4 more)

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
Cohesion: 0.17
Nodes (4): SemesteroWidgetBridge, Override, SemesteroFinalsGpaWidget, android.webkit.JavascriptInterface

### Community 14 - "setupEventListeners"
Cohesion: 0.12
Nodes (24): addPrereqChip(), applyCheeseForkCourse(), ensureCheeseForkDatabase(), escapeHtmlPrereq(), findCheeseForkCourse(), formatAcademicTermForDate(), getCourseCheeseforkExamDates(), getCourseDisplayNameByCode() (+16 more)

### Community 15 - "grade_sheet.js"
Cohesion: 0.24
Nodes (15): applyPreset(), calcTargetGpa(), closeModal(), exportCSV(), getRawCourses(), getSemesterName(), getTranscriptData(), init() (+7 more)

### Community 16 - "package.json"
Cohesion: 0.06
Nodes (35): author, dependencies, @capacitor/android, @capacitor/cli, @capacitor/core, @capacitor/ios, @capacitor/local-notifications, description (+27 more)

### Community 17 - "os"
Cohesion: 0.06
Nodes (5): io, os, pil, playwright_sync_api, time

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
Nodes (40): addXp(), autoUpdateTaskStatusesByDueDate(), bulkSetTasksStatus(), completeAllTasks(), createCalendarDayCell(), deleteCourse(), deleteSelectedTasks(), deleteSingleTask() (+32 more)

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

### Community 28 - "MainActivity"
Cohesion: 0.18
Nodes (7): Intent, Override, MainActivity, android.os.Bundle, com.getcapacitor.BridgeActivity, websettings, webview

### Community 29 - "Degree Planner & Workload Visualizer (Submodule 12)"
Cohesion: 0.17
Nodes (8): assert, catalogCode, catalogEnv, catalogFunc, fs, globalScope, indexHtml, path

### Community 30 - "verify_classification_exams.test.js"
Cohesion: 0.17
Nodes (11): appGradle, appJs, assert, fs, indexHtml, path, pkg, plannerJs (+3 more)

### Community 31 - "setupMobileNotifications"
Cohesion: 0.15
Nodes (31): checkAndTrigger10MinReminders(), closeNotificationDrawer(), completeTaskFromNotification(), constructor(), dispatchNativeMobileNotifications(), ensureCapacitorNotificationChannel(), ensureNotificationPreferencesDefaults(), generateMorning730BriefingData() (+23 more)

### Community 32 - "WearCarouselAdapter"
Cohesion: 0.07
Nodes (34): Adapter, android.view.LayoutInflater, android.view.View, android.view.ViewGroup, Override, SemesteroComplicationService, ClassItem, Override (+26 more)

### Community 33 - "timetable_generator_test.js"
Cohesion: 0.11
Nodes (23): assert, coreCourses, customAnchored, m1, m2, m3, m4, opt5 (+15 more)

### Community 34 - "test_modal_error.js"
Cohesion: 0.20
Nodes (8): ref_vm, context, documentMock, elements, fs, path, root, vm

### Community 35 - "watch_companion.js"
Cohesion: 0.36
Nodes (6): enterAmbient(), goToScreen(), nextScreen(), prevScreen(), resetIdleTimer(), wakeFromAmbient()

### Community 36 - "notifyStateChanged"
Cohesion: 0.12
Nodes (30): addCustomExamToBank(), autoScheduleCourseExams(), closeCalendarDayModal(), copyScheduleToGoogleTasks(), generateAllTermsList(), getExamStatusPill(), getHebrewDayOfWeek(), getSundayOfWeek() (+22 more)

### Community 37 - "test_miluim_and_moodle_sync.js"
Cohesion: 0.25
Nodes (7): appJs, assert, convertedCodes, fs, indexHtml, mockCourses, path

### Community 38 - "wear/MainActivity.java"
Cohesion: 0.08
Nodes (33): Override, PhoneWearListenerService, android.view.MotionEvent, Override, WearDataSyncService, android.widget.ImageView, androidx.viewpager2.widget.ViewPager2, arraylist (+25 more)

### Community 39 - "ui_enhancements.js"
Cohesion: 0.15
Nodes (21): applyFontScale(), attachModalScrollProgress(), buildSearchIndex(), createCommandPaletteModal(), getAll(), has(), initAllEnhancements(), initBackToTop() (+13 more)

### Community 41 - "verify_v2414_flask_gear.js"
Cohesion: 0.40
Nodes (5): fetch(), fs, http, path, verify()

### Community 42 - "verify_class_radar_15m_and_authentic_tasks.test.js"
Cohesion: 0.09
Nodes (22): appJs, appJsPath, assert, fs, layout, layoutPath, listener, listenerPath (+14 more)

### Community 43 - "android.content.Context"
Cohesion: 0.22
Nodes (6): Override, SemesteroLaunchpadWidget, Override, SemesteroNextClassWidget, WearSyncManager, android.content.Context

### Community 44 - "ref_path"
Cohesion: 0.08
Nodes (21): { app, BrowserWindow, Menu, ipcMain }, path, { contextBridge, ipcRenderer }, electron, ref_path, content, fs, path (+13 more)

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
Cohesion: 0.08
Nodes (21): ref_fs, fs, html, indexPath, path, ROOT, cfContent, fs (+13 more)

### Community 50 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 51 - "interactive_tour.js"
Cohesion: 0.20
Nodes (17): createOverlayLayers(), endTour(), hideTransitionBanner(), init(), injectStyles(), locateAndHighlightTarget(), nextStep(), positionPopover() (+9 more)

### Community 55 - "showToastNotification"
Cohesion: 0.14
Nodes (32): addNewCustomClassPrompt(), applyTimetableMobileFilter(), createNewRevisionSnapshot(), deleteClassFromSchedule(), deleteRevisionById(), downloadICSFile(), editRevisionDetails(), enrichTimetableWithAuthenticRooms() (+24 more)

### Community 56 - "test_app_purge.js"
Cohesion: 0.22
Nodes (8): cleaned, fs, localStorageMock, parsed, path, raw, root, vm

### Community 59 - "verify_phone_watch_dual_sync.test.js"
Cohesion: 0.10
Nodes (19): appJsContent, appJsPath, appManifestContent, appManifestPath, fs, path, phoneListenerContent, phoneListenerPath (+11 more)

### Community 60 - "verify_v2413_gear_badge.js"
Cohesion: 0.40
Nodes (5): fetch(), fs, http, path, verify()

### Community 61 - "update_v26_styles_and_hud.js"
Cohesion: 0.11
Nodes (17): appJs, appJsPath, fs, gradle, gradlePath, indexHtml, indexPath, path (+9 more)

### Community 62 - "verify_all_connections_and_sync_guards.js"
Cohesion: 0.18
Nodes (11): assert, CDPClient, delay(), fs, getJson(), http, os, path (+3 more)

### Community 63 - "verify_integrations_hub_cdp.js"
Cohesion: 0.09
Nodes (22): assert, CDPClient, delay(), fs, getJson(), http, main(), os (+14 more)

### Community 64 - "verify_system_health.js"
Cohesion: 0.17
Nodes (12): assert, CDPClient, delay(), fs, getJson(), http, isServerListening(), os (+4 more)

### Community 65 - "MainActivity"
Cohesion: 0.20
Nodes (6): android.app.Activity, android.content.BroadcastReceiver, Override, MainActivity, WearNotificationReceiver, OnMessageReceivedListener

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

### Community 75 - "verify_spotlight_guided_tour.js"
Cohesion: 0.19
Nodes (11): ARTIFACT_DIR, assert, CDPClient, delay(), fs, getJson(), http, path (+3 more)

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

### Community 87 - "setupNotionDashboard"
Cohesion: 0.21
Nodes (14): clearTasksSelection(), closeTaskSidePeek(), handlePeekAddComment(), handleTaskRowCheckboxChange(), hideNotionStatusDropdown(), hideTaskContextMenu(), initGlobalNotionDropdown(), openMoveTasksModal() (+6 more)

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

### Community 95 - "qa_verify_planner_interactive_restore_and_collapse.js"
Cohesion: 0.18
Nodes (12): assert, CDPClient, delay(), findChrome(), fs, getJson(), http, main() (+4 more)

### Community 96 - "verify_wear_sync_and_day_detection.test.js"
Cohesion: 0.12
Nodes (15): appGradle, appManifest, assert, fs, path, phoneListenerPath, phoneListenerSrc, ROOT (+7 more)

### Community 97 - "renderFlowchartTree"
Cohesion: 0.17
Nodes (14): clearFlowchartHighlight(), exportSvgToPng(), findCourseObj(), fitFlowchartToWidth(), highlightFlowchartPath(), initFlowchartZoom(), normalizeCourseCodeForFlowchart(), renderFlowchartTree() (+6 more)

### Community 98 - "verify_wear_tasks_expand_and_vertical_centering.test.js"
Cohesion: 0.12
Nodes (15): assert, fs, path, phoneApkPath, phoneStat, ROOT_DIR, watchHtml, watchHtmlPath (+7 more)

### Community 99 - "verify_v262_back_to_top.js"
Cohesion: 0.15
Nodes (11): appJs, assert, fs, gradle, indexHtml, packageJson, path, ROOT (+3 more)

### Community 100 - "verify_orientation_lock_security.test.js"
Cohesion: 0.15
Nodes (12): appApk, appHasPortrait, appXml, { execSync }, fs, javaCode, javaHasRuntimeLock, javaPath (+4 more)

### Community 101 - "apply_hud_fixes.js"
Cohesion: 0.17
Nodes (11): fs, html, indexPath, path, planner, plannerPath, rootDir, styles (+3 more)

### Community 102 - "verify_purges_and_modal.js"
Cohesion: 0.18
Nodes (10): appCode, assert, cleanedPlan, codes, dirtyPlan, fs, INFILTRATORS, isForbiddenSem4() (+2 more)

### Community 103 - "verify_desktop_and_mobile_suite.js"
Cohesion: 0.17
Nodes (10): appJs, assert, fs, indexHtml, packageJson, path, plannerJs, ROOT (+2 more)

### Community 104 - "setupAddCustomTaskModal"
Cohesion: 0.24
Nodes (11): closeModal(), computeNextTaskNumber(), handleCreateTaskSubmit(), init(), openAddCustomTaskModal(), openModal(), render(), setTaskModalCategory() (+3 more)

### Community 105 - "qa_verify_performance_browser.js"
Cohesion: 0.25
Nodes (10): APP_DIR, cdpRequest(), fs, http, launchChrome(), path, run(), { spawn } (+2 more)

### Community 106 - "verify_performance_toolkit.test.js"
Cohesion: 0.18
Nodes (10): analyticsContent, appJsContent, assert, cssContent, fs, htmlContent, path, plannerContent (+2 more)

### Community 107 - "subprocess"
Cohesion: 0.18
Nodes (3): shutil, subprocess, zipfile

### Community 108 - "ref_child_process"
Cohesion: 0.22
Nodes (9): ref_child_process, fetchJson(), fs, http, main(), send(), path, SCREENSHOT_PATH (+1 more)

### Community 109 - "verify_native_download_bridge.test.js"
Cohesion: 0.20
Nodes (9): appJsContent, appJsPath, assert, fs, indexHtmlContent, indexHtmlPath, mainActivityContent, mainActivityPath (+1 more)

### Community 110 - "test_clean_state_isolation.js"
Cohesion: 0.18
Nodes (10): anyGrade, authSyncCode, courseKeys, currTemplateCode, fs, guestState, healedState, path (+2 more)

### Community 111 - "site_analytics.js"
Cohesion: 0.29
Nodes (10): fetchStats(), init(), initWebVitalsMonitor(), loadLocalCounts(), openModal(), pingCloudTelemetry(), recordSession(), renderModal() (+2 more)

### Community 112 - "verify_physics_variant_persistence.test.js"
Cohesion: 0.20
Nodes (9): appJs, assert, fnMatch, fs, mockGameState, mockLocalStorage, path, plannerJs (+1 more)

### Community 113 - "check_prereqs.js"
Cohesion: 0.29
Nodes (7): cfContent, cfMap, courses, curContent, fs, normalizeRawCode(), parsePrereqCodes()

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

### Community 118 - "generate_verified_prereqs.js"
Cohesion: 0.25
Nodes (6): cfContent, cfMap, codeEquivalents, curContent, fs, verifiedPrereqs

### Community 119 - ".resolve"
Cohesion: 0.60
Nodes (3): CourseSlot, ScheduleResolution, WearScheduleHelper

### Community 120 - "ref_http"
Cohesion: 0.14
Nodes (12): ref_http, ref_os, fs, http, MIME_TYPES, os, path, server (+4 more)

### Community 121 - "audit_all_prereqs.js"
Cohesion: 0.25
Nodes (8): allCodes, cfContent, cfMap, curContent, fs, normalizeRawCode(), parsePrereqCodes(), savedState

### Community 122 - "build_mobile_dist.js"
Cohesion: 0.33
Nodes (5): FILES_TO_COPY, fs, path, ROOT, WWW

### Community 123 - "verify_integrations_hub_and_unconnected_jumps.js"
Cohesion: 0.83
Nodes (3): assert, createMockEnvironment(), runTests()

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
- **816 isolated node(s):** `type`, `$schema`, `version`, `body`, `actions` (+811 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `authSync` connect `setupMobileNotifications` to `auth_sync.js`, `verify_integrations_hub_and_unconnected_jumps.js`, `verify_shortcuts_moodle_and_admin.js`, `auth_session_persistence.test.js`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `savePhoneAndNotificationPreferences()` connect `setupMobileNotifications` to `app.js`, `notifyStateChanged`, `saveState`, `showToastNotification`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `renderPhoneAndNotificationPreferences()` connect `setupMobileNotifications` to `app.js`, `showToastNotification`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `type`, `$schema`, `version` to the rest of the system?**
  _816 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `SemesteroClassTileService.java` be split into smaller, more focused modules?**
  _Cohesion score 0.07765151515151515 - nodes in this community are weakly interconnected._
- **Should `AppDelegate` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.029792429792429794 - nodes in this community are weakly interconnected._