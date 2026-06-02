import json

from prompts.daily.writer_prompt import (
    WRITER_PROMPT
)

def writer_agent(state, llm):

    facts = "\n".join(
        state["facts"]
    )

    themes = "\n".join(
        state["themes"]
    )

    impacts = "\n".join(
        state["impacts"]
    )

    prompt = f"""
{WRITER_PROMPT}

FACTS:
{facts}

THEMES:
{themes}

IMPACTS:
{impacts}
"""

    result = llm.invoke(prompt)

    try:

        output = json.loads(
            result.content
        )

        state["whats_happening"] = (
            output.get(
                "whats_happening",
                []
            )
        )

        state["why_it_matters"] = (
            output.get(
                "why_it_matters",
                []
            )
        )

    except Exception:

        state["whats_happening"] = [
            result.content
        ]

        state["why_it_matters"] = []

    return state