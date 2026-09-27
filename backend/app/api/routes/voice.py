"""
Voice API Routes — ElevenLabs AI Voice Briefing endpoints.

These endpoints sit ON TOP of the existing RELOCATE AI decision pipeline.
They do NOT modify risk scores, relocation decisions, or any engine logic.

Flow:
    Frontend → POST /api/voice/risk-briefing → Backend retrieves data from DB
    → Briefing Generator creates text → ElevenLabs converts to speech → audio/mpeg response

The frontend sends only identifiers. The backend retrieves authoritative data itself.
"""
import json
import logging

from flask import Blueprint, Response, jsonify, request

from app.db.database import get_session_factory
from app.db.repository import Repository
from app.services.briefing_generator import (
    generate_action_plan_briefing,
    generate_risk_briefing,
    generate_dashboard_briefing,
    generate_notifications_briefing,
)
from app.services.voice_service import is_available, synthesize_speech

logger = logging.getLogger(__name__)

voice_bp = Blueprint("voice", __name__)


@voice_bp.route("/status", methods=["GET"])
def voice_status():
    """Check if the voice briefing service is available."""
    return jsonify({
        "available": is_available(),
        "message": "Voice briefing service is operational." if is_available()
                   else "Voice briefing service is not configured. Set ELEVENLABS_API_KEY.",
    })


@voice_bp.route("/risk-briefing", methods=["POST"])
def risk_briefing():
    """
    Generate a voice briefing for a specific habitation's risk assessment.

    Request body:
        { "habitation_id": "HAB001" }

    Response:
        audio/mpeg binary stream on success
        JSON error on failure
    """
    # Parse request
    data = request.get_json(silent=True)
    if not data or not data.get("habitation_id"):
        return jsonify({"error": "Missing required field: habitation_id"}), 400

    hab_id = str(data["habitation_id"]).strip()
    if not hab_id:
        return jsonify({"error": "habitation_id cannot be empty"}), 400

    # Retrieve authoritative data from the database
    Session = get_session_factory()
    session = Session()
    try:
        hab = Repository.get_habitation(session, hab_id)
        if not hab:
            return jsonify({"error": f"Habitation '{hab_id}' not found"}), 404

        # Build the complete habitation data dict from canonical DB
        hab_data = Repository.habitation_to_dict(hab)

        # Add risk assessment
        if hab.risk_assessment:
            ra = hab.risk_assessment
            hab_data["risk_assessment"] = {
                "hazard_score": ra.hazard_score,
                "exposure_score": ra.exposure_score,
                "vulnerability_score": ra.vulnerability_score,
                "rpi": ra.rpi,
                "risk_category": ra.risk_category,
            }

        # Add necessity
        if hab.necessity:
            nec = hab.necessity
            hab_data["necessity"] = {
                "category": nec.category,
                "risk_score": nec.risk_score,
                "action_timeline": nec.action_timeline,
                "reasons": json.loads(nec.reasons) if nec.reasons else [],
            }

        # Add assignments
        hab_data["assignments"] = [
            {
                "site_id": a.site_id,
                "site_name": a.site.name if a.site else "UNASSIGNED",
                "population": a.population,
                "necessity_category": a.necessity_category,
                "status": a.status,
            }
            for a in hab.assignments
        ]

    finally:
        session.close()

    # Generate the briefing text from authoritative system data
    try:
        briefing_text = generate_risk_briefing(hab_data)
    except Exception as e:
        logger.exception("Failed to generate risk briefing text for %s", hab_id)
        return jsonify({"error": "Failed to generate briefing text."}), 500

    if not briefing_text or not briefing_text.strip():
        return jsonify({"error": "No briefing could be generated — insufficient data."}), 422

    # Convert text to speech via ElevenLabs
    audio_bytes, error_msg = synthesize_speech(
        text=briefing_text,
        briefing_type="risk",
        entity_id=hab_id,
    )

    if error_msg:
        return jsonify({
            "error": error_msg,
            "briefing_text": briefing_text,  # Fallback: return text even if audio fails
        }), 503

    # Return audio stream
    return Response(
        audio_bytes,
        mimetype="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="risk_briefing_{hab_id}.mp3"',
            "Cache-Control": "no-store",
        },
    )


@voice_bp.route("/risk-briefing/text", methods=["POST"])
def risk_briefing_text():
    """
    Generate the briefing text only (no audio) — useful for debugging
    or when ElevenLabs is not configured.

    Request body:
        { "habitation_id": "HAB001" }
    """
    data = request.get_json(silent=True)
    if not data or not data.get("habitation_id"):
        return jsonify({"error": "Missing required field: habitation_id"}), 400

    hab_id = str(data["habitation_id"]).strip()

    Session = get_session_factory()
    session = Session()
    try:
        hab = Repository.get_habitation(session, hab_id)
        if not hab:
            return jsonify({"error": f"Habitation '{hab_id}' not found"}), 404

        hab_data = Repository.habitation_to_dict(hab)
        if hab.risk_assessment:
            ra = hab.risk_assessment
            hab_data["risk_assessment"] = {
                "hazard_score": ra.hazard_score,
                "exposure_score": ra.exposure_score,
                "vulnerability_score": ra.vulnerability_score,
                "rpi": ra.rpi,
                "risk_category": ra.risk_category,
            }
        if hab.necessity:
            nec = hab.necessity
            hab_data["necessity"] = {
                "category": nec.category,
                "risk_score": nec.risk_score,
                "action_timeline": nec.action_timeline,
                "reasons": json.loads(nec.reasons) if nec.reasons else [],
            }
        hab_data["assignments"] = [
            {
                "site_id": a.site_id,
                "site_name": a.site.name if a.site else "UNASSIGNED",
                "population": a.population,
                "status": a.status,
            }
            for a in hab.assignments
        ]
    finally:
        session.close()

    briefing_text = generate_risk_briefing(hab_data)
    return jsonify({
        "briefing_text": briefing_text,
        "habitation_id": hab_id,
        "voice_available": is_available(),
    })


@voice_bp.route("/action-plan-briefing", methods=["POST"])
def action_plan_briefing():
    """
    Generate a voice briefing for the current Government Action Plan.

    No request body required — the backend retrieves all current data.

    Response:
        audio/mpeg binary stream on success
        JSON error on failure
    """
    # Retrieve authoritative action plan data from the database
    # (mirrors the dashboard.get_action_plan logic exactly)
    Session = get_session_factory()
    session = Session()
    try:
        habitations = Repository.get_all_habitations(session)
        assignments = Repository.get_all_assignments(session)

        total_habitations = len(habitations)
        total_population = sum(h.population for h in habitations)

        red_zones = 0
        affected_population = 0
        risk_distribution = {}
        necessity_distribution = {}

        for h in habitations:
            if h.risk_assessment:
                rc = h.risk_assessment.risk_category
                risk_distribution[rc] = risk_distribution.get(rc, 0) + 1
            if h.necessity:
                nc = h.necessity.category
                necessity_distribution[nc] = necessity_distribution.get(nc, 0) + 1
                if nc in ["Immediate", "Short-Term"]:
                    red_zones += 1
                    affected_population += h.population

        assignment_by_hab = {a.habitation_id: a for a in assignments}
        assigned_hab_ids = {a.habitation_id for a in assignments if a.site_id is not None}
        unassigned_at_risk = [
            h for h in habitations
            if h.id not in assigned_hab_ids
            and h.necessity
            and h.necessity.category in ["Immediate", "Short-Term", "Medium-Term"]
        ]
        capacity_deficit = sum(h.population for h in unassigned_at_risk)

        priority_table = []
        for hab in habitations:
            rpi = hab.risk_assessment.rpi if hab.risk_assessment else 0.0
            a = assignment_by_hab.get(hab.id)
            nec_cat = hab.necessity.category if hab.necessity else "Monitor"

            assigned_site_name = "UNASSIGNED"
            capacity_status = "Deficit"
            if a and a.site:
                assigned_site_name = a.site.name
                capacity_status = "Safe"
            elif nec_cat in ["In-Situ", "Monitor"]:
                capacity_status = "In-Situ Fortification" if nec_cat == "In-Situ" else "Monitoring"

            priority_table.append({
                "habitation_name": hab.name,
                "risk_score": round(rpi, 2),
                "population": hab.population,
                "action_category": nec_cat,
                "assigned_site": assigned_site_name,
                "capacity_status": capacity_status,
            })

        priority_table.sort(key=lambda x: x["risk_score"], reverse=True)

        action_plan_data = {
            "stats": {
                "total_habitations": total_habitations,
                "total_population": total_population,
                "red_zones": red_zones,
                "affected_population": affected_population,
                "capacity_deficit": capacity_deficit,
                "assigned_count": len(assigned_hab_ids),
                "unassigned_count": len(unassigned_at_risk),
                "risk_distribution": risk_distribution,
                "necessity_distribution": necessity_distribution,
            },
            "priority_table": priority_table,
        }

    finally:
        session.close()

    # Generate the briefing text
    try:
        briefing_text = generate_action_plan_briefing(action_plan_data)
    except Exception as e:
        logger.exception("Failed to generate action plan briefing text")
        return jsonify({"error": "Failed to generate briefing text."}), 500

    if not briefing_text or not briefing_text.strip():
        return jsonify({"error": "No briefing could be generated — insufficient data."}), 422

    # Convert text to speech
    audio_bytes, error_msg = synthesize_speech(
        text=briefing_text,
        briefing_type="action-plan",
        entity_id="current",
    )

    if error_msg:
        return jsonify({
            "error": error_msg,
            "briefing_text": briefing_text,
        }), 503

    return Response(
        audio_bytes,
        mimetype="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="action_plan_briefing.mp3"',
            "Cache-Control": "no-store",
        },
    )


@voice_bp.route("/action-plan-briefing/text", methods=["POST"])
def action_plan_briefing_text():
    """
    Generate the action plan briefing text only (no audio).
    """
    Session = get_session_factory()
    session = Session()
    try:
        habitations = Repository.get_all_habitations(session)
        assignments = Repository.get_all_assignments(session)

        total_habitations = len(habitations)
        total_population = sum(h.population for h in habitations)

        red_zones = 0
        affected_population = 0
        necessity_distribution = {}

        for h in habitations:
            if h.necessity:
                nc = h.necessity.category
                necessity_distribution[nc] = necessity_distribution.get(nc, 0) + 1
                if nc in ["Immediate", "Short-Term"]:
                    red_zones += 1
                    affected_population += h.population

        assigned_hab_ids = {a.habitation_id for a in assignments if a.site_id is not None}
        unassigned_at_risk = [
            h for h in habitations
            if h.id not in assigned_hab_ids
            and h.necessity
            and h.necessity.category in ["Immediate", "Short-Term", "Medium-Term"]
        ]
        capacity_deficit = sum(h.population for h in unassigned_at_risk)

        priority_table = []
        assignment_by_hab = {a.habitation_id: a for a in assignments}
        for hab in habitations:
            rpi = hab.risk_assessment.rpi if hab.risk_assessment else 0.0
            a = assignment_by_hab.get(hab.id)
            nec_cat = hab.necessity.category if hab.necessity else "Monitor"
            assigned_site_name = "UNASSIGNED"
            capacity_status = "Deficit"
            if a and a.site:
                assigned_site_name = a.site.name
                capacity_status = "Safe"
            elif nec_cat in ["In-Situ", "Monitor"]:
                capacity_status = "In-Situ Fortification" if nec_cat == "In-Situ" else "Monitoring"
            priority_table.append({
                "habitation_name": hab.name,
                "risk_score": round(rpi, 2),
                "population": hab.population,
                "action_category": nec_cat,
                "assigned_site": assigned_site_name,
                "capacity_status": capacity_status,
            })
        priority_table.sort(key=lambda x: x["risk_score"], reverse=True)

        action_plan_data = {
            "stats": {
                "total_habitations": total_habitations,
                "total_population": total_population,
                "red_zones": red_zones,
                "affected_population": affected_population,
                "capacity_deficit": capacity_deficit,
                "assigned_count": len(assigned_hab_ids),
                "unassigned_count": len(unassigned_at_risk),
                "necessity_distribution": necessity_distribution,
            },
            "priority_table": priority_table,
        }
    finally:
        session.close()

    briefing_text = generate_action_plan_briefing(action_plan_data)
    return jsonify({
        "briefing_text": briefing_text,
        "voice_available": is_available(),
    })


@voice_bp.route("/dashboard-briefing", methods=["POST"])
def dashboard_briefing():
    """Generate a voice briefing for the Command Center Dashboard."""
    Session = get_session_factory()
    session = Session()
    try:
        habitations = Repository.get_all_habitations(session)
        assignments = Repository.get_all_assignments(session)
        total_habitations = len(habitations)
        total_population = sum(h.population for h in habitations)
        red_zones = 0
        affected_population = 0
        for h in habitations:
            if h.necessity:
                nc = h.necessity.category
                if nc in ["Immediate", "Short-Term"]:
                    red_zones += 1
                    affected_population += h.population

        assigned_hab_ids = {a.habitation_id for a in assignments if a.site_id is not None}
        unassigned_at_risk = [
            h for h in habitations
            if h.id not in assigned_hab_ids
            and h.necessity
            and h.necessity.category in ["Immediate", "Short-Term", "Medium-Term"]
        ]
        priority_table = []
        for hab in habitations:
            rpi = hab.risk_assessment.rpi if hab.risk_assessment else 0.0
            priority_table.append({
                "habitation_name": hab.name,
                "risk_score": round(rpi, 2),
            })
        priority_table.sort(key=lambda x: x["risk_score"], reverse=True)

        dashboard_data = {
            "stats": {
                "total_habitations": total_habitations,
                "total_population": total_population,
                "red_zones": red_zones,
                "affected_population": affected_population,
                "assigned_count": len(assigned_hab_ids),
                "unassigned_count": len(unassigned_at_risk),
            },
            "priority_table": priority_table,
        }
    finally:
        session.close()

    try:
        briefing_text = generate_dashboard_briefing(dashboard_data)
    except Exception as e:
        logger.exception("Failed to generate dashboard briefing text")
        return jsonify({"error": "Failed to generate briefing text."}), 500

    if not briefing_text or not briefing_text.strip():
        return jsonify({"error": "No briefing could be generated — insufficient data."}), 422

    audio_bytes, error_msg = synthesize_speech(
        text=briefing_text,
        briefing_type="dashboard",
        entity_id="current",
    )

    if error_msg:
        return jsonify({"error": error_msg, "briefing_text": briefing_text}), 503

    return Response(
        audio_bytes,
        mimetype="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="dashboard_briefing.mp3"',
            "Cache-Control": "no-store",
        },
    )


@voice_bp.route("/notifications-briefing", methods=["POST"])
def notifications_briefing():
    """Generate a voice briefing for the active Incident Ledger / Notifications."""
    Session = get_session_factory()
    session = Session()
    try:
        all_alerts = Repository.get_alerts(session)
        summary = {
            "total": len(all_alerts),
            "critical": len([a for a in all_alerts if (a.severity or "").upper() == "CRITICAL"]),
            "high": len([a for a in all_alerts if (a.severity or "").upper() == "HIGH"]),
            "warning": len([a for a in all_alerts if (a.severity or "").upper() == "WARNING"]),
            "info": len([a for a in all_alerts if (a.severity or "").upper() == "INFO"]),
            "unacknowledged": len([a for a in all_alerts if not a.is_acknowledged and not a.is_resolved]),
            "resolved": len([a for a in all_alerts if a.is_resolved]),
        }
        alerts_data = [Repository.alert_to_dict(a) for a in all_alerts]
        alert_data = {
            "summary": summary,
            "alerts": alerts_data
        }
    finally:
        session.close()

    try:
        briefing_text = generate_notifications_briefing(alert_data)
    except Exception as e:
        logger.exception("Failed to generate notifications briefing text")
        return jsonify({"error": "Failed to generate briefing text."}), 500

    if not briefing_text or not briefing_text.strip():
        return jsonify({"error": "No briefing could be generated — insufficient data."}), 422

    audio_bytes, error_msg = synthesize_speech(
        text=briefing_text,
        briefing_type="notifications",
        entity_id="current",
    )

    if error_msg:
        return jsonify({"error": error_msg, "briefing_text": briefing_text}), 503

    return Response(
        audio_bytes,
        mimetype="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="notifications_briefing.mp3"',
            "Cache-Control": "no-store",
        },
    )
