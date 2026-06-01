from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai.types import UploadToFileSearchStoreConfig, CreateFileSearchStoreConfig
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS (optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("GOOGLE_API_KEY")
STORE_NAME = os.getenv("FILE_SEARCH_STORE")   # Optional now

if not API_KEY:
    raise Exception("❌ GOOGLE_API_KEY missing in .env")

client = genai.Client(api_key=API_KEY)


def get_or_create_store(display_name="rag-store"):
    """
    Ensures a FileSearchStore exists.
    If STORE_NAME is set and exists → return it
    Otherwise → create a new store
    """

    print("🔍 Checking FileSearchStores...")

    # List stores
    for store in client.file_search_stores.list():
        print("→ Found:", store.name, "|", store.display_name)

        # Match env value exactly
        if STORE_NAME and store.name == STORE_NAME:
            print("✅ Matched STORE_NAME:", STORE_NAME)
            return store.name

        # Match by display name (e.g., env value=rag-store)
        if STORE_NAME and store.display_name == STORE_NAME:
            print("✅ Matched by display_name:", store.name)
            return store.name

    # No match → create new store
    print("⚠ No matching store found. Creating new one...")

    config = CreateFileSearchStoreConfig(display_name=display_name)

    new_store = client.file_search_stores.create(config=config)
    print("🆕 Created store:", new_store.name)
    return new_store.name


# Initialize store on startup
STORE_NAME = get_or_create_store()
print("📌 ACTIVE STORE:", STORE_NAME)


# -------------------------------
# 📌 UPLOAD DOCUMENT
# -------------------------------
@app.post("/upload")
async def upload_file(file: UploadFile):
    try:
        # Step 1 — Upload raw file to Google Files Service
        uploaded = client.files.upload(
            file=file.file,
            mime_type=file.content_type
        )

        # Step 2 — Import uploaded file into FileSearchStore
        operation = client.file_search_stores.import_file(
            file_search_store_name=STORE_NAME,
            file_name=uploaded.name
        )

        return {
            "message": "Upload + import started",
            "file_id": uploaded.name,
            "operation_id": operation.name,
            "store": STORE_NAME
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# -------------------------------
# 📌 QUERY RAG
# -------------------------------
from google.genai.types import GenerateContentConfig, FileSearch

@app.post("/query")
async def query_rag(query: str = Form(...)):
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=query,
            config=GenerateContentConfig(
                file_search=FileSearch(
                    fileSearchStoreNames=[STORE_NAME],
                    topK=5
                )
            )
        )

        return {
            "query": query,
            "answer": response.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")



# -------------------------------
# 📌 LIST STORES
# -------------------------------
@app.get("/stores")
def list_stores():
    stores = [
        {"name": s.name, "display_name": s.display_name}
        for s in client.file_search_stores.list()
    ]
    return {"stores": stores}


@app.get("/")
def root():
    return {"status": "RAG API running", "store": STORE_NAME}
