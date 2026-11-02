const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🛡️ Verifying Wear OS & Phone Screen Orientation Hard-Locks...\n');

const aaptPath = 'C:\\Users\\user\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\aapt.exe';
const wearApk = path.join(__dirname, '..', 'Semestero-Wear.apk');
const appApk = path.join(__dirname, '..', 'Semestero-ME.apk');

if (!fs.existsSync(wearApk)) {
    console.error('❌ Semestero-Wear.apk not found!');
    process.exit(1);
}

if (!fs.existsSync(appApk)) {
    console.error('❌ Semestero-ME.apk not found!');
    process.exit(1);
}

// 1. Check Wear APK binary manifest
const wearXml = execSync(`"${aaptPath}" dump xmltree "${wearApk}" AndroidManifest.xml`).toString();
const wearHasNoSensor = wearXml.includes('android:screenOrientation(0x0101001e)=(type 0x10)0x5');
console.log(`- Wear OS APK compiled screenOrientation is NOSENSOR (0x5): ${wearHasNoSensor ? '✅ PASSED' : '❌ FAILED'}`);

if (!wearHasNoSensor) {
    console.error('FAILED: Wear OS APK does not contain screenOrientation=nosensor in compiled manifest!');
    process.exit(1);
}

// 2. Check Phone APK binary manifest
const appXml = execSync(`"${aaptPath}" dump xmltree "${appApk}" AndroidManifest.xml`).toString();
const appHasPortrait = appXml.includes('android:screenOrientation(0x0101001e)=(type 0x10)0x1');
console.log(`- Phone APK compiled screenOrientation is PORTRAIT (0x1): ${appHasPortrait ? '✅ PASSED' : '❌ FAILED'}`);

if (!appHasPortrait) {
    console.error('FAILED: Phone APK does not contain screenOrientation=portrait in compiled manifest!');
    process.exit(1);
}

// 3. Check Wear OS Java source code for setRequestedOrientation
const javaPath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'MainActivity.java');
const javaCode = fs.readFileSync(javaPath, 'utf8');
const javaHasRuntimeLock = javaCode.includes('setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_NOSENSOR)');
console.log(`- Wear OS MainActivity has programmatic runtime orientation lock: ${javaHasRuntimeLock ? '✅ PASSED' : '❌ FAILED'}`);

if (!javaHasRuntimeLock) {
    console.error('FAILED: Wear OS MainActivity.java missing setRequestedOrientation call!');
    process.exit(1);
}

console.log('\n🎉 ALL ORIENTATION HARD-LOCK AUDITS PASSED 100%! THE WATCH CANNOT ROTATE.');
