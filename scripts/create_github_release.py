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
VERSION = pkg.get("version", "2.11.3")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Perpetual Ditch Course-Level Refinement & Physics Attendance Fix (מצב למידה עצמית ברמת הקורס ותיקון סימון נוכחות)"

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

### 🚀 1. מצב למידה עצמית / הברזה נצחית ברמת הקורס (Course-Level Self-Study Mode & UX Hardening - ADR-108)
- **ביטול ברירת מחדל אוטומטית (Zero Default)**: כל הקורסים מתחילים במצב נוכחות פרונטלית רגילה. מצב למידה עצמית הינו החלטה מכוונת של הסטודנט לקורסים שבהם ההוראה אינה אפקטיבית ויש צורך בלמידה עצמאית.
- **העברת המתג באופן בלעדי לדף הקורס**:
  * הסרת כפתורי "למידה עצמית" מבלבלים מכרטיסיות ההרצאה הבודדות במערכת השעות (מניעת עמימות בין הברזה משיעור בודד לבין הברזה מכל הקורס).
  * הוספת מתג ייעודי, ברור ומעוצב בכרטיסיית פרטי הקורס: `🚀 מצב למידה עצמית (הברזה נצחית לקורס כולו)`.
- **כרטיסיות מערכת שעות מותאמות**:
  * קורס שהוגדר בלמידה עצמית הופך לכרטיסייה סגולה ייעודית עם תגית `🚀 למידה עצמית`, גישה ישירה בלחיצה אחת ל-`📺 פנאופטו` ו-`📖 פנגיאה`, וכפתור `⚙️ דף הקורס`.
  * קורסים רגילים מציגים באופן חד וברור את שני כפתורי הנוכחות בלבד: `✓ הייתי / נוכחתי` ו-`✗ החסרתי / הוחסר (בתור)`.
- **פטור מהתראות הגעה ואי-נוכחות**:
  * התראות כיתה (10 דקות לפני שיעור) מושתקות עבור קורסים בלמידה עצמית.
  * פטור מקנסות נוכחות במרכז הנוכחות (Attendance Hub) וניהול מרוכז בלשונית הלמידה העצמית.

### 🛡️ 2. תיקון סימון נוכחות בפיזיקה (Attendance Quote Bug Fix)
- תיקון כשל לחיצה בפיזיקה 2 (`114052`) שנגרם בשל מירכאות כפולות (גרשיים) בשם החדר (`טאוב - מדמ"ח 1`).
- מעבר לשימוש בפרמטרים פרימיטיביים בלבד (`dayIndex`, `classIndex`, `status`) ללא שרשור מחרוזות ב-HTML `onclick`.

### 📦 3. קובצי הפצה ועדכון:
- `Semestero-ME.apk` (Android Native App `versionCode 91`, `versionName 2.11.3`)
- `Semestero-ME-Watch.apk` (Wear OS Companion `versionCode 91`, `versionName 2.11.3`)
- `Semestero-ME-Windows-x64.zip` (Electron Desktop Client v2.11.3)
- כל 22 חבילות בדיקות הרגרסיה של המערכת ובדיקות הנוכחות עברו בהצלחה מלאה.
- תיעוד ארכיטקטוני מלא: [[02_Architecture_ADR/ADR-108-Perpetual-Ditch-Self-Study-Mode-And-Attendance-Quote-Hardening|ADR-108]] נרשם ב-Obsidian Second Brain.
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
