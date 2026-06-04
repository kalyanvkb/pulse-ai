from typing import TypedDict


class RankedBullet(TypedDict):

    importance: int

    text: str


class CompanyBriefState(TypedDict):

    company: str

    articles: list

    facts: list

    themes: list

    impacts: list

    whats_happening: list[RankedBullet]

    why_it_matters: list[RankedBullet]