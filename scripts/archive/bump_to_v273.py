import os

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app_path = os.path.join(root, 'app.js')
with open(app_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('REV-2026.10.27-v2.7.2', 'REV-2026.10.27-v2.7.3')
content = content.replace('version: "2.7.2"', 'version: "2.7.3"')
content = content.replace('APP_CURRENT_REVISION.version) || "2.5.9"', 'APP_CURRENT_REVISION.version) || "2.7.3"')

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated app.js successfully')

gradle_path = os.path.join(root, 'android', 'app', 'build.gradle')
with open(gradle_path, 'r', encoding='utf-8') as f:
    gradle = f.read()

gradle = gradle.replace('versionName "2.7.2"', 'versionName "2.7.3"')
gradle = gradle.replace('versionName "2.7.1"', 'versionName "2.7.3"')
gradle = gradle.replace('versionCode 27', 'versionCode 29')
gradle = gradle.replace('versionCode 28', 'versionCode 29')

with open(gradle_path, 'w', encoding='utf-8') as f:
    f.write(gradle)
print('Updated build.gradle successfully')
