# Design Specification: Tabbed Sales Analytics & Macro Industry Intelligence Dashboard

**Date**: 2026-08-03  
**Status**: Approved  
**Target Feature**: Sales Performance Analytics SPA Section Expansion

---

## 1. Overview & Objectives
The Sales Analytics Dashboard is expanding from a simple funnel summary into a full multi-view executive sales intelligence center. This feature provides:
1. **Sub-Tab Navigation System** within `#analyticsSection` allowing reps to switch between 4 specialized analytical views (*Overview*, *Macro Sectors*, *Niche Industry Breakdown*, and *Conversion Funnel & Stage Analytics*).
2. **Macro Industry Categorization Engine (Milestone 2)** that automatically maps granular/custom industries into 6 macro business sectors (*Energy & Utilities*, *Real Estate & Property*, *Commerce & Retail*, *Professional & Legal*, *Health & Wellness*, *Tech & Services*) and calculates macro sector revenue matrices.
3. **Revenue Split & Funnel Analytics**: Separate tracking of Won Revenue, Active Pipeline Value, and Lost Revenue, along with stage-by-stage drop-off conversion rates and pitch optimization guidance.

---

## 2. Component Architecture & UI Specification

### 2.1 Sub-Tab Navigation Bar (`frontend/index.html`)
Inside `<section id="analyticsSection">`, a pill-style navigation bar controls active views:

```html
<!-- Sub-Tab Navigation Bar -->
<div class="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
    <button type="button" id="tabAnalyticsOverview" class="analytics-subtab-btn px-4 py-2 text-xs font-bold rounded-lg bg-black dark:bg-white text-white dark:text-black transition-all">
        Executive Overview
    </button>
    <button type="button" id="tabAnalyticsSectors" class="analytics-subtab-btn px-4 py-2 text-xs font-bold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-all">
        Macro Sectors
    </button>
    <button type="button" id="tabAnalyticsIndustries" class="analytics-subtab-btn px-4 py-2 text-xs font-bold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-all">
        Niche Industry Breakdown
    </button>
    <button type="button" id="tabAnalyticsFunnel" class="analytics-subtab-btn px-4 py-2 text-xs font-bold rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-all">
        Conversion Funnel & Stage Analytics
    </button>
</div>
```

---

## 3. Detailed View Specifications

### View 1: Executive Overview (`#analyticsViewOverview`)
- **4 KPI Cards**:
  - `Total Pipeline Value` (Total cumulative budget across all proposals).
  - `Won Revenue (Signed)` (Value of all "Proposal signed" deals — Emerald theme).
  - `Active Pipeline Value` (Value of deals in "Proposal viewed" or "Proposal sent" stage — Blue theme).
  - `Average Deal Size & Win Rate` (Mean contract value & win percentage).
- **Win / Loss Health Index**: Visual bar comparing signed vs. declined deals.
- **Top Performing Sector Badge**: Card highlighting the highest revenue sector.

### View 2: Macro Sector Intelligence (`#analyticsViewSectors`)
- **Categorization Engine (6 Parent Sectors)**:
  - `Energy, Solar & Utilities` (Solar EPC, Renewable Energy, Utilities)
  - `Real Estate & Property` (Real Estate, Property Development, Architecture, Construction)
  - `Commerce & Retail` (E-Commerce, Online Retail, Automotive, Beauty, Manufacturing)
  - `Professional & Legal` (Legal Services, Accounting, Financial, Business Consulting, HR)
  - `Health & Wellness` (Medical, Dental, Fitness, Spas)
  - `Tech & Services` (Software, SaaS, Technology, Cleaning, Security, Events)
- **Macro Sector Grid**: Cards showing Won Revenue (ZAR), Active Deals, and Mean Contract Value for each of the 6 sectors.

### View 3: Niche Industry Breakdown (`#analyticsViewIndustries`)
- **Detailed Industry List**: Visual progress bars for every industry present in proposals (both default and custom entries).
- **Interactive Industry Filter**: Clicking an industry bar filters client list and displays detailed revenue metrics for that industry.

### View 4: Conversion Funnel & Stage Analytics (`#analyticsViewFunnel`)
- **Stage Progress Bars**:
  - `Proposals Generated` (100% baseline).
  - `Proposals Viewed / Opened` (Open rate % & count).
  - `Closed / Signed` (Win rate % & count).
  - `Declined` (Drop-off % & count).
- **Stage Drop-Off Insights Card**: Dynamic pitch recommendations based on conversion metrics (e.g. high open rate vs low sign rate warnings).

---

## 4. State & Controller Logic (`frontend/app.js`)

1. **Sub-Tab Switching**: `switchAnalyticsTab(targetTab)` toggles visibility of the 4 view containers (`#analyticsViewOverview`, `#analyticsViewSectors`, `#analyticsViewIndustries`, `#analyticsViewFunnel`) and updates button active styles.
2. **Macro Sector Categorization Function**: `getMacroSector(industryName)` maps any string (including custom niche strings) to one of the 6 core sectors using keyword matching.
3. **Analytics Calculation Engine**: `renderAnalytics()` populates all 4 view containers dynamically when proposals load or change.

---

## 5. Verification & Test Plan
1. **Sub-Tab Navigation**: Click between all 4 sub-tabs -> verify active tab highlights correctly and views switch smoothly.
2. **Macro Sector Mapping**: Verify "Solar, Renewable Energy & EPC" and custom "Boutique Solar EPC Installer" both map to `Energy, Solar & Utilities`.
3. **Financial Split Calculation**: Verify Won Revenue matches sum of signed deals, Active Pipeline matches viewed/sent deals.
4. **Funnel & Insights**: Verify conversion percentages update dynamically when client proposal status changes.
