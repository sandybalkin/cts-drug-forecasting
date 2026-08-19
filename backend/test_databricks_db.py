from databricks_db import execute_query


tables = [
    "gold_product",
    "gold_bass_features",
    "gold_weekly_rx"
]


for table in tables:

    print("\n==============================")
    print("TABLE:", table)
    print("==============================")

    rows = execute_query(f"""
        SELECT *
        FROM {table}
        LIMIT 5
    """)

    print("Rows returned:", len(rows))

    for row in rows:
        print(row)