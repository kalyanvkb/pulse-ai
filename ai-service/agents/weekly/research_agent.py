import json

from prompts.weekly.research_prompt import (
    RESEARCH_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.prompt_logger import (
    log_stage
)


def build_weekly_input(daily_briefs):

    sections = []

    for brief in daily_briefs:

        section = {

            "date": brief.get("date"),

            "facts": brief.get(
                "facts",
                []
            ),

            "themes": brief.get(
                "themes",
                []
            ),

            "market_intelligence": brief.get(
                "impacts",
                []
            )

        }

        sections.append(section)

    return json.dumps(
        sections,
        indent=2
    )


def research_agent(
    state,
    llm
):

    weekly_input = build_weekly_input(

        state["daily_briefs"]

    )

    prompt = f"""
{RESEARCH_PROMPT}

WEEKLY DAILY INTELLIGENCE

{weekly_input}
"""

    result = llm.invoke(
        prompt
    )

    output = parse_llm_json(
        result.content
    )

    state["weekly_findings"] = output.get(
        "weekly_findings",
        []
    )

    log_stage(

        state["company"],

        "weekly_research",

        state["weekly_findings"]

    )

    return state