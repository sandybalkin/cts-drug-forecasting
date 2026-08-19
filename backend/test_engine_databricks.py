from forecasting.engine import ForecastingEngine


engine = ForecastingEngine(None)

print("Initializing forecasting engine...")

engine.initialize()

print("\n=== ENGINE INITIALIZED ===")

print("Similarity shape:", engine.similarity_df.shape)
print("Bass shape:", engine.bass_df.shape)
print("Weekly RX shape:", engine.weekly_df.shape)

print("\nSimilarity columns:")
print(engine.similarity_df.columns.tolist())

print("\nBass columns:")
print(engine.bass_df.columns.tolist())

print("\nWeekly RX columns:")
print(engine.weekly_df.columns.tolist())