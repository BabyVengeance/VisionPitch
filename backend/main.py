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


#request schemas for updates
class ProposalFinalize(BaseModel):
    final_price: float
    signature_base64: Optional[str] = None
    status: str 

class StatusUpdate(BaseModel):
    status: str


#endpoint 1 : Client portal lookup + tracking
@app.get("/api/proposals/{proposal_hash}")
async def get_client_proposal(proposal_hash: str):
    db_path = "database.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    #locate proposal & merge with client fields
    query = '''
        SELECT p.*, c.client_name, c.company_name, c.industry, c.budget, c.client_status
        FROM proposals p
        JOIN clients c ON p.client_id = c.client_id
        WHERE p.proposal_hash = ?
    '''
    cursor.execute(query,(proposal_hash,))
    record = cursor.fetchone()

    if not record:
        conn.close()
        raise HTTPException(status_code=404 , detail="Proposal link is invalid or has expired")

    
    #dynamic tracking 
    record_dict = dict(record)
    if record_dict["client_status"] == "Proposal generated":
        cursor.execute('''
            UPDATE clients 
            SET client_status = 'Proposal viewed' 
            WHERE client_id = ?
        ''', (record_dict["client_id"],))
        conn.commit()
        record_dict["client_status"] = 'Proposal viewed'

    conn.close()

    return {
        "proposal_id": record_dict["proposal_id"],
        "client_id": record_dict["client_id"],
        "client_name": record_dict["client_name"],
        "company_name": record_dict["company_name"],
        "industry": record_dict["industry"],
        "client_status": record_dict["client_status"],
        "audit_data": json.loads(record_dict["visibility_gaps"]), 
        "competitor_benchmarks": record_dict["competitor_benchmarks"],
        "recommended_services": json.dumps(record_dict["recommended_services"])
    }



#endpoint 2  - digital signature
@app.post("/api/proposals/{proposal_hash}/finalize")
async def finalize_proposal(proposal_hash: str, payload: ProposalFinalize):
    if payload.status not in ["Proposal signed","Proposal declined"]:
        raise HTTPException(status_code=400, detail="Invalid closing status provided.")

    db_path = "database.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()


    #find matching proposal record
    cursor.execute("SELECT client_id FROM proposals WHERE proposal_hash = ?", (proposal_hash,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Proposal mismatch.")
        
    client_id = row[0]
    
    # 1. Update the signature and price  in proposals table
    cursor.execute('''
        UPDATE proposals 
        SET final_price = ?, signature_data = ? 
        WHERE proposal_hash = ?
    ''', (payload.final_price, payload.signature_base64, proposal_hash))
    
    # 2. Synch client status for sales dashboard
    cursor.execute('''
        UPDATE clients 
        SET client_status = ? 
        WHERE client_id = ?
    ''', (payload.status, client_id))
    
    conn.commit()
    conn.close()
    return {"status": "Success", "message": f"Proposal successfully finalized as {payload.status}."}

#endpoint 3 : sales dashboard logs
@app.get("/api/admin/proposals")
async def get_all_audits():
    db_path = "database.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = '''
        SELECT c.client_id, c.client_name, c.company_name, c.industry, c.client_status, c.budget, p.proposal_hash
        FROM clients c
        LEFT JOIN proposals p ON c.client_id = p.client_id
        ORDER BY c.client_id DESC
    '''
    cursor.execute(query)
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records


#endpoint 4 : manual override by sales member
@app.patch("/api/admin/clients/{client_id}/status")
async def update_client_status_manually(client_id: int, payload: StatusUpdate):
    """
    Allows the sales rep to manually adjust the client lead lifecycle state.
    """
    valid_statuses = ['Proposal generated', 'Proposal sent', 'Proposal viewed', 'Proposal signed', 'Proposal declined']
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Requested status override matches no recognized template validation fields.")
        
    db_path = "database.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT client_id FROM clients WHERE client_id = ?", (client_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Target client not located.")
        
    cursor.execute("UPDATE clients SET client_status = ? WHERE client_id = ?", (payload.status, client_id))
    conn.commit()
    conn.close()
    return {"status": "Success", "message": f"Client status manually set to '{payload.status}' successfully."}


   
