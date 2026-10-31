/**
 * Verification test for Technion Classification Exams (בחינות סיווג), Degree Planner Interactive Restore, and v2.9.0 Release
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('🧪 VERIFYING TECHNION CLASSIFICATION EXAMS & V2.9.0 RELEASE');
console.log('========================================================================\n');

// 1. Verify Version Consistency across all manifests
console.log('1. Checking version consistency across files...');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const currentVersion = pkg.version;
assert.strictEqual(currentVersion, '2.9.0', 'package.json version must be 2.9.0');

const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
assert.ok(appJs.includes(`version: "${currentVersion}"`), 'app.js APP_CURRENT_REVISION must match current version');

const swJs = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
assert.ok(swJs.includes(`CACHE_NAME = 'semestero-me-v${currentVersion}'`), 'sw.js CACHE_NAME must match current version');

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert.ok(indexHtml.includes(`id="display-system-version">v${currentVersion}<`), 'index.html display-system-version must match current version');
assert.ok(indexHtml.includes(`גרסה אחרונה v${currentVersion}`), 'index.html whats-new badge must match current version');
assert.ok(indexHtml.includes(`id="footer-version-badge" title="לחץ לבדיקת עדכונים ורענון המערכת (v${currentVersion})"`), 'index.html footer-version-badge must match current version');
assert.ok(indexHtml.includes(`v${currentVersion} (31/10/2026):</strong>`), 'index.html changelog must list current version');

const appGradle = fs.readFileSync(path.join(rootDir, 'android/app/build.gradle'), 'utf8');
assert.ok(appGradle.includes(`versionName "${currentVersion}"`), 'android app build.gradle versionName must match current version');
assert.ok(appGradle.includes('versionCode 46'), 'android app build.gradle versionCode must be 46');

const wearGradle = fs.readFileSync(path.join(rootDir, 'android/wear/build.gradle'), 'utf8');
assert.ok(wearGradle.includes(`versionName "${currentVersion}"`), 'android wear build.gradle versionName must match current version');
assert.ok(wearGradle.includes('versionCode 46'), 'android wear build.gradle versionCode must be 46');
console.log(`   ✓ All version definitions strictly match v${currentVersion} and build code 46.\n`);

// 2. Verify HTML Structure for Classification Exams and Collapsible Card
console.log('2. Checking HTML structure for classification exams and collapsible toggle...');
assert.ok(indexHtml.includes('planner-classification-card'), 'index.html must have planner-classification-card');
assert.ok(indexHtml.includes('id="planner-classification-header"'), 'index.html must have planner-classification-header');
assert.ok(indexHtml.includes('id="btn-toggle-classification-card"'), 'index.html must have btn-toggle-classification-card');
assert.ok(indexHtml.includes('id="planner-classification-body"'), 'index.html must have planner-classification-body');
assert.ok(indexHtml.includes('id="select-classification-mechanics"'), 'index.html must have select-classification-mechanics');
assert.ok(indexHtml.includes('id="select-classification-electricity"'), 'index.html must have select-classification-electricity');
assert.ok(indexHtml.includes('id="select-classification-math"'), 'index.html must have select-classification-math');
assert.ok(indexHtml.includes('id="planner-classification-badge"'), 'index.html must have planner-classification-badge');
assert.ok(indexHtml.includes('id="modal-classification-exam-container"'), 'index.html must have modal-classification-exam-container in course modal');
console.log('   ✓ DOM IDs and collapsible containers for classification exams verified.\n');

// 3. Verify JavaScript logic in app.js and planner_module.js
console.log('3. Checking JavaScript functions for classification exams and interactive restore...');
assert.ok(appJs.includes('function getClassificationExamStatus'), 'app.js must define getClassificationExamStatus');
assert.ok(appJs.includes('function setClassificationExamStatus'), 'app.js must define setClassificationExamStatus');
assert.ok(appJs.includes('function updateClassificationExamsUI'), 'app.js must define updateClassificationExamsUI');
assert.ok(appJs.includes('window.getClassificationExamStatus = getClassificationExamStatus'), 'app.js must expose getClassificationExamStatus on window');
assert.ok(appJs.includes('window.setClassificationExamStatus = setClassificationExamStatus'), 'app.js must expose setClassificationExamStatus on window');

const plannerJs = fs.readFileSync(path.join(rootDir, 'planner_module.js'), 'utf8');
assert.ok(plannerJs.includes('updateClassificationExamsUI()'), 'planner_module.js must call updateClassificationExamsUI');
assert.ok(plannerJs.includes('select-classification-'), 'planner_module.js must bind select-classification listeners');
assert.ok(plannerJs.includes('btn-toggle-classification-card'), 'planner_module.js must bind collapsible toggle');
assert.ok(plannerJs.includes('unremoveCourseFromGameState'), 'planner_module.js must define unremoveCourseFromGameState');
assert.ok(plannerJs.includes('getExactCourseCodes'), 'planner_module.js must isolate exact course codes in isPurgedCourse');
assert.ok(plannerJs.includes('promptAddCourseToSemester(code)'), 'planner_module.js must prompt semester picker on restore button click');
console.log('   ✓ JavaScript handlers and interactive restore verified.\n');

console.log('========================================================================');
console.log('✅ ALL CLASSIFICATION EXAMS & RELEASE TESTS PASSED (3/3 SUITES)!');
console.log('========================================================================');
