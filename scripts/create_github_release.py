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
VERSION = pkg.get("version", "2.8.2")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - CheeseFork Precision Group Matching & Safe Room Enrichment"

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

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🧀⚡

### 1. סנכרון מושלם ומדויק מול CheeseFork (Precision Group Matching)
- **פענוח מפתחות בחירה ייעודיים**: CheeseFork מקודד מפתחות קבוצה בפורמט hex UTF-16 (כגון `05d405e805e605d005d4` עבור "הרצאה", `05ea05e805d205d505dc` עבור "תרגול", ו-`sport` עבור מקצועות ספורט). המערכת מפענחת כעת את המפתחות ומצליבה כל שיעור ישירות מול הקבוצה שנבחרה עבור אותו סוג שיעור ספציפי.
- **מניעת תרגולים שלא נבחרו**: שיעור מתווסף אך ורק אם מספר הקבוצה שלו תואם לסוג השיעור שנבחר. נמנע ייבוא של קבוצות תרגול שלא נבחרו בקורסים מרובי קבוצות (כמו מכניקת מוצקים או מבוא לחישוב).
- **הגנה מלאה על הרצאות (Zero Missing Lectures)**: כלל ההרצאות שנבחרו (ובפרט הרצאת מכניקת מוצקים ביום שני 10:30-14:30) נשמרות ומסונכרנות במלואן.

### 2. העשרת חדרים בטוחה ללא דריסת שעות או סוג שיעור (Safe Room Enrichment)
- פונקציית `enrichTimetableWithAuthenticRooms` עודכנה כך שהיא משלימה אך ורק שמות חדרים ומרצים חסרים או זמניים, ומעולם לא דורסת את סוג השיעור (`type`), שעת ההתחלה (`startTime`) או שעת הסיום (`endTime`).
- הצלבת החדרים מתבצעת על פי מפתח שעה ויום מדויק (`courseId_dayIndex_startTime`), מה שמונע המרה שגויה של הרצאה לתרגול.

### 3. עדכון מערכת ברירת מחדל וטעינת נתונים
- עדכון מלא של `CHEESEFORK_SEMESTER_SCHEDULE` ו-`AUTHENTIC_TIMETABLE_METADATA` עם 12 השיעורים האותנטיים של סמסטר חורף תשפ״ז (כולל תרגול ומרצה במכניקת מוצקים, תרמודינמיקה, פיסיקה 2, מד"ח מ', מבוא לחישוב מדעי ויוגה).

### 4. קימפול חבילות והפצה
- קימפול קובץ APK מעודכן (`Semestero-ME.apk`, versionCode 38).
- בדיקות יחידה אוטומטיות מושלמות ב-`tests/cheesefork_precision_sync.test.js`.
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
