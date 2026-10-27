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

    window.showHudToast = function(msg, type = 'info') {
        if (typeof showToastNotification === 'function') {
            showToastNotification(msg, type);
        } else {
            console.log('[HudToast]', msg);
        }
    };

        // Inbound state sanitization against accidental test infiltrators
    function sanitizeInboundState(state) {
        if (!state) return state;
        const targets = [
            '03240269', '3240269',
            '03940800', '3940800', '0394800', '394800',
            '03940808', '3940808', '0394808', '394808'
        ];
        if (state.courses) {
            targets.forEach(t => {
                const c = state.courses[t];
                if (c && !c.grade && (c.semester === 4 || !c.semester)) {
                    delete state.courses[t];
                }
            });
        }
        if (Array.isArray(state.degreePlan)) {
            state.degreePlan.forEach(s => {
                if (s && s.semester === 4 && Array.isArray(s.courses)) {
                    s.courses = s.courses.filter(c => {
                        if (!c) return false;
                        const code = String(c.code || '');
                        const alt = String(c.altCode || '');
                        if (targets.includes(code) || targets.includes(alt)) return false;
                        if (c.type === 'sports' || c.list === 'SPORTS') return false;
                        if (code.startsWith('0394') || code.startsWith('394')) return false;
                        if (code.startsWith('0324') || code.startsWith('324')) return false;
                        return true;
                    });
                }
            });
        }
        return state;
    }

    function isCapacitorOrNative() {
        return typeof window !== 'undefined' && !!(window.Capacitor || window.location.protocol === 'capacitor:');
    }

    // Check if this device already has Adir's personal save file (developer PC)
    function hasAdirLocalData() {
        try {
            if (localStorage.getItem('ast_is_developer_device') === 'true' && localStorage.getItem('ast_profile_adir_moshe') && localStorage.getItem(SESSION_USER_KEY) === 'adir_moshe') return true;
        } catch (e) {}
        return false;
    }

    const AuthSync = {
        // Initialize single-user auth & cloud sync
        init() {
            let sessionUser = localStorage.getItem(SESSION_USER_KEY);

            // Auto-login on Adir's existing developer PC ONLY if explicit developer marker exists
            if (sessionUser === null && hasAdirLocalData()) {
                sessionUser = 'adir_moshe';
                localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
            }

            // Guard against accidental auto-assignment of adir_moshe to non-developer devices
            if (sessionUser === 'adir_moshe' && (localStorage.getItem('ast_is_developer_device') !== 'true' || !localStorage.getItem('ast_profile_adir_moshe'))) {
                console.warn('[AuthSync] Non-developer device detected with adir_moshe session. Resetting to guest.');
                sessionUser = 'guest';
                localStorage.setItem(SESSION_USER_KEY, 'guest');
            }

            // Check URL query parameters for fast developer login on mobile Safari (?user=adir or ?auth=adir)
            try {
                if (typeof window !== 'undefined' && window.location && window.location.search) {
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('user') === 'adir' || params.get('auth') === 'adir') {
                        console.log('[AuthSync] Developer URL parameter detected, initiating Adir login...');
                        sessionUser = 'adir_moshe';
                        localStorage.setItem(SESSION_USER_KEY, 'adir_moshe');
                        localStorage.setItem('ast_profile_adir_moshe', 'true');
                        localStorage.setItem('ast_is_developer_device', 'true');
                    }
                }
            } catch (e) {}

            this.initSupabaseFromStorage();
            this.updateHudAuthControls();
            console.log('[AuthSync] Initialized. Logged in:', this.isLoggedIn() ? this.getActiveUser().name : 'אורח (Logged Out)');

            // Auto-trigger auth modal (login prompt) on entrance for unauthenticated visitors
            try {
                const isQaTest = typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('qa_health_test');
                const dismissed = sessionStorage.getItem('ast_auth_prompt_dismissed') === 'true';
                if (!isQaTest && !dismissed && !this.isLoggedIn() && !hasAdirLocalData()) {
                    setTimeout(() => {
                        this.openAuthModal('login');
                    }, 1000);
                }
            } catch (e) {}
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
                    avatarImg: 'adir_avatar_small.webp?v=2.3.1',
                    role: 'developer',
                    startingSemester: (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : 3
                }, customProfile || {});
                if (persistentPhone) base.phone = persistentPhone;
                else if (!base.phone && fallbackPhone) base.phone = fallbackPhone;
                base.isInternationalStudent = Boolean(
                    base.isInternationalStudent ||
                    (window.gameState && window.gameState.isInternationalStudent) ||
                    (window.gameState && window.gameState.userProfile && window.gameState.userProfile.isInternationalStudent)
                );
                return base;
            }
            try {
                const saved = localStorage.getItem('ast_profile_' + uid);
                if (saved) {
                    let parsed = JSON.parse(saved);
                    parsed = sanitizeInboundState(parsed);
                    if (window.gameState && window.gameState.currentActiveSemester) {
                        parsed.startingSemester = window.gameState.currentActiveSemester;
                    }
                    if (persistentPhone) parsed.phone = persistentPhone;
                    else if (!parsed.phone && fallbackPhone) parsed.phone = fallbackPhone;
                    if (!parsed.avatar) parsed.avatar = '🎓';
                    parsed.isInternationalStudent = Boolean(
                        parsed.isInternationalStudent ||
                        (window.gameState && window.gameState.isInternationalStudent) ||
                        (window.gameState && window.gameState.userProfile && window.gameState.userProfile.isInternationalStudent)
                    );
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
                startingSemester: currentSem,
                isInternationalStudent: Boolean((window.gameState && window.gameState.isInternationalStudent) || (window.gameState && window.gameState.userProfile && window.gameState.userProfile.isInternationalStudent))
            };
        },

        // Check if active account is Adir Moshe (strictly verified)
        isAdirActive() {
            if (!this.isLoggedIn()) return false;
            const user = this.getActiveUser();
            return !!(user && (user.id === 'adir_moshe' || user.id === 'adir' || user.name === 'אדיר משה'));
        },

        // Get storage key for active user
        getUserStorageKey(userId) {
            if (userId === 'adir_moshe') {
                return LEGACY_SAVE_KEY;
            }
            return 'ast_user_state_' + userId;
        },

        // Load state for active user (persists in user's browser localStorage even if logged out)
        loadActiveUserState() {
            const user = this.getActiveUser();
            const key = this.getUserStorageKey(user.id);
            const saved = localStorage.getItem(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Contamination purge for guest / non-developer:
                    // If a guest state contains developer's old test signature or contaminated preloaded data:
                    if (user.id === 'guest' || user.id !== 'adir_moshe') {
                        const hasAdirPlan = parsed && parsed.degreePlan && Array.isArray(parsed.degreePlan) && parsed.degreePlan.some(s => s.semester === 1 && (s.courses || []).some(c => c.code === '02340128' || c.code === '234128'));
                        const isContaminated = (
                            parsed.characterClass === 'סטודנט למדעי המחשב' ||
                            (parsed.completedCourses >= 10 && (parsed.gpa >= 86 || parsed.credits >= 38)) ||
                            hasAdirPlan
                        );
                        if (isContaminated) {
                            console.warn('[AuthSync] Detected contaminated guest/student state. Purging and resetting to clean curriculum...');
                            localStorage.removeItem(key);
                            localStorage.removeItem(LEGACY_SAVE_KEY);
                            localStorage.removeItem('atlas_me_custom_degree_plan_v2_guest');
                            localStorage.removeItem('atlas_me_custom_degree_plan_v1_guest');
                            localStorage.removeItem('atlas_me_custom_degree_plan_v2');
                            localStorage.removeItem('atlas_me_custom_degree_plan_v1');
                            localStorage.removeItem(`atlas_me_custom_degree_plan_v2_${user.id}`);
                            localStorage.removeItem(`atlas_me_custom_degree_plan_v1_${user.id}`);
                        } else if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                            if (hasAdirPlan) {
                                delete parsed.degreePlan;
                                delete parsed.degreePlanUnassigned;
                            }
                            return parsed;
                        }
                    } else if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        if (user.id === 'adir_moshe') {
                            const isAdirCorrupted = !parsed.gpa || parsed.gpa === 0 || !parsed.courses['104041'] || !parsed.courses['104041'].grade;
                            if (isAdirCorrupted) {
                                console.warn('[AuthSync] Adir Moshe local save is corrupted/reset. Restoring from PRELOADED_USER_STATE...');
                                if (typeof PRELOADED_USER_STATE !== 'undefined') {
                                    const restored = JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
                                    localStorage.setItem(key, JSON.stringify(restored));
                                    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(restored));
                                    return restored;
                                }
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

            // Clean syllabus template for fresh student or guest
            if (typeof window.getCleanCurriculumState === 'function') {
                const cleanState = window.getCleanCurriculumState(user.startingSemester || 1);
                cleanState.student_name = user.name || (user.id === 'guest' ? 'אורח' : 'סטודנט');
                cleanState.characterClass = 'סטודנט להנדסת מכונות - הטכניון';
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
                try {
                    localStorage.setItem('ast_profile_adir_moshe', 'true');
                    localStorage.setItem('ast_is_developer_device', 'true');
                } catch (e) {}
                this.setupRealtimeSubscription();
                await this.pullLatestStateFromCloud(true);
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();
                if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                    window.SiteAnalytics.updateSettingsPills();
                    if (typeof window.SiteAnalytics.fetchStats === 'function') {
                        window.SiteAnalytics.fetchStats();
                    }
                }
                if (typeof showHudToast === 'function') {
                    showHudToast('שלום אדיר! התחברת בהצלחה 🎓', 'success');
                } else {
                    alert('שלום אדיר! התחברת בהצלחה.');
                }
                return true;
            }

            // Reject developer passwords for student accounts
            if (MASTER_PASSWORDS.includes(cleanPass) && !isAdirIdentifier && !cleanUserLower.includes('qa') && !cleanUserLower.includes('בודק')) {
                alert('סיסמה שגויה לחשבון זה.');
                return false;
            }

            // Dedicated QA tester fast login
            if (cleanUserLower.includes('qa') || cleanUserLower.includes('בודק איכות') || cleanUserLower === 'qa_tester') {
                return this.loginAsQA();
            }

            // Local fallback if matching student account exists locally
            let localMatch = null;
            try {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('ast_profile_') && k !== 'ast_profile_guest') {
                        const prof = JSON.parse(localStorage.getItem(k) || '{}');
                        const pName = (prof.name || '').trim().toLowerCase();
                        const pEmail = (prof.email || '').trim().toLowerCase();
                        if (pName === cleanUserLower || pEmail === cleanUserLower || pName.includes(cleanUserLower)) {
                            if (!cleanPass || prof.password === cleanPass || MASTER_PASSWORDS.includes(cleanPass)) {
                                localMatch = prof;
                            }
                        }
                    }
                });
            } catch (e) {}

            if (localMatch && !supabaseClient) {
                localStorage.setItem(SESSION_USER_KEY, localMatch.id);
                const localStateKey = this.getUserStorageKey(localMatch.id);
                const localState = JSON.parse(localStorage.getItem(localStateKey) || '{}');
                if (window.setGlobalGameState && localState && localState.courses) {
                    window.setGlobalGameState(localState);
                }
                this.refreshAllAppViews();
                this.updateHudAuthControls();
                this.closeAuthModal();
                if (typeof showHudToast === 'function') {
                    showHudToast('התחברת בהצלחה! שלום ' + localMatch.name + ' 🚀', 'success');
                }
                return true;
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
                        if (row.user_id && row.user_id.startsWith('__')) return false;
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
                    matchedRows = data.filter(r => r.user_id !== 'adir_moshe' && !(r.user_id && r.user_id.startsWith('__')));
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

                if (matched.state_json && matched.state_json.degreePlan && Array.isArray(matched.state_json.degreePlan)) {
                    if (window.DegreePlanner && typeof window.DegreePlanner.adoptPlanFromState === 'function') {
                        window.DegreePlanner.adoptPlanFromState(matched.state_json.degreePlan, matched.state_json.degreePlanUnassigned);
                    }
                } else {
                    if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                        window.DegreePlanner.resetToCleanSyllabus();
                    }
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
            } catch (err) {
                console.error('[AuthSync] Login error:', err);
                alert('אירעה שגיאה בעת ההתחברות: ' + err.message);
                return false;
            }
        },

        // Dedicated QA user login (Student isolation mode)
        loginAsQA() {
            let qaProfile = null;
            try {
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('ast_profile_')) {
                        const prof = JSON.parse(localStorage.getItem(k) || '{}');
                        if (prof.name && prof.name.includes('בודק איכות')) qaProfile = prof;
                    }
                });
            } catch(e) {}

            const qaId = qaProfile ? qaProfile.id : 'student_mvbfvvtuf9w';
            const qaName = qaProfile ? qaProfile.name : 'בודק איכות QA';
            const qaEmail = qaProfile ? qaProfile.email : 'qa_tester_1792183672290@semestero.local';

            localStorage.setItem(SESSION_USER_KEY, qaId);
            localStorage.setItem('ast_profile_' + qaId, JSON.stringify({
                id: qaId,
                name: qaName,
                email: qaEmail,
                role: 'student',
                startingSemester: 3,
                avatar: '🧪'
            }));

            const key = this.getUserStorageKey(qaId);
            let state = null;
            try {
                state = JSON.parse(localStorage.getItem(key) || 'null');
            } catch(e) {}

            if (!state || !state.courses || Object.keys(state.courses).length === 0) {
                if (typeof window.getCleanCurriculumState === 'function') {
                    state = window.getCleanCurriculumState(3);
                } else {
                    state = { courses: {}, credits: 0, gpa: 0 };
                }
                state.student_name = qaName;
                state.characterClass = 'בודק איכות QA - הטכניון';
                state.currentActiveSemester = 3;
                localStorage.setItem(key, JSON.stringify(state));
            }

            if (window.setGlobalGameState) {
                window.setGlobalGameState(state);
            }

            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();
            if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                window.SiteAnalytics.updateSettingsPills();
            }
            if (typeof showHudToast === 'function') {
                showHudToast('מחובר כעת כ-בודק איכות QA 🧪 (סביבת בדיקות מבודדת ובטוחה)', 'success');
            }
            return true;
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
                    if (row.user_id && row.user_id.startsWith('__')) return false;
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

            if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                window.DegreePlanner.resetToCleanSyllabus();
            }

            this.setupRealtimeSubscription();
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();
            if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                window.SiteAnalytics.updateSettingsPills();
            }

            if (typeof showHudToast === 'function') {
                showHudToast('ברוך הבא ל-Semestero ME, ' + name + '! 🎉', 'success');
            } else {
                alert('החשבון נוצר בהצלחה!');
            }

            // Launch interactive guided tour right after successful registration
            setTimeout(() => {
                if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                    window.InteractiveTour.startTour(0);
                } else if (typeof window.startInteractiveTour === 'function') {
                    window.startInteractiveTour(0);
                }
            }, 600);
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

            // Reset DegreePlanner to official clean suggested syllabus
            if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                window.DegreePlanner.resetToCleanSyllabus();
            }

            // 4. Update UI
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();
            if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                window.SiteAnalytics.updateSettingsPills();
            }

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

            const isIntl = params.isInternationalStudent !== undefined 
                ? Boolean(params.isInternationalStudent) 
                : Boolean(state.isInternationalStudent || user.isInternationalStudent);
            state.isInternationalStudent = isIntl;
            if (!state.userProfile) state.userProfile = {};
            state.userProfile.isInternationalStudent = isIntl;

            // Update user profile object
            const updatedProfile = {
                id: user.id,
                name: name,
                email: email,
                phone: cleanPhone,
                password: state.account_password || '',
                avatar: chosenAvatar,
                role: user.role || 'student',
                startingSemester: semester,
                isInternationalStudent: isIntl
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

            const confirmed = confirm(`⚠️ אזהרה: האם אתה בטוח שברצונך למחוק לצמיתות את החשבון "${user.name}"?\n\nפעולה זו תמחק את כל נתוני הקורסים, הציונים והסנכרון שלך מענן Semestero ME ולא ניתנת לשחזור!`);
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

            // Reset DegreePlanner to clean syllabus
            if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                window.DegreePlanner.resetToCleanSyllabus();
            }

            // 5. Update UI
            this.refreshAllAppViews();
            this.updateHudAuthControls();
            this.closeAuthModal();
            if (window.SiteAnalytics && typeof window.SiteAnalytics.updateSettingsPills === 'function') {
                window.SiteAnalytics.updateSettingsPills();
            }

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
            if (typeof DegreePlanner !== 'undefined' && DegreePlanner.renderDegreePlanner) {
                DegreePlanner.renderDegreePlanner();
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
                    ? `<picture><source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp"><img src="adir_avatar_small.png?v=2.3.1" class="hud-user-avatar-img" alt="Adir Moshe" width="34" height="34"></picture>`
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
                        hudCharAvatar.innerHTML = `<picture><source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp"><img src="adir_avatar_small.png?v=2.3.1" alt="Adir Moshe" class="char-avatar-img" width="40" height="40" style="width: 100%; height: 100%; object-fit: contain; padding: 2px; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));"></picture>`;
                    } else {
                        hudCharAvatar.innerHTML = user.avatar || '🎓';
                    }
                }
            } else {
                container.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="btn btn-outline btn-xs" onclick="if (window.startInteractiveTour) window.startInteractiveTour(); else AuthSync.openOnboardingWizard();" title="סיור מודרך והסבר על המערכת" style="font-size: 0.78rem; padding: 4px 8px; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; border-radius: 6px;">
                            🧭 סיור
                        </button>
                        <button type="button" class="btn-hud-login-top" id="btn-hud-login-top" onclick="AuthSync.openAuthModal()" title="התחברות ל-Semestero ME" aria-label="התחברות">
                            <span class="login-icon">🔑</span>
                            <span class="login-text">התחברות</span>
                        </button>
                    </div>
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

        // Open Onboarding Wizard for new students
        openOnboardingWizard() {
            const modal = document.getElementById('onboarding-wizard-modal');
            if (!modal) return;
            const container = document.getElementById('onboarding-courses-checklist');
            if (container && typeof SAMPLE_ME_DEGREE !== 'undefined') {
                container.innerHTML = '';
                // Group courses from semesters 1 and 2
                [1, 2, 3, 4].forEach(sem => {
                    const semCourses = Object.values(SAMPLE_ME_DEGREE).filter(c => (c.semester || 1) === sem);
                    if (semCourses.length > 0) {
                        const header = document.createElement('div');
                        header.className = 'onboarding-sem-header';
                        header.style.cssText = 'font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin-top: 6px;';
                        header.innerText = `סמסטר ${['א׳','ב׳','ג׳','ד׳'][sem - 1]}`;
                        container.appendChild(header);

                        const grid = document.createElement('div');
                        grid.className = 'onboarding-chips-grid';
                        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; margin-top: 4px;';

                        semCourses.forEach(c => {
                            const card = document.createElement('div');
                            card.className = 'onboarding-course-chip';
                            card.style.cssText = 'display: flex; flex-direction: column; gap: 6px; background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; transition: all 0.2s ease;';

                            const topRow = document.createElement('label');
                            topRow.style.cssText = 'display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.85rem; color: #f1f5f9; user-select: none; margin: 0;';
                            topRow.innerHTML = `
                                <input type="checkbox" value="${c.code}" aria-label="סימון קורס ${c.name} כהושלם" class="onboarding-course-checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: #38bdf8;">
                                <span style="font-weight: 600; flex: 1;">${c.name} <span style="font-size: 0.74rem; color: #94a3b8; font-weight: normal;">(${c.credits || 0} נק״ז)</span></span>
                            `;

                            const gradeRow = document.createElement('div');
                            gradeRow.className = 'onboarding-grade-row';
                            gradeRow.style.cssText = 'display: none; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px dashed rgba(56, 189, 248, 0.25); margin-top: 2px;';
                            gradeRow.innerHTML = `
                                <span style="font-size: 0.78rem; color: #38bdf8; font-weight: 700;">ציון סופי:</span>
                                <input type="number" min="0" max="100" placeholder="למשל 85" aria-label="ציון סופי עבור ${c.name}" class="onboarding-grade-input" style="width: 76px; padding: 4px 8px; background: #0f172a; border: 1px solid #38bdf8; border-radius: 6px; color: #38bdf8; font-size: 0.84rem; font-weight: 800; text-align: center;">
                                <span style="font-size: 0.72rem; color: #94a3b8;">(לא חובה)</span>
                            `;

                            const chk = topRow.querySelector('.onboarding-course-checkbox');
                            chk.addEventListener('change', () => {
                                if (chk.checked) {
                                    card.style.borderColor = '#38bdf8';
                                    card.style.background = 'rgba(14, 165, 233, 0.12)';
                                    gradeRow.style.display = 'flex';
                                    const gInput = gradeRow.querySelector('.onboarding-grade-input');
                                    if (gInput) setTimeout(() => gInput.focus(), 50);
                                } else {
                                    card.style.borderColor = '#334155';
                                    card.style.background = 'rgba(30, 41, 59, 0.7)';
                                    gradeRow.style.display = 'none';
                                    const gInput = gradeRow.querySelector('.onboarding-grade-input');
                                    if (gInput) gInput.value = '';
                                }
                            });

                            card.appendChild(topRow);
                            card.appendChild(gradeRow);
                            grid.appendChild(card);
                        });
                        container.appendChild(grid);
                    }
                });
            }
            modal.classList.add('active');
        },

        // Finish Onboarding Wizard
        finishOnboarding() {
            // Guard: If developer Adir tests onboarding, do NOT overwrite his authentic degree data
            if (this.isAdirActive() || (this.getActiveUser && this.getActiveUser().id === 'adir_moshe')) {
                console.log('[AuthSync] Developer Adir testing onboarding: preserving authentic state');
                localStorage.setItem('ast_onboarding_shown', 'true');
                const modal = document.getElementById('onboarding-wizard-modal');
                if (modal) modal.classList.remove('active');
                if (typeof showToastNotification === 'function') {
                    showToastNotification('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                } else if (typeof showHudToast === 'function') {
                    showHudToast('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                }
                setTimeout(() => {
                    if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                        window.InteractiveTour.startTour(0);
                    } else if (typeof window.startInteractiveTour === 'function') {
                        window.startInteractiveTour(0);
                    }
                }, 600);
                return;
            }
            // Guard: If developer Adir tests onboarding, do NOT overwrite his authentic degree data
            if (this.isAdirActive() || (this.getActiveUser && this.getActiveUser().id === 'adir_moshe')) {
                console.log('[AuthSync] Developer Adir testing onboarding: preserving authentic state');
                localStorage.setItem('ast_onboarding_shown', 'true');
                const modal = document.getElementById('onboarding-wizard-modal');
                if (modal) modal.classList.remove('active');
                if (typeof showToastNotification === 'function') {
                    showToastNotification('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                } else if (typeof showHudToast === 'function') {
                    showHudToast('🎓 ברוך הבא אדיר משה! (מצב מפתח - נתוני התואר המקוריים נשמרו)', 'success');
                }
                setTimeout(() => {
                    if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                        window.InteractiveTour.startTour(0);
                    } else if (typeof window.startInteractiveTour === 'function') {
                        window.startInteractiveTour(0);
                    }
                }, 600);
                return;
            }
            const nameInput = document.getElementById('onboarding-student-name-input');
            const semSelect = document.getElementById('onboarding-current-sem-select');
            const emailInput = document.getElementById('onboarding-student-email-input');
            const passInput = document.getElementById('onboarding-student-pass-input');

            const name = (nameInput && nameInput.value.trim()) || 'סטודנט חדש';
            const semester = parseInt(semSelect && semSelect.value) || 1;
            const email = (emailInput && emailInput.value.trim()) || '';
            const password = (passInput && passInput.value.trim()) || '';

            const priorCompleted = {};
            document.querySelectorAll('#onboarding-courses-checklist input[type="checkbox"]:checked').forEach(chk => {
                const card = chk.closest('.onboarding-course-chip');
                const gInput = card ? card.querySelector('.onboarding-grade-input') : null;
                const gVal = (gInput && gInput.value.trim() !== '') ? parseFloat(gInput.value.trim()) : null;
                priorCompleted[chk.value] = {
                    completed: true,
                    grade: (gVal !== null && !isNaN(gVal) && gVal >= 0 && gVal <= 100) ? gVal : null
                };
            });

            // If user supplied email & password, register account with cloud sync
            if (email && email.includes('@') && password && password.length >= 4) {
                this.registerStudent({
                    name: name,
                    password: password,
                    startingSemester: semester,
                    email: email,
                    priorCompleted: priorCompleted
                });
                const modal = document.getElementById('onboarding-wizard-modal');
                if (modal) modal.classList.remove('active');
                localStorage.setItem('ast_onboarding_shown', 'true');
                return;
            }

            if (typeof window.getCleanCurriculumState === 'function') {
                const newState = window.getCleanCurriculumState(semester, priorCompleted);
                newState.student_name = name;
                this.saveActiveUserState(newState);
                window.gameState = newState;
                if (window.DegreePlanner && typeof window.DegreePlanner.resetToCleanSyllabus === 'function') {
                    window.DegreePlanner.resetToCleanSyllabus();
                }
                if (typeof notifyStateChanged === 'function') notifyStateChanged({ forceAll: true });
            }
            localStorage.setItem('ast_onboarding_shown', 'true');
            const modal = document.getElementById('onboarding-wizard-modal');
            if (modal) modal.classList.remove('active');
            if (typeof showToastNotification === 'function') {
                showToastNotification(`🎓 ברוך הבא ${name}! מסלול הלימודים הוגדר בהצלחה.`, 'success');
            } else if (typeof showHudToast === 'function') {
                showHudToast(`🎓 ברוך הבא ${name}! מסלול הלימודים הוגדר בהצלחה.`, 'success');
            }

            // Immediately launch the interactive tour after registration / onboarding!
            setTimeout(() => {
                if (window.InteractiveTour && typeof window.InteractiveTour.startTour === 'function') {
                    window.InteractiveTour.startTour(0);
                } else if (typeof window.startInteractiveTour === 'function') {
                    window.startInteractiveTour(0);
                }
            }, 600);
        },

        // Backward compatibility: alias openAccountsModal to openAuthModal
        openAccountsModal() {
            this.openAuthModal();
        },

        // Render Auth Modal Content dynamically based on auth state
        renderAuthModal(activeTab) {
            if (activeTab === 'register') {
                this.closeAuthModal();
                this.openOnboardingWizard();
                return;
            }
            const container = document.getElementById('auth-modal-content-container');
            if (this.isLoggedIn() && activeTab !== 'register' && activeTab !== 'reset_password') {
                // Render Logged-In User Profile View
                const user = this.getActiveUser();
                const isDev = user.id === 'adir_moshe';
                const currentSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : (user.startingSemester || 1);
                const headerAvatar = isDev 
                    ? `<picture><source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp"><img src="adir_avatar_small.png?v=2.3.1" alt="Adir Moshe" width="28" height="28" style="width: 28px; height: 28px; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));"></picture>` 
                    : `<span>${user.avatar}</span>`;
                container.innerHTML = `
                    <div class="modal-header">
                        <h2 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
                            ${headerAvatar} <span>פרטי חשבון מחובר</span>
                        </h2>
                        <div class="cloud-status-pill connected" style="margin-top: 6px;">
                            🟢 <span>מסונכרן בזמן אמת לענן Semestero ME</span>
                        </div>
                    </div>
                    <div class="modal-body" style="padding-top: 14px; max-height: 75vh; overflow-y: auto;">
                        <!-- Admin Telemetry & User Stats (Adir Moshe Only) -->
                        ${isDev ? `
                        <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                            <div>
                                <div style="font-weight: 700; color: #38bdf8; font-size: 0.88rem; display: flex; align-items: center; gap: 6px;">
                                    <span>👥</span> <span>סטטיסטיקת שימוש, משתמשים וכניסות</span>
                                </div>
                                <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 2px;">
                                    צפייה בזמן אמת בכמות משתמשי האפליקציה, כניסות אופליין ואורחים
                                </div>
                            </div>
                            <button type="button" class="btn btn-xs btn-primary" onclick="AuthSync.closeAuthModal(); if (window.SiteAnalytics) SiteAnalytics.openModal();" style="background: linear-gradient(135deg, #0284c7, #2563eb); font-weight: 700; padding: 6px 12px; border-radius: 6px;">
                                🔍 פתח לוח סטטיסטיקה
                            </button>
                        </div>
                        ` : ''}

                        <!-- Overview Card -->
                        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 10px;">
                                ${isDev 
                                    ? `<div style="width: 48px; height: 48px; border-radius: 50%; background: radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1.5px solid #38bdf8; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(56, 189, 248, 0.45); flex-shrink: 0; overflow: hidden;">
                                         <picture style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                                             <source srcset="adir_avatar_small.webp?v=2.3.1" type="image/webp">
                                             <img src="adir_avatar_small.png?v=2.3.1" alt="Adir Moshe" width="48" height="48" style="width: 100%; height: 100%; object-fit: contain; padding: 3px;">
                                         </picture>
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
                                <div>מעמד אקדמי: <span style="color: ${(window.gameState && window.gameState.isInternationalStudent) || user.isInternationalStudent ? '#38bdf8' : '#94a3b8'}; font-weight: 600;">${(window.gameState && window.gameState.isInternationalStudent) || user.isInternationalStudent ? '🌍 סטודנט בינלאומי' : '🇮🇱 סטודנט ישראלי'}</span></div>
                                <div>סטטוס סנכרון: 🟢 פעיל ומסונכרן אוטומטית בין מכשירים</div>
                            </div>
                        </div>

                        <!-- Edit Account Form -->
                        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px;">
                            <h3 style="font-size: 0.9rem; color: #38bdf8; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
                                ✏️ עריכת פרטי חשבון
                            </h3>
                            <form onsubmit="event.preventDefault(); const n = document.getElementById('edit-profile-name').value; const e = document.getElementById('edit-profile-email').value; const ph = document.getElementById('edit-profile-phone').value; const s = document.getElementById('edit-profile-sem').value; const p = document.getElementById('edit-profile-pass').value; const a = (document.getElementById('edit-profile-avatar') ? document.getElementById('edit-profile-avatar').value : ''); const isIntl = (document.getElementById('edit-profile-intl') ? document.getElementById('edit-profile-intl').checked : false); AuthSync.updateUserProfile({ name: n, email: e, phone: ph, semester: s, password: p, avatar: a, isInternationalStudent: isIntl });">
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">שם מלא / כינוי:</label>
                                    <input type="text" id="edit-profile-name" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" value="${user.name}" required>
                                </div>
                                <div class="form-group" style="margin-bottom: 8px;">
                                    <label style="display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 3px;">כתובת אימייל (אישי או טכניוני):</label>
                                    <input type="email" id="edit-profile-email" class="form-input" style="width: 100%; padding: 6px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.86rem;" placeholder="your.name@gmail.com" value="${user.email || ''}">
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
                                <div class="form-group" style="margin-bottom: 10px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 8px 10px;">
                                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin: 0; font-size: 0.82rem; color: #f8fafc; font-weight: 600;">
                                        <input type="checkbox" id="edit-profile-intl" style="width: 17px; height: 17px; accent-color: #38bdf8; cursor: pointer;" ${(window.gameState && window.gameState.isInternationalStudent) || user.isInternationalStudent ? 'checked' : ''}>
                                        <span>🌍 סטודנט בינלאומי (International Student)</span>
                                    </label>
                                    <span style="display: block; font-size: 0.70rem; color: #94a3b8; margin-top: 3px;">מאפשר רישום לקורסים המוצעים בסמסטר חורף לבינלאומיים (כגון דינמיקה בחורף)</span>
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
                            <button type="button" class="btn btn-primary" id="btn-force-pull-cloud" style="padding: 10px; font-size: 0.88rem; font-weight: bold; background: linear-gradient(135deg, #0284c7, #0369a1); border: 1px solid #38bdf8; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; color: #fff; transition: all 0.2s;" onclick="AuthSync.handleUserCloudRestore(this);">
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
                
                let titleText = 'התחברות ל-Semestero ME';
                let subText = 'התחבר לחשבון האישי שלך ב-Semestero ME';
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
                            <button type="button" class="btn btn-sm btn-outline" onclick="AuthSync.closeAuthModal(); AuthSync.openOnboardingWizard();" style="flex: 1;">
                                ✨ הרשמה (סטודנט חדש)
                            </button>
                        </div>

                        ${isReset ? `
                            <form onsubmit="event.preventDefault(); const id = document.getElementById('reset-ident-input').value; const p = document.getElementById('reset-pass-input').value; AuthSync.resetPassword(id, p);">
                                <div style="margin-bottom: 12px; font-size: 0.82rem; color: #94a3b8; line-height: 1.4;">
                                    הזן את כתובת האימייל או שם המשתמש שלך, והגדר סיסמה חדשה להתחברות.
                                </div>
                                <div class="form-group" style="margin-bottom: 12px;">
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">אימייל או שם משתמש:</label>
                                    <input type="text" id="reset-ident-input" class="form-input" style="width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.9rem;" placeholder="למשל: student@gmail.com או טכניוני" required autofocus>
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
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;">
                                    🚀 התחבר עכשיו
                                </button>
                                <div style="text-align: center; margin-top: 10px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('reset_password')" style="color: #38bdf8; font-size: 0.82rem; text-decoration: underline; cursor: pointer;">
                                        שכחת סיסמה? / אפס סיסמה
                                    </a>
                                </div>
                                <div style="margin-top: 14px; text-align: center; padding-top: 12px; border-top: 1px dashed rgba(255,255,255,0.12);">
                                    <div style="font-size: 0.84rem; color: #94a3b8; margin-bottom: 8px;">
                                        עדיין אין לך חשבון ב-Semestero ME?
                                    </div>
                                    <button type="button" class="btn btn-outline" id="btn-switch-to-register" onclick="AuthSync.closeAuthModal(); AuthSync.openOnboardingWizard();" style="width: 100%; border-color: #38bdf8; color: #38bdf8; font-weight: 700; padding: 9px; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer;">
                                        <span>✨</span> <span>הרשמה מהירה (סטודנט חדש) ←</span>
                                    </button>
                                </div>
                                <div style="text-align: center; margin-top: 12px;">
                                    <button type="button" onclick="AuthSync.closeAuthModal(); sessionStorage.setItem('ast_auth_prompt_dismissed', 'true');" style="background: none; border: none; color: #64748b; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                                        המשך כאורח בינתיים (ללא סנכרון ענן) ←
                                    </button>
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
                                    <label style="display: block; font-size: 0.82rem; color: #f8fafc; font-weight: 600; margin-bottom: 4px;">כתובת אימייל (כל אימייל אישי או טכניוני):</label>
                                    <input type="email" id="reg-email-input" class="form-input" style="width: 100%; padding: 7px 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.82rem;" placeholder="your.name@gmail.com (או כל אימייל)" required>
                                </div>
                                <button type="submit" class="btn btn-primary btn-block" style="width: 100%; padding: 10px; font-weight: 700; font-size: 0.95rem;">
                                    ✨ צור חשבון והתחל בסיור
                                </button>
                                <div style="text-align: center; margin-top: 12px;">
                                    <a href="javascript:void(0)" onclick="AuthSync.renderAuthModal('login')" style="color: #38bdf8; font-size: 0.82rem; cursor: pointer; text-decoration: underline;">
                                        כבר יש לך חשבון קיים? לחץ כאן להתחברות ←
                                    </a>
                                </div>
                                <div style="text-align: center; margin-top: 8px;">
                                    <button type="button" onclick="AuthSync.closeAuthModal(); sessionStorage.setItem('ast_auth_prompt_dismissed', 'true');" style="background: none; border: none; color: #64748b; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">
                                        המשך כאורח בינתיים ←
                                    </button>
                                </div>
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
            let priorCourses = Object.values(allCourses)
                .filter(c => (c.semester || 1) < sem);

            // Special support: Physics 2 variants (114052, 114075) can be completed in Semester 2!
            // When student starts semester >= 2, make sure Physics 1 variants and Physics 2 variants are available in prior courses!
            if (sem >= 2) {
                const hasP2 = priorCourses.some(c => c.code === '114052' || c.code === '114075');
                if (!hasP2) {
                    if (allCourses['114052']) {
                        priorCourses.push({ ...allCourses['114052'], semester: 2, name: allCourses['114052'].name + ' (במידה והוקדם לסמ׳ 2)' });
                    }
                    if (allCourses['114075']) {
                        priorCourses.push({ ...allCourses['114075'], semester: 2, name: allCourses['114075'].name + ' (במידה והוקדם לסמ׳ 2)' });
                    }
                }
            }

            priorCourses.sort((a, b) => (a.semester - b.semester) || a.code.localeCompare(b.code));

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
                    <!-- Atuda Tironut option during onboarding -->
                    <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 7px 10px; margin-bottom: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; margin: 0; cursor: pointer; font-size: 0.78rem; color: #f8fafc; font-weight: 600;">
                            <input type="checkbox" class="prior-course-check" data-code="00920001" id="prior_chk_00920001" onchange="AuthSync.togglePriorGradeInput('00920001', this.checked)" style="cursor: pointer; accent-color: #38bdf8; width: 15px; height: 15px;">
                            <span>🪖 עתודאי? השלמת טירונות (2 נק״ז בינארי לתואר)</span>
                        </label>
                        <input type="hidden" id="prior_grade_00920001" value="עובר">
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
                                const remoteState = sanitizeInboundState(payload.new.state_json);
                                const remoteJson = JSON.stringify(remoteState);

                                // Avoid echoing our own state that was just uploaded
                                if (remoteJson === lastUploadedStateJson) {
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
                                        if (remoteState.degreePlan && Array.isArray(remoteState.degreePlan)) {
                                            try {
                                                const v2Key = user.id === 'adir_moshe' ? 'atlas_me_custom_degree_plan_v2_adir' : `atlas_me_custom_degree_plan_v2_${user.id}`;
                                                const v1Key = user.id === 'adir_moshe' ? 'atlas_me_custom_degree_plan_v1_adir' : `atlas_me_custom_degree_plan_v1_${user.id}`;
                                                const planPayload = JSON.stringify({
                                                    semesters: remoteState.degreePlan,
                                                    unassigned: remoteState.degreePlanUnassigned || []
                                                });
                                                localStorage.setItem(v2Key, planPayload);
                                                localStorage.setItem(v1Key, JSON.stringify(remoteState.degreePlan));

                                                if (user.id === 'adir_moshe') {
                                                    localStorage.setItem('atlas_me_custom_degree_plan_v2', planPayload);
                                                    localStorage.setItem('atlas_me_custom_degree_plan_v1', JSON.stringify(remoteState.degreePlan));
                                                }
                                                if (window.DegreePlanner && typeof window.DegreePlanner.adoptPlanFromState === 'function') {
                                                    window.DegreePlanner.adoptPlanFromState(remoteState.degreePlan, remoteState.degreePlanUnassigned);
                                                }
                                            } catch (e) {}
                                        }
                                        this.refreshAllAppViews();
                                        if (typeof showHudToast === 'function') {
                                            showHudToast('סונכרן בזמן אמת מענן Semestero ME ☁️', 'info');
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
                    const remoteState = sanitizeInboundState(data.state_json);
                    const key = this.getUserStorageKey(user.id);
                    const localRaw = localStorage.getItem(key);
                    let localState = null;
                    try {
                        localState = localRaw ? JSON.parse(localRaw) : null;
                    } catch (e) {}



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
                    if (remoteState.degreePlan && Array.isArray(remoteState.degreePlan)) {
                        try {
                            const v2Key = user.id === 'adir_moshe' ? 'atlas_me_custom_degree_plan_v2_adir' : `atlas_me_custom_degree_plan_v2_${user.id}`;
                            const v1Key = user.id === 'adir_moshe' ? 'atlas_me_custom_degree_plan_v1_adir' : `atlas_me_custom_degree_plan_v1_${user.id}`;
                            const planPayload = JSON.stringify({
                                semesters: remoteState.degreePlan,
                                unassigned: remoteState.degreePlanUnassigned || []
                            });
                            localStorage.setItem(v2Key, planPayload);
                            localStorage.setItem(v1Key, JSON.stringify(remoteState.degreePlan));

                            if (user.id === 'adir_moshe') {
                                localStorage.setItem('atlas_me_custom_degree_plan_v2', planPayload);
                                localStorage.setItem('atlas_me_custom_degree_plan_v1', JSON.stringify(remoteState.degreePlan));
                            }
                            if (window.DegreePlanner && typeof window.DegreePlanner.adoptPlanFromState === 'function') {
                                window.DegreePlanner.adoptPlanFromState(remoteState.degreePlan, remoteState.degreePlanUnassigned);
                            }
                        } catch (e) {}
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

        // User clicked Cloud Restore button in Account modal
        async handleUserCloudRestore(btnElement) {
            if (!btnElement) btnElement = document.getElementById('btn-force-pull-cloud');
            const originalHtml = btnElement ? btnElement.innerHTML : '📥 שחזר ומשוך עכשיו נתונים מהענן (סנכרון מהטלפון)';
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '⏳ מושך נתונים מהענן של הטלפון...';
                btnElement.style.opacity = '0.7';
            }

            try {
                const res = await this.pullLatestStateFromCloud(true);
                if (res && res.courses) {
                    const count = Object.keys(res.courses).length;
                    if (btnElement) {
                        btnElement.innerHTML = '✅ שוחזר בהצלחה!';
                        btnElement.style.background = '#10b981';
                    }
                    if (typeof showToastNotification === 'function') {
                        showToastNotification(`✅ שוחזרו בהצלחה ${count} קורסים והעדפות מהטלפון!`, 'success');
                    }
                    setTimeout(() => {
                        this.closeAuthModal();
                    }, 800);
                } else {
                    if (btnElement) {
                        btnElement.innerHTML = '⚠️ לא נמצאו נתונים חדשים בענן';
                    }
                    if (typeof showToastNotification === 'function') {
                        showToastNotification('⚠️ לא נמצאו נתונים מעודכנים יותר בענן.', 'warning');
                    }
                    setTimeout(() => {
                        if (btnElement) {
                            btnElement.disabled = false;
                            btnElement.innerHTML = originalHtml;
                            btnElement.style.opacity = '1';
                        }
                    }, 2000);
                }
            } catch (err) {
                console.error('[AuthSync] Restore error:', err);
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalHtml;
                    btnElement.style.opacity = '1';
                }
                if (typeof showToastNotification === 'function') {
                    showToastNotification('❌ שגיאה במשיכת נתונים: ' + (err.message || err), 'error');
                }
            }
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
