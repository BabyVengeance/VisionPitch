# Pre-defined & Persistent Custom Industry Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static industry text input in the client intake modal into a searchable combobox populated with 22+ pre-defined common industries and dynamic persistent storage for sales-rep added niche industries.

**Architecture:** Replace the standard text `<input>` in `index.html` with a custom-styled combobox containing a hidden input for form validation, a visible text search input, and an absolute-positioned dropdown. Implement JS state management in `app.js` to merge seed industries with custom industries from `localStorage` and backend proposals, support instant filtering, click/keyboard selection, and dynamic `+ Add` custom industry registration.

**Tech Stack:** HTML5, Vanilla JavaScript, Tailwind CSS (VisionPitch dark theme).

---

### Task 1: Update Client Intake Form Markup in `frontend/index.html`

**Files:**
- Modify: `frontend/index.html:479-484`

- [ ] **Step 1: Replace line 480-483 in `frontend/index.html` with the combobox markup**

```html
                <div class="relative" id="industryComboboxContainer">
                    <label class="block text-xs font-bold uppercase text-zinc-400 mb-1">Industry</label>
                    <!-- Hidden input to hold selected value & enforce HTML form validation -->
                    <input type="hidden" id="intakeIndustry" required>
                    
                    <!-- Visual Search Input -->
                    <div class="relative">
                        <input type="text" id="intakeIndustrySearch" placeholder="Search or select industry..." autocomplete="off" required
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
                            <!-- Populated via JavaScript -->
                        </div>
                    </div>
                </div>
```

- [ ] **Step 2: Verify HTML syntax**

Verify that `#intakeIndustry` hidden input and `#intakeIndustrySearch` text input exist inside `#industryComboboxContainer`.

- [ ] **Step 3: Commit HTML changes**

```bash
git add frontend/index.html
git commit -m "feat(ui): replace static industry input with searchable combobox markup"
```

---

### Task 2: Implement Combobox State & Dynamic Industry Persistence in `frontend/app.js`

**Files:**
- Modify: `frontend/app.js`

- [x] **Step 1: Define `DEFAULT_INDUSTRIES` array and storage helper functions in `frontend/app.js`**

Add the pre-defined seed list and helper functions near the top of `app.js` or in the initialization block:

```javascript
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
```

- [ ] **Step 2: Implement `initIndustryCombobox` in `frontend/app.js`**

Create the combobox controller function in `app.js`:

```javascript
function initIndustryCombobox() {
    const hiddenInput = document.getElementById('intakeIndustry');
    const searchInput = document.getElementById('intakeIndustrySearch');
    const dropdown = document.getElementById('intakeIndustryDropdown');
    const optionsList = document.getElementById('industryOptionsList');

    if (!hiddenInput || !searchInput || !dropdown || !optionsList) return;

    let dbIndustries = [];

    // Helper to get combined unique active industries list
    function getActiveIndustriesList() {
        const custom = getCustomIndustries();
        const set = new Set([...DEFAULT_INDUSTRIES, ...custom, ...dbIndustries]);
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    // Function to render dropdown options based on filter string
    function renderOptions(filter = '') {
        const list = getActiveIndustriesList();
        const query = filter.trim().toLowerCase();

        const matches = query
            ? list.filter(ind => ind.toLowerCase().includes(query))
            : list;

        let html = '';

        // Check if query exactly matches an existing option
        const exactMatchExists = list.some(ind => ind.toLowerCase() === query);

        // If user typed something new and non-empty, present "+ Add as New Industry"
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

    // Input Focus & Filter Events
    searchInput.addEventListener('focus', () => {
        renderOptions(searchInput.value);
    });

    searchInput.addEventListener('input', () => {
        // Clear hidden input if search field changes away from selected value
        if (hiddenInput.value !== searchInput.value) {
            hiddenInput.value = searchInput.value;
        }
        renderOptions(searchInput.value);
    });

    // Delegate Click Handler for Option Selection & Custom Addition
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

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        const container = document.getElementById('industryComboboxContainer');
        if (container && !container.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Keyboard Navigation (Enter key handling)
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

    // Expose method to load DB industries from proposals array
    window.updateComboboxDbIndustries = function(proposals) {
        if (Array.isArray(proposals)) {
            dbIndustries = proposals.map(p => p.industry).filter(Boolean);
        }
    };
}
```

- [ ] **Step 3: Hook `initIndustryCombobox` into DOMContentLoaded and proposal loading in `frontend/app.js`**

1. Call `initIndustryCombobox();` inside the main `DOMContentLoaded` event listener in `app.js`.
2. Inside `loadDashboardData()`, after receiving proposal data from backend, call `window.updateComboboxDbIndustries(data.proposals || data);`.
3. When resetting intake form on modal open or after submission, ensure both `intakeIndustry.value = ''` and `intakeIndustrySearch.value = ''` are reset.

- [ ] **Step 4: Commit JS implementation**

```bash
git add frontend/app.js
git commit -m "feat(intake): add combobox controller with default seed list and persistent custom industry storage"
```

---

### Task 3: Verification & Integration Testing

- [ ] **Step 1: Run frontend integration verification**

Open `frontend/index.html` in browser or launch dev server.
Verify:
1. Intake modal opens smoothly.
2. Clicking Industry input displays the 22 pre-defined common industries.
3. Typing "Solar" filters down to "Solar, Renewable Energy & EPC".
4. Typing "Niche Aerospace Robotics" shows `+ Add "Niche Aerospace Robotics" as New Industry`.
5. Clicking `+ Add...` selects it and saves to `localStorage`.
6. Submitting a proposal with a custom industry completes successfully and reflects on the dashboard industry breakdown chart.

- [ ] **Step 2: Final git commit**

```bash
git add .
git commit -m "feat: complete pre-defined and persistent custom industry selector implementation"
```
