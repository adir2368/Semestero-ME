const https = require('https');

function sendMobileNotification(message, title = 'Semestero ME Updates', tags = 'white_check_mark,rocket', priority = 'default', topic = process.env.NTFY_TOPIC || 'adir-semestero-me-updates') {
    return new Promise((resolve) => {
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
    const msg = process.argv[2] || 'העדכון ב-Semestero ME הושלם בהצלחה!';
    const ttl = process.argv[3] || 'Semestero ME Updates';
    const tpc = process.argv[4] || process.env.NTFY_TOPIC || 'adir-semestero-me-updates';
    sendMobileNotification(msg, ttl, 'white_check_mark,rocket', 'default', tpc).then((ok) => {
        console.log(ok ? 'NOTIFICATION_SENT_SUCCESSFULLY' : 'NOTIFICATION_FAILED');
        process.exit(ok ? 0 : 1);
    });
}

module.exports = { sendMobileNotification };
