# Impact Agent
from prompts.daily.impact_prompt import IMPACT_PROMPT

def impact_agent(state, llm):

    themes = "\n".join(
        state["themes"]
    )

    facts = "\n".join(
        state["facts"]
    )

    prompt = f"""
{IMPACT_PROMPT}

Facts:
{facts}

Themes:
{themes}
"""

    result = llm.invoke(prompt)

    state["impacts"] = result.content.split("\n")

    return state