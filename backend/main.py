import sqlite3
import secrets
import json

from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional


#importing the ai engine module
from ai_Engine import run_ai_audit

app = FastAPI(title="Apex VisionPitch API")


#enabling CORS so that netlify can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


#definine exact data struture to expect from front end form
class ClientIntake(BaseModel):
    client_name: str
    company_name: str
    industry: str
    website_url: Optional[str] = None
    social_media_urls: Optional[str] = None
    budget: float

@app.get("/")
def home():
    return{"status": "Online" , "message": "Apex VisionPitch API is running smoothly"}


@app.post("/api/proposals/generate")
async def generate_proposal(data: ClientIntake):
    # pre validation rule to ensure web url & social media url not left blank
    if not data.website_url and not data.social_media_urls:
        raise HTTPException(
            status_code=400,
            detail="Validation error: Either website or social media URL is required"
        )

    db_path="database.db"
    
    try:
        # Insert Client into SQLite and capturing of ID
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = ON;")

        cursor.execute('''
            INSERT INTO clients (client_name, company_name, industry, website_url, social_media_urls, budget, client_status)
            VALUES (?, ?, ?, ?, ?, ?, 'Proposal generated')
        ''', (data.client_name, data.company_name, data.industry, data.website_url, data.social_media_urls, data.budget))  

        client_id=cursor.lastrowid

        # Trigger the context call to Gemini API
        ai_payload = run_ai_audit(
            client_name=data.client_name,
            company_name=data.company_name,
            industry=data.industry,
            url=data.website_url,
            social=data.social_media_urls,
            budget=data.budget
        )
        
       
        audit_raw_json = json.dumps({
            "online_sentiment_review": ai_payload.get("online_sentiment_review"),
            "competitor_analysis": ai_payload.get("competitor_analysis"),
            "visibility_gaps": ai_payload.get("visibility_gaps")
        })
        
        competitor_benchmarks = ai_payload.get("competitor_benchmarks")
        recommended_services = json.dumps(ai_payload.get("suggested_modules"))
        
        # Generate a secure random hash for the proposal link
        proposal_hash = secrets.token_hex(6) 
        
        # Insert dynamic audit results into the proposals table linked to the client record
        cursor.execute('''
            INSERT INTO proposals (client_id, proposal_hash, visibility_gaps, competitor_benchmarks, recommended_services, final_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (client_id, proposal_hash, audit_raw_json, competitor_benchmarks, recommended_services, data.budget))
        
        conn.commit()
        conn.close()
        
        # Output the payload configuration back to the caller
        return {
            "status": "Success",
            "message": "Proposal generated and stored cleanly in SQLite database file.",
            "client_id": client_id,
            "proposal_hash": proposal_hash,
            "preview_link": f"/proposal.html?id={proposal_hash}"
        }
        
    except sqlite3.Error as db_error:
        raise HTTPException(status_code=500, detail=f"Database operational failure: {str(db_error)}")
    except Exception as general_error:
        raise HTTPException(status_code=500, detail=f"System execution bottleneck: {str(general_error)}")
        
        
