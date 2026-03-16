from gtts import gTTS
import hashlib

def text_to_speech(text: str, language: str = 'hi') -> str:
    tts = gTTS(text=text, lang=language, slow=False)
    fname = hashlib.md5(text.encode()).hexdigest()
    path = f'/tmp/response_{fname}.mp3'
    tts.save(path)
    return path