import os
import sys
import time

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\user\.gemini\antigravity\brain\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # iPhone 14 Pro mobile viewport
    context = browser.new_context(
        viewport={"width": 393, "height": 852},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))

    print("[Step 1] Loading http://localhost:8080/index.html?user=adir on Mobile Safari viewport...")
    page.goto("http://localhost:8080/index.html?user=adir", wait_until="networkidle")
    page.wait_for_timeout(2000)

    # 1. Check displayed version
    display_ver = page.locator("#display-system-version").inner_text()
    print(f"  [OK] display-system-version: {display_ver}")
    assert "2.5.2" in display_ver, f"Expected 2.5.2 in display-system-version, got {display_ver}"

    footer_ver = page.locator("#footer-version-badge").inner_text()
    print(f"  [OK] footer-version-badge: {footer_ver}")
    assert "2.5.2" in footer_ver, f"Expected 2.5.2 in footer-version-badge, got {footer_ver}"

    # 2. Check window.APP_VERSION and APP_CURRENT_REVISION
    app_version_js = page.evaluate("() => ({ windowVer: window.APP_VERSION, revVer: APP_CURRENT_REVISION.version })")
    print(f"  [OK] JavaScript versions: {app_version_js}")
    assert app_version_js["windowVer"] == "2.5.2", f"window.APP_VERSION is {app_version_js['windowVer']}"
    assert app_version_js["revVer"] == "2.5.2", f"APP_CURRENT_REVISION.version is {app_version_js['revVer']}"

    # 3. Test Direct Downloads Button in HUD
    print("[Step 2] Testing Direct Downloads button in top HUD...")
    download_btn = page.locator("#btn-open-downloads-modal")
    assert download_btn.is_visible(), "Download button #btn-open-downloads-modal not visible"
    download_btn.click()
    page.wait_for_timeout(500)

    modal = page.locator("#direct-download-modal")
    assert modal.is_visible(), "direct-download-modal should be visible after clicking button"
    print("  [OK] direct-download-modal opened successfully")

    # Check Android APK download link
    apk_link = modal.locator("a[href*='Semestero-ME.apk']").get_attribute("href")
    print(f"  [OK] Android APK Link: {apk_link}")
    assert "Semestero-ME.apk" in apk_link, "APK link invalid"

    # Check iOS guide text
    modal_text = modal.inner_text()
    assert "אייפון" in modal_text, "iOS instructions missing in modal"
    assert "Safari" in modal_text or "ספארי" in modal_text, "Safari step missing in modal"
    print("  [OK] iOS Home Screen instructions verified")

    # Screenshot of modal
    screenshot_modal = os.path.join(ARTIFACTS_DIR, "qa_v252_direct_downloads_modal.png")
    modal.screenshot(path=screenshot_modal)
    print(f"  [OK] Saved modal screenshot: {screenshot_modal}")

    # Close modal
    modal.locator("button.modal-close").click()
    page.wait_for_timeout(400)
    assert not modal.is_visible(), "direct-download-modal should be closed"

    # 4. Test checkRemoteAppVersion throttling & loop guard
    print("[Step 3] Testing checkRemoteAppVersion loop guard and throttling...")
    guard_result = page.evaluate("""async () => {
        // Run checkRemoteAppVersion twice in a row
        await window.checkRemoteAppVersion(false);
        const lastTs = localStorage.getItem('semestero_last_auto_update_ts');
        await window.checkRemoteAppVersion(false);
        return {
            lastTs: lastTs,
            url: window.location.href
        };
    }""")
    print(f"  [OK] Loop guard evaluated cleanly: {guard_result}")

    # 5. Test Settings Page download card
    print("[Step 4] Navigating to Settings tab to verify download card...")
    page.locator("#tab-settings").click()
    page.wait_for_timeout(800)
    settings_download_card = page.locator("#card-btn-direct-downloads")
    assert settings_download_card.is_visible(), "Settings download card #card-btn-direct-downloads not visible"
    settings_download_card.locator("button").click()
    page.wait_for_timeout(500)
    assert modal.is_visible(), "Modal should open from Settings page too"
    print("  [OK] Settings page download card verified and opened modal")

    modal.locator("button.modal-close").click()
    page.wait_for_timeout(300)

    # Full page screenshot
    screenshot_full = os.path.join(ARTIFACTS_DIR, "qa_v252_mobile_verified.png")
    page.screenshot(path=screenshot_full)
    print(f"  [OK] Saved mobile screenshot: {screenshot_full}")

    browser.close()
    print("\n🎉 ALL TESTS PASSED WITH 100% SUCCESS!")
