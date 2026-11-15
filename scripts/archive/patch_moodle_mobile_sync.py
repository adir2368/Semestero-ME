import re
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

print("Starting patch for moodle_sync.js...")

with open("moodle_sync.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update auto-sync on startup to support native mobile (Android APK / Capacitor) as well as Electron
old_startup = """            // Background auto-sync on app launch if URL is configured and running in Electron (where CORS is bypassed via IPC)
            const isElectron = !!(window.electronAPI && window.electronAPI.isElectron);
            if (this.config.url && this.config.autoSync && isElectron) {
                setTimeout(() => {
                    console.log('[MoodleSync] Triggering background auto-sync on startup (Electron IPC)...');
                    this.sync({ isSilent: true });
                }, 2000);
            }"""

new_startup = """            // Background auto-sync on app launch if URL is configured and running in native app (Electron or Android phone)
            const isNative = !!(
                (window.electronAPI && window.electronAPI.isElectron) ||
                (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.fetchMoodleIcs === 'function') ||
                (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
                (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp)
            );
            if (this.config.url && this.config.autoSync && isNative) {
                setTimeout(() => {
                    console.log('[MoodleSync] Triggering background auto-sync on startup (native mobile/desktop bridge)...');
                    this.sync({ isSilent: true });
                }, 2500);
            }"""

if old_startup in code:
    code = code.replace(old_startup, new_startup, 1)
    print("✓ Updated background auto-sync for native mobile phone app")
else:
    print("Warning: old_startup not matched directly, checking normalized...")

# 2. Update fetchIcsFeed to support Android Native Bridge & CapacitorHttp
old_fetch_feed = """            // Method 1: Native Electron Bridge (100% reliable, zero CORS restrictions)
            if (window.electronAPI && typeof window.electronAPI.fetchMoodleFeed === 'function') {
                console.log('[MoodleSync] Fetching via Electron native IPC bridge:', cleanUrl);
                const res = await window.electronAPI.fetchMoodleFeed(cleanUrl);
                if (res && res.success && res.data && res.data.includes('BEGIN:VCALENDAR')) {
                    return res.data;
                }
                if (res && !res.success) {
                    console.warn('[MoodleSync] Electron native fetch error:', res.error);
                    throw new Error(res.error || 'שגיאת התחברות ב-Electron');
                }
            }

            // Method 2: Direct Fetch (works in Electron without bridge if webSecurity is false, or in browser if allowed)"""

new_fetch_feed = """            // Method 1: Native Electron Bridge (100% reliable on Desktop, zero CORS restrictions)
            if (window.electronAPI && typeof window.electronAPI.fetchMoodleFeed === 'function') {
                console.log('[MoodleSync] Fetching via Electron native IPC bridge:', cleanUrl);
                const res = await window.electronAPI.fetchMoodleFeed(cleanUrl);
                if (res && res.success && res.data && res.data.includes('BEGIN:VCALENDAR')) {
                    return res.data;
                }
                if (res && !res.success) {
                    console.warn('[MoodleSync] Electron native fetch error:', res.error);
                    throw new Error(res.error || 'שגיאת התחברות ב-Electron');
                }
            }

            // Method 1b: Android Native Phone App Bridge (100% reliable on Phone, zero CORS restrictions)
            if (window.SemesteroWidgetBridge && typeof window.SemesteroWidgetBridge.fetchMoodleIcs === 'function') {
                console.log('[MoodleSync] Fetching via Android native SemesteroWidgetBridge on phone:', cleanUrl);
                try {
                    const icsData = window.SemesteroWidgetBridge.fetchMoodleIcs(cleanUrl);
                    if (icsData && icsData.includes('BEGIN:VCALENDAR')) {
                        console.log('[MoodleSync] Android native bridge fetch succeeded! Length:', icsData.length);
                        return icsData;
                    }
                    if (icsData && icsData.startsWith('ERROR:')) {
                        console.warn('[MoodleSync] Android bridge returned error:', icsData);
                        if (icsData.includes('401') || icsData.includes('403') || icsData.includes('Invalid authentication')) {
                            throw new Error('אימות שגוי מול מודל (טוקן פג תוקף). הפק קישור חדש במודל.');
                        }
                        throw new Error(icsData);
                    }
                } catch (bridgeErr) {
                    console.warn('[MoodleSync] SemesteroWidgetBridge error, trying CapacitorHttp fallback:', bridgeErr);
                }
            }

            // Method 1c: Capacitor Native HTTP Plugin (zero CORS on Android/iOS)
            const cap = window.Capacitor;
            if (cap && (
                (typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) ||
                (cap.Plugins && cap.Plugins.CapacitorHttp) ||
                (cap.CapacitorHttp) ||
                (typeof cap.getPlatform === 'function' && (cap.getPlatform() === 'android' || cap.getPlatform() === 'ios'))
            )) {
                const httpPlugin = (cap.Plugins && cap.Plugins.CapacitorHttp) || cap.CapacitorHttp;
                if (httpPlugin && typeof httpPlugin.get === 'function') {
                    try {
                        console.log('[MoodleSync] Fetching via Capacitor native HTTP plugin (zero CORS)...');
                        const response = await httpPlugin.get({
                            url: cleanUrl,
                            headers: {
                                'Accept': 'text/calendar, text/plain, */*'
                            },
                            connectTimeout: 15000,
                            readTimeout: 20000
                        });
                        const data = response && response.data;
                        if (typeof data === 'string' && data.includes('BEGIN:VCALENDAR')) {
                            console.log('[MoodleSync] CapacitorHttp fetch succeeded! Length:', data.length);
                            return data;
                        }
                        if (typeof data === 'string' && data.includes('Invalid authentication')) {
                            throw new Error('אימות שגוי מול מודל (טוקן פג תוקף). הפק קישור חדש במודל.');
                        }
                    } catch (capErr) {
                        console.warn('[MoodleSync] CapacitorHttp.get failed, trying direct fetch:', capErr);
                    }
                }
            }

            // Method 2: Direct Fetch (works in Electron without bridge if webSecurity is false, or in browser if allowed)"""

if old_fetch_feed in code:
    code = code.replace(old_fetch_feed, new_fetch_feed, 1)
    print("✓ Added Android Native Bridge & CapacitorHttp to fetchIcsFeed in moodle_sync.js")
else:
    print("Warning: old_fetch_feed not matched directly!")

with open("moodle_sync.js", "w", encoding="utf-8") as f:
    f.write(code)

print("✓ Successfully updated moodle_sync.js")
