"""
Briefing Generator — converts structured RELOCATE AI system data
into concise natural-language text suitable for voice delivery.

This module is the ONLY source of voice briefing text.
It NEVER invents, modifies, or overrides risk scores, relocation
decisions, site recommendations, or capacity values.

It receives authoritative system data and formats it for speech.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def _format_score(value: Any, label: str) -> str:
    """Format a numeric score for speech, handling missing values."""
    if value is None:
        return f"{label} data is not yet available"
    try:
        num = float(value)
        return f"{label} of {num:.1f} out of 100"
    except (ValueError, TypeError):
        return f"{label} data is not yet available"


def _safe_str(value: Any, fallback: str = "not available") -> str:
    """Safely convert a value to string for speech."""
    if value is None or value == "" or value == "UNKNOWN":
        return fallback
    return str(value)


def generate_risk_briefing(habitation_data: Dict[str, Any]) -> str:
    """
    Generate a concise voice briefing for a single habitation's risk profile.

    Expected keys in habitation_data:
        - name: str
        - id: str
        - population: int
        - risk_assessment: dict with hazard_score, exposure_score,
          vulnerability_score, rpi, risk_category
        - necessity: dict with category, action_timeline, reasons
        - assignments: list of dicts with site_name, status
        - verification_status: str

    Target duration: 20-40 seconds (~60-120 words).
    """
    parts: List[str] = []

    name = _safe_str(habitation_data.get("name"), "the selected habitation")
    hab_id = _safe_str(habitation_data.get("id"), "unknown")

    # Opening — habitation identification
    parts.append(f"Voice briefing for {name}.")

    # Risk assessment section
    risk = habitation_data.get("risk_assessment")
    if risk and isinstance(risk, dict):
        rpi = risk.get("rpi")
        category = risk.get("risk_category")

        if rpi is not None:
            parts.append(
                f"The current risk priority score is {float(rpi):.1f},"
                f" classified as {_safe_str(category, 'unclassified')}."
            )
        else:
            parts.append("Risk priority score has not been calculated yet.")

        # Component scores
        scores: List[str] = []
        h_score = risk.get("hazard_score")
        e_score = risk.get("exposure_score")
        v_score = risk.get("vulnerability_score")

        if h_score is not None:
            scores.append(f"hazard at {float(h_score):.1f}")
        if e_score is not None:
            scores.append(f"exposure at {float(e_score):.1f}")
        if v_score is not None:
            scores.append(f"vulnerability at {float(v_score):.1f}")

        if scores:
            parts.append(f"Component scores are: {', '.join(scores)}.")
    else:
        parts.append("No risk assessment data is currently available for this habitation.")

    # Population
    pop = habitation_data.get("population")
    if pop is not None and pop > 0:
        parts.append(f"The affected population is approximately {int(pop):,}.")

    # Necessity / urgency
    necessity = habitation_data.get("necessity")
    if necessity and isinstance(necessity, dict):
        nec_cat = necessity.get("category")
        timeline = necessity.get("action_timeline")
        reasons = necessity.get("reasons", [])

        if nec_cat:
            parts.append(f"Relocation necessity is assessed as {nec_cat}.")
        if timeline:
            parts.append(f"Recommended action timeline: {timeline}.")

        # Include up to 2 key reasons
        if isinstance(reasons, list) and len(reasons) > 0:
            top_reasons = reasons[:2]
            reason_text = " and ".join(str(r) for r in top_reasons)
            parts.append(f"Key factors include {reason_text}.")
    else:
        parts.append("Relocation necessity assessment is not yet available.")

    # Assignment / recommended site
    assignments = habitation_data.get("assignments", [])
    if isinstance(assignments, list) and len(assignments) > 0:
        active = [a for a in assignments if a.get("site_name") and a["site_name"] != "UNASSIGNED"]
        if active:
            site = active[0]
            site_name = site.get("site_name", "an assigned site")
            status = _safe_str(site.get("status"), "pending review")
            parts.append(
                f"The recommended relocation site is {site_name}, currently {status}."
            )
        else:
            parts.append("No relocation site has been assigned yet.")

    # Verification status
    v_status = habitation_data.get("verification_status")
    if v_status and v_status != "VERIFIED":
        parts.append("Field verification is still pending for this assessment.")

    # Confidence disclaimer
    confidence = habitation_data.get("confidence") or habitation_data.get("dataset_type")
    if confidence and "SYNTHETIC" in str(confidence).upper():
        parts.append(
            "Please note this assessment is based on synthetic demonstration data "
            "and does not represent official government information."
        )

    return " ".join(parts)


def generate_action_plan_briefing(action_plan_data: Dict[str, Any]) -> str:
    """
    Generate a concise executive voice briefing from the Government Action Plan.

    Expected keys in action_plan_data:
        - stats: dict with total_habitations, total_population, red_zones,
          affected_population, capacity_deficit, assigned_count, unassigned_count,
          risk_distribution, necessity_distribution
        - priority_table: list of dicts with habitation_name, risk_score,
          action_category, assigned_site, capacity_status

    Target duration: 30-60 seconds (~90-180 words).
    """
    parts: List[str] = []
    stats = action_plan_data.get("stats", {})
    table = action_plan_data.get("priority_table", [])

    parts.append("Executive briefing for the current Government Action Plan.")

    # Total scope
    total_hab = stats.get("total_habitations")
    total_pop = stats.get("total_population")
    if total_hab is not None:
        parts.append(
            f"The system has evaluated {int(total_hab)} habitations"
            f" covering a total population of {int(total_pop or 0):,}."
        )

    # Red zones / critical
    red_zones = stats.get("red_zones", 0)
    affected_pop = stats.get("affected_population", 0)
    if red_zones > 0:
        parts.append(
            f"{int(red_zones)} habitation{'s' if red_zones != 1 else ''} "
            f"{'are' if red_zones != 1 else 'is'} identified as requiring "
            f"immediate or short-term relocation, affecting approximately "
            f"{int(affected_pop):,} people."
        )
    else:
        parts.append("No habitations currently require immediate relocation action.")

    # Highest-priority items from priority table
    if isinstance(table, list) and len(table) > 0:
        # Top 3 highest risk
        top = table[:3]
        top_names = [t.get("habitation_name", "Unknown") for t in top]
        top_score = top[0].get("risk_score", 0)
        parts.append(
            f"The highest-priority habitations are {', '.join(top_names)}, "
            f"with the top risk score at {float(top_score):.1f}."
        )

    # Assignment summary
    assigned = stats.get("assigned_count", 0)
    unassigned = stats.get("unassigned_count", 0)
    if assigned > 0 or unassigned > 0:
        parts.append(
            f"{int(assigned)} habitation{'s have' if assigned != 1 else ' has'} "
            f"been assigned to relocation sites."
        )
        if unassigned > 0:
            parts.append(
                f"{int(unassigned)} at-risk habitation{'s remain' if unassigned != 1 else ' remains'} "
                f"unassigned."
            )

    # Capacity
    deficit = stats.get("capacity_deficit", 0)
    if deficit > 0:
        parts.append(
            f"There is a current capacity deficit affecting approximately "
            f"{int(deficit):,} people. Additional site capacity may be required."
        )
    elif assigned > 0:
        parts.append("Current site capacity appears sufficient for assigned populations.")

    # Recommended sites summary (from table)
    if isinstance(table, list) and len(table) > 0:
        assigned_sites = set()
        for row in table:
            site = row.get("assigned_site", "UNASSIGNED")
            if site != "UNASSIGNED":
                assigned_sites.add(site)
        if assigned_sites:
            parts.append(
                f"Active relocation sites include {', '.join(sorted(assigned_sites))}."
            )

    # Verification / field issues
    needs_verification = 0
    if isinstance(table, list):
        for row in table:
            if row.get("capacity_status") == "Deficit":
                needs_verification += 1
    if needs_verification > 0:
        parts.append(
            f"{needs_verification} habitation{'s require' if needs_verification != 1 else ' requires'} "
            f"further field verification before final action can be taken."
        )

    # Necessity distribution
    nec_dist = stats.get("necessity_distribution", {})
    if isinstance(nec_dist, dict) and len(nec_dist) > 0:
        immediate = nec_dist.get("Immediate", 0)
        short = nec_dist.get("Short-Term", 0)
        medium = nec_dist.get("Medium-Term", 0)
        summary_parts = []
        if immediate > 0:
            summary_parts.append(f"{immediate} immediate")
        if short > 0:
            summary_parts.append(f"{short} short-term")
        if medium > 0:
            summary_parts.append(f"{medium} medium-term")
        if summary_parts:
            parts.append(
                f"Urgency breakdown: {', '.join(summary_parts)} relocation actions."
            )

    # Disclaimer for synthetic data
    parts.append(
        "This briefing is generated from current system data. "
        "All recommendations are subject to field verification and official review."
    )

    return " ".join(parts)


def generate_dashboard_briefing(dashboard_data: Dict[str, Any]) -> str:
    """
    Generate a high-level command center briefing for the dashboard.
    Uses the same underlying data structure as action_plan_data but focuses on high-level KPIs.
    """
    parts: List[str] = []
    stats = dashboard_data.get("stats", {})
    table = dashboard_data.get("priority_table", [])

    parts.append("Command Center Dashboard Briefing.")

    total_hab = stats.get("total_habitations", 0)
    total_pop = stats.get("total_population", 0)
    parts.append(
        f"Monitoring {int(total_hab)} habitations across the region, "
        f"representing a total population of {int(total_pop):,}."
    )

    red_zones = stats.get("red_zones", 0)
    affected_pop = stats.get("affected_population", 0)
    if red_zones > 0:
        parts.append(
            f"Alert: {int(red_zones)} critical red zones identified, "
            f"putting approximately {int(affected_pop):,} people at immediate or short-term risk."
        )
    else:
        parts.append("System status normal. No critical red zones currently identified.")

    if isinstance(table, list) and len(table) > 0:
        top_name = table[0].get("habitation_name", "Unknown")
        top_score = table[0].get("risk_score", 0)
        parts.append(
            f"The highest risk habitation is currently {top_name} with an RPI score of {float(top_score):.1f}."
        )

    assigned = stats.get("assigned_count", 0)
    unassigned = stats.get("unassigned_count", 0)
    if unassigned > 0:
        parts.append(f"{int(unassigned)} critical habitations are pending site assignment.")
    if assigned > 0:
        parts.append(f"{int(assigned)} habitations have been successfully matched to safe relocation sites.")

    parts.append("Please review the Action Plan for detailed dispatch instructions.")
    return " ".join(parts)


def generate_notifications_briefing(alert_data: Dict[str, Any]) -> str:
    """
    Generate an incident report briefing from the notifications feed.
    
    Expected keys:
        - summary: dict with total, critical, high, warning, info, unacknowledged, resolved
        - alerts: list of alert dicts
    """
    parts: List[str] = []
    summary = alert_data.get("summary", {})
    alerts = alert_data.get("alerts", [])

    parts.append("Incident Command Ledger Briefing.")

    unack = summary.get("unacknowledged", 0)
    if unack == 0:
        parts.append("There are currently zero unacknowledged incidents. The system is clear.")
    else:
        parts.append(f"Attention required: There are {int(unack)} unacknowledged incidents pending review.")

    critical = summary.get("critical", 0)
    high = summary.get("high", 0)
    
    if critical > 0:
        parts.append(f"{int(critical)} critical alerts demand immediate intervention.")
    if high > 0:
        parts.append(f"{int(high)} high-priority alerts are active.")
        
    resolved = summary.get("resolved", 0)
    if resolved > 0:
        parts.append(f"A total of {int(resolved)} incidents have been successfully resolved.")

    # Mention the most recent critical/high alert if available
    unresolved_alerts = [a for a in alerts if not a.get("is_resolved") and not a.get("is_acknowledged")]
    if unresolved_alerts:
        top_alert = unresolved_alerts[0]
        title = top_alert.get("title", "Unknown incident")
        severity = top_alert.get("severity", "INFO")
        parts.append(f"The most recent active {severity} alert is: {title}.")

    parts.append("Please acknowledge or resolve active incidents from the notification dashboard.")
    return " ".join(parts)
