const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("🔍 Auditing Native Download & External URL Bridge...");

const mainActivityPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'MainActivity.java');
const mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');

assert(mainActivityContent.includes('setDownloadListener'), 'MainActivity must register setDownloadListener on WebView');
assert(mainActivityContent.includes('openExternalUrl'), 'SemesteroWidgetBridge must expose @JavascriptInterface openExternalUrl');
assert(mainActivityContent.includes('Intent.ACTION_VIEW'), 'Download listener and bridge must dispatch Intent.ACTION_VIEW');
console.log("  ✅ PASS: MainActivity registers setDownloadListener and exposes openExternalUrl");

const appJsPath = path.join(__dirname, '..', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

assert(appJsContent.includes('window.openExternalUrlOrBrowser'), 'app.js must define window.openExternalUrlOrBrowser');
assert(appJsContent.includes('!isNativeAndroid'), 'Auto-update reload loop must be guarded against native Android');
console.log("  ✅ PASS: app.js defines window.openExternalUrlOrBrowser and guards auto-update on native Android");

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

assert(indexHtmlContent.includes('openExternalUrlOrBrowser'), 'index.html update button must invoke openExternalUrlOrBrowser');
console.log("  ✅ PASS: index.html download buttons invoke openExternalUrlOrBrowser");

console.log("🎉 All Native Download Bridge checks PASSED 100%!\n");
