from typing import TypedDict
from enum import Enum


# -----------------------------
# Research Agent
# -----------------------------

class ResearchFinding(TypedDict):
    company: str
    event_type: str
    title: str
    fact: str
    evidence_strength: str
    supporting_evidence: list[str]

class MarketImpactRating(str, Enum):
    VERY_POSITIVE = "Very Positive"
    POSITIVE = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"
    VERY_NEGATIVE = "Very Negative"


# -----------------------------
# Theme Agent
# -----------------------------

class Theme(TypedDict):
    theme: str
    description: str
    confidence: int


# -----------------------------
# Market Impact
# -----------------------------

class AffectedCompany(TypedDict):
    company: str
    impact: str
    confidence: int
    reason: str


class MarketImpact(TypedDict):
    rating: MarketImpactRating
    confidence: int

    business_score: int
    competition_score: int
    technology_score: int
    enterprise_score: int
    ecosystem_score: int
    overall_score: int

    rationale: str

    counterarguments: list[str]

    affected_companies: list[AffectedCompany]


# -----------------------------
# Impact Agent
# -----------------------------

class ImpactFinding(TypedDict):
    development: str
    market_impact: MarketImpact


# -----------------------------
# Writer
# -----------------------------

class RankedBullet(TypedDict):
    importance: int
    text: str
    market_impact: MarketImpact


# -----------------------------
# LangGraph State
# -----------------------------

class CompanyBriefState(TypedDict):

    company: str

    articles: list[dict]

    facts: list[ResearchFinding]

    themes: list[Theme]

    impacts: list[ImpactFinding]

    whats_happening: list[RankedBullet]

    why_it_matters: list[RankedBullet]