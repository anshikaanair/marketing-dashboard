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

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    try:
        prompt_text = (
            f"Create a STUNNING {request.platform} lifestyle ad for {request.brand_name} {request.product_name}. "
            f"The style should be '{request.template}'. "
            f"The image must feature a high-resolution, professional photograph. "
            f"Ad Content: '{request.ad_copy}'. "
            f"STRICT RULE: The result must be a final advertisement, NOT a color palette or technical diagram."
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
