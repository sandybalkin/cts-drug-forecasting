import pandas as pd
import numpy as np
from .gower_similarity import get_top_analogs

WEEKS = 52

def compute_analog_curve(new_drug: dict, similarity_df: pd.DataFrame, historical_weekly: pd.DataFrame, total_rx: float, k: int = 3):
    """
    Computes weighted blended historical curve for top-k analogs and scales to total_rx.
    Returns (analog_rx_array, analog_list_tuples)
    """
    analog_list = get_top_analogs(new_drug, similarity_df, k)

    rx_pivot = historical_weekly.pivot(
        index="product_id",
        columns="week_since_launch",
        values="weekly_rx"
    ).reindex(columns=range(1, WEEKS + 1)).fillna(0)

    row_sums = rx_pivot.sum(axis=1).replace(0, np.nan)
    curve_shapes = rx_pivot.div(row_sums, axis=0).fillna(0)

    blended_shape = np.zeros(WEEKS, dtype=float)

    for pid, weight, similarity in analog_list:
        if pid in curve_shapes.index:
            blended_shape += float(weight) * curve_shapes.loc[pid].values

    analog_rx = blended_shape * float(total_rx)
    return analog_rx, analog_list
