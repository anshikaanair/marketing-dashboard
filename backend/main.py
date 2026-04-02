from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import mimetypes
import base64
from google.genai import types
from google import genai
from dotenv import load_dotenv
from pathlib import Path

import json
import tempfile
import httpx
from bs4 import BeautifulSoup

from urllib.parse import urljoin
import re

async def scrape_website(url: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract potential logos
                logo_candidates = []
                
                # 1. Check link tags (favicon, apple-touch-icon)
                for link in soup.find_all("link", rel=lambda x: x and ("icon" in x.lower() or "apple-touch-icon" in x.lower())):
                    if link.get("href"):
                        logo_candidates.append(urljoin(url, link["href"]))
                
                # 2. Check meta tags (og:image)
                for meta in soup.find_all("meta", property=lambda x: x and x.lower() == "og:image"):
                    if meta.get("content"):
                        logo_candidates.append(urljoin(url, meta["content"]))
                
                # 3. Check imgtags with "logo" in name/alt/src/id/class
                for img in soup.find_all("img"):
                    alt = img.get("alt", "").lower()
                    src = img.get("src", "").lower()
                    img_id = img.get("id", "").lower()
                    img_class = " ".join(img.get("class", [])).lower()
                    
                    if any("logo" in x for x in [alt, src, img_id, img_class]):
                        if img.get("src"):
                            logo_candidates.append(urljoin(url, img["src"]))

                # Remove duplicates while preserving order
                logo_candidates = list(dict.fromkeys(logo_candidates))
                
                # 4. Extract potential colors from CSS
                css_colors = []
                for style in soup.find_all("style"):
                    if style.string:
                        # Find hex colors
                        hex_matches = re.findall(r'#[0-9a-fA-F]{6}', style.string)
                        css_colors.extend(hex_matches)
                
                # Also check common elements for background-color/color names if needed, 
                # but hex is more reliable for scraping.
                css_colors = list(dict.fromkeys(css_colors))[:30] # Top 30 unique hex codes
                
                # Remove script and style elements for text extraction
                for script_or_style in soup(['script', 'style']):
                    script_or_style.decompose()
                
                # Extract text and meta tags
                text = soup.get_text(separator=' ', strip=True)[:5000] # Limit to 5000 chars for LLM
                meta_desc = ""
                if soup.find("meta", attrs={"name": "description"}):
                    meta_desc = soup.find("meta", attrs={"name": "description"})["content"]
                
                return {
                    "content": f"Title: {soup.title.string if soup.title else ''}\nMeta Description: {meta_desc}\nBody Content: {text}",
                    "logo_candidates": logo_candidates[:10],
                    "css_colors": css_colors
                }
    except Exception as e:
        print(f"Scraping error: {e}")
    return {
        "content": "Could not scrape the website.",
        "logo_candidates": [],
        "css_colors": []
    }

# Load .env.local from the project root (one level up from backend/)
dotenv_path = Path(__file__).resolve().parent.parent / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Auth Config
GOOGLE_CREDS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "tenxds-agents-idp")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

if GOOGLE_CREDS:
    # If it's a JSON string (common in Render/Vercel), write it to a temp file
    if GOOGLE_CREDS.strip().startswith('{'):
        try:
            temp_creds_file = tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode='w')
            json.dump(json.loads(GOOGLE_CREDS), temp_creds_file)
            temp_creds_file.close()
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_creds_file.name
            print(f"Loaded credentials from JSON string (temp file: {temp_creds_file.name})")
        except Exception as e:
            print(f"Error parsing GOOGLE_APPLICATION_CREDENTIALS JSON: {e}")
    else:
        # It's already a file path
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDS
        print(f"Loaded credentials from path: {GOOGLE_CREDS}")

client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION
)

class ImageRequest(BaseModel):
    product_name: str
    ad_copy: str
    brand_name: str
    platform: str
    template: str = "Minimal" # Minimal, Bold, Gradient
    aesthetic: str = ""
    brand_values: list = []
    logo_url: str = ""
    colors: dict = {}
    typography: dict = {}
    layout_pattern: str = ""
    slide_number: int = 1
    total_slides: int = 1

class BrandAnalysisRequest(BaseModel):
    company_name: str
    url: str

@app.post("/analyze-brand")
async def analyze_brand(request: BrandAnalysisRequest):
    try:
        analysis_data = await scrape_website(request.url)
        website_content = analysis_data["content"]
        logo_candidates = analysis_data["logo_candidates"]
        css_colors = analysis_data["css_colors"]
        
        prompt = (
            f"Analyze the following website content for the company '{request.company_name}' and extract its COMPLETE brand DNA. "
            f"URL: {request.url}\n\n"
            f"Content: {website_content}\n\n"
            f"Potential Logo Candidates: {logo_candidates}\n\n"
            f"Potential Brand Colors found in CSS: {css_colors}\n\n"
            f"INSTRUCTION: Be extremely accurate. 10xDS for example uses a specific Purple/Blue theme (e.g. #7C3AED, #4F46E5). DO NOT return generic blue/gray unless you are certain. "
            f"Use the CSS colors provided above to cross-reference with the company's official brand. "
            f"Return a JSON object with the following fields:\n"
            f"- name: Company Name\n"
            f"- tagline: A short, catchy tagline\n"
            f"- business_overview: A 2-3 sentence overview of what they do\n"
            f"- industry: The primary industry\n"
            f"- colors: A JSON object with 'primary', 'secondary', and 'background' hex codes (BE PRECISE and elegant)\n"
            f"- typography: A JSON object with 'primary' and 'secondary' font names (standard web fonts or Google fonts)\n"
            f"- tone: One of [Professional, Innovative, Casual, Inspiring, Friendly, Authoritative, Playful, Bold]\n"
            f"- aesthetic: A description of their visual style (e.g., 'Minimalist and clean with generous white space')\n"
            f"- values: A list of 3-5 core brand values (e.g., ['Innovation', 'Sustainability'])\n"
            f"- logo_url: The MOST LIKELY logo URL from the candidates provided above. If candidates are useless, try to deduce it or use a high-quality SVG placeholder from a CDN.\n"
            f"- layout_pattern: A description of their common ad layout (e.g., 'Logo in bottom corner, large hero text, centered CTA')\n"
            f"- target_audience: Brief description of who they serve\n"
            f"- cta_style: Best default CTA (e.g., 'Get Started')\n\n"
            f"STRICT: Return ONLY the raw JSON object. No markdown formatting."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash", # Use flash for faster extraction
            contents=prompt
        )

        return json.loads(response.text.strip().replace('```json', '').replace('```', ''))

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        brand_context = ""
        if request.aesthetic:
            brand_context += f"Brand Aesthetic: {request.aesthetic}. "
        if request.brand_values:
            brand_context += f"Brand Values: {', '.join(request.brand_values)}. "
        if request.colors:
            brand_context += f"Primary Colors: {request.colors.get('primary', '')}, {request.colors.get('secondary', '')}. "
        if request.typography:
            brand_context += f"Typography: {request.typography.get('primary', '')}. "
        if request.layout_pattern:
            brand_context += f"Layout Template: {request.layout_pattern}. "

        prompt_text = (
            f"Create a HIGH-CONVERTING {request.platform} ad that MATCHES the visual DNA of {request.brand_name}. "
        )

        if request.total_slides > 1:
            prompt_text += f"\n### CAROUSEL POST CONTEXT:\nThis is Slide {request.slide_number} of {request.total_slides} in a cohesive carousel sequence.\n"
            if request.slide_number == 1:
                prompt_text += "- NARRATIVE FOCUS: THE HOOK. Create a high-impact visual that immediately grabs attention. Use the strongest part of the copy as a bold headline.\n"
            elif request.slide_number == 2:
                prompt_text += "- NARRATIVE FOCUS: VALUE PROPOSITION. Show the product's main benefit in action. Focus on a lifestyle image or clear product shot.\n"
            elif request.slide_number == 3:
                prompt_text += "- NARRATIVE FOCUS: FEATURES/PROOF. Highlight a key detail or suggest quality/trustworthiness.\n"
            else:
                prompt_text += "- NARRATIVE FOCUS: CALL TO ACTION. The final slide should drive the user to take action. Use clear branding and a strong sense of urgency.\n"
        
        prompt_text += (
            f"\n### BRAND DNA CONSTRAINTS (MANDATORY):\n"
            f"- PRIMARY BRAND COLORS: {request.colors.get('primary', 'N/A')}, {request.colors.get('secondary', 'N/A')}. Use these specific hex codes for all graphical elements and text accents.\n"
            f"- COMPANY LOGO: You MUST embed the company logo (visual reference: {request.logo_url}) into the bottom-right corner of the ad. Ensure it is clearly visible and clean.\n"
            f"- BRAND STYLE: {brand_context}\n"
            f"- LAYOUT PATTERN: {request.layout_pattern}. Follow this structural arrangement strictly.\n"
            f"- TYPOGRAPHY: {request.typography.get('primary', 'brand fonts')}.\n"
            f"- PRODUCT: {request.product_name}\n"
            f"- AD COPY: '{request.ad_copy}'\n\n"
            f"The image must be a premium, polished campaign asset with high-resolution photography. Avoid technical diagrams. The branding MUST be unmistakable."
        )

        generate_content_config = types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt_text,
            config=generate_content_config,
        )

        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    return {
                        "image": base64.b64encode(part.inline_data.data).decode("utf-8"),
                        "mime_type": part.inline_data.mime_type
                    }

        raise HTTPException(status_code=500, detail="No image data received from model")

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
