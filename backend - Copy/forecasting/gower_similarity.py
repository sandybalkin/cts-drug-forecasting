import pandas as pd
import numpy as np
import gower

FEATURES = [
    "therapeutic_area",
    "indication",
    "active_ingredient",
    "pharmacological_class",
    "mechanism_of_action",
    "route_of_administration",
    "target_population",
    "addressable_population",
    "competition_level",
    "relative_price_index",
    "market_access_level",
    "clinical_evidence_strength"
]

CATEGORICAL_FEATURES = [
    "therapeutic_area",
    "indication",
    "active_ingredient",
    "pharmacological_class",
    "mechanism_of_action",
    "route_of_administration",
    "target_population"
]

def get_top_analogs(new_drug: dict, similarity_df: pd.DataFrame, k: int = 3) -> list:
    """
    Computes Gower similarity between new_drug and historical products in similarity_df.
    Returns list of tuples: (product_id, weight, similarity_score)
    """
    new_row = pd.DataFrame([{feature: new_drug[feature] for feature in FEATURES}])
    combined = pd.concat([similarity_df[FEATURES], new_row], ignore_index=True)

    categorical_mask = [feature in CATEGORICAL_FEATURES for feature in FEATURES]

    distance_matrix = gower.gower_matrix(combined, cat_features=categorical_mask)
    similarity_matrix = 1.0 - distance_matrix

    new_index = len(combined) - 1
    similarities = pd.Series(
        similarity_matrix[new_index, :-1],
        index=similarity_df["product_id"]
    )

    top_k = similarities.sort_values(ascending=False).head(k)

    if top_k.sum() > 0:
        weights = top_k / top_k.sum()
    else:
        weights = pd.Series(1.0 / len(top_k), index=top_k.index)

    analog_list = []
    for pid in top_k.index:
        analog_list.append((
            str(pid),
            float(weights.loc[pid]),
            float(top_k.loc[pid])
        ))

    return analog_list
