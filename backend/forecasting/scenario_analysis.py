import numpy as np

def run_scenario_analysis(
    baseline_weekly_rx: list,
    market_access_change: float = 0.0,
    launch_support_change: float = 0.0,
    competitive_pressure: float = 0.0,
    competitor_entry_week: int = 26,
    mitigation_strength: float = 0.0,
    preset_name: str = "Custom"
) -> dict:
    """
    Computes what-if scenario trajectory on top of baseline 52-week hybrid curve.
    
    Parameters:
    - baseline_weekly_rx: 52-element list of float values for baseline weekly Rx.
    - market_access_change: float (-0.50 to +0.50), overall market expansion/contraction.
    - launch_support_change: float (-0.50 to +0.50), trial/adoption trajectory boost/decay.
    - competitive_pressure: float (0.0 to 0.60), loss rate after competitor entry week.
    - competitor_entry_week: int (1 to 52), week index when competitor enters market.
    - mitigation_strength: float (0.0 to 1.0), fraction of competitive loss offset by commercial defense.
    """
    baseline_array = np.array(baseline_weekly_rx, dtype=float)
    num_weeks = len(baseline_array)
    
    # 1. Calculate overall market access factor
    access_factor = 1.0 + market_access_change
    
    # 2. Calculate promotion/launch support factor (stronger impact early, persistent overall)
    weeks_vector = np.arange(1, num_weeks + 1)
    promo_decay = np.exp(-0.03 * (weeks_vector - 1))  # Highest impact in early launch
    promo_factor = 1.0 + (launch_support_change * promo_decay)
    
    # Combined market uplift curve before competitive entry
    adjusted_curve = baseline_array * access_factor * promo_factor
    
    # 3. Calculate effective competitive impact rate post-entry
    effective_comp_loss = competitive_pressure * (1.0 - mitigation_strength)
    
    # Apply competitive decay starting at competitor_entry_week (1-indexed)
    scenario_array = np.zeros_like(adjusted_curve)
    for w_idx in range(num_weeks):
        w = w_idx + 1
        val = adjusted_curve[w_idx]
        if w >= competitor_entry_week:
            # Gradual ramp-up of competitive erosion over 8 weeks following entry
            weeks_since_entry = w - competitor_entry_week + 1
            ramp_factor = min(1.0, weeks_since_entry / 8.0)
            comp_reduction = 1.0 - (effective_comp_loss * ramp_factor)
            val *= comp_reduction
        scenario_array[w_idx] = max(0.0, val)

    # 4. Compute Totals & Key Indicators
    baseline_total = float(np.sum(baseline_array))
    scenario_total = float(np.sum(scenario_array))
    impact_pct = ((scenario_total - baseline_total) / baseline_total * 100.0) if baseline_total > 0 else 0.0
    
    peak_val = float(np.max(scenario_array))
    peak_w = int(np.argmax(scenario_array)) + 1

    # 5. Build 52-Week Comparison Point List
    weekly_comparison = []
    for i in range(num_weeks):
        w = i + 1
        base_rx = float(baseline_array[i])
        scen_rx = float(scenario_array[i])
        diff_rx = scen_rx - base_rx
        is_entry = (w == competitor_entry_week)
        weekly_comparison.append({
            "week": w,
            "baseline_rx": round(base_rx, 2),
            "scenario_rx": round(scen_rx, 2),
            "difference_rx": round(diff_rx, 2),
            "is_competitor_entry": is_entry
        })

    # 6. Generate Plain-Language Scenario Explanations
    explanation = _build_scenario_explanation(
        market_access_change,
        launch_support_change,
        competitive_pressure,
        competitor_entry_week,
        mitigation_strength,
        baseline_total,
        scenario_total,
        impact_pct
    )

    return {
        "preset_name": preset_name,
        "baseline_52w_rx": round(baseline_total, 0),
        "scenario_52w_rx": round(scenario_total, 0),
        "scenario_impact_pct": round(impact_pct, 1),
        "peak_weekly_rx": round(peak_val, 0),
        "peak_week": peak_w,
        "competitor_entry_week": competitor_entry_week,
        "weekly_comparison": weekly_comparison,
        "explanation": explanation
    }

def _build_scenario_explanation(
    market_access: float,
    launch_support: float,
    comp_pressure: float,
    comp_week: int,
    mitigation: float,
    base_total: float,
    scen_total: float,
    impact_pct: float
) -> dict:
    assumptions_changed = []
    individual_effects = []
    
    if abs(market_access) > 0.001:
        dir_text = "expanded" if market_access > 0 else "restricted"
        assumptions_changed.append(f"Market Access shifted by {market_access*100:+.0f}% ({dir_text} formulary reimbursement).")
        individual_effects.append(f"Market Access adjustment ({market_access*100:+.0f}%) directly scales overall addressable market volume across all 52 weeks.")
    else:
        assumptions_changed.append("Market Access kept at baseline (0% change).")

    if abs(launch_support) > 0.001:
        dir_text = "increased" if launch_support > 0 else "reduced"
        assumptions_changed.append(f"Launch Support / Promotion shifted by {launch_support*100:+.0f}% ({dir_text} field force & marketing spend).")
        individual_effects.append(f"Launch Support change ({launch_support*100:+.0f}%) accelerates early physician trial and trial adoption velocity in weeks 1-26.")
    else:
        assumptions_changed.append("Launch Support kept at baseline (0% change).")

    if comp_pressure > 0.001:
        eff_loss = comp_pressure * (1.0 - mitigation) * 100.0
        assumptions_changed.append(f"Competitor Entry modeled at Week {comp_week} with {comp_pressure*100:.0f}% market pressure.")
        if mitigation > 0.001:
            assumptions_changed.append(f"Mitigation Defense applied at {mitigation*100:.0f}%, reducing competitive loss from {comp_pressure*100:.0f}% to {eff_loss:.1f}%.")
            individual_effects.append(f"Competitor entry at Week {comp_week} introduces a post-entry market share erosion of {eff_loss:.1f}% per week (partially offset by {mitigation*100:.0f}% commercial defense).")
        else:
            individual_effects.append(f"Competitor entry at Week {comp_week} causes an unmitigated {comp_pressure*100:.0f}% erosion in weekly volume from Week {comp_week} onward.")
    else:
        assumptions_changed.append("No active competitive entry pressure modeled.")

    diff_val = scen_total - base_total
    if impact_pct > 0.1:
        directional_impact = f"The scenario forecast is UPSIDE (+) by {impact_pct:+.1f}%, adding +{diff_val:,.0f} prescriptions over 52 weeks compared to the baseline forecast."
    elif impact_pct < -0.1:
        directional_impact = f"The scenario forecast is DOWNSIDE (-) by {impact_pct:.1f}%, resulting in a net reduction of {abs(diff_val):,.0f} prescriptions over 52 weeks compared to the baseline forecast."
    else:
        directional_impact = "The scenario forecast matches the baseline forecast with neutral impact (0.0% change)."

    overall_impact = (
        f"Baseline 52-week volume of {base_total:,.0f} Rx shifts to {scen_total:,.0f} Rx under this scenario. "
        f"The net change represents a {impact_pct:+.1f}% shift ({diff_val:+,.0f} Rx total)."
    )

    return {
        "assumptions_changed": assumptions_changed,
        "individual_effects": individual_effects,
        "directional_impact": directional_impact,
        "overall_impact": overall_impact
    }
