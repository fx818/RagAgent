import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

# ============================================================
# Setup & Initialization
# ============================================================

load_dotenv()
API_KEY = os.getenv("API_KEY")

client = genai.Client()

# ============================================================
# Helper Functions
# ============================================================

def create_file_search_store(display_name: str) -> str:
    """
    Create a new file search store with a given display name.
    Returns the name (ID) of the created file search store.
    """
    print(f"🔹 Creating File Search Store: {display_name}")
    file_search_store = client.file_search_stores.create(
        config={'display_name': display_name}
    )
    print(f"✅ Created store: {file_search_store.name}\n")
    return file_search_store.name


def list_file_search_stores():
    """List all file search stores."""
    print("📂 Listing all File Search Stores:")
    stores = list(client.file_search_stores.list())
    for idx, store in enumerate(stores, start=1):
        print(f"{idx}. {store.display_name} ({store.name})")
    print()
    return stores


def upload_files_to_store(file_paths: list, store_name: str):
    """
    Upload multiple files to a given file search store.
    Waits for each upload to complete before proceeding.
    """
    for file_path in file_paths:
        display_name = os.path.basename(file_path)
        print(f"📤 Uploading: {display_name}")

        operation = client.file_search_stores.upload_to_file_search_store(
            file=file_path,
            file_search_store_name=store_name,
            config={'display_name': display_name}
        )

        # Wait until upload completes
        while not operation.done:
            print(f"⏳ Waiting for {display_name} to finish importing...")
            time.sleep(5)
            operation = client.operations.get(operation)

        print(f"✅ Finished uploading: {display_name}\n")


def query_files(store_name: str, prompt: str):
    """
    Query the uploaded files using Gemini model and return markdown answer.
    """
    print(f"💬 Asking: {prompt}")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"""{prompt}\n(return your answer in markdown with sections and bullet points)\nANSWER:\n""",
        config=types.GenerateContentConfig(
            tools=[
                types.Tool(
                    file_search=types.FileSearch(
                        file_search_store_names=[store_name]
                    )
                )
            ]
        )
    )
    print("🧠 Response:\n")
    print(response.text)
    print("-" * 80)
    return response.text


# ============================================================
# Main Execution Flow
# ============================================================

def main():
    # STEP 1: Create or use an existing file search store
    store_name = create_file_search_store("anurag-basic")

    # STEP 2: List available stores
    list_file_search_stores()

    # STEP 3: Upload multiple PDF or text files
    files_to_upload = [
        "document.pdf",
        "document.pdf",
        # Add more file paths as needed
    ]
    upload_files_to_store(files_to_upload, store_name)

    # STEP 4: Query files
    query_files(store_name, "Tell me about these documents")
    query_files(store_name, "What did Ilya see?")


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":
    main()
