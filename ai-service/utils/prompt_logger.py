import json
from pathlib import Path
from datetime import datetime


BASE = Path("logs")


def log_stage(company, stage, payload):

    folder = BASE / stage

    folder.mkdir(

        parents=True,

        exist_ok=True
    )

    filename = folder / f"{company}.json"

    with open(

        filename,

        "w",

        encoding="utf-8"

    ) as f:

        json.dump(

            {

                "generated_at":

                    datetime.utcnow().isoformat(),

                "payload":

                    payload

            },

            f,

            indent=2,

            ensure_ascii=False

        )