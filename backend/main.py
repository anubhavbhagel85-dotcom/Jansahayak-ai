# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from agent.jansahayak_agent import create_agent
from voice.stt import transcribe_audio
from voice.tts import text_to_speech
import shutil
app = FastAPI(title='JanSahayak AI')
app.add_middleware(CORSMiddleware,
allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
agent = create_agent()
@app.get('/health')
def health():
	return {'status': 'running', 'llm': 'Groq Llama 3.3 70B', 'cost': 'FREE'}
@app.post('/chat/text')
async def chat_text(message: str):
	result = agent.invoke({'input': message})
	return {'response': result['output']}
@app.post('/chat/voice')
async def chat_voice(audio: UploadFile = File(...), lang: str = 'hi'):
	path = f'/tmp/{audio.filename}'
	with open(path, 'wb') as f:
		shutil.copyfileobj(audio.file, f)
	text = transcribe_audio(path, language=lang)
	result = agent.invoke({'input': text})
	answer = result['output']
	text_to_speech(answer, language=lang)
	return {'transcribed': text, 'response': answer}
