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
NAME = f"Semestero ME v{VERSION} - Tasks Multi-Selection, Parallel Duplicate & Delete, Move to Course & Notion Context Menu"

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

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀⚡📋
    
### 1. שדרוג תיבת הסימון בלוח המשימות לבחירה מרובה (Tasks Multi-Selection Checkbox)
- **המרת תיבת הסימון לבחירה מלאה**: תיבת הסימון בלוח המשימות שונתה מסימון השלמה לבחירת משימה (Selection Checkbox). סטטוס המשימה מנוהל באופן אינטראקטיבי דרך עמודת הסטטוס (כפתורי Notion), בעוד שתיבת הסימון מאפשרת כעת בחירת שורות מרובות במקביל.
- **תמיכה ב-Shift+Click לבחירת טווח**: בחירת עשרות משימות לאורך סמסטר בשני קליקים בלבד.
- **תיבת סימון ראשית בכותרת (Select All)**: כפתור בחר הכל בראש הטבלה התומך במצבי checked, unchecked ומצב ביניים (indeterminate).
- **הדגשה חזותית אלגנטית**: שורות שנבחרו מקבלות רקע סגול זוהר (`rgba(147, 51, 234, 0.16)`) ופס אינדיקציה שמאלי סגול (`box-shadow: inset 3px 0 0 #a855f7`).

### 2. סרגל פעולות מרובות צף (Floating Glassmorphic Bulk Actions Bar)
- **עיצוב זכוכית יוקרתי ומודרני**: סרגל צף תחתון עם טשטוש זכוכית (`backdrop-filter: blur(20px)`), אפקט סלייד-אפ חלק, וממשק מותאם מובייל ודסקטופ.
- **שכפול משימות במקביל (Duplicate)**: שכפול של מספר משימות בלחיצה אחת עם יצירת מזהים ייחודיים ותוספת `(העתק)`.
- **העברה בין קורסים (Move to Course...)**: חלון העברה ייעודי המאפשר להעביר את כל המשימות שנבחרו ישירות לקורס אחר בלחיצה אחת.
- **מחיקה במקביל (Move to Trash / Del)**: מחיקת מספר משימות בו-זמנית עם אישור מוגן.
- **סימון כהושלם במקביל (Mark as Done)**: עדכון סטטוס מרוכז של כל המשימות שנבחרו ל-Done.
- **ביטול בחירה מיידי (Cancel)**: איפוס מהיר של כל הבחירות.

### 3. תפריט הקשר Notion Context Menu בלחיצה ימנית (Right-Click Context Menu)
- **דיוק מושלם לפי צילום המסך של המשתמש**: תפריט Dark Theme בעיצוב נקי עם גבולות עדינים, אנימציית Fade-in מהירה, ואינדיקטורי מקשים:
  - `Duplicate` (`Ctrl+D`)
  - `Move to` (`Ctrl+⇧+P`)
  - `Move to Trash` (`Del`)
- **תמיכה מלאה בקיצורי מקלדת עולמיים**:
  - `Ctrl+D` (או `Ctrl+ג` בעברית) לשכפול המשימות שנבחרו.
  - `Ctrl+Shift+P` (או `Ctrl+Shift+פ` בעברית) להעברת משימות לקורס אחר.
  - `Delete` / `Backspace` למחיקת המשימות שנבחרו.
  - `Esc` לסגירת התפריט ואיפוס הבחירה.
- **אינטגרציה מלאה בחלון Side Peek**: כפתורי שכפול ומחיקה ישירים נוספו גם לסרגל הצדדי של המשימה.

### 4. שיפורי יציבות, ביצועים ומנוע קיצורי הדרך (v2.6.4 Baseline Inclusion)
- מנוע קיצורי מקלדת מתקדם דו-לשוני (עברית ואנגלית).
- גשר אנדרואיד טבעי לסנכרון מטלות מודל מהטכניון ללא CORS.
- דשבורד סטטיסטיקה ומדדי שימוש מאובטח לחשבון אדיר משה בלבד.
- הסרה מוחלטת של כפתור ההתחברות המהירה מחלון ההתחברות הציבורי.

---
### 📲 הורדות ישירות (Direct Downloads):
- 🤖 **Android APK:** [Semestero-ME.apk](https://github.com/adir2368/Semestero-ME/releases/download/v{VERSION}/Semestero-ME.apk)
- 💻 **Windows Desktop (חבילה ניידת מלאה - מומלץ):** [Semestero-ME-Windows-x64.zip](https://github.com/adir2368/Semestero-ME/releases/download/v{VERSION}/Semestero-ME-Windows-x64.zip)
- 🖥️ **Windows Executable:** [Semestero-ME.exe](https://github.com/adir2368/Semestero-ME/releases/download/v{VERSION}/Semestero-ME.exe)
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
