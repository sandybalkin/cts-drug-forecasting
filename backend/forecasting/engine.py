import os
import pandas as pd
import numpy as np

from .bass import BassModelTrainer, bass_weekly_curve, P_FEATURES, Q_FEATURES
from .gower_similarity import get_top_analogs, FEATURES, CATEGORICAL_FEATURES
from .analog import compute_analog_curve
from .hybrid import compute_hybrid_curve, weekly_to_monthly

class ForecastingEngine:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.bass_df = None
        self.similarity_df = None
        self.weekly_df = None
        self.trainer = None
        self.is_initialized = False

    def initialize(self):
        bass_path = os.path.join(self.data_dir, "bass_final.csv")
        sim_path = os.path.join(self.data_dir, "similarity+analog_features_final.csv")
        weekly_path = os.path.join(self.data_dir, "weekly_rx_final.csv")

        self.bass_df = pd.read_csv(bass_path)
        self.similarity_df = pd.read_csv(sim_path)
        self.weekly_df = pd.read_csv(weekly_path)

        self.trainer = BassModelTrainer()
        self.trainer.fit(self.bass_df, self.weekly_df)
        self.is_initialized = True

    def run(self, new_drug: dict, top_k: int = 3, w_analog: float = 0.10) -> dict:
        if not self.is_initialized:
            self.initialize()

        w_bass = 1.0 - w_analog

        # 1. Calculate m_hat (Market Potential)
        addr_pop = float(new_drug.get("addressable_population", 0))
        est_pen = float(new_drug.get("estimated_penetration", 0))
        m_hat = addr_pop * est_pen

        # 2. Predict p_hat and q_hat
        p_hat = self.trainer.predict_p(new_drug)
        q_hat = self.trainer.predict_q(new_drug)

        # 3. Base Bass curve
        bass_base = bass_weekly_curve(p_hat, q_hat, m_hat)

        # 4. Base Analog curve
        analog_base, analogs_used = compute_analog_curve(
            new_drug, self.similarity_df, self.weekly_df, m_hat, k=top_k
        )

        # 5. Base Hybrid curve
        base_hybrid = compute_hybrid_curve(analog_base, bass_base, w_analog, w_bass)

        # 6. Bull Scenario (p*1.10, q*1.10, m*1.20)
        bull_p = p_hat * 1.10
        bull_q = q_hat * 1.10
        bull_m = m_hat * 1.20
        bass_bull = bass_weekly_curve(bull_p, bull_q, bull_m)
        analog_bull, _ = compute_analog_curve(
            new_drug, self.similarity_df, self.weekly_df, float(bass_bull.sum()), k=top_k
        )
        bull_hybrid = compute_hybrid_curve(analog_bull, bass_bull, w_analog, w_bass)

        # 7. Bear Scenario (p*0.90, q*0.90, m*0.80)
        bear_p = p_hat * 0.90
        bear_q = q_hat * 0.90
        bear_m = m_hat * 0.80
        bass_bear = bass_weekly_curve(bear_p, bear_q, bear_m)
        analog_bear, _ = compute_analog_curve(
            new_drug, self.similarity_df, self.weekly_df, float(bass_bear.sum()), k=top_k
        )
        bear_hybrid = compute_hybrid_curve(analog_bear, bass_bear, w_analog, w_bass)

        # 8. Assemble Weekly Data
        weeks = list(range(1, 53))
        weekly_data = []
        cum_analog = 0.0
        cum_bass = 0.0
        cum_hybrid = 0.0
        cum_bull = 0.0
        cum_bear = 0.0

        for i in range(52):
            cum_analog += float(analog_base[i])
            cum_bass += float(bass_base[i])
            cum_hybrid += float(base_hybrid[i])
            cum_bull += float(bull_hybrid[i])
            cum_bear += float(bear_hybrid[i])

            weekly_data.append({
                "week": weeks[i],
                "analog_rx": round(float(analog_base[i]), 2),
                "bass_rx": round(float(bass_base[i]), 2),
                "hybrid_rx": round(float(base_hybrid[i]), 2),
                "bull_rx": round(float(bull_hybrid[i]), 2),
                "bear_rx": round(float(bear_hybrid[i]), 2),
                "cumulative_analog_rx": round(cum_analog, 2),
                "cumulative_bass_rx": round(cum_bass, 2),
                "cumulative_hybrid_rx": round(cum_hybrid, 2),
                "cumulative_bull_rx": round(cum_bull, 2),
                "cumulative_bear_rx": round(cum_bear, 2)
            })

        # 9. Assemble Monthly Data
        monthly_base = weekly_to_monthly(base_hybrid)
        monthly_bull = weekly_to_monthly(bull_hybrid)
        monthly_bear = weekly_to_monthly(bear_hybrid)

        monthly_data = []
        c_m_base = 0.0
        c_m_bull = 0.0
        c_m_bear = 0.0
        for m in range(12):
            c_m_base += float(monthly_base[m])
            c_m_bull += float(monthly_bull[m])
            c_m_bear += float(monthly_bear[m])
            monthly_data.append({
                "month": m + 1,
                "hybrid_rx": round(float(monthly_base[m]), 2),
                "bull_rx": round(float(monthly_bull[m]), 2),
                "bear_rx": round(float(monthly_bear[m]), 2),
                "cumulative_hybrid_rx": round(c_m_base, 2),
                "cumulative_bull_rx": round(c_m_bull, 2),
                "cumulative_bear_rx": round(c_m_bear, 2)
            })

        # 10. Enrich Analogs Info with attributes
        analogs_enriched = []
        for pid, weight, similarity in analogs_used:
            match_row = self.similarity_df[self.similarity_df["product_id"] == pid]
            details = {}
            if not match_row.empty:
                r = match_row.iloc[0]
                details = {
                    "therapeutic_area": str(r.get("therapeutic_area", "")),
                    "indication": str(r.get("indication", "")),
                    "active_ingredient": str(r.get("active_ingredient", "")),
                    "pharmacological_class": str(r.get("pharmacological_class", "")),
                    "route_of_administration": str(r.get("route_of_administration", "")),
                    "competition_level": float(r.get("competition_level", 0)),
                    "market_access_level": float(r.get("market_access_level", 0))
                }

            product_weekly = self.weekly_df[self.weekly_df["product_id"] == pid]
            hist_total_rx = float(product_weekly["weekly_rx"].sum()) if not product_weekly.empty else 0.0

            analogs_enriched.append({
                "product_id": pid,
                "weight": round(weight, 4),
                "similarity": round(similarity, 4),
                "similarity_pct": round(similarity * 100, 1),
                "historical_52w_rx": round(hist_total_rx, 0),
                "details": details
            })

        # 11. Human-readable Explanations
        explanations = self._generate_explanations(new_drug, p_hat, q_hat, m_hat, analogs_enriched)

        return {
            "bass_params": {
                "p_hat": round(p_hat, 4),
                "q_hat": round(q_hat, 4),
                "m_hat": round(m_hat, 0),
                "addressable_population": addr_pop,
                "estimated_penetration": est_pen
            },
            "summary_totals": {
                "base_52w_rx": round(float(base_hybrid.sum()), 0),
                "bull_52w_rx": round(float(bull_hybrid.sum()), 0),
                "bear_52w_rx": round(float(bear_hybrid.sum()), 0),
                "bass_only_52w_rx": round(float(bass_base.sum()), 0),
                "analog_only_52w_rx": round(float(analog_base.sum()), 0)
            },
            "assumptions": {
                "top_k": top_k,
                "w_analog": round(w_analog, 2),
                "w_bass": round(w_bass, 2)
            },
            "analogs": analogs_enriched,
            "weekly_forecast": weekly_data,
            "monthly_forecast": monthly_data,
            "explanations": explanations
        }

    def _generate_explanations(self, new_drug: dict, p_hat: float, q_hat: float, m_hat: float, analogs: list) -> dict:
        analog_names = ", ".join([a["product_id"] for a in analogs])
        top_analog = analogs[0] if len(analogs) > 0 else None
        
        why_analogs = f"Top {len(analogs)} analogs ({analog_names}) were selected using Gower similarity across 12 clinical, commercial, and target population attributes."
        if top_analog:
            why_analogs += f" The primary analog is {top_analog['product_id']} with a similarity score of {top_analog['similarity_pct']}%, sharing matching therapeutic area ({top_analog['details'].get('therapeutic_area', '')}) and route of administration ({top_analog['details'].get('route_of_administration', '')})."

        why_bass_p = (
            f"The predicted innovation parameter (p = {p_hat:.4f}) reflects early market adoption velocity. "
            f"It is driven primarily by marketing awareness ({new_drug.get('marketing_awareness', 'N/A')}/10), "
            f"launch strength ({new_drug.get('launch_strength', 'N/A')}/10), and physician awareness ({new_drug.get('physician_awareness', 'N/A')}/10)."
        )

        why_bass_q = (
            f"The predicted imitation parameter (q = {q_hat:.4f}) reflects word-of-mouth and peer adoption acceleration. "
            f"It is driven by clinical evidence strength ({new_drug.get('clinical_evidence_strength', 'N/A')}/10) "
            f"and treatment familiarity ({new_drug.get('treatment_familiarity', 'N/A')}/10)."
        )

        why_m = (
            f"Total market potential (M = {m_hat:,.0f} prescriptions) is calculated directly as "
            f"Addressable Population ({new_drug.get('addressable_population', 0):,}) × Estimated Penetration ({float(new_drug.get('estimated_penetration', 0))*100:.1f}%)."
        )

        return {
            "why_analogs": why_analogs,
            "why_bass_p": why_bass_p,
            "why_bass_q": why_bass_q,
            "why_m": why_m
        }
