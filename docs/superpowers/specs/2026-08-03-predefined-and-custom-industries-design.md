# Design Specification: Pre-defined & Persistent Custom Industry Selector

**Date**: 2026-08-03  
**Status**: Approved  
**Target Feature**: Client Intake Form - Industry Field Optimization

---

## 1. Overview & Objectives
Currently, sales reps manually type in the industry name every time they intake a client into VisionPitch. To streamline workflow, eliminate typos, and standardize dashboard industry analytics, this feature introduces:
1. **A pre-defined seed list** of 22+ common business industry sectors.
2. **A searchable custom combobox UI** in the client intake form.
3. **Dynamic persistence of niche industries** added by sales reps, ensuring newly created industries are stored locally and in the backend so they appear as selectable options on all future client intake forms.

---

## 2. Component Architecture & UI Specification

### 2.1 HTML Markup (`frontend/index.html`)
The static text input `<input type="text" id="intakeIndustry" required>` will be upgraded to a responsive, dark-theme custom combobox widget:

```html
<div class="relative" id="industryComboboxContainer">
    <label class="block text-xs font-bold uppercase text-zinc-400 mb-1">Industry</label>
    <!-- Hidden input to hold selected value & enforce HTML form validation -->
    <input type="hidden" id="intakeIndustry" required>
    
    <!-- Visual Search Input -->
    <div class="relative">
        <input type="text" id="intakeIndustrySearch" placeholder="Search or select industry..." autocomplete="off"
            class="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg p-2.5 pr-8 text-sm text-black dark:text-white focus:outline-none focus:border-zinc-400">
        <div class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </div>
    </div>

    <!-- Scrollable Dropdown List Panel -->
    <div id="intakeIndustryDropdown" 
        class="hidden absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-xs">
        <div id="industryOptionsList" class="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            <!-- Dynamic option items & + Add Custom trigger populated via JavaScript -->
        </div>
    </div>
</div>
```

---

## 3. Pre-Defined Seed Industry Registry
The application will maintain a seed list of high-converting business sectors:
1. Real Estate & Property Development
2. E-Commerce & Online Retail
3. Solar, Renewable Energy & EPC
4. Healthcare, Medical & Dental
5. Legal Services & Law Firms
6. Financial Services, Accounting & Insurance
7. Construction, Contracting & Civil Engineering
8. Hospitality, Restaurants & Tourism
9. Security & Asset Protection Services
10. Automotive & Transportation
11. Fitness, Wellness & Spas
12. Education, Training & E-Learning
13. Logistics, Warehousing & Supply Chain
14. Software, SaaS & Technology
15. Professional & Business Consulting
16. Agriculture, Farming & Agribusiness
17. Cleaning & Facilities Management
18. Entertainment, Events & Media
19. Manufacturing & Industrial Production
20. Architecture & Interior Design
21. Recruitment & HR Staffing
22. Beauty, Salon & Aesthetics

---

## 4. State & Dynamic Persistence Logic (`frontend/app.js`)

### 4.1 Storage Strategy
- **Local Storage Key**: `vp_custom_industries` (JSON array of custom industry strings added locally).
- **Database Extraction**: On initial load, `app.js` fetches proposals (`GET /api/proposals`) and extracts all unique `industry` strings from past records.
- **Combined Active List**: `ACTIVE_INDUSTRIES = Array.from(new Set([...DEFAULT_INDUSTRIES, ...customFromStorage, ...customFromDB]))` sorted alphabetically.

### 4.2 Dropdown Behavior & Event Flow
- **Focus / Click Input**: Opens `#intakeIndustryDropdown` and displays all available industries.
- **Input Filtering**: Typing filters options case-insensitively.
- **Custom Entry Trigger**: If the search term does not match any existing option exactly, an option **`+ Add "${searchTerm}" as New Industry`** is appended to the top of the list.
- **Option Selection**: Clicking an option sets `#intakeIndustry.value` and `#intakeIndustrySearch.value`, closes the dropdown, and clears filter state.
- **Custom Industry Addition**: Clicking the `+ Add...` trigger:
  1. Adds the custom industry to `customFromStorage` and saves to `localStorage`.
  2. Re-computes `ACTIVE_INDUSTRIES`.
  3. Sets the input value to the new industry string.
  4. Closes the dropdown.
- **Keyboard Navigation**:
  - `ArrowDown` / `ArrowUp`: Highlights items in list.
  - `Enter`: Selects highlighted item (or triggers custom addition).
  - `Escape`: Closes dropdown panel.

---

## 5. Backend & Dashboard Integration (`backend/main.py`)
- Standard proposal payload includes `industry`.
- Backend proposals endpoint (`POST /api/proposals/generate`) accepts any valid industry string (default or custom).
- The existing dashboard metrics and industry breakdown chart automatically group and visualize all unique industry values submitted by sales reps.

---

## 6. Verification & Test Plan
1. **Pre-defined List Render**: Verify opening client intake modal populates the 22 default industries.
2. **Filtering**: Type "sol" -> verify "Solar, Renewable Energy & EPC" is highlighted.
3. **Custom Addition**: Type "Boutique Solar EPC", click `+ Add "Boutique Solar EPC" as New Industry`. Verify it populates the intake form.
4. **Persistence Test**: Submit proposal with "Boutique Solar EPC". Reopen intake form modal -> verify "Boutique Solar EPC" appears in the combobox options list.
5. **Dashboard Analytics**: Check that "Boutique Solar EPC" appears on the Industry Sector Distribution chart and table filter dropdowns.
