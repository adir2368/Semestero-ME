/**
 * Semestero ME - Live Production Cloud & Asset Verification (v2.4.9)
 * Probes https://adir2368.github.io/Semestero-ME/ and GitHub API
 */

const https = require('https');

function fetchUrl(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Semestero-ME-Verifier',
                'Cache-Control': 'no-cache',
                ...headers
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers, body: data });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function run() {
    console.log('================================================================');
    console.log('🌐 Probing Live Production Deployment (GitHub Pages v2.4.13)');
    console.log('================================================================\n');

    let allOk = true;

    // 1. Check index.html on GitHub Pages
    console.log('1. Checking Live https://adir2368.github.io/Semestero-ME/...');
    const indexRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/?t=${Date.now()}`);
    if (indexRes.status === 200) {
        console.log('   ✅ HTTP 200 OK');
        const hasV2413InDisplay = indexRes.body.includes('id="display-system-version">v2.4.13<');
        const hasFooterBadge = indexRes.body.includes('id="footer-version-badge"');
        const hasTimetableGenBtn = indexRes.body.includes('id="btn-open-timetable-generator"');
        const hasTimetableGenModal = indexRes.body.includes('id="modal-timetable-generator"');
        const hasOrganitPills = indexRes.body.includes('id="organit-category-pills"');
        const hasTechnionPlusBar = indexRes.body.includes('id="modal-technion-plus-bar"');
        
        console.log(`   ${hasV2413InDisplay ? '✅' : '⏳'} display-system-version is v2.4.13: ${hasV2413InDisplay}`);
        console.log(`   ${hasFooterBadge ? '✅' : '❌'} footer-version-badge exists: ${hasFooterBadge}`);
        console.log(`   ${hasTimetableGenBtn ? '✅' : '⏳'} btn-open-timetable-generator exists: ${hasTimetableGenBtn}`);
        console.log(`   ${hasTimetableGenModal ? '✅' : '⏳'} modal-timetable-generator exists: ${hasTimetableGenModal}`);
        console.log(`   ${hasOrganitPills ? '✅' : '⏳'} organit-category-pills exists: ${hasOrganitPills}`);
        console.log(`   ${hasTechnionPlusBar ? '✅' : '⏳'} modal-technion-plus-bar exists: ${hasTechnionPlusBar}`);
        if (!hasV2413InDisplay || !hasTimetableGenBtn || !hasTimetableGenModal) allOk = false;
    } else {
        console.error(`   ❌ Failed with status ${indexRes.status}`);
        allOk = false;
    }

    // 2. Check sw.js
    console.log('\n2. Checking Live sw.js...');
    const swRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/sw.js?t=${Date.now()}`);
    if (swRes.status === 200) {
        const hasCacheV2413 = swRes.body.includes("CACHE_NAME = 'semestero-me-v2.4.13'");
        const hasTimetableInAssets = swRes.body.includes("'./timetable_generator.js'");
        const hasBadgeInAssets = swRes.body.includes("'./notification-badge.png'");
        console.log(`   ${hasCacheV2413 ? '✅' : '⏳'} CACHE_NAME is semestero-me-v2.4.13: ${hasCacheV2413}`);
        console.log(`   ${hasTimetableInAssets ? '✅' : '⏳'} timetable_generator.js in cache: ${hasTimetableInAssets}`);
        console.log(`   ${hasBadgeInAssets ? '✅' : '⏳'} notification-badge.png in cache: ${hasBadgeInAssets}`);
        if (!hasCacheV2413 || !hasTimetableInAssets || !hasBadgeInAssets) allOk = false;
    } else {
        console.error(`   ❌ sw.js returned status ${swRes.status}`);
        allOk = false;
    }

    // 3. Check timetable_generator.js
    console.log('\n3. Checking Live timetable_generator.js...');
    const ttRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/timetable_generator.js?t=${Date.now()}`);
    if (ttRes.status === 200) {
        const hasCatalog = ttRes.body.includes('TECH_COURSE_GROUPS_CATALOG');
        const hasCombinations = ttRes.body.includes('generateTimetableCombinations');
        const hasStudio = ttRes.body.includes('TimetableStudio');
        console.log(`   ${hasCatalog ? '✅' : '⏳'} TECH_COURSE_GROUPS_CATALOG deployed: ${hasCatalog}`);
        console.log(`   ${hasCombinations ? '✅' : '⏳'} generateTimetableCombinations deployed: ${hasCombinations}`);
        console.log(`   ${hasStudio ? '✅' : '⏳'} TimetableStudio UI controller deployed: ${hasStudio}`);
        if (!hasCatalog || !hasCombinations || !hasStudio) allOk = false;
    } else {
        console.error(`   ❌ timetable_generator.js returned status ${ttRes.status}`);
        allOk = false;
    }

    // 4. Check app.js
    console.log('\n4. Checking Live app.js...');
    const appRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/app.js?t=${Date.now()}`);
    if (appRes.status === 200) {
        const hasRevision = appRes.body.includes('REV-2026.10.18-v2.4.13');
        const hasAppVersion = appRes.body.includes('window.APP_VERSION = "2.4.13"');
        const hasBadgeLogic = appRes.body.includes("badge: 'notification-badge.png'");
        console.log(`   ${hasRevision ? '✅' : '⏳'} Revision REV-2026.10.18-v2.4.13: ${hasRevision}`);
        console.log(`   ${hasAppVersion ? '✅' : '⏳'} window.APP_VERSION = "2.4.13": ${hasAppVersion}`);
        console.log(`   ${hasBadgeLogic ? '✅' : '⏳'} Notification badge logic deployed: ${hasBadgeLogic}`);
        if (!hasRevision || !hasAppVersion || !hasBadgeLogic) allOk = false;
    } else {
        console.error(`   ❌ app.js returned status ${appRes.status}`);
        allOk = false;
    }

    // 5. Check notification-badge.png asset
    console.log('\n5. Checking Live notification-badge.png asset...');
    const badgeRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/notification-badge.png?t=${Date.now()}`);
    if (badgeRes.status === 200) {
        console.log('   ✅ notification-badge.png deployed (HTTP 200)');
    } else {
        console.log(`   ⏳ notification-badge.png returned status ${badgeRes.status}`);
        allOk = false;
    }

    // 6. Check styles.css
    console.log('\n6. Checking Live styles.css...');
    const stylesRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/styles.css?t=${Date.now()}`);
    if (stylesRes.status === 200) {
        const hasTtgPreviewGrid = stylesRes.body.includes('.ttg-preview-grid');
        const hasTtgOptPill = stylesRes.body.includes('.ttg-opt-pill');
        const hasOrganitPills = stylesRes.body.includes('.organit-pill');
        console.log(`   ${hasTtgPreviewGrid ? '✅' : '⏳'} Timetable grid styles deployed: ${hasTtgPreviewGrid}`);
        console.log(`   ${hasTtgOptPill ? '✅' : '⏳'} Options pills styles deployed: ${hasTtgOptPill}`);
        console.log(`   ${hasOrganitPills ? '✅' : '⏳'} Organit pills styles deployed: ${hasOrganitPills}`);
        if (!hasTtgPreviewGrid || !hasTtgOptPill || !hasOrganitPills) allOk = false;
    } else {
        console.error(`   ❌ styles.css returned status ${stylesRes.status}`);
        allOk = false;
    }

    console.log('\n================================================================');
    if (allOk) {
        console.log('🎉 LIVE VERIFICATION SUCCESSFUL: v2.4.13 is live on GitHub Pages with Mechanical Gear Notification Badge!');
    } else {
        console.log('⏳ Deployment in progress or caching on CDN. Re-run in a few seconds.');
    }
    console.log('================================================================');
    return allOk;
}

run().catch(console.error);
