import json

from prompts.daily.impact_prompt import (
    IMPACT_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.schema_validator import (
    validate_impacts
)

from utils.prompt_logger import (
    log_stage
)


def _build_prompt(state):

    return f"""
{IMPACT_PROMPT}

==================================================

FACTS

{json.dumps(state["facts"], indent=2)}

==================================================

THEMES

{json.dumps(state["themes"], indent=2)}
"""


def writer_statistics(items):

    if not items:
        return

    avg_importance = sum(
        x["importance"]
        for x in items
    ) / len(items)

    avg_confidence = sum(
        x["market_impact"]["confidence"]
        for x in items
    ) / len(items)

    print(
        f"""
Impact Agent Statistics

Developments : {len(items)}

Average Importance : {avg_importance:.2f}

Average Confidence : {avg_confidence:.2f}
"""
    )


def impact_agent(state, llm):

    prompt = _build_prompt(state)

    result = llm.invoke(prompt)

    try:

        output = parse_llm_json(
            result.content
        )

        intelligence = output.get(
            "market_intelligence",
            []
        )

        intelligence = validate_impacts(
            intelligence
        )

        if len(intelligence) == 0:

            raise Exception(
                "Impact Agent returned zero valid developments."
            )

        if len(intelligence) < 5:

            print(
                f"Only {len(intelligence)} significant developments identified."
            )

        state["impacts"] = intelligence

        writer_statistics(
            intelligence
        )

        log_stage(
            state["company"],
            "impact",
            intelligence
        )

    except Exception:

        import traceback

        print(
            "\n========== IMPACT AGENT FAILED ==========\n"
        )

        traceback.print_exc()

        print(
            "\n========== RAW RESPONSE ==========\n"
        )

        print(result.content)

        raise

    return state