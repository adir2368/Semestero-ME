// Academic Skill Tree - Multi-User Identity & Cloud Sync Engine
// Supports Local-First Multi-Accounts & Supabase Cloud Synchronization

(function(window) {
    'use strict';

    const ACCOUNTS_REGISTRY_KEY = 'ast_accounts_registry';
    const ACTIVE_USER_ID_KEY = 'ast_active_user_id';
    const SUPABASE_CONFIG_KEY = 'ast_supabase_config';
    const LEGACY_SAVE_KEY = 'academic_skill_tree_save';

    // Default primary developer account (Adir Moshe)
    const DEFAULT_ADIR_ACCOUNT = {
        id: 'adir_moshe',
        name: 'אדיר משה',
        email: 'adir.moshe@campus.technion.ac.il',
        avatar: '🎓',
        role: 'developer',
        startingSemester: 3,
        createdAt: 1726265000000,
        lastActive: Date.now()
    };

    let supabaseClient = null;
    let syncTimeout = null;

    const AuthSync = {
        // Initialize accounts system
        init() {
            let registry = this.getAccounts();
            if (!registry || registry.length === 0) {
                registry = [DEFAULT_ADIR_ACCOUNT];
                this.saveAccounts(registry);
            }

            let activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
            if (!activeId || !registry.find(a => a.id === activeId)) {
                activeId = 'adir_moshe';
                localStorage.setItem(ACTIVE_USER_ID_KEY, activeId);
            }

            this.initSupabaseFromStorage();
            this.updateHudUserBadge();
            console.log('[AuthSync] Initialized. Active account:', this.getActiveUser().name);
        },

        // Get list of all accounts registered on this device
        getAccounts() {
            try {
                const data = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('[AuthSync] Error loading accounts registry:', e);
                return [];
            }
        },

        // Save accounts registry
        saveAccounts(registry) {
            try {
                localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
            } catch (e) {
                console.error('[AuthSync] Error saving accounts registry:', e);
            }
        },

        // Get currently active user object
        getActiveUser() {
            const registry = this.getAccounts();
            const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY) || 'adir_moshe';
            const user = registry.find(a => a.id === activeId);
            return user || registry[0] || DEFAULT_ADIR_ACCOUNT;
        },

        // Check if currently active account is Adir Moshe (Primary Account)
        isAdirActive() {
            return this.getActiveUser().id === 'adir_moshe';
        },

        // Get storage key for a specific user ID
        getUserStorageKey(userId) {
            if (userId === 'adir_moshe') {
                return LEGACY_SAVE_KEY;
            }
            return 'ast_user_state_' + userId;
        },

        // Load state for active user
        loadActiveUserState() {
            const user = this.getActiveUser();
            const key = this.getUserStorageKey(user.id);
            const saved = localStorage.getItem(key);

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.courses && Object.keys(parsed.courses).length > 0) {
                        return parsed;
                    }
                } catch (e) {
                    console.error('[AuthSync] Failed to parse saved state for user', user.id, e);
                }
            }

            // If no save exists:
            if (user.id === 'adir_moshe') {
                // Adir gets preloaded state
                if (typeof PRELOADED_USER_STATE !== 'undefined') {
                    return JSON.parse(JSON.stringify(PRELOADED_USER_STATE));
                }
            }

            // New friend / student account gets clean syllabus template
            if (typeof window.getCleanCurriculumState === 'function') {
                return window.getCleanCurriculumState();
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
                // If Adir, also maintain legacy key for complete backwards compatibility
                if (user.id === 'adir_moshe') {
                    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(state));
                }
                this.triggerDebouncedCloudSync(state);
            } catch (e) {
                console.error('[AuthSync] Failed to save state locally:', e);
            }
        },

        // Switch active account
        async switchAccount(targetUserId) {
            const registry = this.getAccounts();
            const targetUser = registry.find(a => a.id === targetUserId);
            if (!targetUser) {
                console.error('[AuthSync] User not found:', targetUserId);
                return false;
            }

            // 1. Save current state first
            if (window.gameState) {
                this.saveActiveUserState(window.gameState);
            }

            // 2. Set new active user ID
            localStorage.setItem(ACTIVE_USER_ID_KEY, targetUserId);
            targetUser.lastActive = Date.now();
            this.saveAccounts(registry);

            // 3. Load target user state
            const newState = this.loadActiveUserState();
            if (newState) {
                window.gameState = newState;
            }

            // 4. Update UI
            if (typeof recalculateCourseStates === 'function') recalculateCourseStates();
            if (typeof renderUI === 'function') renderUI();
            if (typeof setupDailyTimetable === 'function') setupDailyTimetable();
            if (typeof renderStudyRunway === 'function') renderStudyRunway();
            this.updateHudUserBadge();

            if (typeof showHudToast === 'function') {
                showHudToast('הועברת לחשבון: ' + targetUser.name + ' ' + targetUser.avatar, 'info');
            }

            // 5. If new account hasn't completed onboarding, prompt onboarding modal
            if (targetUser.id !== 'adir_moshe' && (!newState || !newState.hasCompletedOnboarding)) {
                this.openOnboardingModal();
            }

            return true;
        },

        // Create a new friend account
        createAccount(params) {
            const name = params.name || 'סטודנט חדש';
            const email = params.email || '';
            const startingSemester = parseInt(params.startingSemester) || 1;
            const avatar = params.avatar || '👤';

            const registry = this.getAccounts();
            const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
            const newAccount = {
                id: id,
                name: name.trim(),
                email: email.trim(),
                avatar: avatar,
                role: 'student',
                startingSemester: startingSemester,
                createdAt: Date.now(),
                lastActive: Date.now()
            };

            registry.push(newAccount);
            this.saveAccounts(registry);

            // Initialize clean state
            let cleanState = null;
            if (typeof window.getCleanCurriculumState === 'function') {
                cleanState = window.getCleanCurriculumState();
                cleanState.currentActiveSemester = startingSemester;
                cleanState.hasCompletedOnboarding = false;
            }

            const key = this.getUserStorageKey(id);
            if (cleanState) {
                localStorage.setItem(key, JSON.stringify(cleanState));
            }

            // Switch to this new account immediately
            this.switchAccount(id);
            return newAccount;
        },

        // Delete an account (Adir cannot be deleted)
        deleteAccount(userId) {
            if (userId === 'adir_moshe') {
                alert('לא ניתן למחוק את החשבון הראשי של מפתח המערכת (אדיר משה).');
                return false;
            }
            if (!confirm('האם אתה בטוח שברצונך למחוק חשבון זה ואת כל הנתונים שלו?')) {
                return false;
            }

            let registry = this.getAccounts();
            registry = registry.filter(a => a.id !== userId);
            this.saveAccounts(registry);
            localStorage.removeItem('ast_user_state_' + userId);

            // If active was deleted, fall back to Adir
            const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
            if (activeId === userId) {
                this.switchAccount('adir_moshe');
            } else {
                this.renderAccountsList();
            }
            return true;
        },

        // Initialize Supabase if config is present
        initSupabaseFromStorage() {
            try {
                const confStr = localStorage.getItem(SUPABASE_CONFIG_KEY);
                if (confStr) {
                    const conf = JSON.parse(confStr);
                    if (conf.url && conf.anonKey && window.supabase) {
                        supabaseClient = window.supabase.createClient(conf.url, conf.anonKey);
                        console.log('[AuthSync] Supabase Cloud connected successfully!');
                        this.updateCloudStatusIndicator(true);
                        return;
                    }
                }
            } catch (e) {
                console.warn('[AuthSync] Supabase not connected:', e);
            }
            this.updateCloudStatusIndicator(false);
        },

        // Set Supabase configuration
        setSupabaseConfig(url, anonKey) {
            if (!url || !anonKey) {
                localStorage.removeItem(SUPABASE_CONFIG_KEY);
                supabaseClient = null;
                this.updateCloudStatusIndicator(false);
                return false;
            }
            localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
            this.initSupabaseFromStorage();
            return true;
        },

        // Debounced sync to Supabase Cloud
        triggerDebouncedCloudSync(state) {
            if (!supabaseClient) return;
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                this.syncToCloud(state);
            }, 2500);
        },

        // Force immediate sync to cloud
        async syncToCloud(stateToSync) {
            if (!supabaseClient) {
                this.updateCloudStatusIndicator(false);
                return;
            }
            const user = this.getActiveUser();
            const state = stateToSync || window.gameState;
            if (!state) return;

            try {
                const { data, error } = await supabaseClient
                    .from('user_states')
                    .upsert({
                        user_id: user.id,
                        user_email: user.email,
                        user_name: user.name,
                        state_json: state,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' });

                if (error) {
                    console.error('[AuthSync] Cloud sync error:', error);
                    this.updateCloudStatusIndicator(false, 'שגיאת סנכרון');
                } else {
                    console.log('[AuthSync] Synced state to cloud for user:', user.name);
                    this.updateCloudStatusIndicator(true, 'מסונכרן לענן');
                }
            } catch (err) {
                console.error('[AuthSync] Network error during cloud sync:', err);
                this.updateCloudStatusIndicator(false, 'אופליין');
            }
        },

        // Update HUD user widget
        updateHudUserBadge() {
            const user = this.getActiveUser();
            const nameEl = document.getElementById('hud-active-user-name');
            const avatarEl = document.getElementById('hud-active-user-avatar');
            if (nameEl) nameEl.textContent = user.name;
            if (avatarEl) avatarEl.textContent = user.avatar;
        },

        // Update cloud status pill in HUD/Settings
        updateCloudStatusIndicator(isConnected, label) {
            const statusEl = document.getElementById('hud-cloud-sync-status');
            if (!statusEl) return;
            if (isConnected) {
                statusEl.className = 'cloud-status-pill connected';
                statusEl.innerHTML = '🟢 <span>' + (label || 'ענן מחובר') + '</span>';
            } else {
                statusEl.className = 'cloud-status-pill offline';
                statusEl.innerHTML = '📱 <span>' + (label || 'מקומי (אופליין)') + '</span>';
            }
        },

        // Render accounts in the Account Modal
        renderAccountsList() {
            const container = document.getElementById('accounts-list-container');
            if (!container) return;

            const registry = this.getAccounts();
            const activeId = this.getActiveUser().id;

            container.innerHTML = registry.map(acc => {
                const isActive = acc.id === activeId;
                const isDev = acc.id === 'adir_moshe';
                let actionBtn = '';
                if (!isActive) {
                    actionBtn = `<button class="btn btn-sm btn-primary" onclick="AuthSync.switchAccount('${acc.id}'); document.getElementById('accounts-modal').classList.remove('active');">עבור לחשבון</button>`;
                } else {
                    actionBtn = '<span class="active-indicator-text">בשימוש כעת</span>';
                }
                let deleteBtn = '';
                if (!isDev) {
                    deleteBtn = `<button class="btn btn-sm btn-danger" onclick="AuthSync.deleteAccount('${acc.id}')" title="מחק חשבון">🗑️</button>`;
                }

                return '<div class="account-item-card ' + (isActive ? 'active' : '') + '">' +
                    '<div class="account-item-info">' +
                        '<span class="account-avatar">' + acc.avatar + '</span>' +
                        '<div class="account-text">' +
                            '<div class="account-name-row">' +
                                '<strong>' + acc.name + '</strong>' +
                                (isDev ? '<span class="account-badge-dev">מפתח ראשי</span>' : '') +
                                (isActive ? '<span class="account-badge-active">פעיל</span>' : '') +
                            '</div>' +
                            '<span class="account-email">' + (acc.email || 'חשבון מקומי') + ' • סמסטר ' + (acc.startingSemester || 1) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="account-item-actions">' +
                        actionBtn +
                        deleteBtn +
                    '</div>' +
                '</div>';
            }).join('');
        },

        // Open Account Switcher Modal
        openAccountsModal() {
            const modal = document.getElementById('accounts-modal');
            if (modal) {
                this.renderAccountsList();
                modal.classList.add('active');
            }
        },

        // Open Onboarding Wizard for new students
        openOnboardingModal() {
            const modal = document.getElementById('onboarding-wizard-modal');
            if (modal) {
                modal.classList.add('active');
                this.populateOnboardingCourses();
            }
        },

        // Populate course checkboxes in onboarding
        populateOnboardingCourses() {
            const container = document.getElementById('onboarding-courses-checklist');
            if (!container || !window.gameState || !window.gameState.courses) return;

            const coursesBySem = {};
            Object.values(window.gameState.courses).forEach(c => {
                const sem = c.semester || 1;
                if (!coursesBySem[sem]) coursesBySem[sem] = [];
                coursesBySem[sem].push(c);
            });

            let html = '';
            for (let sem = 1; sem <= 4; sem++) {
                if (!coursesBySem[sem]) continue;
                html += '<div class="onboarding-sem-group">' +
                    '<div class="onboarding-sem-header">סמסטר ' + sem + '</div>' +
                    '<div class="onboarding-chips-grid">';
                
                coursesBySem[sem].forEach(c => {
                    const isMastered = c.status === 'mastered';
                    html += '<label class="onboarding-course-chip ' + (isMastered ? 'selected' : '') + '">' +
                        '<input type="checkbox" value="' + c.code + '" ' + (isMastered ? 'checked' : '') + ' onchange="this.parentElement.classList.toggle(\'selected\', this.checked)">' +
                        '<span class="chip-code">' + c.code + '</span>' +
                        '<span class="chip-name">' + c.name + '</span>' +
                        '<span class="chip-credits">' + c.credits + ' נק״ז</span>' +
                    '</label>';
                });

                html += '</div></div>';
            }
            container.innerHTML = html;
        },

        // Finish onboarding
        finishOnboarding() {
            if (!window.gameState || !window.gameState.courses) return;
            const container = document.getElementById('onboarding-courses-checklist');
            const semSelect = document.getElementById('onboarding-current-sem-select');
            
            const currentSem = semSelect ? parseInt(semSelect.value) : 1;
            window.gameState.currentActiveSemester = currentSem;

            if (container) {
                const checkedBoxes = container.querySelectorAll('input[type="checkbox"]:checked');
                checkedBoxes.forEach(cb => {
                    const code = cb.value;
                    if (window.gameState.courses[code]) {
                        window.gameState.courses[code].status = 'mastered';
                        window.gameState.courses[code].completed = true;
                        window.gameState.courses[code].grade = 85;
                        if (window.gameState.courses[code].tasks) {
                            window.gameState.courses[code].tasks.forEach(t => {
                                t.completed = true;
                                t.status = 'done';
                            });
                        }
                    }
                });
            }

            window.gameState.hasCompletedOnboarding = true;
            if (typeof recalculateCourseStates === 'function') recalculateCourseStates();
            if (typeof renderUI === 'function') renderUI();
            this.saveActiveUserState(window.gameState);

            const modal = document.getElementById('onboarding-wizard-modal');
            if (modal) modal.classList.remove('active');

            if (typeof showHudToast === 'function') {
                showHudToast('ברוך הבא! מסלול התואר שלך הוגדר בהצלחה 🎉', 'success');
            }
        }
    };

    window.AuthSync = AuthSync;
})(window);
