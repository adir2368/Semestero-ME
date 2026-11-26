const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;
const BASE_DIR = __dirname;
const RESOLVED_BASE_DIR = path.resolve(BASE_DIR);

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const server = http.createServer(async (req, res) => {
    let reqPath;
    try {
        reqPath = decodeURIComponent(req.url.split('?')[0]);
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('400 Bad Request');
        return;
    }

    // Local CORS-free proxy for Technion Moodle ICS calendar feeds
    if (reqPath === '/api/moodle-ics') {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept'
            });
            res.end();
            return;
        }
        try {
            const parsedReqUrl = new URL(req.url, 'http://localhost');
            const targetUrl = (parsedReqUrl.searchParams.get('url') || '').trim();
            if (!targetUrl) {
                res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Missing url parameter' }));
                return;
            }
            if (!/^https:\/\/moodle\d*\.technion\.ac\.il\/calendar\/export_execute\.php/i.test(targetUrl)) {
                res.writeHead(403, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ error: 'Only Technion Moodle ICS URLs are allowed' }));
                return;
            }
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 12000);
            try {
                const upstream = await fetch(targetUrl, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'text/calendar, text/plain, */*',
                        'User-Agent': 'Semestero-MoodleSync/3.2.1'
                    }
                });
                const text = await upstream.text();
                if (!upstream.ok || !text.includes('BEGIN:VCALENDAR')) {
                    res.writeHead(upstream.ok ? 502 : upstream.status, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ error: `Upstream returned HTTP ${upstream.status}` }));
                    return;
                }
                res.writeHead(200, {
                    'Content-Type': 'text/calendar; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'no-store'
                });
                res.end(text);
                return;
            } finally {
                clearTimeout(timer);
            }
        } catch (err) {
            res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ error: err?.message || 'Proxy fetch failed' }));
            return;
        }
    }

    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    if (reqPath.includes('\0')) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('400 Bad Request');
        return;
    }
    const relTarget = reqPath.replace(/^[/\\]+/, '');
    const segments = relTarget.split(/[/\\]+/).filter(Boolean);
    if (segments.some(seg => seg === '..' || seg === '.git' || seg.startsWith('.env'))) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('403 Forbidden');
        return;
    }
    const filePath = path.resolve(RESOLVED_BASE_DIR, relTarget);
    if (filePath !== RESOLVED_BASE_DIR && !filePath.startsWith(RESOLVED_BASE_DIR + path.sep)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
            res.end('404 Not Found: ' + reqPath);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const headers = {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Access-Control-Allow-Origin': '*'
        };

        if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' || reqPath === '/sw.js') {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = '0';
        }

        res.writeHead(200, headers);

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIp();
    console.log('====================================================');
    console.log('🚀 Academic Skill Tree - Mobile PWA Server Live!');
    console.log('====================================================');
    console.log(`📱 On your phone (same Wi-Fi), open:`);
    console.log(`   👉 http://${ip}:${PORT}`);
    console.log('');
    console.log(`💻 On your PC browser, open:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log('====================================================');
});
