with open('styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

old_peek_css = '''    .task-side-peek {
        width: 100vw !important;
        max-width: 100vw !important;
        border-right: none !important;
        padding-top: max(env(safe-area-inset-top, 0px), 24px) !important;
    }
    .peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 54px), 72px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 50px), 68px) !important;
    }'''

new_peek_css = '''    .task-side-peek {
        width: 100vw !important;
        max-width: 100vw !important;
        border-right: none !important;
        padding-top: max(env(safe-area-inset-top, 0px), 32px) !important;
    }
    .peek-content {
        padding-top: max(calc(env(safe-area-inset-top, 0px) + 68px), 88px) !important;
        padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
    }
    .peek-close-btn {
        top: max(calc(env(safe-area-inset-top, 0px) + 64px), 84px) !important;
    }'''

if old_peek_css in content:
    content = content.replace(old_peek_css, new_peek_css)
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(content)
    print("PASS: Updated styles.css peek padding to 88px/84px generous clearance")
else:
    print("FAIL: old_peek_css not found")
