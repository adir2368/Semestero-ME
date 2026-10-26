/**
 * Semestero ME - User-Facing External Link Verification
 * Validates the exact 15 external URLs clickable by users or accessed by runtime services.
 */

const https = require('https');
const http = require('http');

const USER_LINKS = [
    {
        name: 'CheeseFork Live Schedule (Adir Profile)',
        url: 'https://cheesefork.netlify.app/?semester=202601',
        expected: [200, 301, 302],
        category: 'CheeseFork'
    },
    {
        name: 'CheeseFork Homepage',
        url: 'https://cheesefork.netlify.app',
        expected: [200, 301, 302],
        category: 'CheeseFork'
    },
    {
        name: 'CheeseFork Firestore REST API (Schedule Data)',
        url: 'https://firestore.googleapis.com/v1/projects/cheesefork-de9af/databases/(default)/documents/users/GENERIC_USER/semesters/202601',
        expected: [200],
        category: 'CheeseFork'
    },
    {
        name: 'Technion Moodle 26 (2026/2027) Homepage',
        url: 'https://moodle26.technion.ac.il/',
        expected: [200, 302, 303],
        category: 'Technion Moodle'
    },
    {
        name: 'Technion Moodle 26 Calendar Export Page',
        url: 'https://moodle26.technion.ac.il/calendar/export.php',
        expected: [200, 302, 303],
        category: 'Technion Moodle'
    },
    {
        name: 'Technion Moodle 26 Calendar View',
        url: 'https://moodle26.technion.ac.il/calendar/view.php',
        expected: [200, 302, 303],
        category: 'Technion Moodle'
    },
    {
        name: 'Google Calendar Web App',
        url: 'https://calendar.google.com',
        expected: [200, 301, 302],
        category: 'Google Services'
    },
    {
        name: 'GitHub Repository Issues (New Bug Report)',
        url: 'https://github.com/adir2368/Semestero-ME/issues/new',
        expected: [200, 301, 302],
        category: 'GitHub'
    },
    {
        name: 'GitHub Repository Releases',
        url: 'https://github.com/adir2368/Semestero-ME/releases',
        expected: [200],
        category: 'GitHub'
    },
    {
        name: 'GitHub Raw Package.json (Version Check Endpoint)',
        url: 'https://raw.githubusercontent.com/adir2368/Semestero-ME/main/package.json',
        expected: [200],
        category: 'GitHub'
    },
    {
        name: 'GitHub API Latest Release Endpoint',
        url: 'https://api.github.com/repos/adir2368/Semestero-ME/releases/latest',
        expected: [200],
        category: 'GitHub'
    },
    {
        name: 'Technion Schedule Fallback Gist (ICS Feed)',
        url: 'https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics',
        expected: [200],
        category: 'Data Feeds'
    },
    {
        name: 'JSDelivr CDN Supabase JS Bundle',
        url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
        expected: [200, 301, 302],
        category: 'CDNs'
    },
    {
        name: 'Developer Profile on LinkedIn (Full Profile URL)',
        url: 'https://www.linkedin.com/in/adir-moshe',
        expected: [200, 301, 302, 999], // 999 is LinkedIn anti-scraping for server-side bots
        category: 'Social'
    },
    {
        name: 'Semestero ME Official Canonical URL',
        url: 'https://adir2368.github.io/Semestero-ME/',
        expected: [200],
        category: 'Application'
    }
];

function checkLink(item) {
    return new Promise((resolve) => {
        let parsed;
        try {
            parsed = new URL(item.url);
        } catch (e) {
            return resolve({ ...item, ok: false, status: 'INVALID', error: e.message });
        }

        const client = parsed.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'he,en-US;q=0.9,en;q=0.8'
            },
            timeout: 10000
        };

        const start = Date.now();
        const req = client.request(options, (res) => {
            const latency = Date.now() - start;
            res.on('data', () => {});
            res.on('end', () => {
                const status = res.statusCode;
                const isExpected = item.expected.includes(status);
                // Technion Moodle redirects to login if unauthenticated (303/302), which proves the endpoint is alive!
                const isTechnionAuthRedirect = (status === 302 || status === 303) && item.category === 'Technion Moodle';
                // LinkedIn returns 999 to automated non-browser clients as security protection
                const isLinkedInGuard = status === 999 && item.category === 'Social';
                const success = isExpected || isTechnionAuthRedirect || isLinkedInGuard;

                resolve({
                    ...item,
                    ok: success,
                    status,
                    latency,
                    redirectLocation: res.headers.location || null,
                    notes: isTechnionAuthRedirect ? 'Redirects to Technion SSO login (expected behavior for unauthenticated sessions)' :
                           isLinkedInGuard ? 'Returns 999 to automated bots (active in browser)' : 'OK'
                });
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ ...item, ok: false, status: 'TIMEOUT', error: 'Timed out after 10s' });
        });

        req.on('error', (err) => {
            resolve({ ...item, ok: false, status: 'ERROR', error: err.message });
        });

        req.end();
    });
}

async function main() {
    console.log('================================================================');
    console.log('🔗 Probing All 15 User-Facing External Resources & Service APIs');
    console.log('================================================================\n');

    const results = await Promise.all(USER_LINKS.map(checkLink));

    let pass = 0;
    let fail = 0;

    results.forEach((r, idx) => {
        const num = (idx + 1).toString().padStart(2, ' ');
        if (r.ok) {
            pass++;
            const redir = r.redirectLocation ? ` ➔ ${r.redirectLocation}` : '';
            console.log(`[${num}] ✅ [HTTP ${r.status}] ${r.name}`);
            console.log(`     URL: ${r.url}`);
            console.log(`     Category: ${r.category} | Latency: ${r.latency}ms | Note: ${r.notes}${redir}\n`);
        } else {
            fail++;
            console.log(`[${num}] ❌ [HTTP ${r.status}] ${r.name}`);
            console.log(`     URL: ${r.url}`);
            console.log(`     Error: ${r.error || 'Unexpected status code'}\n`);
        }
    });

    console.log('================================================================');
    console.log(`📊 Result: ${pass}/${USER_LINKS.length} Links Active & Verified (${fail === 0 ? '100% Operational' : `${fail} issues`})`);
    console.log('================================================================');
}

main().catch(console.error);
