/**
 * Semestero ME - Comprehensive External Links Validator
 * Probes all external resources, APIs, and documentation links found across the application.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const FILES_TO_SCAN = [
    'index.html',
    'app.js',
    'curriculum_template.js',
    'planner_catalog.js',
    'planner_module.js',
    'moodle_sync.js',
    'auth_sync.js',
    'site_analytics.js',
    'technion_academic_calendar.js'
];

function extractUrls() {
    const found = new Set();
    const urlPattern = /https?:\/\/[a-zA-Z0-9\-\._~:\/\?#\[\]@!$&'\(\)\*\+,;=%]+/g;

    FILES_TO_SCAN.forEach(file => {
        const fullPath = path.resolve(__dirname, '..', file);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            let match;
            while ((match = urlPattern.exec(content)) !== null) {
                let url = match[0].replace(/[;,\."'>\)]+$/, '');
                // Skip XML namespaces, local schemas, localhost, placeholder strings
                if (
                    url.includes('www.w3.org') ||
                    url.includes('schema.org') ||
                    url.includes('localhost') ||
                    url.includes('127.0.0.1') ||
                    url.includes('${') ||
                    url.includes('example.com')
                ) {
                    continue;
                }
                found.add(url);
            }
        }
    });

    // Add sample URLs for dynamic course generators
    found.add('https://cheesefork.cf/');
    found.add('https://cheesefork.cf/course/034035');
    found.add('https://moodle25.technion.ac.il/');
    found.add('https://moodle25.technion.ac.il/calendar/view.php');
    found.add('https://raw.githubusercontent.com/adir2368/Semestero-ME/main/package.json');
    found.add('https://api.github.com/repos/adir2368/Semestero-ME/releases/latest');

    return Array.from(found);
}

function probeUrl(targetUrl) {
    return new Promise((resolve) => {
        let parsed;
        try {
            parsed = new URL(targetUrl);
        } catch (e) {
            return resolve({ url: targetUrl, ok: false, status: 'INVALID_URL', error: e.message });
        }

        const client = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            },
            timeout: 8000
        };

        const startTime = Date.now();
        const req = client.request(options, (res) => {
            const latency = Date.now() - startTime;
            // Drain data to free socket
            res.on('data', () => {});
            res.on('end', () => {
                const status = res.statusCode;
                // 2xx, 3xx are valid/working; 403/401 can be Technion SSO or auth-gated but live
                const isLive = status >= 200 && status < 400;
                const isAuthGated = status === 401 || status === 403;
                resolve({
                    url: targetUrl,
                    status,
                    latency,
                    ok: isLive || isAuthGated,
                    authGated: isAuthGated,
                    redirectLocation: res.headers.location || null
                });
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ url: targetUrl, ok: false, status: 'TIMEOUT', error: 'Request timed out after 8s' });
        });

        req.on('error', (err) => {
            resolve({ url: targetUrl, ok: false, status: 'ERROR', error: err.message });
        });

        req.end();
    });
}

async function main() {
    console.log('================================================================');
    console.log('🔗 Scanning & Validating All External Resources Across Codebase');
    console.log('================================================================\n');

    const urls = extractUrls();
    console.log(`Discovered ${urls.length} unique external endpoints to test.\n`);

    const results = [];
    // Concurrency limit of 5 to avoid socket throttling
    const CONCURRENCY = 5;
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
        const batch = urls.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(batch.map(probeUrl));
        results.push(...batchResults);
    }

    let passCount = 0;
    let authCount = 0;
    let failCount = 0;

    console.log('----------------------------------------------------------------');
    console.log('Audit Results:');
    console.log('----------------------------------------------------------------');

    results.forEach(r => {
        if (r.ok) {
            if (r.authGated) {
                authCount++;
                console.log(`  🔒 [HTTP ${r.status}] (Live / Auth-Gated): ${r.url} (${r.latency}ms)`);
            } else {
                passCount++;
                const redir = r.redirectLocation ? ` -> ${r.redirectLocation}` : '';
                console.log(`  ✅ [HTTP ${r.status}]: ${r.url} (${r.latency}ms)${redir}`);
            }
        } else {
            failCount++;
            console.log(`  ❌ [HTTP ${r.status}]: ${r.url} - ${r.error || 'Failed'}`);
        }
    });

    console.log('\n================================================================');
    console.log(`📊 Summary: ${passCount} Reachable | ${authCount} Auth-Protected (Technion SSO) | ${failCount} Failed`);
    console.log('================================================================');

    if (failCount > 0) {
        console.log('\n⚠️ Flagged non-working URLs for review:');
        results.filter(r => !r.ok).forEach(r => console.log(`   - ${r.url} (${r.status}: ${r.error})`));
    }
}

main().catch(console.error);
