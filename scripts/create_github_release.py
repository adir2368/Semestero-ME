import os
import sys
import json
import urllib.request
import urllib.error
import subprocess
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "adir2368/Semestero-ME"
APK_PATH = os.path.join(ROOT, "Semestero-ME.apk")

with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as f:
    pkg = json.load(f)
VERSION = pkg.get("version", "2.5.4")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Sports Sub-Tracks & Schedule Conflict Engine"

def get_github_token():
    try:
        p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out, _ = p.communicate(input="protocol=https\nhost=github.com\n\n")
        m = re.search(r'password=(.+)', out)
        if m:
            return m.group(1).strip()
    except Exception as e:
        print("[Release] Error getting credentials from git:", e)
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        return token
    print("[Release] Error: No GitHub token found.")
    sys.exit(1)

def main():
    token = get_github_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🏃📅

### 1. בחירת חוגים ותתי-מסלולים בספורט (Approach A)
- תמיכה מלאה בפיצול קורסי חינוך גופני כלליים לחוגים מעשיים ספציפיים:
  - **פילאטיס ומתיחות (03940808)**: פילאטיס מכשירים, פילאטיס מזרן, פילאטיס דינמי ועיצוב, מתיחות וגמישות.
  - **חדר כושר ו-TRX (03940800)**: אימון חדר כושר, רצועות TRX, ספינינג ורכיבה.
  - **משחקי כדור (03940803)**: כדורסל, כדורעף, כדורגל / קטרגל.
  - **משחקי מחבט (03940804)**: טניס, טניס שולחן, בדמינטון.
  - **יוגה ואתלטיקה (03940805)**: ויניאסה יוגה, האטה יוגה, אשטנגה, אתלטיקה.
  - **שחייה (03940802)**, **קרב מגע (03940806)**, **תנועה ומחול (03940820)**, **נבחרות אס״א (03940902)**.

### 2. מנוע בדיקת התנגשויות לו״ז חי (Live Timetable Conflict Checker)
- **חובת נוכחות מובנית**: זיהוי אוטומטי של שעות החוג מול כל קורסי הסמסטר המשובצים.
- **חיווי גרפי מיידי**:
  - 🟢 **פנוי במערכת השעות** (ללא התנגשויות)
  - 🟡 **חפיפה אפשרית** (קיימת קבוצה חלופית בקורס)
  - ⚠️ **התנגשות ודאית** (חופף לקבוצה מעוגנת או קורס חד-קבוצתי)
- **קישור ישיר לסטודיו מערכת השעות**: מעבר בלחיצה אחת ל-Timetable Studio.

### 3. קורסי מל״ג (מדעי הרוח והחברה)
- חיווי מועד קבוע עם חובת נוכחות (יום, שעות וחדר) בכרטיס הקורס ובמאגר הבחירה.

---
### 📲 הורדה ישירה לאנדרואיד (Direct APK Download):
הקובץ `Semestero-ME.apk` מצורף להלן להורדה והתקנה ישירה.
"""

    # Check existing release
    url_tag = f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}"
    req_tag = urllib.request.Request(url_tag, headers=headers)
    release = None
    try:
        with urllib.request.urlopen(req_tag) as res:
            if res.status == 200:
                release = json.loads(res.read().decode('utf-8'))
                print(f"[Release] Found existing release for tag {TAG}")
    except urllib.error.HTTPError as e:
        if e.code != 404:
            print(f"[Release] Error checking existing release: {e}")

    if not release:
        print(f"[Release] Creating new release for tag {TAG}...")
        url_create = f"https://api.github.com/repos/{REPO}/releases"
        payload = {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }
        data = json.dumps(payload).encode('utf-8')
        req_create = urllib.request.Request(url_create, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req_create) as res:
                release = json.loads(res.read().decode('utf-8'))
                print(f"[Release] Created release ID: {release['id']}")
        except urllib.error.HTTPError as e:
            print(f"[Release] Error creating release: {e.code} - {e.read().decode('utf-8')}")
            sys.exit(1)

    # Upload APK asset
    if not os.path.exists(APK_PATH):
        print(f"[Release] Error: APK not found at {APK_PATH}")
        sys.exit(1)

    apk_size = os.path.getsize(APK_PATH)
    print(f"[Release] Uploading Semestero-ME.apk ({apk_size:,} bytes)...")

    # Delete existing asset if present
    for asset in release.get("assets", []):
        if asset["name"] == "Semestero-ME.apk":
            print(f"[Release] Deleting old asset ID: {asset['id']}...")
            del_req = urllib.request.Request(asset["url"], headers=headers, method="DELETE")
            try:
                with urllib.request.urlopen(del_req) as res:
                    print(f"[Release] Old asset deleted.")
            except Exception as e:
                print(f"[Release] Warning deleting old asset: {e}")

    upload_url_template = release["upload_url"]
    upload_url = upload_url_template.split("{")[0] + "?name=Semestero-ME.apk"

    with open(APK_PATH, "rb") as f:
        apk_data = f.read()

    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": str(len(apk_data)),
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    req_upload = urllib.request.Request(upload_url, data=apk_data, headers=upload_headers, method="POST")
    try:
        with urllib.request.urlopen(req_upload) as res:
            asset_info = json.loads(res.read().decode('utf-8'))
            print(f"[Release] Successfully uploaded APK asset ID: {asset_info['id']}")
            print(f"[Release] Download URL: {asset_info['browser_download_url']}")
    except urllib.error.HTTPError as e:
        print(f"[Release] Error uploading APK asset: {e.code} - {e.read().decode('utf-8')}")
        sys.exit(1)

    print(f"\nSUCCESS: Release {TAG} published and APK uploaded!")

if __name__ == "__main__":
    main()
