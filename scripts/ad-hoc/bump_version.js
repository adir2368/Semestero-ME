const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const indexPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace all ?v=2.4.15 with ?v=2.4.16
html = html.split('?v=2.4.15').join('?v=2.4.16');

// Replace version badges
html = html.replace('id="display-system-version">v2.4.15<', 'id="display-system-version">v2.4.16<');
html = html.replace('גרסה אחרונה v2.4.15', 'גרסה אחרונה v2.4.16');
html = html.replace('v2.4.15 ✨', 'v2.4.16 ✨');
html = html.replace('(v2.4.15)', '(v2.4.16)');

// Insert new changelog item at top of changelog list
const newChangelog = '<li><strong>v2.4.16 (18/10/2026):</strong> סינון טמפורלי קפדני לסמסטר הנוכחי/הבא (חורף תשפ״ז 2026/27): טיהור תאריכי בחינות שפג תוקפם מסמסטרים קודמים (2025/קיץ 2026), מניעת הצגת מועדי מבחן לקורסים שהושלמו בעבר, ואכיפת מועדי בחינות רשמיים מפברואר-מרץ 2027 בלבד.</li>\n                        ';
html = html.replace('<li><strong>v2.4.15 (18/10/2026):</strong>', newChangelog + '<li><strong>v2.4.15 (18/10/2026):</strong>');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html updated successfully to v2.4.16!');
