from dotenv import load_dotenv

load_dotenv()

import os

from pymongo import MongoClient

# ---------------------------------------------------------
# Mongo Configuration
# ---------------------------------------------------------

mongo_uri = os.getenv(
    "MONGODB_URI"
)

mongo_database = os.getenv(
    "MONGODB_DATABASE"
)

if not mongo_uri:

    raise Exception(
        "MONGODB_URI not found in environment"
    )

if not mongo_database:

    raise Exception(
        "MONGODB_DATABASE not found in environment"
    )

# ---------------------------------------------------------
# Mongo Connection
# ---------------------------------------------------------

client = MongoClient(
    mongo_uri
)

db = client[
    mongo_database
]

# ---------------------------------------------------------
# Collections
# ---------------------------------------------------------

articles_collection = db[
    "articles"
]

users_collection = db[
    "users"
]

briefs_collection = db[
    "companyBriefs"
]

company_weekly_collection = db[
    "companyWeeklyBriefs"
]

user_weekly_collection = db[
    "userWeeklyBriefs"
]

# ---------------------------------------------------------
# Startup Diagnostics
# ---------------------------------------------------------

print(
    "Connected DB:",
    db.name
)

print(
    "Collections:",
    db.list_collection_names()
)

# ---------------------------------------------------------
# Exports
# ---------------------------------------------------------

__all__ = [

    "client",

    "db",

    "articles_collection",

    "users_collection",

    "briefs_collection",

    "company_weekly_collection",

    "user_weekly_collection"
]