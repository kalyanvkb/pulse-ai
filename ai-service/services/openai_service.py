import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

def get_llm():

    return ChatOpenAI(
        model=os.getenv(
            "OPENAI_MODEL",
            "gpt-4.1-mini"
        ),
        api_key=os.getenv(
            "OPENAI_API_KEY"
        ),
        temperature=0.2
    )