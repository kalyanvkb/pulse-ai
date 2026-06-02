# Theme Agent
from prompts.daily.theme_prompt import THEME_PROMPT

def theme_agent(state, llm):

    facts_text = "\n".join(
        state["facts"]
    )

    prompt = f"""
{THEME_PROMPT}

Facts:

{facts_text}
"""

    result = llm.invoke(prompt)

    state["themes"] = result.content.split("\n")

    return state