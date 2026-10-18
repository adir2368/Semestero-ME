/**
 * Semestero ME - Mobile Asset Bundler for Capacitor / Android
 * Copies clean production assets into the 'www' directory for Android native compilation.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');

// Ensure clean www directory
if (fs.existsSync(WWW)) {
    fs.rmSync(WWW, { recursive: true, force: true });
}
fs.mkdirSync(WWW, { recursive: true });

// Core files and assets needed by Semestero ME
const FILES_TO_COPY = [
    'index.html',
    'app.js',
    'styles.css',
    'planner_module.js',
    'planner_catalog.js',
    'auth_sync.js',
    'timetable_generator.js',
    'moodle_sync.js',
    'modal_help.js',
    'interactive_tour.js',
    'accessibility.js',
    'accessibility.css',
    'site_analytics.js',
    'technion_academic_calendar.js',
    'curriculum_template.js',
    'sw.js',
    'manifest.json',
    'cheesefork_database.js',
    'cheesefork_courses.min.js',
    'cheesefork_courses_2025_200.min.js',
    'adir_avatar.png',
    'adir_avatar_small.png',
    'adir_avatar_small.webp',
    'faculty_emblem_clean.png',
    'notification-badge.png',
    'favicon.ico',
    'favicon.svg',
    'favicon-96x96.png',
    'apple-touch-icon.png',
    'icon-48.png',
    'icon-192.png',
    'icon-512.png',
    'icon_small.png',
    'icon_small.webp',
    'web-app-manifest-192x192.png',
    'web-app-manifest-512x512.png',
    'og-preview.png'
];

let copiedCount = 0;
FILES_TO_COPY.forEach(file => {
    const src = path.join(ROOT, file);
    const dest = path.join(WWW, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        copiedCount++;
    } else {
        console.warn(`[Build Mobile] Optional file missing: ${file}`);
    }
});

console.log(`✅ Successfully prepared mobile bundle in /www with ${copiedCount} files.`);
