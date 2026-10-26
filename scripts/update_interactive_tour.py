import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILEPATH = os.path.join(ROOT, "interactive_tour.js")

with open(FILEPATH, "r", encoding="utf-8") as f:
    text = f.read()

# Replace InteractiveTour object implementation
new_code = '''    const InteractiveTour = {
        currentStep: 0,
        active: false,
        activeTargetEl: null,
        repositionHandler: null,
        keyHandler: null,
        stepTimer: null,
        scrollTimer: null,
        lastTab: null,

        init() {
            this.injectStyles();

            // Keyboard shortcut 'T' to launch tour manually from anywhere (when not typing in an input)
            window.addEventListener('keydown', (e) => {
                if (e.key === 't' || e.key === 'T' || e.key === 'א') {
                    const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
                    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
                    if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey && !this.active) {
                        e.preventDefault();
                        this.startTour(0);
                    }
                }
            });

            // NOTE: Auto-prompt on launch is intentionally DISABLED.
            // Per user directive: The tour is ONLY triggered when finishing registration (onboarding)
            // or when explicitly clicked in Settings/Tutorial Academy. Never on regular app launch.
        },

        injectStyles() {
            if (document.getElementById('tour-spotlight-styles')) return;
            const style = document.createElement('style');
            style.id = 'tour-spotlight-styles';
            style.textContent = `
                /* Elevate the navigation window bar so it remains 100% visible and interactive during tour */
                .hud-nav-tabs,
                .nav-tabs-left {
                    z-index: 99998 !important;
                }

                /* Active glowing pulse on current tab in the window bar */
                .tour-nav-tab-active-glow {
                    position: relative !important;
                    z-index: 99999 !important;
                    box-shadow: 0 0 0 2px #38bdf8, 0 0 22px rgba(56, 189, 248, 0.75) !important;
                    border-radius: 10px !important;
                    background: rgba(14, 165, 233, 0.22) !important;
                    animation: tourNavTabPulse 1.2s infinite alternate ease-in-out !important;
                }
                @keyframes tourNavTabPulse {
                    from {
                        box-shadow: 0 0 0 2px #38bdf8, 0 0 16px rgba(56, 189, 248, 0.55);
                    }
                    to {
                        box-shadow: 0 0 0 4px #7dd3fc, 0 0 28px rgba(125, 211, 252, 0.85);
                    }
                }

                /* Fullscreen SVG Spotlight Overlay Mask */
                .tour-spotlight-svg {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 99990;
                    pointer-events: none;
                    transition: opacity 0.25s ease;
                }
                
                #tour-cutout-rect {
                    transition: x 0.42s cubic-bezier(0.16, 1, 0.3, 1),
                                y 0.42s cubic-bezier(0.16, 1, 0.3, 1),
                                width 0.42s cubic-bezier(0.16, 1, 0.3, 1),
                                height 0.42s cubic-bezier(0.16, 1, 0.3, 1),
                                rx 0.3s ease,
                                ry 0.3s ease;
                }

                /* Backdrop Click Interceptor for closing/advancing */
                .tour-backdrop-layer {
                    position: fixed;
                    inset: 0;
                    z-index: 99989;
                    background: transparent;
                }

                /* Glowing Outline Ring over the Target Element */
                .tour-spotlight-frame {
                    position: fixed;
                    z-index: 99995;
                    border: 2px solid #38bdf8;
                    border-radius: 12px;
                    pointer-events: none;
                    box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.3), 0 0 35px rgba(56, 189, 248, 0.45);
                    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
                    animation: tourSpotlightPulse 2.4s infinite ease-in-out;
                }
                @keyframes tourSpotlightPulse {
                    0%, 100% {
                        box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.35), 0 0 30px rgba(56, 189, 248, 0.45);
                        border-color: #38bdf8;
                    }
                    50% {
                        box-shadow: 0 0 0 8px rgba(56, 189, 248, 0.15), 0 0 50px rgba(56, 189, 248, 0.65);
                        border-color: #7dd3fc;
                    }
                }

                /* Target element highlighted state */
                .tour-target-elevated {
                    position: relative !important;
                    z-index: 99994 !important;
                    transition: box-shadow 0.3s ease !important;
                }

                /* Floating Transition HUD Banner */
                .tour-transition-banner {
                    position: fixed;
                    top: 76px;
                    left: 50%;
                    transform: translateX(-50%) translateY(-25px);
                    background: rgba(15, 23, 42, 0.96);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1.5px solid #38bdf8;
                    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.35);
                    color: #f8fafc;
                    padding: 10px 24px;
                    border-radius: 999px;
                    z-index: 100010;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    direction: rtl;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .tour-transition-banner.visible {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                .tour-transition-icon {
                    font-size: 1.35rem;
                }
                .tour-transition-text {
                    color: #cbd5e1;
                    font-size: 0.92rem;
                }
                .tour-transition-text strong {
                    color: #38bdf8;
                    font-weight: 800;
                }

                /* Floating Anchored Popover Tooltip */
                .tour-popover {
                    position: fixed;
                    z-index: 100000;
                    background: rgba(15, 23, 42, 0.96);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(56, 189, 248, 0.45);
                    border-radius: 16px;
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.25);
                    width: 380px;
                    max-width: 92vw;
                    direction: rtl;
                    text-align: right;
                    color: #f8fafc;
                    padding: 16px 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    animation: tourPopoverPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    transition: top 0.28s cubic-bezier(0.16, 1, 0.3, 1), left 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
                }
                @keyframes tourPopoverPop {
                    from { transform: scale(0.92); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                /* Popover Directional Arrow Pointer */
                .tour-popover-arrow {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    background: #0f172a;
                    border: 1px solid rgba(56, 189, 248, 0.45);
                    transform: rotate(45deg);
                }
                .tour-popover[data-placement="bottom"] .tour-popover-arrow {
                    top: -8px;
                    border-bottom: none;
                    border-right: none;
                }
                .tour-popover[data-placement="top"] .tour-popover-arrow {
                    bottom: -8px;
                    border-top: none;
                    border-left: none;
                }
                .tour-popover[data-placement="left"] .tour-popover-arrow {
                    right: -8px;
                    border-bottom: none;
                    border-left: none;
                }
                .tour-popover[data-placement="right"] .tour-popover-arrow {
                    left: -8px;
                    border-top: none;
                    border-right: none;
                }

                /* Popover Header */
                .tour-popover-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    padding-bottom: 10px;
                }
                .tour-popover-title-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .tour-popover-icon {
                    font-size: 1.35rem;
                }
                .tour-popover-window-sub {
                    margin-bottom: 2px;
                }
                .tour-window-badge {
                    font-size: 0.72rem;
                    color: #38bdf8;
                    font-weight: 800;
                    letter-spacing: 0.02em;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .tour-popover-title {
                    font-size: 0.98rem;
                    font-weight: 800;
                    color: #f8fafc;
                    margin: 0;
                    line-height: 1.25;
                }
                .tour-popover-tag {
                    font-size: 0.68rem;
                    background: rgba(16, 185, 129, 0.16);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.4);
                    padding: 2px 7px;
                    border-radius: 8px;
                    font-weight: 700;
                    white-space: nowrap;
                }
                .tour-popover-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .tour-step-counter {
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: #94a3b8;
                    background: rgba(255, 255, 255, 0.06);
                    padding: 3px 8px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    white-space: nowrap;
                }
                .tour-popover-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0 4px;
                    line-height: 1;
                    transition: color 0.15s ease;
                }
                .tour-popover-close:hover {
                    color: #f8fafc;
                }

                /* Popover Body */
                .tour-popover-body {
                    font-size: 0.88rem;
                    color: #e2e8f0;
                    line-height: 1.6;
                }
                .tour-action-callout {
                    margin-top: 10px;
                    padding: 9px 12px;
                    background: rgba(56, 189, 248, 0.08);
                    border: 1px dashed rgba(56, 189, 248, 0.4);
                    border-radius: 9px;
                    font-size: 0.82rem;
                    color: #7dd3fc;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-weight: 600;
                }
                .tour-action-callout-btn {
                    margin-top: 8px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: linear-gradient(135deg, #0284c7, #2563eb);
                    color: #ffffff;
                    border: none;
                    border-radius: 7px;
                    padding: 5px 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.15s ease;
                }
                .tour-action-callout-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 3px 10px rgba(2, 132, 199, 0.4);
                }

                /* Popover Footer */
                .tour-popover-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255, 255, 255, 0.08);
                    padding-top: 10px;
                    margin-top: 2px;
                }
                .tour-skip-link {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 0.78rem;
                    cursor: pointer;
                    padding: 4px;
                    text-decoration: underline;
                }
                .tour-skip-link:hover {
                    color: #f1f5f9;
                }
                .tour-nav-btns {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .btn-tour-action {
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    font-family: inherit;
                }
                .btn-tour-prev {
                    background: rgba(30, 41, 59, 0.7);
                    color: #cbd5e1;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .btn-tour-prev:hover {
                    background: rgba(51, 65, 85, 0.8);
                    color: #ffffff;
                }
                .btn-tour-next {
                    background: linear-gradient(135deg, #0284c7, #2563eb);
                    color: #ffffff;
                    border: 1px solid rgba(56, 189, 248, 0.4);
                    box-shadow: 0 2px 10px rgba(2, 132, 199, 0.3);
                }
                .btn-tour-next:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
                }

                /* Welcome Prompt Modal */
                .tour-prompt-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(2, 6, 23, 0.82);
                    backdrop-filter: blur(8px);
                    z-index: 100005;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                }
                .tour-prompt-card {
                    background: #0f172a;
                    border: 1px solid rgba(56, 189, 248, 0.45);
                    box-shadow: 0 25px 65px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.2);
                    border-radius: 16px;
                    max-width: 480px;
                    width: 100%;
                    direction: rtl;
                    text-align: right;
                    overflow: hidden;
                    padding: 20px;
                    color: #e2e8f0;
                }
            `;
            document.head.appendChild(style);
        },

        showWelcomeTourPrompt() {
            if (document.getElementById('tour-welcome-prompt') || this.active) return;
            const onboardingModal = document.getElementById('onboarding-wizard-modal');
            if (onboardingModal && (
                onboardingModal.classList.contains('active') || 
                onboardingModal.style.display === 'flex' || 
                onboardingModal.style.display === 'block'
            )) {
                return;
            }

            const promptEl = document.createElement('div');
            promptEl.id = 'tour-welcome-prompt';
            promptEl.className = 'tour-prompt-backdrop';
            promptEl.innerHTML = `
                <div class="tour-prompt-card">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;">
                        <span style="font-size: 1.6rem;">🧭</span>
                        <div>
                            <h3 style="margin: 0; color: #38bdf8; font-size: 1.15rem; font-weight: 800;">
                                סיור מודרך חי ב-Semestero ME
                            </h3>
                            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">
                                הכר את כל החלונות המרכזיים במקומם הטבעי
                            </div>
                        </div>
                    </div>
                    <div style="font-size: 0.9rem; line-height: 1.65; color: #cbd5e1;">
                        במקום כרטיסיות טקסט ארוכות, הסיור יעביר אותך שלב-אחר-שלב בין כל החלונות המרכזיים, יאיר את הכפתורים החשובים וידגים בדיוק איפה ללחוץ ומה כל דבר עושה!
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
                        <button type="button" class="tour-skip-link" id="btn-prompt-skip-tour">
                            דלג בינתיים
                        </button>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn-tour-action btn-tour-prev" id="btn-prompt-open-hub">
                                📚 מרכז ההדרכה
                            </button>
                            <button type="button" class="btn-tour-action btn-tour-next" id="btn-prompt-start-tour">
                                🚀 התחל סיור מודרך
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(promptEl);

            document.getElementById('btn-prompt-start-tour').onclick = () => {
                promptEl.remove();
                this.startTour(0);
            };

            document.getElementById('btn-prompt-open-hub').onclick = () => {
                promptEl.remove();
                window.openTutorialHubModal();
            };

            document.getElementById('btn-prompt-skip-tour').onclick = () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
                promptEl.remove();
                if (typeof window.showHudToast === 'function') {
                    window.showHudToast('הסיור דולג. ניתן להפעילו בכל עת במקש T או דרך ההגדרות', 'info');
                }
            };
        },

        startTour(startIndex = 0) {
            this.currentStep = Math.max(0, Math.min(TOUR_STEPS.length - 1, startIndex));
            this.active = true;
            this.lastTab = null;

            // Remove welcome prompt if open
            const welcomePrompt = document.getElementById('tour-welcome-prompt');
            if (welcomePrompt) welcomePrompt.remove();

            // Setup DOM layers
            this.createOverlayLayers();

            // Global reposition listeners
            this.repositionHandler = () => {
                if (this.active) this.updateSpotlightPosition();
            };
            window.addEventListener('resize', this.repositionHandler, { passive: true });
            window.addEventListener('scroll', this.repositionHandler, { passive: true });

            // Keyboard navigation
            this.keyHandler = (e) => {
                if (!this.active) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.endTour(true);
                } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                    if (this.currentStep < TOUR_STEPS.length - 1) {
                        e.preventDefault();
                        this.nextStep();
                    }
                } else if (e.key === 'ArrowLeft') {
                    if (this.currentStep > 0) {
                        e.preventDefault();
                        this.prevStep();
                    }
                }
            };
            window.addEventListener('keydown', this.keyHandler);

            this.renderStep();
        },

        createOverlayLayers() {
            // Remove existing
            const oldSvg = document.getElementById('tour-spotlight-svg');
            if (oldSvg) oldSvg.remove();
            const oldFrame = document.getElementById('tour-spotlight-frame');
            if (oldFrame) oldFrame.remove();
            const oldPopover = document.getElementById('tour-popover');
            if (oldPopover) oldPopover.remove();
            const oldBanner = document.getElementById('tour-transition-banner');
            if (oldBanner) oldBanner.remove();

            // 1. Transition HUD Banner
            const banner = document.createElement('div');
            banner.id = 'tour-transition-banner';
            banner.className = 'tour-transition-banner';
            banner.innerHTML = `
                <span class="tour-transition-icon" id="tour-banner-icon">🧭</span>
                <span class="tour-transition-text" id="tour-banner-text">עובר לחלון...</span>
            `;
            document.body.appendChild(banner);

            // 2. SVG Cutout Mask
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'tour-spotlight-svg';
            svg.setAttribute('class', 'tour-spotlight-svg');
            svg.innerHTML = `
                <defs>
                    <mask id="tour-cutout-mask" maskUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect id="tour-cutout-rect" x="0" y="0" width="0" height="0" rx="12" ry="12" fill="black" />
                    </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(6, 10, 22, 0.78)" mask="url(#tour-cutout-mask)" />
            `;
            document.body.appendChild(svg);

            // 3. Animated Outline Frame
            const frame = document.createElement('div');
            frame.id = 'tour-spotlight-frame';
            frame.className = 'tour-spotlight-frame';
            frame.style.display = 'none';
            document.body.appendChild(frame);

            // 4. Anchored Popover
            const popover = document.createElement('div');
            popover.id = 'tour-popover';
            popover.className = 'tour-popover';
            popover.style.display = 'none';
            document.body.appendChild(popover);
        },

        showTransitionBanner(icon, windowName) {
            const banner = document.getElementById('tour-transition-banner');
            const iconEl = document.getElementById('tour-banner-icon');
            const textEl = document.getElementById('tour-banner-text');
            if (!banner) return;
            if (iconEl) iconEl.innerText = icon || '🧭';
            if (textEl) textEl.innerHTML = `עובר לחלון: <strong>${windowName}</strong>`;
            banner.classList.add('visible');
        },

        hideTransitionBanner() {
            const banner = document.getElementById('tour-transition-banner');
            if (banner) banner.classList.remove('visible');
        },

        renderStep() {
            if (!this.active) return;
            const step = TOUR_STEPS[this.currentStep];
            if (!step) return;

            // Clear any active timers
            if (this.stepTimer) {
                clearTimeout(this.stepTimer);
                this.stepTimer = null;
            }
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
                this.scrollTimer = null;
            }

            // Clean elevation on previous target
            if (this.activeTargetEl) {
                this.activeTargetEl.classList.remove('tour-target-elevated');
                this.activeTargetEl = null;
            }

            // Remove active glow from all nav tabs
            document.querySelectorAll('.tour-nav-tab-active-glow').forEach(el => {
                el.classList.remove('tour-nav-tab-active-glow');
            });

            const frame = document.getElementById('tour-spotlight-frame');
            const popover = document.getElementById('tour-popover');
            const cutout = document.getElementById('tour-cutout-rect');

            const isTabChange = (this.lastTab !== step.tab);
            this.lastTab = step.tab;

            if (isTabChange) {
                // 1. Temporarily hide frame & popover so user can take in the new page
                if (frame) frame.style.opacity = '0';
                if (popover) {
                    popover.style.opacity = '0';
                    popover.style.pointerEvents = 'none';
                }

                // 2. Open cutout mask widely so student can clearly observe the full workspace
                if (cutout) {
                    cutout.setAttribute('x', '0');
                    cutout.setAttribute('y', '0');
                    cutout.setAttribute('width', '100%');
                    cutout.setAttribute('height', '100%');
                    cutout.setAttribute('rx', '0');
                    cutout.setAttribute('ry', '0');
                }

                // 3. Display floating transition HUD banner
                this.showTransitionBanner(step.icon, step.windowName || step.title);

                // 4. Highlight the active tab button in the window bar
                const navTabBtn = document.getElementById(`tab-${step.tab}`);
                if (navTabBtn) {
                    navTabBtn.classList.add('tour-nav-tab-active-glow');
                }

                // 5. Switch Tab to the workspace
                switchAppTab(step.tab);

                // 6. DELIBERATE INTENTIONAL DELAY: 750ms so user notices where they navigated to!
                this.stepTimer = setTimeout(() => {
                    if (!this.active) return;
                    this.hideTransitionBanner();
                    this.locateAndHighlightTarget(step);
                }, 750);

            } else {
                // Same tab: smooth direct transition
                this.locateAndHighlightTarget(step);
            }
        },

        locateAndHighlightTarget(step) {
            // Find target element with fallback
            let targetEl = null;
            const targets = Array.isArray(step.target) ? step.target : [step.target];
            for (const selector of targets) {
                const found = document.querySelector(selector);
                if (found && found.offsetParent !== null) { // visible
                    targetEl = found;
                    break;
                }
            }

            if (!targetEl) {
                targetEl = document.getElementById(`${step.tab}-workspace`) || 
                           document.querySelector('.app-main-content') || 
                           document.body;
            }

            this.activeTargetEl = targetEl;
            if (targetEl && targetEl !== document.body) {
                targetEl.classList.add('tour-target-elevated');
                try {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                } catch (e) {}
            }

            // Delay slightly after scroll starts to compute final bounding rect
            this.scrollTimer = setTimeout(() => {
                if (!this.active) return;
                this.updateSpotlightPosition();
                this.renderPopoverContent(step);

                const frame = document.getElementById('tour-spotlight-frame');
                const popover = document.getElementById('tour-popover');
                if (frame) frame.style.opacity = '1';
                if (popover) {
                    popover.style.opacity = '1';
                    popover.style.pointerEvents = 'auto';
                }
            }, 220);
        },

        updateSpotlightPosition() {
            const frame = document.getElementById('tour-spotlight-frame');
            const cutout = document.getElementById('tour-cutout-rect');
            const popover = document.getElementById('tour-popover');
            if (!frame || !cutout || !this.activeTargetEl) return;

            let rect = this.activeTargetEl.getBoundingClientRect();

            // Guard against zero-dimension elements
            if (rect.width === 0 || rect.height === 0) {
                const parent = this.activeTargetEl.parentElement;
                if (parent) rect = parent.getBoundingClientRect();
            }

            // Add pleasant spotlight padding around the element
            const pad = 8;
            const x = Math.max(0, rect.left - pad);
            const y = Math.max(0, rect.top - pad);
            const width = Math.min(window.innerWidth - x, rect.width + (pad * 2));
            const height = Math.min(window.innerHeight - y, rect.height + (pad * 2));
            const radius = 12;

            // Update SVG cutout hole
            cutout.setAttribute('x', String(x));
            cutout.setAttribute('y', String(y));
            cutout.setAttribute('width', String(width));
            cutout.setAttribute('height', String(height));
            cutout.setAttribute('rx', String(radius));
            cutout.setAttribute('ry', String(radius));

            // Update Glowing Outline Frame
            frame.style.display = 'block';
            frame.style.left = `${x}px`;
            frame.style.top = `${y}px`;
            frame.style.width = `${width}px`;
            frame.style.height = `${height}px`;

            // Position popover relative to spotlight
            if (popover && popover.style.display !== 'none') {
                this.positionPopover(rect, x, y, width, height);
            }
        },

        positionPopover(targetRect, spotX, spotY, spotW, spotH) {
            const popover = document.getElementById('tour-popover');
            if (!popover) return;

            const step = TOUR_STEPS[this.currentStep];
            const popW = popover.offsetWidth || 380;
            const popH = popover.offsetHeight || 220;
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const margin = 14;

            // Detect bottom window / navigation bar
            let bottomNavHeight = 0;
            const bottomNavEl = document.querySelector('.nav-tabs-left');
            if (bottomNavEl) {
                const bRect = bottomNavEl.getBoundingClientRect();
                if (bRect.bottom >= winH - 8 && bRect.top < winH) {
                    bottomNavHeight = winH - bRect.top;
                }
            }
            // Strict safety bottom clearance: NEVER overlap the bottom window bar
            const safeBottomClearance = Math.max(bottomNavHeight + 16, 76);
            const maxAllowedBottomY = winH - popH - safeBottomClearance;

            let placement = step.placement || 'bottom';

            // Calculate space above and below
            const spaceBelow = winH - (spotY + spotH) - safeBottomClearance;
            const spaceAbove = spotY - 72; // header clearance

            // Strict collision rule: if bottom has not enough space, flip to top!
            if (placement === 'bottom' && spaceBelow < popH + margin && spaceAbove >= popH + margin) {
                placement = 'top';
            } else if (placement === 'top' && spaceAbove < popH + margin && spaceBelow >= popH + margin) {
                placement = 'bottom';
            } else if (spaceBelow < popH + margin && spaceAbove < popH + margin) {
                placement = (spaceAbove > spaceBelow) ? 'top' : 'bottom';
            }

            popover.setAttribute('data-placement', placement);

            let popX = spotX + (spotW / 2) - (popW / 2);
            let popY = 0;

            if (placement === 'bottom') {
                popY = spotY + spotH + margin;
            } else if (placement === 'top') {
                popY = spotY - popH - margin;
            } else if (placement === 'left') {
                popX = spotX - popW - margin;
                popY = spotY + (spotH / 2) - (popH / 2);
            } else if (placement === 'right') {
                popX = spotX + spotW + margin;
                popY = spotY + (spotH / 2) - (popH / 2);
            }

            // Viewport clamping: strictly keep popover above the bottom window bar!
            popX = Math.max(12, Math.min(winW - popW - 12, popX));
            popY = Math.max(72, Math.min(maxAllowedBottomY, popY));

            popover.style.left = `${Math.round(popX)}px`;
            popover.style.top = `${Math.round(popY)}px`;

            // Align arrow with target center
            const arrow = popover.querySelector('.tour-popover-arrow');
            if (arrow) {
                const targetCenterX = spotX + (spotW / 2);
                const arrowRelativeX = targetCenterX - popX - 7;
                const clampedArrowX = Math.max(20, Math.min(popW - 34, arrowRelativeX));
                arrow.style.left = `${Math.round(clampedArrowX)}px`;
            }
        },

        renderPopoverContent(step) {
            const popover = document.getElementById('tour-popover');
            if (!popover) return;

            const total = TOUR_STEPS.length;
            const isFirst = this.currentStep === 0;
            const isLast = this.currentStep === total - 1;

            let actionBtnHtml = '';
            if (step.actionBtn) {
                actionBtnHtml = `
                    <button type="button" class="tour-action-callout-btn" id="tour-step-interactive-btn">
                        ${step.actionBtn.label}
                    </button>
                `;
            }

            popover.innerHTML = `
                <div class="tour-popover-arrow"></div>
                <div class="tour-popover-header">
                    <div class="tour-popover-title-row">
                        <span class="tour-popover-icon">${step.icon}</span>
                        <div>
                            <div class="tour-popover-window-sub">
                                <span class="tour-window-badge">📍 ${step.windowName || 'חלון מערכת'}</span>
                            </div>
                            <h4 class="tour-popover-title">${step.title}</h4>
                        </div>
                    </div>
                    <div class="tour-popover-meta">
                        <span class="tour-popover-tag">${step.tag}</span>
                        <span class="tour-step-counter">${this.currentStep + 1} / ${total}</span>
                        <button type="button" class="tour-popover-close" id="tour-btn-close" aria-label="סגור">&times;</button>
                    </div>
                </div>

                <div class="tour-popover-body">
                    <div style="margin-bottom: 6px;">${step.text}</div>
                    ${step.actionTip ? `
                        <div class="tour-action-callout">
                            <span>💡</span>
                            <div>
                                <span>${step.actionTip}</span>
                                ${actionBtnHtml}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="tour-popover-footer">
                    <button type="button" class="tour-skip-link" id="tour-btn-skip">דלג על הסיור</button>
                    <div class="tour-nav-btns">
                        ${!isFirst ? `<button type="button" class="btn-tour-action btn-tour-prev" id="tour-btn-prev">הקודם</button>` : ''}
                        <button type="button" class="btn-tour-action btn-tour-next" id="tour-btn-next">
                            ${isLast ? 'סיום והתחלת עבודה 🚀' : 'הבא ➔'}
                        </button>
                    </div>
                </div>
            `;

            popover.style.display = 'flex';

            // Now that popover has dimensions, position it
            this.updateSpotlightPosition();

            // Bind listeners
            document.getElementById('tour-btn-close').onclick = () => this.endTour(true);
            document.getElementById('tour-btn-skip').onclick = () => this.endTour(true);

            const prevBtn = document.getElementById('tour-btn-prev');
            if (prevBtn) prevBtn.onclick = () => this.prevStep();

            document.getElementById('tour-btn-next').onclick = () => {
                if (isLast) this.endTour(false);
                else this.nextStep();
            };

            const actionBtn = document.getElementById('tour-step-interactive-btn');
            if (actionBtn && step.actionBtn && typeof step.actionBtn.onClick === 'function') {
                actionBtn.onclick = () => step.actionBtn.onClick();
            }
        },

        nextStep() {
            if (this.currentStep < TOUR_STEPS.length - 1) {
                this.currentStep++;
                this.renderStep();
            }
        },

        prevStep() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.renderStep();
            }
        },

        endTour(skipped = false) {
            this.active = false;

            if (this.stepTimer) {
                clearTimeout(this.stepTimer);
                this.stepTimer = null;
            }
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
                this.scrollTimer = null;
            }

            if (this.activeTargetEl) {
                this.activeTargetEl.classList.remove('tour-target-elevated');
                this.activeTargetEl = null;
            }

            // Remove active glow from all nav tabs
            document.querySelectorAll('.tour-nav-tab-active-glow').forEach(el => {
                el.classList.remove('tour-nav-tab-active-glow');
            });

            // Remove layers
            const svg = document.getElementById('tour-spotlight-svg');
            if (svg) svg.remove();
            const frame = document.getElementById('tour-spotlight-frame');
            if (frame) frame.remove();
            const popover = document.getElementById('tour-popover');
            if (popover) popover.remove();
            const banner = document.getElementById('tour-transition-banner');
            if (banner) banner.remove();

            // Unbind listeners
            if (this.repositionHandler) {
                window.removeEventListener('resize', this.repositionHandler);
                window.removeEventListener('scroll', this.repositionHandler);
                this.repositionHandler = null;
            }
            if (this.keyHandler) {
                window.removeEventListener('keydown', this.keyHandler);
                this.keyHandler = null;
            }

            localStorage.setItem(TOUR_STORAGE_KEY, 'true');

            if (typeof window.showHudToast === 'function') {
                if (skipped) {
                    window.showHudToast('הסיור דולג. תוכל להפעילו מחדש בכל עת במקש T או דרך ההגדרות', 'info');
                } else {
                    window.showHudToast('סיימת את הסיור המודרך בהצלחה! בהצלחה בתואר 🎓🚀', 'success');
                }
            }
        }
    };'''

# Cut from 'const InteractiveTour = {' up to 'window.InteractiveTour = InteractiveTour;'
start_idx = text.find("    const InteractiveTour = {")
end_idx = text.find("    window.InteractiveTour = InteractiveTour;")

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + new_code + "\n\n" + text[end_idx:]
    with open(FILEPATH, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("interactive_tour.js updated successfully!")
else:
    print(f"Error finding markers: start={start_idx}, end={end_idx}")
