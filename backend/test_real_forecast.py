from forecasting.engine import ForecastingEngine


print("Initializing forecasting engine...")

engine = ForecastingEngine()

engine.initialize()

print("\n=== ENGINE INITIALIZED ===")
print("Similarity shape:", engine.similarity_df.shape)
print("Bass shape:", engine.bass_df.shape)
print("Weekly RX shape:", engine.weekly_df.shape)


new_drug = {
    "product_id": "TEST_DRUG_001",

    "therapeutic_area": "Oncology",
    "indication": "Cancer",
    "active_ingredient": "Test Ingredient",
    "pharmacological_class": "Test Class",
    "mechanism_of_action": "Test Mechanism",
    "route_of_administration": "Oral",
    "target_population": "Adults",

    "addressable_population": 100000,
    "estimated_penetration": 0.10,

    "competition_level": 5,
    "relative_price_index": 1.0,
    "market_access_level": 5,

    "marketing_awareness": 7,
    "launch_strength": 7,
    "physician_awareness": 7,

    "clinical_evidence_strength": 8,
    "treatment_familiarity": 6
}


print("\nRunning forecast...")

result = engine.run(
    new_drug,
    top_k=3,
    w_analog=0.10
)


print("\n=== FORECAST SUCCESSFUL ===")

print("\nBass Parameters:")
print(result["bass_params"])

print("\nSummary Totals:")
print(result["summary_totals"])

print("\nAssumptions:")
print(result["assumptions"])

print("\nTop Analogs:")

for analog in result["analogs"]:
    print(
        analog["product_id"],
        "| similarity:",
        analog["similarity_pct"],
        "%"
    )

print("\nWeekly Forecast:")
print("Number of weeks:", len(result["weekly_forecast"]))
print("First week:", result["weekly_forecast"][0])
print("Last week:", result["weekly_forecast"][-1])

print("\nMonthly Forecast:")
print("Number of months:", len(result["monthly_forecast"]))
print("First month:", result["monthly_forecast"][0])
print("Last month:", result["monthly_forecast"][-1])

print("\n=== TEST COMPLETE ===")

print("\n=== OUTPUT VALIDATION ===")

assert len(result["weekly_forecast"]) == 52
print("✓ Weekly forecast contains 52 weeks")

assert len(result["monthly_forecast"]) == 12
print("✓ Monthly forecast contains 12 months")

assert len(result["analogs"]) == 3
print("✓ Top-K analog count is 3")

assert result["bass_params"]["m_hat"] == 10000
print("✓ Market potential M is correct")

assert (
    result["summary_totals"]["bear_52w_rx"]
    < result["summary_totals"]["base_52w_rx"]
    < result["summary_totals"]["bull_52w_rx"]
)
print("✓ Bear < Base < Bull")

assert result["weekly_forecast"][-1]["cumulative_hybrid_rx"] > 0
print("✓ Weekly cumulative forecast is valid")

assert result["monthly_forecast"][-1]["cumulative_hybrid_rx"] > 0
print("✓ Monthly cumulative forecast is valid")

print("\n=== ALL OUTPUT VALIDATIONS PASSED ===")