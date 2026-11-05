with open('styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''.notion-moodle-link-btn:hover {
    background: rgba(14, 165, 233, 0.28);
    border-color: #38bdf8;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(56, 189, 248, 0.3);
}'''

replacement = '''.notion-moodle-link-btn:hover {
    background: rgba(14, 165, 233, 0.28);
    border-color: #38bdf8;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(56, 189, 248, 0.3);
}

/* Direct Pangea (Fangia) Repository Link Button */
.notion-pangea-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(52, 211, 153, 0.35);
    color: #34d399 !important;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 12px;
    text-decoration: none !important;
    white-space: nowrap;
    transition: all 0.18s ease;
    margin-right: 4px;
    vertical-align: middle;
}

.notion-pangea-link-btn:hover {
    background: rgba(16, 185, 129, 0.28);
    border-color: #34d399;
    color: #fff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(52, 211, 153, 0.3);
}

/* Semester Pill Badges */
.notion-semester-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.76rem;
    font-weight: 600;
    background: rgba(148, 163, 184, 0.1);
    color: #cbd5e1;
    border: 1px solid rgba(148, 163, 184, 0.2);
    white-space: nowrap;
}
.notion-semester-pill.sem-1,
.notion-semester-pill.sem-2 {
    background: rgba(100, 116, 139, 0.15);
    color: #94a3b8;
    border-color: rgba(100, 116, 139, 0.3);
}
.notion-semester-pill.sem-3 {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.15);
}
.notion-semester-pill.sem-4 {
    background: rgba(168, 85, 247, 0.12);
    color: #c084fc;
    border-color: rgba(168, 85, 247, 0.35);
}
.notion-semester-pill.sem-5,
.notion-semester-pill.sem-6,
.notion-semester-pill.sem-7,
.notion-semester-pill.sem-8 {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border-color: rgba(245, 158, 11, 0.3);
}

/* Next-Action Focus Mode Toggle Button */
.notion-focus-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.3);
    color: #94a3b8;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    white-space: nowrap;
    user-select: none;
}
.notion-focus-toggle-btn:hover {
    background: rgba(51, 65, 85, 0.8);
    border-color: rgba(56, 189, 248, 0.4);
    color: #e2e8f0;
}
.notion-focus-toggle-btn.active {
    background: rgba(56, 189, 248, 0.16);
    border-color: #38bdf8;
    color: #38bdf8;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}
.notion-focus-toggle-btn .focus-icon {
    font-size: 0.95rem;
    line-height: 1;
}'''

assert target in content, "target not found in styles.css"
content = content.replace(target, replacement, 1)

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print("styles.css patched successfully!")
