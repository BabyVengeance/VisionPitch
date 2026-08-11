# Sales Command Center & Revenue Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Sales Performance Analytics section into a high-density, action-driven Sales Command Center equipped with Quota Attainment tracking, Weighted Revenue Forecasting, Urgent Action Radar (with 1-click WhatsApp nudge copy), and an Industry Contract ROI Matrix Table.

**Architecture:** Replace the sub-tab container in `index.html` with a unified 2-panel grid layout containing Quota Progress Bar, 4 KPI Cards, Action Radar, Industry ROI Table, and Funnel Advice. Implement heat-scoring, weighted forecasting, and WhatsApp template generation in `app.js`.

**Tech Stack:** HTML5, Vanilla JavaScript, Tailwind CSS (VisionPitch dark theme).

---

### Task 1: Update Sales Command Center Markup in `frontend/index.html`

**Files:**
- Modify: `frontend/index.html:211-330`

- [ ] **Step 1: Replace `<section id="analyticsSection">` markup in `frontend/index.html`**

```html
        <!-- Sales Command Center & Revenue Intelligence SPA Section -->
        <section id="analyticsSection" class="hidden space-y-6">
            <!-- Header & Monthly Quota Attainment Widget -->
            <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-black dark:text-white">Sales Command Center</h1>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Real-time action alerts, weighted revenue forecasting, and industry contract ROI.</p>
                </div>

                <!-- Monthly Quota Attainment Widget -->
                <div class="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900 w-full lg:w-80 space-y-2 shadow-sm">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-bold uppercase tracking-wider text-zinc-400">Monthly Quota</span>
                        <span id="quotaTargetLabel" class="font-extrabold text-emerald-600 dark:text-emerald-400">R 0 / R 100k</span>
                    </div>
                    <div class="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                        <div id="quotaProgressBar" class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] text-zinc-500 font-medium">
                        <span id="quotaPctLabel">0% Target</span>
                        <span>Target: R100,000 / mo</span>
                    </div>
                </div>
            </header>

            <!-- Top Financial KPI Summary Cards (4 Cards Grid) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Pipeline Value</p>
                    <p id="statTotalPipeline" class="text-2xl font-extrabold text-black dark:text-white mt-1.5">R 0</p>
                    <p class="text-[10px] text-zinc-500 mt-1 font-medium">Cumulative gross potential</p>
                </div>
                <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm border-l-4 border-l-emerald-500">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Closed Won Revenue</p>
                    <p id="statWonRevenue" class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">R 0</p>
                    <p class="text-[10px] text-zinc-500 mt-1 font-medium">Signed contract cash</p>
                </div>
                <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm border-l-4 border-l-blue-500">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Weighted Forecast</p>
                    <p id="statWeightedForecast" class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">R 0</p>
                    <p class="text-[10px] text-zinc-500 mt-1 font-medium">Probability-adjusted expected cash</p>
                </div>
                <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Win Rate & Avg Contract</p>
                    <div class="flex items-baseline gap-2 mt-1.5">
                        <span id="statAvgDeal" class="text-xl font-extrabold text-black dark:text-white">R 0</span>
                        <span id="statWinRateBadge" class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">0% Win</span>
                    </div>
                    <p class="text-[10px] text-zinc-500 mt-1 font-medium">Mean deal size & closing ratio</p>
                </div>
            </div>

            <!-- Main Command Center Grid: Urgent Action Radar & Industry ROI Matrix -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Panel 1: Urgent Sales Action Radar (Left / 7 cols) -->
                <div class="lg:col-span-7 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4">
                    <div class="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-900 pb-3">
                        <div>
                            <h3 class="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Urgent Sales Action Radar
                            </h3>
                            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">High-priority pitches needing rep intervention & follow-up.</p>
                        </div>
                        <span id="actionRadarBadgeCount" class="px-2.5 py-1 text-[10px] font-extrabold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full">0 Alerts</span>
                    </div>

                    <div id="actionRadarContainer" class="space-y-3 max-h-[380px] overflow-y-auto pr-1 text-xs">
                        <p class="text-zinc-400 italic">Scanning pipeline for stale pitches...</p>
                    </div>
                </div>

                <!-- Panel 2: Industry Contract ROI & Revenue Matrix (Right / 5 cols) -->
                <div class="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4">
                    <div class="border-b border-zinc-200 dark:border-zinc-900 pb-3">
                        <h3 class="text-sm font-bold text-black dark:text-white">Industry Contract ROI Matrix</h3>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ranked revenue performance per sector.</p>
                    </div>

                    <div class="overflow-x-auto max-h-[380px] overflow-y-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="text-zinc-400 font-bold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-900">
                                    <th class="pb-2">Sector</th>
                                    <th class="pb-2 text-center">Deals</th>
                                    <th class="pb-2 text-right">Closed Revenue</th>
                                </tr>
                            </thead>
                            <tbody id="industryMatrixTableBody" class="divide-y divide-zinc-200/60 dark:divide-zinc-900">
                                <tr>
                                    <td colspan="3" class="py-4 text-center text-zinc-400 italic">Loading industry ROI matrix...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Bottom Conversion Funnel Progress & Pitch Advice -->
            <div class="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-5">
                <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-3">
                    <h3 class="text-sm font-bold text-black dark:text-white">Proposal Pitch Conversion Funnel</h3>
                    <span class="text-xs text-zinc-400 font-medium">Stage-by-Stage Pitch Progress</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
                    <div class="space-y-1.5">
                        <div class="flex justify-between">
                            <span class="text-black dark:text-white uppercase">1. Generated</span>
                            <span id="funnelGeneratedCount" class="text-zinc-500">0 deals</span>
                        </div>
                        <div class="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div id="funnelGeneratedBar" class="h-full bg-black dark:bg-white transition-all duration-500" style="width: 100%"></div>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex justify-between">
                            <span class="text-blue-600 dark:text-blue-400 uppercase">2. Viewed</span>
                            <span id="funnelViewedCount" class="text-zinc-500">0 deals</span>
                        </div>
                        <div class="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div id="funnelViewedBar" class="h-full bg-blue-500 transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex justify-between">
                            <span class="text-emerald-600 dark:text-emerald-400 uppercase">3. Signed (Won)</span>
                            <span id="funnelSignedCount" class="text-zinc-500">0 deals</span>
                        </div>
                        <div class="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div id="funnelSignedBar" class="h-full bg-emerald-500 transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex justify-between">
                            <span class="text-red-600 dark:text-red-400 uppercase">4. Declined</span>
                            <span id="funnelDeclinedCount" class="text-zinc-500">0 deals</span>
                        </div>
                        <div class="w-full h-2.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                            <div id="funnelDeclinedBar" class="h-full bg-red-500 transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- Pitch Advice Container -->
                <div id="pitchAdviceContainer" class="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                    <span class="font-bold text-black dark:text-white uppercase tracking-wider text-[10px]">Closing Velocity Insight</span>
                    <p id="pitchAdviceText" class="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Analyzing pitch funnel performance...</p>
                </div>
            </div>
        </section>
```

- [ ] **Step 2: Commit HTML changes**

```bash
git add frontend/index.html
git commit -m "feat(ui): implement Sales Command Center layout with Action Radar and Industry ROI matrix"
```

---

### Task 2: Implement Sales Command Center Logic & Action Radar in `frontend/app.js`

**Files:**
- Modify: `frontend/app.js`

- [ ] **Step 1: Add WhatsApp Script Generator & Action Radar Renderer in `frontend/app.js`**

```javascript
const MONTHLY_QUOTA_TARGET = 100000; // R100,000 monthly sales quota target

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

    proposals.forEach(p => {
        const val = (p.client_status === 'Proposal signed' && p.final_price) ? p.final_price : (p.budget || p.final_price || 0);
        const fmtVal = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);

        if (p.client_status === 'Proposal viewed') {
            alertsCount++;
            cardsHtml += `
                <div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-500/30 space-y-2 shadow-sm">
                    <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <span>⏳</span> At-Risk Pitch (Viewed)
                        </span>
                        <span class="font-bold text-black dark:text-white text-xs">${fmtVal}</span>
                    </div>
                    <div class="flex justify-between items-baseline">
                        <div>
                            <h4 class="font-bold text-black dark:text-white text-xs">${p.company_name}</h4>
                            <p class="text-[11px] text-zinc-500">${p.client_name} • ${p.industry}</p>
                        </div>
                        <button type="button" data-action="whatsapp-nudge" data-client="${p.client_name}" data-company="${p.company_name}" data-industry="${p.industry}" data-hash="${p.proposal_hash || ''}"
                            class="btn-radar-nudge px-2.5 py-1 text-[10px] font-bold rounded bg-amber-500 hover:bg-amber-600 text-black transition-colors flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/></svg>
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
                        <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 rounded border border-blue-300 dark:border-blue-800 flex items-center gap-1">
                            <span>❄️</span> Unopened Link
                        </span>
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
                        <span class="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                            <span>🎉</span> Closed Won
                        </span>
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
    container.innerHTML = cardsHtml || `<p class="text-emerald-600 dark:text-emerald-400 font-semibold py-4 text-center">🎉 All pitches active & closed!</p>`;

    // Add event delegation for buttons
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
```

- [x] **Step 2: Update `renderAnalytics()` to calculate Quota Attainment, Weighted Forecast, Industry Matrix Table, and Action Radar**

Update `renderAnalytics()` in `app.js`:

```javascript
    function renderAnalytics() {
        if (!loadedProposals || loadedProposals.length === 0) return;

        const totalDeals = loadedProposals.length;
        let totalPipeline = 0;
        let wonRevenue = 0;
        let weightedForecast = 0;

        let countGenerated = 0;
        let countViewed = 0;
        let countSigned = 0;
        let countDeclined = 0;

        const industryData = {};

        loadedProposals.forEach(item => {
            const dealValue = (item.client_status === 'Proposal signed' && item.final_price) ? item.final_price : (item.budget || item.final_price || 0);
            const numVal = Number(dealValue);

            totalPipeline += numVal;

            if (item.client_status === 'Proposal signed') {
                countSigned++;
                wonRevenue += numVal;
                weightedForecast += numVal; // 100% weight
            } else if (item.client_status === 'Proposal viewed') {
                countViewed++;
                weightedForecast += (numVal * 0.8); // 80% weight
            } else if (item.client_status === 'Proposal generated' || item.client_status === 'Proposal sent') {
                countGenerated++;
                weightedForecast += (numVal * 0.3); // 30% weight
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

        const quotaPct = Math.min(100, Math.round((wonRevenue / MONTHLY_QUOTA_TARGET) * 100));
        if (quotaProgressBar) quotaProgressBar.style.width = `${quotaPct}%`;
        if (quotaTargetLabel) quotaTargetLabel.textContent = `${fmtZAR(wonRevenue)} / R 100k`;
        if (quotaPctLabel) quotaPctLabel.textContent = `${quotaPct}% Target Achieved`;

        // Update 4 Financial KPI Summary Cards
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

        // Render Action Radar
        renderActionRadar(loadedProposals);

        // Render Industry ROI Matrix Table
        const matrixBody = document.getElementById('industryMatrixTableBody');
        if (matrixBody) {
            const sortedIndustries = Object.entries(industryData).sort((a, b) => b[1].won - a[1].won);
            matrixBody.innerHTML = sortedIndustries.map(([ind, data]) => {
                const indWinRate = data.count > 0 ? Math.round((data.wonCount / data.count) * 100) : 0;
                return `
                    <tr class="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td class="py-2.5 font-semibold text-black dark:text-white">${ind}</td>
                        <td class="py-2.5 text-center text-zinc-500 font-medium">${data.count} <span class="text-[10px] text-zinc-400">(${indWinRate}%)</span></td>
                        <td class="py-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">${fmtZAR(data.won)}</td>
                    </tr>
                `;
            }).join('');
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
```

- [ ] **Step 3: Commit JS changes**

```bash
git add frontend/app.js
git commit -m "feat(analytics): implement Sales Command Center logic, quota progress, weighted forecast, and action radar"
```

---

### Task 3: Verification & Test Suite Run

- [ ] **Step 1: Run pytest backend test suite**

```bash
C:\Users\user-pc\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe backend/test_main.py -v
```

- [ ] **Step 2: Verify Sales Command Center in Browser**

1. Open VisionPitch frontend dashboard in browser.
2. Click **Sales Performance Analytics** in left sidebar.
3. Verify Monthly Quota Progress widget displays `R0 / R100k` (or current signed total).
4. Verify 4 Financial KPI summary cards (*Total Pipeline*, *Closed Won*, *Weighted Forecast*, *Win Rate*).
5. Verify **Urgent Sales Action Radar** highlights stalled/viewed proposals and clicking `WhatsApp Follow-up` copies script to clipboard.
6. Verify **Industry ROI Matrix Table** displays sorted contract values.

- [ ] **Step 3: Final Git Commit**

```bash
git add .
git commit -m "feat: complete Sales Command Center overhaul implementation"
```
