import os
import sys
import warnings
import shutil
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from agent.jansahayak_agent import run_agent
from voice.stt import transcribe_audio
from voice.tts import text_to_speech
from contextlib import asynccontextmanager

load_dotenv()

@asynccontextmanager
async def lifespan(app):
    try:
        from schemes.scraper import update_schemes_database
        update_schemes_database()
        print("Schemes auto-updated on startup")
    except Exception as e:
        print(f"Auto-scrape failed (using existing data): {e}")
    yield

app = FastAPI(title="JanSahayak AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/health")
def health():
    return {
        "status": "running",
        "llm": "Groq Llama 3.3 70B",
        "cost": "FREE"
    }

@app.post("/chat/text")
async def chat_text(message: str, session_id: str = "default"):
    response = run_agent(message, session_id)
    return {"response": response}

@app.post("/chat/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    lang: str = "hi",
    session_id: str = "default"
):
    os.makedirs("C:/tmp", exist_ok=True)
    path = f"C:/tmp/{audio.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    text = transcribe_audio(path, language=lang)
    response = run_agent(text, session_id)
    text_to_speech(response, language=lang)

    return {
        "transcribed": text,
        "response": response
    }

@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.form()
    user_message = data.get("Body", "")
    phone = data.get("From", "")
    session_id = phone.replace("whatsapp:", "")
    response = run_agent(user_message, session_id)
    return {"message": response}