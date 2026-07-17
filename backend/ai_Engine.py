import os
import json
from google import genai
from pydantic import BaseModel , Field
from typing import List



class Competitor(BaseModel):
    name: str = Field(description = "Name of the competitor company")
    platform_leveraged: str = Field(description="Digital channel they are using effectively(e.g. active funnels , website ,SEO engine , social automation)")
    revenue_advantage: str = Field(description="How this platform setup drives their revenue or saves them operational time")

class ServiceModule(BaseModel):
    service_name: str = Field (description="Name of service solution (e.g. Core SEO Optimization, Lead Funnel Pipeline)")
    description: str = Field(description="Brief overview of how this module resolves a client digital visibility gap")
    base_hours: int = Field(description="Default recommended execution hours")
    estimated_cost: float = Field(description="Base pricing calculation for this item")

class AuditResult(BaseModel):
    online_sentiment_review: str = Field(description="Honest breakdown and analysis of the prospective client's current online footprint and public sentiment")
    competitor_analysis: List[Competitor] = Field(description="A clear evaluation of exactly 3 competitors leveraging online channels effectively")
    visibility_gaps: List[str] = Field(description="Bulleted list of the client's explicit online visibility gaps and weaknesses")
    competitor_benchmarks: str = Field(description="Summary benchmarking client metrics directly against industry averages and competitors")
    suggested_modules: List[ServiceModule] = Field(description="Modular service line-items configured specifically to fix their visibility gaps")
   


def run_ai_audit(client_name:str , company_name: str , industry:str , url:str, social: str, budget: float) -> dict:

   api_key = os.getenv("GEMINI_API_KEY","YOUR_GEMINI_API_KEY")
   client = genai.Client(api_key=api_key) 

   prompt = f"""
   Perform a high-grade professional digital business audit for a prospective client.
    Client Target Profiles:
    - Business Client Name: {client_name}
    - Company Name: {company_name}
    - Industry Segment: {industry}
    - Primary Web Presence: {url if url else 'Not Provided'}
    - Main Social Footprint: {social if social else 'Not Provided'}
    - Baseline Budget Constraints: ${budget}
    
    Evaluate their online sentiment, profile 3 competitors, itemize visibility gaps, and deliver tailored service modules mapping directly to their budget limits.
    """
  
   response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config={
        'response_mime_type': 'application/json',
        'response_schema':AuditResult,
    }
   )

   return json.loads(response.text)