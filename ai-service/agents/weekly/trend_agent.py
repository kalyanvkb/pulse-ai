from prompts.weekly.trend_prompt import (
    TREND_PROMPT
)


def trend_agent(
    state,
    llm
):

    findings = "\n".join(
        state["findings"]
    )

    prompt = f"""
{TREND_PROMPT}

FINDINGS:

{findings}
"""

    result = llm.invoke(
        prompt
    )

    state["themes"] = [

        line.strip()

        for line in result.content.split(
            "\n"
        )

        if line.strip()
    ]

    return state