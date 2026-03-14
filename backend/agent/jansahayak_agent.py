from langchain_groq import ChatGroq
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from .tools import scheme_search_tool
from .prompts import SYSTEM_PROMPT
import os
from dotenv import load_dotenv
load_dotenv()

def create_agent():
    llm = ChatGroq(
        model='llama-3.3-70b-versatile',
        temperature=0.3,
        groq_api_key=os.getenv('GROQ_API_KEY')
    )
    memory = ConversationBufferMemory(
        memory_key='chat_history', return_messages=True
    )
    prompt = ChatPromptTemplate.from_messages([
        ('system', SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name='chat_history'),
        ('human', '{input}'),
        MessagesPlaceholder(variable_name='agent_scratchpad')
    ])
    agent = create_openai_tools_agent(llm, [scheme_search_tool], prompt)
    return AgentExecutor(
        agent=agent, tools=[scheme_search_tool],
        memory=memory, verbose=True
    )
