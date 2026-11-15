const fs = require('fs');
const assert = require('assert');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');

console.log('Running v2.13.10 UI Cleanup Regression Checks...');

// 1. Sidebar panels ("משימות פעילות" & "סנכרון מודל") removed from Flowchart sidebar
assert.ok(!html.includes('id="active-quests-list"'), 'index.html must not contain #active-quests-list sidebar panel');
assert.ok(!html.includes('class="sidebar-section moodle-sync"'), 'index.html must not contain sidebar moodle-sync panel');
assert.ok(appJs.includes('if (!list) return;'), 'renderActiveQuestsSidebar must guard against missing #active-quests-list');

// 2. Scrollbar cleanup: zero-arrow webkit rules + hidden scrollbars on Flowchart/Sidebar panes
assert.ok(!css.includes('--color-scrollbar-track: #0b0d14;\r\n    /* Cool Ink thumb'), 'Old blocking @supports scrollbar override must be removed');
assert.ok(css.includes('*::-webkit-scrollbar-button'), 'styles.css must hide webkit scrollbar stepper buttons');
assert.ok(css.includes('.flowchart-scroll-wrapper::-webkit-scrollbar'), 'styles.css must hide .flowchart-scroll-wrapper scrollbar');
assert.ok(css.includes('.hud-sidebar::-webkit-scrollbar'), 'styles.css must hide .hud-sidebar scrollbar');

// 3. Flowchart bottleneck badge removed
assert.ok(!appJs.includes('fc-node-bottleneck-pill'), 'app.js must not render fc-node-bottleneck-pill on Flowchart course nodes');

// 4. Tasks table: left-aligned action wrapper + seamless date trigger without 24px clipped input
assert.ok(appJs.includes('class="notion-title-actions"'), 'app.js must group task link pills and Peek button inside .notion-title-actions');
assert.ok(appJs.includes('class="notion-title-main"'), 'app.js must wrap task title inside .notion-title-main');
assert.ok(!appJs.includes('width: 24px; padding: 2px; border: none;'), 'app.js must not render clipped 24px inline date input next to date text');
assert.ok(appJs.includes('dateInput.showPicker'), 'app.js must open hidden date picker when date cell is clicked');
assert.ok(css.includes('.notion-title-actions') && css.includes('margin-inline-start: auto;'), 'styles.css must flush-align .notion-title-actions to the left in RTL');

console.log('✅ ALL v2.13.10 UI CLEANUP REGRESSION CHECKS PASSED!');
