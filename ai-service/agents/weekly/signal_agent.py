from prompts.weekly.signal_prompt import (
    SIGNAL_PROMPT
)


def signal_agent(
    state,
    llm
):

    findings = "\n".join(
        state["findings"]
    )

    themes = "\n".join(
        state["themes"]
    )

    prompt = f"""
{SIGNAL_PROMPT}

FINDINGS:

{findings}

THEMES:

{themes}
"""

    result = llm.invoke(
        prompt
    )

    state["signals"] = [

        line.strip()

        for line in result.content.split(
            "\n"
        )

        if line.strip()
    ]

    return state