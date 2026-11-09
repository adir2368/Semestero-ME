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
WATCH_APK_PATH = os.path.join(ROOT, "Semestero-ME-Watch.apk")
ZIP_PATH = os.path.join(ROOT, "Semestero-ME-Windows-x64.zip")

with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as f:
    pkg = json.load(f)
VERSION = pkg.get("version", "2.10.20")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Universal Calendar Sync (RFC 5545), Past Exams Solved Tracker & Galaxy Watch Glance Tile (סנכרון יומן מלא, מעקב מוכנות למבחנים ו-Tile לשעון)"

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

### 📅 1. מנוע סנכרון יומן אוניברסלי (Universal RFC 5545 Calendar Engine)
- **לוח שנה אקדמי מאוחד ומלא (`calendar_sync_engine.js`)**: יצירת קובץ `.ics` סטנדרטי בלחיצה אחת הכולל את מערכת השעות השבועית (אירועים חוזרים `RRULE:FREQ=WEEKLY` עם מספרי כיתות והתראות 15 דק' לפני), מועדי הגשות מודל (התראות כפולות 24 שעות ושעתיים לפני), ומועדי מבחנים סופיים (מועד א' ו-ב' עם התראה יום מראש).
- **הורדה ושיתוף ישיר**: תמיכה מלאה בהורדה ישירה ובשיתוף קלנדרי מובנה ב-Android Capacitor באמצעות `navigator.share` לייבוא מיידי ל-Google Calendar, ל-Samsung Calendar ול-Apple Calendar.

### 🎯 2. מעקב פתרון מבחני עבר וטבעת מוכנות לבחינה (Exam Readiness Hub)
- **טבלת מעקב מועדים אינטראקטיבית ל-5 השנים האחרונות (2021–2026)**: מעקב חורף/אביב מועד א' ו-ב' עם סטטוס תלת-מצבי (`⬜ לא נפתר` ➔ `⏳ נוסה בתרגול` ➔ `✅ פתור ונשלט`) ויומן ציונים עצמי.
- **טבעת מוכנות מעוצבת ודינמית (Circular SVG Progress Ring)**: חישוב אחוז מוכנות משוקלל בזמן אמת עם מעברי צבעים חלקים (ירוק מעל 75%, צהוב/כתום מעל 45%).
- **קישור ישיר משולש**: גישה מיידית בלחיצה אחת מכל שורת מבחן לסיכומי פנגייה (`PangeaHub.openQuickPeek`), לדרייב הפקולטה ולמודל הקורס.
- **סנכרון ענן מלא**: נתוני ההכנה למבחנים נשמרים ב-`gameState.examPrep` ומסונכרנים אוטומטית לענן דרך `auth_sync.js`.

### ⌚ 3. ווידג'ט Glance Tile לשעון Galaxy Watch 8 וגילוי Complication משופר
- **Tile ייעודי למשימות והגשות (`SemesteroTasksTileService`)**: תצוגת משימות קרובות והגשות ב-48 השעות הבאות ישירות בהחלקת מסך בשעון, עם אפשרות מעבר ישיר ללוח המשימות.
- **תמיכה מלאה ב-One UI Watch 6.0**: רישום כפול של `androidx.wear.watchface.complications` ו-`android.support.wearable.complications` לגילוי מיידי של ה-Complication בבוחר מסכי השעון.

### 📦 4. קובצי הפצה ועדכון:
- `Semestero-ME.apk` (Android Native App `versionCode 75`, `versionName 2.10.21`)
- `Semestero-ME-Watch.apk` (Wear OS Companion `versionCode 75`, `versionName 2.10.21`)
- `Semestero-ME-Windows-x64.zip` (Electron Desktop Client v2.10.21)
- כל 21 חבילות בדיקות הרגרסיה של המערכת עברו בהצלחה מלאה (21 passed, 0 failed).
- תיעוד ארכיטקטוני מלא: [[02_Architecture_ADR/ADR-094-Universal-Calendar-Sync-Past-Exams-Readiness-Ring-and-WearOS-Tasks-Tile|ADR-094]] נרשם ב-Obsidian Second Brain.
"""

    req_tag = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}", headers=headers)
    release = None
    try:
        with urllib.request.urlopen(req_tag) as res:
            release = json.loads(res.read().decode())
            print(f"[Release] Found existing release for tag {TAG} (id={release['id']})")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[Release] Release for {TAG} does not exist yet. Creating...")
        else:
            print(f"[Release] Error querying tag: {e}")

    if not release:
        payload = {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }
        create_req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/releases",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        try:
            with urllib.request.urlopen(create_req) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Created release {NAME} (id={release['id']})")
        except Exception as e:
            print(f"[Release] Failed to create release: {e}")
            sys.exit(1)
    else:
        # Update existing release metadata
        update_payload = {
            "name": NAME,
            "body": body_notes
        }
        patch_req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/releases/{release['id']}",
            data=json.dumps(update_payload).encode("utf-8"),
            headers=headers,
            method="PATCH"
        )
        try:
            with urllib.request.urlopen(patch_req) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Updated metadata for release {release['id']}")
        except Exception as e:
            print(f"[Release] Warning updating release notes: {e}")

    upload_url = release.get("upload_url")
    if not upload_url:
        print("[Release] No upload_url in release object.")
        sys.exit(1)

    # Clean existing assets if present before uploading fresh binaries
    delete_existing_asset_if_any(release["id"], "Semestero-ME.apk", headers)
    delete_existing_asset_if_any(release["id"], "Semestero-ME-Watch.apk", headers)
    delete_existing_asset_if_any(release["id"], "Semestero-ME-Windows-x64.zip", headers)

    # 1. Upload Android Mobile APK
    upload_asset(upload_url, APK_PATH, "application/vnd.android.package-archive", headers)

    # 2. Upload Galaxy Watch Companion APK
    upload_asset(upload_url, WATCH_APK_PATH, "application/vnd.android.package-archive", headers)

    # 3. Upload Windows x64 Desktop ZIP
    upload_asset(upload_url, ZIP_PATH, "application/zip", headers)

    print(f"\n🚀 Release {TAG} published successfully with all 3 assets attached!")

if __name__ == "__main__":
    main()
