import os
from dotenv import load_dotenv
load_dotenv()

API_KEY = os.getenv("API_KEY")

from google import genai
from google.genai import types
import time

client = genai.Client()

# Create the file search store with an optional display name
file_search_store = client.file_search_stores.create(config={'display_name': 'anurag-basic'})

# Create a file search store (including optional display_name for easier reference)
# file_search_store = client.file_search_stores.create(config={'display_name': 'my-file_search-store-123'})

# List all your file search stores
for file_search_store in client.file_search_stores.list():
    print(file_search_store)


# Upload and import a file into the file search store, supply a file name which will be visible in citations
operation = client.file_search_stores.upload_to_file_search_store(
    file='document.pdf',
    file_search_store_name=file_search_store.name,
    config={
    'display_name' : 'Illya Testimony 01', 
    }
)
print("------------------------------------")
print(client.operations.get(operation))
print("------------------------------------")



# Wait until import is complete
while not operation.done:
    time.sleep(5)
    print("Waiting")
    operation = client.operations.get(operation)

print("Done")



PROMPT = "Tell me about this document"

#  Ask a question about the file
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=f"""{PROMPT}\n (return your answer in markdown as sections and bullet points)\nANSWER:\n""",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[file_search_store.name]
                )
            )
        ]
    )
)

print(response.text)

print("-"*50)


PROMPT = "What did Ilya see?"

#  Ask a question about the file
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=f"""{PROMPT}\n (return your answer in markdown as sections and bullet points)\nANSWER:\n""",
    config=types.GenerateContentConfig(
        tools=[
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[file_search_store.name]
                )
            )
        ]
    )
)
print("-"*50)

print(response.text)

print("-"*50)