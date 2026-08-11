import os
import json
import logging
from typing import List, Optional, Dict, Any
from google import genai
from pydantic import BaseModel, Field

logger = logging.getLogger("visionpitch.ai_engine")

class Competitor(BaseModel):
    name: str = Field(description="Name of the competitor company")
    platform_leveraged: str = Field(
        description="Digital channel they are using effectively (e.g. active funnels, website, SEO engine, social automation)"
    )
    revenue_advantage: str = Field(
        description="How this platform setup drives their revenue or saves them operational time"
    )

class ServiceModule(BaseModel):
    service_name: str = Field(
        description="Name of service solution (e.g. Custom Website Development, Search Engine Optimization (SEO), Generative Engine Optimization (GEO))"
    )
    description: str = Field(
        description="Brief overview of how this module resolves a client digital visibility gap"
    )
    base_hours: int = Field(description="Default recommended execution hours")
    estimated_cost: float = Field(description="Base pricing calculation for this item")

class AuditResult(BaseModel):
    overall_score: int = Field(
        description="Overall audit health score out of 100 representing client digital maturity, e.g., 32"
    )
    technical_seo_score: int = Field(
        description="Technical SEO crawlability & indexability score out of 100, e.g., 32"
    )
    geo_score: int = Field(
        description="Generative Engine Optimization (AI Search) score out of 100, e.g., 20"
    )
    core_web_vitals_score: int = Field(
        description="Core Web Vitals & mobile performance score out of 100, e.g., 38"
    )
    schema_infrastructure_score: int = Field(
        description="Schema.org & structured data entity score out of 100, e.g., 25"
    )
    market_benchmark_scores: List[int] = Field(
        description="List of exactly 4 integers out of 100 representing market benchmark averages for [Technical SEO, AI Search (GEO), Core Web Vitals, Schema Infrastructure], e.g., [78, 70, 75, 82]"
    )
    online_sentiment_review: str = Field(
        description="Honest breakdown and analysis of the prospective client's current online footprint and public sentiment"
    )
    competitor_analysis: List[Competitor] = Field(
        description="A clear evaluation of exactly 3 competitors leveraging online channels effectively"
    )
    visibility_gaps: List[str] = Field(
        description="Bulleted list of the client's explicit online visibility gaps and weaknesses"
    )
    competitor_benchmarks: str = Field(
        description="Summary benchmarking client metrics directly against industry averages and competitors"
    )
    suggested_modules: List[ServiceModule] = Field(
        description="Modular service line-items configured specifically to fix their visibility gaps"
    )

_genai_client: Optional[genai.Client] = None

def get_genai_client() -> genai.Client:
    """Returns a cached singleton instance of the Gemini AI Client."""
    global _genai_client
    if _genai_client is None:
        api_key = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
        _genai_client = genai.Client(api_key=api_key)
    return _genai_client

def parse_social_platforms(social_str: Optional[str]) -> Dict[str, str]:
    """Categorizes dynamic or static social URLs by platform (Instagram, Facebook, LinkedIn, etc.)."""
    if not social_str:
        return {}
    
    raw_urls = [u.strip() for u in social_str.replace('\n', ',').split(',') if u.strip()]
    parsed: Dict[str, str] = {}
    other_links: List[str] = []
    
    for url in raw_urls:
        url_lower = url.lower()
        if "instagram.com" in url_lower:
            parsed["Instagram"] = url
        elif "facebook.com" in url_lower:
            parsed["Facebook"] = url
        elif "linkedin.com" in url_lower:
            parsed["LinkedIn"] = url
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            parsed["Twitter/X"] = url
        elif "tiktok.com" in url_lower:
            parsed["TikTok"] = url
        elif "youtube.com" in url_lower:
            parsed["YouTube"] = url
        else:
            other_links.append(url)
            
    if other_links:
        parsed["Other Profiles"] = ", ".join(other_links)
        
    return parsed

def get_fallback_audit(
    budget: Optional[float] = None,
    social_profiles: Optional[Dict[str, str]] = None,
    competitors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Provides fallback digital audit data when Gemini API is unready or offline."""
    if budget:
        dev_cost = round(budget * 0.45, 2)
        seo_cost = round(budget * 0.30, 2)
        geo_cost = round(budget * 0.20, 2)
    else:
        dev_cost = 12000.00
        seo_cost = 8000.00
        geo_cost = 5000.00

    if social_profiles:
        active_count = len(social_profiles)
        platforms_list = ", ".join(social_profiles.keys())
        sentiment_summary = (
            f"Active profile footprint detected on {platforms_list} ({active_count} channels). "
            f"Public sentiment is positive with active brand keywords, though cross-platform engagement can be further optimized."
        )
    else:
        sentiment_summary = (
            "The online presence is currently restricted, showing minimal search engine discovery index markers. "
            "Public brand sentiment is currently unmapped due to lack of domain indexation."
        )

    c_names = [
        competitors[0] if (competitors and len(competitors) > 0) else "Competitor Alpha",
        competitors[1] if (competitors and len(competitors) > 1) else "Competitor Beta",
        competitors[2] if (competitors and len(competitors) > 2) else "Competitor Gamma"
    ]

    return {
        "overall_score": 32,
        "technical_seo_score": 32,
        "geo_score": 20,
        "core_web_vitals_score": 38,
        "schema_infrastructure_score": 25,
        "market_benchmark_scores": [78, 70, 75, 82],
        "online_sentiment_review": sentiment_summary,
        "competitor_analysis": [
            {
                "name": c_names[0],
                "platform_leveraged": "Custom Funnels",
                "revenue_advantage": "Captures majority industry traffic via optimized local landing templates."
            },
            {
                "name": c_names[1],
                "platform_leveraged": "Semantic SEO Hubs",
                "revenue_advantage": "Maintains authority ranking for high-intent search keywords."
            },
            {
                "name": c_names[2],
                "platform_leveraged": "Automated Outreach",
                "revenue_advantage": "Speeds up user intake utilizing interactive onboarding forms."
            }
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

def run_ai_audit(
    client_name: str,
    company_name: str,
    industry: str,
    url: Optional[str],
    social: Optional[str],
    budget: Optional[float] = None,
    competitors: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Generates AI digital audit findings and recommended service modules using Gemini API (with local fallback)."""
    budget_text = f"R{budget} (ZAR)" if budget else "Not Specified (Provide standard recommended solutions)"
    social_profiles = parse_social_platforms(social)
    
    if social_profiles:
        social_footprint_text = "\n".join([f"     - {platform}: {link}" for platform, link in social_profiles.items()])
    else:
        social_footprint_text = "     - Not Provided"

    provided_comps = [c.strip() for c in (competitors or []) if c and c.strip()]
    num_provided = len(provided_comps)

    if num_provided == 3:
        comp_str = ", ".join(provided_comps)
        competitor_prompt_text = f"Target Competitors Specified by Sales Rep (3 of 3):\n" + "\n".join([f"     - {c}" for c in provided_comps])
        competitor_guideline = f"Research and profile specifically the 3 target competitors defined by the sales rep ({comp_str}). Analyze their digital strategy (e.g. custom case study funnels, semantic keyword clustering, structured JSON-LD entity markup) and explain how this translates to revenue or customer acquisition."
    elif num_provided in (1, 2):
        comp_str = ", ".join(provided_comps)
        needed = 3 - num_provided
        competitor_prompt_text = f"Target Competitor Seed Inputs Provided by Sales Rep ({num_provided} of 3):\n" + "\n".join([f"     - {c}" for c in provided_comps]) + f"\nNote: Use these provided competitor(s) to anchor the exact niche, positioning, and target audience, and discover {needed} additional direct local competitor(s) in the exact same niche to complete a 3-competitor benchmark analysis."
        competitor_guideline = f"Research and profile exactly 3 direct competitors in their industry. The sales representative provided {num_provided} anchor competitor(s): ({comp_str}). You MUST include these provided competitor(s) as primary benchmark anchors, AND analyze their niche to discover {needed} additional direct competitor(s) operating in the exact same market niche to fill out all 3 competitor profiles. Analyze their digital strategies and explain how their positioning translates to revenue or customer acquisition."
    else:
        competitor_prompt_text = "Target Competitors: None specified (research top 3 direct local competitors automatically based on client industry and website)."
        competitor_guideline = "Research and profile exactly 3 direct competitors in their industry. Specify their digital strategy (e.g. custom case study funnels, semantic keyword clustering, structured JSON-LD entity markup) and explain how this translates to revenue or customer acquisition."

    prompt = f"""You are the Senior Digital Strategist and Technical Architect at Apex Digital SA, a premier South African agency specializing in high-performance Website Development, Search Engine Optimization (SEO), and Generative Engine Optimization (GEO / AI Search Optimization).

Perform a comprehensive, professional digital visibility audit and strategic proposal for a prospective client.

Client Profile:
- Contact Person: {client_name}
- Company Name: {company_name}
- Industry: {industry}
- Website URL: {url if url else 'Not Provided'}
- Social Media Footprint (Categorized by Platform):
{social_footprint_text}
- Allocated Budget: {budget_text}
- {competitor_prompt_text}

Audit Guidelines:
1. Analyze the client's current online footprint (or projected setup if website is Not Provided). Focus on:
   - Technical weaknesses, speed bottlenecks, mobile usability issues (Website Development gaps).
   - Core Web Vitals, indexability, crawlability, search engine trust factors (SEO gaps).
   - Zero-click search footprint, lack of citations/mentions in AI search answers like Gemini, Perplexity, and ChatGPT (GEO/AI search visibility gaps).
   - Platform-specific presence across Instagram, Facebook, LinkedIn, and submitted profiles to analyze public sentiment, social authority, and audience engagement.
2. {competitor_guideline}
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

    def tag_competitors(data: Dict[str, Any], provided: List[str]) -> Dict[str, Any]:
        comp_list = data.get("competitor_analysis", [])
        prov_clean = [p.lower() for p in provided if p]
        for idx, item in enumerate(comp_list):
            item_name = item.get("name", "").lower()
            if prov_clean and (idx < len(prov_clean) or any(p in item_name or item_name in p for p in prov_clean)):
                item["is_anchor"] = True
                item["source_label"] = "Sales Rep Anchor Input"
            else:
                item["is_anchor"] = False
                item["source_label"] = "AI Discovered Niche Competitor"
        return data

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': AuditResult,
            }
        )
        parsed_json = json.loads(response.text)
        return tag_competitors(parsed_json, provided_comps)
    except Exception as e:
        logger.warning("Gemini API pipeline unready or failed (%s). Implementing fallback engine.", e)
        fallback_data = get_fallback_audit(budget, social_profiles, competitors)
        return tag_competitors(fallback_data, provided_comps)

def rerun_competitor_analysis(
    client_name: str,
    company_name: str,
    industry: str,
    url: Optional[str],
    new_competitors: List[str]
) -> Dict[str, Any]:
    """Re-runs targeted competitor analysis and benchmark synthesis using a new list of competitors."""
    provided_comps = [c.strip() for c in new_competitors if c and c.strip()]
    if not provided_comps:
        provided_comps = ["Competitor Alpha", "Competitor Beta", "Competitor Gamma"]

    comp_str = ", ".join(provided_comps)
    prompt = f"""You are the Senior Digital Strategist at Apex Digital SA.

Re-run the competitor intelligence audit for the prospective client using the newly specified direct competitors:
- Client Company: {company_name}
- Industry: {industry}
- Client Website: {url if url else 'Not Provided'}
- Target Competitors Specified by Sales Rep: {comp_str}

Tasks:
1. Provide a clear evaluation of exactly 3 competitors leveraging online channels effectively (using the provided list: {comp_str}). For each competitor, specify their name, the digital platform they leverage, and their revenue advantage.
2. Provide an updated market benchmark summary comparing the client directly against these competitors.

Output JSON format matching this schema:
{{
  "competitor_analysis": [
    {{"name": "{provided_comps[0]}", "platform_leveraged": "...", "revenue_advantage": "..."}},
    {{"name": "{provided_comps[1] if len(provided_comps) > 1 else 'Competitor 2'}", "platform_leveraged": "...", "revenue_advantage": "..."}},
    {{"name": "{provided_comps[2] if len(provided_comps) > 2 else 'Competitor 3'}", "platform_leveraged": "...", "revenue_advantage": "..."}}
  ],
  "competitor_benchmarks": "Updated summary benchmarking client metrics..."
}}
"""

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        parsed = json.loads(response.text)
        return {
            "competitor_analysis": parsed.get("competitor_analysis", []),
            "competitor_benchmarks": parsed.get("competitor_benchmarks", "")
        }
    except Exception as e:
        logger.warning("Gemini API competitor rerun failed (%s). Using fallback calculation.", e)
        fallback_comps = []
        for name in provided_comps[:3]:
            fallback_comps.append({
                "name": name,
                "platform_leveraged": "Digital Funnels & SEO",
                "revenue_advantage": f"Establishes market authority and captures organic search leads in {industry}."
            })
        return {
            "competitor_analysis": fallback_comps,
            "competitor_benchmarks": f"Industry average performance remains at 70-75%. Benchmarked directly against {comp_str}."
        }

def query_audit_copilot(
    audit_context: Dict[str, Any],
    chat_history: List[Dict[str, str]],
    user_prompt: str
) -> str:
    """Interacts with Gemini AI Copilot to answer sales rep questions and research audit issues further."""
    system_context = f"""You are the Apex VisionPitch AI Copilot — an elite technical digital architect assisting an Apex Digital sales rep.

Client Audit Context:
- Client / Company: {audit_context.get('client_name', 'Client')} ({audit_context.get('company_name', 'Company')})
- Industry: {audit_context.get('industry', 'N/A')}
- Overall Audit Score: {audit_context.get('overall_score', 'N/A')}/100
- Technical Scores: SEO: {audit_context.get('scores', [0,0,0,0])[0]}, GEO: {audit_context.get('scores', [0,0,0,0])[1]}, Speed: {audit_context.get('scores', [0,0,0,0])[2]}, Schema: {audit_context.get('scores', [0,0,0,0])[3]}
- Current Online Sentiment Summary: {audit_context.get('online_sentiment_review', 'N/A')}
- Current Visibility Gaps: {json.dumps(audit_context.get('visibility_gaps', []))}
- Sales Rep Internal Notes: {audit_context.get('rep_notes', 'None')}

Guidelines for your response:
1. Provide authoritative, concise, actionable advice tailored for sales positioning and client presentation.
2. If asked to write or rewrite an audit section, provide ready-to-use copy that can be directly applied to the audit.
3. Keep formatting clean with clear headings, bullet points, or direct snippets.
"""

    messages = [system_context]
    for msg in chat_history[-6:]:  # Keep last 6 messages for context
        role_label = "Sales Rep" if msg.get("role") == "user" else "Copilot"
        messages.append(f"{role_label}: {msg.get('text')}")

    messages.append(f"Sales Rep: {user_prompt}")
    full_prompt = "\n\n".join(messages)

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.warning("Gemini AI Copilot query failed (%s). Returning fallback advice.", e)
        return f"AI Copilot Offline Note: Unable to query Gemini directly ({str(e)}). Consider manually reviewing technical SEO crawlability, Schema.org LocalBusiness markup, and mobile Core Web Vitals for {audit_context.get('company_name', 'this client')}."

def realign_services_with_audit(
    client_name: str,
    company_name: str,
    industry: str,
    budget: Optional[float],
    audit_data: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generates tailored recommended service modules based on updated audit scores and visibility gaps."""
    gaps_list = audit_data.get("visibility_gaps", [])
    gaps_str = "\n".join(f"- {g}" for g in gaps_list) if gaps_list else "- General digital authority & technical SEO optimization."
    scores = audit_data.get("scores", [32, 20, 38, 25])
    
    target_budget = float(budget) if budget and float(budget) > 0 else 15000.0

    prompt = f"""You are Apex Digital's Senior Solution Architect.
Client: {company_name} ({industry})
Target Budget: R{target_budget:.2f}
Updated Audit Scores (out of 100):
- Technical SEO: {scores[0]}
- GEO (AI Search): {scores[1]}
- Core Web Vitals: {scores[2]}
- Schema Infrastructure: {scores[3]}

Updated Audit Visibility Gaps:
{gaps_str}

Generate a JSON array of 3 to 4 recommended service modules that directly resolve these specific visibility gaps.
Ensure total estimated cost across all modules stays between 60% and 100% of the target budget (R{target_budget:.2f}).

JSON output format strictly:
[
  {{
    "service_name": "Module Title",
    "description": "Clear description resolving specific audit gap",
    "base_hours": 20,
    "estimated_cost": 7500.0
  }}
]
"""

    try:
        client = get_genai_client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )
        parsed = json.loads(response.text)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
    except Exception as e:
        logger.warning("Gemini API service realignment failed (%s). Using fallback service calculations.", e)

    # Robust Fallback Service Modules directly proportional to budget
    m1_cost = round(target_budget * 0.35, -2)
    m2_cost = round(target_budget * 0.30, -2)
    m3_cost = round(target_budget * 0.25, -2)

    return [
        {
            "service_name": "Technical SEO & CWV Sprint",
            "description": "Remediates core web vitals deficits, mobile responsiveness bottlenecks, and indexing gaps.",
            "base_hours": 20,
            "estimated_cost": max(m1_cost, 3500.0)
        },
        {
            "service_name": "Generative Engine Optimization (GEO)",
            "description": "Engineers Schema.org knowledge graph and structured entity citations for ChatGPT & Gemini discovery.",
            "base_hours": 15,
            "estimated_cost": max(m2_cost, 3000.0)
        },
        {
            "service_name": "Conversion Engine & CRM Integration",
            "description": "Implements automated lead capture funnels and local competitive positioning assets.",
            "base_hours": 12,
            "estimated_cost": max(m3_cost, 2500.0)
        }
    ]