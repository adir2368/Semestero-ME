import json, re

# 1. package.json
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
pkg['version'] = '2.10.7'
with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2)
print('Bumped package.json to 2.10.7')

# 2. sw.js
with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()
sw = re.sub(r'semestero-me-v2\.\d+\.\d+', 'semestero-me-v2.10.7', sw)
with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)
print('Bumped sw.js CACHE_NAME to semestero-me-v2.10.7')

# 3. index.html
with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()
idx = idx.replace('v=2.10.6', 'v=2.10.7')
idx = idx.replace('2.10.6', '2.10.7')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx)
print('Bumped index.html to 2.10.7')

# 4. app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()
app = app.replace('2.10.6', '2.10.7')
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)
print('Bumped app.js to 2.10.7')

# 5. android/app/build.gradle
with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
    bg = f.read()
bg = re.sub(r'versionCode\s+\d+', 'versionCode 61', bg)
bg = re.sub(r'versionName\s+["\'][^"\']+["\']', 'versionName "2.10.7"', bg)
with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
    f.write(bg)
print('Bumped android/app/build.gradle to versionCode 61, versionName 2.10.7')

# 6. android/wear/build.gradle
with open('android/wear/build.gradle', 'r', encoding='utf-8') as f:
    wbg = f.read()
wbg = re.sub(r'versionCode\s+\d+', 'versionCode 61', wbg)
wbg = re.sub(r'versionName\s+["\'][^"\']+["\']', 'versionName "2.10.7"', wbg)
with open('android/wear/build.gradle', 'w', encoding='utf-8') as f:
    f.write(wbg)
print('Bumped android/wear/build.gradle to versionCode 61, versionName 2.10.7')

print('All versions successfully bumped to v2.10.7!')
