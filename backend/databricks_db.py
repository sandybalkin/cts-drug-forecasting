from databricks import sql
from dotenv import load_dotenv
from pathlib import Path
import os

# Load .env from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def get_connection():
    return sql.connect(
        server_hostname=os.getenv("DATABRICKS_SERVER_HOSTNAME"),
        http_path=os.getenv("DATABRICKS_HTTP_PATH"),
        access_token=os.getenv("DATABRICKS_TOKEN")
    )


def execute_query(query, params=None):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()