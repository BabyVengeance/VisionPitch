import secrets
import json
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor

from database import get_db_connection
from ai_Engine import run_ai_audit

app = FastAPI(title="Apex VisionPitch API")

# Enable CORS so frontend (Netlify or local) can reach our API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClientIntake(BaseModel):
    client_name: str
    company_name: str
    industry: str
    website_url: Optional[str] = None
    social_media_urls: Optional[str] = None
    budget: Optional[float] = None

@app.get("/")
def home():
    return {"status": "Online", "message": "Apex VisionPitch API is running smoothly"}

# Clean up input text to strip HTML tags and script injections
def sanitize_input(text: str) -> str:
    if not text:
        return text
    clean = re.sub(r'<[^>]*>', '', text)
    clean = re.sub(r'(javascript:|onload|onerror|onclick|onmouseover)\w*=?', '', clean, flags=re.IGNORECASE)
    return clean.strip()

# Main intake endpoint: validates form, saves client, runs Gemini AI audit, and stores proposal
@app.post("/api/proposals/generate")
async def generate_proposal(data: ClientIntake):
    # Require at least one link (website or social media)
    if not data.website_url and not data.social_media_urls:
        raise HTTPException(
            status_code=400,
            detail="Validation error: Either website or social media URL is required"
        )

    client_name_clean = sanitize_input(data.client_name)
    company_name_clean = sanitize_input(data.company_name)
    industry_clean = sanitize_input(data.industry)
    website_clean = sanitize_input(data.website_url) if data.website_url else None
    social_clean = sanitize_input(data.social_media_urls) if data.social_media_urls else None

    try:
        # Save client to DB and grab the generated client_id
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO clients (client_name, company_name, industry, website_url, social_media_urls, budget, client_status)
            VALUES (%s, %s, %s, %s, %s, %s, 'Proposal generated')
            RETURNING client_id
        ''', (client_name_clean, company_name_clean, industry_clean, website_clean, social_clean, data.budget))  

        client_id = cursor.fetchone()[0]

        # Call Gemini AI engine to generate audit findings & service modules
        ai_payload = run_ai_audit(
            client_name=client_name_clean,
            company_name=company_name_clean,
            industry=industry_clean,
            url=website_clean,
            social=social_clean,
            budget=data.budget
        )
        
        audit_raw_json = json.dumps({
            "online_sentiment_review": ai_payload.get("online_sentiment_review"),
            "competitor_analysis": ai_payload.get("competitor_analysis"),
            "visibility_gaps": ai_payload.get("visibility_gaps"),
            "competitor_benchmarks": ai_payload.get("competitor_benchmarks")
        })
        
        suggested_list = ai_payload.get("suggested_modules", [])
        recommended_services = json.dumps(suggested_list)
        
        proposed_total = sum(float(item.get("estimated_cost", 0)) for item in suggested_list)
        
        # Generate random unique hex hash for public proposal link
        proposal_hash = secrets.token_hex(6) 
        
        # Save generated proposal into database linked to client ID
        cursor.execute('''
            INSERT INTO proposals (client_id, proposal_hash, audit_raw_json, recommended_services, final_price)
            VALUES (%s, %s, %s, %s, %s)
        ''', (client_id, proposal_hash, audit_raw_json, recommended_services, proposed_total))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "Success",
            "message": "Proposal generated and stored cleanly in PostgreSQL database.",
            "client_id": client_id,
            "proposal_hash": proposal_hash,
            "preview_link": f"/proposals.html?id={proposal_hash}"
        }
        
    except psycopg2.Error as db_error:
        raise HTTPException(status_code=500, detail=f"Database operational failure: {str(db_error)}")
    except Exception as general_error:
        raise HTTPException(status_code=500, detail=f"System execution bottleneck: {str(general_error)}")

class ProposalFinalize(BaseModel):
    final_price: float
    signature_base64: Optional[str] = None
    status: str 

class StatusUpdate(BaseModel):
    status: str

# Fetch proposal data by hash & automatically track when client views it
@app.get("/api/proposals/{proposal_hash}")
async def get_client_proposal(proposal_hash: str):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    query = '''
        SELECT p.*, c.client_name, c.company_name, c.industry, c.budget, c.client_status
        FROM proposals p
        JOIN clients c ON p.client_id = c.client_id
        WHERE p.proposal_hash = %s
    '''
    cursor.execute(query, (proposal_hash,))
    record = cursor.fetchone()

    if not record:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Proposal link is invalid or has expired")

    record_dict = dict(record)
    # Automatically switch status to 'Proposal viewed' when opened for first time
    if record_dict["client_status"] == "Proposal generated":
        cursor.execute('''
            UPDATE clients 
            SET client_status = 'Proposal viewed' 
            WHERE client_id = %s
        ''', (record_dict["client_id"],))
        conn.commit()
        record_dict["client_status"] = 'Proposal viewed'

    cursor.close()
    conn.close()

    audit_data = json.loads(record_dict["audit_raw_json"])

    return {
        "proposal_id": record_dict["proposal_id"],
        "client_id": record_dict["client_id"],
        "client_name": record_dict["client_name"],
        "company_name": record_dict["company_name"],
        "industry": record_dict["industry"],
        "client_status": record_dict["client_status"],
        "budget": record_dict.get("budget"),
        "final_price": record_dict.get("final_price"),
        "audit_data": {
            "online_sentiment_review": audit_data.get("online_sentiment_review"),
            "competitor_analysis": audit_data.get("competitor_analysis"),
            "visibility_gaps": audit_data.get("visibility_gaps")
        }, 
        "competitor_benchmarks": audit_data.get("competitor_benchmarks"),
        "recommended_services": json.loads(record_dict["recommended_services"])
    }

# Save digital signature, updated price, and lock proposal status
@app.post("/api/proposals/{proposal_hash}/finalize")
async def finalize_proposal(proposal_hash: str, payload: ProposalFinalize):
    if payload.status not in ["Proposal signed", "Proposal declined"]:
        raise HTTPException(status_code=400, detail="Invalid closing status provided.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT client_id FROM proposals WHERE proposal_hash = %s", (proposal_hash,))
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Proposal mismatch.")
        
    client_id = row[0]
    
    # Save signature data and final calculated price
    cursor.execute('''
        UPDATE proposals 
        SET final_price = %s, signature_data = %s 
        WHERE proposal_hash = %s
    ''', (payload.final_price, payload.signature_base64, proposal_hash))
    
    # Update client status to signed or declined and sync client budget with agreed final_price
    cursor.execute('''
        UPDATE clients 
        SET client_status = %s, budget = %s 
        WHERE client_id = %s
    ''', (payload.status, payload.final_price, client_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "Success", "message": f"Proposal successfully finalized as {payload.status}."}

# Fetch all proposal logs for the admin sales dashboard
@app.get("/api/admin/proposals")
async def get_all_audits():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = '''
        SELECT c.client_id, c.client_name, c.company_name, c.industry, c.client_status, c.budget, p.proposal_hash, p.audit_raw_json, p.final_price
        FROM clients c
        LEFT JOIN proposals p ON c.client_id = p.client_id
        ORDER BY c.client_id DESC
    '''
    cursor.execute(query)
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return records

# Delete client record (cascade deletes associated proposals automatically)
@app.delete("/api/admin/clients/{client_id}")
async def delete_client(client_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT client_id FROM clients WHERE client_id = %s", (client_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Target client not located.")
        
    cursor.execute("DELETE FROM clients WHERE client_id = %s", (client_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "Success", "message": "Client and associated proposals deleted successfully."}

# Manual status override endpoint for sales team
@app.patch("/api/admin/clients/{client_id}/status")
async def update_client_status_manually(client_id: int, payload: StatusUpdate):
    valid_statuses = ['Proposal generated', 'Proposal sent', 'Proposal viewed', 'Proposal signed', 'Proposal declined']
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Requested status override matches no recognized template validation fields.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT client_id FROM clients WHERE client_id = %s", (client_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Target client not located.")
        
    cursor.execute("UPDATE clients SET client_status = %s WHERE client_id = %s", (payload.status, client_id))
    conn.commit()
    cursor.close()
    conn.close()
    return {"status": "Success", "message": f"Client status manually set to '{payload.status}' successfully."}

