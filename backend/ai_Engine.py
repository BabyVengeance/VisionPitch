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
   You are the Senior Digital Strategist and Technical Architect at Apex Digital SA, a premier South African agency specializing in high-performance Website Development, Search Engine Optimization (SEO), and Generative Engine Optimization (GEO / AI Search Optimization).

   Perform a comprehensive, professional digital visibility audit and strategic proposal for a prospective client.
   
   Client Profile:
   - Contact Person: {client_name}
   - Company Name: {company_name}
   - Industry: {industry}
   - Website URL: {url if url else 'Not Provided'}
   - Social Footprint: {social if social else 'Not Provided'}
   - Allocated Budget: R{budget} (ZAR)

   Audit Guidelines:
   1. Analyze the client's current online footprint (or projected setup if website is Not Provided). Focus on:
      - Technical weaknesses, speed bottlenecks, mobile usability issues (Website Development gaps).
      - Core Web Vitals, indexability, crawlability, search engine trust factors (SEO gaps).
      - Zero-click search footprint, lack of citations/mentions in AI search answers like Gemini, Perplexity, and ChatGPT (GEO/AI search visibility gaps).
   2. Research and profile exactly 3 direct competitors in their industry. Specify their digital strategy (e.g. custom case study funnels, semantic keyword clustering, structured JSON-LD entity markup) and explain how this translates to revenue or customer acquisition.
   3. Identify 3-4 specific visibility gaps, describing them with high technical detail (e.g. lack of local schema markup, zero citation visibility in Large Language Model retrieval systems, slow time-to-interactive, poor contact conversions).
   4. Draft a list of recommended modular service modules tailored to their ZAR {budget} budget constraint. The total cost of these services must fit within the budget.
      Choose services only from the following core Apex Digital offerings:
      - Custom Website Development (conversion-optimized layouts, ultra-fast static loading speeds, interactive client portals)
      - Search Engine Optimization (SEO) (Schema.org structured entity optimization, site speed fixes, high-intent local keyword hubs)
      - Generative Engine Optimization (GEO) (AI search citation seeding, structured brand footprint optimization for LLMs, semantic entity mapping)
      Configure each service with realistic base hours (e.g., 20-50 hours) and an estimated cost (e.g. calculated at R150/hour to R300/hour depending on technical complexity).
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