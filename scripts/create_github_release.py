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

# Read version from package.json
with open(os.path.join(ROOT, "package.json"), "r", encoding="utf-8") as f:
    pkg = json.load(f)
VERSION = pkg.get("version", "2.4.21")
TAG = f"v{VERSION}"
NAME = f"Semestero ME v{VERSION} - Android Native Release"

def get_github_token():
    try:
        p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        out, _ = p.communicate('protocol=https\nhost=github.com\n\n')
        for line in out.splitlines():
            if line.startswith('password='):
                return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"[Error] Failed to read git credential: {e}")
    return None

def create_release():
    token = get_github_token()
    if not token:
        print("[Error] No GitHub token found in credentials.")
        sys.exit(1)

    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Semestero-ME-Release-Bot"
    }

    body_desc = f"""### 🚀 Semestero ME {TAG} - Official Android Native Release

**Download the APK directly to your phone:**
👉 **[Semestero-ME.apk](https://github.com/{REPO}/releases/download/{TAG}/Semestero-ME.apk)**

#### ✨ Highlights in {TAG}:
- **Fully Interactive Home-Screen Widgets:**
  1. **Tasks & Exam Countdown Widget (`SemesteroTasksExamWidget`):** Added direct task completion! Tap the checkmark (`✓`) button right on the home screen to instantly complete tasks without opening the app, with immediate visual feedback (`✓ הושלם בהצלחה!`) and two-way sync back to your courses database. Plus a dedicated `＋ הוסף משימה` quick-action button that launches straight into the custom task modal.
  2. **Next Class & Schedule Carousel (`SemesteroNextClassWidget`):** Added interactive carousel controls (`◀`, `▶`) and page counter (`1/N`) to flip through all classes scheduled for today directly from the widget, plus a 1-tap manual refresh button.
- **Full Authentic Semestero Faculty Emblem for Notifications:**
  Re-engineered the Android notification icon (`ic_stat_notification.png`) across all densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) to feature the complete, authentic Semestero emblem: the science laboratory flask filled with the internal robotic arm mechanism and rising vapor bubbles, framed inside the mechanical engineering gear.
- **Proposed Native Widgets Gallery for Approval (`widgets.html`):**
  Added an interactive showcase gallery of 4 new native widget concepts for user review and approval: Quick Technion Launchpad Dock (4x1), Miluim & Reservist Academic Rights Tracker (2x2), Weekly Schedule & Windows Heatmap (4x4), and Finals Runway & GPA Target Gauge (4x2).
- **Rock-Solid RemoteViews Inflation:** 100% compliant with Android RemoteViews specifications for Samsung One UI and all modern Android launchers.
"""

    payload = {
        "tag_name": TAG,
        "target_commitish": "main",
        "name": NAME,
        "body": body_desc,
        "draft": False,
        "prerelease": False
    }

    print(f"[*] Creating GitHub release {TAG}...")
    create_url = f"https://api.github.com/repos/{REPO}/releases"
    req = urllib.request.Request(create_url, data=json.dumps(payload).encode('utf-8'), headers=headers, method="POST")

    upload_url = None
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            upload_url = data['upload_url'].split('{')[0]
            print(f"[OK] Release created: {data.get('html_url')}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[!] Release request status: {e.code}")
        # If tag already exists, find existing release
        req_get = urllib.request.Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}", headers=headers)
        with urllib.request.urlopen(req_get) as resp_get:
            data = json.loads(resp_get.read().decode('utf-8'))
            upload_url = data['upload_url'].split('{')[0]
            print(f"[OK] Found existing release: {data.get('html_url')}")
            # If asset already exists, delete it first to overwrite
            for asset in data.get('assets', []):
                if asset.get('name') == 'Semestero-ME.apk':
                    asset_id = asset['id']
                    del_url = f"https://api.github.com/repos/{REPO}/releases/assets/{asset_id}"
                    del_req = urllib.request.Request(del_url, headers=headers, method="DELETE")
                    try:
                        with urllib.request.urlopen(del_req) as del_resp:
                            print(f"[OK] Deleted previous APK asset (id: {asset_id})")
                    except Exception as del_err:
                        print(f"[!] Warning deleting asset: {del_err}")

    # Upload APK asset
    if not os.path.exists(APK_PATH):
        print(f"[Error] APK not found at {APK_PATH}")
        sys.exit(1)

    apk_size = os.path.getsize(APK_PATH)
    print(f"[*] Uploading Semestero-ME.apk ({apk_size} bytes)...")

    asset_url = f"{upload_url}?name=Semestero-ME.apk"
    upload_headers = {
        "Authorization": f"token {token}",
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Length": str(apk_size),
        "User-Agent": "Semestero-ME-Release-Bot"
    }

    with open(APK_PATH, 'rb') as f:
        apk_data = f.read()

    req_upload = urllib.request.Request(asset_url, data=apk_data, headers=upload_headers, method="POST")
    try:
        with urllib.request.urlopen(req_upload) as resp:
            asset_data = json.loads(resp.read().decode('utf-8'))
            dl_url = asset_data.get('browser_download_url')
            print("[OK] APK uploaded successfully!")
            print(f"Direct Download URL: {dl_url}")
            return dl_url
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        print(f"[!] Upload error: {e.code} - {err_body}")
        sys.exit(1)

if __name__ == "__main__":
    create_release()
