import pytest
from fastapi.testclient import TestClient

from main import app, sanitize_input
from ai_Engine import run_ai_audit

client = TestClient(app)

# Calculates project cost by applying scope and timeline multipliers
def calculate_markup_price(base_cost: float, multiplier: float) -> float:
    return base_cost * multiplier


# Test multiplier calculation math
def test_pricing_engine_multiplier():
    base_cost = 1000.0
    multiplier = 1.20
    expected_cost = 1200.0
    
    assert calculate_markup_price(base_cost, multiplier) == expected_cost


# Test stripping HTML tags and script injections from input fields
def test_sanitize_input_strips_html_and_scripts():
    malicious_html = "<h1>Apex Digital</h1><script>alert('xss')</script>"
    clean_html = sanitize_input(malicious_html)
    
    assert "<h1>" not in clean_html
    assert "</h1>" not in clean_html
    assert "<script>" not in clean_html
    assert "</script>" not in clean_html
    assert "alert('xss')" in clean_html

    malicious_event = "<div onclick='malicious()'>Safe Content</div>"
    clean_event = sanitize_input(malicious_event)
    
    assert "onclick" not in clean_event
    assert "<div>" not in clean_event
    assert "Safe Content" in clean_event


# Test intake validation rejects submissions with no website or social URL
def test_intake_validation_raises_400_when_urls_empty():
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


# Test AI audit fallback fits total costs within specified budget rules (60% to 100%)
def test_ai_audit_fallback_respects_budget_thresholds():
    budget = 15000.0
    result = run_ai_audit("Test Client", "Test Company", "Testing", "http://test.com", "social", budget)
    total_proposed = sum(item["estimated_cost"] for item in result["suggested_modules"])
    
    assert total_proposed <= budget
    assert total_proposed >= budget * 0.60
    
    result_nobudget = run_ai_audit("Test Client", "Test Company", "Testing", "http://test.com", "social", None)
    total_proposed_nobudget = sum(item["estimated_cost"] for item in result_nobudget["suggested_modules"])
    
    assert total_proposed_nobudget >= 10000.0
    assert total_proposed_nobudget <= 30000.0


def test_generate_proposal_without_budget_succeeds():
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

    # Teardown: Remove test client from database
    client_id = json_data.get("client_id")
    if client_id:
        client.delete(f"/api/admin/clients/{client_id}")


# Test full digital signature finalization flow and status lock
def test_finalize_proposal_flow():
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
    client_id = response.json().get("client_id")
    preview_link = response.json()["preview_link"]
    proposal_hash = preview_link.split("id=")[1]

    try:
        finalize_payload = {
            "final_price": 18500.0,
            "signature_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            "selected_multipliers": {"0": 1.2, "1": 0.8},
            "status": "Proposal signed"
        }
        finalize_response = client.post(f"/api/proposals/{proposal_hash}/finalize", json=finalize_payload)
        assert finalize_response.status_code == 200
        assert finalize_response.json()["status"] == "Success"

        get_response = client.get(f"/api/proposals/{proposal_hash}")
        assert get_response.status_code == 200
        assert get_response.json()["client_status"] == "Proposal signed"
        assert get_response.json()["budget"] == 18500.0
        assert get_response.json()["signature_data"] == "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
        assert get_response.json()["selected_multipliers"] == {"0": 1.2, "1": 0.8}

        admin_response = client.get("/api/admin/proposals")
        assert admin_response.status_code == 200
        client_record = next((item for item in admin_response.json() if item["client_id"] == client_id), None)
        assert client_record is not None
        assert client_record["budget"] == 18500.0

        invalid_payload = {
            "final_price": 18500.0,
            "signature_base64": "data:image/png;base64,...",
            "status": "Proposal viewed"
        }
        invalid_response = client.post(f"/api/proposals/{proposal_hash}/finalize", json=invalid_payload)
        assert invalid_response.status_code == 400

        error_response = client.post("/api/proposals/nonexistenthash/finalize", json=finalize_payload)
        assert error_response.status_code == 404
    finally:
        if client_id:
            client.delete(f"/api/admin/clients/{client_id}")


# Test client deletion and cascade deletion of linked proposal
def test_client_deletion_and_dashboard_query():
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

    get_proposal_res = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res.status_code == 200
    client_id = get_proposal_res.json()["client_id"]

    dash_res = client.get("/api/admin/proposals")
    assert dash_res.status_code == 200
    records = dash_res.json()
    new_record = next(r for r in records if r["client_id"] == client_id)
    assert new_record["audit_raw_json"] is not None
    assert "online_sentiment_review" in new_record["audit_raw_json"]

    status_patch_payload = {
        "status": "Proposal sent"
    }
    patch_res = client.patch(f"/api/admin/clients/{client_id}/status", json=status_patch_payload)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Success"

    get_proposal_res = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res.json()["client_status"] == "Proposal sent"

    delete_res = client.delete(f"/api/admin/clients/{client_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["status"] == "Success"

    dash_res_after = client.get("/api/admin/proposals")
    records_after = dash_res_after.json()
    assert not any(r["client_id"] == client_id for r in records_after)

    get_proposal_res_after = client.get(f"/api/proposals/{proposal_hash}")
    assert get_proposal_res_after.status_code == 404

    delete_fake_res = client.delete("/api/admin/clients/999999")
    assert delete_fake_res.status_code == 404



