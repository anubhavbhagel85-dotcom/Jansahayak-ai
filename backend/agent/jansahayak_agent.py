import os
import warnings
warnings.filterwarnings("ignore")

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from .tools import scheme_search_tool
from .prompts import SYSTEM_PROMPT

load_dotenv()

# Store chat histories per session
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


def create_agent():

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_tools_agent(
        llm=llm,
        tools=[scheme_search_tool],
        prompt=prompt
    )

    executor = AgentExecutor(
        agent=agent,
        tools=[scheme_search_tool],
        verbose=True
    )

    agent_with_history = RunnableWithMessageHistory(
        executor,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
    )

    return agent_with_history

