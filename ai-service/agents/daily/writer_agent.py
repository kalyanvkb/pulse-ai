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

    result = llm.invoke(
        prompt
    )

    try:

        content = (
            result.content
            .strip()
        )

        if content.startswith(
            "```json"
        ):

            content = (
                content
                .replace(
                    "```json",
                    ""
                )
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        elif content.startswith(
            "```"
        ):

            content = (
                content
                .replace(
                    "```",
                    ""
                )
                .strip()
            )

        output = json.loads(
            content
        )

        state[
            "whats_happening"
        ] = output.get(
            "whats_happening",
            []
        )

        state[
            "why_it_matters"
        ] = output.get(
            "why_it_matters",
            []
        )

    except Exception as e:

        print(
            f"JSON PARSE FAILED: "
            f"{state['company']}"
        )

        print(
            result.content
        )

        print(
            repr(e)
        )

        state[
            "whats_happening"
        ] = [
            {
                "importance": 5,
                "text": (
                    result.content[:500]
                )
            }
        ]

        state[
            "why_it_matters"
        ] = []

    return state