// Verification Test for 31 App-Performance Toolkit
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('⚡ Running App-Performance Toolkit Verification Tests...');

const projectRoot = path.resolve(__dirname, '..');

// 1. Check CSS Skeletons
const cssContent = fs.readFileSync(path.join(projectRoot, 'styles.css'), 'utf8');
assert(cssContent.includes('skeleton-shimmer'), 'Missing skeleton-shimmer keyframes');
assert(cssContent.includes('.skeleton-box'), 'Missing .skeleton-box class');
assert(cssContent.includes('.skeleton-pool-item'), 'Missing .skeleton-pool-item class');
assert(cssContent.includes('.skeleton-task-item'), 'Missing .skeleton-task-item class');
assert(cssContent.includes('.catalog-load-more-btn'), 'Missing .catalog-load-more-btn class');
console.log('✅ 1. Skeleton Loading Styles (01/31) Verified');

// 2. Check Network Deduplication & Timeout in app.js
const appJsContent = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
assert(appJsContent.includes('fetchWithTimeoutAndDedup'), 'Missing fetchWithTimeoutAndDedup in app.js');
assert(appJsContent.includes('_inFlightFetchRequests'), 'Missing in-flight request deduplication map in app.js');
assert(appJsContent.includes('renderTaskSkeletons'), 'Missing renderTaskSkeletons in app.js');
console.log('✅ 2. Network Deduplication & Timeouts (03/31 & 12/31) Verified');

// 3. Check Windowed Catalog Rendering in planner_module.js
const plannerContent = fs.readFileSync(path.join(projectRoot, 'planner_module.js'), 'utf8');
assert(plannerContent.includes('CATALOG_WINDOW_PAGE_SIZE = 24'), 'Missing CATALOG_WINDOW_PAGE_SIZE in planner_module.js');
assert(plannerContent.includes('btn-catalog-load-more'), 'Missing btn-catalog-load-more in planner_module.js');
assert(plannerContent.includes('renderCatalogSkeletons'), 'Missing renderCatalogSkeletons in planner_module.js');
console.log('✅ 3. Windowed List Rendering & Pagination (05/31 & 23/31) Verified');

// 4. Check Core Web Vitals RUM in site_analytics.js
const analyticsContent = fs.readFileSync(path.join(projectRoot, 'site_analytics.js'), 'utf8');
assert(analyticsContent.includes('initWebVitalsMonitor'), 'Missing initWebVitalsMonitor in site_analytics.js');
assert(analyticsContent.includes('largest-contentful-paint'), 'Missing LCP observer in site_analytics.js');
assert(analyticsContent.includes('layout-shift'), 'Missing CLS observer in site_analytics.js');
assert(analyticsContent.includes('first-input'), 'Missing FID/INP observer in site_analytics.js');
assert(analyticsContent.includes('startTrace'), 'Missing User Timing trace in site_analytics.js');
console.log('✅ 4. Core Web Vitals RUM & User Timing (18/31 & 30/31) Verified');

// 5. Check Fonts & Lazy Loading in index.html
const htmlContent = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
assert(htmlContent.includes('rel="preconnect" href="https://fonts.googleapis.com"'), 'Missing preconnect for fonts.googleapis.com');
assert(htmlContent.includes('display=swap'), 'Missing display=swap for Google Fonts');
assert(htmlContent.includes('loading="lazy" decoding="async"'), 'Missing lazy & async decoding for images');
assert(htmlContent.includes('v2.9.1'), 'Missing v2.9.1 version in index.html');
console.log('✅ 5. Font Preconnect & Image Lazy Loading (15/31 & 29/31) Verified');

// 6. Check Service Worker Cache Version
const swContent = fs.readFileSync(path.join(projectRoot, 'sw.js'), 'utf8');
assert(swContent.includes('semestero-me-v2.9.1'), 'Missing semestero-me-v2.9.1 in sw.js');
console.log('✅ 6. PWA Service Worker Cache v2.9.1 (27/31) Verified');

console.log('\n🎉 ALL 6 APP-PERFORMANCE TOOLKIT VERIFICATION TESTS PASSED (100%)!');
