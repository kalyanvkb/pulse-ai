from dotenv import load_dotenv
load_dotenv()

from services.mongo_service import (
    articles_collection
)

dates = articles_collection.distinct(
    "fetchedDate"
)

print("\nDATES FOUND:\n")

for d in sorted(dates):
    print(d)