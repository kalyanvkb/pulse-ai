from prompts.strategy.ceo_prompt import CEO_PROMPT

def run_ceo(llm, context, conversation):

    prompt = f"""
{CEO_PROMPT}

Context:
{context}

Conversation so far:
{conversation}

What is your contribution?
"""

    return llm.invoke(prompt).content