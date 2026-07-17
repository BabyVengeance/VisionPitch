# Technical Design Specification: Dynamic & Transparent Proposals Template

## 1. Goal Description
The objective is to refine and expand `frontend/proposals.html` into a production-ready, dynamic sales template that:
1. Matches the monochrome, modern branding and light/dark theme system of `login.html` and `index.html`.
2. Integrates with the backend `/api/proposals/{proposal_hash}` endpoint using Vanilla JS and the Fetch API.
3. Automatically marks the proposal as "Proposal viewed" in the SQLite database upon retrieval.
4. Renders the dynamic audit metrics, sentiment analysis, competitor evaluation, and suggested service modules.
5. Employs transparent interactive pricing sliders (Timeline Velocity and Scope Depth) with explicit real-time mathematical breakdown, leaving zero guessing for the client.
6. Captures and saves the HTML5 signature coordinates as a compressed base64 string, posting to `/api/proposals/{proposal_hash}/finalize` to update the client status to "Proposal signed".

---

## 2. Branding & Theme Specification

### 2.1 Theme Support (Light / Dark)
The template will adopt the same CSS transitions and Tailwind configuration settings as `index.html` and `login.html`.
- **Classes:**
  - Light mode: `bg-white text-black` with cards/tables utilizing `bg-zinc-50 border-zinc-200`.
  - Dark mode: `bg-black text-zinc-100` with cards/tables utilizing `bg-zinc-950 border-zinc-900`.
- **Transitions:** `.theme-transition, .theme-transition *` for smooth 0.3s transitions across color, border, background, and shadow properties.
- **Toggle Icon:** Clean SVG sun/moon icons in the header to switch class list triggers.

### 2.2 Navigation Header
- **Logos:** Shows `Assets/Black logo.png` in light mode, and `Assets/White logo.png` in dark mode.
- **Client Metadata Display:** Sub-text badge reading `"Prepared for: [Company Name]"`.
- **Call-to-Action / Status Badge:** A status indicator badge styled dynamically based on the proposal status (e.g. `Generated`, `Viewed`, `Signed`).

---

## 3. Dynamic Section Schemas

### 3.1 Loading Shell & Error Page
- **Loading State:** Shimmering skeleton cards to represent standard paragraphs, competitor columns, and service slider cards.
- **Error State:** A clean visual boundary overlay stating "Invalid Proposal Link" or "Proposal Expired" if the fetch query returns 404 or 500, with support links.

### 3.2 Content Panels
- **Executive Summary & Sentiment Index:**
  - Renders `online_sentiment_review` block.
  - Adds a dynamic visual tag (Positive, Neutral, Warning) to summarize online sentiment.
- **Competitor Bento Grid:**
  - Loops through the `competitor_analysis` array (up to 3 entries) and constructs clean grid columns.
  - Columns display the competitor name, platform leveraged, and revenue advantages.
- **Visibility Gaps & Benchmarks Split:**
  - *Left Column:* Dynamic tags for each item in `visibility_gaps` with standard checklist bullet icons.
  - *Right Column:* Renders the `competitor_benchmarks` summary string inside a premium card block.

---

## 4. Mathematical Scoping Slider Specs
Every suggested service item will be loaded dynamically into its own card with:
1. **Details:** Title, Description, Base Hours, and Hourly Rate.
2. **Timeline Multiplier (Speed):**
   - Options: Rush (2 Weeks) / Standard (4 Weeks) / Extended (8 Weeks).
   - Multipliers: Rush = `1.30`, Standard = `1.00`, Extended = `0.90`.
3. **Scope Multiplier (Depth):**
   - Options: Essential (50% Hours) / Standard (100% Hours) / Enterprise (150% Hours).
   - Multipliers: Essential = `0.50`, Standard = `1.00`, Enterprise = `1.50`.
4. **Transparency Math Box:**
   - Evaluates:
     $$\text{Calculated Price} = (\text{Base Hours} \times \text{Hourly Rate}) \times \text{Timeline Multiplier} \times \text{Scope Multiplier}$$
   - Displays this formula literally on-screen:
     `[Base Hours] hrs x R[Hourly Rate]/hr = R[Base Cost] x [Timeline Multiplier] x [Scope Multiplier] = R[Final Cost]`
5. **Grand Total Invoice Display:**
   - Computes sum of all adjusted services.
   - Saves final figures for submission.

---

## 5. Signature Authorization & Closing API Integration
- **HTML5 Canvas Pad:** Captures drawing lines. Works on touch (mobile) and pointer devices.
- **Submission payload:**
  - POST to `/api/proposals/{proposal_hash}/finalize`
  - Body:
    ```json
    {
      "final_price": 12500.0,
      "signature_base64": "data:image/png;base64,...",
      "status": "Proposal signed"
    }
    ```
  - Disables form sliders and inputs once the contract status has been marked as signed.

---

## 6. Verification Plan
- **Automated Tests:** Run client status updates and assert pricing calculations in unit tests.
- **Manual Verification:** Open proposal links in Light and Dark mode, test slider dynamic math calculations, sign the pad, click submit, and confirm client database update from the dashboard.
