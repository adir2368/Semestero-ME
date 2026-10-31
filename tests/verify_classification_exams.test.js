/**
 * Verification test for Technion Classification Exams (בחינות סיווג) and v2.8.9 Release
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('========================================================================');
console.log('🧪 VERIFYING TECHNION CLASSIFICATION EXAMS & V2.8.9 RELEASE');
console.log('========================================================================\n');

// 1. Verify Version Consistency across all manifests
console.log('1. Checking version consistency across files...');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
assert.strictEqual(pkg.version, '2.8.9', 'package.json version must be 2.8.9');

const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
assert.ok(appJs.includes('version: "2.8.9"'), 'app.js APP_CURRENT_REVISION must be 2.8.9');

const swJs = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
assert.ok(swJs.includes("CACHE_NAME = 'semestero-me-v2.8.9'"), 'sw.js CACHE_NAME must be v2.8.9');

const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
assert.ok(indexHtml.includes('id="display-system-version">v2.8.9<'), 'index.html display-system-version must be v2.8.9');
assert.ok(indexHtml.includes('גרסה אחרונה v2.8.9'), 'index.html whats-new badge must be v2.8.9');
assert.ok(indexHtml.includes('id="footer-version-badge" title="לחץ לבדיקת עדכונים ורענון המערכת (v2.8.9)"'), 'index.html footer-version-badge must be v2.8.9');
assert.ok(indexHtml.includes('v2.8.9 (31/10/2026):</strong> תמיכה מלאה בבחינות סיווג טכניוניות'), 'index.html changelog must list v2.8.9');

const appGradle = fs.readFileSync(path.join(rootDir, 'android/app/build.gradle'), 'utf8');
assert.ok(appGradle.includes('versionName "2.8.9"'), 'android app build.gradle versionName must be 2.8.9');
assert.ok(appGradle.includes('versionCode 45'), 'android app build.gradle versionCode must be 45');

const wearGradle = fs.readFileSync(path.join(rootDir, 'android/wear/build.gradle'), 'utf8');
assert.ok(wearGradle.includes('versionName "2.8.9"'), 'android wear build.gradle versionName must be 2.8.9');
assert.ok(wearGradle.includes('versionCode 45'), 'android wear build.gradle versionCode must be 45');
console.log('   ✓ All version definitions strictly match v2.8.9 and build code 45.\n');

// 2. Verify HTML Structure for Classification Exams
console.log('2. Checking HTML structure for classification exams in sidebar and course modal...');
assert.ok(indexHtml.includes('planner-classification-card'), 'index.html must have planner-classification-card');
assert.ok(indexHtml.includes('id="select-classification-mechanics"'), 'index.html must have select-classification-mechanics');
assert.ok(indexHtml.includes('id="select-classification-electricity"'), 'index.html must have select-classification-electricity');
assert.ok(indexHtml.includes('id="select-classification-math"'), 'index.html must have select-classification-math');
assert.ok(indexHtml.includes('id="planner-classification-badge"'), 'index.html must have planner-classification-badge');
assert.ok(indexHtml.includes('id="modal-classification-exam-container"'), 'index.html must have modal-classification-exam-container in course modal');
console.log('   ✓ DOM IDs and containers for classification exams verified.\n');

// 3. Verify JavaScript logic in app.js and planner_module.js
console.log('3. Checking JavaScript functions for classification exams...');
assert.ok(appJs.includes('function getClassificationExamStatus'), 'app.js must define getClassificationExamStatus');
assert.ok(appJs.includes('function setClassificationExamStatus'), 'app.js must define setClassificationExamStatus');
assert.ok(appJs.includes('function updateClassificationExamsUI'), 'app.js must define updateClassificationExamsUI');
assert.ok(appJs.includes('window.getClassificationExamStatus = getClassificationExamStatus'), 'app.js must expose getClassificationExamStatus on window');
assert.ok(appJs.includes('window.setClassificationExamStatus = setClassificationExamStatus'), 'app.js must expose setClassificationExamStatus on window');

const plannerJs = fs.readFileSync(path.join(rootDir, 'planner_module.js'), 'utf8');
assert.ok(plannerJs.includes('updateClassificationExamsUI()'), 'planner_module.js must call updateClassificationExamsUI');
assert.ok(plannerJs.includes('select-classification-'), 'planner_module.js must bind select-classification listeners');
console.log('   ✓ JavaScript handlers and public API verified.\n');

console.log('========================================================================');
console.log('✅ ALL CLASSIFICATION EXAMS & RELEASE TESTS PASSED (3/3 SUITES)!');
console.log('========================================================================');
