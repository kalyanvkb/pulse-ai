from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI

from jobs.generate_company_briefs import (
    generate_company_briefs
)

from jobs.generate_company_weekly_briefs import (
    generate_company_weekly_briefs
)

from jobs.generate_strategy_brief import (
    run as generate_strategy_brief
)

app = FastAPI()


@app.get("/")
def home():

    return {
        "service":
            "pulse-ai-agent-service"
    }


@app.post(
    "/generate-company-briefs"
)
def generate():

    generate_company_briefs()

    return {
        "success": True
    }

@app.post(
    "/generate-strategy-brief"
)
def generate_strategy():

    result = generate_strategy_brief()

    return result

@app.post(
    "/generate-company-weekly-briefs"
)
def generate_weekly():

    generate_company_weekly_briefs()

    return {
        "status":
            "success"
    }

