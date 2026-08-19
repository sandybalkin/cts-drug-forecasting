import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

P_FEATURES = [
    "marketing_awareness",
    "launch_strength",
    "physician_awareness",
    "competition_level",
    "market_access_level"
]

Q_FEATURES = [
    "clinical_evidence_strength",
    "treatment_familiarity",
    "competition_level",
    "market_access_level"
]

def bass_weekly_curve(p: float, q: float, m: float, weeks: int = 52) -> np.ndarray:
    """
    Calculates 52-week Bass diffusion adoption curve.
    """
    t = np.arange(1, weeks + 1, dtype=float)
    p = max(float(p), 1e-8)
    q = max(float(q), 1e-8)
    m = float(m)

    F = (1 - np.exp(-(p + q) * t)) / (1 + (q / p) * np.exp(-(p + q) * t))
    F_prev = np.r_[0, F[:-1]]
    weekly_rx = m * (F - F_prev)
    return weekly_rx


class BassModelTrainer:
    """
    Fits historical p and q for products using curve_fit, then trains Ridge regression
    models to predict p and q from pre-launch features.
    """
    def __init__(self):
        self.model_p = Ridge(alpha=5.0)
        self.scaler_p = StandardScaler()
        self.model_q = Ridge(alpha=5.0)
        self.scaler_q = StandardScaler()
        self.is_fitted = False

    def fit(self, bass_df: pd.DataFrame, weekly_df: pd.DataFrame):
        df = bass_df.copy()
        
        # Calculate m
        df["m"] = df["addressable_population"] * df["estimated_penetration"]

        # Fit p_fit and q_fit if not present
        if "p_fit" not in df.columns or "q_fit" not in df.columns:
            p_fits = []
            q_fits = []
            
            for _, row in df.iterrows():
                pid = row["product_id"]
                m_fixed = row["m"]
                sub = weekly_df[weekly_df["product_id"] == pid].sort_values("week_since_launch")
                t_obs = sub["week_since_launch"].values.astype(float)
                y_obs = sub["weekly_rx"].values.astype(float)

                def model(t, p, q):
                    return bass_weekly_curve(p, q, m_fixed, weeks=len(t))

                try:
                    popt, _ = curve_fit(
                        model, t_obs, y_obs,
                        p0=[0.03, 0.3],
                        bounds=([0.0001, 0.001], [0.5, 3.0]),
                        maxfev=5000
                    )
                    p_fits.append(popt[0])
                    q_fits.append(popt[1])
                except Exception:
                    p_fits.append(0.03)
                    q_fits.append(0.3)

            df["p_fit"] = p_fits
            df["q_fit"] = q_fits

        Xp = df[P_FEATURES].values
        Xq = df[Q_FEATURES].values

        log_p = np.log(df["p_fit"].values)
        log_q = np.log(df["q_fit"].values)

        Xp_scaled = self.scaler_p.fit_transform(Xp)
        Xq_scaled = self.scaler_q.fit_transform(Xq)

        self.model_p.fit(Xp_scaled, log_p)
        self.model_q.fit(Xq_scaled, log_q)
        self.is_fitted = True

    def predict_p(self, new_drug_dict: dict) -> float:
        if not self.is_fitted:
            raise ValueError("BassModelTrainer must be fitted before predicting.")
        X_new = np.array([[float(new_drug_dict[f]) for f in P_FEATURES]], dtype=float)
        X_scaled = self.scaler_p.transform(X_new)
        log_p_hat = self.model_p.predict(X_scaled)[0]
        return float(np.exp(log_p_hat))

    def predict_q(self, new_drug_dict: dict) -> float:
        if not self.is_fitted:
            raise ValueError("BassModelTrainer must be fitted before predicting.")
        X_new = np.array([[float(new_drug_dict[f]) for f in Q_FEATURES]], dtype=float)
        X_scaled = self.scaler_q.transform(X_new)
        log_q_hat = self.model_q.predict(X_scaled)[0]
        return float(np.exp(log_q_hat))
