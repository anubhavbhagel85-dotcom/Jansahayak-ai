import os
import warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
from groq import Groq as GroqClient

load_dotenv()

store = {}

def get_history(session_id):
    if session_id not in store:
        store[session_id] = []
    return store[session_id]

def create_agent():
    return None

def run_agent(user_input: str, session_id: str = "default") -> str:
    history = get_history(session_id)
    client = GroqClient(api_key=os.getenv("GROQ_API_KEY"))

    system_prompt = """You are JanSahayak AI - a helpful welfare assistant for Indian citizens.
Your job: help users find government welfare schemes they qualify for.

RULES:
1. Always respond in the SAME language the user speaks.
   Hindi in -> Hindi out. Telugu in -> Telugu out.
2. Ask ONE question at a time to collect:
   age, monthly income, state, caste (General/OBC/SC/ST),
   gender, education level, occupation, family size.
3. Once you have collected enough information, present matching schemes.
4. Explain each scheme in simple plain language - no jargon.
5. Give step-by-step application guidance when asked.
6. Be warm, patient and encouraging."""

    messages = [{"role": "system", "content": system_prompt}]

    for msg in history:
        messages.append(msg)

    enriched_input = user_input
    try:
        from schemes.vector_store import query_schemes
        search_keywords = [
            "scheme", "yojana", "benefit", "eligib", "qualify",
            "farmer", "kisan", "student", "health", "house", "loan",
            "scholarship", "pension", "income", "age", "caste",
            "help", "government", "sarkari", "योजना", "किसान", "सरकार"
        ]
        if any(word in user_input.lower() for word in search_keywords):
            results = query_schemes(user_input)
            if results:
                scheme_info = "\n\n[Relevant schemes found:]\n"
                for r in results[:3]:
                    scheme_info += (
                        f"- {r.get('scheme_name', '')}: "
                        f"{r.get('benefits', '')} | "
                        f"Apply: {r.get('portal_link', '')}\n"
                    )
                enriched_input = user_input + scheme_info
    except Exception:
        pass

    messages.append({"role": "user", "content": enriched_input})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
    )

    answer = response.choices[0].message.content

    history.append({"role": "user", "content": user_input})
    history.append({"role": "assistant", "content": answer})

    if len(history) > 20:
        store[session_id] = history[-20:]

    return answer