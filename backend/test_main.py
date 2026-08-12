import pytest
from fastapi.testclient import TestClient

from main import app, sanitize_input
from ai_Engine import run_ai_audit, parse_social_platforms

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


# Test AI audit fallback populates specified target competitors when passed
def test_run_ai_audit_with_custom_competitors():
    competitors = ["Custom Comp A", "Custom Comp B", "Custom Comp C"]
    result = run_ai_audit("Test Client", "Test Company", "Testing", "http://test.com", "social", 15000.0, competitors)
    
    comp_analysis = result.get("competitor_analysis", [])
    assert len(comp_analysis) == 3
    comp_names = [c["name"] for c in comp_analysis]
    assert "Custom Comp A" in comp_names
    assert "Custom Comp B" in comp_names
    assert "Custom Comp C" in comp_names


def test_run_ai_audit_with_partial_competitor_seeds():
    # 1 competitor provided: AI fills remaining 2
    res_1 = run_ai_audit("Client 1", "Company 1", "Industry", "http://c1.com", None, None, ["Solo Competitor"])
    comps_1 = [c["name"] for c in res_1.get("competitor_analysis", [])]
    assert len(comps_1) == 3
    assert "Solo Competitor" in comps_1

    # 2 competitors provided: AI fills remaining 1
    res_2 = run_ai_audit("Client 2", "Company 2", "Industry", "http://c2.com", None, None, ["Comp X", "Comp Y"])
    comps_2 = [c["name"] for c in res_2.get("competitor_analysis", [])]
    assert len(comps_2) == 3
    assert "Comp X" in comps_2
    assert "Comp Y" in comps_2
    assert res_2["competitor_analysis"][0]["is_anchor"] is True
    assert res_2["competitor_analysis"][0]["source_label"] == "Direct Competitor"
    assert res_2["competitor_analysis"][1]["is_anchor"] is True
    assert res_2["competitor_analysis"][1]["source_label"] == "Direct Competitor"
    assert res_2["competitor_analysis"][2]["is_anchor"] is False
    assert res_2["competitor_analysis"][2]["source_label"] == "Market Competitor"


def test_tag_competitors_enforces_sales_rep_names_over_generic():
    from ai_Engine import tag_competitors
    mock_data = {
        "competitor_analysis": [
            {"name": "Generic AI Competitor 1", "platform_leveraged": "SEO", "revenue_advantage": "High domain authority"},
            {"name": "Generic AI Competitor 2", "platform_leveraged": "Ads", "revenue_advantage": "Conversion funnel"}
        ],
        "competitor_benchmarks": "Industry visibility is 70%."
    }
    tagged = tag_competitors(mock_data, ["sales_comp.co.za"])
    
    assert tagged["competitor_analysis"][0]["name"] == "sales_comp.co.za"
    assert tagged["competitor_analysis"][0]["is_anchor"] is True
    assert tagged["competitor_analysis"][0]["source_label"] == "Direct Competitor"
    assert tagged["competitor_analysis"][1]["is_anchor"] is False
    assert "sales_comp.co.za" in tagged["competitor_benchmarks"]


def test_rerun_competitor_analysis_preserves_existing_competitors():
    from ai_Engine import rerun_competitor_analysis
    existing_comps = ["Competitor Alpha", "Competitor Beta", "Competitor Gamma"]
    res = rerun_competitor_analysis(
        client_name="Test Client",
        company_name="Test Company",
        industry="Marketing",
        url="http://test.com",
        new_competitors=["Seed Mediaa"],
        existing_competitors=existing_comps
    )
    comp_list = res.get("competitor_analysis", [])
    names = [c["name"] for c in comp_list]
    assert len(names) == 3
    assert names[0] == "Seed Mediaa"
    assert "Competitor Beta" in names
    assert "Competitor Gamma" in names



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


# Test parse_social_platforms correctly categorizes social URLs by domain
def test_parse_social_platforms():
    social_str = "https://instagram.com/apexdigital, https://facebook.com/apexdigital, https://linkedin.com/company/apexdigital, https://tiktok.com/@apexdigital"
    result = parse_social_platforms(social_str)
    
    assert result["Instagram"] == "https://instagram.com/apexdigital"
    assert result["Facebook"] == "https://facebook.com/apexdigital"
    assert result["LinkedIn"] == "https://linkedin.com/company/apexdigital"
    assert result["TikTok"] == "https://tiktok.com/@apexdigital"
    
    empty_result = parse_social_platforms(None)
    assert empty_result == {}


def test_audit_staging_editor_flow():
    # 1. Create client & proposal
    payload = {
        "client_name": "Audit Edit Test",
        "company_name": "Staging Corp",
        "industry": "Marketing",
        "website_url": "https://stagingcorp.com",
        "social_media_urls": None,
        "budget": 25000.0,
        "competitors": ["Original Comp A", "Original Comp B"]
    }
    response = client.post("/api/proposals/generate", json=payload)
    assert response.status_code == 200
    preview_link = response.json()["preview_link"]
    proposal_hash = preview_link.split("id=")[1]
    client_id = response.json()["client_id"]

    try:
        # 2. Test PUT /api/admin/proposals/{hash}/audit
        update_payload = {
            "overall_score": 85,
            "scores": [80, 75, 90, 85],
            "online_sentiment_review": "Refined online sentiment summary for executive pitch.",
            "visibility_gaps": ["Custom gap 1", "Custom gap 2"],
            "rep_notes": "Rep note: client budget is flex if SEO is prioritized."
        }
        update_res = client.put(f"/api/admin/proposals/{proposal_hash}/audit", json=update_payload)
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "Success"
        assert update_res.json()["audit_data"]["overall_score"] == 85
        assert update_res.json()["audit_data"]["rep_notes"] == "Rep note: client budget is flex if SEO is prioritized."

        # 3. Test POST /api/admin/proposals/{hash}/rerun-competitors
        rerun_payload = {
            "competitors": ["New Rival X", "New Rival Y", "New Rival Z"]
        }
        rerun_res = client.post(f"/api/admin/proposals/{proposal_hash}/rerun-competitors", json=rerun_payload)
        assert rerun_res.status_code == 200
        assert rerun_res.json()["status"] == "Success"
        assert rerun_res.json()["competitors_list"] == ["New Rival X", "New Rival Y", "New Rival Z"]
        assert len(rerun_res.json()["competitor_analysis"]) == 3

        # 4. Test POST /api/admin/proposals/{hash}/ai-copilot
        copilot_payload = {
            "prompt": "Give 3 technical quick win recommendations for this audit."
        }
        copilot_res = client.post(f"/api/admin/proposals/{proposal_hash}/ai-copilot", json=copilot_payload)
        assert copilot_res.status_code == 200
        assert copilot_res.json()["status"] == "Success"
        assert "copilot_response" in copilot_res.json()
        assert len(copilot_res.json()["chat_history"]) >= 2

        # 5. Verify GET /api/proposals/{hash} returns updated audit data
        get_res = client.get(f"/api/proposals/{proposal_hash}")
        assert get_res.status_code == 200
        assert get_res.json()["audit_data"]["overall_score"] == 85
        assert get_res.json()["rep_notes"] == "Rep note: client budget is flex if SEO is prioritized."
        assert get_res.json()["competitors_list"] == ["New Rival X", "New Rival Y", "New Rival Z"]

    finally:
        client.delete(f"/api/admin/clients/{client_id}")


def test_transpose_proposal_audit():
    # 1. Generate client & proposal
    response = client.post("/api/proposals/generate", json={
        "client_name": "Test Transpose Client",
        "company_name": "Transpose Co",
        "industry": "Real Estate & Property Development",
        "website_url": "https://transpose-test.co.za",
        "budget": 20000.0
    })
    assert response.status_code == 200
    data = response.json()
    proposal_hash = data["proposal_hash"]
    client_id = data["client_id"]

    try:
        # 2. Transpose payload
        transpose_payload = {
            "overall_score": 45,
            "scores": [45, 50, 40, 42],
            "online_sentiment_review": "Updated executive sentiment review text for transposition.",
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

        # 3. Verify via GET /api/proposals/{proposal_hash}
        get_res = client.get(f"/api/proposals/{proposal_hash}")
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["audit_data"]["overall_score"] == 45
        assert get_data["audit_data"]["online_sentiment_review"] == "Updated executive sentiment review text for transposition."
        assert len(get_data["recommended_services"]) > 0

    finally:
        client.delete(f"/api/admin/clients/{client_id}")






