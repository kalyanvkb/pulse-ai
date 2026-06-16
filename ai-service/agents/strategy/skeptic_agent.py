from prompts.strategy.skeptic_prompt import SKEPTIC_PROMPT

def run_skeptic(llm, context, conversation):

    prompt = f"""
{SKEPTIC_PROMPT}

Context:
{context}

Conversation:
{conversation}

Respond.
"""

    return llm.invoke(prompt).content