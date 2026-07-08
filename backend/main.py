from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sqlite3

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
    #1. pre validation rule to ensure web url & social media url not left blank
    if not data.website_url and not data.social_media_urls:
        raise HTTPException(
            status_code=400,
            detail="Validation error: Either website or social media URL is required"
        )

    #2 temporary placeholder before GEmini API is applied
    return{
        "message": "Data received successfully!",
        "client_received": data.client_name,
        "status":"Ready for AI audit integration"
    }
    