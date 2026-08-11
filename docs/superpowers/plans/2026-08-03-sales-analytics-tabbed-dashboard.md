# Tabbed Sales Analytics & Macro Industry Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Sales Performance Analytics section into a multi-tab executive dashboard with 4 sub-views (Overview, Macro Sectors, Niche Industry Breakdown, Stage Analytics) and automatic Macro Industry Sector Mapping.

**Architecture:** Add a sub-tab navigation bar and 4 view containers (`#analyticsViewOverview`, `#analyticsViewSectors`, `#analyticsViewIndustries`, `#analyticsViewFunnel`) in `index.html`. Implement macro sector keyword mapping (`getMacroSector`) and sub-tab state controller (`switchAnalyticsTab`, `renderAnalytics`) in `app.js`.

**Tech Stack:** HTML5, Vanilla JavaScript, Tailwind CSS (VisionPitch dark theme).

---

### Task 1: Update Sales Analytics Markup in `frontend/index.html`

**Files:**
- Modify: `frontend/index.html:211-330`

- [ ] **Step 1: Add Sub-Tab Navigation Bar and 4 View Containers in `frontend/index.html`**

Replace the contents of `<section id="analyticsSection">` with:

```html
        <!-- Sales Analytics & Statistics SPA Section -->
        <section id="analyticsSection" class="hidden space-y-6">
            <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-black dark:text-white">Sales Performance Analytics</h1>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Real-time conversion metrics, macro sector intelligence, and deal velocity analytics.</p>
                </div>

                <!-- Sub-Tab Navigation Bar -->
                <div class="flex flex-wrap gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
                    <button type="button" id="tabAnalyticsOverview" data-tab="overview" class="analytics-subtab-btn px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-all shadow-sm">
                        Overview
                    </button>
                    <button type="button" id="tabAnalyticsSectors" data-tab="sectors" class="analytics-subtab-btn px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                        Macro Sectors
                    </button>
                    <button type="button" id="tabAnalyticsIndustries" data-tab="industries" class="analytics-subtab-btn px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                        Niche Industries
                    </button>
                    <button type="button" id="tabAnalyticsFunnel" data-tab="funnel" class="analytics-subtab-btn px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all">
                        Funnel & Stages
                    </button>
                </div>
            </header>

            <!-- SUB-VIEW 1: EXECUTIVE OVERVIEW -->
            <div id="analyticsViewOverview" class="analytics-subview space-y-6">
                <!-- Financial KPI Summary Cards (4 Cards Grid) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Pipeline Value</p>
                        <p id="statTotalPipeline" class="text-2xl font-extrabold text-black dark:text-white mt-1.5">R 0</p>
                        <p class="text-[10px] text-zinc-500 mt-1 font-medium">Cumulative potential contract value</p>
                    </div>
                    <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm border-l-4 border-l-emerald-500">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Won Revenue (Signed)</p>
                        <p id="statWonRevenue" class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">R 0</p>
                        <p class="text-[10px] text-zinc-500 mt-1 font-medium">Closed contract revenue</p>
                    </div>
                    <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm border-l-4 border-l-blue-500">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Active Pipeline Value</p>
                        <p id="statActivePipeline" class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">R 0</p>
                        <p class="text-[10px] text-zinc-500 mt-1 font-medium">Proposals viewed or sent</p>
                    </div>
                    <div class="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm">
                        <p class="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Avg Deal Size & Win Rate</p>
                        <div class="flex items-baseline gap-2 mt-1.5">
                            <span id="statAvgDeal" class="text-xl font-extrabold text-black dark:text-white">R 0</span>
                            <span id="statWinRateBadge" class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">0% Win</span>
                        </div>
                        <p class="text-[10px] text-zinc-500 mt-1 font-medium">Mean contract & win ratio</p>
                    </div>
                </div>

                <!-- Win vs Loss Health Index & Top Sector Card -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold text-black dark:text-white">Win / Loss Ratio</h3>
                            <span class="text-xs text-zinc-400 font-medium">Signed Contracts vs. Declined Proposals</span>
                        </div>
                        <div class="flex h-4 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
                            <div id="ratioWinBar" class="bg-emerald-500 transition-all duration-500" style="width: 50%"></div>
                            <div id="ratioLossBar" class="bg-red-500 transition-all duration-500" style="width: 50%"></div>
                        </div>
                        <div class="flex justify-between text-xs font-bold pt-1">
                            <span id="ratioSignedLabel" class="text-emerald-600 dark:text-emerald-400">Signed: 0</span>
                            <span id="ratioDeclinedLabel" class="text-red-600 dark:text-red-400">Declined: 0</span>
                        </div>
                    </div>

                    <!-- Top Sector Spotlight Card -->
                    <div class="bg-gradient-to-br from-zinc-900 to-black text-white p-6 rounded-xl border border-zinc-800 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                            <span class="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">Top Revenue Sector</span>
                            <h4 id="topSectorName" class="text-lg font-bold mt-3 text-white">Calculating...</h4>
                            <p id="topSectorValue" class="text-2xl font-extrabold text-emerald-400 mt-1">R 0</p>
                        </div>
                        <p class="text-[11px] text-zinc-400 font-medium">Highest cumulative contract revenue by sector.</p>
                    </div>
                </div>
            </div>

            <!-- SUB-VIEW 2: MACRO SECTOR INTELLIGENCE -->
            <div id="analyticsViewSectors" class="analytics-subview hidden space-y-6">
                <div class="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4">
                    <div>
                        <h3 class="text-md font-bold text-black dark:text-white">Macro Sector Performance Matrix</h3>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Categorized breakdown across 6 primary business verticals.</p>
                    </div>
                    <div id="macroSectorsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        <!-- Populated via JS -->
                    </div>
                </div>
            </div>

            <!-- SUB-VIEW 3: NICHE INDUSTRY BREAKDOWN -->
            <div id="analyticsViewIndustries" class="analytics-subview hidden space-y-6">
                <div class="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-md font-bold text-black dark:text-white">Granular Industry Sector Distribution</h3>
                            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Click any industry to filter client proposals.</p>
                        </div>
                        <button type="button" id="clearIndustryFilterBtn" class="hidden px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            Clear Filter
                        </button>
                    </div>
                    <div id="industryBreakdownContainer" class="space-y-3 pt-1 text-xs">
                        <p class="text-zinc-400">Loading industry sectors...</p>
                    </div>
                </div>
            </div>

            <!-- SUB-VIEW 4: CONVERSION FUNNEL & STAGE ANALYTICS -->
            <div id="analyticsViewFunnel" class="analytics-subview hidden space-y-6">
                <div class="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-6">
                    <h3 class="text-lg font-bold text-black dark:text-white border-b border-zinc-200 dark:border-zinc-900 pb-3">
                        Stage-by-Stage Pitch Funnel & Drop-Off
                    </h3>

                    <div class="space-y-5">
                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs font-bold">
                                <span class="text-black dark:text-white uppercase">1. Proposals Generated</span>
                                <span id="funnelGeneratedCount" class="text-zinc-500">0 deals (100%)</span>
                            </div>
                            <div class="w-full h-3 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div id="funnelGeneratedBar" class="h-full bg-black dark:bg-white transition-all duration-500" style="width: 100%"></div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs font-bold">
                                <span class="text-blue-600 dark:text-blue-400 uppercase">2. Proposals Viewed / Opened</span>
                                <span id="funnelViewedCount" class="text-zinc-500">0 deals (0%)</span>
                            </div>
                            <div class="w-full h-3 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div id="funnelViewedBar" class="h-full bg-blue-500 transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs font-bold">
                                <span class="text-emerald-600 dark:text-emerald-400 uppercase">3. Closed / Signed (Won)</span>
                                <span id="funnelSignedCount" class="text-zinc-500">0 deals (0%)</span>
                            </div>
                            <div class="w-full h-3 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div id="funnelSignedBar" class="h-full bg-emerald-500 transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>

                        <div class="space-y-1.5">
                            <div class="flex justify-between text-xs font-bold">
                                <span class="text-red-600 dark:text-red-400 uppercase">4. Declined (Lost)</span>
                                <span id="funnelDeclinedCount" class="text-zinc-500">0 deals (0%)</span>
                            </div>
                            <div class="w-full h-3 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                                <div id="funnelDeclinedBar" class="h-full bg-red-500 transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Pitch Optimization Advice Box -->
                    <div id="pitchAdviceContainer" class="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                        <span class="font-bold text-black dark:text-white uppercase tracking-wider">Pitch Optimization Insight</span>
                        <p id="pitchAdviceText" class="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">Analyzing pitch funnel performance...</p>
                    </div>
                </div>
            </div>
        </section>
```

- [ ] **Step 2: Commit HTML changes**

```bash
git add frontend/index.html
git commit -m "feat(ui): add multi-tab sales analytics layout with sub-views and macro sector containers"
```

---

### Task 2: Implement Macro Sector Mapping & Sub-Tab Controller in `frontend/app.js`

**Files:**
- Modify: `frontend/app.js`

- [ ] **Step 1: Add Macro Sector Mapping function `getMacroSector` in `frontend/app.js`**

```javascript
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
    return "Professional & Legal"; // Default fallback sector
}
```

- [ ] **Step 2: Implement Sub-Tab Controller `initAnalyticsSubtabs` in `frontend/app.js`**

```javascript
function initAnalyticsSubtabs() {
    const tabButtons = document.querySelectorAll('.analytics-subtab-btn');
    const subviews = document.querySelectorAll('.analytics-subview');

    if (!tabButtons || tabButtons.length === 0) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Reset all buttons
            tabButtons.forEach(b => {
                b.className = "analytics-subtab-btn px-3 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-all";
            });

            // Highlight selected button
            btn.className = "analytics-subtab-btn px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold transition-all shadow-sm";

            // Toggle subviews
            subviews.forEach(view => {
                view.classList.add('hidden');
            });

            const activeView = document.getElementById(`analyticsView${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
            if (activeView) activeView.classList.remove('hidden');
        });
    });
}
```

- [x] **Step 3: Update `renderAnalytics()` to calculate Macro Sectors, Won/Active Revenue splits, and Pitch Advice**

Update `renderAnalytics()` in `app.js`:

```javascript
    function renderAnalytics() {
        if (!loadedProposals || loadedProposals.length === 0) return;

        const totalDeals = loadedProposals.length;
        let totalPipeline = 0;
        let wonRevenue = 0;
        let activePipeline = 0;

        let countGenerated = 0;
        let countViewed = 0;
        let countSigned = 0;
        let countDeclined = 0;

        const industryCounts = {};
        const macroSectorData = {
            "Energy, Solar & Utilities": { won: 0, count: 0 },
            "Real Estate & Property": { won: 0, count: 0 },
            "Commerce & Retail": { won: 0, count: 0 },
            "Professional & Legal": { won: 0, count: 0 },
            "Health & Wellness": { won: 0, count: 0 },
            "Tech & Services": { won: 0, count: 0 }
        };

        loadedProposals.forEach(item => {
            const dealValue = (item.client_status === 'Proposal signed' && item.final_price) ? item.final_price : (item.budget || item.final_price || 0);
            const numVal = Number(dealValue);

            totalPipeline += numVal;

            if (item.client_status === 'Proposal signed') {
                countSigned++;
                wonRevenue += numVal;
            } else if (item.client_status === 'Proposal viewed' || item.client_status === 'Proposal sent') {
                activePipeline += numVal;
            }

            if (item.client_status === 'Proposal generated') countGenerated++;
            if (item.client_status === 'Proposal viewed') countViewed++;
            if (item.client_status === 'Proposal declined') countDeclined++;

            const ind = item.industry || 'Other';
            industryCounts[ind] = (industryCounts[ind] || 0) + 1;

            const macro = getMacroSector(ind);
            if (macroSectorData[macro]) {
                macroSectorData[macro].count++;
                if (item.client_status === 'Proposal signed') {
                    macroSectorData[macro].won += numVal;
                }
            }
        });

        const fmtZAR = (val) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);

        // Update Overview Cards
        const statTotalPipeline = document.getElementById('statTotalPipeline');
        const statWonRevenue = document.getElementById('statWonRevenue');
        const statActivePipeline = document.getElementById('statActivePipeline');
        const statAvgDeal = document.getElementById('statAvgDeal');
        const statWinRateBadge = document.getElementById('statWinRateBadge');

        if (statTotalPipeline) statTotalPipeline.textContent = fmtZAR(totalPipeline);
        if (statWonRevenue) statWonRevenue.textContent = fmtZAR(wonRevenue);
        if (statActivePipeline) statActivePipeline.textContent = fmtZAR(activePipeline);

        const avgDeal = totalDeals > 0 ? Math.round(totalPipeline / totalDeals) : 0;
        const winRate = totalDeals > 0 ? Math.round((countSigned / totalDeals) * 100) : 0;

        if (statAvgDeal) statAvgDeal.textContent = fmtZAR(avgDeal);
        if (statWinRateBadge) statWinRateBadge.textContent = `${winRate}% Win`;

        // Render Macro Sectors Grid
        const macroGrid = document.getElementById('macroSectorsGrid');
        if (macroGrid) {
            let topSector = { name: "N/A", won: -1 };
            let gridHtml = '';

            for (const [secName, data] of Object.entries(macroSectorData)) {
                if (data.won > topSector.won) {
                    topSector = { name: secName, won: data.won };
                }
                gridHtml += `
                    <div class="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-black dark:text-white text-xs">${secName}</span>
                            <span class="px-2 py-0.5 text-[9px] font-extrabold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">${data.count} deals</span>
                        </div>
                        <p class="text-base font-extrabold text-emerald-600 dark:text-emerald-400">${fmtZAR(data.won)}</p>
                        <p class="text-[10px] text-zinc-400">Closed Revenue</p>
                    </div>
                `;
            }
            macroGrid.innerHTML = gridHtml;

            const topSectorName = document.getElementById('topSectorName');
            const topSectorValue = document.getElementById('topSectorValue');
            if (topSectorName) topSectorName.textContent = topSector.name;
            if (topSectorValue) topSectorValue.textContent = fmtZAR(topSector.won > -1 ? topSector.won : 0);
        }

        // Render Funnel Bars & Pitch Advice
        const openRate = totalDeals > 0 ? Math.round((countViewed / totalDeals) * 100) : 0;
        const pitchAdviceText = document.getElementById('pitchAdviceText');
        if (pitchAdviceText) {
            if (openRate < 40) {
                pitchAdviceText.textContent = `Current proposal open rate is low (${openRate}%). Recommend following up via WhatsApp/Email immediately after generation to ensure prospect views link.`;
            } else if (winRate >= 50) {
                pitchAdviceText.textContent = `Excellent conversion velocity! Win rate is strong at ${winRate}%. Focus on expanding top-of-funnel intake volume.`;
            } else {
                pitchAdviceText.textContent = `High view rate (${openRate}%) with ${winRate}% closed rate. Review ROI proposal terms or add explicit pricing packages to drive closing velocity.`;
            }
        }
    }
```

- [ ] **Step 4: Hook `initAnalyticsSubtabs()` into DOMContentLoaded**

Call `initAnalyticsSubtabs()` inside `DOMContentLoaded` event listener.

- [ ] **Step 5: Commit JS changes**

```bash
git add frontend/app.js
git commit -m "feat(analytics): implement macro sector engine, sub-tab controller, and revenue split metrics"
```

---

### Task 3: Verification & Integration Testing

- [ ] **Step 1: Run pytest backend test suite**

```bash
C:\Users\user-pc\AppData\Local\Programs\Python\Python311\Scripts\pytest.exe backend/test_main.py -v
```

- [ ] **Step 2: Manual Frontend Verification**

1. Switch to Sales Performance Analytics section.
2. Click between `Overview`, `Macro Sectors`, `Niche Industries`, and `Funnel & Stages` sub-tabs. Verify smooth view toggling.
3. Verify Won Revenue vs Active Pipeline Value KPI card metrics.
4. Verify Macro Sectors grid calculates correctly.

- [ ] **Step 3: Final Git Commit**

```bash
git add .
git commit -m "feat: complete tabbed sales analytics dashboard and macro industry categorization implementation"
```
