import os
import json
import re
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRELOADED_PATH = os.path.join(ROOT, "preloaded_user_state.js")

with open(PRELOADED_PATH, "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r'const PRELOADED_USER_STATE = ({[\s\S]*?});\s*(?:window\.PRELOADED_USER_STATE|if)', text)
if not m:
    print("Failed to find PRELOADED_USER_STATE in preloaded_user_state.js")
    sys.exit(1)

preloaded = json.loads(m.group(1))
print(f"Extracted PRELOADED_USER_STATE: GPA={preloaded.get('gpa')}, Courses={len(preloaded.get('courses', {}))}")

url = 'https://asxpbepuvhbafsjlogag.supabase.co/rest/v1/user_states?user_id=eq.adir_moshe'
headers = {
    'apikey': 'sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy',
    'Authorization': 'Bearer sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

payload = json.dumps({
    "user_id": "adir_moshe",
    "user_name": "אדיר משה",
    "user_email": "adir.m.2368@gmail.com",
    "state_json": preloaded,
    "updated_at": "2026-10-27T19:45:00.000Z"
}).encode('utf-8')

req = urllib.request.Request(url, data=payload, headers=headers, method='PATCH')
try:
    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        print(f"✓ Successfully restored Adir Moshe in Supabase! Status: HTTP {resp.status}")
        print("Restored GPA:", res_data[0]['state_json']['gpa'])
except Exception as e:
    print(f"Error restoring Supabase: {e}")
    sys.exit(1)
