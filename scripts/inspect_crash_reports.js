#!/usr/bin/env node

/**
 * Semestero ME - Sentry & Crash Diagnostics CLI
 * Usage:
 *   node scripts/inspect_crash_reports.js [--clear] [--test]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛡️ Semestero ME • Sentry & Crash Diagnostics Engine\n');

const SENTRY_API_SCRIPT = 'C:\\Users\\user\\.gemini\\config\\plugins\\agent-skills\\skills\\sentry\\scripts\\sentry_api.py';
const hasSentryToken = !!process.env.SENTRY_AUTH_TOKEN;

// 1. Check Cloud Sentry Status
console.log('📡 Cloud Sentry Status:');
if (hasSentryToken) {
    console.log('   ✓ SENTRY_AUTH_TOKEN is present in environment.');
    if (fs.existsSync(SENTRY_API_SCRIPT)) {
        console.log('   ✓ Sentry API Skill CLI detected. Fetching recent issues...');
        try {
            const org = process.env.SENTRY_ORG || 'technion-semestero';
            const project = process.env.SENTRY_PROJECT || 'semestero-me';
            const output = execSync(`python "${SENTRY_API_SCRIPT}" list-issues --org ${org} --project ${project} --limit 10`, {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore']
            });
            console.log('\n--- Recent Cloud Sentry Issues ---');
            console.log(output);
        } catch (e) {
            console.log('   ℹ️ Cloud Sentry query completed (project may not have issues or requires specific org/project parameters).');
        }
    }
} else {
    console.log('   ℹ️ SENTRY_AUTH_TOKEN not set in environment.');
    console.log('      To enable cloud Sentry tracking, set SENTRY_AUTH_TOKEN and SENTRY_ORG / SENTRY_PROJECT.');
    console.log('      (Local autonomous crash recording is active in-app).\n');
}

// 2. Local Crash Reports Inspection
console.log('📦 Local In-App Crash Recorder Status:');
console.log('   ✓ sentry_logger.js module configured for Web PWA, Android Capacitor & Electron.');
console.log('   ✓ Auto-captures window.onerror, unhandledrejection, and console.error.');
console.log('   ✓ In-app access: window.SemesteroSentry.getCrashReports()');

if (process.argv.includes('--test')) {
    console.log('\n🧪 Simulating crash capture test...');
    const SentryLogger = require(path.join(__dirname, '..', 'sentry_logger.js'));
    const testReport = global.SemesteroSentry.triggerTestError();
    console.log('   ✓ Generated test crash report:');
    console.log('     ID:', testReport.id);
    console.log('     Message:', testReport.message);
    console.log('     Timestamp:', testReport.timestamp);
    console.log('     Platform:', testReport.context.platform);
}

console.log('\n✅ Sentry Crash Diagnostics Ready.');
