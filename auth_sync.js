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
    let isApplyingRemoteUpdate = false;
    let lastUploadedStateJson = '';

    // Check if this device already has Adir's personal save file (developer PC only)
    function hasAdirLocalData() {
        try {
            const saved = localStorage.getItem(LEGACY_SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.credits === 39.5 && parsed.completedCourses === 11 && parsed.gpa === 86.39) {
                    const devProfile = localStorage.getItem('ast_profile_adir_moshe');
                    return devProfile !== null;
                }
            }
        } catch (e) {}
        return false;
    }

    const AuthSync = {
        // Initialize single-user auth & cloud sync
        init() {
            let sessionUser = localStorage.getItem(SESSION_USER_KEY);

            // Auto-login on Adir's existing developer PC ONLY if no session key exists at all (initial launch)
            if (sessionUser === null && hasAdirLocalData()) {
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
                let guestProfile = {};
                try {
                    guestProfile = JSON.parse(localStorage.getItem('ast_profile_guest') || '{}');
                } catch (e) {}
                return { 
                    id: 'guest', 
                    name: guestProfile.name || 'אורח', 
                    avatar: guestProfile.avatar || '🎓', 
                    role: 'guest', 
                    startingSemester: 1 
                };
            }
            const uid = localStorage.getItem(SESSION_USER_KEY);
            const currentSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : 1;

            let persistentPhone = '';
            try {
                persistentPhone = localStorage.getItem('ast_persistent_user_phone') || '';
            } catch (e) {}
            const fallbackPhone = persistentPhone || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || '';

            if (uid === 'adir_moshe') {
                let customProfile = null;
                try {
                    const saved = localStorage.getItem('ast_profile_' + uid);
                    if (saved) customProfile = JSON.parse(saved);
                } catch (e) {}

                const base = Object.assign({
                    id: 'adir_moshe',
                    name: 'אדיר משה',
                    email: 'adir.moshe@campus.technion.ac.il',
                    phone: persistentPhone || fallbackPhone,
                    avatar: '🎓',
                    avatarImg: 'adir_avatar.png',
                    role: 'developer',
                    startingSemester: (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : 3
                }, customProfile || {});
                if (persistentPhone) base.phone = persistentPhone;
                else if (!base.phone && fallbackPhone) base.phone = fallbackPhone;
                return base;
            }
            try {
                const saved = localStorage.getItem('ast_profile_' + uid);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (window.gameState && window.gameState.currentActiveSemester) {
                        parsed.startingSemester = window.gameState.currentActiveSemester;
                    }
                    if (persistentPhone) parsed.phone = persistentPhone;
                    else if (!parsed.phone && fallbackPhone) parsed.phone = fallbackPhone;
                    if (!parsed.avatar) parsed.avatar = '🎓';
                    return parsed;
                }
            } catch (e) {}

            return {
                id: uid,
                name: (window.gameState && window.gameState.student_name) ? window.gameState.student_name : 'סטודנט להנדסת מכונות',
                email: '',
                phone: fallbackPhone,
                avatar: '🎓',
                role: 'student',
                startingSemester: currentSem
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
                    return window.getCleanCurriculumState(1);
                }
                return null;
            }

            const key = this.getUserStorageKey(user.id);
            const saved = localStorage.getItem(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        // ANTI-POISONING GUARD:
                        // If this is a student account, but somehow holds Adir Moshe's exact state
                        // (credits 39.5, or Calculus 1 grade 84 with completedCourses >= 10),
                        // this is contaminated data. Reset immediately to clean curriculum state!
                        if (user.id !== 'adir_moshe' && (parsed.credits === 39.5 && parsed.completedCourses === 11 && (parsed.gpa === 86.39 || (parsed.courses && parsed.courses['104041'] && parsed.courses['104041'].grade === 84)))) {
                            console.warn('[AuthSync] Detected poisoned Adir state in student account:', user.id, '- resetting to clean state');
                            if (typeof window.getCleanCurriculumState === 'function') {
                                const clean = window.getCleanCurriculumState(user.startingSemester || 1);
                                if (parsed.account_password) clean.account_password = parsed.account_password;
                                clean.student_name = user.name;
                                this.saveActiveUserState(clean);
                                return clean;
                            }
                        }
                        return parsed;
                    }
                } catch (e) {
                    console.error('[AuthSync] Failed to parse local state:', e);
                }
            }

            // Fallback for Adir Moshe ONLY
            if (user.id === 'adir_moshe' && typeof PRELOADED_USER_STATE !== 'undefined') {
                return JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
            }

            // Clean syllabus template for fresh student
            if (typeof window.getCleanCurriculumState === 'function') {
                const cleanState = window.getCleanCurriculumState(user.startingSemester || 1);
                cleanState.student_name = user.name;
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
                state.lastModified = Math.max(state.lastModified || 0, Date.now());

                const persistentPhone = localStorage.getItem('ast_persistent_user_phone');
                if (persistentPhone) {
                    if (!state.userProfile) state.userProfile = {};
                    if (!state.userProfile.phone) state.userProfile.phone = persistentPhone;
                }

                // Ensure student state preserves account_password and student_name
                if (user.id !== 'adir_moshe' && user.id !== 'guest') {
                    if (!state.student_name && user.name) state.student_name = user.name;
                    if (!state.account_password) {
                        try {
                            const prof = JSON.parse(localStorage.getItem('ast_profile_' + user.id) || '{}');
                            if (prof.password) state.account_password = prof.password;
                        } catch (e) {}
                    }
                }
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

            const cleanUserLower = cleanUser.toLowerCase();
            const isAdirIdentifier = !cleanUser || 
                cleanUserLower === 'adir_moshe' || 
                cleanUserLower === 'adir' || 
                cleanUser.includes('אדיר') || 
                cleanUserLower === 'adir.moshe@campus.technion.ac.il';

            // 1. Check Master Password for Developer Adir Moshe ONLY if identifier is Adir
            if (MASTER_PASSWORDS.includes(cleanPass) && isAdirIdentifier) {
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

            // Reject developer passwords for student accounts
            if (MASTER_PASSWORDS.includes(cleanPass) && !isAdirIdentifier) {
                alert('סיסמה שגויה לחשבון זה.');
                return false;
            }

            // 2. Check Other Students via Supabase Cloud
            if (!supabaseClient) {
                alert('חיבור הענן אינו זמין כרגע. נסה שוב בעוד מספר שניות.');
                return false;
            }

            try {
                // Query all user records for resilient matching (handles Hebrew strings & casing)
                const { data, error } = await supabaseClient.from('user_states').select('*');
                if (error || !data || data.length === 0) {
                    alert('לא נמצאו משתמשים בענן. וודא שהפרטים נכונים או הירשם כסטודנט חדש.');
                    return false;
                }

                // Filter matching student candidates
                let matchedRows = [];
                if (cleanUser) {
                    matchedRows = data.filter(row => {
                        const rName = (row.user_name || '').trim().toLowerCase();
                        const rEmail = (row.user_email || '').trim().toLowerCase();
                        const rId = (row.user_id || '').trim().toLowerCase();
                        return rName === cleanUserLower ||
                               rEmail === cleanUserLower ||
                               rId === cleanUserLower ||
                               rName.includes(cleanUserLower) ||
                               cleanUserLower.includes(rName);
                    });
                } else {
                    matchedRows = data.filter(r => r.user_id !== 'adir_moshe');
                }

                if (matchedRows.length === 0) {
                    alert('לא נמצא משתמש תואם לשם או אימייל זה. וודא שהפרטים נכונים או הירשם כסטודנט חדש.');
                    return false;
                }

                // Sort candidates by most recently updated
                matchedRows.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

                // 2a. Check for exact password match
                let matched = matchedRows.find(row => {
                    const s = row.state_json;
                    return s && (s.account_password === cleanPass || s.password === cleanPass);
                });

                // 2b. Auto-claim password on legacy/uninitialized accounts (e.g. Yehonatan)
                if (!matched) {
                    const uninitialized = matchedRows.find(row => {
                        const s = row.state_json;
                        return s && !s.account_password && !s.password;
                    });

                    if (uninitialized) {
                        uninitialized.state_json = uninitialized.state_json || {};
                        uninitialized.state_json.account_password = cleanPass;
                        uninitialized.state_json.student_name = uninitialized.user_name;

                        try {
                            await supabaseClient.from('user_states').update({
                                state_json: uninitialized.state_json,
                                updated_at: new Date().toISOString()
                            }).eq('user_id', uninitialized.user_id);
                            console.log('[AuthSync] Set initial password for legacy user account:', uninitialized.user_name);
                        } catch (e) {
                            console.warn('[AuthSync] Notice updating initial password:', e);
                        }
                        matched = uninitialized;
                    }
                }

                if (!matched) {
                    alert('סיסמה שגויה. נסה שוב, או לחץ על "שכחת סיסמה?" להגדרה מחדש.');
                    return false;
                }

                // Login successful!
                localStorage.setItem(SESSION_USER_KEY, matched.user_id);
                localStorage.setItem('ast_profile_' + matched.user_id, JSON.stringify({
                    id: matched.user_id,
                    name: matched.user_name || 'סטודנט',
                    email: matched.user_email || '',
                    password: cleanPass,
                    avatar: '👤',
                    role: 'student',
                    startingSemester: matched.state_json && matched.state_json.currentActiveSemester ? matched.state_json.currentActiveSemester : 1
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

        // Reset or set password for existing student account by email or username
        async resetPassword(identifier, newPassword) {
            const cleanId = (identifier || '').trim().toLowerCase();
            const cleanPass = (newPassword || '').trim();

            if (!cleanId) {
                alert('נא להזין אימייל או שם משתמש.');
                return false;
            }
            if (!cleanPass || cleanPass.length < 4) {
                alert('נא להזין סיסמה חדשה בת 4 תווים לפחות.');
                return false;
            }
            if (!supabaseClient) {
                alert('חיבור הענן אינו זמין כרגע. נסה שוב בעוד מספר שניות.');
                return false;
            }

            try {
                const { data, error } = await supabaseClient.from('user_states').select('*');
                if (error || !data || data.length === 0) {
                    alert('לא נמצאו משתמשים בענן.');
                    return false;
                }

                const userRows = data.filter(row => {
                    const rName = (row.user_name || '').trim().toLowerCase();
                    const rEmail = (row.user_email || '').trim().toLowerCase();
                    const rId = (row.user_id || '').trim().toLowerCase();
                    return rName === cleanId || rEmail === cleanId || rId === cleanId || rName.includes(cleanId) || cleanId.includes(rName);
                });

                if (userRows.length === 0) {
                    alert('לא נמצא חשבון המשויך ל: ' + identifier);
                    return false;
                }

                // Pick the most recently updated candidate
                userRows.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
                const target = userRows[0];

                target.state_json = target.state_json || {};
                target.state_json.account_password = cleanPass;
                target.state_json.student_name = target.user_name;

                await supabaseClient.from('user_states').update({
                    state_json: target.state_json,
                    updated_at: new Date().toISOString()
                }).eq('user_id', target.user_id);

                // Auto-login into this account
                localStorage.setItem(SESSION_USER_KEY, target.user_id);
                localStorage.setItem('ast_profile_' + target.user_id, JSON.stringify({
                    id: target.user_id,
                    name: target.user_name || 'סטודנט',
                    email: target.user_email,
                    password: cleanPass,
                    avatar: '👤',
                    role: 'student',
                    startingSemester: target.state_json.currentActiveSemester || 1
                }));

                const key = this.getUserStorageKey(target.user_id);
                localStorage.setItem(key, JSON.stringify(target.state_json));
                if (window.setGlobalGameState) {
                    window.setGlobalGameState(target.state_json);
                }

                this.setupRealtimeSubscription();
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();

                if (typeof showHudToast === 'function') {
                    showHudToast('הסיסמה עודכנה בהצלחה! שלום ' + target.user_name + ' 🚀', 'success');
                } else {
                    alert('הסיסמה עודכנה בהצלחה!');
                }
                return true;
            } catch (e) {
                console.error('[AuthSync] Reset password error:', e);
                alert('שגיאה בעדכון הסיסמה: ' + e.message);
                return false;
            }
        },

        // Register a new student account
        async registerStudent(params) {
            const name = (params.name || '').trim();
            const password = (params.password || '').trim();
            const email = (params.email || '').trim();
            const startingSemester = parseInt(params.startingSemester) || 1;
            const priorCompleted = params.priorCompleted || {};

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

            let uid = 'student_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 3);
            if (supabaseClient) {
                try {
                    const { data: existingRows } = await supabaseClient
                        .from('user_states')
                        .select('user_id')
                        .ilike('user_email', email);
                    if (existingRows && existingRows.length > 0) {
                        uid = existingRows[0].user_id;
                    }
                } catch (e) {}
            }

            let cleanState = null;
            if (typeof window.getCleanCurriculumState === 'function') {
                cleanState = window.getCleanCurriculumState(startingSemester, priorCompleted);
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
                password: password,
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

            // 2. Clear session and set explicit guest state
            localStorage.setItem(SESSION_USER_KEY, 'guest');

            // 3. Reset to clean empty syllabus
            if (typeof window.getCleanCurriculumState === 'function') {
                const clean = window.getCleanCurriculumState(1);
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

        // Update profile details (Name, Email, Phone, Semester, and optional Password)
        async updateUserProfile(params) {
            if (!this.isLoggedIn()) return false;
            const user = this.getActiveUser();
            const name = (params.name || '').trim();
            const email = (params.email || '').trim();
            const rawPhone = (params.phone || '').trim();
            const semester = parseInt(params.semester) || 1;
            const password = (params.password || '').trim();

            if (!name) {
                alert('נא להזין שם מלא.');
                return false;
            }
            if (email && !email.includes('@')) {
                alert('נא להזין כתובת אימייל תקינה.');
                return false;
            }

            // Normalize phone number (Israeli 05X-XXXXXXX or standard international)
            let cleanPhone = rawPhone.replace(/[\s\-()]/g, '');
            if (cleanPhone) {
                if (/^05\d{8}$/.test(cleanPhone)) {
                    cleanPhone = cleanPhone.slice(0, 3) + '-' + cleanPhone.slice(3);
                } else if (/^\+9725\d{8}$/.test(cleanPhone)) {
                    cleanPhone = '0' + cleanPhone.slice(4, 6) + '-' + cleanPhone.slice(6);
                }
            } else {
                cleanPhone = '';
            }

            // Update persistent storage
            if (cleanPhone) {
                try {
                    localStorage.setItem('ast_persistent_user_phone', cleanPhone);
                } catch (e) {}
            }

            // Update in-memory state
            const state = (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState) || {};
            state.student_name = name;
            state.currentActiveSemester = semester;
            state.lastModified = Date.now();
            if (!state.userProfile) state.userProfile = {};
            state.userProfile.phone = cleanPhone;

            if (password) {
                state.account_password = password;
            } else if (!state.account_password) {
                try {
                    const prof = JSON.parse(localStorage.getItem('ast_profile_' + user.id) || '{}');
                    if (prof.password) state.account_password = prof.password;
                } catch (e) {}
            }

            const chosenAvatar = (params.avatar || user.avatar || '🎓').trim();
            state.avatar = chosenAvatar;

            // Update user profile object
            const updatedProfile = {
                id: user.id,
                name: name,
                email: email,
                phone: cleanPhone,
                password: state.account_password || '',
                avatar: chosenAvatar,
                role: user.role || 'student',
                startingSemester: semester
            };
            localStorage.setItem('ast_profile_' + user.id, JSON.stringify(updatedProfile));

            // Save state locally
            const key = this.getUserStorageKey(user.id);
            localStorage.setItem(key, JSON.stringify(state));
            if (user.id === 'adir_moshe') {
                localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(state));
            }

            // Update Supabase Cloud
            if (supabaseClient && user.id !== 'guest') {
                try {
                    await supabaseClient.from('user_states').update({
                        user_name: name,
                        user_email: email,
                        state_json: state,
                        updated_at: new Date().toISOString()
                    }).eq('user_id', user.id);
                    console.log('[AuthSync] Updated user profile in Supabase Cloud');
                } catch (err) {
                    console.warn('[AuthSync] Error updating user in Supabase:', err);
                }
            }

            // Refresh UI
            this.updateHudAuthControls();
            this.refreshAllAppViews();
            this.renderAuthModal();
            if (typeof renderPhoneAndNotificationPreferences === 'function') {
                renderPhoneAndNotificationPreferences();
            }

            if (typeof showHudToast === 'function') {
                showHudToast('פרטי החשבון עודכנו בהצלחה! ✨', 'success');
            } else if (typeof showToastNotification === 'function') {
                showToastNotification('פרטי החשבון עודכנו בהצלחה! ✨', 'success');
            } else {
                alert('פרטי החשבון עודכנו בהצלחה!');
            }
            return true;
        },

        // Permanently delete user account and cloud data
        async deleteAccount() {
            if (!this.isLoggedIn()) return false;
            const user = this.getActiveUser();

            const confirmed = confirm(`⚠️ אזהרה: האם אתה בטוח שברצונך למחוק לצמיתות את החשבון "${user.name}"?\n\nפעולה זו תמחק את כל נתוני הקורסים, הציונים והסנכרון שלך מענן Atlas ME ולא ניתנת לשחזור!`);
            if (!confirmed) return false;

            const finalConfirm = confirm(`אישור סופי: למחוק לצמיתות את כל הנתונים של "${user.name}" ולאפס את המערכת?`);
            if (!finalConfirm) return false;

            // 1. Delete from Supabase Cloud
            if (supabaseClient && user.id && user.id !== 'guest') {
                try {
                    const { error } = await supabaseClient
                        .from('user_states')
                        .delete()
                        .eq('user_id', user.id);
                    if (error) {
                        console.error('[AuthSync] Error deleting account from Supabase:', error);
                    } else {
                        console.log('[AuthSync] Successfully deleted account from Supabase:', user.id);
                    }
                } catch (e) {
                    console.error('[AuthSync] Cloud deletion exception:', e);
                }
            }

            // 2. Unsubscribe real-time channel
            if (realtimeChannel && supabaseClient) {
                try {
                    supabaseClient.removeChannel(realtimeChannel);
                } catch (e) {}
                realtimeChannel = null;
            }

            // 3. Clear local storage keys
            localStorage.removeItem(SESSION_USER_KEY);
            localStorage.removeItem('ast_profile_' + user.id);
            localStorage.removeItem(this.getUserStorageKey(user.id));
            if (user.id === 'adir_moshe') {
                localStorage.removeItem(LEGACY_SAVE_KEY);
            }

            // 4. Reset gameState to clean template
            if (typeof window.getCleanCurriculumState === 'function') {
                const clean = window.getCleanCurriculumState();
                if (window.setGlobalGameState) {
                    window.setGlobalGameState(clean);
                } else if (window.gameState) {
                    window.gameState = clean;
                }
            }

            // 5. Update UI
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();

            if (typeof showHudToast === 'function') {
                showHudToast('החשבון נמחק לצמיתות. המערכת אופסה 🗑️', 'info');
            } else if (typeof showToastNotification === 'function') {
                showToastNotification('החשבון נמחק לצמיתות. המערכת אופסה 🗑️', 'info');
            } else {
                alert('החשבון נמחק לצמיתות.');
            }
            return true;
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
                const isDev = user.id === 'adir_moshe';
                const avatarHtml = isDev
                    ? `<img src="adir_avatar.png" class="hud-user-avatar-img" alt="Adir Moshe">`
                    : (user.avatarImg ? `<img src="${user.avatarImg}" class="hud-user-avatar-img" alt="${user.name}">` : user.avatar);
                container.innerHTML = `
                    <button type="button" class="btn-hud-user-chip" id="btn-hud-user-chip" onclick="AuthSync.openAuthModal()" title="לחץ לצפייה בפרטי חשבון והתנתקות" aria-label="פרופיל משתמש">
                        <span class="user-avatar-pill">${avatarHtml}</span>
                        <span class="user-name-text">${user.name}</span>
                        <span class="login-status-dot ${isOnline ? 'connected' : 'offline'}" id="top-login-status-dot"></span>
                    </button>
                `;
                const hudCharAvatar = document.getElementById('hud-char-avatar');
                if (hudCharAvatar) {
                    if (isDev) {
                        hudCharAvatar.innerHTML = `<img src="adir_avatar.png" alt="Adir Moshe" class="char-avatar-img" style="width: 100%; height: 100%; object-fit: contain; padding: 2px; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));">`;
                    } else {
                        hudCharAvatar.innerHTML = user.avatar || '🎓';
                    }
                }
            } else {
                container.innerHTML = `
                    <button type="button" class="btn-hud-login-top" id="btn-hud-login-top" onclick="AuthSync.openAuthModal()" title="התחברות ל-Atlas ME" aria-label="התחברות">
                        <span class="login-icon">🔑</span>
                        <span class="login-text">התחברות</span>
                    </button>
                `;
                const hudCharAvatar = document.getElementById('hud-char-avatar');
                if (hudCharAvatar) {
                    const guestUser = this.getActiveUser();
                    hudCharAvatar.innerHTML = guestUser.avatar || '🎓';
                }
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
                const currentSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : (user.startingSemester || 1);
                const headerAvatar = isDev 
                    ? `<img src="adir_avatar.png" alt="Adir Moshe" style="width: 28px; height: 28px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));">` 
                    : `<span>${user.avatar}</span>`;
                container.innerHTML = `
                    <div class="modal-header">
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            ${headerAvatar} <span>פרטי חשבון מחובר</span>
                        </h2>
                        <div class="cloud-status-pill connected" style="margin-top: 6px;">
                            🟢 <span>מסונכרן בזמן אמת לענן Atlas ME</span>
                        </div>
                    </div>
                    <div class="modal-body" style="padding-top: 14px; max-height: 75vh; overflow-y: auto;">
                        <!-- Overview Card -->
                        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                                ${isDev 
                                    ? `<div style="width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1.5px solid #38bdf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(56, 189, 248, 0.45); flex-shrink: 0; overflow: hidden;">
                                         <img src="adir_avatar.png" alt="Adir Moshe" style="width: 100%; height: 100%; object-fit: contain; padding: 3px;">
                                       </div>` 
                                    : `<div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">${user.avatar}</div>`
                                }
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <strong style="font-size: 1.05rem; color: #f8fafc;">${user.name}</strong>
                                        <span style="font-size: 0.76rem; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 8px; border-radius: 12px;">
                                            ${isDev ? 'מפתח ראשי ⚡' : 'סטודנט 👤'}
                                        </span>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">${isDev ? 'סמל מפתח מאומת • Technion ME' : 'חשבון סטודנט'}</div>
                                </div>
                            </div>
                            <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.6;">
                                <div>מזהה חשבון: <code style="color: #38bdf8; font-family: monospace;">${user.id}</code></div>
                                <div>אימייל: <span style="color: #e2e8f0;">${user.email || 'לא הוגדר'}</span></div>
                                <div>טלפון להתראות: <span style="color: #38bdf8; font-weight: 600;" dir="ltr">${user.phone || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || '⚠️ לא הוגדר'}</span></div>
                                <div>סמסטר נוכחי פעיל: <span style="color: #fbbf24; font-weight: bold;">סמסטר ${currentSem}</span></div>
                                <div>סטטוס סנכרון: 🟢 פעיל ומסונכרן אוטומטית בין מכשירים</div>
                            </div>
                        </div>

                        <!-- Edit Account Form -->
                        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                            <h3 style="font-size: 0.9rem; color: #38bdf8; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
                                ✏️ עריכת פרטי חשבון
                            </h3>
                            <form onsubmit="event.preventDefault(); const n = document.getElementById('edit-profile-name').value; const e = document.getElementById('edit-profile-email').value; const ph = document.getElementById('edit-profile-phone').value; const s = document.getElementById('edit-profile-sem').value; const p = document.getElementById('edit-profile-pass').value; const a = (document.getElementById('edit-profile-avatar') ? document.getElementById('edit-profile-avatar').value : ''); AuthSync.updateUserProfile({ name: n, email: e, phone: ph, semester: s, password: p, avatar: a });">
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">שם מלא / כינוי:</label>
                                    <input type="text" id="edit-profile-name" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" value="${user.name}" required>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">אימייל טכניוני:</label>
                                    <input type="email" id="edit-profile-email" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" value="${user.email || ''}">
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                                        <label style="font-size: 0.78rem; color: #94a3b8; margin: 0;">📱 מספר טלפון להתראות נייד (SMS / WhatsApp):</label>
                                        <span style="font-size: 0.72rem; color: ${user.phone ? '#10b981' : '#fbbf24'};">${user.phone ? '✓ מוגדר' : '⚠️ לא הוגדר'}</span>
                                    </div>
                                    <input type="tel" id="edit-profile-phone" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" placeholder="050-1234567" dir="ltr" value="${user.phone || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.phone) || ''}">
                                    <span style="display: block; font-size: 0.72rem; color: #64748b; margin-top: 2px;">לקבלת תזכורות לשיעורים (10 דק׳ מראש), סקירה יומית ודדליינים</span>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">סמל אישי (Avatar Icon):</label>
                                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">
                                        ${['🎓', '⚡', '⚙️', '🚀', '🔬', '🤖', '🦁', '🦉', '🦅', '💻', '📐', '🛠️', '🏎️', '🪐', '🎯', '💡'].map(sym => `
                                            <button type="button" class="btn-avatar-pick-item" onclick="document.getElementById('edit-profile-avatar').value='${sym}'; document.querySelectorAll('.btn-avatar-pick-item').forEach(b => b.style.borderColor='rgba(255,255,255,0.12)'); this.style.borderColor='#38bdf8';" style="width: 34px; height: 34px; border-radius: 6px; border: 1.5px solid ${(user.avatar === sym || (!user.avatar && sym === '🎓')) ? '#38bdf8' : 'rgba(255,255,255,0.12)'}; background: rgba(15,23,42,0.85); font-size: 1.15rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s;">
                                                ${sym}
                                            </button>
                                        `).join('')}
                                    </div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <input type="text" id="edit-profile-avatar" class="form-input" style="width: 60px; text-align: center; font-size: 1.1rem; padding: 4px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" value="${user.avatar || '🎓'}" maxlength="4" placeholder="סמל">
                                        <span style="font-size: 0.72rem; color: #64748b;">בחר מהרשימה או הזן אימוג'י/אות לבחירתך</span>
                                    </div>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">איזה סמסטר אתה לומד עכשיו?</label>
                                    <select id="edit-profile-sem" class="form-select" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;">
                                        <option value="1" ${currentSem === 1 ? 'selected' : ''}>סמסטר א׳ (שנה א׳)</option>
                                        <option value="2" ${currentSem === 2 ? 'selected' : ''}>סמסטר ב׳ (שנה א׳)</option>
                                        <option value="3" ${currentSem === 3 ? 'selected' : ''}>סמסטר ג׳ (שנה ב׳)</option>
                                        <option value="4" ${currentSem === 4 ? 'selected' : ''}>סמסטר ד׳ (שנה ב׳)</option>
                                        <option value="5" ${currentSem === 5 ? 'selected' : ''}>סמסטר ה׳ (שנה ג׳)</option>
                                        <option value="6" ${currentSem === 6 ? 'selected' : ''}>סמסטר ו׳ (שנה ג׳)</option>
                                        <option value="7" ${currentSem === 7 ? 'selected' : ''}>סמסטר ז׳ (שנה ד׳)</option>
                                        <option value="8" ${currentSem === 8 ? 'selected' : ''}>סמסטר ח׳ (שנה ד׳)</option>
                                    </select>
                                </div>
                                <div class="form-group" style="margin-bottom: 10px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">שינוי סיסמה (אופציונלי):</label>
                                    <input type="password" id="edit-profile-pass" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" placeholder="סיסמה חדשה (השאר ריק אם אין שינוי)">
                                </div>
                                <button type="submit" class="btn btn-sm btn-primary" id="btn-save-profile-details" style="width: 100%; padding: 8px; font-weight: 600; font-size: 0.86rem; background: #0284c7; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    💾 שמור פרטי חשבון
                                </button>
                            </form>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                            <button type="button" class="btn btn-primary" id="btn-force-pull-cloud" style="padding: 9px; font-size: 0.86rem; font-weight: bold; background: linear-gradient(135deg, #0284c7, #0369a1); border: 1px solid #38bdf8; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; color: #fff;" onclick="AuthSync.pullLatestStateFromCloud(true).then(() => { if (typeof showHudToast==='function') showHudToast('שוחזר בהצלחה מענן Atlas ME! ☁️', 'success'); });">
                                📥 שחזר ומשוך עכשיו נתונים מהענן (סנכרון מהטלפון)
                            </button>
                            <div style="display: flex; gap: 8px;">
                                <button type="button" class="btn btn-secondary" style="flex: 1; padding: 8px; font-size: 0.84rem;" onclick="AuthSync.syncToCloud(); if (typeof showHudToast==='function') showHudToast('סונכרן לענן ☁️', 'success');">
                                    📤 גבה מצב נוכחי לענן
                                </button>
                                <button type="button" class="btn btn-outline" style="flex: 1; padding: 8px; font-size: 0.84rem;" onclick="AuthSync.logout()">
                                    🚪 התנתקות
                                </button>
                            </div>
                        </div>

                        <!-- Delete Account Danger Zone -->
                        <div style="border-top: 1px solid rgba(239, 68, 68, 0.2); padding-top: 10px; margin-top: 6px;">
                            <button type="button" class="btn btn-danger" id="btn-delete-account" style="width: 100%; padding: 7px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;" onclick="AuthSync.deleteAccount()">
                                🗑️ מחיקת חשבון לצמיתות
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Render Login / Register / Reset Password View
                const isRegister = activeTab === 'register';
                const isReset = activeTab === 'reset_password';
                
                let titleText = 'התחברות ל-Atlas ME';
                let subText = 'התחבר לחשבון האישי שלך ב-Atlas ME';
                if (isRegister) {
                    titleText = 'יצירת חשבון סטודנט חדש';
                    subText = 'חיבור לענן וסנכרון ההתקדמות שלך';
                } else if (isReset) {
                    titleText = 'איפוס / הגדרת סיסמה';
                    subText = 'הזן את פרטי החשבון ובחר סיסמה חדשה';
                }

                container.innerHTML = `
                    <div class="modal-header">
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            <span>${isReset ? '🔄' : (isRegister ? '✨' : '🔑')}</span> <span>${titleText}</span>
                        </h2>
                        <p style="margin: 6px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
                            ${subText}
                        </p>
                    </div>
                    <div class="modal-body" style="padding-top: 15px;">
                        <div style="display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                            <button type="button" class="btn btn-sm ${(!isRegister && !isReset) ? 'btn-primary' : 'btn-outline'}" onclick="AuthSync.renderAuthModal('login')" style="flex: 1;">
                                🔑 התחברות
                            </button>
                            <button type="button" class="btn btn-sm ${isRegister ? 'btn-primary' : 'btn-outline'}" onclick="AuthSync.renderAuthModal('register')" style="flex: 1;">
                                ✨ הרשמה (סטודנט חדש)
                            </button>
                        </div>

                        ${isReset ? `
                            <form onsubmit="event.preventDefault(); const id = document.getElementById('reset-ident-input').value; const p = document.getElementById('reset-pass-input').value; AuthSync.resetPassword(id, p);">
                                <div style="margin-bottom: 12px; font-size: 0.82rem; color: #94a3b8; line-height: 1.4;">
                                    הזן את האימייל הטכניוני או שם המשתמש שלך, והגדר סיסמה חדשה להתחברות.
                                </div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">אימייל טכניוני או שם משתמש:</label>
                                    <input type="text" id="reset-ident-input" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.9rem;" placeholder="למשל: yonathan.p@campus.technion.ac.il" required autofocus>
                                </div>
                                <div class="form-group" style="margin-bottom: 16px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">סיסמה חדשה:</label>
                                    <input type="password" id="reset-pass-input" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.9rem;" placeholder="הזן סיסמה חדשה (לפחות 4 תווים)" required minlength="4">
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem; margin-bottom: 10px;">
                                    🔄 עדכן סיסמה והתחבר
                                </button>
                                <div style="text-align: center;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('login')" style="color: #94a3b8; font-size: 0.82rem;">
                                        ← חזרה למסך התחברות
                                    </a>
                                </div>
                            </form>
                        ` : (!isRegister ? `
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
                                <div style="text-align: center; margin-top: 12px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('reset_password')" style="color: #38bdf8; font-size: 0.82rem; text-decoration: underline; cursor: pointer;">
                                        שכחת סיסמה? / אפס סיסמה
                                    </a>
                                </div>
                            </form>
                        ` : `
                            <form onsubmit="event.preventDefault(); const n = document.getElementById('reg-name-input').value; const p = document.getElementById('reg-password-input').value; const s = document.getElementById('reg-sem-select').value; const e = document.getElementById('reg-email-input').value; const priorCompleted = {}; document.querySelectorAll('.prior-course-check:checked').forEach(chk => { const code = chk.dataset.code; const g = document.getElementById('prior_grade_' + code); priorCompleted[code] = { completed: true, grade: g && g.value ? parseFloat(g.value) : null }; }); AuthSync.registerStudent({ name: n, password: p, startingSemester: s, email: e, priorCompleted: priorCompleted });">
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
                                    <select id="reg-sem-select" class="form-select" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff;" onchange="AuthSync.onRegisterSemesterChanged(this.value)">
                                        <option value="1">סמסטר א׳ (שנה א׳ - מתחיל מאפס)</option>
                                        <option value="2">סמסטר ב׳ (שנה א׳)</option>
                                        <option value="3">סמסטר ג׳ (שנה ב׳)</option>
                                        <option value="4">סמסטר ד׳ (שנה ב׳)</option>
                                        <option value="5">סמסטר ה׳ (שנה ג׳)</option>
                                        <option value="6">סמסטר ו׳ (שנה ג׳)</option>
                                        <option value="7">סמסטר ז׳ (שנה ד׳)</option>
                                        <option value="8">סמסטר ח׳ (שנה ד׳)</option>
                                    </select>
                                </div>

                                <!-- Dynamic Prior Courses Checklist for Students Starting > Semester 1 -->
                                <div id="reg-prior-courses-section" style="display: none;"></div>

                                <div class="form-group" style="margin-bottom: 14px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">אימייל טכניוני (חובה):</label>
                                    <input type="email" id="reg-email-input" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.82rem;" placeholder="yosef.cohen@campus.technion.ac.il" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    ✨ צור חשבון והתחל
                                </button>
                            </form>
                        `)}
                    </div>
                `;
            }
        },

        // Dynamic prior courses handler for registration
        onRegisterSemesterChanged(semVal) {
            const sem = parseInt(semVal) || 1;
            const container = document.getElementById('reg-prior-courses-section');
            if (!container) return;
            if (sem <= 1) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }

            // Get curriculum courses from window.SAMPLE_ME_DEGREE
            const allCourses = window.SAMPLE_ME_DEGREE || {};
            const priorCourses = Object.values(allCourses)
                .filter(c => (c.semester || 1) < sem)
                .sort((a, b) => (a.semester - b.semester) || a.code.localeCompare(b.code));

            if (priorCourses.length === 0) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }

            let html = `
                <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 12px; margin-top: 6px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.82rem; font-weight: bold; color: #38bdf8;">
                            📚 קורסים שכבר עשית (סמסטרים 1 עד ${sem - 1}):
                        </span>
                        <button type="button" class="btn btn-xs btn-outline" style="font-size: 0.72rem; padding: 2px 8px; cursor: pointer;" onclick="AuthSync.toggleSelectAllPriorCourses()">
                            סמן הכל / נקה
                        </button>
                    </div>
                    <div style="font-size: 0.76rem; color: #94a3b8; margin-bottom: 8px; line-height: 1.4;">
                        סמן את הקורסים שהשלמת והקלד את ציונם הסופי (0-100). אנו נחשב עבורך ממוצע ונק״ז התחלתיים!
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; padding-right: 4px; display: flex; flex-direction: column; gap: 6px;">
            `;

            priorCourses.forEach(c => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(30, 41, 59, 0.5); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); gap: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer; flex: 1; font-size: 0.8rem; color: #f1f5f9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <input type="checkbox" class="prior-course-check" data-code="${c.code}" id="prior_chk_${c.code}" onchange="AuthSync.togglePriorGradeInput('${c.code}', this.checked)" style="cursor: pointer;">
                            <span style="color: #fbbf24; font-size: 0.74rem;">[סמ׳ ${c.semester}]</span>
                            <span style="font-weight: 500;">${c.name}</span>
                            <span style="color: #64748b; font-size: 0.72rem;">(${c.credits} נק״ז)</span>
                        </label>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 0.72rem; color: #94a3b8;">ציון:</span>
                            <input type="number" min="0" max="100" id="prior_grade_${c.code}" class="prior-course-grade" data-code="${c.code}" placeholder="—" style="width: 52px; padding: 3px 6px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #fff; font-size: 0.8rem; text-align: center;" disabled>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
            container.innerHTML = html;
            container.style.display = 'block';
        },

        // Toggle disabled state of prior course grade input
        togglePriorGradeInput(code, isChecked) {
            const gradeInp = document.getElementById('prior_grade_' + code);
            if (!gradeInp) return;
            gradeInp.disabled = !isChecked;
            if (isChecked) {
                gradeInp.focus();
            } else {
                gradeInp.value = '';
            }
        },

        // Toggle select all prior courses in registration form
        toggleSelectAllPriorCourses() {
            const checks = document.querySelectorAll('.prior-course-check');
            if (!checks.length) return;
            const allChecked = Array.from(checks).every(c => c.checked);
            checks.forEach(c => {
                c.checked = !allChecked;
                this.togglePriorGradeInput(c.dataset.code, c.checked);
            });
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
                                const remoteJson = JSON.stringify(remoteState);

                                // Avoid echoing our own state that was just uploaded
                                if (remoteJson === lastUploadedStateJson) {
                                    return;
                                }

                                // Ignore contaminated Adir state for student accounts
                                if (user.id !== 'adir_moshe' && (remoteState.credits === 39.5 || (remoteState.courses && remoteState.courses['104041'] && remoteState.courses['104041'].grade === 84))) {
                                    console.warn('[AuthSync Realtime] Ignored poisoned remote state for student:', user.id);
                                    return;
                                }
                                const key = this.getUserStorageKey(user.id);
                                const localRaw = localStorage.getItem(key);
                                let localState = null;
                                try {
                                    localState = localRaw ? JSON.parse(localRaw) : null;
                                } catch (e) {}

                                const localLastMod = (localState && localState.lastModified) || 0;
                                const remoteLastMod = (remoteState && remoteState.lastModified) || (payload && payload.new && payload.new.updated_at ? new Date(payload.new.updated_at).getTime() : 0);

                                const localCourses = (localState && localState.courses) ? Object.keys(localState.courses).length : 0;
                                const remoteCourses = (remoteState && remoteState.courses) ? Object.keys(remoteState.courses).length : 0;
                                const remoteHasMoreCourses = remoteCourses > localCourses;
                                const remoteHasRemovedTracking = Array.isArray(remoteState.removedCourses) && remoteState.removedCourses.length > 0 && (!localState || !localState.removedCourses || localState.removedCourses.length === 0);

                                // Guard against clobbering newer local state UNLESS remote has more courses or active tracking
                                if (!remoteHasMoreCourses && !remoteHasRemovedTracking && localLastMod > 0 && remoteLastMod < localLastMod) {
                                    console.warn('[AuthSync Realtime] Ignored outdated remote update. Local is newer:', { localLastMod, remoteLastMod });
                                    this.triggerDebouncedCloudSync(localState);
                                    return;
                                }

                                // Always preserve persistent phone number if remote state lacks it
                                const persistentPhone = localStorage.getItem('ast_persistent_user_phone');
                                if (persistentPhone && (!remoteState.userProfile || !remoteState.userProfile.phone)) {
                                    if (!remoteState.userProfile) remoteState.userProfile = {};
                                    remoteState.userProfile.phone = persistentPhone;
                                }

                                const mergedRemoteJson = JSON.stringify(remoteState);
                                if (localRaw !== mergedRemoteJson) {
                                    isApplyingRemoteUpdate = true;
                                    try {
                                        lastUploadedStateJson = mergedRemoteJson;
                                        localStorage.setItem(key, mergedRemoteJson);
                                        if (user.id === 'adir_moshe') {
                                            localStorage.setItem(LEGACY_SAVE_KEY, mergedRemoteJson);
                                        }
                                        if (window.setGlobalGameState) {
                                            window.setGlobalGameState(remoteState);
                                        }
                                        this.refreshAllAppViews();
                                        if (typeof showHudToast === 'function') {
                                            showHudToast('סונכרן בזמן אמת מענן Atlas ME ☁️', 'info');
                                        }
                                    } finally {
                                        setTimeout(() => {
                                            isApplyingRemoteUpdate = false;
                                        }, 1000);
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
                    let localState = null;
                    try {
                        localState = localRaw ? JSON.parse(localRaw) : null;
                    } catch (e) {}

                    // Anti-poisoning guard: Never let student account adopt Adir's state
                    if (user.id !== 'adir_moshe' && (remoteState.credits === 39.5 && remoteState.completedCourses === 11 && (remoteState.gpa === 86.39 || (remoteState.courses && remoteState.courses['104041'] && remoteState.courses['104041'].grade === 84)))) {
                        console.warn('[AuthSync] Cloud state for student is poisoned with Adir data. Resetting cloud state for:', user.name);
                        if (typeof window.getCleanCurriculumState === 'function') {
                            const clean = window.getCleanCurriculumState(user.startingSemester || 1);
                            if (remoteState.account_password) clean.account_password = remoteState.account_password;
                            clean.student_name = user.name;
                            this.saveActiveUserState(clean);
                            if (window.setGlobalGameState) {
                                window.setGlobalGameState(clean);
                            }
                            this.refreshAllAppViews();
                            return clean;
                        }
                    }

                    const localLastMod = (localState && localState.lastModified) || 0;
                    const remoteLastMod = (remoteState && remoteState.lastModified) || (data && data.updated_at ? new Date(data.updated_at).getTime() : 0);

                    const localCourses = (localState && localState.courses) ? Object.keys(localState.courses).length : 0;
                    const remoteCourses = (remoteState && remoteState.courses) ? Object.keys(remoteState.courses).length : 0;
                    const remoteHasMoreCourses = remoteCourses > localCourses;
                    const remoteHasRemovedTracking = Array.isArray(remoteState.removedCourses) && remoteState.removedCourses.length > 0 && (!localState || !localState.removedCourses || localState.removedCourses.length === 0);

                    // If local state is newer than remote AND has equal/more courses AND not forced, preserve local state!
                    if (!force && !remoteHasMoreCourses && !remoteHasRemovedTracking && localLastMod > 0 && remoteLastMod < localLastMod) {
                        console.log('[AuthSync] Local state is newer than cloud copy. Preserving local state.');
                        this.triggerDebouncedCloudSync(localState);
                        return localState;
                    }

                    // Always preserve persistent phone number if remote state lacks it
                    const persistentPhone = localStorage.getItem('ast_persistent_user_phone');
                    if (persistentPhone && (!remoteState.userProfile || !remoteState.userProfile.phone)) {
                        if (!remoteState.userProfile) remoteState.userProfile = {};
                        remoteState.userProfile.phone = persistentPhone;
                    }

                    // Adopt remote state
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
            if (!supabaseClient || !this.isLoggedIn() || isApplyingRemoteUpdate) return;
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                this.syncToCloud(state);
            }, 2500);
        },

        // Force immediate sync to cloud
        async syncToCloud(stateToSync) {
            if (!supabaseClient || !this.isLoggedIn() || isApplyingRemoteUpdate) return;
            const user = this.getActiveUser();
            if (!user || !user.id || user.id === 'guest') return;

            const state = stateToSync || (window.getGlobalGameState ? window.getGlobalGameState() : window.gameState);
            if (!state) return;

            const stateJson = JSON.stringify(state);
            if (stateJson === lastUploadedStateJson) {
                return; // State identical to cloud copy, skip upload
            }

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
                    lastUploadedStateJson = stateJson;
                    console.log('[AuthSync] Synced state to cloud for user:', user.name);
                }
            } catch (err) {
                console.error('[AuthSync] Network error during cloud sync:', err);
            }
        }
    };

    window.AuthSync = AuthSync;
})(window);
