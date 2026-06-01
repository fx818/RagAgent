from google import genai
import inspect

from google.genai.types import GenerateContentConfig
client = genai.Client(api_key="AIzaSyD6noT1oVqNPtprIdhNdLPoMB6RAel3mdg")
resp = client.models.embed_content(
    model="models/text-embedding-004",
    contents="test"
)

print(resp)
print(dir(resp))