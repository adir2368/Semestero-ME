// Accessibility (תפריט נגישות) Controller - IS 5568 / WCAG 2.1 AA
(function() {
    'use strict';

    const A11Y_STORAGE_KEY = 'semestero_a11y_prefs';

    let currentPrefs = {
        largeText: false,
        highContrast: false,
        grayscale: false,
        highlightLinks: false,
        readableFont: false,
        stopAnimations: false
    };

    function loadPrefs() {
        try {
            const saved = localStorage.getItem(A11Y_STORAGE_KEY);
            if (saved) {
                currentPrefs = Object.assign(currentPrefs, JSON.parse(saved));
            }
        } catch (e) {}
    }

    function savePrefs() {
        try {
            localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(currentPrefs));
        } catch (e) {}
    }

    function applyA11yClasses() {
        const root = document.documentElement;
        const body = document.body;

        const toggleClass = (cls, cond) => {
            if (root) root.classList.toggle(cls, cond);
            if (body) body.classList.toggle(cls, cond);
        };

        toggleClass('a11y-large-text', !!currentPrefs.largeText);
        toggleClass('a11y-high-contrast', !!currentPrefs.highContrast);
        toggleClass('a11y-grayscale', !!currentPrefs.grayscale);
        toggleClass('a11y-highlight-links', !!currentPrefs.highlightLinks);
        toggleClass('a11y-readable-font', !!currentPrefs.readableFont);
        toggleClass('a11y-stop-animations', !!currentPrefs.stopAnimations);

        // Update active class on buttons
        updateButtonStates();
    }

    function updateButtonStates() {
        const mapping = {
            'a11y-btn-large-text': currentPrefs.largeText,
            'a11y-btn-contrast': currentPrefs.highContrast,
            'a11y-btn-grayscale': currentPrefs.grayscale,
            'a11y-btn-links': currentPrefs.highlightLinks,
            'a11y-btn-font': currentPrefs.readableFont,
            'a11y-btn-anim': currentPrefs.stopAnimations
        };

        for (const [id, val] of Object.entries(mapping)) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.classList.toggle('active', !!val);
                btn.setAttribute('aria-pressed', !!val);
            }
        }
    }

    function setupEventListeners() {
        const triggerBtn = document.getElementById('btn-accessibility-trigger');
        const modal = document.getElementById('accessibility-modal');
        const closeBtn = document.getElementById('a11y-close-btn');
        const resetBtn = document.getElementById('a11y-btn-reset');

        if (triggerBtn && modal) {
            triggerBtn.addEventListener('click', () => {
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                }
            });
        }

        // Toggles
        const bindToggle = (id, key) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => {
                    currentPrefs[key] = !currentPrefs[key];
                    savePrefs();
                    applyA11yClasses();
                });
            }
        };

        bindToggle('a11y-btn-large-text', 'largeText');
        bindToggle('a11y-btn-contrast', 'highContrast');
        bindToggle('a11y-btn-grayscale', 'grayscale');
        bindToggle('a11y-btn-links', 'highlightLinks');
        bindToggle('a11y-btn-font', 'readableFont');
        bindToggle('a11y-btn-anim', 'stopAnimations');

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                currentPrefs = {
                    largeText: false,
                    highContrast: false,
                    grayscale: false,
                    highlightLinks: false,
                    readableFont: false,
                    stopAnimations: false
                };
                savePrefs();
                applyA11yClasses();
            });
        }
    }

    // Init on DOM ready
    loadPrefs();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyA11yClasses();
            setupEventListeners();
        });
    } else {
        applyA11yClasses();
        setupEventListeners();
    }

    window.openAccessibilityModal = function() {
        const modal = document.getElementById('accessibility-modal');
        if (modal) {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }
    };
})();
