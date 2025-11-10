import os
import time
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from google import genai
from google.genai import types

# ============================================================
# Setup
# ============================================================

load_dotenv()
API_KEY = os.getenv("API_KEY")

client = genai.Client()
app = FastAPI(title="arcAI File Q&A API", version="1.0")


from fastapi.middleware.cors import CORSMiddleware
# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:3001",  # Node.js dev
        "http://127.0.0.1:3000",  # Alternate local
        "http://127.0.0.1:3001",  # Alternate local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Helper Functions
# ============================================================

def get_or_create_store(display_name: str = "inspection-agent") -> str:
    """Get an existing store by name or create a new one if not found."""
    stores = list(client.file_search_stores.list())
    for store in stores:
        if store.display_name == display_name:
            print(f"✅ Using existing store: {store.display_name}")
            return store.name

    print(f"🆕 Creating new store: {display_name}")
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
        time.sleep(3)
        operation = client.operations.get(operation)

    return {"file": display_name, "status": "uploaded"}


def query_store(store_name: str, prompt: str) -> str:
    """Ask Gemini a question about files in a given store."""
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{prompt}\n(Return your answer in markdown with sections and bullet points)\nANSWER:\n Give response in short, to the point paragraphs. dont explain too much",
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
# API Endpoints
# ============================================================

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more files to the Gemini File Search Store.
    Returns the upload status for each file.
    """
    try:
        store_name = get_or_create_store()
        results = []

        os.makedirs("temp_uploads", exist_ok=True)

        for file in files:
            file_path = os.path.join("temp_uploads", file.filename)

            # Save file temporarily
            with open(file_path, "wb") as f:
                f.write(await file.read())

            # Upload to Gemini
            result = upload_to_store(store_name, file_path)
            results.append(result)

            # Clean up
            os.remove(file_path)

        return JSONResponse({"status": "success", "uploaded": results})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask")
async def ask_question(prompt: str = Form(...)):
    """
    Ask a question about all documents in the current store.
    """
    try:
        store_name = get_or_create_store()
        answer = query_store(store_name, prompt)
        return JSONResponse({"question": prompt, "answer": answer})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Run Command (for local testing)
# ============================================================
# Run using:
# uvicorn app:app --reload
