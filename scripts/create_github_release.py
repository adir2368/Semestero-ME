import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
import urllib.request
import urllib.error
import urllib.parse
import subprocess
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "adir2368/Semestero-ME"
APK_PATH = os.path.join(ROOT, "Semestero-ME.apk")
EXE_PATH = os.path.join(ROOT, "dist_build", "Semestero ME-win32-x64", "Semestero ME.exe")
if not os.path.exists(EXE_PATH):
    EXE_PATH = os.path.join(ROOT, "dist", "Semestero ME-win32-x64", "Semestero ME.exe")
ZIP_PATH = os.path.join(ROOT, "Semestero-ME-Windows-x64.zip")

with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as f:
    pkg = json.load(f)
VERSION = pkg.get("version", "2.8.5")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Streamlined Quick Access Bar & ASAT Grades Integration"

def get_github_token():
    try:
        p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out, _ = p.communicate(input="protocol=https\nhost=github.com\n\n")
        m = re.search(r'password=(.+)', out)
        if m:
            return m.group(1).strip()
    except Exception as e:
        print(f"Error getting git credential: {e}")
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    return token

def upload_asset(upload_url_template, file_path, content_type, headers):
    if not os.path.exists(file_path):
        print(f"[Upload] File not found: {file_path}")
        return False
    
    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    print(f"[Upload] Uploading {file_name} ({file_size / (1024*1024):.2f} MB)...")
    
    clean_upload_url = upload_url_template.split("{")[0]
    upload_url = f"{clean_upload_url}?name={urllib.parse.quote(file_name)}"
    
    upload_headers = dict(headers)
    upload_headers["Content-Type"] = content_type
    upload_headers["Content-Length"] = str(file_size)
    
    try:
        with open(file_path, "rb") as f:
            req = urllib.request.Request(upload_url, data=f, headers=upload_headers, method="POST")
            with urllib.request.urlopen(req) as res:
                if res.status in (200, 201):
                    print(f"[Upload] Successfully uploaded {file_name}")
                    return True
                else:
                    print(f"[Upload] Upload returned status {res.status}")
                    return False
    except urllib.error.HTTPError as e:
        print(f"[Upload] HTTPError during upload of {file_name}: {e.code} {e.reason}")
        try:
            print(e.read().decode())
        except:
            pass
        return False
    except Exception as e:
        print(f"[Upload] Exception during upload of {file_name}: {e}")
        return False

def delete_existing_asset_if_any(release_id, file_name, headers):
    url = f"https://api.github.com/repos/{REPO}/releases/{release_id}/assets"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            assets = json.loads(res.read().decode())
            for a in assets:
                if a["name"] == file_name:
                    print(f"[Release] Found existing asset {file_name} (id={a['id']}). Deleting for clean re-upload...")
                    del_req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/assets/{a['id']}", headers=headers, method="DELETE")
                    urllib.request.urlopen(del_req)
                    print(f"[Release] Deleted asset {file_name}")
    except Exception as e:
        print(f"[Release] Notice while checking assets: {e}")

def main():
    token = get_github_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🎯🏛️

### 1. ייעול סרגל הגישה המהירה של הקורסים (Streamlined Quick Access Bar)
- **איחוד שירותי אס״ט עם כפתור 'ציונים וסריקות'**: העברת סמל חותם אס״ט הרשמי (`asat_icon.png`) אל כפתור הציונים והסריקות בפורטל הטכניוני (`grades.technion.ac.il`), המרכז את הבחינות, הסריקות ומחברות המבחן.
- **הסרת כפתור מאגר הבחינות הנפרד**: פישוט סרגל הקישורים המהירים מ-7 כפתורים ל-6 כפתורים ממוקדים, ללא כפילות מיותרת, תוך שיפור שטח הפנים והקריאות במובייל ובדסקטופ.

### 2. תמיכה מלאה ב-Offline וב-PWA
- עדכון ה-Service Worker (`sw.js`) לקאש `semestero-me-v2.8.5` לרענון מהיר וחלק.
- עדכון חבילת ה-Dist של אפליקציית ה-Mobile Android.

### 3. קימפול חבילות והפצה
- קימפול קובץ APK מעודכן (`Semestero-ME.apk`, versionCode 41).
- מעבר מלא של כל סוויטות הבדיקות האוטומטיות (System Health, Auth Persistence, Integrations Hub, CheeseFork Precision, Dual-Mode Suite).
"""

    req_tag = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}", headers=headers)
    release = None
    try:
        with urllib.request.urlopen(req_tag) as res:
            release = json.loads(res.read().decode())
            print(f"[Release] Found existing release for tag {TAG} (id={release['id']})")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[Release] No release found for tag {TAG}. Will create a new one.")
        else:
            print(f"[Release] HTTPError checking tag: {e.code} {e.reason}")
    except Exception as e:
        print(f"[Release] Exception checking tag: {e}")

    if not release:
        print(f"[Release] Creating release for {TAG}...")
        create_payload = json.dumps({
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }).encode("utf-8")
        create_req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases", data=create_payload, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(create_req) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Successfully created release id={release['id']}")
        except Exception as e:
            print(f"[Release] Failed to create release: {e}")
            return
    else:
        print(f"[Release] Updating release notes for id={release['id']}...")
        update_payload = json.dumps({
            "name": NAME,
            "body": body_notes
        }).encode("utf-8")
        update_req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/{release['id']}", data=update_payload, headers=headers, method="PATCH")
        try:
            with urllib.request.urlopen(update_req) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Successfully updated release id={release['id']}")
        except Exception as e:
            print(f"[Release] Failed to update release: {e}")

    upload_url_template = release.get("upload_url", "")
    if not upload_url_template:
        print("[Release] Error: No upload_url in release data")
        return

    # Delete old assets if re-uploading
    delete_existing_asset_if_any(release["id"], "Semestero-ME.apk", headers)

    # 1. Upload APK
    if os.path.exists(APK_PATH):
        upload_asset(upload_url_template, APK_PATH, "application/vnd.android.package-archive", headers)
    else:
        print(f"[Release] APK file not found at {APK_PATH}")

    # 2. Upload Windows ZIP if exists
    if os.path.exists(ZIP_PATH):
        delete_existing_asset_if_any(release["id"], "Semestero-ME-Windows-x64.zip", headers)
        upload_asset(upload_url_template, ZIP_PATH, "application/zip", headers)

    print(f"\n🎉 Release process finished for {TAG}!")
    print(f"URL: {release.get('html_url')}")

if __name__ == "__main__":
    main()
