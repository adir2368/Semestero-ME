// tests/verify_v2414_flask_gear.js
const http = require('http');
const fs = require('fs');
const path = require('path');

function fetch(url, isBinary = false) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    buffer,
                    body: isBinary ? null : buffer.toString('utf8')
                });
            });
        }).on('error', reject);
    });
}

async function verify() {
    console.log('================================================================');
    console.log('--- Verifying v2.4.14 Science Flask & Gear Notification Badge ---');
    console.log('================================================================\n');

    // 1. Check index.html
    const indexRes = await fetch('http://localhost:8080/index.html');
    if (indexRes.status !== 200) {
        throw new Error(`index.html returned ${indexRes.status}`);
    }
    console.log('✅ index.html served 200 OK');

    const indexChecks = [
        ['v2.4.14 system version', 'id="display-system-version">v2.4.14<'],
        ['v2.4.14 footer badge', 'v2.4.14 ✨'],
        ['v2.4.14 changelog entry', 'v2.4.14 (18/10/2026):'],
        ['v2.4.14 app.js query script', 'app.js?v=2.4.14'],
        ['v2.4.14 timetable query script', 'timetable_generator.js?v=2.4.14']
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
        ['v2.4.14 revision', 'REV-2026.10.18-v2.4.14'],
        ['v2.4.14 window version', 'window.APP_VERSION = "2.4.14"'],
        ['Notification badge default fallback', "options.badge = 'notification-badge.png'"],
        ['Notification badge in test notification', "badge: 'notification-badge.png'"]
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

    const swChecks = [
        ['CACHE_NAME is semestero-me-v2.4.14', "CACHE_NAME = 'semestero-me-v2.4.14'"],
        ['notification-badge.png in STATIC_ASSETS', "'./notification-badge.png'"],
        ['notification-badge-96.png in STATIC_ASSETS', "'./notification-badge-96.png'"],
        ['badge: notification-badge.png in push listener', "badge: 'notification-badge.png'"]
    ];

    for (const [name, str] of swChecks) {
        if (!swRes.body.includes(str)) {
            throw new Error(`Missing ${name} in sw.js!`);
        }
        console.log(`   ✓ Found ${name}`);
    }

    // 4. Check notification-badge.png and notification-badge-96.png
    console.log('\n✅ Checking notification badge assets over HTTP...');
    const badgeRes = await fetch('http://localhost:8080/notification-badge.png', true);
    if (badgeRes.status !== 200) {
        throw new Error(`notification-badge.png returned ${badgeRes.status}`);
    }
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    if (!badgeRes.buffer.slice(0, 8).equals(pngMagic)) {
        throw new Error('notification-badge.png is not a valid PNG file!');
    }
    console.log(`   ✓ notification-badge.png is valid PNG (${badgeRes.buffer.length} bytes)`);

    const badge96Res = await fetch('http://localhost:8080/notification-badge-96.png', true);
    if (badge96Res.status !== 200) {
        throw new Error(`notification-badge-96.png returned ${badge96Res.status}`);
    }
    if (!badge96Res.buffer.slice(0, 8).equals(pngMagic)) {
        throw new Error('notification-badge-96.png is not a valid PNG file!');
    }
    console.log(`   ✓ notification-badge-96.png is valid PNG (${badge96Res.buffer.length} bytes)`);

    // 5. Check package.json
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    if (pkg.version !== '2.4.14') {
        throw new Error(`package.json version is ${pkg.version}, expected 2.4.14`);
    }
    console.log('\n✅ package.json version is 2.4.14');

    console.log('\n================================================================');
    console.log('🎉 ALL LOCAL VERIFICATION CHECKS PASSED FOR v2.4.14!');
    console.log('================================================================');
}

verify().catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
