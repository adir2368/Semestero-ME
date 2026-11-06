# AGENTS.md — Semestero ME (Academic Skill Tree)

Guidance for AI Coding Agents when working with code in this repository.

## Second Brain Directives

- **Obsidian Second Brain** (`C:\Users\user\OneDrive - Technion\Obsidian Vault\SecondBrain`):
  Maintain zero-orphan graph hygiene and keep Map of Content (`05_MOC/MOC_Atlas_ME.md`) updated with every architectural decision and session log.
- **Graphify Knowledge Engine** (`graphify-out/`):
  Consult AST topology and run `graphify update .` after code modifications to keep `graph.json` current.

## Automated Post-Change Pipeline

After ANY round of changes in Semestero, automatically perform the entire pipeline without waiting for explicit prompting:
1. **Version Bump**: Increment semver across `package.json`, `app.js` (`APP_CURRENT_REVISION`), `index.html` (`update-modal-version-text` and script query parameters), `sw.js` (`CACHE_NAME`), and `android/app/build.gradle` (`versionCode` & `versionName`).
2. **GitHub Deployment**: Stage, commit with conventional commit format, push to `origin/main`, and verify deployment.
3. **Electron Sync**: Ensure Electron desktop build and assets (`npm run build:electron` / desktop bundle) are synchronized 1:1.
4. **Wear OS Sync**: If schedule, complication, or wearable modules changed: ask the user for their watch wireless debugging connection details (`10.0.0.20:<port>`), connect via ADB, stream-install `wear-debug.apk`, and verify tiles and complications.
5. **Knowledge Base Synchronization**:
   - Update Obsidian Second Brain: Add ADR & session log to `05_MOC/MOC_Atlas_ME.md`.
   - Update Graphify: Run `graphify update .`.
6. **Mobile Notification (NTFY)**: Send a push notification to NTFY topic `adir-semestero-me-updates` with the version and list of changes using `scripts/send_ntfy.py`:
   ```bash
   python scripts/send_ntfy.py --topic "adir-semestero-me-updates" --title "Semestero ME v<VER> Released" --message "<Summary of changes>" --tags "rocket,white_check_mark"
   ```

## Question & Approval Protocol (No Blind Guessing)

- **Do Not Guess**: When encountering ambiguity, needing approval, or requiring user credentials (such as watch ports): ask directly.
- **NTFY Alert**: Whenever waiting for user approval or asking a question, send an NTFY notification to topic `adir-antigravity-done`:
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
