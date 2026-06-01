import os
import time
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from google import genai
from google.genai import types

# ============================================================
# Setup
# ============================================================

load_dotenv()
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise Exception("API_KEY not found in environment")

client = genai.Client(api_key=API_KEY)

app = FastAPI(title="arcAI File Q&A API", version="1.0")


# ============================================================
# CORS - allow all origins (use strict rules later for prod)
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Helper Functions
# ============================================================

def get_or_create_store(display_name: str = "rag_agent_store") -> str:
    """Get an existing store by name or create a new one if not found."""
    stores = list(client.file_search_stores.list())
    for store in stores:
        if store.display_name == display_name:
            return store.name

    store = client.file_search_stores.create(config={"display_name": display_name})
    return store.name


def upload_to_store(store_name: str, file_path: str):
    """Upload a single file to a given store and wait until done."""
    display_name = os.path.basename(file_path)
    operation = client.file_search_stores.upload_to_file_search_store(
        file=file_path,
        file_search_store_name=store_name,
        config={"display_name": display_name}
    )

    while not operation.done:
        time.sleep(1)
        operation = client.operations.get(operation)

    return {"file": display_name, "status": "uploaded"}


def query_store(store_name: str, prompt: str) -> str:
    """
    Query uploaded files using the File Search tool.
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[
                types.Tool(
                    file_search=types.FileSearch(file_search_store_names=[store_name])
                )
            ]
        )
    )

    return response.text


# ============================================================
# Routes
# ============================================================

@app.get("/")
def root():
    return {"status": "FastAPI is live"}


@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload files to Gemini + store reference names in a persistent file.
    """
    try:
        store_name = get_or_create_store()
        uploaded_results = []
        os.makedirs("temp_uploads", exist_ok=True)

        for file in files:
            file_path = os.path.join("temp_uploads", file.filename)

            # Stream upload to disk
            with open(file_path, "wb") as f:
                while True:
                    chunk = await file.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)

            # Upload to Gemini Store
            result = upload_to_store(store_name, file_path)
            uploaded_results.append(result)

            # Cleanup temp file
            os.remove(file_path)

        return JSONResponse({"status": "success", "files": uploaded_results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
async def ask_question(prompt: str = Form(...)):
    """
    Ask a question across all previously uploaded files.
    """
    try:
        store_name = get_or_create_store()
        
        # We no longer need to check uploaded_files.txt because the store persists in the cloud
        
        answer = query_store(store_name, prompt)

        return JSONResponse({"question": prompt, "answer": answer})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Run Locally
# ============================================================
# uvicorn generate_answer:app --host 0.0.0.0 --port 8000 --reload
