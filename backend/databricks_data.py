import pandas as pd
from backend.databricks_db import get_connection


def load_table(table_name):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(f"SELECT * FROM {table_name}")

        rows = cursor.fetchall()

        # Get the actual column names returned by Databricks
        columns = [column[0] for column in cursor.description]

        return pd.DataFrame(rows, columns=columns)

    finally:
        cursor.close()
        connection.close()


def load_gold_data():

    similarity_df = load_table("gold_product")

    bass_df = load_table("gold_bass_features")

    weekly_rx_df = load_table("gold_weekly_rx")

    return similarity_df, bass_df, weekly_rx_df