// tests/verify_v2412_device_separation.js
const http = require('http');
const fs = require('fs');

function fetch(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function verify() {
    console.log('--- Verifying v2.4.12 Device-Separation Locally (http://localhost:8080/) ---');

    // 1. Check index.html
    const indexRes = await fetch('http://localhost:8080/index.html');
    if (indexRes.status !== 200) {
        throw new Error(`index.html returned ${indexRes.status}`);
    }
    console.log('✅ index.html served 200 OK');

    const indexChecks = [
        ['btn-test-10min-text', 'id="btn-test-10min-text"'],
        ['btn-dispatch-text', 'id="btn-dispatch-text"'],
        ['drawer-device-icon', 'id="drawer-device-icon"'],
        ['drawer-device-title', 'id="drawer-device-title"'],
        ['drawer-desktop-badge', 'id="drawer-desktop-badge"'],
        ['drawer-device-hint', 'id="drawer-device-hint"'],
        ['v2.4.12 system version', 'id="display-system-version">v2.4.12<'],
        ['v2.4.12 footer badge', 'v2.4.12 ✨']
    ];

    for (const [name, str] of indexChecks) {
        if (!indexRes.body.includes(str)) {
            throw new Error(`Missing ${name} in index.html!`);
        }
        console.log(`   ✓ Found ${name}`);
    }

    // 2. Check app.js
    const appRes = await fetch('http://localhost:8080/app.js');
    if (appRes.status !== 200) {
        throw new Error(`app.js returned ${appRes.status}`);
    }
    console.log('\n✅ app.js served 200 OK');

    const appChecks = [
        ['updateNotificationDrawerDeviceMode', 'function updateNotificationDrawerDeviceMode('],
        ['Desktop mode text', '💻 סקירה למחשב'],
        ['Desktop 10min text', '⏰ בדיקת 10 דק׳ במחשב'],
        ['Desktop subtitle', '💻 תזכורות שולחן עבודה: 10 דק׳ לפני כל שיעור במחשב זה'],
        ['Desktop badge', 'פעיל במחשב זה ✓'],
        ['Mobile 10min text', '⏰ בדיקת 10 דק׳'],
        ['Mobile subtitle', '⏰ תזכורות אוטומטיות: 10 דק׳ לפני כל שיעור'],
        ['v2.4.12 revision', 'REV-2026.10.18-v2.4.12'],
        ['v2.4.12 window version', 'window.APP_VERSION = "2.4.12"']
    ];

    for (const [name, str] of appChecks) {
        if (!appRes.body.includes(str)) {
            throw new Error(`Missing ${name} in app.js!`);
        }
        console.log(`   ✓ Found ${name}`);
    }

    // 3. Check sw.js
    const swRes = await fetch('http://localhost:8080/sw.js');
    if (swRes.status !== 200) {
        throw new Error(`sw.js returned ${swRes.status}`);
    }
    console.log('\n✅ sw.js served 200 OK');
    if (!swRes.body.includes("CACHE_NAME = 'semestero-me-v2.4.12'")) {
        throw new Error("CACHE_NAME is not semestero-me-v2.4.12 in sw.js");
    }
    console.log('   ✓ CACHE_NAME is semestero-me-v2.4.12');

    // 4. Check styles.css
    const cssRes = await fetch('http://localhost:8080/styles.css');
    if (cssRes.status !== 200) {
        throw new Error(`styles.css returned ${cssRes.status}`);
    }
    console.log('\n✅ styles.css served 200 OK');
    if (!cssRes.body.includes('.drawer-desktop-badge')) {
        throw new Error("Missing .drawer-desktop-badge in styles.css");
    }
    console.log('   ✓ Found .drawer-desktop-badge in styles.css');

    console.log('\n================================================================');
    console.log('🎉 ALL LOCAL VERIFICATION CHECKS PASSED FOR v2.4.12!');
    console.log('================================================================');
}

verify().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
