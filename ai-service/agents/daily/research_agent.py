import json

from prompts.daily.research_prompt import (
    RESEARCH_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.schema_validator import (
    validate_research
)

from utils.prompt_logger import (
    log_stage
)


# ----------------------------------------------------------
# Prompt Builder
# ----------------------------------------------------------

def _build_prompt(state):

    articles = []

    for article in state["articles"]:

        articles.append({

            "id": article.get("id"),

            "title": article.get(
                "title",
                ""
            ),

            "company": article.get(
                "source",
                ""
            ),

            "summary": article.get(
                "summary",
                []
            )

        })

    return f"""
{RESEARCH_PROMPT}

==================================================

ARTICLES

{json.dumps(
    articles,
    indent=2
)}
"""


# ----------------------------------------------------------
# Statistics
# ----------------------------------------------------------

def _research_statistics(facts):

    if not facts:
        return

    companies = len({

        x["company"]

        for x in facts

    })

    print(f"""

========== RESEARCH AGENT ==========

Facts Extracted : {len(facts)}

Companies Mentioned : {companies}

===================================

""")


# ----------------------------------------------------------
# Research Agent
# ----------------------------------------------------------

def research_agent(state, llm):

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

        facts = output.get(
            "facts",
            []
        )

        facts = validate_research(
            facts
        )

        if len(facts) == 0:

            raise Exception(
                "Research Agent returned zero valid facts."
            )

        state["facts"] = facts

        _research_statistics(
            facts
        )

        log_stage(

            state["company"],

            "research",

            facts

        )

    except Exception:

        import traceback

        print(
            "\n========== RESEARCH AGENT FAILED ==========\n"
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