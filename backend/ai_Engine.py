import os
import json
from google import genai
from pydantic import BaseModel , Field
from typing import List, Optional


class Competitor(BaseModel):
    name: str = Field(description = "Name of the competitor company")
    platform_leveraged: str = Field(description="Digital channel they are using effectively(e.g. active funnels , website ,SEO engine , social automation)")
    revenue_advantage: str = Field(description="How this platform setup drives their revenue or saves them operational time")

class ServiceModule(BaseModel):
    service_name: str = Field (description="Name of service solution (e.g. Custom Website Development, Search Engine Optimization (SEO), Generative Engine Optimization (GEO))")
    description: str = Field(description="Brief overview of how this module resolves a client digital visibility gap")
    base_hours: int = Field(description="Default recommended execution hours")
    estimated_cost: float = Field(description="Base pricing calculation for this item")

class AuditResult(BaseModel):
    overall_score: int = Field(description="Overall audit health score out of 100 representing client digital maturity, e.g., 32")
    technical_seo_score: int = Field(description="Technical SEO crawlability & indexability score out of 100, e.g., 32")
    geo_score: int = Field(description="Generative Engine Optimization (AI Search) score out of 100, e.g., 20")
    core_web_vitals_score: int = Field(description="Core Web Vitals & mobile performance score out of 100, e.g., 38")
    schema_infrastructure_score: int = Field(description="Schema.org & structured data entity score out of 100, e.g., 25")
    market_benchmark_scores: List[int] = Field(description="List of exactly 4 integers out of 100 representing market benchmark averages for [Technical SEO, AI Search (GEO), Core Web Vitals, Schema Infrastructure], e.g., [78, 70, 75, 82]")
    online_sentiment_review: str = Field(description="Honest breakdown and analysis of the prospective client's current online footprint and public sentiment")
    competitor_analysis: List[Competitor] = Field(description="A clear evaluation of exactly 3 competitors leveraging online channels effectively")
    visibility_gaps: List[str] = Field(description="Bulleted list of the client's explicit online visibility gaps and weaknesses")
    competitor_benchmarks: str = Field(description="Summary benchmarking client metrics directly against industry averages and competitors")
    suggested_modules: List[ServiceModule] = Field(description="Modular service line-items configured specifically to fix their visibility gaps")
   

# Generates AI digital audit findings and recommended service modules using Gemini API (with local fallback)
def run_ai_audit(client_name:str , company_name: str , industry:str , url:str, social: str, budget: Optional[float] = None) -> dict:

   api_key = os.getenv("GEMINI_API_KEY","YOUR_GEMINI_API_KEY")
   client = genai.Client(api_key=api_key) 

   budget_text = f"R{budget} (ZAR)" if budget else "Not Specified (Provide standard recommended solutions)"

   # Construct prompt with client details and scoping rules
   prompt = f"""
   You are the Senior Digital Strategist and Technical Architect at Apex Digital SA, a premier South African agency specializing in high-performance Website Development, Search Engine Optimization (SEO), and Generative Engine Optimization (GEO / AI Search Optimization).

   Perform a comprehensive, professional digital visibility audit and strategic proposal for a prospective client.
   
   Client Profile:
   - Contact Person: {client_name}
   - Company Name: {company_name}
   - Industry: {industry}
   - Website URL: {url if url else 'Not Provided'}
   - Social Footprint: {social if social else 'Not Provided'}
   - Allocated Budget: {budget_text}

   Audit Guidelines:
   1. Analyze the client's current online footprint (or projected setup if website is Not Provided). Focus on:
      - Technical weaknesses, speed bottlenecks, mobile usability issues (Website Development gaps).
      - Core Web Vitals, indexability, crawlability, search engine trust factors (SEO gaps).
      - Zero-click search footprint, lack of citations/mentions in AI search answers like Gemini, Perplexity, and ChatGPT (GEO/AI search visibility gaps).
   2. Research and profile exactly 3 direct competitors in their industry. Specify their digital strategy (e.g. custom case study funnels, semantic keyword clustering, structured JSON-LD entity markup) and explain how this translates to revenue or customer acquisition.
   3. Identify 3-4 specific visibility gaps, describing them with high technical detail (e.g. lack of local schema markup, zero citation visibility in Large Language Model retrieval systems, slow time-to-interactive, poor contact conversions).
   4. Draft a list of recommended modular service modules tailored to their ZAR budget constraint if specified:
      - If a budget is specified, the sum of estimated costs of all suggested services must be within the budget constraint (greater than or equal to 60% of the budget, and less than or equal to 100% of the budget) to ensure we do not sell the services at a loss while solving their visibility gaps.
      - If no budget is specified, configure standard baseline services matching the scope, typically totaling between R10,000 and R30,000 (ZAR).
      Choose services only from the following core Apex Digital offerings:
      - Custom Website Development (conversion-optimized layouts, ultra-fast static loading speeds, interactive client portals)
      - Search Engine Optimization (SEO) (Schema.org structured entity optimization, site speed fixes, high-intent local keyword hubs)
      - Generative Engine Optimization (GEO) (AI search citation seeding, structured brand footprint optimization for LLMs, semantic entity mapping)
      Configure each service with realistic base hours (e.g., 20-50 hours) and an estimated cost (e.g. calculated at R150/hour to R300/hour depending on technical complexity).
   """
  
   try:
       # Ask Gemini to return JSON adhering strictly to the AuditResult schema
       response = client.models.generate_content(
           model='gemini-2.5-flash',
           contents=prompt,
           config={
               'response_mime_type': 'application/json',
               'response_schema': AuditResult,
           }
       )
       return json.loads(response.text)
   except Exception as e:
       print(f"Defensive Interceptor: Gemini API pipeline failed ({e}). Implementing pre-cached local fallback.")
       
       # Pre-cached fallback calculation if API fails or key is unconfigured
       if budget and budget > 0:
           dev_cost = round(budget * 0.45)
           seo_cost = round(budget * 0.30)
           geo_cost = round(budget * 0.25)
       else:
           dev_cost = 12000.0
           seo_cost = 8000.0
           geo_cost = 6000.0
       
       return {
            "overall_score": 32,
            "technical_seo_score": 32,
            "geo_score": 20,
            "core_web_vitals_score": 38,
            "schema_infrastructure_score": 25,
            "market_benchmark_scores": [78, 70, 75, 82],
            "online_sentiment_review": "The online presence is currently restricted, showing minimal search engine discovery index markers. Public brand sentiment is currently unmapped due to lack of domain indexation.",
            "competitor_analysis": [
               {"name": "Competitor Alpha", "platform_leveraged": "Custom Funnels", "revenue_advantage": "Captures majority industry traffic via optimized local landing templates."},
               {"name": "Competitor Beta", "platform_leveraged": "Semantic SEO Hubs", "revenue_advantage": "Maintains authority ranking for high-intent search keywords."},
               {"name": "Competitor Gamma", "platform_leveraged": "Automated Outreach", "revenue_advantage": "Speeds up user intake utilizing interactive onboarding forms."}
            ],
            "visibility_gaps": [
               "Missing Structured Schema.org JSON-LD entity markup profiles.",
               "Mobile page speed latency resulting in potential conversion leakage.",
               "Low authority citation index density in LLM Retrieval Engines (GEO Gaps)."
           ],
           "competitor_benchmarks": "Industry visibility average sits at 70%. The current company domain registers negligible tracking signals.",
           "suggested_modules": [
               {
                   "service_name": "Custom Website Development",
                   "description": "Redesign UI to establish a mobile-first conversion funnel.",
                   "base_hours": 30,
                   "estimated_cost": float(dev_cost)
               },
               {
                   "service_name": "Search Engine Optimization (SEO)",
                   "description": "Construct local citation directory links and configure structured meta data tags.",
                   "base_hours": 20,
                   "estimated_cost": float(seo_cost)
               },
               {
                   "service_name": "Generative Engine Optimization (GEO)",
                   "description": "Inject semantic key-value terms into content layers to register on AI search indexes.",
                   "base_hours": 20,
                   "estimated_cost": float(geo_cost)
               }
           ]
       }