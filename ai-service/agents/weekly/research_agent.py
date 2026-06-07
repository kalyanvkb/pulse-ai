from prompts.weekly.research_prompt import (
    RESEARCH_PROMPT
)


def normalize_items(items):

    normalized = []

    for item in items:

        if isinstance(item, dict):

            text = item.get(
                "text"
            )

            if text:
                normalized.append(
                    text
                )

        elif item:

            normalized.append(
                str(item)
            )

    return normalized


def research_agent(
    state,
    llm
):

    brief_text = "\n\n".join(

        [
            f"""
DATE:
{brief.get('date')}

WHAT HAPPENED:
{chr(10).join(
    normalize_items(
        brief.get(
            'whatsHappening',
            []
        )
    )
)}

WHY IT MATTERS:
{chr(10).join(
    normalize_items(
        brief.get(
            'whyItMatters',
            []
        )
    )
)}
"""
            for brief in state[
                "daily_briefs"
            ]
        ]
    )

    prompt = f"""
{RESEARCH_PROMPT}

WEEKLY BRIEFS:

{brief_text}
"""

    result = llm.invoke(
        prompt
    )

    state["findings"] = [

        line.strip()

        for line in result.content.split(
            "\n"
        )

        if line.strip()
    ]

    return state