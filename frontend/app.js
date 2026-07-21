document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://visionpitch.onrender.com";

    // Standard Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            console.log(`Authenticating user: ${username}`);
            sessionStorage.setItem("isLoggedIn", "true");
            window.location.href = 'index.html';
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

    function toggleModal(show) {
        if (intakeModal) {
            intakeModal.classList.toggle('hidden', !show);
            if (!show) {
                intakeForm.reset();
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
            const website_url = document.getElementById('intakeWebsiteUrl').value.trim() || null;
            const social_media_urls = document.getElementById('intakeSocialUrls').value.trim() || null;
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
            const formattedValue = rec.budget ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(rec.budget) : "Not Specified";

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