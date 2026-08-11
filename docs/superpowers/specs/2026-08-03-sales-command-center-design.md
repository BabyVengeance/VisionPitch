# Design Specification: Sales Command Center & Revenue Intelligence Dashboard

**Date**: 2026-08-03  
**Status**: Approved  
**Target Feature**: Sales Performance Analytics SPA Section Overhaul

---

## 1. Overview & Objectives
Replaces the static, multi-tab analytics section with a unified **Sales Command Center** benchmarked against leading B2B sales platforms (Salesforce, HubSpot, Gong, PandaDoc). The new dashboard provides:
1. **Executive Financial & Quota KPI Strip**: Monthly Quota Attainment Progress Bar, Total Pipeline Value, Won Revenue, Weighted Cash Forecast, and Deal Velocity (Mean Time to Close).
2. **Urgent Sales Action Radar Panel**: Real-time proposal heat-scoring (🔥 Hot, ⏳ At-Risk, ❄️ Cold/Unopened) with 1-click WhatsApp/Email outreach script generators.
3. **Industry Contract ROI & Revenue Matrix Table**: Full sector breakdown displaying deals, win rate %, closed revenue, and average contract size sorted by highest revenue.
4. **Conversion Funnel & Pitch Velocity Insights**: Stage progress bars and dynamic closing velocity advice.

---

## 2. UI Component Architecture (`frontend/index.html`)

### 2.1 Header & Quota Attainment Progress Bar
```html
<header class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 mb-6">
    <div>
        <h1 class="text-2xl font-bold tracking-tight text-black dark:text-white">Sales Command Center</h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Real-time action alerts, weighted revenue forecasting, and industry contract ROI.</p>
    </div>

    <!-- Monthly Quota Attainment Progress Widget -->
    <div class="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-900 w-full lg:w-80 space-y-2">
        <div class="flex justify-between items-center text-xs">
            <span class="font-bold uppercase tracking-wider text-zinc-400">Monthly Quota Progress</span>
            <span id="quotaTargetLabel" class="font-extrabold text-emerald-600 dark:text-emerald-400">R0 / R100k</span>
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
```

### 2.2 Top Financial KPI Cards Grid
Four cards:
1. `statTotalPipeline`: Cumulative budget value across proposals.
2. `statWonRevenue`: Closed won signed contract revenue (Emerald border).
3. `statWeightedForecast`: Weighted cash forecast (`Signed: 100%`, `Viewed: 80%`, `Sent: 30%` — Blue border).
4. `statDealVelocity`: Win Rate % & Mean time to close.

### 2.3 Main Split Panel Grid

#### Panel 1: Urgent Sales Action Radar (`#actionRadarContainer`)
Displays heat-scored proposal cards requiring rep action:
- 🔥 **Hot Prospect** (High budget or viewed multiple times).
- ⏳ **At-Risk Pitch** (Viewed > 24h ago without signing).
- ❄️ **Unopened Pitch** (Sent > 48h ago with 0 views).

Includes 1-click action triggers:
- `[📱 Copy WhatsApp Nudge]`: Copies pre-filled WhatsApp message tailored to client & company name.
- `[🔗 Copy Direct Link]`: Copies proposal preview link.

#### Panel 2: Industry Contract ROI & Revenue Matrix (`#industryMatrixTableBody`)
Replaces bare bars with a data table:
- Columns: `Industry Sector`, `Deals`, `Win Rate %`, `Total Won Revenue`, `Avg Contract`.
- Tags each industry with macro sector badges (`⚡ Energy`, `🏢 Property`, `🛒 Retail`, `💼 Legal`, `🩺 Health`, `💻 Tech`).

### 2.4 Conversion Pipeline & Pitch Velocity Advice
- Stage-by-stage funnel bars.
- Pitch Optimization advice text box (`#pitchAdviceText`).

---

## 3. State & Logic Engine (`frontend/app.js`)

1. **Quota Calculation**: Compares signed contract revenue against `MONTHLY_QUOTA = 100000` (stored in `localStorage` / configurable).
2. **Weighted Forecast Calculation**:
   - `Signed`: 100% of deal value
   - `Viewed`: 80% of deal value
   - `Sent / Generated`: 30% of deal value
3. **Action Radar Heat-Scoring Algorithm**:
   - Iterates through `loadedProposals`.
   - Flags deals with `Proposal viewed` status as ⏳ **At-Risk** if viewed over 24 hours ago.
   - Flags deals with `Proposal generated` or `Proposal sent` as ❄️ **Unopened** if > 48 hours old.
   - Generates personalized WhatsApp follow-up copy strings on click.
4. **Industry Matrix Calculation**:
   - Aggregates deals, win count, won revenue, and mean contract size per industry.
   - Sorts table rows by Won Revenue (descending).

---

## 4. Verification & Test Plan
1. **KPI Verification**: Verify Total Pipeline, Won Revenue, Weighted Forecast, and Quota Attainment % calculate accurately.
2. **Action Radar Copy Trigger**: Click `[📱 Copy WhatsApp Nudge]` -> verify custom script copies to clipboard with client and company name inserted.
3. **Industry ROI Table**: Verify industries sort by total revenue and macro sector tags display correctly.
4. **Backend Test Suite**: Run pytest suite (`python -m pytest backend/test_main.py`): verify 8/8 tests pass.
