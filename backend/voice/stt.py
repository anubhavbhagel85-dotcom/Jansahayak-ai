from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

def transcribe_audio(audio_file_path: str, language: str = 'hi') -> str:
    """language codes: hi Hindi, te Telugu, bn Bengali,
    ta Tamil, gu Gujarati, mr Marathi, en English"""
    
    client = Groq(api_key=os.getenv('GROQ_API_KEY'))
    
    with open(audio_file_path, 'rb') as f:
        transcript = client.audio.transcriptions.create(
            file=(audio_file_path, f.read()),
            model='whisper-large-v3',
            language=language,
            response_format='text'
        )
    
    return transcript