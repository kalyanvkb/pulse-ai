from datetime import (
    datetime,
    timedelta
)


def get_week_dates():

    today = datetime.utcnow()

    return [

        (
            today -
            timedelta(days=i)
        ).strftime(
            "%Y-%m-%d"
        )

        for i in range(7)
    ]


def get_week_key():

    today = datetime.utcnow()

    year, week, _ = (
        today.isocalendar()
    )

    return f"{year}-W{week}"