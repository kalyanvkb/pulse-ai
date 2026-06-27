import json

from prompts.daily.writer_prompt import WRITER_PROMPT

from utils.json_parser import parse_llm_json
from utils.schema_validator import validate_ranked_bullets
from utils.prompt_logger import log_stage


# ----------------------------------------------------------
# Prompt Builder
# ----------------------------------------------------------

def _build_market_intelligence(impacts):

    sections = []

    for item in impacts:

        market = item.get("market_impact", {})

        sections.append(
f"""
SOURCE ID:
{item.get("id")}

IMPORTANCE:
{item.get("importance", 5)}

DEVELOPMENT:
{item.get("development","")}

BUSINESS SCORE:
{market.get("business_score")}

COMPETITION SCORE:
{market.get("competition_score")}

TECHNOLOGY SCORE:
{market.get("technology_score")}

ENTERPRISE SCORE:
{market.get("enterprise_score")}

ECOSYSTEM SCORE:
{market.get("ecosystem_score")}

CONFIDENCE:
{market.get("confidence")}

RATIONALE:
{market.get("rationale","")}

AFFECTED COMPANIES:

{json.dumps(
    market.get(
        "affected_companies",
        []
    ),
    indent=2
)}

COUNTERARGUMENTS:

{json.dumps(
    market.get(
        "counterarguments",
        []
    ),
    indent=2
)}
"""
        )

    return "\n\n--------------------------------------------------\n\n".join(
        sections
    )


def _build_prompt(state):

    return f"""
{WRITER_PROMPT}

==================================================

MARKET INTELLIGENCE

{_build_market_intelligence(state["impacts"])}
"""


# ----------------------------------------------------------
# Merge Market Impact
# ----------------------------------------------------------

def _merge_market_impacts(bullets, impacts, company):

    lookup = {

        item["id"]: item

        for item in impacts

        if item.get("id")

    }

    merged = []

    for bullet in bullets:

        impact = lookup.get(
            bullet.get("source_id")
        )

        if not impact:
            continue

        bullet["company"] = company

        bullet["market_impact"] = impact.get(
            "market_impact",
            {}
        )

        merged.append(
            bullet
        )

    return merged


# ----------------------------------------------------------
# Writer Agent
# ----------------------------------------------------------

def writer_agent(state, llm):

    prompt = _build_prompt(state)

    result = llm.invoke(prompt)

    try:

        output = parse_llm_json(
            result.content
        )

        whats = output.get(
            "whats_happening",
            []
        )

        why = output.get(
            "why_it_matters",
            []
        )

        whats = _merge_market_impacts(

            whats,

            state["impacts"],

            state["company"]

        )

        why = _merge_market_impacts(

            why,

            state["impacts"],

            state["company"]

        )

        state["whats_happening"] = validate_ranked_bullets(
            whats
        )

        state["why_it_matters"] = validate_ranked_bullets(
            why
        )

        log_stage(

            state["company"],

            "writer",

            {

                "whats_happening":
                    state["whats_happening"],

                "why_it_matters":
                    state["why_it_matters"]

            }

        )

        print(
            f"""
========== WRITER AGENT ==========

Company:
{state["company"]}

What's Happening:
{len(state["whats_happening"])}

Why It Matters:
{len(state["why_it_matters"])}

=================================
"""
        )

    except Exception:

        import traceback

        print(
            "\n========== WRITER FAILED ==========\n"
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