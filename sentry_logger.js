/**
 * Semestero ME - Sentry SDK & Autonomous Crash Reporting Engine
 * 
 * Features:
 * 1. Hybrid Architecture:
 *    - Cloud Sentry Telemetry: Connects to Sentry when DSN is provided (via localStorage, window, or env).
 *    - Autonomous Local Buffer: Captures all uncaught errors, promise rejections, and critical console errors
 *      locally in localStorage & memory even when offline or without a Sentry account.
 * 2. Rich Academic Context:
 *    - Attaches platform (Web PWA, Android Capacitor, Electron Desktop), app version, active workspace tab,
 *      current semester, and breadcrumbs of recent user actions.
 * 3. 1-Click Diagnostics:
 *    - Exposes window.SemesteroSentry for testing, copying, exporting, and clearing crash reports.
 */

(function (global) {
    'use strict';

    const SENTRY_STORAGE_KEY = 'semestero_crash_reports';
    const SENTRY_DSN_KEY = 'semestero_sentry_dsn';
    const MAX_LOCAL_REPORTS = 50;
    const MAX_BREADCRUMBS = 20;

    const breadcrumbs = [];

    // Helper: Add breadcrumb
    function addBreadcrumb(category, message, data = {}) {
        const crumb = {
            timestamp: new Date().toISOString(),
            category: category || 'ui',
            message: String(message || ''),
            data: data || {}
        };
        breadcrumbs.push(crumb);
        if (breadcrumbs.length > MAX_BREADCRUMBS) {
            breadcrumbs.shift();
        }
    }

    // Helper: Read stored reports
    function getStoredReports() {
        try {
            const raw = localStorage.getItem(SENTRY_STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    // Helper: Save reports
    function saveReports(reports) {
        try {
            const trimmed = reports.slice(-MAX_LOCAL_REPORTS);
            localStorage.setItem(SENTRY_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (e) {}
    }

    // Helper: Gather runtime context
    function getAppContext() {
        let activeTab = 'unknown';
        try {
            if (global.curState && global.curState.activeWorkspace) {
                activeTab = global.curState.activeWorkspace;
            }
        } catch (e) {}

        const isCapacitor = !!(global.Capacitor && (global.Capacitor.isNativePlatform ? global.Capacitor.isNativePlatform() : global.Capacitor.Plugins));
        const isElectron = !!(global.process && global.process.versions && global.process.versions.electron);

        let platform = 'web-pwa';
        if (isCapacitor) platform = 'android-capacitor';
        else if (isElectron) platform = 'electron-desktop';

        return {
            version: (global.APP_CURRENT_REVISION && global.APP_CURRENT_REVISION.version) || '2.10.31',
            platform: platform,
            activeTab: activeTab,
            online: navigator.onLine !== undefined ? navigator.onLine : true,
            viewport: {
                width: global.innerWidth,
                height: global.innerHeight
            },
            url: global.location ? global.location.href : '',
            userAgent: navigator.userAgent || ''
        };
    }

    // Core record function
    function recordCrash(type, errorObj, extraInfo = {}) {
        const context = getAppContext();
        const report = {
            id: 'crash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toISOString(),
            type: type || 'error',
            message: (errorObj && errorObj.message) ? String(errorObj.message) : String(errorObj || 'Unknown error'),
            stack: (errorObj && errorObj.stack) ? String(errorObj.stack) : '',
            filename: extraInfo.filename || (errorObj && errorObj.filename) || '',
            lineno: extraInfo.lineno || (errorObj && errorObj.lineno) || 0,
            colno: extraInfo.colno || (errorObj && errorObj.colno) || 0,
            context: context,
            breadcrumbs: breadcrumbs.slice(-10),
            extra: extraInfo
        };

        const existing = getStoredReports();
        existing.push(report);
        saveReports(existing);

        // Also forward to cloud Sentry if loaded and initialized
        if (global.Sentry && typeof global.Sentry.captureException === 'function') {
            try {
                global.Sentry.withScope(function (scope) {
                    scope.setTag('platform', context.platform);
                    scope.setTag('active_tab', context.activeTab);
                    scope.setTag('semestero_version', context.version);
                    scope.setExtra('breadcrumbs', report.breadcrumbs);
                    if (errorObj instanceof Error) {
                        global.Sentry.captureException(errorObj);
                    } else {
                        global.Sentry.captureMessage(report.message, 'error');
                    }
                });
            } catch (e) {
                console.warn('[SemesteroSentry] Cloud forwarding failed:', e);
            }
        }

        return report;
    }

    // Install global handlers immediately if available
    if (typeof global.addEventListener === 'function') {
        global.addEventListener('error', function (event) {
            recordCrash('uncaught_error', event.error || { message: event.message }, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        global.addEventListener('unhandledrejection', function (event) {
            const reason = event.reason;
            recordCrash('unhandled_rejection', reason instanceof Error ? reason : { message: String(reason) });
        });
    } else if (typeof process !== 'undefined' && typeof process.on === 'function') {
        process.on('uncaughtException', function (err) {
            recordCrash('uncaught_error', err);
        });
        process.on('unhandledRejection', function (reason) {
            recordCrash('unhandled_rejection', reason instanceof Error ? reason : { message: String(reason) });
        });
    }

    // Intercept console.error to record breadcrumb
    const originalConsoleError = console.error;
    console.error = function () {
        const args = Array.prototype.slice.call(arguments);
        addBreadcrumb('console', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
        originalConsoleError.apply(console, arguments);
    };

    // Track tab clicks and modal openings as breadcrumbs
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('click', function (e) {
            try {
                const target = e.target;
                if (!target || typeof target.closest !== 'function') return;
                const btn = target.closest('button, a, .tab-btn, .nav-item');
                if (btn) {
                    const text = (btn.innerText || btn.getAttribute('title') || btn.id || btn.className || '').slice(0, 40).trim();
                    if (text) {
                        addBreadcrumb('ui_click', text);
                    }
                }
            } catch (ignored) {}
        }, { passive: true });
    }

    // Initialize Cloud Sentry lazily if DSN is set
    function initCloudSentry(dsn) {
        const activeDsn = dsn || localStorage.getItem(SENTRY_DSN_KEY) || global.SEMESTERO_SENTRY_DSN;
        if (!activeDsn) return;

        // If Sentry script is not yet present, inject it
        if (!global.Sentry) {
            const script = document.createElement('script');
            script.src = 'https://browser.sentry-cdn.com/7.108.0/bundle.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = function () {
                if (global.Sentry) {
                    global.Sentry.init({
                        dsn: activeDsn,
                        release: 'semestero-me@' + getAppContext().version,
                        environment: getAppContext().platform,
                        tracesSampleRate: 0.2
                    });
                    console.log('✅ [SemesteroSentry] Cloud Sentry initialized successfully.');
                }
            };
            document.head.appendChild(script);
        } else {
            global.Sentry.init({
                dsn: activeDsn,
                release: 'semestero-me@' + getAppContext().version,
                environment: getAppContext().platform,
                tracesSampleRate: 0.2
            });
            console.log('✅ [SemesteroSentry] Cloud Sentry initialized with existing bundle.');
        }
    }

    // Auto-init if DSN already saved in localStorage
    if (typeof window !== 'undefined') {
        const savedDsn = localStorage.getItem(SENTRY_DSN_KEY);
        if (savedDsn) {
            initCloudSentry(savedDsn);
        }
    }

    // Public API
    const SemesteroSentry = {
        addBreadcrumb: addBreadcrumb,
        recordCrash: recordCrash,
        captureException: function (err, extra) {
            return recordCrash('manual_exception', err instanceof Error ? err : new Error(String(err)), extra);
        },
        captureMessage: function (msg, level = 'info') {
            addBreadcrumb('manual_message', msg, { level: level });
            if (level === 'error') {
                return recordCrash('manual_message', { message: msg }, { level: level });
            }
        },
        getCrashReports: getStoredReports,
        clearCrashReports: function () {
            localStorage.removeItem(SENTRY_STORAGE_KEY);
            return true;
        },
        exportJson: function () {
            return JSON.stringify(getStoredReports(), null, 2);
        },
        setDsn: function (dsn) {
            if (dsn && typeof dsn === 'string' && dsn.trim()) {
                localStorage.setItem(SENTRY_DSN_KEY, dsn.trim());
                initCloudSentry(dsn.trim());
                return true;
            } else {
                localStorage.removeItem(SENTRY_DSN_KEY);
                return false;
            }
        },
        getDsn: function () {
            return localStorage.getItem(SENTRY_DSN_KEY) || '';
        },
        triggerTestError: function () {
            try {
                throw new Error('Semestero ME Sentry Test Crash: verification of error capturing mechanism');
            } catch (err) {
                return recordCrash('test_error', err);
            }
        }
    };

    global.SemesteroSentry = SemesteroSentry;
    global.captureException = SemesteroSentry.captureException;
    global.captureMessage = SemesteroSentry.captureMessage;

})(typeof window !== 'undefined' ? window : global);
