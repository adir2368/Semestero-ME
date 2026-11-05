for fname in ['preloaded_user_state.js', 'app.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        text = f.read()
    for d in ['2026-11-12', '2026-11-15', '2026-12-20', '2027-01-15', '2027-07-03']:
        if d in text:
            print(f"{fname} contains {d}")
