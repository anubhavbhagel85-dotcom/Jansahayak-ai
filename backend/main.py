import os
import warnings
import shutil
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from agent.jansahayak_agent import run_agent
from voice.stt import transcribe_audio
from voice.tts import text_to_speech

load_dotenv()

app = FastAPI(title="JanSahayak AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
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
    os.makedirs("/tmp", exist_ok=True)
    path = f"/tmp/{audio.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    text = transcribe_audio(path, language=lang)
    response = run_agent(text, session_id)
    text_to_speech(response, language=lang)

    return {
        "transcribed": text,
        "response": response
    }
