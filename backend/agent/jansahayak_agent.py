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
Your job is to help users find government welfare schemes and scholarships they qualify for.

RULES:
1. Always respond in the SAME language the user speaks.
   If they speak Hindi respond in Hindi.
   If they speak Telugu respond in Telugu.
   If they speak English respond in English.

2. Ask ONE question at a time to collect this information:
   - Age
   - Monthly income
   - State they live in
   - Caste category (General / OBC / SC / ST)
   - Gender
   - Education level
   - Occupation (farmer, student, business, job, etc)
   - Family size

3. Once you have collected enough information use the scheme data provided to find matching schemes.

4. Present each matching scheme clearly with:
   - Scheme name
   - What benefit they get
   - Who is eligible
   - How to apply
   - Official portal link

5. Explain everything in simple plain language with no jargon.

6. Give step by step application guidance when the user asks how to apply.

7. Be warm, patient and encouraging at all times.

8. If the user is from a rural area or seems unfamiliar with technology, be extra simple and clear."""

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
            "help", "government", "sarkari", "apply", "form",
            "किसान", "योजना", "सरकार", "लाभ", "पात्रता",
            "farmer", "poor", "bpl", "widow", "disabled",
            "education", "medical", "housing", "food", "ration"
        ]

        if any(word in user_input.lower() for word in search_keywords):
            results = query_schemes(user_input)
            if results:
                scheme_info = "\n\n[Relevant schemes from database:]\n"
                for r in results[:3]:
                    scheme_info += (
                        f"\nScheme: {r.get('scheme_name', '')}\n"
                        f"Benefit: {r.get('benefits', '')}\n"
                        f"Eligibility Caste: {r.get('eligibility_caste', 'All')}\n"
                        f"Eligibility State: {r.get('eligibility_state', 'All')}\n"
                        f"How to Apply: {r.get('how_to_apply', '')}\n"
                        f"Portal: {r.get('portal_link', '')}\n"
                        f"---\n"
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
