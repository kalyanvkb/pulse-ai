from prompts.strategy.cio_prompt import CIO_PROMPT

def run_cio(llm, context, conversation):

    prompt = f"""
{CIO_PROMPT}

Context:
{context}

Conversation:
{conversation}

Respond.
"""

    return llm.invoke(prompt).content