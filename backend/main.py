# -*- coding: utf-8 -*-
from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import mimetypes
import base64
import uuid
import secrets
import hashlib
import json
import tempfile
import httpx
import traceback
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from google.genai import types
from google import genai
from google.cloud import storage
from google.oauth2 import service_account
from google.cloud import firestore as google_firestore
from dotenv import load_dotenv
from pathlib import Path
from datetime import timedelta

# Load .env.local from the project root (one level up from backend/)
dotenv_path = Path(__file__).resolve().parent.parent / ".env.local"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service account credentials (used for Firestore DB and Vertex AI)
default_cred_path = r"C:\marketing-dashboard\tenxds-agents-idp-d6255abdab11.json"
# Read from env var if set (useful for Render), else use local default
CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", default_cred_path)
DATABASE_NAME = "marketing-agents"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIALS_PATH
PROJECT_ID = "tenxds-agents-idp"
LOCATION = "us-central1"

# Vertex AI client
client = genai.Client(
    vertexai=True,
    project=PROJECT_ID,
    location=LOCATION
)

# Google Cloud Storage Client
storage_client = storage.Client.from_service_account_json(CREDENTIALS_PATH)
BUCKET_NAME = "anshika-marketing"

# Firestore client using service account (marketing-agents database)
sa_creds = service_account.Credentials.from_service_account_file(CREDENTIALS_PATH)
db = google_firestore.Client(
    project=PROJECT_ID,
    credentials=sa_creds,
    database=DATABASE_NAME
)

# In-memory session store: token -> user info
active_sessions: dict = {}

# Startup Event: Load persisted sessions from Firestore into the cache
@app.on_event("startup")
async def load_sessions():
    try:
        print("Loading active sessions from Firestore...")
        sessions_ref = db.collection("sessions").stream()
        count = 0
        for doc in sessions_ref:
            active_sessions[doc.id] = doc.to_dict()
            count += 1
        print(f"Successfully loaded {count} active sessions.")
    except Exception as e:
        print(f"Failed to load sessions on startup: {e}")

security = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Auth Models
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

# ---------------------------------------------------------------------------
# Auth Helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    user = active_sessions.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------
@app.post("/auth/login")
async def login(request: LoginRequest):
    try:
        users_ref = db.collection("users")
        query = users_ref.where("email", "==", request.email).limit(1).stream()
        docs = list(query)

        if not docs:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_doc = docs[0]
        user_data = user_doc.to_dict()

        stored_hash = user_data.get("password_hash", "")
        if stored_hash and stored_hash != hash_password(request.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = generate_token()
        user_info = {
            "uid": user_doc.id,
            "id": user_doc.id,  # Add id alias for frontend compatibility
            "email": user_data.get("email", request.email),
            "displayName": user_data.get("full_name") or user_data.get("displayName", ""),
        }
        active_sessions[token] = user_info
        
        # Persist session to Firestore
        try:
            db.collection("sessions").document(token).set(user_info)
        except Exception as fs_err:
            print(f"Failed to save session to Firestore: {fs_err}")

        return {"token": token, "user": user_info}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/signup")
async def signup(request: SignupRequest):
    try:
        users_ref = db.collection("users")

        # Check if user already exists
        existing = list(users_ref.where("email", "==", request.email).limit(1).stream())
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")

        # Create the user
        new_user_ref = users_ref.document()
        user_data = {
            "email": request.email,
            "full_name": request.full_name,
            "password_hash": hash_password(request.password),
            "created_at": google_firestore.SERVER_TIMESTAMP,
        }
        new_user_ref.set(user_data)

        token = generate_token()
        user_info = {
            "uid": new_user_ref.id,
            "id": new_user_ref.id,  # Add id alias for frontend compatibility
            "email": request.email,
            "displayName": request.full_name,
        }
        active_sessions[token] = user_info
        
        # Persist session to Firestore
        try:
            db.collection("sessions").document(token).set(user_info)
        except Exception as fs_err:
            print(f"Failed to save session to Firestore: {fs_err}")

        return {"token": token, "user": user_info}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials:
        token = credentials.credentials
        active_sessions.pop(token, None)
        try:
            db.collection("sessions").document(token).delete()
        except Exception as fs_err:
            print(f"Failed to delete session from Firestore: {fs_err}")
    return {"message": "Logged out"}

@app.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

# ---------------------------------------------------------------------------
# Generic Database CRUD Endpoints (Exposes Firestore to frontend Mock Client)
# ---------------------------------------------------------------------------
@app.get("/db/{collection_name}")
async def get_db_documents(
    collection_name: str,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        params = dict(request.query_params)
        user_id = user["uid"]
        ref = db.collection(collection_name)

        # Enforce filter on document ID directly if filter_id is supplied
        doc_id = params.get("filter_id")
        if doc_id:
            doc_ref = ref.document(doc_id)
            doc = doc_ref.get()
            if not doc.exists:
                return []
            doc_data = doc.to_dict()
            if doc_data.get("user_id") != user_id:
                raise HTTPException(status_code=403, detail="Permission denied")
            doc_data["id"] = doc.id
            if "account_id" in doc_data and doc_data["account_id"] is not None:
                doc_data["account_id"] = str(doc_data["account_id"])
            return [doc_data]

        # Enforce user ownership of documents
        docs = ref.where("user_id", "==", user_id).stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            d["id"] = doc.id
            if "account_id" in d and d["account_id"] is not None:
                d["account_id"] = str(d["account_id"])
            results.append(d)

        # Apply other filters in Python memory (avoids composite index requirements)
        for k, v in params.items():
            if k.startswith("filter_") and k != "filter_id" and k != "filter_user_id":
                if k.endswith("_in"):
                    field_name = k[7:-3]
                    allowed_vals = v.split(",")
                    results = [item for item in results if str(item.get(field_name)) in allowed_vals]
                else:
                    field_name = k[7:]
                    parsed_val = v
                    if v.lower() == "true":
                        parsed_val = True
                    elif v.lower() == "false":
                        parsed_val = False
                    else:
                        try:
                            if "." in v:
                                parsed_val = float(v)
                            else:
                                parsed_val = int(v)
                        except ValueError:
                            pass
                    results = [item for item in results if item.get(field_name) == parsed_val]

        # Apply sorting in Python memory
        order_by = params.get("order_by")
        if order_by:
            order_dir = params.get("order_dir", "asc")
            reverse = (order_dir == "desc")
            
            def get_sort_key(item):
                val = item.get(order_by)
                if val is None:
                    return "" if reverse else "\xff\xff"
                return val
                
            results.sort(key=get_sort_key, reverse=reverse)

        # Apply limit in Python memory
        limit_val = params.get("limit")
        if limit_val:
            try:
                results = results[:int(limit_val)]
            except ValueError:
                pass

        return results

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching from collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/db/{collection_name}")
async def create_db_document(
    collection_name: str,
    payload: dict,
    user = Depends(get_current_user)
):
    try:
        user_id = user["uid"]
        payload["user_id"] = user_id
        
        # If payload has 'id', remove it to avoid setting it as a field
        doc_id = payload.pop("id", None)
        
        ref = db.collection(collection_name)
        if doc_id:
            # If front-end specifies a UUID (e.g. from Supabase default schema template)
            doc_ref = ref.document(doc_id)
        else:
            doc_ref = ref.document()
            
        if "account_id" in payload and payload["account_id"] is not None:
            payload["account_id"] = str(payload["account_id"])

        doc_ref.set(payload)
        
        created_doc = doc_ref.get().to_dict()
        created_doc["id"] = doc_ref.id
        if "account_id" in created_doc and created_doc["account_id"] is not None:
            created_doc["account_id"] = str(created_doc["account_id"])
        return created_doc
    except Exception as e:
        print(f"Error creating in collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/db/{collection_name}")
async def update_db_document(
    collection_name: str,
    payload: dict,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        user_id = user["uid"]
        params = dict(request.query_params)
        
        doc_id = params.get("filter_id")
        if not doc_id:
            raise HTTPException(status_code=400, detail="Document ID filter (filter_id) is required for updates")
            
        ref = db.collection(collection_name)
        doc_ref = ref.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Document not found")
            
        doc_data = doc.to_dict()
        if doc_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
            
        # Strip identifiers from the payload
        payload.pop("id", None)
        payload.pop("user_id", None)
        if "account_id" in payload and payload["account_id"] is not None:
            payload["account_id"] = str(payload["account_id"])
        doc_ref.update(payload)
        
        updated_doc = doc_ref.get().to_dict()
        updated_doc["id"] = doc_ref.id
        if "account_id" in updated_doc and updated_doc["account_id"] is not None:
            updated_doc["account_id"] = str(updated_doc["account_id"])
        return updated_doc
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating in collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/db/{collection_name}")
async def delete_db_document(
    collection_name: str,
    request: Request,
    user = Depends(get_current_user)
):
    try:
        user_id = user["uid"]
        params = dict(request.query_params)
        
        doc_id = params.get("filter_id")
        if not doc_id:
            raise HTTPException(status_code=400, detail="Document ID filter (filter_id) is required for deletes")
            
        ref = db.collection(collection_name)
        doc_ref = ref.document(doc_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Document not found")
            
        doc_data = doc.to_dict()
        if doc_data.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
            
        doc_ref.delete()
        return {"status": "success", "id": doc_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting from collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Brand Scraping and DNA Analysis Endpoints
# ---------------------------------------------------------------------------
async def scrape_website(url: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                logo_candidates = []
                for link in soup.find_all("link", rel=lambda x: x and ("icon" in x.lower() or "apple-touch-icon" in x.lower())):
                    if link.get("href"):
                        logo_candidates.append(urljoin(url, link["href"]))
                
                for meta in soup.find_all("meta", property=lambda x: x and x.lower() == "og:image"):
                    if meta.get("content"):
                        logo_candidates.append(urljoin(url, meta["content"]))
                
                for img in soup.find_all("img"):
                    alt = img.get("alt", "").lower()
                    src = img.get("src", "").lower()
                    img_id = img.get("id", "").lower()
                    img_class = " ".join(img.get("class", [])).lower()
                    
                    if any(x in y for x in ["logo"] for y in [alt, src, img_id, img_class]):
                        if img.get("src"):
                            logo_candidates.append(urljoin(url, img["src"]))

                logo_candidates = list(dict.fromkeys(logo_candidates))
                
                css_colors = []
                for style in soup.find_all("style"):
                    if style.string:
                        hex_matches = re.findall(r'#[0-9a-fA-F]{6}', style.string)
                        css_colors.extend(hex_matches)
                
                css_colors = list(dict.fromkeys(css_colors))[:30]
                
                for script_or_style in soup(['script', 'style']):
                    script_or_style.decompose()
                
                text = soup.get_text(separator=' ', strip=True)[:5000]
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
            model="gemini-2.5-flash",
            contents=prompt
        )

        return json.loads(response.text.strip().replace('```json', '').replace('```', ''))

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Brand Study and Image Generation Workflow
# ---------------------------------------------------------------------------
class StudyRequest(BaseModel):
    brand_name: str
    platform: str
    website_url: Optional[str] = ""
    colors: Optional[dict] = {}
    typography: Optional[dict] = {}
    layout_pattern: Optional[str] = ""
    aesthetic: Optional[str] = ""

@app.post("/study-platform-style")
async def study_platform_style(req: StudyRequest):
    try:
        # Target image/design-centric search to surface actual post visuals
        search_query = (
            f'"{req.brand_name}" {req.platform} post design template layout brand visual identity'
            f' "{req.brand_name}" {req.platform} feed grid branding color typography'
        )
        if req.website_url:
            clean_domain = req.website_url.replace("https://", "").replace("http://", "").split("/")[0]
            search_query += f' OR site:{clean_domain} {req.platform} brand image design'

        style_prompt = (
            f"You are an elite social media brand design analyst. Your job is to study the EXACT visual design language "
            f"that '{req.brand_name}' uses on their '{req.platform}' profile — their post templates, graphic compositions, "
            f"color palettes, font choices, and layout patterns.\n\n"
            f"Search grounding: {search_query}\n\n"
            f"Study '{req.brand_name}' on '{req.platform}' and extract:\n"
            f"1. POST TEMPLATE: Exact layout structure (e.g. 'full-bleed photo with semi-transparent dark overlay, large white "
            f"headline at top-center, brand color bar at bottom with logo left and CTA right').\n"
            f"2. VISUAL STYLE: The graphic treatment (e.g. 'corporate flat-design illustrations with tech imagery', "
            f"'lifestyle photography with minimal copy overlays', 'bold typographic cards with geometric shapes').\n"
            f"3. TYPOGRAPHY: Specific font families, weights, sizes, and capitalization used in their posts.\n"
            f"4. COLOR HEX CODES: Exact primary brand color and background/card color (e.g. '#4F46E5' and '#0F0F0F').\n"
            f"5. LAYOUT PATTERN: Where logo, headline, subtext, visuals, and CTA are spatially positioned.\n\n"
            f"If platform-specific data is sparse, synthesize a professional {req.platform} style from:\n"
            f"- Aesthetic: {req.aesthetic or 'N/A'}\n"
            f"- Colors: {req.colors or 'N/A'}\n"
            f"- Typography: {req.typography or 'N/A'}\n"
            f"- Layout: {req.layout_pattern or 'N/A'}\n\n"
            f"Return a JSON object with EXACTLY these keys:\n"
            f"- brand_style: (string) Precise visual style descriptor (e.g. 'Bold B2B tech — dark backgrounds, neon accent lines, isometric 3D illustrations')\n"
            f"- template: (string) Detailed post template layout description (e.g. '1:1 square, dark navy background, full-width headline in white at top-40%, brand-colored underline accent, product render bottom-right, logo top-left')\n"
            f"- font: (string) Primary typeface name (e.g. 'Inter', 'Helvetica Neue', 'Montserrat')\n"
            f"- primary_color: (string) Primary brand hex (e.g. '#7C3AED')\n"
            f"- background_color: (string) Post background hex (e.g. '#0A0A1A')\n"
            f"- layout_pattern: (string) Spatial arrangement of all design elements\n"
            f"- studied_details: (string) 2-3 sentence synthesis of their exact {req.platform} visual signature and what makes their posts unmistakably theirs.\n\n"
            f"CRITICAL: Return ONLY the raw JSON object. No markdown, no code fences, no preamble."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=style_prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

        text_clean = response.text.strip()
        # Layer 1: strip markdown code fences
        if "```json" in text_clean:
            text_clean = text_clean.split("```json")[1].split("```")[0].strip()
        elif "```" in text_clean:
            text_clean = text_clean.split("```")[1].split("```")[0].strip()
        # Layer 2: extract first JSON object via regex if plain parse fails
        try:
            data = json.loads(text_clean)
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]+\}', text_clean)
            if match:
                data = json.loads(match.group(0))
            else:
                raise
        return data

    except Exception as e:
        print(f"Error in study-platform-style: {e}")
        fallback_style = f"Clean, modern {req.platform} campaign style matching {req.aesthetic or 'the brand aesthetic'}"
        fallback_template = req.layout_pattern or "Minimalist overlay layout with logo in corner"
        fallback_font = (req.typography.get("primary", "Inter") if req.typography else "Inter")
        fallback_primary = (req.colors.get("primary", "#007cba") if req.colors else "#007cba")
        fallback_background = (req.colors.get("background", "#f8f8f8") if req.colors else "#f8f8f8")
        fallback_layout = req.layout_pattern or "Logo bottom-left, headline centered, primary color accents on borders"

        return {
            "brand_style": fallback_style,
            "template": fallback_template,
            "font": fallback_font,
            "primary_color": fallback_primary,
            "background_color": fallback_background,
            "layout_pattern": fallback_layout,
            "studied_details": (
                f"{req.brand_name} posts on {req.platform} use a {fallback_style} with {fallback_template}. "
                f"Primary color {fallback_primary} against {fallback_background} background. "
                f"Typography is {fallback_font} with clean, professional spacing."
            )
        }

class ImageRequest(BaseModel):
    product_name: str
    ad_copy: str
    brand_name: str
    platform: str
    template: str = "Minimal"
    aesthetic: str = ""
    brand_values: list = []
    logo_url: str = ""
    colors: dict = {}
    typography: dict = {}
    layout_pattern: str = ""
    slide_number: int = 1
    total_slides: int = 1
    website_url: Optional[str] = ""
    # Fields passed from 1st API Call:
    platform_brand_style: Optional[str] = ""
    platform_template: Optional[str] = ""
    platform_font: Optional[str] = ""
    platform_primary_color: Optional[str] = ""
    platform_background_color: Optional[str] = ""
    platform_layout_pattern: Optional[str] = ""
    studied_details: Optional[str] = ""

@app.post("/generate-image")
async def generate_image(img_req: ImageRequest, request: Request):
    try:
        # Resolve all brand design parameters
        # Fix operator-precedence: use explicit parentheses for all ternary chains
        platform_style_details = img_req.studied_details or ""
        platform_brand_style = img_req.platform_brand_style or img_req.aesthetic or ""
        platform_template = img_req.platform_template or img_req.layout_pattern or ""
        platform_font = (
            img_req.platform_font
            or (img_req.typography.get('primary', 'Inter') if img_req.typography else 'Inter')
        )
        # Brand's stored colors take priority — the platform study may return inaccurate/lighter colors
        primary_color = (
            (img_req.colors.get('primary', '') if img_req.colors else '')
            or img_req.platform_primary_color
        )
        secondary_color = (img_req.colors.get('secondary', '') if img_req.colors else '')
        # Background MUST be the brand's primary color
        background_color = primary_color
        layout = img_req.platform_layout_pattern or img_req.layout_pattern or ''

        # Convert hex colors to RGB tuples for explicit pixel-level guidance in the prompt
        def hex_to_rgb(hex_color: str) -> str:
            hex_color = hex_color.lstrip('#')
            if len(hex_color) == 6:
                r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
                return f"rgb({r},{g},{b})"
            return ""

        primary_rgb = hex_to_rgb(primary_color) if primary_color else ""
        background_rgb = hex_to_rgb(background_color) if background_color else ""
        secondary_rgb = hex_to_rgb(secondary_color) if secondary_color else ""

        # Build the studied-details fallback if it wasn't returned by step 1
        if not platform_style_details:
            platform_style_details = (
                f"{img_req.brand_name} uses a {platform_brand_style or 'modern, clean'} visual style on "
                f"{img_req.platform}, with {platform_template or 'minimal layout'} templates and "
                f"{primary_color or 'brand primary'} as their dominant post color."
            )

        # Determine aspect ratio based on platform
        platform_lower = img_req.platform.lower()
        if 'instagram' in platform_lower:
            aspect_ratio = "1:1 square (1080×1080px)"
        elif 'linkedin' in platform_lower:
            aspect_ratio = "1.91:1 landscape (1200×628px) or 1:1 square (1080×1080px)"
        elif 'facebook' in platform_lower:
            aspect_ratio = "1.91:1 landscape (1200×630px)"
        else:
            aspect_ratio = "1:1 square (1080×1080px)"

        # Build the enhanced image generation prompt
        prompt_text = f"""You are a world-class social media creative director producing a pixel-perfect branded campaign image for {img_req.brand_name} on {img_req.platform}.

Your ONLY goal: generate an image that is visually indistinguishable from {img_req.brand_name}'s actual {img_req.platform} posts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[STEP 1 — STUDIED BRAND PROFILE ON {img_req.platform.upper()}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{platform_style_details}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[MANDATORY DESIGN SPECIFICATIONS — ZERO DEVIATION ALLOWED]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📐 CANVAS & FORMAT
- Aspect Ratio: {aspect_ratio}
- Output must be crisp, high-resolution, production-ready.

🚫 ABSOLUTE RULE — NO LOGO: Do NOT include any company logo, brand mark, icon, watermark, or symbol anywhere in the image. The image must contain zero logos.

🎨 COLOR PALETTE — USE EXACT VALUES ONLY
- BACKGROUND COLOR: {primary_color} ({primary_rgb}) → This MUST be the dominant background fill of the entire image. Paint the whole canvas in this color.
- ACCENT / HEADLINE COLOR: Use white (#FFFFFF) or a light contrast color over the {primary_color} background for all text and graphic elements.
- SECONDARY COLOR: {(secondary_color + ' (' + secondary_rgb + ')') if secondary_color else 'Derive a complementary accent from the primary color palette'} → Apply to: subheadings, supporting graphics, subtle dividers.
- ⛔ FORBIDDEN: Do NOT use white, light gray, or any other color as the background. The background is {primary_color} ({primary_rgb}) — no exceptions.

✏️ TYPOGRAPHY
- Primary Font: {platform_font}
- Match {img_req.brand_name}'s exact typographic style: font weight (e.g. Bold/SemiBold for headlines, Regular for body), letter-spacing, and capitalization pattern.
- All text on the image must use only this typeface.

🗂 POST TEMPLATE STRUCTURE
{platform_template}
- Strictly follow this layout — do not rearrange elements, change proportions, or add design elements not described above.

📍 ELEMENT PLACEMENT GUIDE
{layout}
- HEADLINE: The most visually dominant text element. Color: {primary_color}.
- BODY/SUBTEXT: Smaller, supporting text. Aligned to the layout pattern.
- CTA (if applicable): Contrast button or text in {primary_color} or inverse.

🎯 VISUAL STYLE GUIDE
- Style: {platform_brand_style}
- Replicate this exact aesthetic. If the style uses photography: choose imagery that matches this brand's industry and tone. If it uses flat design/illustrations: apply that technique.
- NO stock photo clichés unless the brand's actual style uses them.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[CAMPAIGN CONTENT TO INCORPORATE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Brand: {img_req.brand_name}
- Product: {img_req.product_name}
- Ad Copy: "{img_req.ad_copy[:280]}"
- Platform: {img_req.platform}
"""

        if img_req.total_slides > 1:
            slide_focuses = {
                1: "THE HOOK — bold, scroll-stopping headline with the most dramatic visual impact. Make it impossible to scroll past.",
                2: "THE VALUE PROPOSITION — clearly showcase the product's core benefit. Use a compelling lifestyle image or clean product visual with supporting copy.",
                3: "FEATURES / SOCIAL PROOF — highlight a key differentiator or trust signal (stat, testimonial, award, feature callout).",
            }
            default_focus = "CALL TO ACTION — strong CTA with urgency. Full brand lockup clearly visible. Drive the viewer to act."
            slide_focus = slide_focuses.get(img_req.slide_number, default_focus)

            prompt_text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[CAROUSEL CONTEXT — SLIDE {img_req.slide_number} OF {img_req.total_slides}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- This is slide {img_req.slide_number} of {img_req.total_slides} in a cohesive carousel.
- Slide Focus: {slide_focus}
- CONSISTENCY RULE: All carousel slides MUST share identical brand template, color palette, and font. Only the content/visual focus changes per slide.
"""

        prompt_text += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[QUALITY & COMPLIANCE CHECKLIST — VERIFY BEFORE FINALIZING]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Background is exactly {primary_color} ({primary_rgb}) — the entire canvas is filled with this color
✅ Text and graphic elements use high-contrast colors (white or light) over the {primary_color} background
✅ Font is {platform_font} throughout
✅ Layout matches: {platform_template[:120]}...
✅ ZERO logos, brand marks, icons, or watermarks in the image
✅ Image feels like a real {img_req.brand_name} {img_req.platform} post — a brand manager would approve it immediately
✅ No generic clip art, irrelevant stock photos, or off-brand elements
✅ Production-quality rendering — crisp edges, no compression artifacts
"""

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
                    image_bytes = part.inline_data.data
                    mime_type = part.inline_data.mime_type or "image/png"

                    ext = mimetypes.guess_extension(mime_type) or ".png"
                    filename = f"campaigns/{uuid.uuid4()}{ext}"
                    public_url = None

                    try:
                        bucket = storage_client.bucket(BUCKET_NAME)
                        blob = bucket.blob(filename)
                        blob.upload_from_string(image_bytes, content_type=mime_type)
                        public_url = f"{str(request.base_url)}campaign-image/{filename.split('/')[-1]}"
                        try:
                            blob.make_public()
                        except Exception as pub_err:
                            print(f"Failed to make GCS blob public: {pub_err}")
                    except Exception as gcs_err:
                        print(f"GCS upload error: {gcs_err}")

                    base64_str = base64.b64encode(image_bytes).decode("utf-8")
                    return {
                        "image": base64_str,
                        "image_url": public_url,
                        "mime_type": mime_type,
                        "platform_style_details": platform_style_details
                    }

        raise HTTPException(status_code=500, detail="No image data received from model")

    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# GCS Private Image Proxy Endpoint
# ---------------------------------------------------------------------------
@app.get("/campaign-image/{filename}")
async def get_campaign_image(filename: str):
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(f"campaigns/{filename}")
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Image not found")
            
        content = blob.download_as_bytes()
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = "image/png"
            
        return Response(content=content, media_type=mime_type)
    except Exception as e:
        print(f"Error proxying GCS image {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Meta / Facebook & Instagram Integration Endpoints
# ---------------------------------------------------------------------------
class MetaConnectRequest(BaseModel):
    code: str
    redirect_uri: str
    user_id: str

@app.post("/social/meta/connect")
async def connect_meta(request: MetaConnectRequest):
    try:
        app_id = os.getenv("META_APP_ID")
        app_secret = os.getenv("META_APP_SECRET")
        
        if not app_id or not app_secret:
            raise HTTPException(status_code=500, detail="Meta App credentials not configured on backend.")

        async with httpx.AsyncClient() as client:
            token_url = f"https://graph.facebook.com/v19.0/oauth/access_token?client_id={app_id}&redirect_uri={request.redirect_uri}&client_secret={app_secret}&code={request.code}"
            token_res = await client.get(token_url)
            token_data = token_res.json()
            
            if "error" in token_data:
                print("Token Error:", token_data)
                raise HTTPException(status_code=400, detail=f"Meta Error: {token_data['error']['message']}")
                
            short_lived_token = token_data["access_token"]
            
            ll_url = f"https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={short_lived_token}"
            ll_res = await client.get(ll_url)
            ll_data = ll_res.json()
            
            if "error" in ll_data:
                raise HTTPException(status_code=400, detail="Failed to get long-lived token")
                
            long_lived_token = ll_data["access_token"]
            
            pages_url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={long_lived_token}"
            pages_res = await client.get(pages_url)
            pages_data = pages_res.json()
            
            if "error" in pages_data:
                raise HTTPException(status_code=400, detail="Failed to fetch pages")
                
            pages = pages_data.get("data", [])
            extracted_accounts = []
            
            for page in pages:
                page_token = page["access_token"]
                page_id = page["id"]
                page_name = page["name"]
                
                extracted_accounts.append({
                    "platform": "Facebook",
                    "account_name": page_name,
                    "account_id": page_id,
                    "access_token": page_token
                })
                
                ig_url = f"https://graph.facebook.com/v19.0/{page_id}?fields=instagram_business_account&access_token={page_token}"
                ig_res = await client.get(ig_url)
                ig_data = ig_res.json()
                
                if "instagram_business_account" in ig_data:
                    ig_id = ig_data["instagram_business_account"]["id"]
                    
                    ig_info_url = f"https://graph.facebook.com/v19.0/{ig_id}?fields=username&access_token={page_token}"
                    ig_info_res = await client.get(ig_info_url)
                    ig_username = ig_info_res.json().get("username", "Instagram Account")
                    
                    extracted_accounts.append({
                        "platform": "Instagram",
                        "account_name": ig_username,
                        "account_id": ig_id,
                        "access_token": page_token
                    })
                    
            return {"status": "success", "accounts": extracted_accounts}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Meta Connect Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error connecting to Meta")

class PublishRequest(BaseModel):
    page_id: Any
    access_token: str
    message: Optional[str] = ""
    image_base64: Optional[str] = None
    platform: str = "Facebook"

@app.post("/social/publish")
async def publish_social(request: PublishRequest):
    try:
        msg_preview = (request.message[:50] + "...") if request.message else "None"
        img_preview = (request.image_base64[:50] + "...") if request.image_base64 else "None"
        print(f"DEBUG: Publishing to {request.platform} (ID: {request.page_id})\n  Msg: {msg_preview}\n  Img: {img_preview}")
        
        img_data = None
        if request.image_base64:
            try:
                if "/campaign-image/" in request.image_base64:
                    filename = request.image_base64.split("/campaign-image/")[-1]
                    bucket = storage_client.bucket(BUCKET_NAME)
                    blob = bucket.blob(f"campaigns/{filename}")
                    img_data = blob.download_as_bytes()
                elif request.image_base64.startswith("http"):
                    async with httpx.AsyncClient() as hc:
                        img_res = await hc.get(request.image_base64)
                        img_data = img_res.content
                else:
                    data_parts = request.image_base64.split("base64,")
                    img_data = base64.b64decode(data_parts[1] if len(data_parts) > 1 else data_parts[0])
            except Exception as img_err:
                print(f"Error resolving image: {img_err}")
                raise HTTPException(status_code=400, detail=f"Failed to resolve campaign image: {str(img_err)}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            if request.platform == "Facebook":
                if img_data:
                    url = f"https://graph.facebook.com/v19.0/{request.page_id}/photos"
                    files = {
                        "source": ("image.png", img_data, "image/png")
                    }
                    data = {
                        "message": request.message,
                        "access_token": request.access_token
                    }
                    res = await client.post(url, data=data, files=files)
                else:
                    url = f"https://graph.facebook.com/v19.0/{request.page_id}/feed"
                    data = {
                        "message": request.message,
                        "access_token": request.access_token
                    }
                    res = await client.post(url, data=data)
                    
                res_data = res.json()
                if "error" in res_data:
                    raise HTTPException(status_code=400, detail=res_data["error"]["message"])
                    
                return {"status": "success", "post_id": res_data.get("post_id") or res_data.get("id")}
                
            elif request.platform == "Instagram":
                if not img_data:
                    raise HTTPException(status_code=400, detail="Instagram requires an image for posting. Please ensure visuals are generated for this campaign.")

                # Upload image bytes to GCS to obtain a reliable public HTTPS URL
                # (Instagram Graph API requires a publicly accessible URL for image_url)
                ig_filename = f"campaigns/ig-publish-{uuid.uuid4()}.png"
                public_image_url = None
                try:
                    bucket = storage_client.bucket(BUCKET_NAME)
                    blob = bucket.blob(ig_filename)
                    blob.upload_from_string(img_data, content_type="image/png")
                    public_image_url = blob.generate_signed_url(
                        expiration=timedelta(hours=1),
                        method='GET',
                        version='v4'
                    )
                except Exception as gcs_err:
                    print(f"GCS upload for Instagram failed: {gcs_err}")
                    raise HTTPException(status_code=500, detail=f"Failed to prepare image for Instagram: {str(gcs_err)}")

                print(f"DEBUG: Instagram public image URL: {public_image_url}")

                # Step 1: Create Instagram media container with the public image URL
                ig_container_url = f"https://graph.facebook.com/v19.0/{request.page_id}/media"
                ig_data = {
                    "image_url": public_image_url,
                    "caption": request.message,
                    "access_token": request.access_token
                }
                ig_res = await client.post(ig_container_url, data=ig_data)
                ig_res_json = ig_res.json()
                print(f"DEBUG: IG container response: {ig_res_json}")
                creation_id = ig_res_json.get("id")

                if not creation_id:
                    ig_err = ig_res_json.get("error", {}).get("message", "Unknown IG Error")
                    raise HTTPException(status_code=400, detail=f"Instagram Media Container Error: {ig_err}")

                # Poll for container status to be FINISHED before publishing
                import asyncio
                print("DEBUG: Polling Instagram container status...")
                status_url = f"https://graph.facebook.com/v19.0/{creation_id}"
                status_params = {
                    "fields": "status_code",
                    "access_token": request.access_token
                }
                
                max_retries = 20
                status_code = "IN_PROGRESS"
                for attempt in range(max_retries):
                    try:
                        status_res = await client.get(status_url, params=status_params)
                        status_json = status_res.json()
                        status_code = status_json.get("status_code", "IN_PROGRESS")
                        print(f"DEBUG: Attempt {attempt + 1}: status_code is {status_code}")
                        
                        if status_code == "FINISHED":
                            break
                        elif status_code == "ERROR":
                            raise HTTPException(status_code=400, detail="Instagram Media Container Error: Media processing failed on Meta servers.")
                    except Exception as e:
                        print(f"Error checking status (attempt {attempt + 1}): {e}")
                        if isinstance(e, HTTPException):
                            raise
                    
                    await asyncio.sleep(2)
                
                if status_code != "FINISHED":
                    raise HTTPException(status_code=400, detail=f"Instagram Media Container Error: Media processing timed out. Current status: {status_code}")

                # Step 2: Publish the media container
                ig_publish_url = f"https://graph.facebook.com/v19.0/{request.page_id}/media_publish"
                publish_data = {
                    "creation_id": creation_id,
                    "access_token": request.access_token
                }
                publish_res = await client.post(ig_publish_url, data=publish_data)
                result = publish_res.json()
                print(f"DEBUG: IG publish response: {result}")

                if "error" in result:
                    raise HTTPException(status_code=400, detail=result["error"]["message"])

                return {"status": "success", "post_id": result.get("id")}
            else:
                raise HTTPException(status_code=400, detail="Unsupported platform")
                
    except HTTPException:
        raise
    except Exception as e:
        print("Publishing Traceback:")
        traceback.print_exc()
        print(f"Publish Error: {e}")
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
