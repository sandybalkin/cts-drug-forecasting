from databricks_data import load_gold_data

similarity_df, bass_df, weekly_df = load_gold_data()

print("=== SIMILARITY ===")
print(similarity_df.columns.tolist())
print(similarity_df.shape)

print("\n=== BASS ===")
print(bass_df.columns.tolist())
print(bass_df.shape)

print("\n=== WEEKLY RX ===")
print(weekly_df.columns.tolist())
print(weekly_df.shape)