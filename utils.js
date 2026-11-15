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

    if (root) {
        root.__semesteroUtils = { escapeHtml, normalizeTechnionCourseCode };
        if (typeof root.escapeHtml !== 'function') root.escapeHtml = escapeHtml;
        if (typeof root.normalizeTechnionCourseCode !== 'function') {
            root.normalizeTechnionCourseCode = normalizeTechnionCourseCode;
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { escapeHtml, normalizeTechnionCourseCode };
    }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
