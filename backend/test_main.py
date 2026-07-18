import pytest
from fastapi.testclient import TestClient

# Import components from main and ai_Engine
from main import app, sanitize_input
from ai_Engine import run_ai_audit

client = TestClient(app)

# Helper function representing the slider calculation algorithm
def calculate_markup_price(base_cost: float, multiplier: float) -> float:
    """
    Computes final project cost applying dynamic velocity/scope multipliers.
    A timeline speed-up of 20% maps to a 1.20x multiplier.
    """
    return base_cost * multiplier


# =====================================================================
# Unit Test 1: Pricing Engine Verification (Scope/Timeline Multipliers)
# =====================================================================
def test_pricing_engine_multiplier():
    """
    Verifies that a service baseline fee of R1,000 matches R1,200 
    exactly when a 20% timeline speed-up (1.20x multiplier) is applied.
    """
    base_cost = 1000.0
    multiplier = 1.20
    expected_cost = 1200.0
    
    assert calculate_markup_price(base_cost, multiplier) == expected_cost


# =====================================================================
# Unit Test 2: Form Sanitization & Input Validation
# =====================================================================
def test_sanitize_input_strips_html_and_scripts():
    """
    Tests input security filters by feeding HTML tag structures,
    XSS scripts, and event handlers to verify that they are stripped.
    """
    malicious_html = "<h1>Apex Digital</h1><script>alert('xss')</script>"
    clean_html = sanitize_input(malicious_html)
    
    # Assert tags are stripped
    assert "<h1>" not in clean_html
    assert "</h1>" not in clean_html
    assert "<script>" not in clean_html
    assert "</script>" not in clean_html
    assert "alert('xss')" in clean_html

    malicious_event = "<div onclick='malicious()'>Safe Content</div>"
    clean_event = sanitize_input(malicious_event)
    
    # Assert tag and event handler are stripped
    assert "onclick" not in clean_event
    assert "<div>" not in clean_event
    assert "Safe Content" in clean_event


def test_intake_validation_raises_400_when_urls_empty():
    """
    Tests endpoint constraints to verify it throws an HTTP 400 Bad Request
    when both website_url and social_media_urls are blank.
    """
    payload = {
        "client_name": "Test Client",
        "company_name": "Test Company",
        "industry": "Technology",
        "website_url": "",
        "social_media_urls": "",
        "budget": 10000.0
    }
    
    response = client.post("/api/proposals/generate", json=payload)
    
    assert response.status_code == 400
    assert "Either website or social media URL is required" in response.json()["detail"]


# =====================================================================
# Unit Test 3: Budget Constraint & Optional Rule Checks
# =====================================================================
def test_ai_audit_fallback_respects_budget_thresholds():
    """
    Verifies that when a budget is specified, the suggested modules sum fits 
    comfortably within budget rules (between 60% and 100% of the budget),
    and when a budget is omitted (None), it falls back to standard R10k-R30k rates.
    """
    # 1. Budget specified: R15,000
    budget = 15000.0
    result = run_ai_audit("Test Client", "Test Company", "Testing", "http://test.com", "social", budget)
    total_proposed = sum(item["estimated_cost"] for item in result["suggested_modules"])
    
    # Assert proposed total fits within the budget (60% to 100%)
    assert total_proposed <= budget
    assert total_proposed >= budget * 0.60
    
    # 2. Budget not specified: None
    result_nobudget = run_ai_audit("Test Client", "Test Company", "Testing", "http://test.com", "social", None)
    total_proposed_nobudget = sum(item["estimated_cost"] for item in result_nobudget["suggested_modules"])
    
    # Assert standard baseline ZAR pricing is between R10,000 and R30,000
    assert total_proposed_nobudget >= 10000.0
    assert total_proposed_nobudget <= 30000.0


def test_generate_proposal_without_budget_succeeds():
    """
    Verifies that posting an intake form with budget set to null/omitted succeeds
    in the database and generates a valid preview link.
    """
    payload = {
        "client_name": "Test Null Budget",
        "company_name": "Nullable Ltd",
        "industry": "Consulting",
        "website_url": "https://nullable.co.za",
        "social_media_urls": None,
        "budget": None
    }
    
    response = client.post("/api/proposals/generate", json=payload)
    
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "Success"
    assert "proposals.html?id=" in json_data["preview_link"]


# =====================================================================
# Unit Test 4: Digital Signature Finalization flow
# =====================================================================
def test_finalize_proposal_flow():
    """
    Tests the digital signature finalization flow, validating signature submittal,
    status transition logic, and constraints.
    """
    # 1. Generate a test proposal
    payload = {
        "client_name": "Test Finalize Client",
        "company_name": "Finalize Inc",
        "industry": "Software",
        "website_url": "https://finalize.com",
        "social_media_urls": None,
        "budget": 20000.0
    }
    response = client.post("/api/proposals/generate", json=payload)
    assert response.status_code == 200
    preview_link = response.json()["preview_link"]
    proposal_hash = preview_link.split("id=")[1]

    # 2. Finalize with valid payload
    finalize_payload = {
        "final_price": 18500.0,
        "signature_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "status": "Proposal signed"
    }
    finalize_response = client.post(f"/api/proposals/{proposal_hash}/finalize", json=finalize_payload)
    assert finalize_response.status_code == 200
    assert finalize_response.json()["status"] == "Success"

    # 3. Verify status in database by fetching proposal
    get_response = client.get(f"/api/proposals/{proposal_hash}")
    assert get_response.status_code == 200
    assert get_response.json()["client_status"] == "Proposal signed"

    # 4. Finalize with invalid status should raise HTTP 400
    invalid_payload = {
        "final_price": 18500.0,
        "signature_base64": "data:image/png;base64,...",
        "status": "Proposal viewed"
    }
    invalid_response = client.post(f"/api/proposals/{proposal_hash}/finalize", json=invalid_payload)
    assert invalid_response.status_code == 400

    # 5. Finalize with invalid hash should raise HTTP 404
    error_response = client.post("/api/proposals/nonexistenthash/finalize", json=finalize_payload)
    assert error_response.status_code == 404


# =====================================================================
# Unit Test 5: Client Deletion and Dashboard Query tests
# =====================================================================
def test_client_deletion_and_dashboard_query():
    """
    Verifies that deleting a client record successfully cascade-deletes their 
    associated proposal and verifies that p.audit_raw_json is loaded in the dashboard query.
    """
    # 1. Generate client and proposal
    payload = {
        "client_name": "Delete Test Client",
        "company_name": "Delete Corp",
        "industry": "Consulting",
        "website_url": "https://delete-me.com",
        "social_media_urls": None,
        "budget": 50000.0
    }
    response = client.post("/api/proposals/generate", json=payload)
    assert response.status_code == 200
    preview_link = response.json()["preview_link"]
    proposal_hash = preview_link.split("id=")[1]

    # Get client_id
    get_proposal_res = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res.status_code == 200
    client_id = get_proposal_res.json()["client_id"]

    # 2. Get dashboard records and assert audit_raw_json is present for the new proposal
    dash_res = client.get("/api/admin/proposals")
    assert dash_res.status_code == 200
    records = dash_res.json()
    new_record = next(r for r in records if r["client_id"] == client_id)
    assert new_record["audit_raw_json"] is not None
    assert "online_sentiment_review" in new_record["audit_raw_json"]

    # 3. Perform manual status patch override (for proposal sent)
    status_patch_payload = {
        "status": "Proposal sent"
    }
    patch_res = client.patch(f"/api/admin/clients/{client_id}/status", json=status_patch_payload)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Success"

    # Verify status is updated in the database
    get_proposal_res = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res.json()["client_status"] == "Proposal sent"

    # 4. Delete the client record
    delete_res = client.delete(f"/api/admin/clients/{client_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "Success"

    # 5. Assert client no longer exists in clients table
    dash_res_after = client.get("/api/admin/proposals")
    records_after = dash_res_after.json()
    assert not any(r["client_id"] == client_id for r in records_after)

    # 6. Assert proposal is cascade deleted (should return 404)
    get_proposal_res_after = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res_after.status_code == 404

    # 7. Verify deletion fails for non-existent client (should return 404)
    delete_fake_res = client.delete("/api/admin/clients/999999")
    assert delete_fake_res.status_code == 404


