"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import VoiceBriefingPlayer from '@/components/voice/VoiceBriefingPlayer';

export interface AlertRecord {
  id: string;
  type: string;
  severity: "CRITICAL" | "HIGH" | "WARNING" | "INFO";
  title: string;
  description: string;
  habitation_id: string | null;
  habitation_name: string | null;
  site_id: string | null;
  site_name: string | null;
  source_event: string;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  rpi?: number | null;
  rule_id?: string;
  rule_name?: string;
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  warning: number;
  info: number;
  unacknowledged: number;
  resolved: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: string;
  category: string;
}

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; badge: string; icon: string; ring: string }> = {
  CRITICAL: {
    bg: "bg-cmd-critical/10/70",
    border: "border-red-300",
    text: "text-red-800",
    badge: "bg-red-600 text-white shadow-sm shadow-red-200",
    icon: "🚨",
    ring: "focus:ring-red-500",
  },
  HIGH: {
    bg: "bg-orange-50/70",
    border: "border-orange-300",
    text: "text-orange-800",
    badge: "bg-orange-500 text-white shadow-sm shadow-orange-200",
    icon: "⚠️",
    ring: "focus:ring-orange-500",
  },
  WARNING: {
    bg: "bg-cmd-warning/10/70",
    border: "border-amber-300",
    text: "text-amber-800",
    badge: "bg-amber-500 text-white shadow-sm shadow-amber-200",
    icon: "⚡",
    ring: "focus:ring-amber-500",
  },
  INFO: {
    bg: "bg-cmd-info/10/70",
    border: "border-cmd-info/50",
    text: "text-blue-800",
    badge: "bg-blue-600 text-white shadow-sm shadow-blue-200",
    icon: "ℹ️",
    ring: "focus:ring-blue-500",
  },
};

export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"alerts" | "rules">("alerts");

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterSeverity !== "ALL") params.append("severity", filterSeverity);
      if (filterStatus !== "ALL") params.append("status", filterStatus);

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await apiClient.get(`/alerts${queryStr}`);
      setAlerts(data.alerts || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Failed to load alerts:", err);
      setError("Unable to connect to alert engine database. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus]);

  const fetchRules = async () => {
    try {
      const data = await apiClient.get("/alerts/rules");
      setRules(data.rules || []);
    } catch (err) {
      console.error("Failed to fetch alert rules:", err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    fetchRules();
  }, [fetchAlerts]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setActionInProgress(alertId);
      const res = await apiClient.patch(`/alerts/${alertId}/acknowledge`);
      if (res?.alert) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, ...res.alert } : a))
        );
        // Refresh summary
        if (summary) {
          setSummary({
            ...summary,
            unacknowledged: Math.max(0, summary.unacknowledged - 1),
          });
        }
      }
    } catch (err) {
      console.error("Acknowledge failed:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setActionInProgress(alertId);
      const res = await apiClient.patch(`/alerts/${alertId}/resolve`);
      if (res?.alert) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, ...res.alert } : a))
        );
        if (summary) {
          setSummary({
            ...summary,
            resolved: summary.resolved + 1,
            unacknowledged: Math.max(0, summary.unacknowledged - 1),
          });
        }
      }
    } catch (err) {
      console.error("Resolve failed:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAcknowledgeAll = async () => {
    try {
      setLoading(true);
      await apiClient.patch("/alerts/acknowledge-all");
      await fetchAlerts();
    } catch (err) {
      console.error("Bulk acknowledge failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts by search query
  const displayedAlerts = alerts.filter((alert) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      alert.title.toLowerCase().includes(query) ||
      alert.description.toLowerCase().includes(query) ||
      alert.type.toLowerCase().includes(query) ||
      (alert.habitation_name && alert.habitation_name.toLowerCase().includes(query)) ||
      (alert.habitation_id && alert.habitation_id.toLowerCase().includes(query)) ||
      (alert.site_name && alert.site_name.toLowerCase().includes(query)) ||
      (alert.site_id && alert.site_id.toLowerCase().includes(query)) ||
      alert.source_event.toLowerCase().includes(query)
    );
  });

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cmd-card p-6 rounded-2xl shadow-sm border border-cmd-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-cmd-text tracking-tight">
              Alert Engine & Incident Command
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border border-cmd-success/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Event Monitor
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Persisted alert feed autonomously triggered by system events, field verification ground-truth reports, optimizer deficits, and environmental simulations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!loading && !error && (
            <VoiceBriefingPlayer
              endpoint="/voice/notifications-briefing"
              requestBody={{}}
              idleLabel="Brief Me"
              icon="🎙"
              tooltip="Generate a concise executive voice briefing of the current system state."
              size="md"
            />
          )}
          {summary && summary.unacknowledged > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-cmd-text-secondary bg-cmd-secondary/50 hover:bg-gray-200 rounded-xl transition border border-cmd-border disabled:opacity-50 whitespace-nowrap"
            >
              ✓ Acknowledge All ({summary.unacknowledged})
            </button>
          )}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <span className="animate-spin">🔄</span>
            ) : (
              <span>↻</span>
            )}
            Refresh Feed
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-cmd-critical/10 border border-red-300 text-red-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Overview Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-cmd-card border border-cmd-border rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-cmd-text-muted uppercase tracking-wider">Total Alerts</div>
            <div className="text-2xl font-black text-cmd-text mt-1">{summary.total}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Persisted in SQLite</div>
          </div>

          <div className="bg-cmd-critical/10/80 border border-cmd-critical/30 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-cmd-critical uppercase tracking-wider flex items-center justify-between">
              <span>Critical</span>
              <span>🚨</span>
            </div>
            <div className="text-2xl font-black text-cmd-critical mt-1">{summary.critical}</div>
            <div className="text-[10px] text-cmd-critical mt-0.5">Immediate intervention</div>
          </div>

          <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider flex items-center justify-between">
              <span>High</span>
              <span>⚠️</span>
            </div>
            <div className="text-2xl font-black text-orange-700 mt-1">{summary.high}</div>
            <div className="text-[10px] text-orange-500 mt-0.5">Blocked roads / Deficits</div>
          </div>

          <div className="bg-cmd-warning/10/80 border border-cmd-warning/30 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-cmd-warning uppercase tracking-wider flex items-center justify-between">
              <span>Warning</span>
              <span>⚡</span>
            </div>
            <div className="text-2xl font-black text-cmd-warning mt-1">{summary.warning}</div>
            <div className="text-[10px] text-cmd-warning mt-0.5">Capacity & Conflicts</div>
          </div>

          <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center justify-between">
              <span>Active Pending</span>
              <span>🔔</span>
            </div>
            <div className="text-2xl font-black text-purple-800 mt-1">{summary.unacknowledged}</div>
            <div className="text-[10px] text-purple-500 mt-0.5">Unacknowledged</div>
          </div>

          <div className="bg-cmd-success/10/80 border border-cmd-success/30 rounded-xl p-4 shadow-sm">
            <div className="text-[11px] font-bold text-cmd-success uppercase tracking-wider flex items-center justify-between">
              <span>Resolved</span>
              <span>✓</span>
            </div>
            <div className="text-2xl font-black text-cmd-success mt-1">{summary.resolved}</div>
            <div className="text-[10px] text-cmd-success mt-0.5">Closed incidents</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-cmd-border pb-2">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "alerts"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-cmd-card text-gray-600 hover:text-cmd-text border border-cmd-border"
          }`}
        >
          <span>Active Incident Ledger</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            activeTab === "alerts" ? "bg-cmd-card/20 text-white" : "bg-cmd-secondary/50 text-cmd-text-secondary"
          }`}>
            {displayedAlerts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "rules"
              ? "bg-gray-900 text-white shadow-sm"
              : "bg-cmd-card text-gray-600 hover:text-cmd-text border border-cmd-border"
          }`}
        >
          <span>Configured Trigger Rules</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            activeTab === "rules" ? "bg-cmd-card/20 text-white" : "bg-cmd-secondary/50 text-cmd-text-secondary"
          }`}>
            {rules.length}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: ALERTS LEDGER ─── */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {/* Controls / Filter Deck */}
          <div className="bg-cmd-card rounded-2xl p-4 shadow-sm border border-cmd-border flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by title, village, site, or trigger type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-cmd-secondary hover:bg-cmd-secondary/50 focus:bg-cmd-card border border-cmd-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Severity Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Severity:</span>
              {["ALL", "CRITICAL", "HIGH", "WARNING", "INFO"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    filterSeverity === sev
                      ? sev === "CRITICAL"
                        ? "bg-red-600 text-white shadow-sm"
                        : sev === "HIGH"
                        ? "bg-orange-500 text-white shadow-sm"
                        : sev === "WARNING"
                        ? "bg-amber-500 text-white shadow-sm"
                        : sev === "INFO"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-900 text-white shadow-sm"
                      : "bg-cmd-secondary/50 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Status:</span>
              {(["ALL", "ACTIVE", "RESOLVED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    filterStatus === st
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-cmd-secondary/50 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st === "ACTIVE" ? "Unacknowledged / Active" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Cards Stream */}
          <div className="space-y-3">
            {displayedAlerts.length === 0 ? (
              <div className="bg-cmd-card rounded-2xl border border-cmd-border p-12 text-center text-cmd-text-muted">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="text-base font-bold text-gray-800">No matching system alerts</h3>
                <p className="text-xs text-cmd-text-muted mt-1 max-w-md mx-auto">
                  No active incidents match current criteria. System event triggers continuously monitor field updates, optimizer capacity, and simulation stress tests.
                </p>
              </div>
            ) : (
              displayedAlerts.map((alert) => {
                const conf = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
                return (
                  <div
                    key={alert.id}
                    className={`bg-cmd-card rounded-2xl border ${
                      alert.is_resolved
                        ? "border-cmd-border opacity-60 hover:opacity-100"
                        : conf.border
                    } p-5 shadow-sm transition hover:shadow-md relative overflow-hidden flex flex-col md:flex-row gap-4 justify-between items-start`}
                  >
                    {/* Left Severity Accent Bar */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        alert.is_resolved ? "bg-gray-300" : conf.badge
                      }`}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 pl-2">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Severity Badge */}
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${conf.badge} flex items-center gap-1`}>
                          <span>{conf.icon}</span>
                          <span>{alert.severity}</span>
                        </span>

                        {/* Alert Type */}
                        <span className="text-[10px] font-mono font-bold bg-cmd-secondary/50 text-gray-800 px-2 py-0.5 rounded-md border border-cmd-border">
                          {alert.type}
                        </span>

                        {/* Source Event Badge */}
                        <span className="text-[10px] font-bold bg-cmd-info/10 text-cmd-info px-2 py-0.5 rounded-md border border-cmd-info/30 flex items-center gap-1">
                          <span>⚡</span>
                          <span>{alert.source_event}</span>
                        </span>

                        {/* Lifecycle Status Tags */}
                        {alert.is_resolved ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                            <span>✓</span> Resolved ({formatTimestamp(alert.resolved_at)})
                          </span>
                        ) : alert.is_acknowledged ? (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md border border-cmd-info/50 flex items-center gap-1">
                            <span>✓</span> Acknowledged ({formatTimestamp(alert.acknowledged_at)})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1 animate-pulse">
                            <span>●</span> Pending Action
                          </span>
                        )}

                        {/* Alert ID & Created Date */}
                        <span className="text-[11px] text-gray-400 font-mono ml-auto">
                          {alert.id} • {formatTimestamp(alert.created_at)}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-bold text-cmd-text tracking-tight flex items-center gap-2">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-cmd-text-secondary mt-1 leading-relaxed">
                        {alert.description}
                      </p>

                      {/* Habitation & Site Reference Metadata Pills */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                        {alert.habitation_id && (
                          <Link
                            href={`/field-verification?hab_id=${alert.habitation_id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-cmd-info bg-cmd-info/10 hover:bg-blue-100 px-3 py-1 rounded-lg border border-cmd-info/30 transition"
                          >
                            <span>📍 Habitation:</span>
                            <span>{alert.habitation_name || alert.habitation_id}</span>
                            <span className="text-[10px] text-blue-500 font-mono">({alert.habitation_id})</span>
                            <span className="text-blue-400 ml-1">↗</span>
                          </Link>
                        )}

                        {alert.site_id && (
                          <Link
                            href={`/capacity?site_id=${alert.site_id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-cmd-success bg-cmd-success/10 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-cmd-success/30 transition"
                          >
                            <span>🏢 Relocation Site:</span>
                            <span>{alert.site_name || alert.site_id}</span>
                            <span className="text-[10px] text-emerald-500 font-mono">({alert.site_id})</span>
                            <span className="text-emerald-400 ml-1">↗</span>
                          </Link>
                        )}

                        {alert.rpi !== undefined && alert.rpi !== null && (
                          <span className="text-xs text-cmd-text-muted font-mono">
                            RPI Score: <strong className="text-gray-800">{alert.rpi.toFixed(1)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 self-stretch md:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {/* Deep Link to Associated Habitation / Site */}
                      {alert.habitation_id ? (
                        <Link
                          href={`/field-verification?hab_id=${alert.habitation_id}`}
                          className="px-3.5 py-1.5 text-xs font-bold text-cmd-text-secondary bg-cmd-secondary hover:bg-cmd-secondary/50 rounded-xl border border-cmd-border transition flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>Open Habitation</span>
                          <span className="text-gray-400">→</span>
                        </Link>
                      ) : alert.site_id ? (
                        <Link
                          href={`/capacity?site_id=${alert.site_id}`}
                          className="px-3.5 py-1.5 text-xs font-bold text-cmd-text-secondary bg-cmd-secondary hover:bg-cmd-secondary/50 rounded-xl border border-cmd-border transition flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <span>Open Safe Site</span>
                          <span className="text-gray-400">→</span>
                        </Link>
                      ) : null}

                      {/* Acknowledge Button */}
                      {!alert.is_acknowledged && !alert.is_resolved && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={actionInProgress === alert.id}
                          className="px-3.5 py-1.5 text-xs font-bold text-cmd-info bg-cmd-info/10 hover:bg-blue-100 rounded-xl border border-cmd-info/30 transition disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionInProgress === alert.id ? "Saving..." : "✓ Acknowledge"}
                        </button>
                      )}

                      {/* Resolve Button */}
                      {!alert.is_resolved && (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          disabled={actionInProgress === alert.id}
                          className="px-3.5 py-1.5 text-xs font-bold text-cmd-success bg-cmd-success/10 hover:bg-emerald-100 rounded-xl border border-cmd-success/30 transition disabled:opacity-50 whitespace-nowrap"
                        >
                          {actionInProgress === alert.id ? "Saving..." : "✓ Resolve Incident"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: RULES SPECIFICATION ─── */}
      {activeTab === "rules" && (
        <div className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-border overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-bold text-cmd-text">Configured Autonomous Event Triggers</h2>
            <p className="text-xs text-cmd-text-muted mt-0.5">
              These trigger specifications continuously listen to database mutations, ground verifications, capacity thresholds, and environmental stress simulations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cmd-secondary text-cmd-text-muted font-bold uppercase border-b border-cmd-border text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rule Code</th>
                  <th className="py-3 px-4">Trigger Name</th>
                  <th className="py-3 px-4">Event Criterion & Threshold</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4 text-center">Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {rules.map((rule) => {
                  const conf = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.INFO;
                  return (
                    <tr key={rule.id} className="hover:bg-cmd-secondary transition">
                      <td className="py-3.5 px-4 font-mono text-cmd-text-muted">{rule.id}</td>
                      <td className="py-3.5 px-4 font-bold text-cmd-text">{rule.name}</td>
                      <td className="py-3.5 px-4 text-gray-600">{rule.description}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${conf.badge}`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold uppercase bg-cmd-secondary/50 text-cmd-text-secondary px-2 py-0.5 rounded-md">
                          {rule.category}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
