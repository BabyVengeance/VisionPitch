# Market Visibility Audit Section Refactor — Design Specification

**Date:** 2026-07-21  
**Target File:** `frontend/proposals.html` (and associated script functions)  
**Goal:** Makeover the Market Visibility Audit section of the VisionPitch proposals page to reduce text clutter, remove generic percentage bars, add high-impact visual charts (Spider/Radar Chart + Health Scorecard), and inject strong Red & Green visual color stimulation into competitor and gap cards to build a proposal that closes clients.

---

## 1. Executive Summary & Intent

The current audit section on the proposals page suffers from several conversion bottlenecks:
1. **Wall of Text:** Long paragraph blocks for sentiment analysis and competitor benchmarks cause client fatigue.
2. **Generic % Bars:** Simple progress bars lack depth and authority.
3. **Lack of Visual Impact:** Minimal graphical elements, graphs, or data visualizations.
4. **No Color Stimulation:** Missing explicit red/green contrast to highlight client vulnerabilities versus competitor advantages.

This specification outlines the complete redesign of the Market Visibility Audit section while preserving all underlying dynamic data.

---

## 2. Visual Component Architecture

### A. Market Visibility Audit Hero & Radar Chart Hub
- **Audit Health Badge:** A prominent pill in the audit header displaying the client's overall status (e.g., `CRITICAL DEFICIT — 32/100`) with red accent styling (`bg-red-500/10 text-red-400 border border-red-500/20`).
- **2-Column Split Hub (`grid-cols-1 lg:grid-cols-2 gap-8`)**:
  - **Left Axis — HTML5 Canvas Radar Chart (`<canvas id="radarChart">`)**:
    - Axis 1: Technical SEO
    - Axis 2: AI Search (GEO)
    - Axis 3: Core Web Vitals
    - Axis 4: Schema Infrastructure
    - Overlay 1 (Client): Crimson Red translucent shape (`rgba(239, 68, 68, 0.25)` fill, `#ef4444` stroke).
    - Overlay 2 (Competitor Average): Emerald Green translucent shape (`rgba(16, 185, 129, 0.15)` fill, `#10b981` stroke).
  - **Right Axis — Executive Insight Cards**:
    - Replaces raw sentiment paragraphs with 3 scannable micro-cards:
      1. **Online Sentiment & Authority**: Visual status badge (`[SENTIMENT: NEUTRAL/POSITIVE]`) + crisp bullet summary.
      2. **Competitor Benchmark Gap**: Visual status badge (`[MARKET POSITION: BEHIND]`) + benchmark comparison summary.
      3. **Revenue Risk Summary**: Red warning card detailing lead leakage from missing AI/SEO optimization.

### B. Competitor Strategy Cards (Red & Green Color Stimulation)
- **3-Column Grid (`#competitorGrid`)**:
  - Each competitor card features dual color-stimulated badge pills:
    - **Emerald Green Pill (`+ COMPETITOR ADVANTAGE`)**: Displays what the competitor is leveraging successfully (e.g. SEO Engine, Active Funnels).
    - **Crimson Red Pill (`- CLIENT DEFICIT`)**: Displays the specific vulnerability of the client relative to this competitor.

### C. Optimization Opportunities (Actionable Gap Cards)
- **2-Column Grid (`#gapsContainer`)**:
  - Refactored gap cards containing:
    - **Red Risk Tag (`CRITICAL REVENUE THREAT` / `SEO INVISIBILITY`)**: Highlights the urgency of the problem.
    - **Problem Description**: High-contrast, scannable text detailing the technical gap.
    - **Green Fix Pill (`+ RESOLVED IN PROPOSAL`)**: Links the identified audit problem directly to paid solutions offered in the proposal.

---

## 3. Data Flow & Technical Implementation

1. **Vanilla Canvas Engine (`drawAuditRadarChart`)**:
   - Native JavaScript canvas rendering inside `proposals.html`.
   - Computes radar chart vertices dynamically using trigonometry (`Math.cos`, `Math.sin`).
   - High-DPI screen sharp rendering using `window.devicePixelRatio`.

2. **Dynamic Data Binding**:
   - `data.audit_data.sentiment_analysis`: Processed into scannable key takeaway points.
   - `data.audit_data.competitor_analysis`: Processed into competitor cards with green advantage and red deficit pills.
   - `data.audit_data.gaps`: Rendered as threat cards with green fix indicators.

3. **Styling Tokens & Micro-Interactions**:
   - Tailwind CSS utility classes aligned with zinc dark mode base (`bg-zinc-950`, `border-zinc-900`).
   - Red Accent: `text-red-400`, `bg-red-500/10`, `border-red-500/20`.
   - Green Accent: `text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20`.
   - Press feedback: `active:scale-[0.98]`, `transition-all duration-200 ease-out`.

---

## 4. Verification & Criteria of Success

1. Generic percentage progress bars are completely removed.
2. Market Visibility Audit section features an inline Radar Chart comparing client vs. competitors.
3. Competitor cards prominently display Green (`+ COMPETITOR ADVANTAGE`) and Red (`- CLIENT DEFICIT`) pills.
4. Optimization opportunity cards display Red risk badges and Green resolution pills.
5. All dynamic proposal loading functionality (`loadProposalData`) operates smoothly without breaking.
