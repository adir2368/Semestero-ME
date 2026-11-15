# -*- coding: utf-8 -*-
"""
Academic Skill Tree - Automated Daily Calendar Synchronization Script
Runs automatically every midnight via Windows Task Scheduler or on demand.
Updates the user's secret GitHub Gist Webcal feed with all active course tasks and deadlines.
"""

import os
import sys
import json
import glob
import urllib.request
from datetime import datetime

# GitHub Gist Configuration
GIST_ID = "71ec3efb9e46b0abafa44532f0e2aab1"
APP_DIR = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
TOKEN_FILE = os.path.join(APP_DIR, "github_token.secret")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
if not GITHUB_TOKEN and os.path.exists(TOKEN_FILE):
    try:
        with open(TOKEN_FILE, "r", encoding="utf-8") as _tf:
            GITHUB_TOKEN = _tf.read().strip()
    except Exception:
        pass
FILE_NAME = "technion_schedule.ics"
LOG_FILE = os.path.join(APP_DIR, "sync_log.txt")

COURSE_SHORT_NAMES = {
    '104041': 'חדו"א 1מ1',
    '104065': 'אלגברה ליניארית',
    '114051': 'פיסיקה 1',
    '125001': 'כימיה כללית',
    '234128': 'פייתון',
    '104043': 'חדו"א 2',
    '104131': 'מד"ר',
    '125013': 'מעבדה בכימיה',
    '314533': 'חומרים',
    '034061': 'גרפיקה הנדסית',
    '034028': 'מוצקים 1',
    # Semester 3 (Current)
    '104228': 'מד"ח',
    '114052': 'פיסיקה 2',
    '034053': 'מוצקים 2',
    '034056': 'חישוב מדעי והנדסי',
    '034035': 'תרמודינמיקה 1',
    '03940805': 'יוגה',
    # Semester 4
    '034030': 'תהליכי ייצור',
    '034010': 'דינמיקה',
    '034055': 'זרימה 1',
    '034032': 'מערכות ליניאריות'
}

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def load_game_state():
    # 1. Try reading latest current_user_state.json if available
    state_file = os.path.join(APP_DIR, "current_user_state.json")
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                state = json.load(f)
                if state and state.get("courses"):
                    log("Loaded state from current_user_state.json")
                    return state
        except Exception as e:
            log(f"Error loading current_user_state.json: {e}")

    # 2. Try extracting state from Electron leveldb
    appdata = os.environ.get("APPDATA", "")
    leveldb_path = os.path.join(appdata, "academic-skill-tree", "Local Storage", "leveldb")
    if os.path.exists(leveldb_path):
        key = b"academic_skill_tree_save"
        files = sorted(glob.glob(os.path.join(leveldb_path, "*.*")), key=os.path.getmtime, reverse=True)
        for fpath in files:
            if not fpath.endswith((".log", ".ldb")):
                continue
            try:
                with open(fpath, "rb") as f:
                    data = f.read()
                idx = data.find(key)
                if idx != -1:
                    for enc in ["utf-16le", "utf-8"]:
                        start_marker = b'{\x00"\x00c\x00h\x00a\x00r\x00' if enc == "utf-16le" else b'{"char'
                        s_idx = data.find(start_marker, idx)
                        if s_idx != -1:
                            raw = data[s_idx:]
                            decoded = raw.decode(enc, errors="ignore")
                            decoder = json.JSONDecoder()
                            obj, _ = decoder.raw_decode(decoded)
                            if obj and obj.get("courses"):
                                log(f"Loaded state from LevelDB {os.path.basename(fpath)} ({enc})")
                                return obj
            except Exception:
                continue

    # 3. Fallback to user_saved_state.json
    fallback_file = os.path.join(APP_DIR, "user_saved_state.json")
    if os.path.exists(fallback_file):
        try:
            with open(fallback_file, "r", encoding="utf-8") as f:
                state = json.load(f)
                log("Loaded state from user_saved_state.json (fallback)")
                return state
        except Exception as e:
            log(f"Error loading user_saved_state.json: {e}")

    return None

def build_ics(state):
    ics_lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Academic Skill Tree//Technion Live Calendar Sync//HE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:טכניון - לוח משימות ומבחנים (Academic Skill Tree)",
        "X-WR-TIMEZONE:Asia/Jerusalem"
    ]

    event_count = 0

    if state.get("isFinalsMode"):
        schedule = state.get("pastExamSchedule", [])
        for item in schedule:
            d = item.get("date")
            if not d:
                continue
            clean_date = d.replace("-", "")
            uid = f"pe-{item.get('id', 'item')}-{clean_date}@academicskilltree.local"
            title = item.get("title", "מבחן לתרגול")
            completed = item.get("completed", False)
            event_count += 1
            ics_lines.extend([
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTAMP:{clean_date}T080000Z",
                f"DTSTART;VALUE=DATE:{clean_date}",
                f"DTEND;VALUE=DATE:{clean_date}",
                f"SUMMARY:📝 מבחן לתרגול: {title}",
                f"DESCRIPTION:מבחן עבר לפתרון. הושלם: {'כן' if completed else 'לא'}",
                "STATUS:CONFIRMED",
                "END:VEVENT"
            ])
    else:
        courses = state.get("courses", {})
        for code, course in courses.items():
            if course.get("status") != "active":
                continue
            tasks = course.get("tasks", [])
            short_name = COURSE_SHORT_NAMES.get(code, course.get("name", code))
            for task in tasks:
                d = task.get("dueDate")
                if not d:
                    continue
                clean_date = d.replace("-", "")
                uid = f"task-{code}-{task.get('id', 't')}-{clean_date}@academicskilltree.local"
                title = task.get("title", "משימה")
                is_done = task.get("completed", False) or task.get("status") in ["done", "submitted"]
                event_count += 1
                ics_lines.extend([
                    "BEGIN:VEVENT",
                    f"UID:{uid}",
                    f"DTSTAMP:{clean_date}T080000Z",
                    f"DTSTART;VALUE=DATE:{clean_date}",
                    f"DTEND;VALUE=DATE:{clean_date}",
                    f"SUMMARY:📝 [{short_name}] {title}",
                    f"DESCRIPTION:משימה בקורס {course.get('name', '')} ({code}).\\nסטטוס: {'הושלם' if is_done else 'פתוח'}.",
                    f"CATEGORIES:{short_name},Tasks,משימות",
                    f"STATUS:{'COMPLETED' if is_done else 'CONFIRMED'}",
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    f"DESCRIPTION:תזכורת: {title} ב-{short_name} להגשה מחר!",
                    "TRIGGER:-P1D",
                    "END:VALARM",
                    "BEGIN:VALARM",
                    "ACTION:DISPLAY",
                    f"DESCRIPTION:תזכורת דחופה: {title} ב-{short_name} להגשה היום!",
                    "TRIGGER:-PT3H",
                    "END:VALARM",
                    "END:VEVENT"
                ])

    if event_count == 0:
        today_str = datetime.now().strftime("%Y%m%d")
        ics_lines.extend([
            "BEGIN:VEVENT",
            f"UID:status-sync-active-{today_str}@academicskilltree.local",
            f"DTSTAMP:{today_str}T000000Z",
            f"DTSTART;VALUE=DATE:{today_str}",
            f"DTEND;VALUE=DATE:{today_str}",
            "SUMMARY:🎓 Academic Skill Tree: סמסטר ג' מחובר ומסונכרן",
            "DESCRIPTION:יומן המשימות והמבחנים מחובר ומסונכרן אוטומטית. ברגע שתוסיף מועדי הגשה למשימות או מבחנים, הם יופיעו כאן אוטומטית!",
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ])

    ics_lines.append("END:VCALENDAR")
    return "\r\n".join(ics_lines), event_count

def sync_to_gist(ics_content):
    url = f"https://api.github.com/gists/{GIST_ID}"
    data = json.dumps({
        "files": {
            FILE_NAME: {
                "content": ics_content
            }
        }
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"token {GITHUB_TOKEN}",
            "User-Agent": "AcademicSkillTree-Sync",
            "Content-Type": "application/json"
        },
        method="PATCH"
    )

    with urllib.request.urlopen(req) as resp:
        if resp.status == 200:
            log("Successfully synced latest schedule to GitHub Gist!")
            return True
        else:
            log(f"GitHub API returned status {resp.status}")
            return False

def main():
    log("=== Starting Daily Calendar Sync ===")
    state = load_game_state()
    if not state:
        log("Error: Could not find academic state to sync.")
        sys.exit(1)

    ics_content, count = build_ics(state)
    log(f"Generated iCalendar content ({count} active scheduled items)")
    success = sync_to_gist(ics_content)
    if success:
        log("=== Daily Calendar Sync Finished Successfully ===")
    else:
        log("=== Daily Calendar Sync Finished With Errors ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
