const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🛡️ Verifying Wear OS & Phone Manifest Orientation Policy (No nosensor on Watch 8)...\n');

const aaptPath = 'C:\\Users\\user\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\aapt.exe';
const wearApk = path.join(__dirname, '..', 'Semestero-ME-Watch.apk');
const appApk = path.join(__dirname, '..', 'Semestero-ME.apk');

if (!fs.existsSync(wearApk)) {
    console.error('❌ Semestero-ME-Watch.apk not found!');
    process.exit(1);
}

if (!fs.existsSync(appApk)) {
    console.error('❌ Semestero-ME.apk not found!');
    process.exit(1);
}

// 1. Check Wear APK binary manifest respects Galaxy Watch 8 hard-ban (NO nosensor)
const wearXml = execSync(`"${aaptPath}" dump xmltree "${wearApk}" AndroidManifest.xml`).toString();
const wearHasNoSensor = wearXml.includes('android:screenOrientation(0x0101001e)=(type 0x10)0x5') || wearXml.includes('nosensor');
console.log(`- Wear OS APK compiled manifest obeys NO nosensor hard-ban: ${!wearHasNoSensor ? '✅ PASSED' : '❌ FAILED'}`);

if (wearHasNoSensor) {
    console.error('FAILED: Wear OS APK violates Galaxy Watch 8 hard-ban with screenOrientation=nosensor!');
    process.exit(1);
}

// 2. Check Phone APK binary manifest includes MainActivity and avoids nosensor
const appXml = execSync(`"${aaptPath}" dump xmltree "${appApk}" AndroidManifest.xml`).toString();
const appHasMainActivity = appXml.includes('MainActivity') && !appXml.includes('0x5');
console.log(`- Phone APK compiled manifest valid MainActivity configuration: ${appHasMainActivity ? '✅ PASSED' : '❌ FAILED'}`);

if (!appHasMainActivity) {
    console.error('FAILED: Phone APK MainActivity manifest check failed!');
    process.exit(1);
}

// 3. Check Wear OS Java source code does NOT call banned SCREEN_ORIENTATION_NOSENSOR
const javaPath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'MainActivity.java');
const javaCode = fs.readFileSync(javaPath, 'utf8');
const javaHasBannedNoSensor = javaCode.includes('SCREEN_ORIENTATION_NOSENSOR');
console.log(`- Wear OS MainActivity source obeys NO SCREEN_ORIENTATION_NOSENSOR ban: ${!javaHasBannedNoSensor ? '✅ PASSED' : '❌ FAILED'}`);

if (javaHasBannedNoSensor) {
    console.error('FAILED: Wear OS MainActivity.java must not contain SCREEN_ORIENTATION_NOSENSOR!');
    process.exit(1);
}

console.log('\n🎉 ALL ORIENTATION HARD-BAN AUDITS PASSED 100%!');
