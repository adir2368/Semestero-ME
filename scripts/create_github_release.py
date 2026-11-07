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
VERSION = pkg.get("version", "2.10.11")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Technion-Wide Course Catalog Search & Dynamic Degree Planning"

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
                    print(f"[Upload] Failed with status {res.status}")
                    return False
    except urllib.error.HTTPError as e:
        print(f"[Upload] HTTPError: {e.code} {e.reason}")
        try:
            print(f"[Upload] Details: {e.read().decode()}")
        except:
            pass
        return False
    except Exception as e:
        print(f"[Upload] Exception: {e}")
        return False

def delete_existing_asset_if_any(release_id, asset_name, headers):
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/{release_id}/assets", headers=headers)
        with urllib.request.urlopen(req) as res:
            assets = json.loads(res.read().decode())
            for a in assets:
                if a["name"] == asset_name:
                    print(f"[Asset] Deleting existing asset {asset_name} (id={a['id']})...")
                    del_req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/assets/{a['id']}", headers=headers, method="DELETE")
                    with urllib.request.urlopen(del_req) as del_res:
                        print(f"[Asset] Deleted {asset_name}")
                    break
    except Exception as e:
        print(f"[Asset] Warning deleting asset: {e}")

def main():
    token = get_github_token()
    if not token:
        print("Error: No GitHub token found.")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Semestero-Release-Script"
    }

    body_notes = f"""# Semestero ME {TAG} Release Notes

### 1. חיפוש בכלל קורסי הטכניון לתכנון תואר (Technion-Wide Catalog Search)
- **מאגר רזה ללא עומס כברירת מחדל**: מאגר הקורסים נשאר ממוקד ומהיר עם קורסי תוכנית הלימודים וחובות חסרות בלבד, מבלי להציף אלפי קורסים.
- **חיפוש חי בכל 2,784 קורסי הטכניון**: הקלדת חיפוש (לפי שם או מספר כגון 234124, מדעי המחשב, איטלקית, שחייה, כלכלה) סורקת בזמן אמת את כלל הפקולטות בטכניון ומציגה את הקורסים התואמים.
- **תיוג ושיבוץ בסמסטרים**: תיוג ייעודי (`🌐 בחירה חופשית`, `🏃 ספורט`, `🎭 מל״ג`) עם שם הפקולטה והנק"ז, ושיבוץ מיידי בכל סמסטר בלחיצה על `+` או גרירה.
- **שקלול מלא בכללי סיום התואר וסימולטור הממוצע**: הקורסים נספרים אוטומטית במכסת הנק"ז לתואר (157.5) ובמכסת הבחירה החופשית (12.0).

### 1. תיקון אי-הופעת משימות ידניות בלוח המשימות (Manual Task Disappearance Fix)
- **הפרדת קטגוריות טוקנים קנוניים**: הוטמעה הבחנה קנונית מוחלטת ב-`moodle_sync.js::getCanonicalTaskToken` עבור מטלות אלקטרוניות, לומדות SCORM, שאלוני WebWork ומבחנים מקוונים (`hw_digital`) לעומת שיעורי בית רגילים (`hw`) והגשות פתרון בכתב (`hw_written`). מנענו כפילות שגויה שמחקה משימות שהוזנו ידנית.
- **עדיפות קשיחה לכותרת ידנית**: במיזוג משימות (`mergeTaskPair`), כותרת ופרטי משימה ידנית מקבלים עדיפות מוחלטת על פני שמות ברירת מחדל של קורסים.
- **תאימות סינון ארגונית**: הרחבת סינון `hw` בארגונית++ לקבלת `webwork`, `hw_digital`, ו-`hw_written`.
- **הכללת קורסים עם משימות בסינון**: קורסים המכילים משימות ידניות או ממתינות מוצגים אוטומטית בבורר הקורסים והסמסטרים בטבלה.

### 2. סנכרון תרגיל אלקטרוני ולומדות SCORM במד"ח (104228)
- סנכרון ישיר של `תרגיל אלקטרוני 1 - סיווג מד"ח (חבילת לומדה - SCORM)` עם תאריך הגשה רשמי: יום שני, 9 בנובמבר 2026, 23:59 וקישור ישיר למודל 26 (`id=95378`).

### 3. מנוע בדיקת גרסה רב-מקורית (Multi-Source Highest Semver Version Check)
- החלפת התלות היחידה ב-`releases/latest` בבדיקה מרובת מקורות (GitHub Contents API `package.json`, Raw CDN, Local Origin, GitHub Releases API) ובחירת הגרסה הגבוהה ביותר באופן אוטונומי.
- ביטול קפיצה ויזואלית ל-2.10.2 וסנכרון מלא של כל תגיות הגרסה ב-DOM ל-`{TAG}`.

### 4. קבצי הפצה:
- `Semestero-ME.apk` (Android `versionCode 66`)
- `Semestero ME-win32-x64` (Electron Desktop Client)
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
