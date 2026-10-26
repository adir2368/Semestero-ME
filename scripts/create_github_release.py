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
VERSION = pkg.get("version", "2.6.2")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Main Windows First Tour, Transition Delay, Bottom Bar Protection & Guest Privacy"

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

def upload_asset(release, token, file_path, asset_name, content_type):
    if not os.path.exists(file_path):
        print(f"[Release] Warning: File {file_path} not found. Skipping.")
        return None

    file_size = os.path.getsize(file_path)
    print(f"[Release] Uploading {asset_name} ({file_size / (1024*1024):.2f} MB)...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    # Delete existing asset if present
    for asset in release.get("assets", []):
        if asset["name"] == asset_name:
            print(f"[Release] Deleting old asset {asset_name} (id={asset['id']})...")
            del_req = urllib.request.Request(asset["url"], headers=headers, method="DELETE")
            try:
                with urllib.request.urlopen(del_req) as del_res:
                    print(f"[Release] Old asset {asset_name} deleted.")
            except Exception as e:
                print(f"[Release] Warning: Could not delete old asset {asset_name}:", e)

    upload_url = release["upload_url"].split("{")[0] + f"?name={urllib.parse.quote(asset_name)}"
    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": content_type,
        "Content-Length": str(file_size),
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    with open(file_path, "rb") as f:
        data = f.read()

    req_upload = urllib.request.Request(upload_url, data=data, headers=upload_headers, method="POST")
    try:
        with urllib.request.urlopen(req_upload) as res:
            uploaded = json.loads(res.read().decode())
            print(f"[Release] {asset_name} uploaded successfully! URL: {uploaded.get('browser_download_url')}")
            return uploaded.get("browser_download_url")
    except urllib.error.HTTPError as e:
        print(f"[Release] Error uploading {asset_name}: {e.code} {e.reason}")
        print(e.read().decode())
        return None

def main():
    token = get_github_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🧭🛡️
    
### 1. הצגת כל 6 החלונות המרכזיים תחילה בסיור המודרך (Main Windows First Tour)
- **סדר מסלול לוגי ומקיף**: הסיור פותח במעבר שלב-אחר-שלב בין כל ששת חלונות הליבה של סמסטרו לפי הסדר הטבעי:
  1. **מפת קורסים (Curriculum Tree)** - עץ הקדמים הפקולטי והארת שרשרת דרישות.
  2. **תכנון תואר (Degree Planner)** - שיבוץ רב-סמסטריאלי, ניהול עומסים ובדיקת זכאות ל-157.5 נק״ז.
  3. **לוח משימות (Tasks Board)** - ניהול מטלות בסגנון Notion, בחירה מרובה וסנכרון Moodle.
  4. **לוח שנה אקדמי (Academic Calendar)** - לוח מועדי בחינות, זמני סמסטר ומעקב חופשות.
  5. **מערכת שעות שבועית (Timetable Studio)** - מחולל קומבינציות וסנכרון CheeseFork.
  6. **הגדרות וגיבוי (Settings & Cloud Backup)** - הורדות למחשב ולנייד, גיבוי מקומי וענן.
  - בסיום 6 החלונות המרכזיים מודגמים כלי העל: **שורת פקודות חכמה (Ctrl+K)** ו**מדריך זכויות אקדמיות ויועץ מילואים**.

### 2. השהיית מעבר מודעת (750ms Transition HUD) והארת טאב פעיל
- **השהיית מעבר מכוונת**: בעת מעבר בין חלונות, המערכת מציגה באנר HUD צף יוקרתי (`🧭 עובר לחלון: ...`) וממתינה 750ms כדי שהסטודנט ישים לב בדיוק לאיזה עמוד הוא הגיע.
- **הדגשת טאב בסרגל הניווט (`tour-nav-tab-active-glow`)**: הטאב של החלון הנוכחי בסרגל מקבל פעימת ניאון זוהרת כדי שהסטודנטים יקשרו מיד בין התוכן למיקומו בסרגל.

### 3. הגנה מפני הסתרת סרגל החלונות (Bottom Bar Collision Protection)
- חישוב גובה סרגל הניווט התחתון (`.nav-tabs-left`) בזמן אמת והגדרת מרווח ביטחון קפדני (`safeBottomClearance = 76px+`).
- היפוך אוטומטי של בועת הטקסט כלפי מעלה (`placement: 'top'`) כאשר יש חשש להסתרה.
- סרגל החלונות שומר על נראות ואינטראקטיביות 100% לאורך כל הסיור (`z-index: 99998`).
- תג כותרת ייעודי בבועה: `📍 חלון נוכחי: [שם החלון] ([מספר] מתוך 6)`.

### 4. פרטיות והסרת קישורים אישיים עבור אורחים (Guest Privacy Sanitization)
- ביקורת עומק וטיהור כל הקישורים והטוקנים של אדיר עבור משתמשי אורח ולא מחוברים:
  - הקישור ל-CheeseFork פותח סמסטר גנרי נקי (`?semester=202601`) ללא ה-UID האישי.
  - סנכרון לוח שנה Webcal Gist נשאר חסוי ואינו מוצג או מועתק כלל למשתמשים שאינם אדיר.
  - הסרת טוקנים וכתובות Moodle אישיות מקבצי ה-JSON ומצב המערכת.

### 5. הפעלת סיור אך ורק בסיום הרשמה או דרך הגדרות
- הסיור לעולם אינו קופץ אוטומטית בהפעלת האפליקציה למשתמשים מחוברים.
- מופעל אך ורק בסיום תהליך ההרשמה (Onboarding) או בלחיצה ידנית על כפתור הסיור בהגדרות/מרכז ההדרכה (או מקש T)."""

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
        create_url = f"https://api.github.com/repos/{REPO}/releases"
        payload = {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }
        req_create = urllib.request.Request(create_url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req_create) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Created release {TAG} successfully (id={release['id']})")
        except urllib.error.HTTPError as e:
            print(f"[Release] Error creating release: {e.code} {e.reason}")
            print(e.read().decode())
            sys.exit(1)
    else:
        # Update existing release body notes to include desktop links
        update_url = f"https://api.github.com/repos/{REPO}/releases/{release['id']}"
        payload = {
            "name": NAME,
            "body": body_notes
        }
        req_update = urllib.request.Request(update_url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="PATCH")
        try:
            with urllib.request.urlopen(req_update) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Updated release notes for {TAG} (id={release['id']})")
        except urllib.error.HTTPError as e:
            print(f"[Release] Error updating release notes: {e.code} {e.reason}")

    # Upload all assets
    print("\n--- Uploading Release Assets ---")
    upload_asset(release, token, APK_PATH, "Semestero-ME.apk", "application/vnd.android.package-archive")
    upload_asset(release, token, ZIP_PATH, "Semestero-ME-Windows-x64.zip", "application/zip")
    upload_asset(release, token, EXE_PATH, "Semestero-ME.exe", "application/vnd.microsoft.portable-executable")

    print("\nAll assets processed successfully!")

if __name__ == "__main__":
    main()
