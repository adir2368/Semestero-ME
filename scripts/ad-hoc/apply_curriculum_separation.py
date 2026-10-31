#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apply strict separation between Adir Moshe's custom personal curriculum
and the authentic recommended standard Technion ME curriculum for all other students and guests.

1. Physics 1 (114051 / 01140051):
   - Adir: Semester 1
   - All other students / default syllabus: Semester 2
2. Chemistry Lab (125013 / 01250013):
   - Adir: Semester 2
   - All other students / default syllabus: Semester 4
3. Yoga (03940805):
   - Adir: Semester 3
   - All other students / default syllabus: NOT pre-assigned to Semester 3 (available in sports catalog)
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def update_planner_catalog():
    path = os.path.join(ROOT, 'planner_catalog.js')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    has_crlf = '\r\n' in content
    text = content.replace('\r\n', '\n')

    # Define exact replacements for Semesters 1 to 4 for each catalog
    replacement_2026 = """const SUGGESTED_MANDATORY_SYLLABUS_2026 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (תשפ״ו)",
            targetCredits: 17.0,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "02340128", altCode: "234128", name: "שפת פייתון", credits: 4.0, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳",
            targetCredits: 20.5,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 }
                    ],
                    prereqs: [] 
                }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 19.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2ממ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["02340128", "01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
            targetCredits: 18.0,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        }"""

    replacement_2027 = """const SUGGESTED_MANDATORY_SYLLABUS_2027 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (תשפ״ז)",
            targetCredits: 15.5,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ' 2", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות", credits: 2.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳",
            targetCredits: 22.0,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01140039", altCode: "114039", name: "מעבדה לפיזיקה 1מח'", credits: 1.0, type: "mandatory", prereqs: ["01140051"] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 }
                    ],
                    prereqs: [] 
                }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 18.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "00340043", altCode: "034043", name: "שרטוט הנדסי ממוחשב", credits: 2.5, type: "mandatory", prereqs: ["00340061"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
            targetCredits: 21.5,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2ממ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        }"""

    replacement_2024 = """const SUGGESTED_MANDATORY_SYLLABUS_2024 = [
        {
            semester: 1,
            title: "שנה א׳ - סמסטר א׳ (חורף)",
            targetCredits: 15.5,
            courses: [
                { code: "01040041", altCode: "104041", name: "חדו\\"א 1מ' 1", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01040065", altCode: "104065", name: "אלגברה 1 מ'", credits: 5.0, type: "mandatory", prereqs: [] },
                { code: "01250001", altCode: "125001", name: "כימיה כללית", credits: 3.0, type: "mandatory", prereqs: [] },
                { code: "00350026", altCode: "035026", name: "מבוא יצירתי להנדסת מכונות", credits: 2.5, type: "mandatory", prereqs: [] }
            ]
        },
        {
            semester: 2,
            title: "שנה א׳ - סמסטר ב׳ (אביב)",
            targetCredits: 22.0,
            courses: [
                { code: "01040043", altCode: "104043", name: "חדו\\"א 2מ' 1", credits: 5.0, type: "mandatory", prereqs: ["01040041"] },
                { code: "00340028", altCode: "034028", name: "מכניקת מוצקים 1", credits: 4.0, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "01040131", altCode: "104131", name: "משוואות דיפרנציאליות רגילות/ח", credits: 2.5, type: "mandatory", prereqs: ["01040041", "01040065"] },
                { code: "03140533", altCode: "314533", name: "מבוא להנדסת חומרים מ'", credits: 3.5, type: "mandatory", prereqs: ["01250001"] },
                { code: "00340061", altCode: "034061", name: "מבוא לגרפיקה ותכנון הנדסי", credits: 3.5, type: "mandatory", prereqs: [] },
                { code: "01140039", altCode: "114039", name: "מעבדה לפיזיקה 1מח'", credits: 1.0, type: "mandatory", prereqs: ["01140051"] },
                { 
                    code: "01140051", 
                    altCode: "114051", 
                    name: "פיזיקה 1", 
                    credits: 2.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_1",
                    variants: [
                        { code: "01140051", altCode: "114051", name: "פיזיקה 1", credits: 2.5 },
                        { code: "01140071", altCode: "114071", name: "פיזיקה 1מ'", credits: 3.5 },
                        { code: "01140077", altCode: "114077", name: "פיזיקה 1פ'", credits: 4.0 },
                        { code: "01140055", altCode: "114055", name: "פיזיקה 1ת'", credits: 3.5 }
                    ],
                    prereqs: [] 
                }
            ]
        },
        {
            semester: 3,
            title: "שנה ב׳ - סמסטר ג׳",
            targetCredits: 18.5,
            courses: [
                { code: "00340053", altCode: "034053", name: "מכניקת מוצקים 2 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340028"] },
                { code: "00340043", altCode: "034043", name: "שרטוט הנדסי ממוחשב", credits: 2.5, type: "mandatory", prereqs: ["00340061"] },
                { code: "00340056", altCode: "034056", name: "מבוא לחישוב מדעי והנדסי", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040043"] },
                { code: "00340035", altCode: "034035", name: "תרמודינמיקה 1", credits: 4.0, type: "mandatory", prereqs: ["01040043"] },
                { code: "01040228", altCode: "104228", name: "מד\\"ח מ'", credits: 3.0, type: "mandatory", prereqs: ["01040043", "01040131"] }
            ]
        },
        {
            semester: 4,
            title: "שנה ב׳ - סמסטר ד׳",
            targetCredits: 21.5,
            courses: [
                { code: "00340030", altCode: "034030", name: "תהליכי ייצור", credits: 3.5, type: "mandatory", prereqs: ["00340053", "00340061", "03140533"] },
                { code: "00340010", altCode: "034010", name: "דינמיקה", credits: 5.0, type: "mandatory", prereqs: ["00340028", "01140051", "01040043", "01040131"] },
                { code: "00340055", altCode: "034055", name: "תורת הזרימה 1 מורחב", credits: 5.0, type: "mandatory", prereqs: ["00340035", "01040131", "01040228"] },
                { code: "00340032", altCode: "034032", name: "מערכות ליניאריות", credits: 4.0, type: "mandatory", prereqs: ["01040065", "01040131"] },
                { 
                    code: "01140052", 
                    altCode: "114052", 
                    name: "פיזיקה 2", 
                    credits: 3.5, 
                    type: "mandatory", 
                    variantGroupId: "physics_2",
                    variants: [
                        { code: "01140052", altCode: "114052", name: "פיזיקה 2", credits: 3.5 },
                        { code: "01140075", altCode: "114075", name: "פיזיקה 2מ'", credits: 5.0 },
                        { code: "01140078", altCode: "114078", name: "פיזיקה 2פ'", credits: 5.0 },
                        { code: "01140076", altCode: "114076", name: "פיזיקה 2ת'", credits: 5.0 }
                    ],
                    prereqs: ["01140051", "01040043"] 
                },
                { code: "01250013", altCode: "125013", name: "מעבדה בכימיה", credits: 0.5, type: "mandatory", prereqs: ["01250001"] }
            ]
        }"""

    # Replace from highest index to lowest index
    # 1. 2026
    start_2026 = text.find('const SUGGESTED_MANDATORY_SYLLABUS_2026')
    sem5_2026 = text.find('semester: 5', start_2026)
    sem4_2026 = text.rfind('semester: 4', 0, sem5_2026)
    end_2026 = text.find('},\n        {\n            semester: 5', sem4_2026) + 1
    assert start_2026 != -1 and end_2026 != -1, "2026 bounds error"
    text = text[:start_2026] + replacement_2026 + text[end_2026:]

    # 2. 2027
    start_2027 = text.find('const SUGGESTED_MANDATORY_SYLLABUS_2027')
    sem5_2027 = text.find('semester: 5', start_2027)
    sem4_2027 = text.rfind('semester: 4', 0, sem5_2027)
    end_2027 = text.find('},\n        {\n            semester: 5', sem4_2027) + 1
    assert start_2027 != -1 and end_2027 != -1, "2027 bounds error"
    text = text[:start_2027] + replacement_2027 + text[end_2027:]

    # 3. 2024
    start_2024 = text.find('const SUGGESTED_MANDATORY_SYLLABUS_2024')
    sem5_2024 = text.find('semester: 5', start_2024)
    sem4_2024 = text.rfind('semester: 4', 0, sem5_2024)
    end_2024 = text.find('},\n        {\n            semester: 5', sem4_2024) + 1
    assert start_2024 != -1 and end_2024 != -1, "2024 bounds error"
    text = text[:start_2024] + replacement_2024 + text[end_2024:]

    if has_crlf:
        text = text.replace('\n', '\r\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("[OK] Successfully updated planner_catalog.js")

def update_curriculum_template():
    path = os.path.join(ROOT, 'curriculum_template.js')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    has_crlf = '\r\n' in content
    text = content.replace('\r\n', '\n')

    # 1. Update 034028 prerequisites from ["104041","104065","114071","114051"] to ["104041","104065"]
    text = text.replace(
        'prerequisites: ["104041","104065","114071","114051"],',
        'prerequisites: ["104041","104065"],'
    )

    # 2. Physics 1 (114051) and 1M (114071): semester 1 -> 2
    p1_re = r'("114051":\s*\{[\s\S]*?credits:\s*2\.5,\s*)semester:\s*1,'
    assert re.search(p1_re, text), "Failed to match 114051 in curriculum_template.js"
    text = re.sub(p1_re, r'\g<1>semester: 2,', text)

    p1m_re = r'("114071":\s*\{[\s\S]*?credits:\s*3\.5,\s*)semester:\s*1,'
    assert re.search(p1m_re, text), "Failed to match 114071 in curriculum_template.js"
    text = re.sub(p1m_re, r'\g<1>semester: 2,', text)

    # 3. Chemistry Lab (125013): semester 2 -> 4
    chem_re = r'("125013":\s*\{[\s\S]*?credits:\s*0\.5,\s*)semester:\s*2,'
    assert re.search(chem_re, text), "Failed to match 125013 in curriculum_template.js"
    text = re.sub(chem_re, r'\g<1>semester: 4,', text)

    # 4. Remove Yoga (03940805) from SAMPLE_ME_DEGREE in curriculum_template.js
    yoga_re = r'\s*"03940805":\s*\{\s*code:\s*"03940805",[\s\S]*?\}\s*,'
    assert re.search(yoga_re, text), "Failed to match 03940805 in curriculum_template.js"
    text = re.sub(yoga_re, '', text)

    if has_crlf:
        text = text.replace('\n', '\r\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("[OK] Successfully updated curriculum_template.js")

def update_app_js():
    path = os.path.join(ROOT, 'app.js')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    has_crlf = '\r\n' in content
    text = content.replace('\r\n', '\n')

    # 1. SAMPLE_ME_DEGREE in app.js: 114051 semester 1 -> 2
    p1_app_re = r'("114051":\s*\{\s*code:\s*"114051",\s*name:\s*"פיסיקה 1",\s*credits:\s*2\.5,\s*)semester:\s*1,'
    assert re.search(p1_app_re, text), "Failed to match 114051 in app.js SAMPLE_ME_DEGREE"
    text = re.sub(p1_app_re, r'\g<1>semester: 2,', text)

    # 2. 034028 prereqs in SAMPLE_ME_DEGREE in app.js
    old_solids_prereqs = 'prerequisites: ["104041","104065","114071","114051"],'
    new_solids_prereqs = 'prerequisites: ["104041","104065"],'
    text = text.replace(old_solids_prereqs, new_solids_prereqs)

    # 3. OFFICIAL_PREREQUISITES in app.js: remove 114051 from 034028
    old_off_solids = '''          "034028": [
                    "104041",
                    "104065",
                    "114051"
          ],'''
    new_off_solids = '''          "034028": [
                    "104041",
                    "104065"
          ],'''
    assert old_off_solids in text, "Failed to match OFFICIAL_PREREQUISITES 034028 in app.js"
    text = text.replace(old_off_solids, new_off_solids)

    if has_crlf:
        text = text.replace('\n', '\r\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("[OK] Successfully updated app.js")

def update_planner_module():
    path = os.path.join(ROOT, 'planner_module.js')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    has_crlf = '\r\n' in content
    text = content.replace('\r\n', '\n')

    # Update Degree Plan selection logic in initPlannerState to enforce strict isolation:
    # 1. Update gameState.degreePlan check (lines ~593)
    old_gs_check = """        // 1. First priority: cloud-synced degreePlan from global gameState
        if (global.gameState && Array.isArray(global.gameState.degreePlan) && global.gameState.degreePlan.length > 0) {
            try {
                if (!isAdir || isAdirPlanAuthentic(global.gameState.degreePlan)) {
                    loadedPlan = JSON.parse(JSON.stringify(global.gameState.degreePlan));
                    loadedUnassigned = Array.isArray(global.gameState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(global.gameState.degreePlanUnassigned)) : [];
                    console.log('[Planner] Initialized plan from gameState.degreePlan');
                } else {
                    console.warn('[Planner] Existing gameState.degreePlan was out-of-date or incomplete for Adir, preferring authentic preloaded plan.');
                }
            } catch (e) {
                console.error('[Planner] Error cloning gameState.degreePlan:', e);
            }
        }"""

    new_gs_check = """        // 1. First priority: cloud-synced degreePlan from global gameState
        if (global.gameState && Array.isArray(global.gameState.degreePlan) && global.gameState.degreePlan.length > 0) {
            try {
                if (isAdir) {
                    if (isAdirPlanAuthentic(global.gameState.degreePlan)) {
                        loadedPlan = JSON.parse(JSON.stringify(global.gameState.degreePlan));
                        loadedUnassigned = Array.isArray(global.gameState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(global.gameState.degreePlanUnassigned)) : [];
                        console.log('[Planner] Initialized plan from gameState.degreePlan (Adir authentic)');
                    } else {
                        console.warn('[Planner] Existing gameState.degreePlan was out-of-date or incomplete for Adir, preferring authentic preloaded plan.');
                    }
                } else {
                    // For non-Adir students/guests: reject Adir's custom personal plan
                    if (!isAdirPlanAuthentic(global.gameState.degreePlan)) {
                        loadedPlan = JSON.parse(JSON.stringify(global.gameState.degreePlan));
                        loadedUnassigned = Array.isArray(global.gameState.degreePlanUnassigned) ? JSON.parse(JSON.stringify(global.gameState.degreePlanUnassigned)) : [];
                        console.log('[Planner] Initialized plan from gameState.degreePlan (Student)');
                    } else {
                        console.warn('[Planner] Detected Adir custom curriculum signature in student/guest state. Resetting to recommended syllabus.');
                    }
                }
            } catch (e) {
                console.error('[Planner] Error cloning gameState.degreePlan:', e);
            }
        }"""
    assert old_gs_check in text, "Failed to match gameState.degreePlan check in planner_module.js"
    text = text.replace(old_gs_check, new_gs_check)

    # 2. Update line 608 & line 658: preloadedState.degreePlan is ONLY for Adir
    old_preload_check = "if (!loadedPlan && (isAdir || (typeof window !== 'undefined' && (window.Capacitor || window.location.protocol === 'capacitor:'))) && preloadedState && Array.isArray(preloadedState.degreePlan) && preloadedState.degreePlan.length > 0)"
    new_preload_check = "if (!loadedPlan && isAdir && preloadedState && Array.isArray(preloadedState.degreePlan) && preloadedState.degreePlan.length > 0)"
    assert old_preload_check in text, "Failed to match preload check in planner_module.js"
    text = text.replace(old_preload_check, new_preload_check)

    # 3. Update savedV2 & savedV1 check (lines ~623 and ~645)
    old_v2_check = "if (!isAdir || isAdirPlanAuthentic(semCandidate))"
    new_v2_check = "if (isAdir ? isAdirPlanAuthentic(semCandidate) : !isAdirPlanAuthentic(semCandidate))"
    assert old_v2_check in text, "Failed to match v2 check in planner_module.js"
    text = text.replace(old_v2_check, new_v2_check)

    if has_crlf:
        text = text.replace('\n', '\r\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("[OK] Successfully updated planner_module.js")

def update_auth_sync():
    path = os.path.join(ROOT, 'auth_sync.js')
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    has_crlf = '\r\n' in content
    text = content.replace('\r\n', '\n')

    # Update contamination detection in auth_sync.js
    old_contamination = """                    if (user.id === 'guest' || user.id !== 'adir_moshe') {
                        const hasAdirPlan = parsed && parsed.degreePlan && Array.isArray(parsed.degreePlan) && parsed.degreePlan.some(s => s.semester === 1 && (s.courses || []).some(c => c.code === '02340128' || c.code === '234128'));
                        const isContaminated = (
                            parsed.characterClass === 'סטודנט למדעי המחשב' ||
                            (parsed.completedCourses >= 10 && (parsed.gpa >= 86 || parsed.credits >= 38)) ||
                            hasAdirPlan
                        );"""

    new_contamination = """                    if (user.id === 'guest' || user.id !== 'adir_moshe') {
                        // Strict Adir customization detection:
                        // 1. Physics 1 in Sem 1 (belongs in Sem 2 by default)
                        // 2. Chem Lab in Sem 2 (belongs in Sem 4 by default)
                        // 3. Yoga in Sem 3 (sports elective, not in default syllabus)
                        const hasAdirCustomization = parsed && parsed.degreePlan && Array.isArray(parsed.degreePlan) && (
                            parsed.degreePlan.some(s => s.semester === 1 && (s.courses || []).some(c => c.code === '01140051' || c.altCode === '114051' || c.code === '114051')) ||
                            parsed.degreePlan.some(s => s.semester === 2 && (s.courses || []).some(c => c.code === '01250013' || c.altCode === '125013' || c.code === '125013')) ||
                            parsed.degreePlan.some(s => s.semester === 3 && (s.courses || []).some(c => c.code === '03940805' || c.altCode === '03940805'))
                        );
                        const isContaminated = (
                            parsed.characterClass === 'סטודנט למדעי המחשב' ||
                            (parsed.completedCourses >= 10 && (parsed.gpa >= 86 || parsed.credits >= 38)) ||
                            hasAdirCustomization
                        );"""

    assert old_contamination in text, "Failed to match old_contamination in auth_sync.js"
    text = text.replace(old_contamination, new_contamination)

    old_has_adir = "if (hasAdirPlan) {"
    new_has_adir = "if (hasAdirCustomization) {"
    assert old_has_adir in text, "Failed to match old_has_adir in auth_sync.js"
    text = text.replace(old_has_adir, new_has_adir)

    if has_crlf:
        text = text.replace('\n', '\r\n')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("[OK] Successfully updated auth_sync.js")

if __name__ == '__main__':
    update_planner_catalog()
    update_curriculum_template()
    update_app_js()
    update_planner_module()
    update_auth_sync()
    print("\nAll files successfully updated with authentic curriculum separation!")
