# Proposal Priority Engine Specification

## Executive Overview
The Proposal Priority Engine introduces a native priority parameter (`High`, `Medium`, `Low`) to proposals in VisionPitch. Designed under Sovereign Minimalism visual principles (without emojis), priority is set manually by reps and seamlessly drives data presentation and analytics across all 3 dashboard tabs: **Sales Overview**, **Sales Command Center**, and **Client Directory**.

---

## 1. Design Tokens & Visual Badging

### Priority Tiers & Styling (No Emojis)
- **High**: Red/Amber pill (`bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full`)
- **Medium**: Electric Blue/Yellow pill (`bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full`)
- **Low**: Subdued Zinc/Gray pill (`bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full`)

### Data Model Extension
Every proposal record includes a `priority` attribute:
```json
{
  "id": "prop_123",
  "company_name": "iStudent",
  "industry": "Education",
  "contract_value": 32500,
  "status": "Proposal signed",
  "priority": "High"
}
```
- **Default Value**: `"Medium"` for newly generated proposals or records lacking a priority field.
- **Persistence**: Saved state mutations persist to `localStorage` (`vp_proposals`) and sync to backend API endpoints where available.

---

## 2. Component Integration Across Dashboard Tabs

### Tab 1: Sales Overview (`#dashboardSection`)
1. **Recent Proposals Table**:
   - New `Priority` column inserted between `Value` and `Status`.
   - Interactive dropdown selector styled as a clean badge in each row for quick inline priority updates.
2. **Table Header Toolbar**:
   - Priority Filter Dropdown (`All Priorities`, `High Only`, `Medium Only`, `Low Only`).
   - Clickable `Priority` header sorting rows by priority rank (`High` → `Medium` → `Low` or reverse).

### Tab 2: Sales Command Center (`#analyticsSection`)
1. **Urgent Sales Action Radar**:
   - `High` priority proposals automatically float to the top of radar alerts.
   - Renders a clean `HIGH PRIORITY` badge on relevant alert items.
2. **Weighted Forecast Optimization**:
   - Refines revenue forecasting math by adjusting probability multipliers:
     - `High`: Base probability + 15%
     - `Medium`: Base probability (standard)
     - `Low`: Base probability - 10%

### Tab 3: Client Directory & Portfolio (`#clientsSection`)
1. **Client Directory Table**:
   - Displays an `Account Priority` pill badge next to client names derived from their highest active proposal priority.
   - Adds a Priority filter to the Client Directory search toolbar (`All`, `High`, `Medium`, `Low`).
2. **Client Detail Drawer (`#clientDetailDrawer`)**:
   - Embeds an editable **Priority Override** dropdown under Status Management to modify deal/account priority directly within the drawer view.

---

## 3. State Sync & Event Flow

1. **Inline Mutation**:
   - Updating priority in Tab 1, Tab 3, or the Client Drawer mutates the state in memory, updates `localStorage`, and triggers a global `renderDashboard()` / `renderAnalytics()` / `renderClients()` update.
2. **Filtering & Sorting State**:
   - Maintained in local JS memory (`currentPriorityFilter`, `prioritySortDirection`).

---

## 4. Verification Plan

### Automated & Manual Testing
1. **State Persistence**: Changing a proposal's priority to `High`, refreshing the page, and verifying it stays `High`.
2. **Tab 1 Filter/Sort**: Selecting `High Only` filter to confirm only high-priority rows appear; clicking header to verify sort order.
3. **Tab 2 Radar & Forecast**: Verifying high priority deals float to the top of the Urgent Sales Action Radar and weighted forecast totals recalculate correctly.
4. **Tab 3 Directory & Drawer**: Changing priority inside the Client Drawer and verifying immediate update in the Client Directory table badge.
