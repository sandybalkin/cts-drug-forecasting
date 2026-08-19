import numpy as np

def weekly_to_monthly(weekly_curve: np.ndarray) -> np.ndarray:
    """
    Converts 52-week curve into 12-month array (4 weeks per month).
    """
    monthly = []
    for month in range(12):
        start = month * 4
        end = min(start + 4, len(weekly_curve))
        monthly.append(float(np.sum(weekly_curve[start:end])))
    return np.array(monthly, dtype=float)

def compute_hybrid_curve(analog_curve: np.ndarray, bass_curve: np.ndarray, w_analog: float = 0.10, w_bass: float = 0.90) -> np.ndarray:
    """
    Blends analog curve and bass curve using specified weights.
    """
    return w_analog * analog_curve + w_bass * bass_curve
