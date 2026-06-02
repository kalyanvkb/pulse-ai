import json

from prompts.weekly.writer_prompt import (
    WRITER_PROMPT
)


def writer_agent(
    state,
    llm
):

    findings = "\n".join(
        state["findings"]
    )

    themes = "\n".join(
        state["themes"]
    )

    signals = "\n".join(
        state["signals"]
    )

    prompt = f"""
{WRITER_PROMPT}

FINDINGS:

{findings}

THEMES:

{themes}

SIGNALS:

{signals}
"""

    result = llm.invoke(
        prompt
    )

    try:

        data = json.loads(
            result.content
        )

        state[
            "what_changed"
        ] = sorted(
            data.get(
                "what_changed",
                []
            ),
            key=lambda x:
                x.get(
                    "importance",
                    0
                ),
            reverse=True
        )

        state[
            "why_it_matters"
        ] = sorted(
            data.get(
                "why_it_matters",
                []
            ),
            key=lambda x:
                x.get(
                    "importance",
                    0
                ),
            reverse=True
        )

        state[
            "signals_to_watch"
        ] = sorted(
            data.get(
                "signals_to_watch",
                []
            ),
            key=lambda x:
                x.get(
                    "importance",
                    0
                ),
            reverse=True
        )

    except Exception as e:

        print(
            "Writer parse error:"
        )

        print(e)

        state[
            "what_changed"
        ] = []

        state[
            "why_it_matters"
        ] = []

        state[
            "signals_to_watch"
        ] = []

    return state