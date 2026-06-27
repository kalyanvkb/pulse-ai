from enum import Enum


class MarketImpactRating(str, Enum):

    VERY_POSITIVE = "Very Positive"

    POSITIVE = "Positive"

    NEUTRAL = "Neutral"

    NEGATIVE = "Negative"

    VERY_NEGATIVE = "Very Negative"


WEIGHTS = {

    "business": 0.35,

    "competition": 0.25,

    "enterprise": 0.20,

    "technology": 0.10,

    "ecosystem": 0.10
}


def calculate_score(market_impact):

    business = market_impact.get(
        "business_score",
        5
    )

    competition = market_impact.get(
        "competition_score",
        5
    )

    enterprise = market_impact.get(
        "enterprise_score",
        5
    )

    technology = market_impact.get(
        "technology_score",
        5
    )

    ecosystem = market_impact.get(
        "ecosystem_score",
        5
    )

    return round(

        business * WEIGHTS["business"]

        + competition * WEIGHTS["competition"]

        + enterprise * WEIGHTS["enterprise"]

        + technology * WEIGHTS["technology"]

        + ecosystem * WEIGHTS["ecosystem"],

        2

    )


def determine_rating(score):

    if score >= 8.5:

        return MarketImpactRating.VERY_POSITIVE.value

    if score >= 7:

        return MarketImpactRating.POSITIVE.value

    if score >= 5:

        return MarketImpactRating.NEUTRAL.value

    if score >= 3:

        return MarketImpactRating.NEGATIVE.value

    return MarketImpactRating.VERY_NEGATIVE.value


def enrich_market_impact(market_impact):

    score = calculate_score(market_impact)

    market_impact["overall_score"] = score

    market_impact["rating"] = determine_rating(score)

    return market_impact