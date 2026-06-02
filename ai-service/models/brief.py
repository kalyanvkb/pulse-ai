from pydantic import BaseModel
from typing import List


class CompanyBrief(BaseModel):

    whats_happening: List[str]

    why_it_matters: List[str]