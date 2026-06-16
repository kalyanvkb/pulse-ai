from prompts.strategy.cto_prompt import CTO_PROMPT

def run_cto(llm, context, conversation):

    prompt = f"""
{CTO_PROMPT}

Context:
{context}

Conversation:
{conversation}

Respond.
"""

    return llm.invoke(prompt).content