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
VERSION = pkg.get("version", "2.5.8")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Physics Tracks, Formula SAE & Atuda Tironut"

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

    body_notes = f"""## מה חדש בגרסה v{VERSION} 🚀🏎️🪖

### 1. מסלולי פיזיקה 1 ופיזיקה 2 (Physics 1 & 2 Flexibility)
- **עדכון נק״ז פיזיקה 1 (114051)**: עודכן ל-**2.5 נק״ז** מדויק ותקני בכל חלקי המערכת, קטלוגי התואר ומאגרי הקורסים.
- **הקדמת פיזיקה 2 לסמסטר 2**: תמיכה מלאה בסטודנטים שעושים פיסיקה 1 בסמסטר 1 ופיסיקה 2 (114052 / 114075) בסמסטר 2:
  - זמין לסימון כבר במסך ההרשמה (Onboarding) עבור סמסטרים מתקדמים.
  - כפתור "הוסף קורס" מאפשר עדכון חלק של קורסים קיימים בעץ ושיוכם לסמסטר מוקדם ללא שגיאת כפילות.
  - תיקון מנגנון ה-Mutual Exclusion (ביטול החסימה ההדדית השגויה בין פיזיקה 1 לפיזיקה 2).
  - שחזור וסנכרון קבוע של פיזיקה 1 בסמסטר 1 ופיזיקה 2 בסמסטר 3 בתכנון התואר.

### 2. עתודאים - הכרה בטירונות (2 נק״ז בינארי לתואר)
- **מתג ייעודי בתכנון התואר**: הוספת מתג `🪖 טירונות עתודאים` המזכה ב-2 נק״ז בינאריות (ציון עובר) כבחירה חופשית/מל״ג שאינן משפיעות על הממוצע.
- **צ'קבוקס עתודאי מהיר בהרשמה**: מאפשר לסטודנטים עתודאים להזין את הטירונות באופן מיידי בעת יצירת החשבון.
- **קורס רשמי במאגר**: קורס `00920001` / `920001` במאגר ובקטלוג הקיץ.

### 3. נבחרת הפורמולה של הטכניון (Technion Formula SAE)
הכרה אקדמית מלאה בשני מסלולי הפעילות בנבחרת:
- **מסלול בחירה חופשית (סמסטר 1 ואילך)**:
  - היקף: 1 נק״ז לסמסטר פעיל כבחירה חופשית (`00340091`, `00340092`, `00340093`).
  - פתוח לסטודנטים בכל השלבים, כולל סמסטרים 1 ו-2 (ציון בינארי).
- **מסלול פרויקט תכן הנדסי (שנה ד׳)**:
  - היקף: 6 נק״ז סה״כ בחלוקה של 3 בסמסטר א׳ ו-3 בסמסטר ב׳ (`00340384`, `00340385`).
  - סוגר במלואו את חובת פרויקט הגמר הפקולטי במכונות (ציון מספרי לתואר).

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

    # Upload APK asset
    if not os.path.exists(APK_PATH):
        print(f"[Release] Warning: APK file {APK_PATH} not found. Skipping APK upload.")
        return

    apk_size = os.path.getsize(APK_PATH)
    apk_name = "Semestero-ME.apk"
    print(f"[Release] Uploading {apk_name} ({apk_size / (1024*1024):.2f} MB)...")

    # Check existing assets to delete if already present
    for asset in release.get("assets", []):
        if asset["name"] == apk_name:
            print(f"[Release] Deleting old asset {asset['id']}...")
            del_req = urllib.request.Request(asset["url"], headers=headers, method="DELETE")
            try:
                with urllib.request.urlopen(del_req) as del_res:
                    print("[Release] Old asset deleted.")
            except Exception as e:
                print("[Release] Could not delete old asset:", e)

    upload_url = release["upload_url"].split("{")[0] + f"?name={apk_name}"
    upload_headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": str(apk_size),
        "User-Agent": "Semestero-ME-Release-Agent"
    }

    with open(APK_PATH, "rb") as f:
        apk_bytes = f.read()

    req_upload = urllib.request.Request(upload_url, data=apk_bytes, headers=upload_headers, method="POST")
    try:
        with urllib.request.urlopen(req_upload) as res:
            uploaded = json.loads(res.read().decode())
            print(f"[Release] APK uploaded successfully! Browser download url: {uploaded.get('browser_download_url')}")
    except urllib.error.HTTPError as e:
        print(f"[Release] Error uploading APK: {e.code} {e.reason}")
        print(e.read().decode())
        sys.exit(1)

if __name__ == "__main__":
    main()
