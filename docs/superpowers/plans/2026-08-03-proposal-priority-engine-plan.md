# Proposal Priority Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a native Priority parameter (`High`, `Medium`, `Low`) to proposal records, displaying visual badges across all 3 dashboard tabs, enabling Tab 1 priority filtering/sorting, boosting Tab 2 Urgent Radar & Weighted Forecast, and powering Tab 3 Client Directory badges and drawer priority management.

**Architecture:** Extend proposal schemas to default `priority` to `"Medium"`. Add UI controls to `index.html` (Table Header filter/sort controls, Client Directory priority filter, Client Drawer priority override). In `app.js`, render styled non-emoji priority pills and inline selects, bind change handlers, and update analytics calculation functions.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS (Dark/Light themes), LocalStorage persistence.

---

### Task 1: HTML Structural Enhancements for Priority Filters & Controls

**Files:**
- Modify: `frontend/index.html:180-205` (Tab 1 Header & Recent Proposals Table)
- Modify: `frontend/index.html:380-400` (Tab 3 Client Directory Search/Filter Toolbar)
- Modify: `frontend/index.html:445-460` (Tab 3 Client Detail Drawer Status Section)

- [ ] **Step 1: Update Tab 1 Table Card Header to include Priority Filter Dropdown & Table Header Column**

In `frontend/index.html`, locate the Recent Proposals card header (`<h3 class="text-lg font-bold...` around line 182). Add a Priority Filter dropdown on the right side of the header. Also add a `<th id="thPriority" class="px-6 py-3.5 font-semibold cursor-pointer hover:text-black dark:hover:text-white transition-colors">Priority</th>` column between `Value` and `Status` in the `<thead>` of `Recent Proposals`.

```html
<div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-900 flex justify-between items-center">
    <h3 class="text-lg font-bold tracking-tight text-black dark:text-white">Recent Proposals</h3>
    <div class="flex items-center gap-2">
        <label for="priorityFilterSelect" class="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 hidden sm:inline">Priority:</label>
        <select id="priorityFilterSelect" class="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-black dark:text-white font-medium focus:outline-none">
            <option value="All">All Priorities</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
        </select>
    </div>
</div>
```

- [ ] **Step 2: Update Tab 3 Client Directory Toolbar to include Priority Filter Dropdown**

In `frontend/index.html`, locate `clientStatusFilter` (around line 389). Add a new `clientPriorityFilter` select beside it:

```html
<select id="clientPriorityFilter" class="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-black dark:text-white focus:outline-none">
    <option value="All">All Priorities</option>
    <option value="High">High Priority</option>
    <option value="Medium">Medium Priority</option>
    <option value="Low">Low Priority</option>
</select>
```

- [ ] **Step 3: Add Priority Override selector to Client Detail Drawer**

In `frontend/index.html`, locate `#drawerStatusSelect` inside `#clientDetailDrawer` (around line 447). Add a Priority Override control directly below it:

```html
<div class="space-y-2 mt-4">
    <label class="block text-xs font-bold uppercase text-zinc-400">Override Proposal Priority</label>
    <select id="drawerPrioritySelect"
        class="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm font-semibold text-black dark:text-white focus:outline-none">
        <option value="High">High Priority</option>
        <option value="Medium">Medium Priority</option>
        <option value="Low">Low Priority</option>
    </select>
</div>
```

- [ ] **Step 4: Commit HTML structure changes**

```bash
git add frontend/index.html
git commit -m "feat(ui): add priority filter dropdowns and table headers to index.html"
```

---

### Task 2: Priority Engine Logic & Tab 1 Implementation

**Files:**
- Modify: `frontend/app.js`

- [ ] **Step 1: Implement Priority badge generator and state helper functions in `app.js`**

Add helper function `getPriorityBadgeHTML(priority)` that returns non-emoji HTML pills based on tier:

```javascript
function getPriorityBadgeHTML(priority) {
    const p = (priority || 'Medium').toLowerCase();
    if (p === 'high') {
        return `<span class="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">High</span>`;
    } else if (p === 'low') {
        return `<span class="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">Low</span>`;
    }
    return `<span class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold uppercase text-[10px] px-2 py-0.5 rounded-full inline-flex items-center">Medium</span>`;
}
```

- [ ] **Step 2: Update proposal parsing and creation defaults to ensure `priority` is set**

Where proposals are loaded from `localStorage` or API responses, ensure missing `priority` defaults to `"Medium"`.

- [ ] **Step 3: Update `renderProposalsTable()` to include Priority Column with interactive select**

Update the table row rendering to include the Priority column. In each row, render an inline dropdown with options `High`, `Medium`, `Low` styled cleanly, and bind `change` event listener to update proposal priority in memory and `localStorage`, then refresh dependent sections (`renderAnalytics()`, `renderClients()`).

- [ ] **Step 4: Implement Priority Filtering & Header Sorting for Tab 1**

Add event listener to `priorityFilterSelect` to filter visible proposals in `proposalsTableBody`.
Add click handler to `thPriority` to toggle sort order (`High` -> `Medium` -> `Low` vs `Low` -> `Medium` -> `High`).

- [ ] **Step 5: Commit Tab 1 Priority logic**

```bash
git add frontend/app.js
git commit -m "feat(proposals): implement priority column, inline selector, and tab 1 sorting/filtering"
```

---

### Task 3: Tab 2 & Tab 3 Priority Integrations

**Files:**
- Modify: `frontend/app.js`

- [ ] **Step 1: Update Urgent Sales Action Radar to boost High-Priority proposals**

In `renderAnalytics()` / `renderActionRadar()`, sort radar alerts so `High` priority un-opened/pending proposals float to the top of the list, and display a `HIGH PRIORITY` badge on their radar card.

- [ ] **Step 2: Update Weighted Revenue Forecast calculation in Tab 2**

Adjust win probability based on deal priority:
- `High` priority: +15% win probability boost
- `Medium` priority: standard stage probability
- `Low` priority: -10% win probability penalty
Recalculate `statWeightedForecast` display.

- [ ] **Step 3: Update Client Directory Table & Toolbar Filter in Tab 3**

In `renderClients()`, add an `Account Priority` pill badge column or inline badge to each client row reflecting their highest active proposal priority.
Connect `clientPriorityFilter` select element to filter the client directory rows.

- [ ] **Step 4: Connect Client Detail Drawer Priority Override control**

In `openClientDrawer(clientId)` and `#drawerPrioritySelect` `change` handler, bind priority selection so updating priority inside the drawer updates the proposal record and refreshes the dashboard UI.

- [ ] **Step 5: Verification & Commit**

Verify that changing priority in Tab 1 updates Tab 2 Radar/Forecast and Tab 3 Client Directory immediately without page reloads.

```bash
git add frontend/app.js
git commit -m "feat(analytics-clients): integrate priority into urgent radar, forecast math, client badges, and drawer"
```
