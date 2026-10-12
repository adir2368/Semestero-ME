# Graph Report - academic-skill-tree  (2026-10-07)

## Corpus Check
- 47 files · ~290,556 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 456 nodes · 1155 edges · 29 communities (21 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Degree Planner & Workload Visualizer
- Degree Planner & Workload Visualizer (Submodule 2)
- Degree Planner & Workload Visualizer (Submodule 3)
- Supabase Auth & Multi-Device Sync
- Supabase Auth & Multi-Device Sync (Submodule 2)
- Supabase Auth & Multi-Device Sync (Submodule 3)
- Calendar & Schedule Integration
- Prerequisite Flowchart & DAG Engine
- Calendar & Schedule Integration (Submodule 2)
- Prerequisite Flowchart & DAG Engine (Submodule 2)
- Supabase Auth & Multi-Device Sync (Submodule 4)
- Calendar & Schedule Integration (Submodule 3)
- Supabase Auth & Multi-Device Sync (Submodule 5)
- Electron Desktop Application
- Calendar & Schedule Integration (Submodule 4)
- Accessibility & Micro-Interactions
- Calendar & Schedule Integration (Submodule 5)
- Calendar & Schedule Integration (Submodule 6)
- Supabase Auth & Multi-Device Sync (Submodule 6)
- Calendar & Schedule Integration (Submodule 7)
- Supabase Auth & Multi-Device Sync (Submodule 7)
- Module 21 (ref https)
- Prerequisite Flowchart & DAG Engine (Submodule 3)
- PWA & Offline Service Worker

## God Nodes (most connected - your core abstractions)
1. `saveState()` - 34 edges
2. `notifyStateChanged()` - 34 edges
3. `showToastNotification()` - 32 edges
4. `openCourseDetails()` - 23 edges
5. `openTaskSidePeek()` - 20 edges
6. `bindDelegatedPlannerEvents()` - 19 edges
7. `recalculateCourseStates()` - 18 edges
8. `setupNotionDashboard()` - 18 edges
9. `renderNotionTasksTable()` - 18 edges
10. `renderUI()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `setupEventListeners()` --indirect_call--> `handleAddCourseSubmit()`  [INFERRED]
  app.js → app.js  _Bridges community 17 → community 8_
- `setupEventListeners()` --indirect_call--> `saveQuest()`  [INFERRED]
  app.js → app.js  _Bridges community 17 → community 15_
- `setupNotionDashboard()` --indirect_call--> `copyScheduleToGoogleTasks()`  [INFERRED]
  app.js → app.js  _Bridges community 14 → community 12_
- `setupNotionDashboard()` --indirect_call--> `openCalendarSyncModal()`  [INFERRED]
  app.js → app.js  _Bridges community 14 → community 2_
- `setupNotionDashboard()` --indirect_call--> `renderNotionTasksTable()`  [INFERRED]
  app.js → app.js  _Bridges community 14 → community 15_

## Import Cycles
- None detected.

## Communities (29 total, 8 thin omitted)

### Community 0 - "Degree Planner & Workload Visualizer"
Cohesion: 0.05
Nodes (38): { app, BrowserWindow, Menu, ipcMain }, path, author, description, devDependencies, electron, electron-packager, keywords (+30 more)

### Community 1 - "Degree Planner & Workload Visualizer (Submodule 2)"
Cohesion: 0.16
Nodes (43): bindDelegatedPlannerEvents(), buildCourseSemesterMap(), calculateCourseWorkload(), calculateSemesterWorkload(), calculateWhatIfGPA(), checkPrerequisites(), cycleCourseElectiveList(), escapeHtml() (+35 more)

### Community 2 - "Degree Planner & Workload Visualizer (Submodule 3)"
Cohesion: 0.06
Nodes (34): APP_CURRENT_REVISION, AUGUST_2026_PERSONAL_EVENTS, AUGUST_2026_SCHEDULE, CHEESEFORK_EXAM_DATES, CHEESEFORK_SEMESTER_SCHEDULE, CLOUD_GIST_SYNC, computeNextTaskNumber(), COURSE_NOTION_ICONS (+26 more)

### Community 3 - "Supabase Auth & Multi-Device Sync"
Cohesion: 0.08
Nodes (24): datetime, glob, json, os, pil, random, re, struct (+16 more)

### Community 4 - "Supabase Auth & Multi-Device Sync (Submodule 2)"
Cohesion: 0.19
Nodes (30): addXp(), completeAllTasks(), deleteCourse(), drawConnections(), gameState, getXpNeeded(), handleAddCourseSubmit(), importFromCheesefork() (+22 more)

### Community 5 - "Supabase Auth & Multi-Device Sync (Submodule 3)"
Cohesion: 0.22
Nodes (30): closeAuthModal(), deleteAccount(), finishOnboarding(), getActiveUser(), getUserStorageKey(), handleUserCloudRestore(), hasAdirLocalData(), init() (+22 more)

### Community 6 - "Calendar & Schedule Integration"
Cohesion: 0.15
Nodes (25): applyTimetableMobileFilter(), checkAndTrigger10MinReminders(), closeNotificationDrawer(), dispatchNativeMobileNotifications(), ensureNotificationPreferencesDefaults(), exportTimetableToCanvasPNG(), getActiveTimetableSchedule(), getLiveClassStatus() (+17 more)

### Community 7 - "Prerequisite Flowchart & DAG Engine"
Cohesion: 0.16
Nodes (18): autoUpdateTaskStatusesByDueDate(), clearFlowchartHighlight(), completeAllTasks(), deleteCourse(), getSemesterStats(), highlightFlowchartPath(), isWinterSemesterStarted(), loadSavedState() (+10 more)

### Community 8 - "Calendar & Schedule Integration (Submodule 2)"
Cohesion: 0.23
Nodes (19): completeTaskFromNotification(), createNewRevisionSnapshot(), deleteRevisionById(), editRevisionDetails(), ensureBaselineRevisions(), exportRevisionById(), handleAddCourseSubmit(), handleCreateTaskSubmit() (+11 more)

### Community 9 - "Prerequisite Flowchart & DAG Engine (Submodule 2)"
Cohesion: 0.15
Nodes (17): clearConstellationHighlight(), clearSemesterOrbitHighlight(), drawConnections(), exportSvgToPng(), fitFlowchartToWidth(), getCourseConstellationPosition(), highlightConstellationPath(), highlightSemesterOrbit() (+9 more)

### Community 10 - "Supabase Auth & Multi-Device Sync (Submodule 4)"
Cohesion: 0.30
Nodes (15): bindUI(), cleanTaskSummary(), closeModal(), fetchIcsFeed(), getStorageKey(), importFromFile(), init(), loadConfig() (+7 more)

### Community 11 - "Calendar & Schedule Integration (Submodule 3)"
Cohesion: 0.18
Nodes (15): closeCalendarDayModal(), getDegreeExamDates(), getHebrewDayOfWeek(), getTaskCategoryKey(), initCalendarDayModal(), openCalendarDayModal(), populateNotionCourseFilter(), renderDayModalEventsList() (+7 more)

### Community 12 - "Supabase Auth & Multi-Device Sync (Submodule 5)"
Cohesion: 0.22
Nodes (14): addCustomExamToBank(), autoScheduleCourseExams(), copyScheduleToGoogleTasks(), downloadICSFile(), exportScheduleToICS(), generateAllTermsList(), getExamStatusPill(), getSundayOfWeek() (+6 more)

### Community 13 - "Electron Desktop Application"
Cohesion: 0.14
Nodes (13): background_color, description, dir, display, icons, lang, name, orientation (+5 more)

### Community 14 - "Calendar & Schedule Integration (Submodule 4)"
Cohesion: 0.29
Nodes (13): addXp(), closeTaskSidePeek(), createCalendarDayCell(), handlePeekAddComment(), hideNotionStatusDropdown(), initGlobalNotionDropdown(), openTaskSidePeek(), renderPeekComments() (+5 more)

### Community 15 - "Accessibility & Micro-Interactions"
Cohesion: 0.22
Nodes (10): calculateTimeRemaining(), getActiveStatusFilters(), getCourseNotionIconHtml(), getTaskTypeBadgeHtml(), renderModalTaskList(), renderNotionTasksTable(), saveQuest(), setupNotionFilterPopover() (+2 more)

### Community 16 - "Calendar & Schedule Integration (Submodule 5)"
Cohesion: 0.36
Nodes (9): closeCourseIconPicker(), getDefaultCourseIconKey(), openCourseIconPicker(), renderIconPickerGrid(), renderIconPickerPalette(), resetCourseIcon(), saveCourseIcon(), setupNotionIconPickerEvents() (+1 more)

### Community 17 - "Calendar & Schedule Integration (Submodule 6)"
Cohesion: 0.32
Nodes (8): applyCheeseForkCourse(), ensureCheeseForkDatabase(), findCheeseForkCourse(), importFromCheesefork(), initCheeseForkDatabase(), parseDateToIso(), searchCheeseForkCourses(), setupEventListeners()

### Community 18 - "Supabase Auth & Multi-Device Sync (Submodule 6)"
Cohesion: 0.38
Nodes (7): performMoodleSync(), renderStudyRunway(), runMockMoodleSync(), saveState(), setupStudyRunway(), syncCheeseforkExamDates(), toggleRemindersBannerCollapse()

### Community 19 - "Calendar & Schedule Integration (Submodule 7)"
Cohesion: 0.53
Nodes (4): applyA11yClasses(), savePrefs(), setupEventListeners(), updateButtonStates()

### Community 20 - "Supabase Auth & Multi-Device Sync (Submodule 7)"
Cohesion: 0.33
Nodes (5): 👨‍💻 Author & Maintainer, 🖥️ Desktop Installation (Windows), ✨ Features, 🌐 Live Web & Mobile App (PWA), Semestero ME (v2.0.2) 🎓⚙️

## Knowledge Gaps
- **82 isolated node(s):** `COURSE_SHORT_NAMES`, `COURSE_NOTION_ICONS`, `NOTION_COLORS`, `NOTION_ICON_LIBRARY`, `INITIAL_STATE` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 124 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `openCourseDetails()` connect `Prerequisite Flowchart & DAG Engine` to `Degree Planner & Workload Visualizer (Submodule 3)`, `Calendar & Schedule Integration (Submodule 2)`, `Prerequisite Flowchart & DAG Engine (Submodule 2)`, `Calendar & Schedule Integration (Submodule 3)`, `Calendar & Schedule Integration (Submodule 4)`, `Accessibility & Micro-Interactions`, `Supabase Auth & Multi-Device Sync (Submodule 6)`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `showToastNotification()` connect `Calendar & Schedule Integration (Submodule 2)` to `Degree Planner & Workload Visualizer (Submodule 3)`, `Calendar & Schedule Integration`, `Prerequisite Flowchart & DAG Engine`, `Calendar & Schedule Integration (Submodule 3)`, `Supabase Auth & Multi-Device Sync (Submodule 5)`, `Calendar & Schedule Integration (Submodule 4)`, `Accessibility & Micro-Interactions`, `Calendar & Schedule Integration (Submodule 6)`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `COURSE_SHORT_NAMES`, `COURSE_NOTION_ICONS`, `NOTION_COLORS` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Degree Planner & Workload Visualizer` be split into smaller, more focused modules?**
  _Cohesion score 0.04625346901017576 - nodes in this community are weakly interconnected._
- **Should `Degree Planner & Workload Visualizer (Submodule 3)` be split into smaller, more focused modules?**
  _Cohesion score 0.05647840531561462 - nodes in this community are weakly interconnected._
- **Should `Supabase Auth & Multi-Device Sync` be split into smaller, more focused modules?**
  _Cohesion score 0.08170731707317073 - nodes in this community are weakly interconnected._
- **Should `Prerequisite Flowchart & DAG Engine (Submodule 2)` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._