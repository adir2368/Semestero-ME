with open('auth_sync.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = """            // Guard against accidental auto-assignment of adir_moshe to fresh guests
            if (sessionUser === 'adir_moshe' && (localStorage.getItem('ast_is_developer_device') !== 'true' || !localStorage.getItem('ast_profile_adir_moshe'))) {
                if (localStorage.getItem('ast_onboarding_shown') !== 'true') {
                    console.warn('[AuthSync] Resetting accidental developer session to guest for clean visitor.');
                    sessionUser = 'guest';
                    localStorage.setItem(SESSION_USER_KEY, 'guest');
                }
            }"""

replacement = """            // Guard against accidental auto-assignment of adir_moshe to non-developer devices
            if (sessionUser === 'adir_moshe' && (localStorage.getItem('ast_is_developer_device') !== 'true' || !localStorage.getItem('ast_profile_adir_moshe'))) {
                console.warn('[AuthSync] Non-developer device detected with adir_moshe session. Resetting to guest.');
                sessionUser = 'guest';
                localStorage.setItem(SESSION_USER_KEY, 'guest');
            }"""

if target in text:
    text = text.replace(target, replacement, 1)
    with open('auth_sync.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("auth_sync.js updated successfully.")
else:
    # try newline normalization
    target_norm = target.replace('\r\n', '\n')
    text_norm = text.replace('\r\n', '\n')
    if target_norm in text_norm:
        text_norm = text_norm.replace(target_norm, replacement.replace('\r\n', '\n'), 1)
        with open('auth_sync.js', 'w', encoding='utf-8') as f:
            f.write(text_norm)
        print("auth_sync.js updated with normalized newlines.")
    else:
        print("Target not found in auth_sync.js")
