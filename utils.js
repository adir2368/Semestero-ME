// ==============================================================================
// Semestero Shared Utilities (loaded early via <script src="utils.js">)
// Provides canonical HTML escaping and Technion course-code normalization across
// modules while remaining safe when required in isolated Node.js test runners.
// ==============================================================================
(function (root) {
    'use strict';

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Normalize an 8-digit SAP/Cheesefork Technion course code.
     * - preserve03SevenDigit: true  -> matches Cheesefork 7-digit '03xxxxx' -> '3xxxxxx', others -> 6-digit root
     * - preserve03SevenDigit: false -> matches flowchart 6-digit normalization (preserving '0394xxxx')
     */
    function normalizeTechnionCourseCode(raw, options) {
        if (!raw) return '';
        const str = String(raw).trim();
        const opts = options || {};
        if (opts.preserve03SevenDigit) {
            if (str.length === 8) {
                if (str.startsWith('03')) return str.substring(1);
                return str.substring(1, 4) + str.substring(5);
            }
            return str;
        }
        if (/^\d{8}$/.test(str) && str.startsWith('0') && !str.startsWith('0394')) {
            return str.slice(1, 4) + str.slice(5);
        }
        return str;
    }

    /**
     * Expand any 5/6/7/8-digit Technion course code into all equivalent length representations.
     * Supports 5-digit ('34053'), 6-digit ('034053', '104041'), 7-digit ('0940202', '1040041'),
     * stripped-8 ('340053'), and standard 8-digit ('00340053', '01040041') forms.
     */
    function getTechnionCourseCodeVariants(code, altCode) {
        const codes = [];
        const add = (v) => {
            if (v) codes.push(v);
        };
        const process = (val) => {
            if (!val) return;
            const str = String(val).trim();
            if (!str) return;
            add(str);
            const clean = str.replace(/[-\s]/g, '');
            add(clean);
            add(clean.replace(/^0+/, ''));

            if (/^\d{5,8}$/.test(clean)) {
                if (clean.length === 8 && clean.startsWith('0')) {
                    add(clean.slice(1));
                    if (clean[4] === '0') {
                        const c6 = clean.slice(1, 4) + clean.slice(5);
                        add(c6);
                        add(c6.replace(/^0+/, ''));
                    }
                } else if (clean.length === 7) {
                    const c8 = '0' + clean;
                    add(c8);
                    if (c8[4] === '0') {
                        const c6 = c8.slice(1, 4) + c8.slice(5);
                        add(c6);
                        add(c6.replace(/^0+/, ''));
                    }
                } else if (clean.length === 6) {
                    const c8 = '0' + clean.slice(0, 3) + '0' + clean.slice(3);
                    add(c8);
                    add(c8.slice(1));
                    add(c8.replace(/^0+/, ''));
                    if (!clean.startsWith('0') && clean[2] === '0') {
                        add('00' + clean);
                        add('0' + clean);
                        add('0' + clean.slice(0, 2) + clean.slice(3));
                        add(clean.slice(0, 2) + clean.slice(3));
                    }
                } else if (clean.length === 5) {
                    const c6 = '0' + clean;
                    add(c6);
                    const c8 = '0' + c6.slice(0, 3) + '0' + c6.slice(3);
                    add(c8);
                    add(c8.slice(1));
                    add(c8.replace(/^0+/, ''));
                }
            }
        };
        process(code);
        process(altCode);
        return Array.from(new Set(codes)).filter(Boolean);
    }

    function setButtonLoading(target, isLoading, loadingText) {
        if (typeof document === 'undefined' || !target) return;
        const btn = typeof target === 'string' ? document.getElementById(target) : target;
        if (!btn) return;
        if (isLoading) {
            if (btn.dataset && btn.dataset.origHtml === undefined) {
                btn.dataset.origHtml = btn.innerHTML;
            }
            btn.classList.add('is-loading');
            btn.setAttribute('aria-busy', 'true');
            btn.disabled = true;
            if (loadingText) {
                btn.textContent = loadingText;
            }
        } else {
            btn.classList.remove('is-loading');
            btn.removeAttribute('aria-busy');
            btn.disabled = false;
            if (btn.dataset && btn.dataset.origHtml !== undefined) {
                btn.innerHTML = btn.dataset.origHtml;
                delete btn.dataset.origHtml;
            }
        }
    }

    if (root) {
        root.__semesteroUtils = { escapeHtml, normalizeTechnionCourseCode, getTechnionCourseCodeVariants, setButtonLoading };
        if (typeof root.escapeHtml !== 'function') root.escapeHtml = escapeHtml;
        if (typeof root.normalizeTechnionCourseCode !== 'function') {
            root.normalizeTechnionCourseCode = normalizeTechnionCourseCode;
        }
        if (typeof root.getTechnionCourseCodeVariants !== 'function') {
            root.getTechnionCourseCodeVariants = getTechnionCourseCodeVariants;
        }
        if (typeof root.setButtonLoading !== 'function') {
            root.setButtonLoading = setButtonLoading;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { escapeHtml, normalizeTechnionCourseCode, getTechnionCourseCodeVariants, setButtonLoading };
    }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
