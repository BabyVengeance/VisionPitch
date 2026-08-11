import secrets
import json
import html
import re
import logging
from contextlib import asynccontextmanager
from typing import Optional, Any, Dict, List

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import psycopg2
from psycopg2.extras import RealDictCursor

from database import get_db_cursor, init_db, close_db_pool
from ai_Engine import run_ai_audit, rerun_competitor_analysis, query_audit_copilot

# Configure logging for API server
logger = logging.getLogger("visionpitch.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Modern lifespan handler replacing deprecated on_event startup/shutdown handlers."""
    logger.info("Initializing VisionPitch application database tables...")
    try:
        init_db()
    except Exception as e:
        logger.warning("Startup database initialization check warning: %s", e)
    yield
    logger.info("Shutting down VisionPitch application resource pools...")
    close_db_pool()

app = FastAPI(title="Apex VisionPitch API", lifespan=lifespan)

# Enable CORS for production and development frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sanitize_input(text: Optional[str]) -> Optional[str]:
    """Sanitizes text inputs by stripping HTML elements and script injection patterns."""
    if not text:
        return text
    clean = re.sub(r'<[^>]*>', '', text)
    clean = re.sub(r'(javascript:|onload|onerror|onclick|onmouseover)\w*=?', '', clean, flags=re.IGNORECASE)
    return clean.strip()

class ClientIntake(BaseModel):
    client_name: str
    company_name: str
    industry: str
    website_url: Optional[str] = None
    social_media_urls: Optional[str] = None
    budget: Optional[float] = None
    competitors: Optional[List[str]] = None

    @field_validator('client_name', 'company_name', 'industry', mode='before')
    @classmethod
    def clean_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            return sanitize_input(v)
        return v

class ProposalFinalize(BaseModel):
    final_price: float
    signature_base64: Optional[str] = None
    selected_multipliers: Optional[Any] = None
    status: str

class StatusUpdate(BaseModel):
    status: str

class AuditUpdatePayload(BaseModel):
    overall_score: Optional[int] = None
    scores: Optional[List[int]] = None
    online_sentiment_review: Optional[str] = None
    competitor_analysis: Optional[List[Dict[str, Any]]] = None
    visibility_gaps: Optional[List[str]] = None
    competitor_benchmarks: Optional[str] = None
    rep_notes: Optional[str] = None
    competitors_list: Optional[List[str]] = None

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

class CompetitorRerunPayload(BaseModel):
    competitors: List[str]


class CopilotPromptPayload(BaseModel):
    prompt: str

@app.get("/")
def home():
    return {"status": "Online", "message": "Apex VisionPitch API is running smoothly"}

@app.post("/api/proposals/generate")
async def generate_proposal(data: ClientIntake):
    """Main intake endpoint: validates form, saves client, runs Gemini AI audit, and stores proposal."""
    if not data.website_url and not data.social_media_urls:
        raise HTTPException(
            status_code=400,
            detail="Validation error: Either website or social media URL is required"
        )

    client_name_clean = sanitize_input(data.client_name) or ""
    company_name_clean = sanitize_input(data.company_name) or ""
    industry_clean = sanitize_input(data.industry) or ""
    website_clean = sanitize_input(data.website_url) if data.website_url else None
    social_clean = sanitize_input(data.social_media_urls) if data.social_media_urls else None
    competitors_clean = [sanitize_input(c) for c in data.competitors if c and sanitize_input(c)] if data.competitors else None

    try:
        with get_db_cursor() as (conn, cursor):
            cursor.execute('''
                INSERT INTO clients (client_name, company_name, industry, website_url, social_media_urls, budget, client_status)
                VALUES (%s, %s, %s, %s, %s, %s, 'Proposal generated')
                RETURNING client_id
            ''', (client_name_clean, company_name_clean, industry_clean, website_clean, social_clean, data.budget))
            
            client_id = cursor.fetchone()[0]

            # Call Gemini AI engine
            ai_payload = run_ai_audit(
                client_name=client_name_clean,
                company_name=company_name_clean,
                industry=industry_clean,
                url=website_clean,
                social=social_clean,
                budget=data.budget,
                competitors=competitors_clean
            )

            audit_raw_json = json.dumps({
                "online_sentiment_review": ai_payload.get("online_sentiment_review"),
                "competitor_analysis": ai_payload.get("competitor_analysis"),
                "visibility_gaps": ai_payload.get("visibility_gaps"),
                "competitor_benchmarks": ai_payload.get("competitor_benchmarks"),
                "overall_score": ai_payload.get("overall_score", 32),
                "scores": [
                    ai_payload.get("technical_seo_score", 32),
                    ai_payload.get("geo_score", 20),
                    ai_payload.get("core_web_vitals_score", 38),
                    ai_payload.get("schema_infrastructure_score", 25)
                ],
                "benchmark_scores": ai_payload.get("market_benchmark_scores", [78, 70, 75, 82]),
                "competitors_list": competitors_clean or []
            })

            suggested_list = ai_payload.get("suggested_modules", [])
            recommended_services = json.dumps(suggested_list)
            proposed_total = sum(float(item.get("estimated_cost", 0)) for item in suggested_list)
            proposal_hash = secrets.token_hex(6)

            cursor.execute('''
                INSERT INTO proposals (client_id, proposal_hash, audit_raw_json, recommended_services, final_price)
                VALUES (%s, %s, %s, %s, %s)
            ''', (client_id, proposal_hash, audit_raw_json, recommended_services, proposed_total))

        logger.info("Proposal generated successfully for client_id=%d, hash=%s", client_id, proposal_hash)
        return {
            "status": "Success",
            "message": "Proposal generated and stored cleanly in PostgreSQL database.",
            "client_id": client_id,
            "proposal_hash": proposal_hash,
            "preview_link": f"/proposals.html?id={proposal_hash}"
        }

    except psycopg2.Error as db_error:
        logger.error("Database error during proposal generation: %s", db_error)
        raise HTTPException(status_code=500, detail=f"Database operational failure: {str(db_error)}")
    except Exception as general_error:
        logger.error("System error during proposal generation: %s", general_error)
        raise HTTPException(status_code=500, detail=f"System execution bottleneck: {str(general_error)}")

@app.get("/api/proposals/{proposal_hash}")
async def get_client_proposal(proposal_hash: str):
    """Fetch proposal data by hash & automatically track when client views it."""
    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        query = '''
            SELECT p.*, c.client_name, c.company_name, c.industry, c.budget, c.client_status
            FROM proposals p
            JOIN clients c ON p.client_id = c.client_id
            WHERE p.proposal_hash = %s
        '''
        cursor.execute(query, (proposal_hash,))
        record = cursor.fetchone()

        if not record:
            raise HTTPException(status_code=404, detail="Proposal link is invalid or has expired")

        record_dict = dict(record)

        # Automatically update status to 'Proposal viewed' upon first open
        if record_dict["client_status"] == "Proposal generated":
            cursor.execute('''
                UPDATE clients 
                SET client_status = 'Proposal viewed' 
                WHERE client_id = %s
            ''', (record_dict["client_id"],))
            record_dict["client_status"] = 'Proposal viewed'

    audit_data = json.loads(record_dict["audit_raw_json"])

    multipliers = None
    if record_dict.get("selected_multipliers"):
        try:
            multipliers = json.loads(record_dict["selected_multipliers"])
        except Exception:
            multipliers = record_dict["selected_multipliers"]

    return {
        "proposal_id": record_dict["proposal_id"],
        "client_id": record_dict["client_id"],
        "client_name": record_dict["client_name"],
        "company_name": record_dict["company_name"],
        "industry": record_dict["industry"],
        "client_status": record_dict["client_status"],
        "budget": record_dict.get("budget"),
        "final_price": record_dict.get("final_price"),
        "signature_data": record_dict.get("signature_data"),
        "selected_multipliers": multipliers,
        "audit_data": {
            "online_sentiment_review": audit_data.get("online_sentiment_review"),
            "competitor_analysis": audit_data.get("competitor_analysis"),
            "visibility_gaps": audit_data.get("visibility_gaps"),
            "overall_score": audit_data.get("overall_score", 32),
            "scores": audit_data.get("scores", [32, 20, 38, 25]),
            "benchmark_scores": audit_data.get("benchmark_scores", [78, 70, 75, 82])
        },
        "competitor_benchmarks": audit_data.get("competitor_benchmarks"),
        "rep_notes": audit_data.get("rep_notes", ""),
        "competitors_list": audit_data.get("competitors_list", []),
        "chat_history": audit_data.get("chat_history", []),
        "recommended_services": json.loads(record_dict["recommended_services"])
    }

@app.post("/api/proposals/{proposal_hash}/finalize")
async def finalize_proposal(proposal_hash: str, payload: ProposalFinalize):
    """Save digital signature, updated price, and lock proposal status."""
    if payload.status not in ["Proposal signed", "Proposal declined"]:
        raise HTTPException(status_code=400, detail="Invalid closing status provided.")

    with get_db_cursor() as (conn, cursor):
        cursor.execute("SELECT client_id FROM proposals WHERE proposal_hash = %s", (proposal_hash,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal mismatch.")
            
        client_id = row[0]
        multipliers_str = json.dumps(payload.selected_multipliers) if isinstance(payload.selected_multipliers, (dict, list)) else payload.selected_multipliers

        cursor.execute('''
            UPDATE proposals 
            SET final_price = %s, signature_data = %s, selected_multipliers = %s 
            WHERE proposal_hash = %s
        ''', (payload.final_price, payload.signature_base64, multipliers_str, proposal_hash))
        
        cursor.execute('''
            UPDATE clients 
            SET client_status = %s, budget = %s 
            WHERE client_id = %s
        ''', (payload.status, payload.final_price, client_id))

    logger.info("Proposal %s finalized with status %s", proposal_hash, payload.status)
    return {"status": "Success", "message": f"Proposal successfully finalized as {payload.status}."}

@app.get("/api/admin/proposals")
async def get_all_audits():
    """Fetch all proposal logs for the admin sales dashboard."""
    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        query = '''
            SELECT c.client_id, c.client_name, c.company_name, c.industry, c.client_status, c.budget, p.proposal_hash, p.audit_raw_json, p.final_price, p.signature_data, p.selected_multipliers
            FROM clients c
            LEFT JOIN proposals p ON c.client_id = p.client_id
            ORDER BY c.client_id DESC
        '''
        cursor.execute(query)
        records = cursor.fetchall()
        return records

@app.delete("/api/admin/clients/{client_id}")
async def delete_client(client_id: int):
    """Delete client record (cascade deletes associated proposals automatically)."""
    with get_db_cursor() as (conn, cursor):
        cursor.execute("SELECT client_id FROM clients WHERE client_id = %s", (client_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Target client not located.")
            
        cursor.execute("DELETE FROM clients WHERE client_id = %s", (client_id,))

    logger.info("Client %d and associated proposals deleted cleanly", client_id)
    return {"status": "Success", "message": "Client and associated proposals deleted successfully."}

@app.patch("/api/admin/clients/{client_id}/status")
async def update_client_status_manually(client_id: int, payload: StatusUpdate):
    """Manual status override endpoint for sales team."""
    valid_statuses = ['Proposal generated', 'Proposal sent', 'Proposal viewed', 'Proposal signed', 'Proposal declined']
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Requested status override matches no recognized template validation fields.")
        
    with get_db_cursor() as (conn, cursor):
        cursor.execute("SELECT client_id FROM clients WHERE client_id = %s", (client_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Target client not located.")
            
        cursor.execute("UPDATE clients SET client_status = %s WHERE client_id = %s", (payload.status, client_id))

    logger.info("Client %d status manually set to '%s'", client_id, payload.status)
    return {"status": "Success", "message": f"Client status manually set to '{payload.status}' successfully."}

@app.put("/api/admin/proposals/{proposal_hash}/audit")
async def update_proposal_audit(proposal_hash: str, payload: AuditUpdatePayload):
    """Updates staged audit metrics, sentiment, gaps, competitor profiles, and rep notes."""
    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        cursor.execute("SELECT proposal_id, audit_raw_json FROM proposals WHERE proposal_hash = %s", (proposal_hash,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proposal record not located.")

        audit_data = json.loads(row["audit_raw_json"])

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

        updated_json = json.dumps(audit_data)
        cursor.execute("UPDATE proposals SET audit_raw_json = %s WHERE proposal_hash = %s", (updated_json, proposal_hash))

    logger.info("Audit data updated cleanly for proposal %s", proposal_hash)
    return {"status": "Success", "message": "Audit successfully updated and staged.", "audit_data": audit_data}

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


@app.post("/api/admin/proposals/{proposal_hash}/rerun-competitors")
async def rerun_audit_competitors(proposal_hash: str, payload: CompetitorRerunPayload):
    """Triggers targeted Gemini AI audit rerun based on updated competitor list."""
    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        query = '''
            SELECT p.proposal_id, p.audit_raw_json, c.client_name, c.company_name, c.industry, c.website_url
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

        new_comp_data = rerun_competitor_analysis(
            client_name=record["client_name"],
            company_name=record["company_name"],
            industry=record["industry"],
            url=record.get("website_url"),
            new_competitors=payload.competitors
        )

        audit_data["competitor_analysis"] = new_comp_data["competitor_analysis"]
        audit_data["competitor_benchmarks"] = new_comp_data["competitor_benchmarks"]
        audit_data["competitors_list"] = payload.competitors

        updated_json = json.dumps(audit_data)
        cursor.execute("UPDATE proposals SET audit_raw_json = %s WHERE proposal_hash = %s", (updated_json, proposal_hash))

    logger.info("Competitor audit re-run successfully for proposal %s", proposal_hash)
    return {
        "status": "Success",
        "message": "Competitor intelligence re-analyzed cleanly.",
        "competitor_analysis": audit_data["competitor_analysis"],
        "competitor_benchmarks": audit_data["competitor_benchmarks"],
        "competitors_list": audit_data["competitors_list"]
    }

@app.post("/api/admin/proposals/{proposal_hash}/ai-copilot")
async def interact_with_audit_copilot(proposal_hash: str, payload: CopilotPromptPayload):
    """Interactive AI Copilot endpoint for sales rep research and audit query execution."""
    if not payload.prompt or not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt text cannot be empty.")

    with get_db_cursor(cursor_factory=RealDictCursor) as (conn, cursor):
        query = '''
            SELECT p.proposal_id, p.audit_raw_json, c.client_name, c.company_name, c.industry
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
        audit_data["client_name"] = record["client_name"]
        audit_data["company_name"] = record["company_name"]
        audit_data["industry"] = record["industry"]

        chat_history = audit_data.get("chat_history", [])

        ai_response = query_audit_copilot(
            audit_context=audit_data,
            chat_history=chat_history,
            user_prompt=payload.prompt.strip()
        )

        chat_history.append({"role": "user", "text": payload.prompt.strip()})
        chat_history.append({"role": "model", "text": ai_response})

        audit_data["chat_history"] = chat_history
        # Clean client metadata keys before saving back to audit_raw_json
        for key in ["client_name", "company_name", "industry"]:
            audit_data.pop(key, None)

        updated_json = json.dumps(audit_data)
        cursor.execute("UPDATE proposals SET audit_raw_json = %s WHERE proposal_hash = %s", (updated_json, proposal_hash))

    return {
        "status": "Success",
        "copilot_response": ai_response,
        "chat_history": chat_history
    }

