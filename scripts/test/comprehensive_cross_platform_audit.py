import os
import sys
import json
import time

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

results = {
    "desktop": {},
    "mobile": {},
    "tablet": {},
    "console_errors": [],
    "screenshots": []
}

def log_console(msg):
    if msg.type in ["error", "warning"]:
        results["console_errors"].append(f"[{msg.type.upper()}] {msg.text}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # ==========================================
    # 1. DESKTOP AUDIT (1920x1080)
    # ==========================================
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()
    page.on("console", log_console)
    
    print("[1/3] Loading Desktop view at 1920x1080...")
    page.goto("http://localhost:8080/index.html", wait_until="networkidle")
    page.wait_for_timeout(2000)
    
    # Verify version badges
    footer_badge = page.locator("#footer-version-badge").inner_text()
    results["desktop"]["footer_version"] = footer_badge
    print(f"  [OK] Footer version: {footer_badge}")
    
    # Verify Initial Zoom Level
    # Look at svg transform or current zoom variable in app.js
    zoom_val = page.evaluate("""() => {
        if (typeof currentZoom !== 'undefined') return currentZoom;
        const g = document.getElementById('tree-group') || document.querySelector('.flowchart-container svg g');
        if (g && g.getAttribute('transform')) return g.getAttribute('transform');
        return 'N/A';
    }""")
    results["desktop"]["initial_zoom"] = zoom_val
    print(f"  [OK] Initial Flowchart Zoom/Transform: {zoom_val}")
    
    # Screenshot 1: Desktop Overview
    shot_desktop = os.path.join(ARTIFACTS_DIR, "qa_desktop_overview.png")
    page.screenshot(path=shot_desktop, full_page=False)
    results["screenshots"].append(shot_desktop)
    print(f"  [OK] Captured: qa_desktop_overview.png")
    
    # Click Course 034035 (Thermodynamics 1)
    print("  Testing Course 034035 (Thermodynamics 1) modal...")
    page.evaluate("() => { if (typeof openCourseDetails === 'function') openCourseDetails('034035'); }")
    page.wait_for_timeout(1000)
    
    # Check if Moodle 26 syllabus card is rendered
    moodle_card_thermo = page.locator(".modal-moodle26-syllabus-card").count()
    results["desktop"]["thermo_moodle_card_found"] = moodle_card_thermo > 0
    thermo_card_text = page.locator(".modal-moodle26-syllabus-card").first.inner_text() if moodle_card_thermo > 0 else ""
    results["desktop"]["thermo_syllabus_text"] = thermo_card_text
    print(f"  [OK] Thermo Moodle 26 card detected: {moodle_card_thermo > 0}")
    
    shot_thermo = os.path.join(ARTIFACTS_DIR, "qa_desktop_thermo_modal.png")
    page.screenshot(path=shot_thermo)
    results["screenshots"].append(shot_thermo)
    print(f"  [OK] Captured: qa_desktop_thermo_modal.png")
    
    # Close modal
    page.evaluate("() => { const m = document.querySelector('.modal-overlay.active, #course-modal.active, .modal.active'); if (m) m.classList.remove('active'); const c = document.getElementById('course-modal'); if (c) c.style.display='none'; }")
    page.wait_for_timeout(500)
    
    # Click Course 034053 (Mechanics of Solids 2M)
    print("  Testing Course 034053 (Mechanics of Solids 2M) modal...")
    page.evaluate("() => { if (typeof openCourseDetails === 'function') openCourseDetails('034053'); }")
    page.wait_for_timeout(1000)
    
    moodle_card_solids = page.locator(".modal-moodle26-syllabus-card").count()
    results["desktop"]["solids_moodle_card_found"] = moodle_card_solids > 0
    solids_card_text = page.locator(".modal-moodle26-syllabus-card").first.inner_text() if moodle_card_solids > 0 else ""
    results["desktop"]["solids_syllabus_text"] = solids_card_text
    print(f"  [OK] Solids 2 Moodle 26 card detected: {moodle_card_solids > 0}")
    
    shot_solids = os.path.join(ARTIFACTS_DIR, "qa_desktop_solids_modal.png")
    page.screenshot(path=shot_solids)
    results["screenshots"].append(shot_solids)
    print(f"  [OK] Captured: qa_desktop_solids_modal.png")
    
    # Close modal
    page.evaluate("() => { const c = document.getElementById('course-modal'); if (c) c.style.display='none'; }")
    page.wait_for_timeout(500)
    
    # Open Tasks Drawer / Check Tasks State
    print("  Testing Tasks / User State...")
    tasks_check = page.evaluate("""() => {
        const state = (typeof gameState !== 'undefined') ? gameState : (window.PRELOADED_USER_STATE || {});
        const thermo = state.courses && state.courses['034035'];
        const solids = state.courses && state.courses['034053'];
        const comp = state.courses && state.courses['034056'];
        return {
            thermo_tasks: thermo ? thermo.tasks : [],
            solids_tasks: solids ? solids.tasks : [],
            comp_tasks: comp ? comp.tasks : []
        };
    }""")
    results["desktop"]["tasks_audit"] = tasks_check
    
    # Open Tasks Drawer UI if available
    page.evaluate("() => { const b = document.getElementById('btn-open-tasks') || document.querySelector('[data-action=\"tasks\"]'); if (b) b.click(); }")
    page.wait_for_timeout(800)
    shot_tasks = os.path.join(ARTIFACTS_DIR, "qa_desktop_tasks_drawer.png")
    page.screenshot(path=shot_tasks)
    results["screenshots"].append(shot_tasks)
    
    context.close()
    
    # ==========================================
    # 2. MOBILE AUDIT (390x844 - iPhone 14/15)
    # ==========================================
    print("\n[2/3] Loading Mobile view at 390x844...")
    m_context = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        is_mobile=True,
        has_touch=True
    )
    m_page = m_context.new_page()
    m_page.on("console", log_console)
    m_page.goto("http://localhost:8080/index.html", wait_until="networkidle")
    m_page.wait_for_timeout(2000)
    
    # Measure overflow or layout bounds
    m_layout = m_page.evaluate("""() => {
        return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            headerHeight: document.querySelector('header, .app-header')?.clientHeight || 0,
            bottomNavVisible: !!document.querySelector('.bottom-nav, .mobile-nav, nav')
        };
    }""")
    results["mobile"]["layout"] = m_layout
    print(f"  [OK] Mobile horizontal scroll: {m_layout['hasHorizontalScroll']} (scrollWidth: {m_layout['scrollWidth']}, clientWidth: {m_layout['clientWidth']})")
    
    shot_mobile = os.path.join(ARTIFACTS_DIR, "qa_mobile_overview.png")
    m_page.screenshot(path=shot_mobile)
    results["screenshots"].append(shot_mobile)
    print(f"  [OK] Captured: qa_mobile_overview.png")
    
    # Open mobile course modal
    m_page.evaluate("() => { if (typeof openCourseDetails === 'function') openCourseDetails('034035'); }")
    m_page.wait_for_timeout(1000)
    shot_mobile_modal = os.path.join(ARTIFACTS_DIR, "qa_mobile_course_modal.png")
    m_page.screenshot(path=shot_mobile_modal)
    results["screenshots"].append(shot_mobile_modal)
    print(f"  [OK] Captured: qa_mobile_course_modal.png")
    
    m_context.close()
    
    # ==========================================
    # 3. TABLET AUDIT (768x1024 - iPad)
    # ==========================================
    print("\n[3/3] Loading Tablet view at 768x1024...")
    t_context = browser.new_context(
        viewport={"width": 768, "height": 1024},
        is_mobile=True,
        has_touch=True
    )
    t_page = t_context.new_page()
    t_page.on("console", log_console)
    t_page.goto("http://localhost:8080/index.html", wait_until="networkidle")
    t_page.wait_for_timeout(2000)
    
    t_layout = t_page.evaluate("""() => {
        return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
    }""")
    results["tablet"]["layout"] = t_layout
    print(f"  [OK] Tablet horizontal scroll: {t_layout['hasHorizontalScroll']}")
    
    shot_tablet = os.path.join(ARTIFACTS_DIR, "qa_tablet_overview.png")
    t_page.screenshot(path=shot_tablet)
    results["screenshots"].append(shot_tablet)
    print(f"  [OK] Captured: qa_tablet_overview.png")
    
    t_context.close()
    browser.close()

# Save JSON results
report_path = os.path.join(ARTIFACTS_DIR, "qa_audit_results.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("\nAudit successfully completed! Results saved to:", report_path)
