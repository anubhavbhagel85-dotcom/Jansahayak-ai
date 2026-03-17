import os
import sys
import warnings
import shutil
warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from agent.jansahayak_agent import create_agent
from voice.stt import transcribe_audio
from voice.tts import text_to_speech
from contextlib import asynccontextmanager

load_dotenv()

@asynccontextmanager
async def lifespan(app):
    # Auto-scrape schemes when server starts
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

print("Loading AI agent...")
agent = create_agent()
print("Agent ready!")


@app.get("/health")
def health():
    return {
        "status": "running",
        "llm": "Groq Llama 3.3 70B",
        "cost": "FREE"
    }


@app.post("/chat/text")
async def chat_text(message: str, session_id: str = "default"):
    try:
        result = agent.invoke(
            {"input": message},
            config={"configurable": {"session_id": session_id}}
        )
        return {"response": result["output"]}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}


@app.post("/chat/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    lang: str = "hi",
    session_id: str = "default"
):
    try:
        os.makedirs("C:/tmp", exist_ok=True)
        path = f"C:/tmp/{audio.filename}"
        with open(path, "wb") as f:
            shutil.copyfileobj(audio.file, f)
        text = transcribe_audio(path, language=lang)
        result = agent.invoke(
            {"input": text},
            config={"configurable": {"session_id": session_id}}
        )
        answer = result["output"]
        text_to_speech(answer, language=lang)
        return {
            "transcribed": text,
            "response": answer
        }
    except Exception as e:
        return {
            "transcribed": "Error",
            "response": f"Error: {str(e)}"
        }
@app.post("/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    data = await request.form()
    user_message = data.get("Body", "")
    phone = data.get("From", "")
    
    # Use phone number as session ID
    session_id = phone.replace("whatsapp:", "")
    response = run_agent(user_message, session_id)
    
    # Send back via Twilio WhatsApp
    return {"message": response}