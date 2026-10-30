const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const targetDirs = [
    path.join(srcDir, 'dist', 'Academic Skill Tree-win32-x64', 'resources', 'app'),
    path.join(srcDir, 'dist', 'Semestero ME-win32-x64', 'resources', 'app')
].filter(d => fs.existsSync(d));

if (targetDirs.length === 0) {
    console.error('No dist app directories exist.');
    process.exit(1);
}

const filesToCopy = [
    'app.js',
    'preloaded_user_state.js',
    'timetable_generator.js',
    'auth_sync.js',
    'site_analytics.js',
    'modal_help.js',
    'interactive_tour.js',
    'ui_enhancements.js',
    'index.html',
    'widgets.html',
    'styles.css',
    'accessibility.css',
    'technion_academic_calendar.js',
    'main.js',
    'preload.js',
    'moodle_sync.js',
    'planner_module.js',
    'planner_catalog.js',
    'curriculum_template.js',
    'cheesefork_database.js',
    'cheesefork_courses.min.js',
    'cheesefork_courses_2025_200.min.js',
    'user_saved_state.json',
    'package.json',
    'sw.js',
    'manifest.json',
    'accessibility.js',
    'pangea_icon.png',
    'gcal_icon.svg',
    'grades_icon.png',
    'drive_icon.svg',
    'cheesefork_icon.png',
    'asat_icon.png',
    'panopto_icon.svg',
    'moodle_icon.svg',
    'favicon.ico',
    'favicon.svg',
    'favicon-96x96.png',
    'apple-touch-icon.png',
    'icon.png',
    'icon_small.png',
    'icon_small.webp',
    'icon-48.png',
    'icon-192.png',
    'icon-512.png',
    'web-app-manifest-192x192.png',
    'web-app-manifest-512x512.png',
    'icon.ico',
    'adir_avatar.png',
    'adir_avatar_small.png',
    'adir_avatar_small.webp',
    'notification-badge.png',
    'notification-badge-96.png'
];

for (const targetDir of targetDirs) {
    for (const file of filesToCopy) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(targetDir, file);
        if (fs.existsSync(srcFile)) {
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copied: ${file} -> ${path.basename(path.dirname(path.dirname(targetDir)))}`);
        } else {
            console.warn(`File not found: ${srcFile}`);
        }
    }

    // Copy widgets directory
    const srcWidgetsDir = path.join(srcDir, 'widgets');
    const destWidgetsDir = path.join(targetDir, 'widgets');
    if (fs.existsSync(srcWidgetsDir)) {
        if (!fs.existsSync(destWidgetsDir)) fs.mkdirSync(destWidgetsDir, { recursive: true });
        const widgetFiles = fs.readdirSync(srcWidgetsDir);
        for (const wf of widgetFiles) {
            fs.copyFileSync(path.join(srcWidgetsDir, wf), path.join(destWidgetsDir, wf));
            console.log(`Copied: widgets/${wf} -> ${path.basename(path.dirname(path.dirname(targetDir)))}`);
        }
    }
}

console.log('All files successfully copied into dist app resources!');

