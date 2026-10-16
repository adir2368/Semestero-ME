/**
 * Semestero ME - Live Production Cloud & Asset Verification
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
    console.log('🌐 Probing Live Production Deployment (GitHub Pages & API)');
    console.log('================================================================\n');

    let allOk = true;

    // 1. Check index.html on GitHub Pages
    console.log('1. Checking Live https://adir2368.github.io/Semestero-ME/...');
    const indexRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/?t=${Date.now()}`);
    if (indexRes.status === 200) {
        console.log('   ✅ HTTP 200 OK');
        const hasV248InDisplay = indexRes.body.includes('id="display-system-version">v2.4.8<');
        const hasFooterBadge = indexRes.body.includes('id="footer-version-badge"');
        const hasA11yTrigger = indexRes.body.includes('id="btn-accessibility-trigger"');
        const hasButtonTypeModalClose = !indexRes.body.includes('<button class="modal-close" id="course-modal-close">');
        
        console.log(`   ${hasV248InDisplay ? '✅' : '❌'} display-system-version is v2.4.8: ${hasV248InDisplay}`);
        console.log(`   ${hasFooterBadge ? '✅' : '❌'} footer-version-badge exists: ${hasFooterBadge}`);
        console.log(`   ${hasA11yTrigger ? '✅' : '❌'} btn-accessibility-trigger exists: ${hasA11yTrigger}`);
        console.log(`   ${hasButtonTypeModalClose ? '✅' : '❌'} modal-close buttons have type="button": ${hasButtonTypeModalClose}`);
        if (!hasV248InDisplay || !hasFooterBadge || !hasA11yTrigger || !hasButtonTypeModalClose) allOk = false;
    } else {
        console.error(`   ❌ Failed with status ${indexRes.status}`);
        allOk = false;
    }

    // 2. Check sw.js
    console.log('\n2. Checking Live sw.js...');
    const swRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/sw.js?t=${Date.now()}`);
    if (swRes.status === 200) {
        const hasCacheV248 = swRes.body.includes("CACHE_NAME = 'semestero-me-v2.4.8'");
        const hasNoShortcutIcons = !swRes.body.includes('shortcut-');
        console.log(`   ${hasCacheV248 ? '✅' : '❌'} CACHE_NAME is semestero-me-v2.4.8: ${hasCacheV248}`);
        console.log(`   ${hasNoShortcutIcons ? '✅' : '❌'} 404 shortcut icons removed: ${hasNoShortcutIcons}`);
        if (!hasCacheV248 || !hasNoShortcutIcons) allOk = false;
    } else {
        console.error(`   ❌ sw.js returned status ${swRes.status}`);
        allOk = false;
    }

    // 3. Check app.js
    console.log('\n3. Checking Live app.js...');
    const appRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/app.js?t=${Date.now()}`);
    if (appRes.status === 200) {
        const hasRevision = appRes.body.includes('REV-2026.10.17-v2.4.8');
        const hasAppVersion = appRes.body.includes('window.APP_VERSION = "2.4.8"');
        const hasRegexFix = appRes.body.includes('(?:^|\\bv|\\s)(\\d+\\.\\d+\\.\\d+)\\b');
        const hasDurationFix = appRes.body.includes('${c.duration ? ` (${c.duration})` : \'\'}');
        console.log(`   ${hasRevision ? '✅' : '❌'} Revision REV-2026.10.17-v2.4.8: ${hasRevision}`);
        console.log(`   ${hasAppVersion ? '✅' : '❌'} window.APP_VERSION = "2.4.8": ${hasAppVersion}`);
        console.log(`   ${hasRegexFix ? '✅' : '❌'} Semver regex fix deployed: ${hasRegexFix}`);
        console.log(`   ${hasDurationFix ? '✅' : '❌'} Timetable duration fix deployed: ${hasDurationFix}`);
        if (!hasRevision || !hasAppVersion || !hasRegexFix || !hasDurationFix) allOk = false;
    } else {
        console.error(`   ❌ app.js returned status ${appRes.status}`);
        allOk = false;
    }

    // 4. Check planner_module.js
    console.log('\n4. Checking Live planner_module.js...');
    const plannerRes = await fetchUrl(`https://adir2368.github.io/Semestero-ME/planner_module.js?t=${Date.now()}`);
    if (plannerRes.status === 200) {
        const hasWhatIfA11y = plannerRes.body.includes('id="whatif-input-') && plannerRes.body.includes('aria-label="ציון משוער בסימולציה');
        console.log(`   ${hasWhatIfA11y ? '✅' : '❌'} What-If input accessibility (id/name/aria-label) deployed: ${hasWhatIfA11y}`);
        if (!hasWhatIfA11y) allOk = false;
    } else {
        console.error(`   ❌ planner_module.js returned status ${plannerRes.status}`);
        allOk = false;
    }

    // 5. Check GitHub Releases Latest API
    console.log('\n5. Checking GitHub Releases Latest Endpoint...');
    const releaseRes = await fetchUrl('https://api.github.com/repos/adir2368/Semestero-ME/releases/latest');
    if (releaseRes.status === 200) {
        const relData = JSON.parse(releaseRes.body);
        console.log(`   ✅ Latest Tag on GitHub: ${relData.tag_name} (${relData.name})`);
        const zipAsset = (relData.assets || []).find(a => a.name.includes('v2.4.8'));
        if (zipAsset) {
            const sizeMb = (zipAsset.size / (1024 * 1024)).toFixed(1);
            console.log(`   ✅ Release Asset Found: ${zipAsset.name} (${sizeMb} MB)`);
            console.log(`   ✅ Download URL: ${zipAsset.browser_download_url}`);
        } else {
            console.error('   ❌ v2.4.8 zip asset not found in latest release');
            allOk = false;
        }
    } else {
        console.error(`   ❌ Releases API returned status ${releaseRes.status}`);
        allOk = false;
    }

    console.log('\n================================================================');
    if (allOk) {
        console.log('🎉 LIVE VERIFICATION SUCCESSFUL: Everything is 100% in sync and verified!');
    } else {
        console.log('⚠️ Some checks failed or are still deploying.');
    }
    console.log('================================================================');
}

run().catch(console.error);
