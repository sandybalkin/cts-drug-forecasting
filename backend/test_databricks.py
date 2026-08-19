from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from databricks import sql

connection = sql.connect(
    server_hostname=os.getenv("DATABRICKS_SERVER_HOSTNAME"),
    http_path=os.getenv("DATABRICKS_HTTP_PATH"),
    access_token=os.getenv("DATABRICKS_TOKEN")
)

cursor = connection.cursor()
cursor.execute("""
    SELECT *
    FROM gold_product
    LIMIT 5
""")

print("Databricks connection successful!")
rows = cursor.fetchall()

for row in rows:
    print(row)

cursor.close()
connection.close()