import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def bump(target_version=None, changelog_text=None):
    pkg_path = os.path.join(ROOT, "package.json")
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg_content = f.read()

    m = re.search(r'"version":\s*"([^"]+)"', pkg_content)
    if not m:
        raise ValueError("Could not find version in package.json")
    cur_version = m.group(1)

    if not target_version:
        parts = cur_version.split(".")
        parts[-1] = str(int(parts[-1]) + 1)
        next_version = ".".join(parts)
    else:
        next_version = target_version

    print(f"Bumping version: {cur_version} -> {next_version}")

    # 1. package.json
    pkg_content = pkg_content.replace(f'"version": "{cur_version}"', f'"version": "{next_version}"')
    with open(pkg_path, "w", encoding="utf-8") as f:
        f.write(pkg_content)
    print("Updated package.json")

    # 2. sw.js
    sw_path = os.path.join(ROOT, "sw.js")
    if os.path.exists(sw_path):
        with open(sw_path, "r", encoding="utf-8") as f:
            sw_content = f.read()
        sw_content = sw_content.replace(f"v{cur_version}", f"v{next_version}")
        with open(sw_path, "w", encoding="utf-8") as f:
            f.write(sw_content)
        print("Updated sw.js")

    # 3. app.js
    app_path = os.path.join(ROOT, "app.js")
    if os.path.exists(app_path):
        with open(app_path, "r", encoding="utf-8") as f:
            app_content = f.read()
        app_content = app_content.replace(f"v{cur_version}", f"v{next_version}").replace(f'"{cur_version}"', f'"{next_version}"')
        with open(app_path, "w", encoding="utf-8") as f:
            f.write(app_content)
        print("Updated app.js")

    # 4. android/app/build.gradle
    gradle_path = os.path.join(ROOT, "android", "app", "build.gradle")
    if os.path.exists(gradle_path):
        with open(gradle_path, "r", encoding="utf-8") as f:
            gradle_content = f.read()
        # Increment versionCode
        def bump_code(match):
            old_code = int(match.group(1))
            return f"versionCode {old_code + 1}"
        gradle_content = re.sub(r'versionCode\s+(\d+)', bump_code, gradle_content, count=1)
        gradle_content = re.sub(r'versionName\s+"[^"]+"', f'versionName "{next_version}"', gradle_content, count=1)
        with open(gradle_path, "w", encoding="utf-8") as f:
            f.write(gradle_content)
        print("Updated android/app/build.gradle")

    # 5. index.html
    idx_path = os.path.join(ROOT, "index.html")
    with open(idx_path, "r", encoding="utf-8") as f:
        idx_content = f.read()

    # Query strings & badge replacements
    idx_content = idx_content.replace(f"v={cur_version}", f"v={next_version}")
    idx_content = idx_content.replace(f'id="display-system-version">v{cur_version}<', f'id="display-system-version">v{next_version}<')
    idx_content = idx_content.replace(f"גרסה אחרונה v{cur_version}", f"גרסה אחרונה v{next_version}")
    idx_content = idx_content.replace(f"v{cur_version} ✨", f"v{next_version} ✨")
    idx_content = idx_content.replace(f"(v{cur_version})", f"(v{next_version})")

    # Manage "What's New" list -> Keep STRICTLY latest version in visible list
    whats_new_match = re.search(r'(<ul\s+class="whats-new-list"[^>]*>)(.*?)(</ul>)', idx_content, re.DOTALL)
    older_match = re.search(r'(<div\s+id="older-versions-list"[^>]*>[\s\S]*?<ul[^>]*>)(.*?)(</ul>)', idx_content, re.DOTALL)

    if whats_new_match and older_match:
        existing_whats_new_html = whats_new_match.group(2).strip()
        existing_older_html = older_match.group(2).strip()

        # Extract all <li> items from whats-new-list
        existing_items = re.findall(r'<li.*?>.*?</li>', existing_whats_new_html, re.DOTALL)

        # Build new changelog item
        if not changelog_text:
            changelog_text = f"עדכוני מערכת, ביצועים ותיקוני תאימות לגרסה v{next_version}."

        today_hebrew = "19/10/2026"
        new_single_li = f'                        <li><strong>v{next_version} ({today_hebrew}):</strong> {changelog_text}</li>'

        # All previous items move to older-versions-list
        # Indent them cleanly
        older_combined_items = existing_items
        older_existing_lis = re.findall(r'<li.*?>.*?</li>', existing_older_html, re.DOTALL)
        all_older_lis = older_combined_items + older_existing_lis
        total_older_count = len(all_older_lis)

        formatted_older_body = "\n" + "\n".join(["                            " + li.strip() for li in all_older_lis]) + "\n                        "
        formatted_whats_new_body = "\n" + new_single_li + "\n                    "

        # Replace whats-new-list with only single latest item
        new_whats_new_block = whats_new_match.group(1) + formatted_whats_new_body + whats_new_match.group(3)
        idx_content = idx_content[:whats_new_match.start()] + new_whats_new_block + idx_content[whats_new_match.end():]

        # Re-find older_match in updated idx_content
        older_match = re.search(r'(<div\s+id="older-versions-list"[^>]*>[\s\S]*?<ul[^>]*>)(.*?)(</ul>)', idx_content, re.DOTALL)
        if older_match:
            new_older_block = older_match.group(1) + formatted_older_body + older_match.group(3)
            idx_content = idx_content[:older_match.start()] + new_older_block + idx_content[older_match.end():]

        # Update button text with total count
        idx_content = re.sub(r'📜 הצג היסטוריית גרסאות קודמות \(\d+\)', f'📜 הצג היסטוריית גרסאות קודמות ({total_older_count})', idx_content)
        idx_content = re.sub(r"this\.innerHTML = '📜 הצג היסטוריית גרסאות קודמות \(\d+\)'", f"this.innerHTML = '📜 הצג היסטוריית גרסאות קודמות ({total_older_count})'", idx_content)

    with open(idx_path, "w", encoding="utf-8") as f:
        f.write(idx_content)
    print(f"Updated index.html to {next_version} (single latest item in whats-new-list)")

    # 6. widgets.html
    w_path = os.path.join(ROOT, "widgets.html")
    if os.path.exists(w_path):
        with open(w_path, "r", encoding="utf-8") as f:
            w_content = f.read()
        w_content = w_content.replace(f"v={cur_version}", f"v={next_version}")
        with open(w_path, "w", encoding="utf-8") as f:
            f.write(w_content)
        print("Updated widgets.html")

if __name__ == "__main__":
    v = sys.argv[1] if len(sys.argv) > 1 else None
    c = sys.argv[2] if len(sys.argv) > 2 else None
    bump(v, c)
