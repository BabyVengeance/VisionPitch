document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://visionpitch.onrender.com";

    // Industry Combobox & Persistence Management
    const DEFAULT_INDUSTRIES = [
        "Real Estate & Property Development",
        "E-Commerce & Online Retail",
        "Solar, Renewable Energy & EPC",
        "Healthcare, Medical & Dental",
        "Legal Services & Law Firms",
        "Financial Services, Accounting & Insurance",
        "Construction, Contracting & Civil Engineering",
        "Hospitality, Restaurants & Tourism",
        "Security & Asset Protection Services",
        "Automotive & Transportation",
        "Fitness, Wellness & Spas",
        "Education, Training & E-Learning",
        "Logistics, Warehousing & Supply Chain",
        "Software, SaaS & Technology",
        "Professional & Business Consulting",
        "Agriculture, Farming & Agribusiness",
        "Cleaning & Facilities Management",
        "Entertainment, Events & Media",
        "Manufacturing & Industrial Production",
        "Architecture & Interior Design",
        "Recruitment & HR Staffing",
        "Beauty, Salon & Aesthetics"
    ];

    function getCustomIndustries() {
        try {
            const stored = localStorage.getItem('vp_custom_industries');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCustomIndustry(newIndustry) {
        const custom = getCustomIndustries();
        if (!custom.includes(newIndustry)) {
            custom.push(newIndustry);
            localStorage.setItem('vp_custom_industries', JSON.stringify(custom));
        }
    }

    function initIndustryCombobox() {
        const hiddenInput = document.getElementById('intakeIndustry');
        const searchInput = document.getElementById('intakeIndustrySearch');
        const dropdown = document.getElementById('intakeIndustryDropdown');
        const optionsList = document.getElementById('industryOptionsList');

        if (!hiddenInput || !searchInput || !dropdown || !optionsList) return;

        let dbIndustries = [];

        function getActiveIndustriesList() {
            const custom = getCustomIndustries();
            const set = new Set([...DEFAULT_INDUSTRIES, ...custom, ...dbIndustries]);
            return Array.from(set).sort((a, b) => a.localeCompare(b));
        }

        function renderOptions(filter = '') {
            const list = getActiveIndustriesList();
            const query = filter.trim().toLowerCase();

            const matches = query
                ? list.filter(ind => ind.toLowerCase().includes(query))
                : list;

            let html = '';
            const exactMatchExists = list.some(ind => ind.toLowerCase() === query);

            if (query && !exactMatchExists) {
                const rawTyped = filter.trim();
                html += `
                    <div data-action="add-custom" data-value="${rawTyped.replace(/"/g, '&quot;')}" 
                        class="combobox-item px-3 py-2 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        Add "${rawTyped}" as New Industry
                    </div>
                `;
            }

            if (matches.length === 0 && !query) {
                html += `<div class="px-3 py-2 text-zinc-400 italic">No industries available</div>`;
            } else {
                matches.forEach(ind => {
                    const isSelected = hiddenInput.value === ind;
                    html += `
                        <div data-action="select" data-value="${ind.replace(/"/g, '&quot;')}" 
                            class="combobox-item px-3 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white flex items-center justify-between ${isSelected ? 'font-bold bg-zinc-100/50 dark:bg-zinc-800/50' : ''}">
                            <span>${ind}</span>
                            ${isSelected ? '<svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : ''}
                        </div>
                    `;
                });
            }

            optionsList.innerHTML = html;
            dropdown.classList.remove('hidden');
        }

        function selectIndustry(val) {
            hiddenInput.value = val;
            searchInput.value = val;
            dropdown.classList.add('hidden');
        }

        function handleAddCustom(val) {
            saveCustomIndustry(val);
            selectIndustry(val);
        }

        searchInput.addEventListener('focus', () => {
            renderOptions(searchInput.value);
        });

        searchInput.addEventListener('input', () => {
            if (hiddenInput.value !== searchInput.value) {
                hiddenInput.value = searchInput.value;
            }
            renderOptions(searchInput.value);
        });

        optionsList.addEventListener('click', (e) => {
            const item = e.target.closest('.combobox-item');
            if (!item) return;

            const action = item.getAttribute('data-action');
            const val = item.getAttribute('data-value');

            if (action === 'add-custom') {
                handleAddCustom(val);
            } else if (action === 'select') {
                selectIndustry(val);
            }
        });

        document.addEventListener('click', (e) => {
            const container = document.getElementById('industryComboboxContainer');
            if (container && !container.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstItem = optionsList.querySelector('.combobox-item');
                if (firstItem && !dropdown.classList.contains('hidden')) {
                    e.preventDefault();
                    firstItem.click();
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });

        window.updateComboboxDbIndustries = function(proposals) {
            if (Array.isArray(proposals)) {
                dbIndustries = proposals.map(p => p.industry).filter(Boolean);
            }
        };
    }

    initIndustryCombobox();

    // Macro Sector Mapping & Sub-Tab Analytics Controller
    const MACRO_SECTORS = {
        "Energy, Solar & Utilities": ["solar", "energy", "renewable", "epc", "utility", "power", "clean energy"],
        "Real Estate & Property": ["real estate", "property", "construction", "contracting", "architecture", "interior", "engineering", "housing", "building"],
        "Commerce & Retail": ["e-commerce", "retail", "automotive", "beauty", "salon", "manufacturing", "industrial", "store", "shop", "fashion"],
        "Professional & Legal": ["legal", "accounting", "financial", "insurance", "consulting", "recruitment", "hr", "tax", "attorney", "law"],
        "Health & Wellness": ["health", "medical", "dental", "fitness", "wellness", "spa", "clinic", "hospital", "pharma"],
        "Tech & Services": ["software", "saas", "tech", "cleaning", "facilities", "security", "entertainment", "event", "media", "it"]
    };

    function getMacroSector(industry) {
        if (!industry) return "Tech & Services";
        const lower = industry.toLowerCase();

        for (const [sector, keywords] of Object.entries(MACRO_SECTORS)) {
            if (keywords.some(kw => lower.includes(kw))) {
                return sector;
            }
        }
        return "Professional & Legal";
    }

    function initAnalyticsSubtabs() {
        const tabButtons = document.querySelectorAll('.analytics-subtab-btn');
        const subviews = document.querySelectorAll('.analytics-subview');

        if (!tabButtons || tabButtons.length === 0) return;

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                tabButtons.forEach(b => {
                    b.className = "analytics-subtab-btn px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all";
                });

                btn.className = "analytics-subtab-btn px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-all shadow-sm";

                subviews.forEach(view => {
                    view.classList.add('hidden');
                });

                const activeView = document.getElementById(`analyticsView${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
                if (activeView) activeView.classList.remove('hidden');
            });
        });
    }

    initAnalyticsSubtabs();

    // Standard Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginError = document.getElementById('loginError');

            const username = usernameInput ? usernameInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (username === 'admin' && password === '123') {
                if (loginError) loginError.classList.add('hidden');
                sessionStorage.setItem("isLoggedIn", "true");
                window.location.href = 'index.html';
            } else {
                if (loginError) {
                    loginError.classList.remove('hidden');
                } else {
                    alert('Invalid username or password.');
                }
            }
        });
    }

    // Standard Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log("Logging out...");
            sessionStorage.removeItem("isLoggedIn");
            window.location.href = 'login.html';
        });
    }

    // Toggle dark/light theme and remember choice in local storage
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        const sunIcon = document.getElementById('sunIcon');
        const moonIcon = document.getElementById('moonIcon');

        function updateIcons() {
            if (document.documentElement.classList.contains('dark')) {
                if (sunIcon) sunIcon.classList.remove('hidden');
                if (moonIcon) moonIcon.classList.add('hidden');
            } else {
                if (sunIcon) sunIcon.classList.add('hidden');
                if (moonIcon) moonIcon.classList.remove('hidden');
            }
        }

        updateIcons();

        themeToggleBtn.addEventListener('click', () => {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
            } else {
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
            }
            updateIcons();
        });
    }

    // Modal controls for new client intake form
    const proposalsTableBody = document.getElementById('proposalsTableBody');
    const countGenerated = document.getElementById('countGenerated');
    const countOpened = document.getElementById('countOpened');
    const countUnopened = document.getElementById('countUnopened');
    const countClosed = document.getElementById('countClosed');
    const countDeclined = document.getElementById('countDeclined');

    const newClientBtn = document.getElementById('newClientBtn');
    const headerGenerateBtn = document.getElementById('headerGenerateBtn');
    const intakeModal = document.getElementById('intakeModal');
    const closeIntakeModal = document.getElementById('closeIntakeModal');
    const cancelIntake = document.getElementById('cancelIntake');
    const intakeForm = document.getElementById('intakeForm');
    const valError = document.getElementById('validationError');

    const addSocialLinkBtn = document.getElementById('addSocialLinkBtn');
    const additionalSocialContainer = document.getElementById('additionalSocialContainer');
    const activeSocialInputsContainer = document.getElementById('activeSocialInputsContainer');
    const socialPlatformSelectors = document.getElementById('socialPlatformSelectors');

    // Automatically prepends https:// if user omits protocol
    function ensureHttpProtocol(url) {
        if (!url) return '';
        const trimmed = url.trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        return `https://${trimmed}`;
    }

    function attachProtocolFormatter(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('blur', () => {
            if (inputEl.value.trim()) {
                inputEl.value = ensureHttpProtocol(inputEl.value);
            }
        });
    }

    function formatCompetitorInput(inputEl) {
        if (!inputEl) return;
        inputEl.addEventListener('blur', () => {
            const val = inputEl.value.trim();
            if (!val) return;
            if (/^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(val) || /^www\./i.test(val)) {
                inputEl.value = ensureHttpProtocol(val);
            }
        });
    }

    // Attach blur protocol formatters to static website & competitor fields
    attachProtocolFormatter(document.getElementById('intakeWebsiteUrl'));
    formatCompetitorInput(document.getElementById('intakeCompetitor1'));
    formatCompetitorInput(document.getElementById('intakeCompetitor2'));
    formatCompetitorInput(document.getElementById('intakeCompetitor3'));

    const PLATFORM_CONFIG = {
        instagram: {
            name: "Instagram",
            placeholder: "https://instagram.com/profile",
            icon: `<svg class="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
        },
        facebook: {
            name: "Facebook",
            placeholder: "https://facebook.com/page",
            icon: `<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
        },
        linkedin: {
            name: "LinkedIn",
            placeholder: "https://linkedin.com/in/profile",
            icon: `<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
        },
        tiktok: {
            name: "TikTok",
            placeholder: "https://tiktok.com/@profile",
            icon: `<svg class="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.34a6.33 6.33 0 0 0-1-.08 6.26 6.26 0 0 0-6.25 6.25A6.26 6.26 0 0 0 9.34 21.8c3.3 0 6.06-2.54 6.24-5.81V9.28a8.28 8.28 0 0 0 4.01 1.03V6.86a4.78 4.78 0 0 1-.01-.17z"/></svg>`
        },
        youtube: {
            name: "YouTube",
            placeholder: "https://youtube.com/@channel",
            icon: `<svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
        }
    };

    function togglePlatformInput(key, btnEl) {
        if (!activeSocialInputsContainer) return;

        const existingRow = activeSocialInputsContainer.querySelector(`[data-platform-row="${key}"]`);
        if (existingRow) {
            existingRow.remove();
            if (btnEl) btnEl.classList.remove('ring-2', 'ring-black', 'dark:ring-white', 'bg-zinc-200', 'dark:bg-zinc-800');
            return;
        }

        const config = PLATFORM_CONFIG[key];
        if (!config) return;

        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 transition-all';
        row.setAttribute('data-platform-row', key);
        row.innerHTML = `
            <div class="flex-1 relative flex items-center">
                <div class="absolute left-3 flex items-center pointer-events-none">
                    ${config.icon}
                </div>
                <input type="url" class="platform-social-url w-full min-h-[48px] bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg pl-9 pr-3 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-zinc-400" placeholder="${config.placeholder}">
            </div>
            <button type="button" class="remove-platform-btn min-h-[48px] min-w-[48px] flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800" title="Remove field">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;

        const inputEl = row.querySelector('.platform-social-url');
        attachProtocolFormatter(inputEl);

        row.querySelector('.remove-platform-btn').addEventListener('click', () => {
            row.remove();
            if (btnEl) btnEl.classList.remove('ring-2', 'ring-black', 'dark:ring-white', 'bg-zinc-200', 'dark:bg-zinc-800');
        });

        activeSocialInputsContainer.appendChild(row);
        inputEl.focus();
        if (btnEl) btnEl.classList.add('ring-2', 'ring-black', 'dark:ring-white', 'bg-zinc-200', 'dark:bg-zinc-800');
    }

    if (socialPlatformSelectors) {
        socialPlatformSelectors.querySelectorAll('.social-platform-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const key = btn.getAttribute('data-platform');
                togglePlatformInput(key, btn);
            });
        });
    }

    function createDynamicSocialInput() {
        if (!additionalSocialContainer) return;
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 transition-all';
        row.innerHTML = `
            <div class="flex-1">
                <input type="url" class="dynamic-social-url w-full min-h-[48px] bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg px-3 py-2.5 text-sm text-black dark:text-white focus:outline-none focus:border-zinc-400" placeholder="https://... (Twitter/X, TikTok, YouTube, etc.)">
            </div>
            <button type="button" class="remove-social-btn min-h-[48px] min-w-[48px] flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800" title="Remove link">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;
        attachProtocolFormatter(row.querySelector('.dynamic-social-url'));
        row.querySelector('.remove-social-btn').addEventListener('click', () => {
            row.remove();
        });
        additionalSocialContainer.appendChild(row);
    }

    if (addSocialLinkBtn) {
        addSocialLinkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createDynamicSocialInput();
        });
    }

    function toggleModal(show) {
        if (intakeModal) {
            intakeModal.classList.toggle('hidden', !show);
            if (!show) {
                intakeForm.reset();
                const hiddenInd = document.getElementById('intakeIndustry');
                const searchInd = document.getElementById('intakeIndustrySearch');
                const dropInd = document.getElementById('intakeIndustryDropdown');
                if (hiddenInd) hiddenInd.value = '';
                if (searchInd) searchInd.value = '';
                if (dropInd) dropInd.classList.add('hidden');

                const c1 = document.getElementById('intakeCompetitor1');
                const c2 = document.getElementById('intakeCompetitor2');
                const c3 = document.getElementById('intakeCompetitor3');
                if (c1) c1.value = '';
                if (c2) c2.value = '';
                if (c3) c3.value = '';

                if (activeSocialInputsContainer) activeSocialInputsContainer.innerHTML = '';
                if (additionalSocialContainer) additionalSocialContainer.innerHTML = '';
                if (socialPlatformSelectors) {
                    socialPlatformSelectors.querySelectorAll('.social-platform-btn').forEach(btn => {
                        btn.classList.remove('ring-2', 'ring-black', 'dark:ring-white', 'bg-zinc-200', 'dark:bg-zinc-800');
                    });
                }
                valError.classList.add('hidden');
            }
        }
    }

    if (newClientBtn) {
        newClientBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal(true);
        });
    }

    if (headerGenerateBtn) {
        headerGenerateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal(true);
        });
    }

    if (closeIntakeModal) {
        closeIntakeModal.addEventListener('click', () => toggleModal(false));
    }

    if (cancelIntake) {
        cancelIntake.addEventListener('click', () => toggleModal(false));
    }

    window.addEventListener('click', (e) => {
        if (e.target === intakeModal) {
            toggleModal(false);
        }
    });

    // Validate intake form, post client data to API, and reload table
    if (intakeForm) {
        intakeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            valError.classList.add('hidden');

            const client_name = document.getElementById('intakeClientName').value.trim();
            const company_name = document.getElementById('intakeCompanyName').value.trim();
            const industry = document.getElementById('intakeIndustry').value.trim();
            
            const raw_website = document.getElementById('intakeWebsiteUrl').value.trim();
            const website_url = raw_website ? ensureHttpProtocol(raw_website) : null;

            const platformUrls = Array.from(document.querySelectorAll('.platform-social-url'))
                .map(el => ensureHttpProtocol(el.value || ''))
                .filter(Boolean);
            const dynamicUrls = Array.from(document.querySelectorAll('.dynamic-social-url'))
                .map(el => ensureHttpProtocol(el.value || ''))
                .filter(Boolean);

            const allSocials = [...platformUrls, ...dynamicUrls].filter(Boolean);
            const social_media_urls = allSocials.length > 0 ? allSocials.join(', ') : null;

            const budgetVal = document.getElementById('intakeBudget').value.trim();
            const budget = budgetVal ? parseFloat(budgetVal) : null;

            const comp1 = document.getElementById('intakeCompetitor1')?.value.trim();
            const comp2 = document.getElementById('intakeCompetitor2')?.value.trim();
            const comp3 = document.getElementById('intakeCompetitor3')?.value.trim();
            const competitorsList = [comp1, comp2, comp3].filter(Boolean);

            // Make sure at least website or social media URL is provided
            if (!website_url && !social_media_urls) {
                valError.textContent = "Validation error: Either Website URL or Social Media is required.";
                valError.classList.remove('hidden');
                return;
            }

            const submitBtn = intakeForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing...";

            // Send proposal generation request to backend
            fetch(`${API_BASE}/api/proposals/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_name,
                    company_name,
                    industry,
                    website_url,
                    social_media_urls,
                    budget,
                    competitors: competitorsList.length > 0 ? competitorsList : null
                })
            })
                .then(res => {
                    if (!res.ok) {
                        return res.json().then(data => {
                            throw new Error(data.detail || "Operational error occurred during ingestion.");
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    toggleModal(false);
                    alert(`Proposal generated successfully! Direct link: ${window.location.origin}/frontend${data.preview_link}`);
                    loadDashboardData();
                })
                .catch(err => {
                    valError.textContent = err.message;
                    valError.classList.remove('hidden');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit";
                });
        });
    }

    let loadedProposals = [];
    let currentIndustryFilter = 'All';
    let currentValueFilter = 'All';
    let currentPriorityFilter = 'All';
    let currentStatusFilter = 'All';

    let currentSortField = null; // 'company', 'industry', 'value', 'priority', 'status'
    let currentSortDirection = null; // 'asc', 'desc'

    function getPriorityBadgeHTML(priority) {
        const p = (priority || 'Medium').toLowerCase();
        if (p === 'high') {
            return `<span class="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">High</span>`;
        } else if (p === 'low') {
            return `<span class="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">Low</span>`;
        }
        return `<span class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">Medium</span>`;
    }

    function getPriorityRank(priority) {
        const p = (priority || 'Medium').toLowerCase();
        if (p === 'high') return 3;
        if (p === 'medium') return 2;
        if (p === 'low') return 1;
        return 2;
    }

    function getSavedPriorityOverrides() {
        try {
            const saved = localStorage.getItem('vp_priority_overrides');
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    function savePriorityOverride(clientId, priority) {
        const overrides = getSavedPriorityOverrides();
        overrides[clientId] = priority;
        localStorage.setItem('vp_priority_overrides', JSON.stringify(overrides));
    }

    function handlePriorityChange(clientId, newPriority) {
        const rec = loadedProposals.find(r => r.client_id === clientId);
        if (rec) {
            rec.priority = newPriority;
            savePriorityOverride(clientId, newPriority);
            renderTableRows(loadedProposals);
            renderAnalytics();
            renderClientDirectory();
        }
    }

    const auditModal = document.getElementById('auditModal');
    const closeAuditModal = document.getElementById('closeAuditModal');
    const closeAuditBtn = document.getElementById('closeAuditBtn');
    const auditModalTitle = document.getElementById('auditModalTitle');
    const auditSentiment = document.getElementById('auditSentiment');
    const auditGaps = document.getElementById('auditGaps');
    const auditCompetitors = document.getElementById('auditCompetitors');

    function toggleAuditModal(show) {
        if (auditModal) {
            auditModal.classList.toggle('hidden', !show);
        }
    }

    if (closeAuditModal) closeAuditModal.addEventListener('click', () => toggleAuditModal(false));
    if (closeAuditBtn) closeAuditBtn.addEventListener('click', () => toggleAuditModal(false));
    window.addEventListener('click', (e) => {
        if (e.target === auditModal) toggleAuditModal(false);
    });

    // Favicon logo extractor helper using Google's Favicon service
    function getFaviconUrl(compName) {
        if (!compName) return null;
        const domainMatch = compName.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
        if (domainMatch && domainMatch[1]) {
            return `https://www.google.com/s2/favicons?domain=${domainMatch[1]}&sz=64`;
        }
        const cleanSlug = compName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanSlug) {
            return `https://www.google.com/s2/favicons?domain=${cleanSlug}.co.za&sz=64`;
        }
        return null;
    }

    const copyCompetitorsBtn = document.getElementById('copyCompetitorsBtn');
    const copyCompetitorsText = document.getElementById('copyCompetitorsText');
    const editAuditFromModalBtn = document.getElementById('editAuditFromModalBtn');
    let activeAuditCompetitors = [];
    let activeAuditCompanyName = "";
    let activeAuditProposalHash = "";

    if (copyCompetitorsBtn) {
        copyCompetitorsBtn.addEventListener('click', () => {
            if (!activeAuditCompetitors || activeAuditCompetitors.length === 0) {
                alert("No competitor analysis data available to copy.");
                return;
            }
            let textDigest = `📊 MARKET COMPETITOR BENCHMARK AUDIT — ${activeAuditCompanyName.toUpperCase()}\n`;
            textDigest += `Synthesized by Apex VisionPitch Engine\n\n`;

            activeAuditCompetitors.forEach((comp, idx) => {
                const badge = comp.is_anchor || comp.source_label === "Sales Rep Anchor Input" || comp.source_label === "Direct Competitor" ? "[Direct Competitor]" : "[Market Competitor]";
                textDigest += `${idx + 1}. ${comp.name} ${badge}\n`;
                textDigest += `   • Core Strategy: ${comp.platform_leveraged || 'Presence'}\n`;
                textDigest += `   • Market Advantage: ${comp.revenue_advantage || 'High domain authority.'}\n\n`;
            });

            navigator.clipboard.writeText(textDigest).then(() => {
                if (copyCompetitorsText) copyCompetitorsText.textContent = "✓ Digest Copied!";
                copyCompetitorsBtn.classList.add('border-emerald-500', 'text-emerald-500');
                setTimeout(() => {
                    if (copyCompetitorsText) copyCompetitorsText.textContent = "Copy Competitors Digest";
                    copyCompetitorsBtn.classList.remove('border-emerald-500', 'text-emerald-500');
                }, 2200);
            }).catch(err => {
                console.error("Clipboard copy failed:", err);
            });
        });
    }

    if (editAuditFromModalBtn) {
        editAuditFromModalBtn.addEventListener('click', () => {
            if (activeAuditProposalHash) {
                toggleAuditModal(false);
                openAuditStagingEditor(activeAuditProposalHash);
            } else {
                alert("No proposal record found to edit this audit.");
            }
        });
    }

    // Populate audit modal with sentiment, visibility gaps, and competitor analysis
    function handleViewAudit(clientId) {
        const rec = loadedProposals.find(r => r.client_id === clientId);
        if (!rec || !rec.audit_raw_json) return;

        activeAuditProposalHash = rec.proposal_hash || "";

        try {
            const audit = JSON.parse(rec.audit_raw_json);
            activeAuditCompanyName = rec.company_name || "Target Business";
            auditModalTitle.textContent = `Market Visibility Audit — ${rec.company_name}`;
            auditSentiment.textContent = audit.online_sentiment_review || "No sentiment details generated.";

            auditGaps.innerHTML = '';
            if (audit.visibility_gaps && audit.visibility_gaps.length > 0) {
                audit.visibility_gaps.forEach(gap => {
                    const item = document.createElement('div');
                    item.className = "flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg";
                    item.innerHTML = `
                        <div class="w-4 h-4 text-black dark:text-white flex-shrink-0">
                            <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <span class="text-xs text-zinc-700 dark:text-zinc-300 font-bold">${gap}</span>
                    `;
                    auditGaps.appendChild(item);
                });
            } else {
                auditGaps.innerHTML = '<p class="text-xs text-zinc-550">No visibility gaps logged.</p>';
            }

            auditCompetitors.innerHTML = '';
            activeAuditCompetitors = audit.competitor_analysis || [];

            if (activeAuditCompetitors && activeAuditCompetitors.length > 0) {
                activeAuditCompetitors.forEach(comp => {
                    const col = document.createElement('div');
                    col.className = "bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-left flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all";
                    
                    const faviconUrl = getFaviconUrl(comp.name);
                    const faviconHtml = faviconUrl 
                        ? `<img src="${faviconUrl}" class="w-5 h-5 rounded-md object-contain bg-white dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0" alt="${comp.name} logo" onerror="this.style.display='none'" />` 
                        : `<div class="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 text-zinc-400"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7m4 4h4m-4 0H7"></path></svg></div>`;

                    const isAnchor = comp.is_anchor || comp.source_label === "Sales Rep Anchor Input" || comp.source_label === "Direct Competitor";
                    const badgeHtml = isAnchor
                        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-full shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Direct Competitor</span>`
                        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-full shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Market Competitor</span>`;

                    col.innerHTML = `
                        <div class="space-y-2">
                            <div class="flex items-start justify-between gap-2">
                                <div class="flex items-center gap-2 min-w-0">
                                    ${faviconHtml}
                                    <h5 class="text-xs font-bold text-black dark:text-white uppercase truncate tracking-tight">${comp.name}</h5>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-1.5 items-center">
                                ${badgeHtml}
                                <span class="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/40 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300">${comp.platform_leveraged || 'Presence'}</span>
                            </div>
                            <p class="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium pt-1">${comp.revenue_advantage}</p>
                        </div>
                    `;
                    auditCompetitors.appendChild(col);
                });
            } else {
                auditCompetitors.innerHTML = '<p class="text-xs text-zinc-550">No competitor analysis loaded.</p>';
            }

            toggleAuditModal(true);
        } catch (e) {
            console.error(e);
            alert("Error parsing audit data.");
        }
    }

    // Recalculate sales dashboard summary counts from cached proposals
    function updateMetricsFromCache() {
        let metrics = {
            'Proposal generated': 0,
            'Proposal sent': 0,
            'Proposal viewed': 0,
            'Proposal signed': 0,
            'Proposal declined': 0
        };

        loadedProposals.forEach(rec => {
            if (rec.client_status in metrics) {
                metrics[rec.client_status]++;
            }
        });

        if (countGenerated) countGenerated.textContent = metrics['Proposal generated'];
        if (countOpened) countOpened.textContent = metrics['Proposal viewed'];
        if (countUnopened) countUnopened.textContent = metrics['Proposal sent'];
        if (countClosed) countClosed.textContent = metrics['Proposal signed'];
        if (countDeclined) countDeclined.textContent = metrics['Proposal declined'];
    }

    // SPA Section Navigation (Dashboard, Sales Analytics, View Clients)
    const navDashboard = document.getElementById('navDashboard');
    const navAnalytics = document.getElementById('navAnalytics');
    const navClients = document.getElementById('navClients');
    const dashboardSection = document.getElementById('dashboardSection');
    const analyticsSection = document.getElementById('analyticsSection');
    const clientsSection = document.getElementById('clientsSection');

    function switchTab(target) {
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (analyticsSection) analyticsSection.classList.add('hidden');
        if (clientsSection) clientsSection.classList.add('hidden');

        const activeClass = "flex items-center gap-3 px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg transition-colors font-medium";
        const inactiveClass = "flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white rounded-lg transition-colors font-medium";

        if (navDashboard) navDashboard.className = inactiveClass;
        if (navAnalytics) navAnalytics.className = inactiveClass;
        if (navClients) navClients.className = inactiveClass;

        if (target === 'dashboard') {
            if (dashboardSection) dashboardSection.classList.remove('hidden');
            if (navDashboard) navDashboard.className = activeClass;
        } else if (target === 'analytics') {
            if (analyticsSection) analyticsSection.classList.remove('hidden');
            if (navAnalytics) navAnalytics.className = activeClass;
            renderAnalytics();
        } else if (target === 'clients') {
            if (clientsSection) clientsSection.classList.remove('hidden');
            if (navClients) navClients.className = activeClass;
            renderClientDirectory();
        }
    }

    if (navDashboard) navDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
    if (navAnalytics) navAnalytics.addEventListener('click', (e) => { e.preventDefault(); switchTab('analytics'); });
    if (navClients) navClients.addEventListener('click', (e) => { e.preventDefault(); switchTab('clients'); });

    // Sales Command Center Engine: Quota Attainment, Weighted Forecast & Action Radar
    function getMonthlyQuota() {
        const val = localStorage.getItem('visionpitch_monthly_quota');
        return val ? Math.max(10000, Number(val)) : 100000;
    }

    const editQuotaTargetBtn = document.getElementById('editQuotaTargetBtn');
    if (editQuotaTargetBtn) {
        editQuotaTargetBtn.addEventListener('click', () => {
            const current = getMonthlyQuota();
            const input = prompt(`Set Monthly Sales Quota Target (ZAR):\n\nCurrent Target: R ${current.toLocaleString()}`, current);
            if (input !== null) {
                const parsed = parseInt(input.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(parsed) && parsed > 0) {
                    localStorage.setItem('visionpitch_monthly_quota', parsed);
                    renderAnalytics();
                } else if (input.trim() !== '') {
                    alert('Please enter a valid numeric target amount in ZAR.');
                }
            }
        });
    }

    function copyWhatsAppScript(clientName, companyName, industry, proposalHash) {
        const link = proposalHash ? `${window.location.origin}/frontend/proposals.html?id=${proposalHash}` : window.location.href;
        const text = `Hi ${clientName}, Rohan here from Apex Digital. I noticed you had a chance to look over the ${industry} digital pitch for ${companyName} (${link}). Did you have 2 minutes for a quick chat regarding the ROI timeline?`;
        
        navigator.clipboard.writeText(text).then(() => {
            alert(`WhatsApp follow-up script for ${clientName} copied to clipboard!`);
        }).catch(err => {
            console.error('Clipboard error:', err);
            alert(`Follow-up Script:\n\n${text}`);
        });
    }

    function renderActionRadar(proposals) {
        const container = document.getElementById('actionRadarContainer');
        const badgeCount = document.getElementById('actionRadarBadgeCount');
        if (!container) return;

        if (!proposals || proposals.length === 0) {
            container.innerHTML = `<p class="text-zinc-400 italic py-4 text-center">No active proposals in pipeline.</p>`;
            if (badgeCount) badgeCount.textContent = "0 Alerts";
            return;
        }

        let alertsCount = 0;
        let cardsHtml = '';

        // Sort proposals so High priority items float to top of Radar
        const sortedProposals = [...proposals].sort((a, b) => {
            const rankA = getPriorityRank(a.priority);
            const rankB = getPriorityRank(b.priority);
            return rankB - rankA;
        });

        sortedProposals.forEach(p => {
            const val = (p.client_status === 'Proposal signed' && p.final_price) ? p.final_price : (p.budget || p.final_price || 0);
            const fmtVal = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);
            const priorityBadge = getPriorityBadgeHTML(p.priority);

            if (p.client_status === 'Proposal viewed') {
                alertsCount++;
                cardsHtml += `
                    <div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-500/30 space-y-2 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                    <svg class="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    At-Risk Pitch (Viewed)
                                </span>
                                ${priorityBadge}
                            </div>
                            <span class="font-bold text-black dark:text-white text-xs">${fmtVal}</span>
                        </div>
                        <div class="flex justify-between items-baseline">
                            <div>
                                <h4 class="font-bold text-black dark:text-white text-xs">${p.company_name}</h4>
                                <p class="text-[11px] text-zinc-500">${p.client_name} • ${p.industry}</p>
                            </div>
                            <button type="button" data-action="whatsapp-nudge" data-client="${p.client_name}" data-company="${p.company_name}" data-industry="${p.industry}" data-hash="${p.proposal_hash || ''}"
                                class="btn-radar-nudge px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500 hover:bg-amber-600 text-black transition-colors flex items-center gap-1">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/></svg>
                                WhatsApp Follow-Up
                            </button>
                        </div>
                    </div>
                `;
            } else if (p.client_status === 'Proposal generated' || p.client_status === 'Proposal sent') {
                alertsCount++;
                cardsHtml += `
                    <div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 space-y-2 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 rounded border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                                    <svg class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    Unopened Link
                                </span>
                                ${priorityBadge}
                            </div>
                            <span class="font-bold text-black dark:text-white text-xs">${fmtVal}</span>
                        </div>
                        <div class="flex justify-between items-baseline">
                            <div>
                                <h4 class="font-bold text-black dark:text-white text-xs">${p.company_name}</h4>
                                <p class="text-[11px] text-zinc-500">${p.client_name} • ${p.industry}</p>
                            </div>
                            <button type="button" data-action="copy-link" data-hash="${p.proposal_hash || ''}"
                                class="btn-radar-copy px-2.5 py-1 text-[10px] font-bold rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-black dark:text-white transition-colors">
                                Copy Pitch Link
                            </button>
                        </div>
                    </div>
                `;
            } else if (p.client_status === 'Proposal signed') {
                cardsHtml += `
                    <div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/50 space-y-2 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                    <svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                    Closed Won
                                </span>
                                ${priorityBadge}
                            </div>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">${fmtVal}</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-black dark:text-white text-xs">${p.company_name}</h4>
                            <p class="text-[11px] text-zinc-500">${p.client_name} • ${p.industry}</p>
                        </div>
                    </div>
                `;
            }
        });

        if (badgeCount) badgeCount.textContent = `${alertsCount} Action Alerts`;
        container.innerHTML = cardsHtml || `<p class="text-emerald-600 dark:text-emerald-400 font-semibold py-4 text-center">All pitches active & closed!</p>`;

        container.onclick = (e) => {
            const btnNudge = e.target.closest('.btn-radar-nudge');
            const btnCopy = e.target.closest('.btn-radar-copy');

            if (btnNudge) {
                const client = btnNudge.getAttribute('data-client');
                const company = btnNudge.getAttribute('data-company');
                const ind = btnNudge.getAttribute('data-industry');
                const hash = btnNudge.getAttribute('data-hash');
                copyWhatsAppScript(client, company, ind, hash);
            } else if (btnCopy) {
                const hash = btnCopy.getAttribute('data-hash');
                const link = hash ? `${window.location.origin}/frontend/proposals.html?id=${hash}` : window.location.href;
                navigator.clipboard.writeText(link).then(() => alert(`Proposal link copied to clipboard!\n${link}`));
            }
        };
    }

    function renderAnalytics() {
        if (!loadedProposals || loadedProposals.length === 0) return;

        const monthlyQuota = getMonthlyQuota();
        const totalDeals = loadedProposals.length;
        let totalPipeline = 0;
        let wonRevenue = 0;
        let weightedForecast = 0;

        let countGenerated = 0;
        let countViewed = 0;
        let countSigned = 0;
        let countDeclined = 0;

        let prioRevenue = { high: 0, medium: 0, low: 0 };
        let prioCounts = { high: 0, medium: 0, low: 0 };

        const industryData = {};

        loadedProposals.forEach(item => {
            const dealValue = (item.client_status === 'Proposal signed' && item.final_price) ? item.final_price : (item.budget || item.final_price || 0);
            const numVal = Number(dealValue);
            const prio = (item.priority || 'Medium').toLowerCase();

            if (prio === 'high') {
                prioRevenue.high += numVal;
                prioCounts.high++;
            } else if (prio === 'low') {
                prioRevenue.low += numVal;
                prioCounts.low++;
            } else {
                prioRevenue.medium += numVal;
                prioCounts.medium++;
            }

            // Priority multiplier adjustments (+15% for High, 0 for Medium, -10% for Low)
            let prioMod = 0;
            if (prio === 'high') prioMod = 0.15;
            else if (prio === 'low') prioMod = -0.10;

            totalPipeline += numVal;

            if (item.client_status === 'Proposal signed') {
                countSigned++;
                wonRevenue += numVal;
                weightedForecast += numVal;
            } else if (item.client_status === 'Proposal viewed') {
                countViewed++;
                const prob = Math.min(1.0, Math.max(0.05, 0.8 + prioMod));
                weightedForecast += (numVal * prob);
            } else if (item.client_status === 'Proposal generated' || item.client_status === 'Proposal sent') {
                countGenerated++;
                const prob = Math.min(1.0, Math.max(0.05, 0.3 + prioMod));
                weightedForecast += (numVal * prob);
            } else if (item.client_status === 'Proposal declined') {
                countDeclined++;
            }

            const ind = item.industry || 'Other';
            if (!industryData[ind]) {
                industryData[ind] = { count: 0, won: 0, wonCount: 0 };
            }
            industryData[ind].count++;
            if (item.client_status === 'Proposal signed') {
                industryData[ind].won += numVal;
                industryData[ind].wonCount++;
            }
        });

        const fmtZAR = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);

        // Update Monthly Quota Progress Widget
        const quotaProgressBar = document.getElementById('quotaProgressBar');
        const quotaTargetLabel = document.getElementById('quotaTargetLabel');
        const quotaPctLabel = document.getElementById('quotaPctLabel');
        const quotaTargetDisplay = document.getElementById('quotaTargetDisplay');

        const quotaPct = Math.min(100, Math.round((wonRevenue / monthlyQuota) * 100));
        if (quotaProgressBar) quotaProgressBar.style.width = `${quotaPct}%`;
        if (quotaTargetLabel) quotaTargetLabel.textContent = `${fmtZAR(wonRevenue)} / R ${Math.round(monthlyQuota / 1000)}k`;
        if (quotaPctLabel) quotaPctLabel.textContent = `${quotaPct}% Target Achieved`;
        if (quotaTargetDisplay) quotaTargetDisplay.textContent = `Target: ${fmtZAR(monthlyQuota)} / mo`;

        // Update Financial KPI Summary Cards
        const statTotalPipeline = document.getElementById('statTotalPipeline');
        const statWonRevenue = document.getElementById('statWonRevenue');
        const statWeightedForecast = document.getElementById('statWeightedForecast');
        const statAvgDeal = document.getElementById('statAvgDeal');
        const statWinRateBadge = document.getElementById('statWinRateBadge');

        if (statTotalPipeline) statTotalPipeline.textContent = fmtZAR(totalPipeline);
        if (statWonRevenue) statWonRevenue.textContent = fmtZAR(wonRevenue);
        if (statWeightedForecast) statWeightedForecast.textContent = fmtZAR(weightedForecast);

        const avgDeal = totalDeals > 0 ? Math.round(totalPipeline / totalDeals) : 0;
        const winRate = totalDeals > 0 ? Math.round((countSigned / totalDeals) * 100) : 0;

        if (statAvgDeal) statAvgDeal.textContent = fmtZAR(avgDeal);
        if (statWinRateBadge) statWinRateBadge.textContent = `${winRate}% Win Rate`;

        // Update Priority Breakdown Full-Width Widget
        const prioWidgetTotalDeals = document.getElementById('prioWidgetTotalDeals');
        const prioWidgetTopPct = document.getElementById('prioWidgetTopPct');
        const prioValHigh = document.getElementById('prioValHigh');
        const prioValMed = document.getElementById('prioValMed');
        const prioValLow = document.getElementById('prioValLow');
        const ringPrioHigh = document.getElementById('ringPrioHigh');
        const ringPrioMed = document.getElementById('ringPrioMed');
        const ringPrioLow = document.getElementById('ringPrioLow');
        const prioBarHigh = document.getElementById('prioBarHigh');
        const prioBarMed = document.getElementById('prioBarMed');
        const prioBarLow = document.getElementById('prioBarLow');
        const prioCountHigh = document.getElementById('prioCountHigh');
        const prioCountMed = document.getElementById('prioCountMed');
        const prioCountLow = document.getElementById('prioCountLow');
        const prioAvgHigh = document.getElementById('prioAvgHigh');
        const prioAvgMed = document.getElementById('prioAvgMed');
        const prioAvgLow = document.getElementById('prioAvgLow');

        const totalPrioVal = totalPipeline || 1;
        const pctHigh = Math.round((prioRevenue.high / totalPrioVal) * 100);
        const pctMed = Math.round((prioRevenue.medium / totalPrioVal) * 100);
        const pctLow = Math.round((prioRevenue.low / totalPrioVal) * 100);

        if (prioWidgetTotalDeals) prioWidgetTotalDeals.textContent = `${totalDeals} Deals`;
        if (prioWidgetTopPct) prioWidgetTopPct.textContent = `${pctHigh}%`;
        if (prioValHigh) prioValHigh.textContent = `${fmtZAR(prioRevenue.high)} (${pctHigh}%)`;
        if (prioValMed) prioValMed.textContent = `${fmtZAR(prioRevenue.medium)} (${pctMed}%)`;
        if (prioValLow) prioValLow.textContent = `${fmtZAR(prioRevenue.low)} (${pctLow}%)`;

        // Progress Bars
        if (prioBarHigh) prioBarHigh.style.width = `${pctHigh}%`;
        if (prioBarMed) prioBarMed.style.width = `${pctMed}%`;
        if (prioBarLow) prioBarLow.style.width = `${pctLow}%`;

        // Deal Counts
        if (prioCountHigh) prioCountHigh.textContent = `${prioCounts.high} deal${prioCounts.high !== 1 ? 's' : ''}`;
        if (prioCountMed) prioCountMed.textContent = `${prioCounts.medium} deal${prioCounts.medium !== 1 ? 's' : ''}`;
        if (prioCountLow) prioCountLow.textContent = `${prioCounts.low} deal${prioCounts.low !== 1 ? 's' : ''}`;

        // Per-Tier Averages
        const avgHigh = prioCounts.high > 0 ? Math.round(prioRevenue.high / prioCounts.high) : 0;
        const avgMedVal = prioCounts.medium > 0 ? Math.round(prioRevenue.medium / prioCounts.medium) : 0;
        const avgLow = prioCounts.low > 0 ? Math.round(prioRevenue.low / prioCounts.low) : 0;
        if (prioAvgHigh) prioAvgHigh.textContent = `Avg ${fmtZAR(avgHigh)}`;
        if (prioAvgMed) prioAvgMed.textContent = `Avg ${fmtZAR(avgMedVal)}`;
        if (prioAvgLow) prioAvgLow.textContent = `Avg ${fmtZAR(avgLow)}`;

        // SVG Donut Ring Segments (circumference = 100)
        if (ringPrioHigh) ringPrioHigh.setAttribute('stroke-dasharray', `${pctHigh}, 100`);
        if (ringPrioMed) {
            ringPrioMed.setAttribute('stroke-dasharray', `${pctMed}, 100`);
            ringPrioMed.setAttribute('stroke-dashoffset', `-${pctHigh}`);
        }
        if (ringPrioLow) {
            ringPrioLow.setAttribute('stroke-dasharray', `${pctLow}, 100`);
            ringPrioLow.setAttribute('stroke-dashoffset', `-${pctHigh + pctMed}`);
        }

        // Render Action Radar
        renderActionRadar(loadedProposals);

        // Render Industry ROI Matrix Table with Click-to-Filter
        const matrixBody = document.getElementById('industryMatrixTableBody');
        if (matrixBody) {
            const sortedIndustries = Object.entries(industryData).sort((a, b) => b[1].won - a[1].won);
            matrixBody.innerHTML = sortedIndustries.map(([ind, data]) => {
                const indWinRate = data.count > 0 ? Math.round((data.wonCount / data.count) * 100) : 0;
                return `
                    <tr data-industry="${ind}" class="industry-matrix-row cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-900 transition-colors group" title="Click to view clients in ${ind}">
                        <td class="py-2.5 font-semibold text-black dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                            <span>${ind}</span>
                            <svg class="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </td>
                        <td class="py-2.5 text-center text-zinc-500 font-medium">${data.count} <span class="text-[10px] text-zinc-400">(${indWinRate}%)</span></td>
                        <td class="py-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">${fmtZAR(data.won)}</td>
                    </tr>
                `;
            }).join('');

            matrixBody.onclick = (e) => {
                const row = e.target.closest('.industry-matrix-row');
                if (row) {
                    const ind = row.getAttribute('data-industry');
                    if (ind) {
                        switchTab('clients');
                        if (clientSearchInput) {
                            clientSearchInput.value = ind;
                            renderClientDirectory();
                        }
                    }
                }
            };
        }

        // Render Conversion Funnel Progress Bars
        const setFunnelRow = (countId, barId, count, total) => {
            const countEl = document.getElementById(countId);
            const barEl = document.getElementById(barId);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            if (countEl) countEl.textContent = `${count} deals (${pct}%)`;
            if (barEl) barEl.style.width = `${pct}%`;
        };

        setFunnelRow('funnelGeneratedCount', 'funnelGeneratedBar', totalDeals, totalDeals);
        setFunnelRow('funnelViewedCount', 'funnelViewedBar', countViewed, totalDeals);
        setFunnelRow('funnelSignedCount', 'funnelSignedBar', countSigned, totalDeals);
        setFunnelRow('funnelDeclinedCount', 'funnelDeclinedBar', countDeclined, totalDeals);

        const openRate = totalDeals > 0 ? Math.round((countViewed / totalDeals) * 100) : 0;
        const pitchAdviceText = document.getElementById('pitchAdviceText');
        if (pitchAdviceText) {
            if (openRate < 40) {
                pitchAdviceText.textContent = `Current proposal open rate is low (${openRate}%). Use the Urgent Action Radar's 1-click WhatsApp follow-up script to ensure prospects view their proposal link immediately.`;
            } else if (winRate >= 50) {
                pitchAdviceText.textContent = `Excellent closing velocity! Win rate is strong at ${winRate}%. Focus on generating new client intake proposals in high-value sectors.`;
            } else {
                pitchAdviceText.textContent = `High view rate (${openRate}%) with ${winRate}% closed rate. Review ROI proposal terms or offer quick closing discounts to drive signature velocity.`;
            }
        }
    }

    // Client Directory Search & Filtering
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientStatusFilter = document.getElementById('clientStatusFilter');
    const clientPriorityFilter = document.getElementById('clientPriorityFilter');
    const clientsDirectoryTableBody = document.getElementById('clientsDirectoryTableBody');

    function renderClientDirectory() {
        if (!clientsDirectoryTableBody) return;

        const query = (clientSearchInput?.value || '').toLowerCase().trim();
        const selectedStatus = clientStatusFilter?.value || 'All';
        const selectedPriority = clientPriorityFilter?.value || 'All';

        const filtered = loadedProposals.filter(item => {
            const matchesQuery = (item.client_name || '').toLowerCase().includes(query) ||
                                 (item.company_name || '').toLowerCase().includes(query) ||
                                 (item.industry || '').toLowerCase().includes(query);
            const matchesStatus = selectedStatus === 'All' || item.client_status === selectedStatus;
            const matchesPriority = selectedPriority === 'All' || (item.priority || 'Medium').toLowerCase() === selectedPriority.toLowerCase();
            return matchesQuery && matchesStatus && matchesPriority;
        });

        if (filtered.length === 0) {
            clientsDirectoryTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                        No client records match your search query.
                    </td>
                </tr>`;
            return;
        }

        clientsDirectoryTableBody.innerHTML = filtered.map(item => {
            const dealValue = (item.client_status === 'Proposal signed' && item.final_price) ? item.final_price : (item.budget || item.final_price);
            const budgetFormatted = dealValue ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(dealValue) : 'Not Specified';
            
            let statusBadge = `<span class="px-2.5 py-1 text-xs rounded-full font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">${item.client_status}</span>`;
            if (item.client_status === 'Proposal viewed') statusBadge = `<span class="px-2.5 py-1 text-xs rounded-full font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Proposal viewed</span>`;
            if (item.client_status === 'Proposal signed') statusBadge = `<span class="px-2.5 py-1 text-xs rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Proposal signed</span>`;
            if (item.client_status === 'Proposal declined') statusBadge = `<span class="px-2.5 py-1 text-xs rounded-full font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">Proposal declined</span>`;

            const priorityBadge = getPriorityBadgeHTML(item.priority);

            return `
                <tr class="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td class="px-6 py-4">
                        <p class="font-bold text-black dark:text-white">${item.client_name || item.company_name}</p>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">${item.company_name}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-semibold text-black dark:text-white">${item.industry}</p>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">${budgetFormatted}</p>
                    </td>
                    <td class="px-6 py-4 text-xs font-medium">
                        ${priorityBadge}
                    </td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right flex justify-end items-center gap-2">
                        <button onclick="openAuditStagingEditor('${item.proposal_hash}')" class="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Edit Audit
                        </button>
                        <button onclick="inspectClientDetails(${item.client_id})" class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Inspect
                        </button>
                        <button onclick="copyProposalUrl('${item.proposal_hash}')" class="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            Copy Link
                        </button>
                        <button onclick="deleteClientRow(${item.client_id})" class="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg text-xs font-bold transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Delete
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }

    if (clientSearchInput) clientSearchInput.addEventListener('input', renderClientDirectory);
    if (clientStatusFilter) clientStatusFilter.addEventListener('change', renderClientDirectory);
    if (clientPriorityFilter) clientPriorityFilter.addEventListener('change', renderClientDirectory);

    function renderDrawerSocialBadges(websiteUrl, socialUrlsStr) {
        const container = document.getElementById('drawerSocialBadges');
        if (!container) return;

        const links = [];
        if (websiteUrl) links.push(websiteUrl.trim());
        if (socialUrlsStr) {
            const split = socialUrlsStr.replace(/\n/g, ',').split(',');
            split.forEach(s => {
                if (s.trim()) links.push(s.trim());
            });
        }

        if (links.length === 0) {
            container.innerHTML = `<span class="text-xs text-zinc-400 font-medium italic">No social links recorded</span>`;
            return;
        }

        container.innerHTML = links.map(url => {
            const fullUrl = ensureHttpProtocol(url);
            const lower = fullUrl.toLowerCase();

            let badgeLabel = "Website";
            let iconSvg = `<svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0-3-4.03-3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>`;
            let badgeStyle = "text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900";

            if (lower.includes("instagram.com")) {
                badgeLabel = "Instagram";
                iconSvg = `<svg class="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
                badgeStyle = "text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-950/40";
            } else if (lower.includes("facebook.com")) {
                badgeLabel = "Facebook";
                iconSvg = `<svg class="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
                badgeStyle = "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40";
            } else if (lower.includes("linkedin.com")) {
                badgeLabel = "LinkedIn";
                iconSvg = `<svg class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
                badgeStyle = "text-blue-500 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40";
            } else if (lower.includes("tiktok.com")) {
                badgeLabel = "TikTok";
                iconSvg = `<svg class="w-3.5 h-3.5 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.34a6.33 6.33 0 0 0-1-.08 6.26 6.26 0 0 0-6.25 6.25A6.26 6.26 0 0 0 9.34 21.8c3.3 0 6.06-2.54 6.24-5.81V9.28a8.28 8.28 0 0 0 4.01 1.03V6.86a4.78 4.78 0 0 1-.01-.17z"/></svg>`;
                badgeStyle = "text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900";
            } else if (lower.includes("youtube.com")) {
                badgeLabel = "YouTube";
                iconSvg = `<svg class="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
                badgeStyle = "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40";
            } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
                badgeLabel = "Twitter/X";
                iconSvg = `<svg class="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
                badgeStyle = "text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900";
            }

            return `
                <a href="${fullUrl}" target="_blank" rel="noopener noreferrer"
                   class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeStyle} hover:scale-[1.03] transition-transform">
                    ${iconSvg}
                    <span>${badgeLabel}</span>
                    <svg class="w-3 h-3 opacity-60 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
            `;
        }).join('');
    }

    // Slide-over Drawer inspection and global helper functions
    window.inspectClientDetails = function(clientId) {
        const client = loadedProposals.find(c => c.client_id === clientId);
        if (!client) return;

        document.getElementById('drawerClientName').textContent = client.client_name || client.company_name;
        document.getElementById('drawerCompanyName').textContent = `${client.company_name} • ${client.industry}`;
        renderDrawerSocialBadges(client.website_url, client.social_media_urls);
        
        const statusSelect = document.getElementById('drawerStatusSelect');
        if (statusSelect) {
            statusSelect.value = client.client_status;
            statusSelect.onchange = function() {
                handleStatusChange(clientId, statusSelect.value, statusSelect);
            };
        }

        const prioritySelect = document.getElementById('drawerPrioritySelect');
        if (prioritySelect) {
            prioritySelect.value = client.priority || 'Medium';
            prioritySelect.onchange = function() {
                handlePriorityChange(clientId, prioritySelect.value);
            };
        }

        const linkContainer = document.getElementById('drawerProposalLinkContainer');
        linkContainer.innerHTML = client.proposal_hash ? `
            <a href="proposals.html?id=${client.proposal_hash}" target="_blank" class="block w-full text-center bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">Open Active Proposal</a>
            <button onclick="openAuditStagingEditor('${client.proposal_hash}')" class="w-full text-center bg-blue-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-colors mt-2 flex items-center justify-center gap-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Edit Audit (Staging Mode)
            </button>
        ` : `<p class="text-xs text-zinc-400">No proposal link generated.</p>`;

        if (client.audit_raw_json) {
            try {
                const audit = JSON.parse(client.audit_raw_json);
                document.getElementById('drawerSentiment').textContent = audit.online_sentiment_review || 'No sentiment data available.';
                
                const gaps = audit.visibility_gaps;
                document.getElementById('drawerGaps').textContent = Array.isArray(gaps) ? gaps.join(' • ') : (gaps || 'No visibility gaps recorded.');
            } catch(e) {
                document.getElementById('drawerSentiment').textContent = 'Audit parsing error.';
            }
        }

        const sigContainer = document.getElementById('drawerSignatureContainer');
        const sigImg = document.getElementById('drawerSignatureImg');
        if (sigContainer && sigImg) {
            if (client.signature_data) {
                const img = new Image();
                img.onload = function() {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || 300;
                        canvas.height = img.naturalHeight || 150;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imgData.data;
                        
                        let totalR = 0, totalG = 0, totalB = 0, count = 0;
                        for (let i = 0; i < data.length; i += 4) {
                            const alpha = data[i + 3];
                            if (alpha > 30) {
                                totalR += data[i];
                                totalG += data[i + 1];
                                totalB += data[i + 2];
                                count++;
                            }
                        }
                        
                        const avgBrightness = count > 0 ? (totalR + totalG + totalB) / (3 * count) : 0;
                        const wrapper = sigImg.parentElement;
                        if (avgBrightness > 128) {
                            if (wrapper) wrapper.className = "rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 p-3 flex justify-center items-center";
                        } else {
                            if (wrapper) wrapper.className = "rounded-lg overflow-hidden border border-zinc-300 bg-zinc-100 p-3 flex justify-center items-center";
                        }
                    } catch(e) {
                        const wrapper = sigImg.parentElement;
                        if (wrapper) wrapper.className = "rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-950 p-3 flex justify-center items-center";
                    }
                    sigImg.src = client.signature_data;
                    sigContainer.classList.remove('hidden');
                };
                img.onerror = function() {
                    sigImg.src = client.signature_data;
                    sigContainer.classList.remove('hidden');
                };
                img.src = client.signature_data;
            } else {
                sigContainer.classList.add('hidden');
            }
        }

        document.getElementById('clientDetailDrawer').classList.remove('hidden');
    };

    const closeClientDrawerBtn = document.getElementById('closeClientDrawer');
    if (closeClientDrawerBtn) {
        closeClientDrawerBtn.addEventListener('click', () => {
            document.getElementById('clientDetailDrawer').classList.add('hidden');
        });
    }

    window.copyProposalUrl = function(hash) {
        if (!hash) return alert("No valid proposal hash.");
        const fullUrl = `${window.location.origin}/frontend/proposals.html?id=${hash}`;
        navigator.clipboard.writeText(fullUrl).then(() => {
            alert(`Proposal link copied to clipboard:\n${fullUrl}`);
        }).catch(() => {
            prompt("Copy this proposal link:", fullUrl);
        });
    };

    window.deleteClientRow = function(clientId) {
        handleDelete(clientId, null);
    };

    // Remove client row immediately from DOM & local cache, then delete in backend
    function handleDelete(clientId, rowElement) {
        if (confirm("Are you sure you want to delete this client and all associated proposal data?")) {
            const index = loadedProposals.findIndex(r => r.client_id === clientId);
            if (index === -1) return;

            if (rowElement) {
                rowElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                rowElement.style.opacity = '0';
                rowElement.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    rowElement.remove();
                }, 200);
            }

            loadedProposals.splice(index, 1);
            updateMetricsFromCache();

            fetch(`${API_BASE}/api/admin/clients/${clientId}`, {
                method: 'DELETE'
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to delete client.");
                    return res.json();
                })
                .catch(err => {
                    alert(err.message);
                    loadDashboardData();
                });
        }
    }

    // Update status in local memory instantly and trigger backend update
    function handleStatusChange(clientId, newStatus, selectElement) {
        const rec = loadedProposals.find(r => r.client_id === clientId);
        if (!rec) return;
        const oldStatus = rec.client_status;

        rec.client_status = newStatus;
        updateMetricsFromCache();

        const badgeColors = {
            'Proposal generated': 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
            'Proposal sent': 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20',
            'Proposal viewed': 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
            'Proposal signed': 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
            'Proposal declined': 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20'
        };

        Object.values(badgeColors).forEach(cls => {
            cls.split(' ').forEach(c => selectElement.classList.remove(c));
        });
        badgeColors[newStatus].split(' ').forEach(c => selectElement.classList.add(c));

        fetch(`${API_BASE}/api/admin/clients/${clientId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to update client status.");
                return res.json();
            })
            .catch(err => {
                alert(err.message);
                rec.client_status = oldStatus;
                updateMetricsFromCache();

                Object.values(badgeColors).forEach(cls => {
                    cls.split(' ').forEach(c => selectElement.classList.remove(c));
                });
                badgeColors[oldStatus].split(' ').forEach(c => selectElement.classList.add(c));
                selectElement.value = oldStatus;
            });
    }


    function getDealValue(rec) {
        if (rec.client_status === 'Proposal signed' && rec.final_price) {
            return Number(rec.final_price);
        }
        return Number(rec.budget || rec.final_price || 0);
    }

    function getStatusRank(status) {
        const s = (status || '').toLowerCase();
        if (s.includes('generated')) return 1;
        if (s.includes('sent')) return 2;
        if (s.includes('viewed')) return 3;
        if (s.includes('signed')) return 4;
        if (s.includes('declined')) return 5;
        return 0;
    }

    function populateIndustryFilterOptions(records) {
        const select = document.getElementById('industryFilterSelect');
        if (!select) return;
        const currentVal = currentIndustryFilter || 'All';
        const industries = Array.from(new Set(records.map(r => r.industry).filter(Boolean))).sort((a, b) => a.localeCompare(b));
        
        let html = `<option value="All">All Industries</option>`;
        industries.forEach(ind => {
            const selected = currentVal === ind ? 'selected' : '';
            html += `<option value="${ind.replace(/"/g, '&quot;')}" ${selected}>${ind}</option>`;
        });
        select.innerHTML = html;
        select.value = currentVal;
    }

    function updateSortHeaderIcons() {
        const headerMap = {
            'company': document.getElementById('thCompany'),
            'industry': document.getElementById('thIndustry'),
            'value': document.getElementById('thValue'),
            'priority': document.getElementById('thPriority'),
            'status': document.getElementById('thStatus')
        };

        const defaultSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />`;
        const ascSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />`;
        const descSvg = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />`;

        Object.entries(headerMap).forEach(([field, el]) => {
            if (!el) return;
            const svgEl = el.querySelector('svg');
            if (!svgEl) return;

            if (currentSortField === field) {
                el.classList.add('text-black', 'dark:text-white');
                svgEl.classList.remove('text-zinc-400');
                svgEl.classList.add('text-blue-500', 'dark:text-blue-400');
                if (currentSortDirection === 'asc') {
                    svgEl.innerHTML = ascSvg;
                } else if (currentSortDirection === 'desc') {
                    svgEl.innerHTML = descSvg;
                } else {
                    svgEl.innerHTML = defaultSvg;
                }
            } else {
                el.classList.remove('text-black', 'dark:text-white');
                svgEl.classList.remove('text-blue-500', 'dark:text-blue-400');
                svgEl.classList.add('text-zinc-400');
                svgEl.innerHTML = defaultSvg;
            }
        });
    }

    function renderTableRows(records) {
        // Hydrate priority from records or local override, defaulting to Medium
        const priorityOverrides = getSavedPriorityOverrides();
        loadedProposals = records.map(r => ({
            ...r,
            priority: priorityOverrides[r.client_id] || r.priority || 'Medium'
        }));

        if (window.updateComboboxDbIndustries) {
            window.updateComboboxDbIndustries(loadedProposals);
        }

        populateIndustryFilterOptions(loadedProposals);
        proposalsTableBody.innerHTML = '';

        // Apply Filters (Industry, Value, Priority, Status)
        let displayRecords = [...loadedProposals];

        if (currentIndustryFilter && currentIndustryFilter !== 'All') {
            displayRecords = displayRecords.filter(r => (r.industry || '').toLowerCase() === currentIndustryFilter.toLowerCase());
        }

        if (currentValueFilter && currentValueFilter !== 'All') {
            displayRecords = displayRecords.filter(r => {
                const val = getDealValue(r);
                if (currentValueFilter === 'under5k') return val < 5000;
                if (currentValueFilter === '5k-15k') return val >= 5000 && val <= 15000;
                if (currentValueFilter === 'over15k') return val > 15000;
                return true;
            });
        }

        if (currentPriorityFilter && currentPriorityFilter !== 'All') {
            displayRecords = displayRecords.filter(r => (r.priority || 'Medium').toLowerCase() === currentPriorityFilter.toLowerCase());
        }

        if (currentStatusFilter && currentStatusFilter !== 'All') {
            displayRecords = displayRecords.filter(r => (r.client_status || '').toLowerCase() === currentStatusFilter.toLowerCase());
        }

        // Apply Header Sorting if active
        if (currentSortField) {
            displayRecords.sort((a, b) => {
                let res = 0;
                if (currentSortField === 'company') {
                    const nameA = (a.company_name || a.client_name || '').toLowerCase();
                    const nameB = (b.company_name || b.client_name || '').toLowerCase();
                    res = nameA.localeCompare(nameB);
                } else if (currentSortField === 'industry') {
                    const indA = (a.industry || '').toLowerCase();
                    const indB = (b.industry || '').toLowerCase();
                    res = indA.localeCompare(indB);
                } else if (currentSortField === 'value') {
                    res = getDealValue(a) - getDealValue(b);
                } else if (currentSortField === 'priority') {
                    res = getPriorityRank(a.priority) - getPriorityRank(b.priority);
                } else if (currentSortField === 'status') {
                    res = getStatusRank(a.client_status) - getStatusRank(b.client_status);
                }
                return currentSortDirection === 'desc' ? -res : res;
            });
        }

        updateSortHeaderIcons();

        if (!displayRecords || displayRecords.length === 0) {
            proposalsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                        No proposals found matching criteria. Click <span class="font-bold text-black dark:text-white">+ Generate Interactive Proposal</span> to create one.
                    </td>
                </tr>
            `;
            updateMetricsFromCache();
            return;
        }

        displayRecords.forEach(rec => {
            const row = document.createElement('tr');
            row.className = "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-colors";

            const badgeColors = {
                'Proposal generated': 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
                'Proposal sent': 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20',
                'Proposal viewed': 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
                'Proposal signed': 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
                'Proposal declined': 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20'
            };

            const priorityBadgeColors = {
                'High': 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold uppercase text-[10px]',
                'Medium': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase text-[10px]',
                'Low': 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px]'
            };

            const currentPriority = rec.priority || 'Medium';
            const priorityClass = priorityBadgeColors[currentPriority] || priorityBadgeColors['Medium'];

            const statusClass = badgeColors[rec.client_status] || 'bg-zinc-100 text-zinc-500';
            const dealValue = (rec.client_status === 'Proposal signed' && rec.final_price) ? rec.final_price : (rec.budget || rec.final_price);
            const formattedValue = dealValue ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(dealValue) : "Not Specified";

            row.innerHTML = `
                <td class="px-6 py-4 text-black dark:text-white font-bold">${rec.company_name}</td>
                <td class="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">${rec.industry}</td>
                <td class="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-semibold">${formattedValue}</td>
                <td class="px-6 py-4">
                    <select data-client-id="${rec.client_id}" class="priority-select px-2.5 py-1 rounded-full text-xs font-semibold ${priorityClass} cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-black">
                        <option class="text-red-600 dark:text-red-400 dark:bg-zinc-950 font-semibold" value="High" ${currentPriority === 'High' ? 'selected' : ''}>High</option>
                        <option class="text-blue-600 dark:text-blue-400 dark:bg-zinc-950 font-semibold" value="Medium" ${currentPriority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option class="text-zinc-500 dark:text-zinc-400 dark:bg-zinc-950 font-semibold" value="Low" ${currentPriority === 'Low' ? 'selected' : ''}>Low</option>
                    </select>
                </td>
                <td class="px-6 py-4">
                    <select data-client-id="${rec.client_id}" class="status-select px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass} cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:bg-black">
                        <option class="text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-semibold" value="Proposal generated" ${rec.client_status === 'Proposal generated' ? 'selected' : ''}>Proposal generated</option>
                        <option class="text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-semibold" value="Proposal sent" ${rec.client_status === 'Proposal sent' ? 'selected' : ''}>Proposal sent</option>
                        <option class="text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-semibold" value="Proposal viewed" ${rec.client_status === 'Proposal viewed' ? 'selected' : ''}>Proposal viewed</option>
                        <option class="text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-semibold" value="Proposal signed" ${rec.client_status === 'Proposal signed' ? 'selected' : ''}>Proposal signed</option>
                        <option class="text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-semibold" value="Proposal declined" ${rec.client_status === 'Proposal declined' ? 'selected' : ''}>Proposal declined</option>
                    </select>
                </td>
                <td class="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">
                    <div class="flex items-center gap-2">
                        ${rec.proposal_hash ? `<a href="proposals.html?id=${rec.proposal_hash}" target="_blank" class="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 dark:border-white/10 hover:border-white/20 transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            View Link
                        </a>` : '--'}
                        ${rec.proposal_hash ? `<button data-hash="${rec.proposal_hash}" class="btn-edit-audit px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Edit Audit
                        </button>` : ''}
                        ${rec.audit_raw_json ? `<button data-client-id="${rec.client_id}" class="btn-view-audit px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 dark:border-white/10 hover:border-white/20 transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            View Audit
                        </button>` : ''}
                        <button data-client-id="${rec.client_id}" class="btn-delete px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-all duration-150 active:scale-[0.97] backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            Delete
                        </button>
                    </div>
                </td>
            `;
            proposalsTableBody.appendChild(row);
        });

        updateMetricsFromCache();
    }

    // Fetch proposal list from backend API (or fall back to demo records if offline)
    function loadDashboardData() {
        if (!proposalsTableBody) return;

        fetch(`${API_BASE}/api/admin/proposals`)
            .then(res => {
                if (!res.ok) throw new Error("Could not load database records.");
                return res.json();
            })
            .then(records => {
                renderTableRows(records);
            })
            .catch(err => {
                console.warn("Backend loading failure or offline; rendering fallback interactive demo rows:", err);
                const demoRecords = [
                    {
                        client_id: 991,
                        client_name: "TechFlow Dynamics",
                        company_name: "TechFlow Dynamics",
                        industry: "Software Development",
                        budget: 12500,
                        client_status: "Proposal signed",
                        proposal_hash: "demo",
                        audit_raw_json: JSON.stringify({
                            online_sentiment_review: "Healthy digital footprint with minor technical SEO bottlenecks.",
                            visibility_gaps: [
                                "Missing local Schema.org entity metadata",
                                "Mobile page speed latency causing lead bounce rate",
                                "Low citation density in Generative Search Engines (GEO)"
                            ],
                            competitor_analysis: [
                                { name: "Alpha Software", platform_leveraged: "SEO Engine", revenue_advantage: "Ranks #1 for enterprise software search keywords." },
                                { name: "Beta Devs", platform_leveraged: "Active Funnels", revenue_advantage: "High conversion rate on automated intake pages." },
                                { name: "Gamma Tech", platform_leveraged: "Social Automation", revenue_advantage: "Drives customer retention with social outreach." }
                            ]
                        })
                    },
                    {
                        client_id: 992,
                        client_name: "Aura Coffee Roasters",
                        company_name: "Aura Coffee Roasters",
                        industry: "E-Commerce",
                        budget: 4200,
                        client_status: "Proposal viewed",
                        proposal_hash: "demo",
                        audit_raw_json: JSON.stringify({
                            online_sentiment_review: "Strong brand presence, but missing structured JSON-LD ecommerce markup.",
                            visibility_gaps: [
                                "Lack of product Schema entity profiles",
                                "Unoptimized image compression reducing Core Web Vitals"
                            ],
                            competitor_analysis: [
                                { name: "Bean Roasters", platform_leveraged: "E-Com SEO", revenue_advantage: "Top search ranking for organic coffee beans." }
                            ]
                        })
                    },
                    {
                        client_id: 993,
                        client_name: "Nexus Logistics",
                        company_name: "Nexus Logistics",
                        industry: "Supply Chain",
                        budget: 28000,
                        client_status: "Proposal generated",
                        proposal_hash: "demo",
                        audit_raw_json: JSON.stringify({
                            online_sentiment_review: "Established local enterprise footprint, low digital visibility index.",
                            visibility_gaps: [
                                "Zero citation footprint in AI Search Engines",
                                "Outdated web portal interface"
                            ],
                            competitor_analysis: [
                                { name: "LogiTrans", platform_leveraged: "Fleet Funnels", revenue_advantage: "Captures B2B freight requests instantly online." }
                            ]
                        })
                    }
                ];
                renderTableRows(demoRecords);
            });
    }

    // Set up table click and dropdown change listeners using event delegation
    if (proposalsTableBody) {
        proposalsTableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('status-select')) {
                const clientId = parseInt(e.target.getAttribute('data-client-id'));
                const newStatus = e.target.value;
                handleStatusChange(clientId, newStatus, e.target);
            } else if (e.target.classList.contains('priority-select')) {
                const clientId = parseInt(e.target.getAttribute('data-client-id'));
                const newPriority = e.target.value;
                handlePriorityChange(clientId, newPriority);
            }
        });

        proposalsTableBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) {
                const clientId = parseInt(e.target.getAttribute('data-client-id'));
                const row = e.target.closest('tr');
                handleDelete(clientId, row);
            } else if (e.target.classList.contains('btn-view-audit')) {
                const clientId = parseInt(e.target.getAttribute('data-client-id'));
                handleViewAudit(clientId);
            } else if (e.target.classList.contains('btn-edit-audit')) {
                const hash = e.target.getAttribute('data-hash');
                openAuditStagingEditor(hash);
            }
        });
    }

    // Set up Home Dashboard Filters (Industry, Value, Priority, Status)
    const industryFilterSelect = document.getElementById('industryFilterSelect');
    if (industryFilterSelect) {
        industryFilterSelect.addEventListener('change', (e) => {
            currentIndustryFilter = e.target.value;
            renderTableRows(loadedProposals);
        });
    }

    const valueFilterSelect = document.getElementById('valueFilterSelect');
    if (valueFilterSelect) {
        valueFilterSelect.addEventListener('change', (e) => {
            currentValueFilter = e.target.value;
            renderTableRows(loadedProposals);
        });
    }

    const priorityFilterSelect = document.getElementById('priorityFilterSelect');
    if (priorityFilterSelect) {
        priorityFilterSelect.addEventListener('change', (e) => {
            currentPriorityFilter = e.target.value;
            renderTableRows(loadedProposals);
        });
    }

    const statusFilterSelect = document.getElementById('statusFilterSelect');
    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', (e) => {
            currentStatusFilter = e.target.value;
            renderTableRows(loadedProposals);
        });
    }

    // Set up Home Dashboard Header Column Sort Click Handlers
    function bindSortHeader(elementId, sortField) {
        const el = document.getElementById(elementId);
        if (el) {
            el.addEventListener('click', () => {
                if (currentSortField === sortField) {
                    if (currentSortDirection === 'asc') {
                        currentSortDirection = 'desc';
                    } else if (currentSortDirection === 'desc') {
                        currentSortField = null;
                        currentSortDirection = null;
                    } else {
                        currentSortDirection = 'asc';
                    }
                } else {
                    currentSortField = sortField;
                    currentSortDirection = 'asc';
                }
                renderTableRows(loadedProposals);
            });
        }
    }

    bindSortHeader('thCompany', 'company');
    bindSortHeader('thIndustry', 'industry');
    bindSortHeader('thValue', 'value');
    bindSortHeader('thPriority', 'priority');
    bindSortHeader('thStatus', 'status');

    // ==========================================
    // STAGING AUDIT EDITOR & AI COPILOT LOGIC
    // ==========================================
    let currentStagingHash = null;
    let currentStagingRecord = null;
    let currentStagingAudit = null;

    const auditStagingModal = document.getElementById('auditStagingEditorModal');
    const closeStagingHeaderBtn = document.getElementById('closeStagingEditorHeaderBtn');
    const closeStagingFooterBtn = document.getElementById('closeStagingEditorBtn');
    const saveStagingBtn = document.getElementById('saveStagingAuditBtn');
    const rerunCompetitorsBtn = document.getElementById('rerunCompetitorsBtn');
    const addGapBtn = document.getElementById('addGapBtn');
    const copilotForm = document.getElementById('copilotForm');
    const copilotPromptInput = document.getElementById('copilotPromptInput');
    const copilotChatFeed = document.getElementById('copilotChatFeed');
    const stagingStatusMessage = document.getElementById('stagingStatusMessage');

    function toggleStagingModal(show) {
        if (auditStagingModal) {
            auditStagingModal.classList.toggle('hidden', !show);
            if (!show) {
                currentStagingHash = null;
                currentStagingRecord = null;
                currentStagingAudit = null;
                if (stagingStatusMessage) stagingStatusMessage.textContent = "";
            }
        }
    }

    if (closeStagingHeaderBtn) closeStagingHeaderBtn.addEventListener('click', () => toggleStagingModal(false));
    if (closeStagingFooterBtn) closeStagingFooterBtn.addEventListener('click', () => toggleStagingModal(false));
    window.addEventListener('click', (e) => {
        if (e.target === auditStagingModal) toggleStagingModal(false);
    });

    window.openAuditStagingEditor = function(proposalHash) {
        if (!proposalHash) {
            alert("No proposal record found for this client.");
            return;
        }

        const rec = loadedProposals.find(p => p.proposal_hash === proposalHash);
        if (!rec) {
            alert("Unable to locate client proposal record.");
            return;
        }

        currentStagingHash = proposalHash;
        currentStagingRecord = rec;

        try {
            currentStagingAudit = typeof rec.audit_raw_json === 'string' ? JSON.parse(rec.audit_raw_json) : rec.audit_raw_json;
        } catch (e) {
            currentStagingAudit = {
                overall_score: 32,
                scores: [32, 20, 38, 25],
                online_sentiment_review: "",
                competitor_analysis: [],
                visibility_gaps: [],
                competitor_benchmarks: "",
                rep_notes: "",
                chat_history: []
            };
        }

        // Set Client subtitle
        const nameSpan = document.getElementById('stagingClientNameSpan');
        if (nameSpan) nameSpan.textContent = `${rec.client_name || rec.company_name} (${rec.company_name})`;

        // Populate Scores
        const overallScoreEl = document.getElementById('stagingOverallScore');
        if (overallScoreEl) overallScoreEl.value = currentStagingAudit.overall_score || 32;

        const scoresArr = currentStagingAudit.scores || [32, 20, 38, 25];
        const sSeo = document.getElementById('stagingScoreSEO');
        const sGeo = document.getElementById('stagingScoreGEO');
        const sCwv = document.getElementById('stagingScoreCWV');
        const sSchema = document.getElementById('stagingScoreSchema');

        if (sSeo) sSeo.value = scoresArr[0] !== undefined ? scoresArr[0] : 32;
        if (sGeo) sGeo.value = scoresArr[1] !== undefined ? scoresArr[1] : 20;
        if (sCwv) sCwv.value = scoresArr[2] !== undefined ? scoresArr[2] : 38;
        if (sSchema) sSchema.value = scoresArr[3] !== undefined ? scoresArr[3] : 25;

        // Populate Sentiment Review
        const sentimentEl = document.getElementById('stagingSentimentInput');
        if (sentimentEl) sentimentEl.value = currentStagingAudit.online_sentiment_review || "";

        // Populate Competitor Inputs
        const compList = currentStagingAudit.competitors_list || (currentStagingAudit.competitor_analysis || []).map(c => c.name);
        const c1 = document.getElementById('stagingComp1');
        const c2 = document.getElementById('stagingComp2');
        const c3 = document.getElementById('stagingComp3');

        if (c1) c1.value = compList[0] || "";
        if (c2) c2.value = compList[1] || "";
        if (c3) c3.value = compList[2] || "";

        // Populate Competitor Benchmark Summary
        const benchEl = document.getElementById('stagingBenchmarkInput');
        if (benchEl) benchEl.value = currentStagingAudit.competitor_benchmarks || "";

        // Populate Visibility Gaps
        renderStagingGapsList(currentStagingAudit.visibility_gaps || []);

        // Populate Sales Rep Internal Notes
        const notesEl = document.getElementById('stagingRepNotesInput');
        if (notesEl) notesEl.value = currentStagingAudit.rep_notes || "";

        // Render AI Copilot Chat Feed
        renderCopilotChatFeed(currentStagingAudit.chat_history || []);

        // Reset Sub-Tab to Overview & Scores on open
        switchStagingTab('scores');

        toggleStagingModal(true);
    };

    function switchStagingTab(tabName) {
        const subtabBtns = document.querySelectorAll('.stagingSubtabBtn');
        const subtabViews = document.querySelectorAll('.stagingSubtabView');

        subtabBtns.forEach(btn => {
            const isTarget = btn.getAttribute('data-tab') === tabName;
            if (isTarget) {
                btn.className = "stagingSubtabBtn px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all bg-black dark:bg-white text-white dark:text-black shadow-sm flex items-center gap-1.5";
            } else {
                btn.className = "stagingSubtabBtn px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all flex items-center gap-1.5";
            }
        });

        subtabViews.forEach(view => {
            if (tabName === 'viewAll') {
                view.classList.remove('hidden');
            } else {
                const targetViewId = `stagingView${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
                if (view.id === targetViewId) {
                    view.classList.remove('hidden');
                } else {
                    view.classList.add('hidden');
                }
            }
        });
    }

    function initStagingSubtabs() {
        const subtabBtns = document.querySelectorAll('.stagingSubtabBtn');
        subtabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                switchStagingTab(targetTab);
            });
        });
    }

    initStagingSubtabs();

    function renderStagingGapsList(gaps) {
        const container = document.getElementById('stagingGapsContainer');
        if (!container) return;
        container.innerHTML = "";

        if (!gaps || gaps.length === 0) {
            gaps = ["Lack of local Schema.org entity metadata", "Mobile Core Web Vitals latency causing high bounce rate"];
        }

        gaps.forEach((gapText, idx) => {
            const row = document.createElement('div');
            row.className = "flex items-center gap-2";
            row.innerHTML = `
                <input type="text" class="staging-gap-item flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-2.5 text-xs text-black dark:text-white font-medium focus:outline-none focus:border-zinc-400"
                       value="${gapText.replace(/"/g, '&quot;')}" placeholder="Describe visibility gap...">
                <button type="button" class="btn-remove-gap text-zinc-400 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete gap">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            row.querySelector('.btn-remove-gap').addEventListener('click', () => row.remove());
            container.appendChild(row);
        });
    }

    if (addGapBtn) {
        addGapBtn.addEventListener('click', () => {
            const container = document.getElementById('stagingGapsContainer');
            if (!container) return;
            const row = document.createElement('div');
            row.className = "flex items-center gap-2";
            row.innerHTML = `
                <input type="text" class="staging-gap-item flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-lg p-2.5 text-xs text-black dark:text-white font-medium focus:outline-none focus:border-zinc-400"
                       placeholder="Enter new audit visibility gap...">
                <button type="button" class="btn-remove-gap text-zinc-400 hover:text-red-500 p-2 rounded-lg transition-colors" title="Delete gap">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            row.querySelector('.btn-remove-gap').addEventListener('click', () => row.remove());
            container.appendChild(row);
            row.querySelector('input').focus();
        });
    }

    // Save Staged Audit Handler
    if (saveStagingBtn) {
        saveStagingBtn.addEventListener('click', () => {
            if (!currentStagingHash) return;

            const overall_score = parseInt(document.getElementById('stagingOverallScore').value || 32, 10);
            const seo = parseInt(document.getElementById('stagingScoreSEO').value || 32, 10);
            const geo = parseInt(document.getElementById('stagingScoreGEO').value || 20, 10);
            const cwv = parseInt(document.getElementById('stagingScoreCWV').value || 38, 10);
            const schema = parseInt(document.getElementById('stagingScoreSchema').value || 25, 10);
            
            const online_sentiment_review = document.getElementById('stagingSentimentInput').value.trim();
            const competitor_benchmarks = document.getElementById('stagingBenchmarkInput').value.trim();
            const rep_notes = document.getElementById('stagingRepNotesInput').value.trim();

            const c1 = document.getElementById('stagingComp1')?.value.trim();
            const c2 = document.getElementById('stagingComp2')?.value.trim();
            const c3 = document.getElementById('stagingComp3')?.value.trim();
            const competitors_list = [c1, c2, c3].filter(Boolean);

            const gapInputs = Array.from(document.querySelectorAll('.staging-gap-item'));
            const visibility_gaps = gapInputs.map(input => input.value.trim()).filter(Boolean);

            saveStagingBtn.disabled = true;
            saveStagingBtn.textContent = "Saving Staged Audit...";

            fetch(`${API_BASE}/api/admin/proposals/${currentStagingHash}/audit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overall_score,
                    scores: [seo, geo, cwv, schema],
                    online_sentiment_review,
                    visibility_gaps,
                    competitor_benchmarks,
                    rep_notes,
                    competitors_list
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to persist audit edits.");
                    return res.json();
                })
                .then(data => {
                    if (stagingStatusMessage) {
                        stagingStatusMessage.textContent = "✓ Staged audit saved cleanly!";
                        stagingStatusMessage.className = "text-xs font-bold text-emerald-500 animate-pulse";
                    }
                    if (currentStagingRecord) {
                        currentStagingRecord.audit_raw_json = JSON.stringify(data.audit_data);
                    }
                    loadDashboardData();
                    setTimeout(() => toggleStagingModal(false), 1200);
                })
                .catch(err => {
                    alert(`Error saving staged audit: ${err.message}`);
                })
                .finally(() => {
                    saveStagingBtn.disabled = false;
                    saveStagingBtn.textContent = "Save Draft";
                });
        });
    }

    // Transpose Audit & Re-align Scope Handler
    const transposeAuditBtn = document.getElementById('transposeAuditToProposalBtn');
    if (transposeAuditBtn) {
        transposeAuditBtn.addEventListener('click', () => {
            if (!currentStagingHash) return;

            const overall_score = parseInt(document.getElementById('stagingOverallScore')?.value || 32, 10);
            const seo = parseInt(document.getElementById('stagingScoreSEO')?.value || 32, 10);
            const geo = parseInt(document.getElementById('stagingScoreGEO')?.value || 20, 10);
            const cwv = parseInt(document.getElementById('stagingScoreCWV')?.value || 38, 10);
            const schema = parseInt(document.getElementById('stagingScoreSchema')?.value || 25, 10);

            const online_sentiment_review = document.getElementById('stagingSentimentInput')?.value.trim() || "";
            const competitor_benchmarks = document.getElementById('stagingBenchmarkInput')?.value.trim() || "";
            const rep_notes = document.getElementById('stagingRepNotesInput')?.value.trim() || "";

            const c1 = document.getElementById('stagingComp1')?.value.trim();
            const c2 = document.getElementById('stagingComp2')?.value.trim();
            const c3 = document.getElementById('stagingComp3')?.value.trim();
            const competitors_list = [c1, c2, c3].filter(Boolean);

            const gapInputs = Array.from(document.querySelectorAll('.staging-gap-item'));
            const visibility_gaps = gapInputs.map(input => input.value.trim()).filter(Boolean);

            const transposeBtnText = document.getElementById('transposeBtnText');
            const syncBadge = document.getElementById('syncBadge');

            transposeAuditBtn.disabled = true;
            if (transposeBtnText) transposeBtnText.textContent = "Transposing & Re-aligning Scope...";

            fetch(`${API_BASE}/api/admin/proposals/${currentStagingHash}/transpose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overall_score,
                    scores: [seo, geo, cwv, schema],
                    online_sentiment_review,
                    visibility_gaps,
                    competitor_benchmarks,
                    rep_notes,
                    competitors_list,
                    recalculate_services: true
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to transpose audit to live proposal.");
                    return res.json();
                })
                .then(data => {
                    if (stagingStatusMessage) {
                        stagingStatusMessage.textContent = "✓ Audit transposed & proposal scope re-aligned!";
                        stagingStatusMessage.className = "text-xs font-bold text-emerald-500 animate-pulse";
                    }
                    if (syncBadge) {
                        syncBadge.classList.remove('hidden');
                    }
                    if (currentStagingRecord) {
                        currentStagingRecord.audit_raw_json = JSON.stringify(data.audit_data);
                        currentStagingRecord.final_price = data.final_price;
                    }
                    loadDashboardData();
                    appendCopilotMessage("model", `Success! Audit transposed to live proposal. Recommended services re-aligned (New total: R${data.final_price.toLocaleString()}).`);
                })
                .catch(err => {
                    alert(`Transposition error: ${err.message}`);
                })
                .finally(() => {
                    transposeAuditBtn.disabled = false;
                    if (transposeBtnText) transposeBtnText.textContent = "Update & Transpose to Proposal";
                });
        });
    }

    // Rerun Competitors Engine Handler
    if (rerunCompetitorsBtn) {
        rerunCompetitorsBtn.addEventListener('click', () => {
            if (!currentStagingHash) return;

            const c1 = document.getElementById('stagingComp1')?.value.trim();
            const c2 = document.getElementById('stagingComp2')?.value.trim();
            const c3 = document.getElementById('stagingComp3')?.value.trim();
            const competitors = [c1, c2, c3].filter(Boolean);

            if (competitors.length === 0) {
                alert("Please enter at least 1 competitor name to rerun the AI audit.");
                return;
            }

            const btnText = document.getElementById('rerunBtnText');
            rerunCompetitorsBtn.disabled = true;
            if (btnText) btnText.textContent = "Re-analyzing Competitors...";

            fetch(`${API_BASE}/api/admin/proposals/${currentStagingHash}/rerun-competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ competitors })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Competitor AI rerun operational failure.");
                    return res.json();
                })
                .then(data => {
                    if (currentStagingAudit) {
                        currentStagingAudit.competitor_analysis = data.competitor_analysis;
                        currentStagingAudit.competitor_benchmarks = data.competitor_benchmarks;
                        currentStagingAudit.competitors_list = data.competitors_list;
                    }
                    const benchInput = document.getElementById('stagingBenchmarkInput');
                    if (benchInput) benchInput.value = data.competitor_benchmarks || "";

                    appendCopilotMessage("model", `Competitor Audit Rerun Complete!\nUpdated market benchmark analysis for direct targets: ${competitors.join(', ')}.`);
                    if (stagingStatusMessage) {
                        stagingStatusMessage.textContent = "Competitor AI audit re-analyzed cleanly!";
                        stagingStatusMessage.className = "text-xs font-bold text-purple-500";
                    }
                })
                .catch(err => {
                    alert(`Competitor rerun failed: ${err.message}`);
                })
                .finally(() => {
                    rerunCompetitorsBtn.disabled = false;
                    if (btnText) btnText.textContent = "Rerun AI Competitor Audit";
                });
        });
    }

    // AI Copilot Chat Handlers
    function renderCopilotChatFeed(chatHistory) {
        if (!copilotChatFeed) return;
        copilotChatFeed.innerHTML = `
            <div class="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-zinc-700 dark:text-zinc-300">
                <span class="font-bold text-blue-500 flex items-center gap-1.5 text-[10px] uppercase">
                    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h-2a2 2 0 01-2-2z"></path></svg>
                    Gemini Copilot Ready
                </span>
                <p class="leading-relaxed">
                    Welcome! I am your AI Audit Copilot. Ask me to research issues, draft pitch angles, or polish audit copy for this client.
                </p>
            </div>
        `;

        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach(msg => {
                appendCopilotMessage(msg.role, msg.text, false);
            });
        }
        copilotChatFeed.scrollTop = copilotChatFeed.scrollHeight;
    }

    function appendCopilotMessage(role, text, scroll = true) {
        if (!copilotChatFeed) return;

        const card = document.createElement('div');
        const isUser = role === 'user';

        card.className = isUser
            ? "p-3 rounded-xl bg-blue-600 text-white ml-6 space-y-1 shadow-sm"
            : "p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-zinc-700 dark:text-zinc-300 shadow-sm";

        const formattedText = text.replace(/\n/g, '<br>');

        if (isUser) {
            card.innerHTML = `
                <div class="flex justify-between items-center text-[10px] font-bold opacity-80 uppercase">
                    <span>Sales Rep</span>
                </div>
                <p class="leading-relaxed font-medium">${formattedText}</p>
            `;
        } else {
            card.innerHTML = `
                <div class="flex justify-between items-center text-[10px] font-bold text-blue-500 uppercase">
                    <span class="flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h-2a2 2 0 01-2-2z"></path></svg>
                        Gemini Copilot
                    </span>
                </div>
                <div class="leading-relaxed font-medium text-xs space-y-1">${formattedText}</div>
                <div class="pt-2 flex gap-2 border-t border-zinc-200/60 dark:border-zinc-800">
                    <button type="button" class="btn-copilot-copy text-[10px] font-bold px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        Copy Text
                    </button>
                    <button type="button" class="btn-copilot-apply text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Apply to Sentiment Summary
                    </button>
                </div>
            `;

            card.querySelector('.btn-copilot-copy')?.addEventListener('click', () => {
                navigator.clipboard.writeText(text).then(() => alert("Copilot advice copied to clipboard!"));
            });

            card.querySelector('.btn-copilot-apply')?.addEventListener('click', () => {
                const sentimentInput = document.getElementById('stagingSentimentInput');
                if (sentimentInput) {
                    sentimentInput.value = text;
                    alert("Applied Copilot text to Online Sentiment Review!");
                }
            });
        }

        copilotChatFeed.appendChild(card);
        if (scroll) copilotChatFeed.scrollTop = copilotChatFeed.scrollHeight;
    }

    if (copilotForm) {
        copilotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prompt = copilotPromptInput.value.trim();
            if (!prompt || !currentStagingHash) return;

            appendCopilotMessage('user', prompt);
            copilotPromptInput.value = "";

            const sendBtn = document.getElementById('sendCopilotBtn');
            if (sendBtn) sendBtn.disabled = true;

            fetch(`${API_BASE}/api/admin/proposals/${currentStagingHash}/ai-copilot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            })
                .then(res => {
                    if (!res.ok) throw new Error("AI Copilot request failed.");
                    return res.json();
                })
                .then(data => {
                    appendCopilotMessage('model', data.copilot_response);
                })
                .catch(err => {
                    appendCopilotMessage('model', `⚠️ Copilot Error: ${err.message}`);
                })
                .finally(() => {
                    if (sendBtn) sendBtn.disabled = false;
                });
        });
    }

    // Quick prompt chips event listener
    document.querySelectorAll('.copilotChip').forEach(chip => {
        chip.addEventListener('click', () => {
            const promptText = chip.getAttribute('data-prompt');
            if (promptText && copilotPromptInput) {
                copilotPromptInput.value = promptText;
                copilotForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    loadDashboardData();
});