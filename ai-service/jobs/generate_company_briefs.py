from collections import defaultdict
from datetime import datetime

from graphs.company_brief_graph import (
    build_graph
)

from services.openai_service import (
    get_llm
)

from services.mongo_service import (
    articles_collection,
    briefs_collection
)

# ---------------------------------------------------------
# Increment this whenever prompts/logic change significantly.
# Existing briefs with older versions will be regenerated.
# ---------------------------------------------------------
CURRENT_BRIEF_VERSION = 1


def get_today_ist():

    return datetime.now().strftime(
        "%Y-%m-%d"
    )


def group_articles_by_company(
    articles
):

    grouped = defaultdict(list)

    for article in articles:

        source = article.get(
            "source"
        )

        if not source:
            continue

        grouped[source].append(
            article
        )

    return grouped


def generate_company_briefs_for_date(
    target_date
):

    print(
        f"\nGenerating briefs for: {target_date}"
    )

    articles = list(
        articles_collection.find(
            {
                "fetchedDate":
                    target_date
            }
        )
    )

    print(
        f"Loaded {len(articles)} articles"
    )

    if not articles:

        print(
            f"No articles found for {target_date}"
        )

        return

    grouped = (
        group_articles_by_company(
            articles
        )
    )

    llm = get_llm()

    graph = build_graph(llm)

    print(
        f"Found {len(grouped)} companies"
    )

    for company, company_articles in (
        grouped.items()
    ):

        # -------------------------------------------------
        # Skip if brief already exists for this company/date
        # and version.
        # -------------------------------------------------

        existing_brief = (
            briefs_collection.find_one(
                {
                    "company":
                        company,

                    "date":
                        target_date
                }
            )
        )

        if existing_brief:

            print(
                f"SKIPPING: {company} "
                f"({target_date})"
            )

            continue

        # -------------------------------------------------
        # Skip weak data sets
        # -------------------------------------------------

        if len(company_articles) < 2:

            print(
                f"Skipping {company} - "
                f"only {len(company_articles)} article(s)"
            )

            continue

        print(
            f"Generating brief: {company} "
            f"({len(company_articles)} articles)"
        )

        article_payload = []

        article_ids = []

        article_titles = []

        for article in company_articles:

            article_ids.append(
                article.get("id")
            )

            article_titles.append(
                article.get("title")
            )

            article_payload.append(
                {
                    "id":
                        article.get(
                            "id"
                        ),

                    "title":
                        article.get(
                            "title"
                        ),

                    "source":
                        article.get(
                            "source"
                        ),

                    "summary":
                        article.get(
                            "summary",
                            []
                        ),

                    "publishedAt":
                        article.get(
                            "publishedAt"
                        )
                }
            )

        state = {
            "company":
                company,

            "articles":
                article_payload,

            "facts": [],
            "themes": [],
            "impacts": [],

            "whats_happening":
                [],

            "why_it_matters":
                []
        }

        try:

            result = graph.invoke(
                state
            )

            briefs_collection.update_one(
                {
                    "company":
                        company,

                    "date":
                        target_date
                },
                {
                    "$set": {

                        "company":
                            company,

                        "date":
                            target_date,

                        "articleCount":
                            len(
                                company_articles
                            ),

                        "articleIds":
                            article_ids,

                        "articleTitles":
                            article_titles,

                        "whatsHappening": result.get("whats_happening", []),

"whyItMatters": result.get("why_it_matters", []),

"themes": result.get("themes", []),

"facts": result.get("facts", []),

"impacts": result.get("impacts", []),

                        "generatedBy":
                            "gpt-4.1-mini",

                        "briefVersion":
                            CURRENT_BRIEF_VERSION,

                        "generatedAt":
                            datetime.utcnow()
                    }
                },
                upsert=True
            )

            print(
                f"Saved brief: {company}"
            )

        except Exception as e:

            print(
                f"FAILED: {company}"
            )

            print(
                repr(e)
            )

    print(
        f"Finished generating briefs for {target_date}"
    )


def generate_company_briefs():

    latest_article = (
        articles_collection.find_one(
            {},
            sort=[
                (
                    "fetchedDate",
                    -1
                )
            ]
        )
    )

    if not latest_article:

        print(
            "No articles found"
        )

        return

    latest_date = (
        latest_article[
            "fetchedDate"
        ]
    )

    generate_company_briefs_for_date(
        latest_date
    )