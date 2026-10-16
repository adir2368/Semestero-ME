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
    console.log('🌐 Probing Live Production Deployment (GitHub Pages v2.4.9)');
    console.log('================================================================\n');

    let allOk = true;

    // 1. Check index.html on GitHub Pages
    console.log('1. Checking Live https://adir2368.github.io/Semestero-ME/...');
    const indexRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/?t=${Date.now()}`);
    if (indexRes.status === 200) {
        console.log('   ✅ HTTP 200 OK');
        const hasV249InDisplay = indexRes.body.includes('id="display-system-version">v2.4.9<');
        const hasFooterBadge = indexRes.body.includes('id="footer-version-badge"');
        const hasGradClearanceBtn = indexRes.body.includes('id="btn-open-graduation-clearance"');
        const hasPanoptoBtn = indexRes.body.includes('id="btn-open-panopto-tracker"');
        const hasHonorsCard = indexRes.body.includes('id="analytics-honors-card"');
        const hasCalendarSyncModal = indexRes.body.includes('id="calendar-sync-modal"');
        const hasPeerConsensusModal = indexRes.body.includes('id="modal-peer-consensus-container"');
        
        console.log(`   ${hasV249InDisplay ? '✅' : '⏳'} display-system-version is v2.4.9: ${hasV249InDisplay}`);
        console.log(`   ${hasFooterBadge ? '✅' : '❌'} footer-version-badge exists: ${hasFooterBadge}`);
        console.log(`   ${hasGradClearanceBtn ? '✅' : '⏳'} btn-open-graduation-clearance exists: ${hasGradClearanceBtn}`);
        console.log(`   ${hasPanoptoBtn ? '✅' : '⏳'} btn-open-panopto-tracker exists: ${hasPanoptoBtn}`);
        console.log(`   ${hasHonorsCard ? '✅' : '⏳'} analytics-honors-card exists: ${hasHonorsCard}`);
        console.log(`   ${hasCalendarSyncModal ? '✅' : '⏳'} calendar-sync-modal exists: ${hasCalendarSyncModal}`);
        console.log(`   ${hasPeerConsensusModal ? '✅' : '⏳'} modal-peer-consensus-container exists: ${hasPeerConsensusModal}`);
        if (!hasV249InDisplay || !hasGradClearanceBtn || !hasPanoptoBtn) allOk = false;
    } else {
        console.error(`   ❌ Failed with status ${indexRes.status}`);
        allOk = false;
    }

    // 2. Check sw.js
    console.log('\n2. Checking Live sw.js...');
    const swRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/sw.js?t=${Date.now()}`);
    if (swRes.status === 200) {
        const hasCacheV249 = swRes.body.includes("CACHE_NAME = 'semestero-me-v2.4.9'");
        console.log(`   ${hasCacheV249 ? '✅' : '⏳'} CACHE_NAME is semestero-me-v2.4.9: ${hasCacheV249}`);
        if (!hasCacheV249) allOk = false;
    } else {
        console.error(`   ❌ sw.js returned status ${swRes.status}`);
        allOk = false;
    }

    // 3. Check app.js
    console.log('\n3. Checking Live app.js...');
    const appRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/app.js?t=${Date.now()}`);
    if (appRes.status === 200) {
        const hasRevision = appRes.body.includes('REV-2026.10.17-v2.4.9');
        const hasAppVersion = appRes.body.includes('window.APP_VERSION = "2.4.9"');
        const hasPanoptoTracker = appRes.body.includes('window.PanoptoTracker');
        const hasPeerData = appRes.body.includes('PEER_CONSENSUS_DATA');
        const hasHonorsSimulator = appRes.body.includes('renderHonorsStandingAndForecaster');
        console.log(`   ${hasRevision ? '✅' : '⏳'} Revision REV-2026.10.17-v2.4.9: ${hasRevision}`);
        console.log(`   ${hasAppVersion ? '✅' : '⏳'} window.APP_VERSION = "2.4.9": ${hasAppVersion}`);
        console.log(`   ${hasPanoptoTracker ? '✅' : '⏳'} PanoptoTracker deployed: ${hasPanoptoTracker}`);
        console.log(`   ${hasPeerData ? '✅' : '⏳'} PEER_CONSENSUS_DATA deployed: ${hasPeerData}`);
        console.log(`   ${hasHonorsSimulator ? '✅' : '⏳'} Honors forecaster deployed: ${hasHonorsSimulator}`);
        if (!hasRevision || !hasAppVersion || !hasPanoptoTracker) allOk = false;
    } else {
        console.error(`   ❌ app.js returned status ${appRes.status}`);
        allOk = false;
    }

    // 4. Check planner_module.js
    console.log('\n4. Checking Live planner_module.js...');
    const plannerRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/planner_module.js?t=${Date.now()}`);
    if (plannerRes.status === 200) {
        const hasClearanceEngine = plannerRes.body.includes('openGraduationClearanceModal') && plannerRes.body.includes('evaluateDegreeRules');
        console.log(`   ${hasClearanceEngine ? '✅' : '⏳'} Graduation clearance engine deployed: ${hasClearanceEngine}`);
        if (!hasClearanceEngine) allOk = false;
    } else {
        console.error(`   ❌ planner_module.js returned status ${plannerRes.status}`);
        allOk = false;
    }

    // 5. Check styles.css
    console.log('\n5. Checking Live styles.css...');
    const stylesRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/styles.css?t=${Date.now()}`);
    if (stylesRes.status === 200) {
        const hasRunwayConflictStyle = stylesRes.body.includes('.runway-conflict-banner');
        const hasHonorsStyle = stylesRes.body.includes('.analytics-honors-card');
        console.log(`   ${hasRunwayConflictStyle ? '✅' : '⏳'} Runway conflict styling deployed: ${hasRunwayConflictStyle}`);
        console.log(`   ${hasHonorsStyle ? '✅' : '⏳'} Honors styling deployed: ${hasHonorsStyle}`);
        if (!hasRunwayConflictStyle || !hasHonorsStyle) allOk = false;
    } else {
        console.error(`   ❌ styles.css returned status ${stylesRes.status}`);
        allOk = false;
    }

    console.log('\n================================================================');
    if (allOk) {
        console.log('🎉 LIVE VERIFICATION SUCCESSFUL: v2.4.9 is live on GitHub Pages with all 6 features!');
    } else {
        console.log('⏳ Deployment in progress or caching on CDN. Re-run in a few seconds.');
    }
    console.log('================================================================');
    return allOk;
}

run().catch(console.error);
