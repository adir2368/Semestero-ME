# AGENTS.md — Semestero ME (Academic Skill Tree)

Guidance for AI Coding Agents when working with code in this repository.

## Global User Directives

- Always respond in English across all sessions and conversations, regardless of the input language, unless the user explicitly requests otherwise.
- Apply Bionic Reading formatting (bolding the initial 30–40% fixation letters of words) to normal conversational text and explanatory prose. Do NOT apply Bionic Reading to code blocks, file paths, terminal commands, raw file outputs, or text intended for copying.

## Focus-Friendly Communication Protocol

Apply these 7 rules by default across all replies to prevent focus loss and missed details. Relax them only when the user explicitly asks to "expand", "deep dive", explain/teach a concept, or brainstorm:

1. Answer on the first line. Keep details to 3 short bullets max unless asked for more.
2. Skip how you worked. Report only the result, risks, and what you need from the user.
3. Put risks, warnings, and conditions before the action they apply to ("If X, do Y.").
4. Put the decision or input needed from the user on the very last line.
5. Use active voice, short single-idea sentences (max 3–4 sentences per paragraph), and numbered imperative steps.
6. Use the same word for the same thing. Avoid idioms and filler, but keep accurate technical terms.
7. Use exact numbers when verified. If unknown, say "unknown" instead of guessing or using vague words like "soon".

## Tri-Modal Output & Academic Learning Style

1. ASD-STE100 (~80% constraint): Apply Simplified Technical English constraints (active voice, single verb, concise sentences) to all technical specifications, ADRs, documentation, and prompt design to eliminate conversational filler.
2. Diagrams First (Mermaid.js): Always prefer relational diagrams (flowcharts, sequence diagrams, state machines, entity diagrams) over multi-paragraph text when explaining architecture, pipelines, or dependencies.
3. Interactive Micro-Tools & Generative UI: When explaining trade-offs, financial models, or mathematical relationships, generate interactive HTML/JS widgets (calculators with real-time sliders and visual state feedback) rather than static paragraphs.
4. Learning Mode: When studying concepts or preparing for exams, provide deep, structured explanations with foundational principles and derivations aligned with Fangia (idofangbentov.uk / local Technion Courses Knowledge Hub) alongside official Technion course booklets.

## Dual Knowledge Engine Directives (Obsidian + Graphify)

- **Obsidian Second Brain** (`C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain`):
  Maintain zero-orphan graph hygiene, standard YAML frontmatter schema, and keep Map of Content (`05_MOC/MOC_Atlas_ME.md`) updated with every architectural decision and session log.
- **Graphify Knowledge Engine** (`graphify-out/`):
  Before answering architecture or codebase questions, consult `graphify-out/GRAPH_REPORT.md` (and `graphify-out/wiki/index.md` if present). After modifying code files, run `graphify update .` to keep `graph.json` current.

## Automated Post-Change Pipeline & Hardware Safety

After ANY round of changes in Semestero, automatically perform the entire pipeline without waiting for explicit prompting:
1. **Version Bump**: Increment semver across `package.json`, `app.js` (`APP_CURRENT_REVISION`), `index.html` (`update-modal-version-text` and script query parameters), `sw.js` (`CACHE_NAME`), and `android/app/build.gradle` (`versionCode` & `versionName`).
2. **GitHub Deployment**: Stage, commit with conventional commit format, push to `origin/main`, and verify deployment.
3. **Electron Sync**: Ensure Electron desktop build and assets (`npm run build:electron` / desktop bundle) are synchronized 1:1.
4. **Galaxy Watch OS Sync**: If schedule, complication, or wearable modules changed: ask the user for their watch wireless debugging connection details (`10.0.0.20:<port>`), connect via ADB, stream-install `wear-debug.apk`, and verify tiles and complications.
5. **Knowledge Base Synchronization**:
   - Update Obsidian Second Brain: Add ADR & session log to `05_MOC/MOC_Atlas_ME.md`.
   - Update Graphify: Run `graphify update .`.
6. **Mobile Notification (NTFY)**: Send a push notification to NTFY topic `adir-semestero-me-updates` with the version and list of changes using `scripts/send_ntfy.py`:
   ```bash
   python scripts/send_ntfy.py --topic "adir-semestero-me-updates" --title "Semestero ME v<VER> Released" --message "<Summary of changes>" --tags "rocket,white_check_mark"
   ```

### CRITICAL Galaxy Watch 8 (`SM-L335F`) ADB Safety Rule (HARD BAN)
- NEVER run `adb shell uiautomator dump` (or any `uiautomator` command) on the Galaxy Watch 8 (prevents 180-degree `user_rotation` corruption with left-button wrist orientation).
- NEVER add `android:screenOrientation="nosensor"` or `setRequestedOrientation(...)` to the Wear OS app (`android/wear/`).
- When sideloading updates to the Galaxy Watch over ADB, ONLY run `adb connect`, `adb install -r`, and read-only `dumpsys package` version checks. Never modify watch system settings without explicit per-command approval.

## Question & Approval Protocol (No Blind Guessing)

- **Do Not Guess**: When encountering ambiguity, needing approval, or requiring user credentials (such as watch ports): ask directly.
- **NTFY Alert**: Whenever waiting for user approval, asking a question, or finishing general tasks, send an NTFY notification to topic `adir-antigravity-done`:
   ```bash
   python scripts/send_ntfy.py --topic "adir-antigravity-done" --title "Antigravity Needs Input" --message "<Question or prompt for user>" --priority "high" --tags "question,bell"
   ```

## Security & Access Control Matrix (ACM)

In accordance with defensive AI application security standards (ADR-075):

| Role | Cloud `user_states` Access | Local Storage Scope | Network / Secret Rules |
|---|---|---|---|
| **Guest (`guest`)** | **None** (Blocked from reading or writing cloud states) | Isolated to `ast_user_state_guest` & clean template | Zero token issuance; never sync to cloud |
| **Authenticated Student** | **Strict Point Queries Only** (`.eq('user_id', cleanUid)`) | Scoped strictly to `ast_user_state_<uid>` | Public `anon` key only; never dump table via `.select('*')` |
| **Master Developer (`adir_moshe`)** | Authorized personal state with `ast_auth_verified_v3` proof | Protected `academic_skill_tree_save` with auto-heal | No plaintext secrets; salted SHA-256 digests only |

### Strict Engineering Guards:
1. **Never perform table-wide scans** (`.select('*')` on `user_states` is strictly forbidden). Always use targeted point queries with `.eq()` or `.or()`.
2. **Row-Level Security (RLS)**: Database tables must enforce `auth.uid() = user_id`.
3. **Secret Isolation**: Supabase `service_role` secret must NEVER enter client code, Electron renderers, or Android APK bundles.
4. **Prohibition of Adversarial Anti-AI Obfuscators (ADR-076)**: Tools that poison context, exhaust token windows, or inject decoy logic (such as BLA / Blind LLM Agents by `qybaihe`) are strictly prohibited. Semestero ME is an agent-native project that relies on transparent AST parsing (Graphify) and unhindered AI pair-programming.
