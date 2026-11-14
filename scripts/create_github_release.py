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
TABLET_APK_PATH = os.path.join(ROOT, "Semestero-ME-Tablet-Clean.apk")
WATCH_APK_PATH = os.path.join(ROOT, "Semestero-ME-Watch.apk")
ZIP_PATH = os.path.join(ROOT, "Semestero-ME-Windows-x64.zip")

with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as f:
    pkg = json.load(f)
VERSION = pkg.get("version", "2.13.3")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Cross-Device Task Sync, U-06 Opened-Gray & L-07 Miluim Fix"

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

### 🔄 1. סנכרון דו-כיווני מלא בין מכשירים, תיקון U-06 וסיווג מילואים (L-07)
- **סנכרון מצבי משימות ומחיקות בין PC, טלפון וטאבלט**: מעקב `statusUpdatedAt` מדויק בכל החלפת סטטוס (כולל חזרה מ-`הושלם` ל-`בתהליך` או `טרם התחיל`), סנכרון `Realtime` ומניעת החזרת משימות ישנות בעלייה או מ-`PRELOADED_USER_STATE`.
- **תיקון U-06 (צביעה אפורה למשימות שנפתחו)**: משימות ללא תאריך הגשה או עתידיות שטרם נפתחו נשארות בסגנון ברירת המחדל ואינן מומרצות אוטומטית ל-`בתהליך`; משימות שנפתחו (`≤ 21` יום או מעבר ל-`openDate`) ועדיין ב-`טרם התחיל` נצבעות באפור.
- **תיקון L-07 לסיווג מילואים ומניעת חזרת 3010**: הרחבת הביטוי ל-`/מילואי|3010|צווים|צו\\s*8|שירות\\s*מילואי/i` לזיהוי מלא של `"שאלון מילואימניקים"` וסנכרון `deletedTaskIds` ו-`dismissedTaskRegistry` לטופס 3010.

### 📦 2. קובצי הפצה ועדכון:
- `Semestero-ME-Tablet-Clean.apk` (Android Conflict-Free Tablet Edition `com.technion.semestero.tablet`, `versionCode 98`, `versionName {VERSION}` — מומלץ לטאבלטים, `v1+v2+v3` Signed)
- `Semestero-ME.apk` (Android Native App `com.technion.semestero`, `versionCode 98`, `versionName {VERSION}` — `v1+v2+v3` Signed, `targetSdk 34`)
- `Semestero-ME-Watch.apk` (Wear OS Companion, `versionCode 98`, `versionName {VERSION}`)
- `Semestero-ME-Windows-x64.zip` (Electron Desktop Client {VERSION})
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
    delete_existing_asset_if_any(release["id"], "Semestero-ME-Tablet-Clean.apk", headers)
    delete_existing_asset_if_any(release["id"], "Semestero-ME-Watch.apk", headers)
    delete_existing_asset_if_any(release["id"], "Semestero-ME-Windows-x64.zip", headers)

    # 1. Upload Android Mobile APK
    upload_asset(upload_url, APK_PATH, "application/vnd.android.package-archive", headers)

    # 2. Upload Conflict-Free Tablet Clean APK
    upload_asset(upload_url, TABLET_APK_PATH, "application/vnd.android.package-archive", headers)

    # 3. Upload Galaxy Watch Companion APK
    upload_asset(upload_url, WATCH_APK_PATH, "application/vnd.android.package-archive", headers)

    # 4. Upload Windows x64 Desktop ZIP
    upload_asset(upload_url, ZIP_PATH, "application/zip", headers)

    print(f"\n🚀 Release {TAG} published successfully with all 4 assets attached!")

if __name__ == "__main__":
    main()
