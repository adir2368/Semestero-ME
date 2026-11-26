const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const pkgVer = JSON.parse(read('package.json')).version;
const appJs = read('app.js');
const authJs = read('auth_sync.js');
const uiJs = read('ui_enhancements.js');
const tourJs = read('interactive_tour.js');
const a11yJs = read('accessibility.js');
const a11yCss = read('accessibility.css');
const helpJs = read('modal_help.js');
const siteJs = read('site_analytics.js');
const watchJs = read('watch_companion.js');
const preloadedJs = read('preloaded_user_state.js');
const indexHtml = read('index.html');
const watchHtml = read('watch.html');
const widgetsHtml = read('widgets.html');
const guideHtml = read('guide.html');
const notFoundHtml = read('404.html');
const llmsTxt = read('llms.txt');
const privacyMd = read('PRIVACY_POLICY.md');
const sitemapXml = read('sitemap.xml');
const stylesCss = read('styles.css');

console.log('🧪 Running Pass 6 Settings, Global Modals, Light Mode & Web Hardening Tests...');

// P6-1: Zero hardcoded personal Moodle token in shipped preloaded_user_state
assert.ok(!preloadedJs.includes('47ff4e9841a2293be4696691eeeafe5127137f5c'), 'P6-1: preloaded_user_state.js must not ship personal Moodle authtoken');
assert.ok(!preloadedJs.includes('userid=39495'), 'P6-1: preloaded_user_state.js must not ship personal Moodle userid');

// P6-2: Stored DOM XSS & quote-breaking onclick removal
assert.ok(!appJs.includes('window.PangeaHub.openQuickPeek(\'${pangeaUrl}\', \'${escapeHtml(course.name)}'), 'P6-2: Technion+ QuickBar must use delegated click handler');
assert.ok(appJs.includes('btn-tplus-pangea'), 'P6-2: Technion+ QuickBar must bind .btn-tplus-pangea listener');
assert.ok(appJs.includes('title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</span>'), 'P6-2: Questline renderModalTaskList must escape task.title');
assert.ok(appJs.includes('escapeHtml(task.title)') && !appJs.includes('onclick="if (typeof openCourseDetails === \'function\') openCourseDetails(\'${task.courseCode}\')'), 'P6-2: Notif Drawer must escape task fields and avoid inline onclick');
assert.ok(appJs.includes('Array.isArray(sanitized.revisions)') && appJs.includes('const safeRevName = escapeHtml(rev.name)'), 'P6-2: Imported revisions must be sanitized and escaped in Settings');
assert.ok(uiJs.includes('btn-faq-copy') && !uiJs.includes("item.content.replace(/'/g"), 'P6-2: Academic FAQ copy must use delegated click listener instead of literal-newline onclick');
assert.ok(!watchJs.includes('onclick="window.toggleWatchTask('), 'P6-2: watch_companion must delegate task clicks via data-task-id');
assert.ok(!widgetsHtml.includes('onclick="toggleTask('), 'P6-2: widgets.html must delegate task row clicks via data-task-id');

// P6-3: Watch companion toggleWatchTask safe storage key lookup
assert.ok(!/const stateKey = getStorageKey\(\);/.test(watchJs), 'P6-3: watch_companion must guard typeof window.getStorageKey === "function"');

// P6-4: Widget Adaptive Card routing, RTL flag & canonical URL
assert.ok(widgetsHtml.includes("urlParams.get('w')"), 'P6-4: widgets.html must honor ?w= Adaptive Card parameter');
assert.ok(!widgetsHtml.includes("viewParam.includes('s')"), 'P6-4: widgets.html must not misroute semester/tasks via includes("s")');
['widgets/ms_ac_exam.json', 'widgets/ms_ac_semester.json', 'widgets/ms_ac_tasks.json'].forEach((rel) => {
    const parsed = JSON.parse(read(rel));
    assert.strictEqual(parsed.rtl, true, `P6-4: ${rel} must declare "rtl": true`);
    const str = JSON.stringify(parsed);
    assert.ok(!str.includes('adir2368.github.io'), `P6-4: ${rel} must point to canonical domain, not adir2368.github.io`);
});

// P6-5: Runtime fixes (ModalHelp IDs, swipe wsMap, Miluim Tour, TipKit guard, site_analytics zeroes)
assert.ok(!uiJs.includes("setupTriggerForModal('command-palette-modal');\n        const input = document.getElementById('faq-search-input')"), 'P6-5: openFaqModal must target academic-faq-modal');
assert.ok(uiJs.includes("curriculum: 'curriculum-tree-workspace'") && uiJs.includes("tasks: 'notion-tasks-workspace'") && uiJs.includes("calendar: 'tasks-calendar-view-pane'"), 'P6-5: HorizontalTabSwipeManager wsMap must match real workspace IDs');
assert.ok(tourJs.includes('MiluimRightsAdvisor.openModal'), 'P6-5: interactive_tour must call MiluimRightsAdvisor.openModal()');
assert.ok(tourJs.includes('.modal-overlay.active'), 'P6-5: TipKit must guard against open .modal-overlay.active modals');
assert.ok(!siteJs.includes('|| 12;') && !siteJs.includes('|| 254;'), 'P6-5: site_analytics must not fake 0 stats with 12/18/142/254');

// P6-6: Non-blocking SemesteroDialog & removal of blocking native dialogs in Pass 6 flows
assert.ok(uiJs.includes('window.SemesteroDialog ='), 'P6-6: ui_enhancements.js must define non-blocking window.SemesteroDialog');
assert.ok(appJs.includes('window.confirmAndWipeLocalData ='), 'P6-6: app.js must define confirmAndWipeLocalData for Privacy Policy wipe');
assert.ok(!indexHtml.includes("onclick=\"if(confirm('האם אתה בטוח"), 'P6-6: #privacy-policy-modal must not use blocking confirm()');
assert.ok(!/alert\s*\(\s*msg\s*\)/.test(siteJs), 'P6-6: site_analytics must not call blocking alert()');
assert.ok(!widgetsHtml.includes('alert('), 'P6-6: widgets.html must use non-blocking toast instead of alert()');

// P6-7: ModalHelp coverage + header alignment
[
    'onboarding-wizard-modal', 'tutorial-hub-modal', 'academic-faq-modal', 'keyboard-shortcuts-modal',
    'modal-miluim-rights', 'bug-report-modal', 'direct-download-modal', 'smartscreen-guide-modal',
    'privacy-policy-modal', 'version-update-modal', 'accessibility-modal', 'task-move-modal',
    'modal-grade-sheet', 'command-palette-modal', 'notif-drawer-panel'
].forEach((id) => {
    assert.ok(helpJs.includes(`'${id}'`), `P6-7: modal_help.js must register '${id}'`);
});
assert.ok(stylesCss.includes('.modal-header-actions'), 'P6-7: styles.css must style .modal-header-actions to prevent close overlap');

// P6-8: Light Mode toggle + CSS & High Contrast coverage
assert.ok(indexHtml.includes('id="a11y-btn-light-mode"'), 'P6-8: #accessibility-modal must include Light Mode toggle');
assert.ok(a11yJs.includes("'a11y-btn-light-mode'") && a11yJs.includes("'a11y-light-mode'"), 'P6-8: accessibility.js must manage lightMode state');
assert.ok(a11yCss.includes('body.a11y-light-mode') && a11yCss.includes('body.a11y-high-contrast .settings-card'), 'P6-8: accessibility.css must define Light Mode and High-Contrast settings rules');

// P6-9 & P6-10: Watch square bezel, Onboarding close, Mobile Notif trigger, SEO/Legal & VersionCheck priority
assert.ok(watchHtml.includes('aspect-ratio: 1 / 1'), 'P6-9: watch.html bezel must remain 1:1 circular on narrow mobile');
assert.ok(indexHtml.includes('id="btn-close-onboarding-wizard"'), 'P6-9: #onboarding-wizard-modal must have a close button');
assert.ok(indexHtml.includes('id="btn-settings-open-notifications"'), 'P6-9: Settings must include Mobile notification drawer button');
assert.ok(watchHtml.includes(`watch_companion.js?v=${pkgVer}`), `P6-10: watch.html must match v${pkgVer}`);
assert.ok(widgetsHtml.includes(`manifest.json?v=${pkgVer}`), `P6-10: widgets.html must match v${pkgVer}`);
assert.ok(guideHtml.includes(`favicon.svg?v=${pkgVer}`), `P6-10: guide.html must match v${pkgVer}`);
assert.ok(notFoundHtml.includes(`favicon.svg?v=${pkgVer}`) && notFoundHtml.includes('100dvh'), `P6-10: 404.html must match v${pkgVer} and 100dvh`);
assert.ok(llmsTxt.includes(`v${pkgVer}`), `P6-10: llms.txt must match v${pkgVer}`);
assert.ok(privacyMd.includes('Supabase Auth') && !privacyMd.includes('Firebase'), 'P6-10: PRIVACY_POLICY.md must document Supabase Auth instead of Firebase');
assert.ok(sitemapXml.includes('watch.html') && sitemapXml.includes('widgets.html'), 'P6-10: sitemap.xml must list watch.html and widgets.html');

console.log('✅ All Pass 6 Settings, Global Modals, Light Mode & Web hardening assertions passed!');
