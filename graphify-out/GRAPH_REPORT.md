# Graph Report - academic-skill-tree  (2026-10-17)

## Corpus Check
- 65 files · ~557,062 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .bat 5, .css 2, .ico 2)

## Summary
- 685 nodes · 1507 edges · 49 communities (41 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc949975`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- planner_module.js
- app.js
- sync_from_google_calendars.py
- app_restored.js
- auth_sync.js
- setupMobileNotifications
- saveState
- showToastNotification
- renderConstellationTree
- moodle_sync.js
- setActiveMainTab
- setupFinalsMode
- manifest.json
- renderNotionTasksTable
- timetable_generator_test.js
- setupNotionIconPickerEvents
- setupEventListeners
- ref_path
- accessibility.js
- סמסטרו ME (Semestero ME) 🎓⚙️
- browser_cdp_qa_audit.js
- dfs
- planner_catalog.js
- sw.js
- deep_engine_stress_test.js
- test_clean_state_isolation.js
- site_analytics.js
- מדיניות פרטיות והגנת מידע (Privacy Policy)
- renderFlowchartTree
- audit_all_prereqs.js
- ref_fs
- check_prereqs.js
- generate_verified_prereqs.js
- interactive_tour.js
- setupAddCustomTaskModal
- renderModalBody
- ms_ac_exam.json
- ms_ac_semester.json
- ms_ac_tasks.json
- modal_help.js
- new_features_validation_test.js
- sync_to_dist.js
- syncScheduleToCloudGist

## God Nodes (most connected - your core abstractions)
1. `saveState()` - 36 edges
2. `showToastNotification()` - 35 edges
3. `notifyStateChanged()` - 34 edges
4. `openCourseDetails()` - 28 edges
5. `bindDelegatedPlannerEvents()` - 22 edges
6. `renderNotionTasksTable()` - 20 edges
7. `openTaskSidePeek()` - 20 edges
8. `getNormalizedCodes()` - 20 edges
9. `setupNotionDashboard()` - 19 edges
10. `recalculateCourseStates()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `setupEventListeners()` --indirect_call--> `handleAddCourseSubmit()`  [INFERRED]
  app.js → app.js  _Bridges community 17 → community 8_
- `setupNotionDashboard()` --indirect_call--> `copyScheduleToGoogleTasks()`  [INFERRED]
  app.js → app.js  _Bridges community 14 → community 12_
- `setupAddCustomTaskModal()` --indirect_call--> `handleCreateTaskSubmit()`  [INFERRED]
  app.js → app.js  _Bridges community 39 → community 8_
- `renderFlowchartTree()` --calls--> `getSemesterStats()`  [EXTRACTED]
  app.js → app.js  _Bridges community 7 → community 33_
- `saveCourseIcon()` --calls--> `renderNotionTasksTable()`  [EXTRACTED]
  app.js → app.js  _Bridges community 16 → community 14_

## Import Cycles
- None detected.

## Communities (49 total, 8 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.12
Nodes (15): author, description, devDependencies, electron, electron-packager, keywords, license, main (+7 more)

### Community 1 - "planner_module.js"
Cohesion: 0.13
Nodes (52): applyEnglishLevelState(), bindDelegatedPlannerEvents(), buildCourseSemesterMap(), calculateCourseWorkload(), calculateSemesterWorkload(), calculateWhatIfGPA(), checkAndApplySeasonalCode(), checkPrerequisites() (+44 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (28): _activePrereqCodes, APP_CURRENT_REVISION, AUGUST_2026_PERSONAL_EVENTS, AUGUST_2026_SCHEDULE, CHEESEFORK_EXAM_DATES, CHEESEFORK_SEMESTER_SCHEDULE, CLOUD_GIST_SYNC, COURSE_NOTION_ICONS (+20 more)

### Community 3 - "sync_from_google_calendars.py"
Cohesion: 0.08
Nodes (24): datetime, glob, json, os, pil, random, re, struct (+16 more)

### Community 4 - "app_restored.js"
Cohesion: 0.19
Nodes (30): addXp(), completeAllTasks(), deleteCourse(), drawConnections(), gameState, getXpNeeded(), handleAddCourseSubmit(), importFromCheesefork() (+22 more)

### Community 5 - "auth_sync.js"
Cohesion: 0.21
Nodes (31): closeAuthModal(), deleteAccount(), finishOnboarding(), getActiveUser(), getUserStorageKey(), handleUserCloudRestore(), hasAdirLocalData(), init() (+23 more)

### Community 6 - "setupMobileNotifications"
Cohesion: 0.22
Nodes (19): checkAndTrigger10MinReminders(), closeNotificationDrawer(), dispatchNativeMobileNotifications(), ensureNotificationPreferencesDefaults(), getActiveTimetableSchedule(), getRemainingClassesToday(), getUpcomingPriorityTasks(), openNotificationDrawer() (+11 more)

### Community 7 - "saveState"
Cohesion: 0.16
Nodes (30): addXp(), autoUpdateTaskStatusesByDueDate(), completeAllTasks(), createCalendarDayCell(), deleteCourse(), getSemesterStats(), getTaskCategoryKey(), isWinterSemesterStarted() (+22 more)

### Community 8 - "showToastNotification"
Cohesion: 0.22
Nodes (19): completeTaskFromNotification(), createNewRevisionSnapshot(), deleteRevisionById(), editRevisionDetails(), ensureBaselineRevisions(), exportRevisionById(), getPrereqChips(), handleAddCourseSubmit() (+11 more)

### Community 9 - "renderConstellationTree"
Cohesion: 0.15
Nodes (17): clearConstellationHighlight(), clearSemesterOrbitHighlight(), drawConnections(), exportSvgToPng(), fitFlowchartToWidth(), getCourseConstellationPosition(), highlightConstellationPath(), highlightSemesterOrbit() (+9 more)

### Community 10 - "moodle_sync.js"
Cohesion: 0.30
Nodes (15): bindUI(), cleanTaskSummary(), closeModal(), fetchIcsFeed(), getStorageKey(), importFromFile(), init(), loadConfig() (+7 more)

### Community 11 - "setActiveMainTab"
Cohesion: 0.20
Nodes (15): applyTimetableMobileFilter(), exportTimetableToCanvasPNG(), getHebrewDayOfWeek(), getLiveClassStatus(), populateNotionCourseFilter(), renderExamGapRunway(), renderFinalsCalendar(), renderTimetableGrid() (+7 more)

### Community 12 - "setupFinalsMode"
Cohesion: 0.15
Nodes (19): addCustomExamToBank(), autoScheduleCourseExams(), closeCalendarDayModal(), copyScheduleToGoogleTasks(), downloadICSFile(), exportScheduleToICS(), generateAllTermsList(), getExamStatusPill() (+11 more)

### Community 13 - "manifest.json"
Cohesion: 0.15
Nodes (12): background_color, description, dir, display, icons, lang, name, orientation (+4 more)

### Community 14 - "renderNotionTasksTable"
Cohesion: 0.13
Nodes (18): calculateTimeRemaining(), closeTaskSidePeek(), getActiveStatusFilters(), getCourseNotionIconHtml(), getTaskTypeBadgeHtml(), handlePeekAddComment(), hideNotionStatusDropdown(), initGlobalNotionDropdown() (+10 more)

### Community 15 - "timetable_generator_test.js"
Cohesion: 0.12
Nodes (21): assert, coreCourses, m1, m2, m3, m4, optFreeDays, options (+13 more)

### Community 16 - "setupNotionIconPickerEvents"
Cohesion: 0.36
Nodes (9): closeCourseIconPicker(), getDefaultCourseIconKey(), openCourseIconPicker(), renderIconPickerGrid(), renderIconPickerPalette(), resetCourseIcon(), saveCourseIcon(), setupNotionIconPickerEvents() (+1 more)

### Community 17 - "setupEventListeners"
Cohesion: 0.14
Nodes (18): addPrereqChip(), applyCheeseForkCourse(), ensureCheeseForkDatabase(), escapeHtmlPrereq(), findCheeseForkCourse(), getCourseDisplayNameByCode(), importFromCheesefork(), initCheeseForkDatabase() (+10 more)

### Community 18 - "ref_path"
Cohesion: 0.12
Nodes (13): { app, BrowserWindow, Menu, ipcMain }, path, { contextBridge, ipcRenderer }, electron, ref_path, { app, BrowserWindow }, fs, path (+5 more)

### Community 19 - "accessibility.js"
Cohesion: 0.53
Nodes (4): applyA11yClasses(), savePrefs(), setupEventListeners(), updateButtonStates()

### Community 20 - "סמסטרו ME (Semestero ME) 🎓⚙️"
Cohesion: 0.18
Nodes (10): איך מחושב הממוצע ב-Semestero ME?, האם המידע שלי מאובטח ופרטי?, 🖥️ התקנת אפליקציית מחשב (Windows Desktop App), 👨‍💻 יוצר ומפתח המערכת, 📌 כלים מרכזיים במערכת (Key Workspaces), 🌐 כניסה לאפליקציה (Live Web & Mobile App), לאילו מסלולים ותארים האפליקציה מתאימה?, 🤖 מנועי חיפוש ו-AI Discoverability (+2 more)

### Community 21 - "browser_cdp_qa_audit.js"
Cohesion: 0.05
Nodes (37): ref_child_process, ref_http, ref_https, ref_os, https, fs, http, MIME_TYPES (+29 more)

### Community 29 - "deep_engine_stress_test.js"
Cohesion: 0.17
Nodes (8): assert, catalogCode, catalogEnv, catalogFunc, fs, globalScope, indexHtml, path

### Community 30 - "test_clean_state_isolation.js"
Cohesion: 0.18
Nodes (10): anyGrade, authSyncCode, courseKeys, currTemplateCode, fs, guestState, healedState, path (+2 more)

### Community 31 - "site_analytics.js"
Cohesion: 0.38
Nodes (9): fetchStats(), init(), loadLocalCounts(), openModal(), pingCloudTelemetry(), recordSession(), renderModal(), syncPendingOfflineVisits() (+1 more)

### Community 32 - "מדיניות פרטיות והגנת מידע (Privacy Policy)"
Cohesion: 0.20
Nodes (9): 1. מבוא והתחייבות לפרטיות (Introduction), 2. עקרון השמירה המקומית (Local-First Architecture), 3. סנכרון ענן מאובטח (אופציונלי בלבד - Optional Cloud Sync), 4. אינטגרציות אקדמיות (Academic Integrations), 5. אי-שיתוף מידע ומניעת מעקב מסחרי (Zero Data Sharing & No Trackers), 6. זכויות המשתמש, מחיקת נתונים ו"הזכות להישכח" (Your Rights & Data Erasure), 7. אבטחת מידע (Data Security), 8. יצירת קשר ורכז פרטיות (Contact Information) (+1 more)

### Community 33 - "renderFlowchartTree"
Cohesion: 0.25
Nodes (7): clearFlowchartHighlight(), findCourseObj(), highlightFlowchartPath(), normalizeCourseCodeForFlowchart(), renderFlowchartTree(), sanitizeHebrewCourseTitle(), splitCourseTitleForCard()

### Community 34 - "audit_all_prereqs.js"
Cohesion: 0.25
Nodes (8): allCodes, cfContent, cfMap, curContent, fs, normalizeRawCode(), parsePrereqCodes(), savedState

### Community 35 - "ref_fs"
Cohesion: 0.25
Nodes (6): ref_fs, cfContent, fs, matches, courses, fs

### Community 36 - "check_prereqs.js"
Cohesion: 0.29
Nodes (7): cfContent, cfMap, courses, curContent, fs, normalizeRawCode(), parsePrereqCodes()

### Community 37 - "generate_verified_prereqs.js"
Cohesion: 0.25
Nodes (6): cfContent, cfMap, codeEquivalents, curContent, fs, verifiedPrereqs

### Community 38 - "interactive_tour.js"
Cohesion: 0.52
Nodes (6): endTour(), init(), injectStyles(), renderStep(), showWelcomeTourPrompt(), startTour()

### Community 39 - "setupAddCustomTaskModal"
Cohesion: 0.47
Nodes (6): computeNextTaskNumber(), openAddCustomTaskModal(), openModal(), setTaskModalCategory(), setupAddCustomTaskModal(), updateTaskAutoNumbering()

### Community 40 - "renderModalBody"
Cohesion: 0.40
Nodes (6): generateDefaultBacklog(), getActiveCoursesData(), getDegreeExamDates(), getPacingDebt(), renderModalBody(), toggleWatched()

### Community 41 - "ms_ac_exam.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 42 - "ms_ac_semester.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 43 - "ms_ac_tasks.json"
Cohesion: 0.33
Nodes (5): actions, body, $schema, type, version

### Community 44 - "modal_help.js"
Cohesion: 0.60
Nodes (5): init(), injectHelpStyles(), setupAllModalHelpTriggers(), setupTriggerForModal(), toggleHelpBanner()

### Community 45 - "new_features_validation_test.js"
Cohesion: 0.33
Nodes (4): ref_assert, assert, fs, path

### Community 46 - "sync_to_dist.js"
Cohesion: 0.40
Nodes (4): filesToCopy, fs, path, targetDirs

### Community 47 - "syncScheduleToCloudGist"
Cohesion: 0.67
Nodes (3): generateFullICSString(), syncScheduleToCloudGist(), triggerCloudGistSyncDebounced()

## Knowledge Gaps
- **185 isolated node(s):** `type`, `$schema`, `version`, `body`, `actions` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 244 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `ref_path` to `package.json`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `initPrereqChipsSearch()` connect `setupEventListeners` to `app.js`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `type`, `$schema`, `version` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `planner_module.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13063973063973064 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `sync_from_google_calendars.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08170731707317073 - nodes in this community are weakly interconnected._