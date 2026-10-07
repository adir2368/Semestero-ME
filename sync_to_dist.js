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
}

console.log('All files successfully copied into dist app resources!');
