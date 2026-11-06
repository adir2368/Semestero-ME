import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Semestero ME - Technion Registration Peak Load & Stress Test (Grafana k6)
 * Simulates concurrent student traffic during course bidding and semester start.
 */

export const options = {
    stages: [
        { duration: '30s', target: 50 },  // Ramp-up to 50 virtual students
        { duration: '1m', target: 200 },   // Surge to 200 concurrent students (registration peak)
        { duration: '30s', target: 0 },    // Ramp-down to zero
    ],
    thresholds: {
        http_req_duration: ['p(95)<250', 'p(99)<500'], // 95% of requests must complete in <250ms
        http_req_failed: ['rate<0.01'],                 // Error rate must remain below 1%
        checks: ['rate>0.99'],                          // 99% of functional assertions must pass
    },
};

const BASE_URL = __ENV.TARGET_URL || 'https://semestero.me';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://asxpbepuvhbafsjlogag.supabase.co';
const SUPABASE_ANON = __ENV.SUPABASE_ANON || 'sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy';

export default function () {
    // 1. Student opens Semestero PWA Shell
    const pwaRes = http.get(`${BASE_URL}/`);
    check(pwaRes, {
        'PWA status is 200': (r) => r.status === 200,
        'PWA contains title': (r) => r.body && r.body.includes('Semestero'),
    });

    sleep(1);

    // 2. Client loads static assets (styles & app logic)
    const responses = http.batch([
        ['GET', `${BASE_URL}/styles.css`],
        ['GET', `${BASE_URL}/app.js`],
        ['GET', `${BASE_URL}/auth_sync.js`],
        ['GET', `${BASE_URL}/thinking_orbs.js`],
    ]);

    check(responses[0], { 'styles.css status 200': (r) => r.status === 200 });
    check(responses[1], { 'app.js status 200': (r) => r.status === 200 });

    sleep(1.5);

    // 3. Authenticated student performs targeted Supabase point query (ADR-075)
    const testUserId = `student_${Math.floor(Math.random() * 50)}`;
    const supabaseHeaders = {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Accept': 'application/json',
    };

    const supaRes = http.get(
        `${SUPABASE_URL}/rest/v1/user_states?select=user_id,updated_at&user_id=eq.${testUserId}`,
        { headers: supabaseHeaders }
    );

    check(supaRes, {
        'Supabase point-query status 200': (r) => r.status === 200,
        'Point-query returns array': (r) => Array.isArray(r.json()),
    });

    sleep(2);
}
