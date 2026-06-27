import json

from prompts.weekly.trend_prompt import (
    TREND_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.prompt_logger import (
    log_stage
)


def trend_agent(
    state,
    llm
):

    findings = json.dumps(

        state["weekly_findings"],

        indent=2

    )

    prompt = f"""
{TREND_PROMPT}

WEEKLY FINDINGS

{findings}
"""

    result = llm.invoke(
        prompt
    )

    try:

        output = parse_llm_json(
            result.content
        )

        state["weekly_trends"] = output.get(

            "weekly_trends",

            []

        )

        log_stage(

            state["company"],

            "weekly_trend",

            state["weekly_trends"]

        )

    except Exception:

        import traceback

        print("\n========== WEEKLY TREND FAILED ==========\n")

        traceback.print_exc()

        print(result.content)

        raise

    return state