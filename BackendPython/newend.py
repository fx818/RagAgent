from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
# Import the specific types for safer configuration
from google.genai.types import (
    CreateFileSearchStoreConfig, 
    UploadFileConfig, 
    GenerateContentConfig, 
    Tool, 
    FileSearch
)
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ---------------------------
# 1. Verify New Code Loaded
# ---------------------------
@app.on_event("startup")
async def startup_event():
    print("\n✅ SERVER RESTART DETECTED: New code is active.\n")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("GOOGLE_API_KEY")
STORE_DISPLAY_NAME = "ragstore-zh5mppzlgqnk"

client = genai.Client(api_key=API_KEY)

# ---------------------------
# 2. Store Management
# ---------------------------
def get_or_create_store():
    print("\n🔍 Checking stores...\n")
    for store in client.file_search_stores.list():
        if store.display_name == STORE_DISPLAY_NAME:
            print("✔ Using existing store:", store.name)
            return store.name

    print("⚠ Store not found → creating new one...")
    new_store = client.file_search_stores.create(
        config=CreateFileSearchStoreConfig(display_name=STORE_DISPLAY_NAME)
    )
    print("🆕 Created store:", new_store.name)
    return new_store.name

STORE_ID = get_or_create_store()
print("\n📌 ACTIVE STORE ID:", STORE_ID, "\n")

# ---------------------------
# 3. Upload Endpoint
# ---------------------------
@app.post("/upload")
async def upload_file(file: UploadFile):
    try:
        # 1. Upload to File API
        print(f"Uploading {file.filename}...")
        uploaded = client.files.upload(
            file=file.file,
            config=UploadFileConfig(mime_type=file.content_type)
        )

        # 2. Add to File Search Store
        # Note: This operation might take a moment to index
        op = client.file_search_stores.import_file(
            file_search_store_name=STORE_ID,
            file_name=uploaded.name
        )

        return {
            "status": "success",
            "file_name": uploaded.name,
            "store_id": STORE_ID,
            "message": "File uploaded. Indexing may take a few moments."
        }

    except Exception as e:
        print("Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# 4. Query Endpoint (Fixed)
# ---------------------------
@app.post("/query")
async def query_rag(query: str = Form(...)):
    try:
        print(f"Received Query: {query}")
        
        # Use the SDK types to ensure the config is formatted exactly how Google expects it
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=query,
            config=GenerateContentConfig(
                tools=[Tool(
                    file_search=FileSearch(
                        file_search_store=STORE_ID
                    )
                )]
            )
        )

        # Helper to safely extract grounding URIs
        source_uris = []
        if response.candidates and response.candidates[0].grounding_metadata:
            meta = response.candidates[0].grounding_metadata
            if hasattr(meta, 'grounding_sources') and meta.grounding_sources:
                source_uris = [s.uri for s in meta.grounding_sources]

        return {
            "query": query,
            "answer": response.text,
            "sources": source_uris
        }

    except Exception as e:
        print(f"❌ QUERY FAILED: {str(e)}")
        # If this still fails, it will show the REAL error now, not "Search failed"
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

# Change the decorator to "/ask"
@app.post("/ask") 
async def query_rag2(query: str = Form(...)):
    try:
        print(f"Received Query: {query}")

        # ... rest of your code ...
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=query,
            config=GenerateContentConfig(
                tools=[Tool(
                    file_search=FileSearch(
                        file_search_store=STORE_ID
                    )
                )]
            )
        )

        # ... existing logic ...
        
        # Helper to safely extract grounding URIs
        source_uris = []
        if response.candidates and response.candidates[0].grounding_metadata:
            meta = response.candidates[0].grounding_metadata
            if hasattr(meta, 'grounding_sources') and meta.grounding_sources:
                source_uris = [s.uri for s in meta.grounding_sources]


        return {
            "query": query,
            "answer": response.text,
            "sources": source_uris
        }

    except Exception as e:
        # I added "NEW CODE ERROR" so you can be 100% sure this is the new server
        print(f"❌ NEW CODE ERROR: {type(e).__name__} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"NEW CODE ERROR: {str(e)}")

@app.get("/")
def root():
    return {"status": "RAG Ready", "store": STORE_ID}