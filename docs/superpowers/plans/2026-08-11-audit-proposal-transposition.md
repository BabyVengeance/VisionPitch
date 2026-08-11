# Audit-to-Proposal Transposition Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated, atomic transposition mechanism that synchronizes edited audit data from the Audit Staging Editor (`index.html`) to the live client proposal (`proposals.html`), re-aligning AI recommended service packages and pricing.

**Architecture:** A new backend API endpoint `POST /api/admin/proposals/{proposal_hash}/transpose` updates audit raw JSON in PostgreSQL and calls `realign_services_with_audit()` in `ai_Engine.py` to re-generate service modules tailored to updated visibility gaps. The frontend staging editor provides an "Update & Transpose to Proposal" button with loading spinners, sync status badges, and real-time proposal update notifications.

**Tech Stack:** Python 3.10+, FastAPI, PostgreSQL (psycopg2), Gemini AI API, Vanilla JS, Tailwind CSS.

---

### Task 1: Backend Transpose API Endpoint & AI Scope Generator

**Files:**
- Modify: `backend/ai_Engine.py`
- Modify: `backend/main.py`
- Modify: `backend/test_main.py`

- [ ] **Step 1: Write failing integration test for transpose API**

Add test to `backend/test_main.py`:
```python
def test_transpose_proposal_audit():
    # Setup test client & proposal
    response = client.post("/api/proposals/generate", json={
        "client_name": "Test Transpose Client",
        "company_name": "Transpose Co",
        "industry": "Real Estate & Property Development",
        "website_url": "https://transpose-test.co.za",
        "budget": 20000
    })
    assert response.status_code == 200
    data = response.json()
    proposal_hash = data["proposal_hash"]

    # Transpose payload
    transpose_payload = {
        "overall_score": 45,
        "scores": [45, 50, 40, 42],
        "online_sentiment_review": "Updated executive sentiment review text.",
        "visibility_gaps": [
            "Missing structured local Schema markup.",
            "Suboptimal mobile Core Web Vitals LCP score."
        ],
        "competitor_analysis": [
            {"name": "Competitor A", "platform_leveraged": "Ads", "revenue_advantage": "High conversion"}
        ],
        "recalculate_services": True
    }

    transpose_res = client.post(f"/api/admin/proposals/{proposal_hash}/transpose", json=transpose_payload)
    assert transpose_res.status_code == 200
    res_data = transpose_res.json()
    assert res_data["status"] == "Success"
    assert "recommended_services" in res_data
    assert len(res_data["recommended_services"]) > 0
```

- [ ] **Step 2: Run test to verify failure**

Run: `pytest backend/test_main.py -k test_transpose_proposal_audit`
Expected: FAIL with 404/405 Not Found or 422 Unprocessable Entity.

- [ ] **Step 3: Implement `realign_services_with_audit` in `backend/ai_Engine.py`**

Add function in `backend/ai_Engine.py`:
```python
def realign_services_with_audit(
    client_name: str,
    company_name: str,
    industry: str,
    budget: Optional[float],
    audit_data: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generates tailored recommended service modules based on updated audit scores and visibility gaps."""
    if not model:
        logger.warning("Gemini AI model uninitialized; using fallback service realignment template.")
        return [
            {
                "module_name": "Technical SEO & CWV Sprint",
                "deliverables": "Fix Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) issues.",
                "estimated_cost": 8500,
                "roi_impact": "High boost to search ranking authority and page load speed."
            },
            {
                "module_name": "Generative AI Search Optimization (GEO)",
                "deliverables": "Implement Schema.org entities to index client profile in LLM knowledge bases.",
                "estimated_cost": 6500,
                "roi_impact": "Captures AI search queries on ChatGPT, Claude, and Gemini."
            }
        ]

    gaps_str = "\n".join(f"- {g}" for g in audit_data.get("visibility_gaps", []))
    prompt = f"""
    You are Apex Digital's Senior Solution Architect.
    Client: {company_name} ({industry})
    Budget: R{budget if budget else 15000}
    Updated Audit Gaps:
    {gaps_str}

    Return a JSON array of 3 to 4 high-converting recommended service modules specifically fixing these audit gaps.
    JSON output format only:
    [
        {{
            "module_name": "Service Title",
            "deliverables": "Detailed deliverables resolving the gap",
            "estimated_cost": 7500,
            "roi_impact": "Expected outcome and revenue impact"
        }}
    ]
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        modules = json.loads(text)
        return modules
    except Exception as e:
        logger.error("AI service realignment error: %s", e)
        return [
            {
                "module_name": "Strategic Audit Remediation Package",
                "deliverables": "Comprehensive technical fix for identified audit deficits.",
                "estimated_cost": float(budget or 12000),
                "roi_impact": "Direct alignment of digital presence with market standards."
            }
        ]
```

- [ ] **Step 4: Add `AuditTransposePayload` model & `POST /api/admin/proposals/{proposal_hash}/transpose` endpoint in `backend/main.py`**

In `backend/main.py`:
```python
class AuditTransposePayload(BaseModel):
    overall_score: Optional[int] = None
    scores: Optional[List[int]] = None
    online_sentiment_review: Optional[str] = None
    competitor_analysis: Optional[List[Dict[str, Any]]] = None
    visibility_gaps: Optional[List[str]] = None
    competitor_benchmarks: Optional[str] = None
    rep_notes: Optional[str] = None
    competitors_list: Optional[List[str]] = None
    recalculate_services: bool = True

@app.post("/api/admin/proposals/{proposal_hash}/transpose")
async def transpose_proposal_audit(proposal_hash: str, payload: AuditTransposePayload):
    """Atomically updates audit details and re-aligns proposal service scope and pricing."""
    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        query = '''
            SELECT p.proposal_id, p.audit_raw_json, p.recommended_services, c.client_id, c.client_name, c.company_name, c.industry, c.budget
            FROM proposals p
            JOIN clients c ON p.client_id = c.client_id
            WHERE p.proposal_hash = %s
        '''
        cursor.execute(query, (proposal_hash,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal record not located.")

        record = dict(row)
        audit_data = json.loads(record["audit_raw_json"])

        # Update audit fields if provided
        if payload.overall_score is not None:
            audit_data["overall_score"] = payload.overall_score
        if payload.scores is not None:
            audit_data["scores"] = payload.scores
        if payload.online_sentiment_review is not None:
            audit_data["online_sentiment_review"] = payload.online_sentiment_review
        if payload.competitor_analysis is not None:
            audit_data["competitor_analysis"] = payload.competitor_analysis
        if payload.visibility_gaps is not None:
            audit_data["visibility_gaps"] = payload.visibility_gaps
        if payload.competitor_benchmarks is not None:
            audit_data["competitor_benchmarks"] = payload.competitor_benchmarks
        if payload.rep_notes is not None:
            audit_data["rep_notes"] = payload.rep_notes
        if payload.competitors_list is not None:
            audit_data["competitors_list"] = payload.competitors_list

        audit_data["last_transposed_at"] = secrets.token_hex(4)

        # Re-align recommended services if flag set
        recommended_services = json.loads(record["recommended_services"])
        if payload.recalculate_services:
            from ai_Engine import realign_services_with_audit
            recommended_services = realign_services_with_audit(
                client_name=record["client_name"],
                company_name=record["company_name"],
                industry=record["industry"],
                budget=record["budget"],
                audit_data=audit_data
            )

        new_final_price = sum(float(m.get("estimated_cost", 0)) for m in recommended_services)
        updated_audit_json = json.dumps(audit_data)
        updated_services_json = json.dumps(recommended_services)

        cursor.execute('''
            UPDATE proposals
            SET audit_raw_json = %s, recommended_services = %s, final_price = %s
            WHERE proposal_hash = %s
        ''', (updated_audit_json, updated_services_json, new_final_price, proposal_hash))

    logger.info("Proposal %s cleanly transposed with updated audit & scope", proposal_hash)
    return {
        "status": "Success",
        "message": "Audit and proposal scope successfully transposed.",
        "proposal_hash": proposal_hash,
        "final_price": new_final_price,
        "audit_data": audit_data,
        "recommended_services": recommended_services
    }
```

- [ ] **Step 5: Run integration tests to verify pass**

Run: `pytest backend/test_main.py`
Expected: PASS all tests.

- [ ] **Step 6: Commit**

```bash
git add backend/ai_Engine.py backend/main.py backend/test_main.py
git commit -m "feat(api): add proposal transpose endpoint with AI scope alignment"
```

---

### Task 2: Frontend Staging Editor Modal Transposition Controls (`index.html` & `app.js`)

**Files:**
- Modify: `frontend/index.html:1210-1227`
- Modify: `frontend/app.js`

- [ ] **Step 1: Add Transpose CTA button and sync status elements in `frontend/index.html`**

Update modal footer in `frontend/index.html`:
```html
<!-- Footer Controls -->
<div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
    <div class="flex items-center gap-2">
        <span id="stagingStatusMessage" class="text-xs font-bold text-zinc-500 dark:text-zinc-400"></span>
        <span id="syncBadge" class="hidden text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ✓ Transposed to Live Proposal
        </span>
    </div>
    <div class="flex flex-wrap gap-2.5 w-full sm:w-auto">
        <button type="button" id="closeStagingEditorBtn" class="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-zinc-200 dark:border-zinc-800">
            Discard
        </button>
        <button type="button" id="saveStagingAuditBtn" class="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md">
            Save Draft
        </button>
        <button type="button" id="transposeAuditToProposalBtn" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 active:scale-95">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <span id="transposeBtnText">Update & Transpose to Proposal</span>
        </button>
    </div>
</div>
```

- [ ] **Step 2: Bind transposition logic in `frontend/app.js`**

Add event listener to `transposeAuditToProposalBtn` in `frontend/app.js`:
```javascript
const transposeBtn = document.getElementById('transposeAuditToProposalBtn');
const transposeBtnText = document.getElementById('transposeBtnText');
const syncBadge = document.getElementById('syncBadge');

if (transposeBtn) {
    transposeBtn.addEventListener('click', async () => {
        if (!currentStagingProposalHash) {
            showToast('No active proposal loaded in staging editor', 'error');
            return;
        }

        transposeBtn.disabled = true;
        if (transposeBtnText) transposeBtnText.textContent = 'Transposing & Re-aligning Scope...';

        try {
            // Collect form data from staging editor tabs
            const overallScore = parseInt(document.getElementById('stagingOverallScoreInput')?.value || '32', 10);
            const techScore = parseInt(document.getElementById('stagingTechSeoScoreInput')?.value || '32', 10);
            const geoScore = parseInt(document.getElementById('stagingGeoScoreInput')?.value || '20', 10);
            const cwvScore = parseInt(document.getElementById('stagingCwvScoreInput')?.value || '38', 10);
            const schemaScore = parseInt(document.getElementById('stagingSchemaScoreInput')?.value || '25', 10);
            const sentimentText = document.getElementById('stagingSentimentInput')?.value || '';
            const repNotesText = document.getElementById('stagingRepNotesInput')?.value || '';

            // Collect visibility gaps array
            const gapInputs = document.querySelectorAll('.stagingGapInput');
            const gaps = Array.from(gapInputs).map(i => i.value.trim()).filter(Boolean);

            const payload = {
                overall_score: overallScore,
                scores: [techScore, geoScore, cwvScore, schemaScore],
                online_sentiment_review: sentimentText,
                visibility_gaps: gaps,
                rep_notes: repNotesText,
                recalculate_services: true
            };

            const res = await fetch(`${API_BASE}/api/admin/proposals/${currentStagingProposalHash}/transpose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Transposition failed: ${res.statusText}`);

            const data = await res.json();
            showToast('Audit & Proposal Scope successfully transposed!', 'success');

            if (syncBadge) {
                syncBadge.classList.remove('hidden');
            }

            // Refresh sales table data
            if (typeof loadAdminProposals === 'function') {
                loadAdminProposals();
            }

        } catch (err) {
            console.error('Transposition error:', err);
            showToast(`Transposition failed: ${err.message}`, 'error');
        } finally {
            transposeBtn.disabled = false;
            if (transposeBtnText) transposeBtnText.textContent = 'Update & Transpose to Proposal';
        }
    });
}
```

- [ ] **Step 3: Test manually in browser**

Open dashboard in browser, click "Staging Editor", modify values, click "Update & Transpose to Proposal", verify toast & sync status badge.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/app.js
git commit -m "feat(frontend): add transpose CTA button and real-time staging sync handlers"
```

---

### Task 3: Live Proposal Verification & Transposition End-to-End Validation

**Files:**
- Test: `frontend/proposals.html`
- Test: `backend/test_main.py`

- [ ] **Step 1: Verify `proposals.html` dynamic rendering of transposed data**

Ensure `frontend/proposals.html` renders:
1. `#auditRadarCanvas` with new score arrays.
2. `#sentimentSummary` with updated executive sentiment.
3. `#gapsContainer` with updated visibility gap bullet points.
4. `#servicesContainer` and `#grandTotal` with updated recommended service modules and pricing.

- [ ] **Step 2: Run full backend test suite**

Run: `pytest backend/`
Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "test: verify end-to-end audit transposition flow"
```
