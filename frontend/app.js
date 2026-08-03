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

    // Attach blur protocol formatters to static website field
    attachProtocolFormatter(document.getElementById('intakeWebsiteUrl'));

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
                    budget
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

    // Populate audit modal with sentiment, visibility gaps, and competitor analysis
    function handleViewAudit(clientId) {
        const rec = loadedProposals.find(r => r.client_id === clientId);
        if (!rec || !rec.audit_raw_json) return;

        try {
            const audit = JSON.parse(rec.audit_raw_json);
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
            if (audit.competitor_analysis && audit.competitor_analysis.length > 0) {
                audit.competitor_analysis.forEach(comp => {
                    const col = document.createElement('div');
                    col.className = "bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 text-left";
                    col.innerHTML = `
                        <h5 class="text-xs font-bold text-black dark:text-white uppercase">${comp.name}</h5>
                        <span class="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-750 dark:text-zinc-400">${comp.platform_leveraged || 'Presence'}</span>
                        <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">${comp.revenue_advantage}</p>
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

    // Dynamic Sales Performance Analytics Calculations
    function renderAnalytics() {
        if (!loadedProposals || loadedProposals.length === 0) return;

        const totalDeals = loadedProposals.length;
        let totalRevenue = 0;
        let countGenerated = 0;
        let countViewed = 0;
        let countSigned = 0;
        let countDeclined = 0;
        const industryCounts = {};

        loadedProposals.forEach(item => {
            const dealValue = (item.client_status === 'Proposal signed' && item.final_price) ? item.final_price : (item.budget || item.final_price);
            if (dealValue) totalRevenue += Number(dealValue);
            if (item.client_status === 'Proposal generated') countGenerated++;
            if (item.client_status === 'Proposal viewed') countViewed++;
            if (item.client_status === 'Proposal signed') countSigned++;
            if (item.client_status === 'Proposal declined') countDeclined++;

            const ind = item.industry || 'Other';
            industryCounts[ind] = (industryCounts[ind] || 0) + 1;
        });

        const avgDeal = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;
        const winRate = totalDeals > 0 ? Math.round((countSigned / totalDeals) * 100) : 0;

        // Update Financial KPI Cards
        const statTotalPipeline = document.getElementById('statTotalPipeline');
        const statAvgDeal = document.getElementById('statAvgDeal');
        const statWinRate = document.getElementById('statWinRate');

        if (statTotalPipeline) statTotalPipeline.textContent = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(totalRevenue);
        if (statAvgDeal) statAvgDeal.textContent = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(avgDeal);
        if (statWinRate) statWinRate.textContent = `${winRate}%`;

        // Update Conversion Funnel Bars & Labels
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

        // Update Win/Loss Meter
        const totalClosedOrDeclined = countSigned + countDeclined;
        const winPct = totalClosedOrDeclined > 0 ? Math.round((countSigned / totalClosedOrDeclined) * 100) : 50;
        const lossPct = totalClosedOrDeclined > 0 ? (100 - winPct) : 50;

        const ratioWinBar = document.getElementById('ratioWinBar');
        const ratioLossBar = document.getElementById('ratioLossBar');
        const ratioSignedLabel = document.getElementById('ratioSignedLabel');
        const ratioDeclinedLabel = document.getElementById('ratioDeclinedLabel');

        if (ratioWinBar) ratioWinBar.style.width = `${winPct}%`;
        if (ratioLossBar) ratioLossBar.style.width = `${lossPct}%`;
        if (ratioSignedLabel) ratioSignedLabel.textContent = `Signed: ${countSigned}`;
        if (ratioDeclinedLabel) ratioDeclinedLabel.textContent = `Declined: ${countDeclined}`;

        // Render Industry Breakdown Bars
        const container = document.getElementById('industryBreakdownContainer');
        if (container) {
            container.innerHTML = Object.entries(industryCounts).map(([ind, cnt]) => {
                const indPct = Math.round((cnt / totalDeals) * 100);
                return `
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs font-semibold">
                            <span class="text-black dark:text-white">${ind}</span>
                            <span class="text-zinc-500">${cnt} deals (${indPct}%)</span>
                        </div>
                        <div class="w-full h-2 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div class="h-full bg-zinc-700 dark:bg-zinc-300 rounded-full transition-all duration-500" style="width: ${indPct}%"></div>
                        </div>
                    </div>`;
            }).join('');
        }
    }

    // Client Directory Search & Filtering
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientStatusFilter = document.getElementById('clientStatusFilter');
    const clientsDirectoryTableBody = document.getElementById('clientsDirectoryTableBody');

    function renderClientDirectory() {
        if (!clientsDirectoryTableBody) return;

        const query = (clientSearchInput?.value || '').toLowerCase().trim();
        const selectedStatus = clientStatusFilter?.value || 'All';

        const filtered = loadedProposals.filter(item => {
            const matchesQuery = (item.client_name || '').toLowerCase().includes(query) || (item.company_name || '').toLowerCase().includes(query);
            const matchesStatus = selectedStatus === 'All' || item.client_status === selectedStatus;
            return matchesQuery && matchesStatus;
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
                        <span class="inline-block px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">Active Record</span>
                    </td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right space-x-2">
                        <button onclick="inspectClientDetails(${item.client_id})" class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">Inspect</button>
                        <button onclick="copyProposalUrl('${item.proposal_hash}')" class="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-colors">Copy Link</button>
                        <button onclick="deleteClientRow(${item.client_id})" class="px-3 py-1.5 bg-red-600/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors">Delete</button>
                    </td>
                </tr>`;
        }).join('');
    }

    if (clientSearchInput) clientSearchInput.addEventListener('input', renderClientDirectory);
    if (clientStatusFilter) clientStatusFilter.addEventListener('change', renderClientDirectory);

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
        statusSelect.value = client.client_status;
        statusSelect.onchange = function() {
            handleStatusChange(clientId, statusSelect.value, statusSelect);
        };

        const linkContainer = document.getElementById('drawerProposalLinkContainer');
        linkContainer.innerHTML = client.proposal_hash ? `
            <a href="proposals.html?id=${client.proposal_hash}" target="_blank" class="block w-full text-center bg-black dark:bg-white text-white dark:text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">Open Active Proposal</a>
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

    function renderTableRows(records) {
        loadedProposals = records;
        if (window.updateComboboxDbIndustries) {
            window.updateComboboxDbIndustries(records);
        }
        proposalsTableBody.innerHTML = '';

        if (!records || records.length === 0) {
            proposalsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                        No proposals generated yet. Click <span class="font-bold text-black dark:text-white">+ Generate Interactive Proposal</span> to create one.
                    </td>
                </tr>
            `;
            updateMetricsFromCache();
            return;
        }

        records.forEach(rec => {
            const row = document.createElement('tr');
            row.className = "hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-colors";

            const badgeColors = {
                'Proposal generated': 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
                'Proposal sent': 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20',
                'Proposal viewed': 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
                'Proposal signed': 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
                'Proposal declined': 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20'
            };

            const statusClass = badgeColors[rec.client_status] || 'bg-zinc-100 text-zinc-500';
            const dealValue = (rec.client_status === 'Proposal signed' && rec.final_price) ? rec.final_price : (rec.budget || rec.final_price);
            const formattedValue = dealValue ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(dealValue) : "Not Specified";

            row.innerHTML = `
                <td class="px-6 py-4 text-black dark:text-white font-bold">${rec.company_name}</td>
                <td class="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">${rec.industry}</td>
                <td class="px-6 py-4 text-zinc-800 dark:text-zinc-200 font-semibold">${formattedValue}</td>
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
                    <div class="flex items-center gap-3">
                        ${rec.proposal_hash ? `<a href="proposals.html?id=${rec.proposal_hash}" target="_blank" class="text-xs font-bold underline uppercase text-zinc-400 hover:text-black dark:hover:text-white">View Link</a>` : '--'}
                        ${rec.audit_raw_json ? `<button data-client-id="${rec.client_id}" class="btn-view-audit text-xs font-bold underline uppercase text-zinc-400 hover:text-black dark:hover:text-white">View Audit</button>` : ''}
                        <button data-client-id="${rec.client_id}" class="btn-delete text-xs font-bold underline uppercase text-red-500 hover:text-red-700">Delete</button>
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
            }
        });
    }

    loadDashboardData();
});