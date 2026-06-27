import json

from prompts.weekly.signal_prompt import (
    SIGNAL_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.prompt_logger import (
    log_stage
)


def signal_agent(
    state,
    llm
):

    findings = json.dumps(

        state["weekly_findings"],

        indent=2

    )

    trends = json.dumps(

        state["weekly_trends"],

        indent=2

    )

    prompt = f"""
{SIGNAL_PROMPT}

WEEKLY FINDINGS

{findings}

WEEKLY TRENDS

{trends}
"""

    result = llm.invoke(
        prompt
    )

    try:

        output = parse_llm_json(
            result.content
        )

        state["strategic_signals"] = output.get(

            "strategic_signals",

            []

        )

        log_stage(

            state["company"],

            "weekly_signal",

            state["strategic_signals"]

        )

    except Exception:

        import traceback

        print("\n========== WEEKLY SIGNAL FAILED ==========\n")

        traceback.print_exc()

        print(result.content)

        raise

    return state