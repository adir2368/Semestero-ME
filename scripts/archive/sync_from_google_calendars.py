# -*- coding: utf-8 -*-
"""
Pulls events from the user's 3 specific Google Calendars into the Academic Skill Tree state:
1. Exams: f04b545847cb46d2694500ffc3ac3378bd9005e125ae4a59c2caea5a5f32725c@group.calendar.google.com
2. Homework: a887c830cc1a7b0ca4f97d1751bcf02477d837dd4ca9cf5de8385871f44a6c4d@group.calendar.google.com
3. Practice Exams: d707cbfa99ea0f68a0a31ebc42cb4cd35eae834770a5a118051727eb0c1afdd5@group.calendar.google.com

Runs every hour or on-demand.
"""

import os
import sys
import json
import glob
import urllib.request
import urllib.parse
from datetime import datetime

CALENDAR_IDS = {
    'exams': 'f04b545847cb46d2694500ffc3ac3378bd9005e125ae4a59c2caea5a5f32725c@group.calendar.google.com',
    'hw': 'a887c830cc1a7b0ca4f97d1751bcf02477d837dd4ca9cf5de8385871f44a6c4d@group.calendar.google.com',
    'practice': 'd707cbfa99ea0f68a0a31ebc42cb4cd35eae834770a5a118051727eb0c1afdd5@group.calendar.google.com'
}

APP_DIR = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
LOG_FILE = os.path.join(APP_DIR, "google_sync_log.txt")

def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

def parse_ics_events(ics_text):
    events = []
    lines = ics_text.splitlines()
    curr_event = None
    
    for line in lines:
        if line.startswith("BEGIN:VEVENT"):
            curr_event = {}
        elif line.startswith("END:VEVENT"):
            if curr_event and "SUMMARY" in curr_event:
                events.append(curr_event)
            curr_event = None
        elif curr_event is not None:
            if ":" in line:
                key_part, val_part = line.split(":", 1)
                clean_key = key_part.split(";")[0].strip().upper()
                curr_event[clean_key] = val_part.strip()
    
    return events

def fetch_calendar_events(cid):
    enc_cid = urllib.parse.quote(cid)
    url = f"https://calendar.google.com/calendar/ical/{enc_cid}/public/basic.ics"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AcademicSkillTree-TwoWaySync"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read().decode("utf-8", errors="ignore")
            return parse_ics_events(data)
    except Exception as e:
        log(f"Error fetching calendar {cid[:15]}...: {e}")
        return []

def format_ics_date(dt_str):
    if not dt_str:
        return ""
    # Format YYYYMMDD or YYYYMMDDTHHMMSSZ
    clean = dt_str.replace("Z", "")
    if len(clean) >= 8:
        return f"{clean[0:4]}-{clean[4:6]}-{clean[6:8]}"
    return ""

def main():
    log("=== Starting Hourly Google Calendar Fetch ===")
    
    practice_events = fetch_calendar_events(CALENDAR_IDS['practice'])
    hw_events = fetch_calendar_events(CALENDAR_IDS['hw'])
    exam_events = fetch_calendar_events(CALENDAR_IDS['exams'])
    
    log(f"Fetched: {len(practice_events)} practice exams, {len(hw_events)} homeworks, {len(exam_events)} exams from Google Calendars")
    
    # Save fetched calendar snapshot for the app to read
    snapshot_file = os.path.join(APP_DIR, "google_calendars_snapshot.json")
    snapshot = {
        "lastUpdated": datetime.now().isoformat(),
        "practiceExams": [
            {
                "summary": e.get("SUMMARY", ""),
                "description": e.get("DESCRIPTION", ""),
                "date": format_ics_date(e.get("DTSTART", "")),
                "uid": e.get("UID", "")
            }
            for e in practice_events
        ],
        "homework": [
            {
                "summary": e.get("SUMMARY", ""),
                "description": e.get("DESCRIPTION", ""),
                "date": format_ics_date(e.get("DTSTART", "")),
                "uid": e.get("UID", "")
            }
            for e in hw_events
        ],
        "exams": [
            {
                "summary": e.get("SUMMARY", ""),
                "description": e.get("DESCRIPTION", ""),
                "date": format_ics_date(e.get("DTSTART", "")),
                "uid": e.get("UID", "")
            }
            for e in exam_events
        ]
    }
    
    with open(snapshot_file, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=2)
        
    log("Saved fresh snapshot to google_calendars_snapshot.json successfully")
    log("=== Hourly Google Calendar Fetch Finished ===")

if __name__ == "__main__":
    main()
