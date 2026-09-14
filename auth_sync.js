// Atlas ME - Single-User Authentication & Supabase Cloud Sync Engine

(function(window) {
    'use strict';

    const SESSION_USER_KEY = 'ast_logged_in_user';
    const LEGACY_SAVE_KEY = 'academic_skill_tree_save';
    const SUPABASE_CONFIG_KEY = 'ast_supabase_config';

    // Atlas ME Global Supabase Cloud Configuration
    const DEFAULT_SUPABASE_URL = 'https://asxpbepuvhbafsjlogag.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_BdrsUJFsNOGssCY7Gv7eNQ_UXkm2zFy';

    // Master Passwords for Developer Adir Moshe
    const MASTER_PASSWORDS = ['BenchyTech1', 'adir2368'];

    let supabaseClient = null;
    let realtimeChannel = null;
    let syncTimeout = null;

    // Check if this device already has Adir's personal save file
    function hasAdirLocalData() {
        try {
            const saved = localStorage.getItem(LEGACY_SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && (parsed.credits === 39.5 || (parsed.courses && parsed.courses['104041'] && parsed.courses['104041'].status === 'mastered'))) {
                    return true;
                }
            }
        } catch (e) {}
        return false;
    }

    const AuthSync = {
        // Initialize single-user auth & cloud sync
        init() {
            let sessionUser = localStorage.getItem(SESSION_USER_KEY);

            // Auto-login on Adir's existing developer PC if local save is present
            if (!sessionUser && hasAdirLocalData()) {
                sessionUser = 'adir_moshe';
                localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
            }

            this.initSupabaseFromStorage();
            this.updateHudAuthControls();
            console.log('[AuthSync] Initialized. Logged in:', this.isLoggedIn() ? this.getActiveUser().name : 'אורח (Logged Out)');
        },

        // Check if currently authenticated
        isLoggedIn() {
            const uid = localStorage.getItem(SESSION_USER_KEY);
            return !!(uid && uid !== 'guest');
        },

        // Get active user object
        getActiveUser() {
            if (!this.isLoggedIn()) {
                return { id: 'guest', name: 'אורח', avatar: '👤', role: 'guest', startingSemester: 1 };
            }
            const uid = localStorage.getItem(SESSION_USER_KEY);
            if (uid === 'adir_moshe') {
                return {
                    id: 'adir_moshe',
                    name: 'אדיר משה',
                    email: 'adir.moshe@campus.technion.ac.il',
                    avatar: '🎓',
                    role: 'developer',
                    startingSemester: 3
                };
            }
            try {
                const saved = localStorage.getItem('ast_profile_' + uid);
                if (saved) return JSON.parse(saved);
            } catch (e) {}

            return {
                id: uid,
                name: 'סטודנט להנדסת מכונות',
                email: '',
                avatar: '👤',
                role: 'student',
                startingSemester: 1
            };
        },

        // Check if active account is Adir Moshe
        isAdirActive() {
            return this.isLoggedIn() && this.getActiveUser().id === 'adir_moshe';
        },

        // Get storage key for active user
        getUserStorageKey(userId) {
            if (userId === 'adir_moshe') {
                return LEGACY_SAVE_KEY;
            }
            return 'ast_user_state_' + userId;
        },

        // Load state for active user
        loadActiveUserState() {
            const user = this.getActiveUser();
            if (!this.isLoggedIn()) {
                if (typeof window.getCleanCurriculumState === 'function') {
                    return window.getCleanCurriculumState();
                }
                return null;
            }

            const key = this.getUserStorageKey(user.id);
            const saved = localStorage.getItem(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        return parsed;
                    }
                } catch (e) {
                    console.error('[AuthSync] Failed to parse local state:', e);
                }
            }

            // Fallback for Adir Moshe
            if (user.id === 'adir_moshe' && typeof PRELOADED_USER_STATE !== 'undefined') {
                return JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
            }

            // Clean syllabus template for fresh student
            if (typeof window.getCleanCurriculumState === 'function') {
                const cleanState = window.getCleanCurriculumState();
                cleanState.currentActiveSemester = user.startingSemester || 1;
                return cleanState;
            }
            return null;
        },

        // Save state for active user
        saveActiveUserState(state) {
            if (!state) return;
            const user = this.getActiveUser();
            const key = this.getUserStorageKey(user.id);
            try {
                localStorage.setItem(key, JSON.stringify(state));
                if (user.id === 'adir_moshe') {
                    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(state));
                }
                if (this.isLoggedIn()) {
                    this.triggerDebouncedCloudSync(state);
                }
            } catch (e) {
                console.error('[AuthSync] Failed to save state locally:', e);
            }
        },

        // Login with Identifier (username/email) and Password
        async loginWithPassword(identifier, password) {
            let cleanUser = (identifier || '').trim();
            let cleanPass = (password || '').trim();

            // Support either parameter ordering
            if (!cleanPass && MASTER_PASSWORDS.includes(cleanUser)) {
                cleanPass = cleanUser;
                cleanUser = '';
            }

            if (!cleanPass) {
                alert('נא להזין סיסמה.');
                return false;
            }

            // 1. Check Master Password for Adir Moshe
            if (MASTER_PASSWORDS.includes(cleanPass)) {
                localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
                this.setupRealtimeSubscription();
                await this.pullLatestStateFromCloud(true);
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();
                if (typeof showHudToast === 'function') {
                    showHudToast('שלום אדיר! התחברת בהצלחה 🎓', 'success');
                } else {
                    alert('שלום אדיר! התחברת בהצלחה.');
                }
                return true;
            }

            // 2. Check Other Students via Supabase Cloud
            if (!supabaseClient) {
                alert('חיבור הענן אינו זמין כרגע. נסה שוב בעוד מספר שניות.');
                return false;
            }

            try {
                let query = supabaseClient.from('user_states').select('*');
                if (cleanUser) {
                    query = query.or(`user_name.eq.${cleanUser},user_email.eq.${cleanUser},user_id.eq.${cleanUser}`);
                }

                const { data, error } = await query;
                if (error || !data || data.length === 0) {
                    alert('לא נמצא משתמש תואם. וודא ששם המשתמש והסיסמה נכונים.');
                    return false;
                }

                // Match user with password stored in state_json
                const matched = data.find(row => {
                    const s = row.state_json;
                    return s && (s.account_password === cleanPass || s.password === cleanPass);
                });

                if (!matched) {
                    alert('סיסמה שגויה. נסה שוב.');
                    return false;
                }

                // Login successful!
                localStorage.setItem(SESSION_USER_KEY, matched.user_id);
                localStorage.setItem('ast_profile_' + matched.user_id, JSON.stringify({
                    id: matched.user_id,
                    name: matched.user_name || 'סטודנט',
                    email: matched.user_email || '',
                    avatar: '👤',
                    role: 'student'
                }));

                const key = this.getUserStorageKey(matched.user_id);
                localStorage.setItem(key, JSON.stringify(matched.state_json));
                if (window.setGlobalGameState) {
                    window.setGlobalGameState(matched.state_json);
                }

                this.setupRealtimeSubscription();
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();

                if (typeof showHudToast === 'function') {
                    showHudToast('התחברת בהצלחה! שלום ' + matched.user_name + ' 🚀', 'success');
                } else {
                    alert('התחברת בהצלחה!');
                }
                return true;
            } catch (err) {
                console.error('[AuthSync] Login error:', err);
                alert('אירעה שגיאה בעת ההתחברות: ' + err.message);
                return false;
            }
        },

        // Register a new student account
        async registerStudent(params) {
            const name = (params.name || '').trim();
            const password = (params.password || '').trim();
            const email = (params.email || '').trim();
            const startingSemester = parseInt(params.startingSemester) || 1;

            if (!name) {
                alert('נא להזין שם מלא.');
                return false;
            }
            if (!email || !email.includes('@')) {
                alert('נא להזין כתובת אימייל תקינה (חובה בהרשמה).');
                return false;
            }
            if (!password || password.length < 4) {
                alert('נא להזין סיסמה בת לפחות 4 תווים.');
                return false;
            }

            const uid = 'student_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
            let cleanState = null;
            if (typeof window.getCleanCurriculumState === 'function') {
                cleanState = window.getCleanCurriculumState();
            } else {
                cleanState = { courses: {}, credits: 0, gpa: 0 };
            }
            cleanState.currentActiveSemester = startingSemester;
            cleanState.account_password = password;
            cleanState.student_name = name;

            // Push to Supabase Cloud
            if (supabaseClient) {
                try {
                    await supabaseClient.from('user_states').upsert({
                        user_id: uid,
                        user_name: name,
                        user_email: email,
                        state_json: cleanState,
                        updated_at: new Date().toISOString()
                    });
                } catch (e) {
                    console.warn('[AuthSync] Cloud register notice:', e);
                }
            }

            // Save locally
            localStorage.setItem(SESSION_USER_KEY, uid);
            localStorage.setItem('ast_profile_' + uid, JSON.stringify({
                id: uid,
                name: name,
                email: email,
                avatar: '👤',
                role: 'student',
                startingSemester: startingSemester
            }));
            const key = this.getUserStorageKey(uid);
            localStorage.setItem(key, JSON.stringify(cleanState));

            if (window.setGlobalGameState) {
                window.setGlobalGameState(cleanState);
            }

            this.setupRealtimeSubscription();
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();

            if (typeof showHudToast === 'function') {
                showHudToast('ברוך הבא ל-Atlas ME, ' + name + '! 🎉', 'success');
            } else {
                alert('החשבון נוצר בהצלחה!');
            }
            return true;
        },

        // Logout active user
        logout() {
            if (!confirm('האם אתה בטוח שברצונך להתנתק מהחשבון?')) {
                return;
            }

            // 1. Unsubscribe from real-time channel
            if (realtimeChannel && supabaseClient) {
                try {
                    supabaseClient.removeChannel(realtimeChannel);
                } catch (e) {}
                realtimeChannel = null;
            }

            // 2. Clear session
            localStorage.removeItem(SESSION_USER_KEY);

            // 3. Reset to clean empty syllabus
            if (typeof window.getCleanCurriculumState === 'function') {
                const clean = window.getCleanCurriculumState();
                if (window.setGlobalGameState) {
                    window.setGlobalGameState(clean);
                }
            }

            // 4. Update UI
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();

            if (typeof showHudToast === 'function') {
                showHudToast('התנתקת בהצלחה. להתחברות מחדש לחץ על "התחברות". 👋', 'info');
            } else {
                alert('התנתקת בהצלחה.');
            }
        },

        // Force UI re-render across all application modules
        refreshAllAppViews() {
            if (typeof notifyStateChanged === 'function') {
                notifyStateChanged({ forceAll: true });
            } else {
                if (typeof recalculateCourseStates === 'function') recalculateCourseStates();
                if (typeof updateHud === 'function') updateHud();
                if (typeof renderUI === 'function') renderUI();
                if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
                if (typeof updateDailyTimetableFocus === 'function') updateDailyTimetableFocus();
                if (typeof renderTodayTimetableBanner === 'function') renderTodayTimetableBanner();
                if (typeof renderStudyRunway === 'function') renderStudyRunway();
                if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
            }
        },

        // Update top-right auth controls (Login button vs User chip)
        updateHudAuthControls() {
            const container = document.getElementById('hud-auth-controls');
            if (!container) return;

            const isOnline = !!supabaseClient;
            if (this.isLoggedIn()) {
                const user = this.getActiveUser();
                container.innerHTML = `
                    <button type="button" class="btn-hud-user-chip" id="btn-hud-user-chip" onclick="AuthSync.openAuthModal()" title="לחץ לצפייה בפרטי חשבון והתנתקות" aria-label="פרופיל משתמש">
                        <span class="user-avatar-pill">${user.avatar}</span>
                        <span class="user-name-text">${user.name}</span>
                        <span class="login-status-dot ${isOnline ? 'connected' : 'offline'}" id="top-login-status-dot"></span>
                    </button>
                `;
            } else {
                container.innerHTML = `
                    <button type="button" class="btn-hud-login-top" id="btn-hud-login-top" onclick="AuthSync.openAuthModal()" title="התחברות ל-Atlas ME" aria-label="התחברות">
                        <span class="login-icon">🔑</span>
                        <span class="login-text">התחברות</span>
                    </button>
                `;
            }
        },

        // Open Auth & Profile Modal
        openAuthModal(tab) {
            const modal = document.getElementById('auth-modal');
            if (!modal) return;
            this.renderAuthModal(tab);
            modal.classList.add('active');
        },

        // Close Auth Modal
        closeAuthModal() {
            const modal = document.getElementById('auth-modal');
            if (modal) modal.classList.remove('active');
        },

        // Backward compatibility: alias openAccountsModal to openAuthModal
        openAccountsModal() {
            this.openAuthModal();
        },

        // Render Auth Modal Content dynamically based on auth state
        renderAuthModal(activeTab) {
            const container = document.getElementById('auth-modal-content-container');
            if (!container) return;

            if (this.isLoggedIn()) {
                // Render Logged-In User Profile View
                const user = this.getActiveUser();
                const isDev = user.id === 'adir_moshe';
                container.innerHTML = `
                    <div class="modal-header">
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            <span>${user.avatar}</span> <span>פרטי חשבון מחובר</span>
                        </h2>
                        <div class="cloud-status-pill connected" style="margin-top: 6px;">
                            🟢 <span>מסונכרן בזמן אמת לענן</span>
                        </div>
                    </div>
                    <div class="modal-body" style="padding-top: 15px;">
                        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="font-size: 1.05rem; color: #f8fafc;">${user.name}</strong>
                                <span style="font-size: 0.76rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 12px;">
                                    ${isDev ? 'מפתח ראשי 🎓' : 'סטודנט 👤'}
                                </span>
                            </div>
                            <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5;">
                                <div>מזהה חשבון: <code style="color: #38bdf8; font-family: monospace;">${user.id}</code></div>
                                ${user.email ? '<div>אימייל: ' + user.email + '</div>' : ''}
                                <div>סטטוס סנכרון: 🟢 פעיל ומסונכרן אוטומטית בין מכשירים</div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="AuthSync.syncToCloud(); if (typeof showHudToast==='function') showHudToast('סונכרן לענן ☁️', 'success');">
                                🔄 סנכרן עכשיו לענן
                            </button>
                            <button type="button" class="btn btn-danger" style="flex: 1;" onclick="AuthSync.logout()">
                                🚪 התנתקות מהחשבון
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Render Login / Register View
                const isRegister = activeTab === 'register';
                container.innerHTML = `
                    <div class="modal-header">
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            <span>🔑</span> <span>התחברות ל-Atlas ME</span>
                        </h2>
                        <p style="margin: 6px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
                            ${isRegister ? 'יצירת חשבון סטודנט חדש וחיבור לענן' : 'התחבר לחשבון האישי שלך ב-Atlas ME'}
                        </p>
                    </div>
                    <div class="modal-body" style="padding-top: 15px;">
                        <div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                            <button type="button" class="btn btn-sm ${!isRegister ? 'btn-primary' : 'btn-outline'}" onclick="AuthSync.renderAuthModal('login')" style="flex: 1;">
                                🔑 התחברות
                            </button>
                            <button type="button" class="btn btn-sm ${isRegister ? 'btn-primary' : 'btn-outline'}" onclick="AuthSync.renderAuthModal('register')" style="flex: 1;">
                                ✨ הרשמה (סטודנט חדש)
                            </button>
                        </div>

                        ${!isRegister ? `
                            <form onsubmit="event.preventDefault(); const u = document.getElementById('auth-username-input').value; const p = document.getElementById('auth-password-input').value; AuthSync.loginWithPassword(u, p);">
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">שם משתמש או אימייל:</label>
                                    <input type="text" id="auth-username-input" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.9rem;" placeholder="שם משתמש או אימייל (למשל: יוסף כהן)" autofocus>
                                </div>
                                <div class="form-group" style="margin-bottom: 16px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">סיסמה:</label>
                                    <input type="password" id="auth-password-input" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.9rem;" placeholder="הזן סיסמה" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    🚀 התחבר עכשיו
                                </button>
                            </form>
                        ` : `
                            <form onsubmit="event.preventDefault(); const n = document.getElementById('reg-name-input').value; const p = document.getElementById('reg-password-input').value; const s = document.getElementById('reg-sem-select').value; const e = document.getElementById('reg-email-input').value; AuthSync.registerStudent({ name: n, password: p, startingSemester: s, email: e });">
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">שם מלא / כינוי:</label>
                                    <input type="text" id="reg-name-input" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" placeholder="למשל: יוסף כהן" required>
                                </div>
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">סיסמה אישית:</label>
                                    <input type="password" id="reg-password-input" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" placeholder="בחר סיסמה" required minlength="4">
                                </div>
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="display: block; font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px;">איזה סמסטר אתה מתחיל עכשיו?</label>
                                    <select id="reg-sem-select" class="form-select" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;">
                                        <option value="1">סמסטר א׳ (שנה א׳ - מתחיל מאפס)</option>
                                        <option value="2">סמסטר ב׳ (שנה א׳)</option>
                                        <option value="3">סמסטר ג׳ (שנה ב׳)</option>
                                        <option value="4">סמסטר ד׳ (שנה ב׳)</option>
                                        <option value="5">סמסטר ה׳ (שנה ג׳)</option>
                                        <option value="6">סמסטר ו׳ (שנה ג׳)</option>
                                    </select>
                                </div>
                                <div class="form-group" style="margin-bottom: 14px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">אימייל טכניוני (חובה):</label>
                                    <input type="email" id="reg-email-input" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.82rem;" placeholder="yosef.cohen@campus.technion.ac.il" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    ✨ צור חשבון והתחל
                                </button>
                            </form>
                        `}
                    </div>
                `;
            }
        },

        // Initialize Supabase Client
        initSupabaseFromStorage() {
            let url = DEFAULT_SUPABASE_URL;
            let anonKey = DEFAULT_SUPABASE_ANON_KEY;

            try {
                const confStr = localStorage.getItem(SUPABASE_CONFIG_KEY);
                if (confStr) {
                    const conf = JSON.parse(confStr);
                    if (conf.url && conf.anonKey) {
                        url = conf.url.trim();
                        anonKey = conf.anonKey.trim();
                    }
                }
            } catch (e) {}

            if (url && anonKey && window.supabase) {
                try {
                    supabaseClient = window.supabase.createClient(url, anonKey);
                    console.log('[AuthSync] Supabase Cloud connected to:', url);
                    if (this.isLoggedIn()) {
                        this.setupRealtimeSubscription();
                        this.pullLatestStateFromCloud();
                    }
                    return;
                } catch (e) {
                    console.warn('[AuthSync] Supabase client init error:', e);
                }
            }
        },

        // Setup real-time postgres changes listener for active user
        setupRealtimeSubscription() {
            if (!supabaseClient || !this.isLoggedIn()) return;
            const user = this.getActiveUser();
            if (!user || !user.id || user.id === 'guest') return;

            if (realtimeChannel) {
                try {
                    supabaseClient.removeChannel(realtimeChannel);
                } catch (e) {}
                realtimeChannel = null;
            }

            try {
                realtimeChannel = supabaseClient
                    .channel('public:user_states:' + user.id)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'user_states',
                            filter: 'user_id=eq.' + user.id
                        },
                        (payload) => {
                            console.log('[AuthSync Realtime] Remote update received:', payload);
                            if (payload && payload.new && payload.new.state_json) {
                                const remoteState = payload.new.state_json;
                                const key = this.getUserStorageKey(user.id);
                                const localRaw = localStorage.getItem(key);
                                if (localRaw !== JSON.stringify(remoteState)) {
                                    localStorage.setItem(key, JSON.stringify(remoteState));
                                    if (user.id === 'adir_moshe') {
                                        localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(remoteState));
                                    }
                                    if (window.setGlobalGameState) {
                                        window.setGlobalGameState(remoteState);
                                    }
                                    this.refreshAllAppViews();
                                    if (typeof showHudToast === 'function') {
                                        showHudToast('סונכרן בזמן אמת מענן Atlas ME ☁️', 'info');
                                    }
                                }
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('[AuthSync Realtime] Channel status for', user.id, ':', status);
                        this.updateHudAuthControls();
                    });
            } catch (err) {
                console.warn('[AuthSync] Realtime subscribe error:', err);
            }
        },

        // Pull latest state for active user from Supabase Cloud
        async pullLatestStateFromCloud(force = false) {
            if (!supabaseClient || !this.isLoggedIn()) return null;
            const user = this.getActiveUser();
            if (!user || !user.id || user.id === 'guest') return null;

            try {
                const { data, error } = await supabaseClient
                    .from('user_states')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.warn('[AuthSync] Cloud query notice:', error.message);
                    return null;
                }

                if (data && data.state_json) {
                    const remoteState = data.state_json;
                    const key = this.getUserStorageKey(user.id);
                    const localRaw = localStorage.getItem(key);

                    if (!localRaw || force) {
                        localStorage.setItem(key, JSON.stringify(remoteState));
                        if (user.id === 'adir_moshe') {
                            localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(remoteState));
                        }
                        if (window.setGlobalGameState) {
                            window.setGlobalGameState(remoteState);
                        }
                        this.refreshAllAppViews();
                        console.log('[AuthSync] Pulled remote state for:', user.name);
                        return remoteState;
                    }
                } else if (user.id === 'adir_moshe') {
                    // Upload initial local state to cloud if missing
                    this.syncToCloud();
                }
            } catch (e) {
                console.warn('[AuthSync] Exception in pullLatestStateFromCloud:', e);
            }
            return null;
        },

        // Debounced sync to Supabase Cloud
        triggerDebouncedCloudSync(state) {
            if (!supabaseClient || !this.isLoggedIn()) return;
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                this.syncToCloud(state);
            }, 2500);
        },

        // Force immediate sync to cloud
        async syncToCloud(stateToSync) {
            if (!supabaseClient || !this.isLoggedIn()) return;
            const user = this.getActiveUser();
            if (!user || !user.id || user.id === 'guest') return;

            const state = stateToSync || (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState);
            if (!state) return;

            try {
                const { data, error } = await supabaseClient
                    .from('user_states')
                    .upsert({
                        user_id: user.id,
                        user_email: user.email || '',
                        user_name: user.name,
                        state_json: state,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[AuthSync] Cloud sync error:', error);
                } else {
                    console.log('[AuthSync] Synced state to cloud for user:', user.name);
                }
            } catch (err) {
                console.error('[AuthSync] Network error during cloud sync:', err);
            }
        }
    };

    window.AuthSync = AuthSync;
})(window);
