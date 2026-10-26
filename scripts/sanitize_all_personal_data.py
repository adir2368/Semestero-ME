import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 1. Sanitize app.js
app_path = os.path.join(ROOT, 'app.js')
with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

old_gist_block = '''const CLOUD_GIST_SYNC = {
    gistId: "71ec3efb9e46b0abafa44532f0e2aab1",
    token: localStorage.getItem("academic_skill_tree_github_token") || "",
    rawUrl: "https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics",
    webcalUrl: "webcal://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics"
};'''

new_gist_block = '''const CLOUD_GIST_SYNC = {
    gistId: localStorage.getItem("academic_skill_tree_github_gist_id") || "",
    token: localStorage.getItem("academic_skill_tree_github_token") || "",
    rawUrl: localStorage.getItem("academic_skill_tree_github_raw_url") || "",
    webcalUrl: localStorage.getItem("academic_skill_tree_github_webcal_url") || ""
};'''

if old_gist_block in app_code:
    app_code = app_code.replace(old_gist_block, new_gist_block)
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_code)
    print("Updated CLOUD_GIST_SYNC in app.js successfully!")
else:
    print("old_gist_block not found in app.js, checking alternate format...")
    app_code = re.sub(
        r'const CLOUD_GIST_SYNC = \{[^}]*?\};',
        new_gist_block,
        app_code
    )
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_code)
    print("Replaced CLOUD_GIST_SYNC in app.js via regex!")


# 2. Sanitize widgets.html
widgets_path = os.path.join(ROOT, 'widgets.html')
with open(widgets_path, 'r', encoding='utf-8') as f:
    w_code = f.read()

old_w_ics = "const icsUrl = 'https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics';"
new_w_ics = "const icsUrl = localStorage.getItem('academic_skill_tree_github_raw_url') || '';"

if old_w_ics in w_code:
    w_code = w_code.replace(old_w_ics, new_w_ics)
    with open(widgets_path, 'w', encoding='utf-8') as f:
        f.write(w_code)
    print("Sanitized widgets.html successfully!")


# 3. Sanitize raw_cheesefork.json
raw_cf_path = os.path.join(ROOT, 'raw_cheesefork.json')
if os.path.exists(raw_cf_path):
    with open(raw_cf_path, 'r', encoding='utf-8') as f:
        cf_raw = f.read()
    cf_raw = cf_raw.replace('D4bh8oHO0GQI5Gx1iYAbWsouBVx2', 'GENERIC_USER_ID')
    with open(raw_cf_path, 'w', encoding='utf-8') as f:
        f.write(cf_raw)
    print("Sanitized raw_cheesefork.json successfully!")


# 4. Sanitize tests/check_user_external_links.js
test_links_path = os.path.join(ROOT, 'tests', 'check_user_external_links.js')
if os.path.exists(test_links_path):
    with open(test_links_path, 'r', encoding='utf-8') as f:
        t_code = f.read()
    t_code = t_code.replace('https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2', 'https://cheesefork.netlify.app/?semester=202601')
    t_code = t_code.replace('users/D4bh8oHO0GQI5Gx1iYAbWsouBVx2/', 'users/GENERIC_USER/')
    with open(test_links_path, 'w', encoding='utf-8') as f:
        f.write(t_code)
    print("Sanitized tests/check_user_external_links.js successfully!")

print("\nAll files sanitized from personal identifiers!")
