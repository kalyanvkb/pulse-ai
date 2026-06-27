import json

from prompts.daily.theme_prompt import (
    THEME_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.schema_validator import (
    validate_themes
)

from utils.prompt_logger import (
    log_stage
)


# ----------------------------------------------------------
# Prompt Builder
# ----------------------------------------------------------

def _build_prompt(state):

    return f"""
{THEME_PROMPT}

==================================================

VERIFIED FACTS

{json.dumps(
    state["facts"],
    indent=2
)}
"""


# ----------------------------------------------------------
# Statistics
# ----------------------------------------------------------

def _theme_statistics(themes):

    if not themes:
        return

    avg_importance = sum(
        x["importance"]
        for x in themes
    ) / len(themes)

    avg_confidence = sum(
        x["confidence"]
        for x in themes
    ) / len(themes)

    print(
        f"""

========== THEME AGENT ==========

Themes Generated : {len(themes)}

Average Importance : {avg_importance:.2f}

Average Confidence : {avg_confidence:.2f}

================================

"""
    )


# ----------------------------------------------------------
# Theme Agent
# ----------------------------------------------------------

def theme_agent(state, llm):

    prompt = _build_prompt(
        state
    )

    result = llm.invoke(
        prompt
    )

    try:

        output = parse_llm_json(
            result.content
        )

        themes = output.get(
            "themes",
            []
        )

        themes = validate_themes(
            themes
        )

        if len(themes) == 0:

            raise Exception(
                "Theme Agent returned zero valid themes."
            )

        state["themes"] = themes

        _theme_statistics(
            themes
        )

        log_stage(

            state["company"],

            "themes",

            themes

        )

    except Exception:

        import traceback

        print(
            "\n========== THEME AGENT FAILED ==========\n"
        )

        traceback.print_exc()

        print(
            "\n========== RAW RESPONSE ==========\n"
        )

        print(
            result.content
        )

        raise

    return state