import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import sys
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
VERSION = pkg.get("version", "2.7.9")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Session Persistence Fix, Guest Purge Shield & Zero-State Cloud Protection"

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

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🛡️💎

### 1. תיקון קריטי להתמדת הסשן ומניעת התנתקות ברענון (Session Persistence)
- ביטול מנגנון האיפוס השגוי ב-`auth_sync.js::init()` שגרם למשתמש המפתח להתנתק בכל רענון עמוד (Page Refresh).
- הבטחת שמירת הדגלים והסשן של אדיר משה (`adir_moshe`) בכל המכשירים (מובייל ודפדפן) ללא איבוד התחברות.

### 2. הגנה מוחלטת על קובץ השמירה של אדיר (Save Shield)
- הסרת פקודת המחיקה השגויה של `LEGACY_SAVE_KEY` מתוך מנגנון ניקוי האורחים (`loadActiveUserState`).
- נעילת `saveState()` ב-`app.js` כך שאינה דורסת את `academic_skill_tree_save` במצב אורח.
- תמיכה מלאה בהתחברות באמצעות אימייל `adir.m.2368@gmail.com`.

### 3. מגן ענן וסנכרון ריפוי עצמי (Zero-State Cloud Protection)
- חסימה הרמטית ב-`syncToCloud()` המונעת העלאת נתוני 0-GPA או קורסים ריקים לענן עבור אדיר משה.
- מנגנון זיהוי ודחייה ב-`pullLatestStateFromCloud()` המשחזר אוטומטית מ-`PRELOADED_USER_STATE` אם מתקבל מידע לא תקין.
- שחזור מלא של ציוני המפתח בענן Supabase (ממוצע 86.04 נק״ז וכל 11 הקורסים המושלמים).

### 4. חבילות התקנה ועדכון
- קימפול קובץ APK מעודכן (`Semestero-ME.apk`, versionCode 35, 7.84 MB).
- עדכון גרסאות והפצה לכלל הפלטפורמות (Web, Mobile APK, Desktop).
"""

    req_tag = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}", headers=headers)
    release = None
    try:
        with urllib.request.urlopen(req_tag) as res:
            release = json.loads(res.read().decode())
            print(f"[Release] Found existing release for {TAG} (id={release['id']})")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[Release] Release {TAG} does not exist yet. Creating...")
        else:
            print(f"[Release] Error checking release: {e.code} {e.reason}")
            sys.exit(1)

    if not release:
        create_payload = json.dumps({
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }).encode("utf-8")
        
        req_create = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/releases",
            data=create_payload,
            headers=headers,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req_create) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Created release {TAG} (id={release['id']})")
        except urllib.error.HTTPError as e:
            print(f"[Release] Failed to create release: {e.code} {e.reason}")
            try:
                print(e.read().decode())
            except:
                pass
            sys.exit(1)

    upload_url_template = release.get("upload_url")
    if not upload_url_template:
        print("[Release] Missing upload_url in release object")
        sys.exit(1)

    # Assets to upload
    assets = [
        (APK_PATH, "application/vnd.android.package-archive"),
        (ZIP_PATH, "application/zip"),
        (EXE_PATH, "application/octet-stream")
    ]

    for fpath, ctype in assets:
        fname = os.path.basename(fpath)
        if os.path.exists(fpath):
            delete_existing_asset_if_any(release["id"], fname, headers)
            upload_asset(upload_url_template, fpath, ctype, headers)
        else:
            print(f"[Release] Skipping missing asset: {fpath}")

    print(f"\n🎉 Release {TAG} is live at {release.get('html_url')}!")

if __name__ == "__main__":
    main()
