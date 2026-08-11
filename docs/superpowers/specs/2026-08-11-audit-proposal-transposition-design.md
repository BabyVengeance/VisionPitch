# VisionPitch Audit-to-Proposal Transposition Engine Design Spec

## Overview
The Audit-to-Proposal Transposition Engine provides an automated, atomic synchronization mechanism between edited audit staging data in the Admin Staging Editor (`index.html`) and the live client proposal view (`proposals.html`). When a sales representative edits audit scores, executive reviews, strategic visibility gaps, or competitor benchmarks, clicking **"Update & Transpose to Proposal"** atomically updates the stored audit state, re-aligns the AI-recommended service packages and pricing, and ensures 100% alignment across all proposal assets.

---

## User Review & Key Decisions
- **Option Selected**: Complete Transposition (Option 1).
- **Execution Strategy**: Synchronous AI Alignment & Atomic Transposition (Approach 1).
- **Primary CTA**: "Update & Transpose to Proposal" inside the Audit Staging Editor Modal footer.

---

## Technical Specifications

### 1. Backend Architecture (`backend/main.py` & `backend/ai_Engine.py`)

#### API Endpoint: `POST /api/admin/proposals/{proposal_hash}/transpose`
* **Request Payload (`AuditTransposePayload`)**:
  - `overall_score`: `Optional[int]`
  - `scores`: `Optional[List[int]]`
  - `online_sentiment_review`: `Optional[str]`
  - `competitor_analysis`: `Optional[List[Dict[str, Any]]]`
  - `visibility_gaps`: `Optional[List[str]]`
  - `competitor_benchmarks`: `Optional[str]`
  - `rep_notes`: `Optional[str]`
  - `competitors_list`: `Optional[List[str]]`
  - `recalculate_services`: `bool = True`

* **Backend Flow**:
  1. Fetch current `proposal` record by `proposal_hash`.
  2. Update `audit_raw_json` with all modified audit metrics, scores, text reviews, visibility gaps, competitor analysis, and rep notes.
  3. If `recalculate_services` is `True`, invoke `realign_services_with_audit()` in `ai_Engine.py` to generate an updated list of 3–5 recommended Apex Digital service modules mapped directly to fix the newly defined visibility gaps.
  4. Recalculate `final_price = sum(module['estimated_cost'])`.
  5. Commit `audit_raw_json`, `recommended_services`, and `final_price` within an atomic database transaction.
  6. Return updated proposal state and `last_transposed_at` timestamp.

#### AI Scope Alignment Helper (`backend/ai_Engine.py`)
* `realign_services_with_audit(client_name, company_name, industry, budget, audit_data)`:
  - Constructs a prompt for Gemini AI containing the updated audit scores, executive review, and strategic visibility gaps.
  - Returns a structured JSON array of recommended service modules (title, description, key deliverables, estimated cost, ROI impact).

---

### 2. Frontend Staging Modal & Interaction Flow (`frontend/index.html` & `frontend/app.js`)

#### Modal Controls (`frontend/index.html`)
* Add `#transposeAuditToProposalBtn` CTA button in `#auditStagingEditorModal` footer:
  - Text: `"Update & Transpose to Proposal"`
  - Icon: Refresh / Transpose arrow icon
  - Color: Primary Accent (Electric Blue `#2563EB`)
* Add `#stagingStatusMessage` and `#syncBadge` for real-time status indication (e.g., `✓ In Sync with Proposal`).

#### Event Handling (`frontend/app.js`)
* Bind click handler to `#transposeAuditToProposalBtn`:
  1. Trigger button loading state (`"Re-aligning Proposal Scope..."` + spinner).
  2. Scrape current tab form values from Staging Editor (scores, sentiment review text, gap items, competitor cards, rep notes).
  3. Send `POST /api/admin/proposals/${proposal_hash}/transpose`.
  4. On success:
     - Update status message and display sync badge (`✓ In Sync with Proposal`).
     - Update admin dashboard proposals table (`final_price`, `client_status`).
     - Display success toast with direct button to `"Preview Live Proposal"`.

---

### 3. Live Client Proposal Rendering (`frontend/proposals.html`)
Upon opening or refreshing `proposals.html?id={hash}`:
* `auditRadarCanvas` renders updated scores & deficit badges.
* `#sentimentSummary` renders updated executive sentiment text.
* `#competitorGrid` renders updated competitor benchmark cards.
* `#gapsContainer` renders updated strategic visibility gap bullet points.
* `#servicesContainer` and `#grandTotal` render re-aligned Apex Digital service packages and grand total budget.

---

## Verification Plan

### Automated & Manual Verification
1. **Backend Integration Tests**:
   - Run `pytest` on `backend/test_main.py` ensuring transpose API endpoint correctly updates database records.
2. **End-to-End Staging Transposition Flow**:
   - Open Audit Staging Editor for a client on the sales dashboard.
   - Modify scores, edit executive sentiment text, add a custom visibility gap.
   - Click **"Update & Transpose to Proposal"**.
   - Verify loading spinner, status badge update, and database persistence.
   - Open proposal preview link (`proposals.html?id={hash}`) and confirm all edited audit sections and recommended services reflect the updates accurately.
