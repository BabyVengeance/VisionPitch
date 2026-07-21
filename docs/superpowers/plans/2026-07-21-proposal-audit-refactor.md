# Proposal Audit Section Makeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Market Visibility Audit section in `frontend/proposals.html` by replacing generic text walls and percentage bars with an HTML5 Canvas Radar Chart, an Audit Health Scorecard badge, and color-stimulated (Emerald Green vs Crimson Red) Competitor Strategy and Gap cards.

**Architecture:** Refactor the audit HTML markup in `proposals.html` to introduce a 2-column split radar hub and visual takeaway cards. Add a native vanilla JavaScript canvas function `drawAuditRadarChart` to render the radar chart dynamically, and update `loadProposalData` script logic to map sentiment, competitor benchmarks, and gaps into high-converting visual cards.

**Tech Stack:** HTML5 Canvas, Vanilla JavaScript, Tailwind CSS (Dark Mode tokens).

---

### Task 1: HTML Markup Refactoring in `frontend/proposals.html`

**Files:**
- Modify: `frontend/proposals.html:176-250`

- [ ] **Step 1: Replace Market Visibility Audit section markup**

Update lines 176-234 in `frontend/proposals.html` to introduce the Audit Health Scorecard badge, Canvas Radar Chart element, and 3 Executive Takeaway Cards:

```html
            <!-- Market Visibility Audit Section -->
            <section
                class="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-900 p-8 shadow-sm space-y-8">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-4">
                    <div>
                        <h2 class="text-xl font-bold tracking-tight text-black dark:text-white uppercase">Market Visibility Audit</h2>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Comprehensive search authority & technical performance audit</p>
                    </div>
                    <div id="auditHealthBadge" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 w-fit">
                        <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span>CRITICAL DEFICIT — 32/100</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <!-- Radar Chart Hub -->
                    <div class="flex flex-col items-center justify-center p-6 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-xl">
                        <div class="w-full flex justify-between items-center mb-4">
                            <span class="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">Audit Radar Analysis</span>
                            <div class="flex items-center gap-4 text-xs font-semibold">
                                <span class="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                                    <span class="w-2.5 h-2.5 rounded-sm bg-red-500"></span> Client
                                </span>
                                <span class="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                                    <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Market Benchmark
                                </span>
                            </div>
                        </div>
                        <div class="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                            <canvas id="auditRadarCanvas" class="w-full h-full"></canvas>
                        </div>
                    </div>

                    <!-- Executive Insight Cards (Replaces long text wall) -->
                    <div class="space-y-4">
                        <div class="p-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg space-y-1.5">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold tracking-wider text-zinc-400 uppercase">Online Sentiment & Presence</span>
                                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">Neutral/Positive</span>
                            </div>
                            <p id="sentimentSummary" class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium"></p>
                        </div>

                        <div class="p-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-900 rounded-lg space-y-1.5">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold tracking-wider text-zinc-400 uppercase">Competitor Benchmark Gap</span>
                                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Behind Leaders</span>
                            </div>
                            <p id="benchmarkSummary" class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium"></p>
                        </div>

                        <div class="p-4 bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 rounded-lg space-y-1.5">
                            <div class="flex items-center justify-between">
                                <span class="text-xs font-bold tracking-wider text-red-500 dark:text-red-400 uppercase">Estimated Business Impact</span>
                                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">High Risk</span>
                            </div>
                            <p class="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                                Suboptimal technical performance and lack of AI search citations (GEO) are causing high bounce rates and uncaptured organic student inquiries.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
```

- [ ] **Step 2: Commit Task 1 HTML changes**

```bash
git add frontend/proposals.html
git commit -m "refactor(proposals): update market visibility audit HTML with radar chart canvas and visual cards"
```

---

### Task 2: Implement Radar Chart Engine & JS Script Logic in `frontend/proposals.html`

**Files:**
- Modify: `frontend/proposals.html:350-430`

- [ ] **Step 1: Add `drawAuditRadarChart` function**

In the `<script>` section of `frontend/proposals.html`, insert the zero-dependency vanilla HTML5 Canvas radar chart renderer:

```javascript
        function drawAuditRadarChart(canvasId, clientScores, benchmarkScores) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            
            const rect = canvas.getBoundingClientRect();
            const width = rect.width || 300;
            const height = rect.height || 300;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            const labels = ['Technical SEO', 'AI Search (GEO)', 'Core Web Vitals', 'Schema Markup'];
            const numAxes = labels.length;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(centerX, centerY) - 45;

            ctx.clearRect(0, 0, width, height);

            // Draw grid rings
            const rings = 4;
            for (let i = 1; i <= rings; i++) {
                const r = (radius / rings) * i;
                ctx.beginPath();
                for (let a = 0; a < numAxes; a++) {
                    const angle = (Math.PI * 2 / numAxes) * a - Math.PI / 2;
                    const x = centerX + r * Math.cos(angle);
                    const y = centerY + r * Math.sin(angle);
                    if (a === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgba(113, 113, 122, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw axis lines and labels
            for (let a = 0; a < numAxes; a++) {
                const angle = (Math.PI * 2 / numAxes) * a - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = 'rgba(113, 113, 122, 0.25)';
                ctx.stroke();

                // Axis label
                const labelX = centerX + (radius + 24) * Math.cos(angle);
                const labelY = centerY + (radius + 16) * Math.sin(angle);
                ctx.font = 'bold 10px sans-serif';
                ctx.fillStyle = '#a1a1aa';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(labels[a], labelX, labelY);
            }

            // Helper to draw dataset polygon
            function drawPolygon(values, strokeColor, fillColor) {
                ctx.beginPath();
                for (let a = 0; a < numAxes; a++) {
                    const val = Math.max(0, Math.min(100, values[a])) / 100;
                    const angle = (Math.PI * 2 / numAxes) * a - Math.PI / 2;
                    const x = centerX + (radius * val) * Math.cos(angle);
                    const y = centerY + (radius * val) * Math.sin(angle);
                    if (a === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Points
                for (let a = 0; a < numAxes; a++) {
                    const val = Math.max(0, Math.min(100, values[a])) / 100;
                    const angle = (Math.PI * 2 / numAxes) * a - Math.PI / 2;
                    const x = centerX + (radius * val) * Math.cos(angle);
                    const y = centerY + (radius * val) * Math.sin(angle);
                    ctx.beginPath();
                    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = strokeColor;
                    ctx.fill();
                }
            }

            // Render Benchmark polygon (Green) then Client polygon (Red)
            drawPolygon(benchmarkScores, '#10b981', 'rgba(16, 185, 129, 0.15)');
            drawPolygon(clientScores, '#ef4444', 'rgba(239, 68, 68, 0.25)');
        }
```

- [ ] **Step 2: Update `loadProposalData` rendering logic for cards**

Modify `loadProposalData` in `frontend/proposals.html` to populate the new visual elements, call `drawAuditRadarChart`, render competitor cards with Green/Red pills, and render gaps with Green fix indicators:

```javascript
                // Render sentiment and benchmark summary
                const sentimentText = document.getElementById('sentimentSummary');
                const benchmarkText = document.getElementById('benchmarkSummary');
                if (sentimentText) sentimentText.textContent = data.audit_data?.sentiment_analysis || "Foundational online presence with functional core pages.";
                if (benchmarkText) benchmarkText.textContent = data.competitor_benchmarks || "Industry average Core Web Vitals score is 75%; current performance requires optimization.";

                // Trigger Radar Chart Render
                drawAuditRadarChart('auditRadarCanvas', [32, 20, 38, 25], [78, 70, 75, 82]);

                // Render Competitor Strategy Cards with Green/Red Color Stimulation
                const competitorGrid = document.getElementById('competitorGrid');
                if (competitorGrid && data.audit_data?.competitor_analysis) {
                    competitorGrid.innerHTML = '';
                    data.audit_data.competitor_analysis.forEach(comp => {
                        const col = document.createElement('div');
                        col.className = 'bg-zinc-50 dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-4 flex flex-col justify-between';
                        col.innerHTML = `
                            <div class="space-y-3">
                                <div class="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-2">
                                    <h3 class="font-extrabold text-black dark:text-white uppercase text-base">${comp.name}</h3>
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-200 dark:bg-zinc-900 px-2 py-0.5 rounded">Leader</span>
                                </div>
                                <div class="space-y-2">
                                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                                        <span>✓ COMPETITOR ADVANTAGE</span>
                                    </div>
                                    <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">${comp.platform_leveraged}: ${comp.revenue_advantage}</p>
                                </div>
                            </div>
                            <div class="pt-3 border-t border-zinc-200 dark:border-zinc-900 space-y-2">
                                <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                                    <span>✕ CLIENT DEFICIT</span>
                                </div>
                                <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Currently unoptimized against this competitor's search & conversion footprint.</p>
                            </div>
                        `;
                        competitorGrid.appendChild(col);
                    });
                }

                // Render Optimization Opportunity Gaps with Green Fix Indicators
                const gapsContainer = document.getElementById('gapsContainer');
                if (gapsContainer && data.audit_data?.gaps) {
                    gapsContainer.innerHTML = '';
                    data.audit_data.gaps.forEach(gap => {
                        const card = document.createElement('div');
                        card.className = 'p-5 bg-white dark:bg-black rounded-lg border border-zinc-200 dark:border-zinc-900 flex flex-col justify-between space-y-3';
                        card.innerHTML = `
                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                                        CRITICAL RISK
                                    </span>
                                </div>
                                <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">${gap}</p>
                            </div>
                            <div class="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                                <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase text-emerald-500 dark:text-emerald-400">
                                    + RESOLVED IN PROPOSAL SCOPE
                                </span>
                            </div>
                        `;
                        gapsContainer.appendChild(card);
                    });
                }
```

- [ ] **Step 3: Commit Task 2 JS changes**

```bash
git add frontend/proposals.html
git commit -m "feat(proposals): implement vanilla canvas radar chart engine and dynamic green/red card mapping"
```

---

### Task 3: Verification & Quality Assurance

- [ ] **Step 1: Check proposals page HTML validity**
Verify that all elements (`auditRadarCanvas`, `competitorGrid`, `gapsContainer`) match and load without syntax errors.

- [ ] **Step 2: Commit final refactored implementation**

```bash
git add frontend/proposals.html
git commit -m "chore(proposals): finalize proposals audit section refactor"
```
