from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta

from jobs.generate_company_briefs import (
    generate_company_briefs_for_date
)


def backfill_last_n_days(
    days=2
):

    today = datetime.now()

    for i in range(1, days+1):

        target_date = (
            today - timedelta(days=i)
        )

        date_str = target_date.strftime(
            "%Y-%m-%d"
        )

        print(
            f"\nBACKFILLING: {date_str}"
        )

        try:

            generate_company_briefs_for_date(
                date_str
            )

            print(
                f"SUCCESS: {date_str}"
            )

        except Exception as e:

            print(
                f"FAILED: {date_str}"
            )

            print(e)


if __name__ == "__main__":

    backfill_last_n_days(
        days=7
    )