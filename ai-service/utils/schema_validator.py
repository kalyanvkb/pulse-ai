from utils.scoring import enrich_market_impact


# ----------------------------------------------------------
# Research Validation
# ----------------------------------------------------------

def validate_research(items):

    if not isinstance(items, list):
        return []

    valid = []

    seen = set()

    for item in items:

        if not isinstance(item, dict):
            continue

        fact_id = item.get("fact_id")

        if not fact_id:
            continue

        if fact_id in seen:
            continue

        seen.add(fact_id)

        if not item.get("company"):
            continue

        if not item.get("fact"):
            continue

        item.setdefault(
            "event_type",
            "Other"
        )

        item.setdefault(
            "title",
            ""
        )

        item.setdefault(
            "evidence_strength",
            "Medium"
        )

        item.setdefault(
            "supporting_evidence",
            []
        )

        valid.append(item)

    return valid


# ----------------------------------------------------------
# Theme Validation
# ----------------------------------------------------------

def validate_themes(items):

    if not isinstance(items, list):
        return []

    valid = []

    seen = set()

    for item in items:

        if not isinstance(item, dict):
            continue

        if not item.get("theme_id"):
            continue

        if item["theme_id"] in seen:
            continue

        seen.add(item["theme_id"])

        if not item.get("theme"):
            continue

        item.setdefault(
            "description",
            ""
        )

        item.setdefault(
            "importance",
            5
        )

        item.setdefault(
            "confidence",
            70
        )

        item.setdefault(
            "supporting_facts",
            []
        )

        valid.append(item)

    valid.sort(
        key=lambda x: x["importance"],
        reverse=True
    )

    return valid


# ----------------------------------------------------------
# Market Intelligence Validation
# ----------------------------------------------------------

def validate_impacts(items):

    if not isinstance(items, list):
        return []

    valid = []

    for item in items:

        if not isinstance(item, dict):
            continue

        if not item.get("id"):
            continue

        if not item.get("development"):
            continue

        item.setdefault(
            "importance",
            5
        )

        market = item.get(
            "market_impact",
            {}
        )

        if not isinstance(
            market,
            dict
        ):
            market = {}

        market.setdefault(
            "business_score",
            5
        )

        market.setdefault(
            "competition_score",
            5
        )

        market.setdefault(
            "technology_score",
            5
        )

        market.setdefault(
            "enterprise_score",
            5
        )

        market.setdefault(
            "ecosystem_score",
            5
        )

        market.setdefault(
            "confidence",
            60
        )

        market.setdefault(
            "rationale",
            ""
        )

        market.setdefault(
            "counterarguments",
            []
        )

        market.setdefault(
            "affected_companies",
            []
        )

        cleaned = []

        for company in market[
            "affected_companies"
        ]:

            if not isinstance(
                company,
                dict
            ):
                continue

            if not company.get(
                "company"
            ):
                continue

            company.setdefault(
                "impact",
                "Neutral"
            )

            company.setdefault(
                "confidence",
                50
            )

            company.setdefault(
                "reason",
                ""
            )

            cleaned.append(
                company
            )

        market[
            "affected_companies"
        ] = cleaned

        item[
            "market_impact"
        ] = enrich_market_impact(
            market
        )

        valid.append(item)

    return valid


# ----------------------------------------------------------
# Writer Validation
# ----------------------------------------------------------

def validate_ranked_bullets(items):

    if not isinstance(items, list):
        return []

    valid = []

    seen = set()

    for item in items:

        if not isinstance(item, dict):
            continue

        source_id = item.get(
            "source_id"
        )

        if not source_id:
            continue

        if source_id in seen:
            continue

        seen.add(
            source_id
        )

        if not item.get(
            "text"
        ):
            continue

        item.setdefault(
            "importance",
            5
        )

        if "market_impact" not in item:

            item[
                "market_impact"
            ] = {}

        valid.append(
            item
        )

    valid.sort(

        key=lambda x: x[
            "importance"
        ],

        reverse=True

    )

    return valid