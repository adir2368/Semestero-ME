const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distAppDir = path.join(srcDir, 'dist', 'Academic Skill Tree-win32-x64', 'resources', 'app');

if (!fs.existsSync(distAppDir)) {
    console.error('Dist app directory does not exist:', distAppDir);
    process.exit(1);
}

const filesToCopy = [
    'app.js',
    'auth_sync.js',
    'index.html',
    'styles.css',
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
    'icon.png',
    'icon.ico',
    'adir_avatar.png'
];

for (const file of filesToCopy) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(distAppDir, file);
    if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied: ${file} -> dist`);
    } else {
        console.warn(`File not found: ${srcFile}`);
    }
}

console.log('All files successfully copied into dist app resources!');
