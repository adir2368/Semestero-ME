import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
import urllib.request
import urllib.error
import urllib.parse
import subprocess
import re

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
REPO = "adir2368/Semestero-ME"
RELEASE_ID = 433077804

def get_github_token():
    try:
        p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        out, _ = p.communicate(input="protocol=https\nhost=github.com\n\n")
        m = re.search(r'password=(.+)', out)
        if m:
            return m.group(1).strip()
    except Exception as e:
        print(f"Error getting git credential: {e}")
    return None

token = get_github_token()
if not token:
    print("No token found")
    sys.exit(1)

headers = {
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "ReleaseBot"
}

# Get release details to get upload_url
url = f"https://api.github.com/repos/{REPO}/releases/{RELEASE_ID}"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
upload_url_template = data["upload_url"]

def upload_file(path, name):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    size = os.path.getsize(path)
    print(f"Uploading {name} ({size / (1024*1024):.2f} MB)...")
    clean_url = upload_url_template.split("{")[0]
    upload_url = f"{clean_url}?name={urllib.parse.quote(name)}"
    
    up_headers = dict(headers)
    up_headers["Content-Type"] = "application/vnd.android.package-archive"
    up_headers["Content-Length"] = str(size)
    
    with open(path, "rb") as f:
        file_data = f.read()
    
    up_req = urllib.request.Request(upload_url, data=file_data, headers=up_headers, method="POST")
    try:
        with urllib.request.urlopen(up_req) as response:
            print(f"✓ Uploaded {name} successfully (status={response.status})")
    except urllib.error.HTTPError as e:
        print(f"HTTPError uploading {name}: {e.code} - {e.read().decode('utf-8')}")

wear_apk = os.path.join(ROOT, "Semestero-Wear.apk")
debug_apk = os.path.join(ROOT, "Semestero-ME-Debug.apk")

import json
upload_file(wear_apk, "Semestero-Wear.apk")
upload_file(debug_apk, "Semestero-ME-Debug.apk")
