import json

from prompts.weekly.writer_prompt import (
    WRITER_PROMPT
)

from utils.json_parser import (
    parse_llm_json
)

from utils.prompt_logger import (
    log_stage
)


# ---------------------------------------------------------
# Build Prompt
# ---------------------------------------------------------

def build_strategic_signal_prompt(signals):

    sections = []

    for signal in signals:

        sections.append(
f"""
==================================================

SIGNAL ID:
{signal.get("signal_id")}

SIGNAL:
{signal.get("signal","")}

DESCRIPTION:
{signal.get("description","")}

SIGNAL STRENGTH:
{signal.get("signal_strength")}

TRAJECTORY:
{signal.get("trajectory")}

CONFIDENCE:
{signal.get("confidence")}

BENEFICIARIES:

{json.dumps(
    signal.get(
        "beneficiaries",
        []
    ),
    indent=2
)}

COMPANIES UNDER PRESSURE:

{json.dumps(
    signal.get(
        "companies_under_pressure",
        []
    ),
    indent=2
)}

WATCH NEXT WEEK:

{signal.get("watch_next_week","")}

SUPPORTING EVIDENCE:

{json.dumps(
    signal.get(
        "evidence",
        []
    ),
    indent=2
)}
"""
        )

    return "\n".join(sections)


# ---------------------------------------------------------
# Merge Strategic Signal
# ---------------------------------------------------------

def merge_signals(
    bullets,
    signals,
    company
):

    lookup = {

        signal["signal_id"]: signal

        for signal in signals

        if signal.get("signal_id")

    }

    merged = []

    for bullet in bullets:

        signal = lookup.get(

            bullet.get("source_id")

        )

        if not signal:

            continue

        bullet["company"] = company

        bullet["strategic_signal"] = signal

        merged.append(
            bullet
        )

    return merged


# ---------------------------------------------------------
# Writer Agent
# ---------------------------------------------------------

def writer_agent(
    state,
    llm
):

    prompt = f"""
{WRITER_PROMPT}

==================================================

STRATEGIC SIGNALS

{build_strategic_signal_prompt(
    state["strategic_signals"]
)}
"""

    result = llm.invoke(
        prompt
    )

    try:

        output = parse_llm_json(
            result.content
        )

        what_changed = merge_signals(

            output.get(
                "what_changed",
                []
            ),

            state["strategic_signals"],

            state["company"]

        )

        why_it_matters = merge_signals(

            output.get(
                "why_it_matters",
                []
            ),

            state["strategic_signals"],

            state["company"]

        )

        signals_to_watch = merge_signals(

            output.get(
                "signals_to_watch",
                []
            ),

            state["strategic_signals"],

            state["company"]

        )

        state["what_changed"] = sorted(

            what_changed,

            key=lambda x:

                x.get(
                    "importance",
                    0
                ),

            reverse=True

        )

        state["why_it_matters"] = sorted(

            why_it_matters,

            key=lambda x:

                x.get(
                    "importance",
                    0
                ),

            reverse=True

        )

        state["signals_to_watch"] = sorted(

            signals_to_watch,

            key=lambda x:

                x.get(
                    "importance",
                    0
                ),

            reverse=True

        )

        log_stage(

            state["company"],

            "weekly_writer",

            {

                "what_changed":
                    state["what_changed"],

                "why_it_matters":
                    state["why_it_matters"],

                "signals_to_watch":
                    state["signals_to_watch"]

            }

        )

        print(
f"""

========== WEEKLY WRITER ==========

Company:
{state["company"]}

What Changed:
{len(state["what_changed"])}

Why It Matters:
{len(state["why_it_matters"])}

Signals To Watch:
{len(state["signals_to_watch"])}

==================================

"""
        )

    except Exception:

        import traceback

        print("\n========== WEEKLY WRITER FAILED ==========\n")

        traceback.print_exc()

        print(result.content)

        raise

    return state