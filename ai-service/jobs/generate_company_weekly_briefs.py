from datetime import datetime

from graphs.company_weekly_graph import (
    build_weekly_graph
)

from services.openai_service import (
    get_llm
)

from services.week_service import (
    get_week_dates,
    get_week_key
)

from services.mongo_service import (
    briefs_collection,
    company_weekly_collection
)


CURRENT_WEEKLY_VERSION = 2


def generate_company_weekly_briefs():

    week_dates = (
        get_week_dates()
    )

    week_key = (
        get_week_key()
    )

    print(
        f"Generating weekly briefs for {week_key}"
    )

    briefs = list(
        briefs_collection.find(
            {
                "date": {
                    "$in":
                        week_dates
                }
            }
        )
    )

    print(
        f"Loaded {len(briefs)} daily briefs"
    )

    grouped = {}

    for brief in briefs:

        company = brief.get(
            "company"
        )

        grouped.setdefault(
            company,
            []
        ).append(
            brief
        )

    llm = get_llm()

    graph = (
        build_weekly_graph(
            llm
        )
    )

    for company, daily_briefs in (
        grouped.items()
    ):

        existing = (
            company_weekly_collection.find_one(
                {
                    "company":
                        company,

                    "week":
                        week_key,

                    "version":
                        CURRENT_WEEKLY_VERSION
                }
            )
        )

        if existing:

            print(
                f"SKIPPING: {company}"
            )

            continue

        print(
            f"Generating weekly brief: {company}"
        )

        state = {

            "company":
                company,

            "week":
                week_key,

            "daily_briefs":
                daily_briefs,

            "findings": [],

            "themes": [],

            "signals": [],

            "what_changed": [],

            "why_it_matters": [],

            "signals_to_watch": []
        }

        try:

            result = graph.invoke(
                state
            )

            company_weekly_collection.update_one(
                {
                    "company":
                        company,

                    "week":
                        week_key
                },
                {
                    "$set": {

                        "company":
                            company,

                        "week":
                            week_key,

                        "whatChanged":
                            result.get(
                                "what_changed",
                                []
                            ),

                        "whyItMatters":
                            result.get(
                                "why_it_matters",
                                []
                            ),

                        "signalsToWatch":
                            result.get(
                                "signals_to_watch",
                                []
                            ),

                        "version":
                            CURRENT_WEEKLY_VERSION,

                        "generatedAt":
                            datetime.utcnow()
                    }
                },
                upsert=True
            )

            print(
                f"Saved weekly brief: {company}"
            )

        except Exception as e:

            print(
                f"FAILED: {company}"
            )

            print(
                repr(e)
            )