from typing import TypedDict


class WeeklyState(TypedDict):

    company: str

    week: str

    daily_briefs: list

    findings: list

    themes: list

    signals: list

    what_changed: list

    why_it_matters: list

    signals_to_watch: list