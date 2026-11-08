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
VERSION = pkg.get("version", "2.10.17")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Pangea Knowledge Hub, Smart HW Resolver & In-App Reader"

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

### 🏛️ 1. אינטגרציית עומק לפנגייה (Pangea Knowledge Hub - idofangbentov.uk)
- **קורא פנימי מהיר (In-App Quick Peek Reader)**: צפייה ישירה בסיכומי הרצאות, תרגולים ומבחנים של פנגייה בתוך מודאל אלגנטי באפליקציה, עם ספינר טעינה, כרטיס גיבוי מובנה וכפתור ישיר `פתח באתר המקורי ↗` למעבר מהיר לדפדפן חיצוני בכל עת.
- **מפענח שיעורי בית חכם (Smart Homework Deep-Linking Resolver)**: מיפוי אוטומטי של מספרי קורסים ומספרי תרגילים (למשל 'תרגיל בית 5' בדינמיקה 034010) לקבצי הפתרון הספציפיים בפנגייה (`DYN1_HW005`), עם כפתור מיוחד `📝 פתרון בפנגייה ↗` בלוח המטלות ובמגירת ה-Peek Drawer.
- **קטלוג מבחנים מלא ומקיף**: הצגה כרונולוגית של כל המבחנים הפתורים בפנגייה ללא סינון עונתי, המאפשרת גישה מיידית לכל המועדים לקראת תקופת המבחנים.
- **חיפוש גלובלי לפי נושא ומילת מפתח (Topic & Keyword Live Search)**: מודאל חיפוש מהיר המאפשר איתור נושאים ספציפיים (כגון 'ברנולי', 'נאויה-סטוקס', 'אוילר') ישירות בתוכן פנגייה בכל 38 הקורסים.

### 📦 2. קבצי הפצה:
- `Semestero-ME.apk` (Android `versionCode 71`, `versionName 2.10.17`)
- `Semestero-ME-Watch.apk` (Wear OS Companion `versionCode 71`, `versionName 2.10.17`)
- `Semestero-ME-Windows-x64.zip` (Electron Desktop Client v2.10.17)
- סנכרון מלא של כל הנכסים ב-GitHub Pages ודומיין `https://semestero.me`
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
        print(f"[Release] Creating new GitHub release for {TAG}...")
        create_payload = {
            "tag_name": TAG,
            "target_commitish": "main",
            "name": NAME,
            "body": body_notes,
            "draft": False,
            "prerelease": False
        }
        create_req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/releases",
            data=json.dumps(create_payload).encode(),
            headers=headers,
            method="POST"
        )
        try:
            with urllib.request.urlopen(create_req) as res:
                release = json.loads(res.read().decode())
                print(f"[Release] Created release id={release['id']} ({release['html_url']})")
        except urllib.error.HTTPError as e:
            print(f"[Release] Failed to create release: {e.code} {e.reason}")
            try:
                print(f"[Release] Details: {e.read().decode()}")
            except:
                pass
            sys.exit(1)

    upload_url = release.get("upload_url")
    if not upload_url:
        print("Error: No upload_url in release object.")
        sys.exit(1)

    # 1. Upload APK
    if os.path.exists(APK_PATH):
        delete_existing_asset_if_any(release["id"], "Semestero-ME.apk", headers)
        upload_asset(upload_url, APK_PATH, "application/vnd.android.package-archive", headers)
    else:
        print(f"[Warning] APK not found at {APK_PATH}")

    # 2. Upload Windows ZIP if exists
    if os.path.exists(ZIP_PATH):
        delete_existing_asset_if_any(release["id"], "Semestero-ME-Windows-x64.zip", headers)
        upload_asset(upload_url, ZIP_PATH, "application/zip", headers)
    elif os.path.exists(EXE_PATH):
        dist_dir = os.path.dirname(EXE_PATH)
        print(f"[Zip] Creating {ZIP_PATH} from {dist_dir}...")
        try:
            subprocess.run([
                "tar", "-a", "-c", "-f", ZIP_PATH, "-C", dist_dir, "."
            ], check=True)
            if os.path.exists(ZIP_PATH):
                delete_existing_asset_if_any(release["id"], "Semestero-ME-Windows-x64.zip", headers)
                upload_asset(upload_url, ZIP_PATH, "application/zip", headers)
        except Exception as e:
            print(f"[Zip] Failed to compress desktop build: {e}")

    print(f"\n🎉 Successfully created/updated GitHub release {TAG}!")
    print(f"🔗 Release URL: {release['html_url']}")

if __name__ == "__main__":
    main()
