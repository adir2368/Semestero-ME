const https = require('https');

function sendMobileNotification(message, title = 'Atlas ME • Antigravity', tags = 'white_check_mark,rocket', priority = 'default') {
    return new Promise((resolve) => {
        const topic = 'adir-antigravity-done';
        const req = https.request(`https://ntfy.sh/${topic}`, {
            method: 'POST',
            headers: {
                'Title': '=?UTF-8?B?' + Buffer.from(title).toString('base64') + '?=',
                'Priority': priority,
                'Tags': tags,
                'Content-Type': 'text/plain; charset=utf-8'
            }
        }, (res) => {
            resolve(res.statusCode >= 200 && res.statusCode < 300);
        });

        req.on('error', (err) => {
            console.error('[Notification Error]:', err.message);
            resolve(false);
        });

        req.write(Buffer.from(message, 'utf8'));
        req.end();
    });
}

if (require.main === module) {
    const msg = process.argv[2] || 'הבקשה שלך הושלמה בהצלחה!';
    const ttl = process.argv[3] || 'Atlas ME • Antigravity';
    sendMobileNotification(msg, ttl).then((ok) => {
        console.log(ok ? 'NOTIFICATION_SENT_SUCCESSFULLY' : 'NOTIFICATION_FAILED');
        process.exit(ok ? 0 : 1);
    });
}

module.exports = { sendMobileNotification };
