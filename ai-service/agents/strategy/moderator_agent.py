from prompts.strategy.moderator_prompt import MODERATOR_PROMPT

def summarize(llm, conversation):

    prompt = f"""
{MODERATOR_PROMPT}

Conversation:

{conversation}

Generate final recommendation.
"""

    return llm.invoke(prompt).content