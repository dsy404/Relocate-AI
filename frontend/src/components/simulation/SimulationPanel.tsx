'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { CloudLightning, ShieldAlert, ArrowRight, RefreshCw, Activity, Users, AlertTriangle, ArrowRightLeft, ShieldCheck, MapPin } from 'lucide-react';

export interface ScenarioHabitation {
  habitation_id: string;
  habitation_name: string;
  population: number;
  elevation: number;
  slope: number;
  baseline: {
    hazard_score: number;
    rpi: number;
    risk_category: string;
    urgency: string;
    recommended_site: string;
  };
  scenario: {
    hazard_score: number;
    rpi: number;
    risk_category: string;
    urgency: string;
    recommended_site: string;
  };
  difference: {
    hazard_delta: number;
    rpi_delta: number;
    hazard_changed: boolean;
    risk_category_changed: boolean;
    urgency_changed: boolean;
    site_changed: boolean;
    is_impacted: boolean;
  };
}

export interface ScenarioResult {
  mode: string;
  is_simulation: boolean;
  saved_to_db: boolean;
  parameters: {
    baseline_rainfall_mm: number;
    scenario_rainfall_mm: number;
    rainfall_surge_mm: number;
  };
  summary: {
    total_habitations: number;
    baseline_red_zones: number;
    scenario_red_zones: number;
    red_zone_delta: number;
    baseline_affected_population: number;
    scenario_affected_population: number;
    affected_population_delta: number;
    habitations_hazard_changed: number;
    habitations_risk_category_changed: number;
    habitations_urgency_changed: number;
    habitations_site_reassigned: number;
    scenario_total_capacity_deficit: number;
  };
  comparison: ScenarioHabitation[];
}

export default function SimulationPanel() {
  const [baselineRainfall, setBaselineRainfall] = useState<number>(120);
  const [scenarioRainfall, setScenarioRainfall] = useState<number>(210);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'IMPACTED' | 'RED_ZONES' | 'REASSIGNED'>('ALL');
  const [search, setSearch] = useState('');

  const executeSimulation = async (base: number, scen: number) => {
    try {
      setLoading(true);
      const data = await apiClient.post('/simulation/run-scenario', {
        baseline_rainfall_mm: base,
        scenario_rainfall_mm: scen,
      });
      setResult(data);
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setBaselineRainfall(120);
      setScenarioRainfall(120);
      const data = await apiClient.post('/simulation/reset', {});
      setResult(data);
    } catch (err) {
      console.error('Scenario reset failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial simulation on mount
  useEffect(() => {
    executeSimulation(120, 210);
  }, []);

  const rainfallSurge = scenarioRainfall - baselineRainfall;

  const filteredHabitations = (result?.comparison || []).filter(item => {
    const matchesSearch = item.habitation_name.toLowerCase().includes(search.toLowerCase()) ||
                          item.habitation_id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'IMPACTED') return item.difference.is_impacted;
    if (filter === 'RED_ZONES') return item.scenario.risk_category.includes('Red Zone') || item.scenario.urgency === 'Immediate';
    if (filter === 'REASSIGNED') return item.difference.site_changed;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Mandatory Demo Simulation Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cmd-card/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex items-start md:items-center gap-4 relative z-10">
          <div className="bg-cmd-card/20 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-widest uppercase block mb-1">
              Demo Live-Update Simulation
            </span>
            <span className="text-sm text-amber-50 font-medium max-w-2xl block leading-relaxed">
              Sandboxed demonstration model. Simulations run in memory and do NOT permanently alter production database records.
            </span>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 bg-black/20 font-mono text-xs px-4 py-2 rounded-xl border border-white/20 backdrop-blur-sm shadow-inner shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white tracking-widest">DB Safety Lock: ACTIVE</span>
        </div>
      </div>

      {/* Scenario Control Deck */}
      <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cmd-border/50 pb-6">
          <div>
            <h2 className="text-xl font-extrabold text-cmd-text flex items-center gap-2">
              <CloudLightning className="w-5 h-5 text-indigo-600" />
              Environmental Scenario Controls
            </h2>
            <p className="text-sm font-medium text-cmd-text-muted mt-1">Adjust simulated precipitation intensity to observe downstream hazard amplification and optimizer reassignments.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex-1 md:flex-none px-5 py-3 text-xs font-bold text-cmd-text-secondary bg-cmd-secondary/50 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Scenario
            </button>
            <button
              onClick={() => executeSimulation(baselineRainfall, scenarioRainfall)}
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 group"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
              )}
              Run Simulation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Baseline Rainfall */}
          <div className="space-y-4 p-6 bg-cmd-secondary rounded-2xl border border-cmd-border">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-black text-cmd-text-muted uppercase tracking-widest">Baseline Rainfall</label>
              <span className="text-lg font-black font-mono text-cmd-text bg-cmd-card px-3 py-1.5 rounded-lg border border-cmd-border shadow-sm">
                {baselineRainfall} mm/day
              </span>
            </div>
            <p className="text-sm font-medium text-cmd-text-muted">Historical regional average monsoon baseline precipitation.</p>
          </div>

          {/* Scenario Rainfall Slider */}
          <div className="space-y-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex justify-between items-center relative z-10">
              <label className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Simulated Scenario Rainfall</label>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border shadow-sm ${
                  rainfallSurge > 0 ? 'bg-rose-100 text-rose-800 border-cmd-critical/30' : 'bg-emerald-100 text-emerald-800 border-cmd-success/30'
                }`}>
                  {rainfallSurge >= 0 ? `+${rainfallSurge} mm surge` : `${rainfallSurge} mm drop`}
                </span>
                <span className="text-lg font-black font-mono text-indigo-700 bg-cmd-card px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm">
                  {scenarioRainfall} mm/day
                </span>
              </div>
            </div>
            <div className="relative z-10 pt-2">
              <input
                type="range"
                min="50"
                max="350"
                step="5"
                value={scenarioRainfall}
                onChange={e => setScenarioRainfall(Number(e.target.value))}
                className="w-full h-3 bg-indigo-200 rounded-full appearance-none cursor-pointer accent-indigo-600 shadow-inner"
              />
              <div className="flex justify-between text-[10px] font-bold font-mono text-indigo-400 mt-3 px-1 uppercase tracking-wider">
                <span>Moderate (50)</span>
                <span>Baseline (120)</span>
                <span>Extreme (350)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Summary Metric Cards */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Red Zones Delta */}
          <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border p-6 relative overflow-hidden group hover:border-cmd-critical/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cmd-critical/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Red-Zone Habitations
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-300 line-through decoration-slate-200">{result.summary.baseline_red_zones}</span>
                <span className="text-4xl font-black text-cmd-text">{result.summary.scenario_red_zones}</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                  result.summary.red_zone_delta > 0 ? 'bg-rose-100 text-cmd-critical' : 'bg-cmd-secondary/50 text-cmd-text-secondary'
                }`}>
                  {result.summary.red_zone_delta >= 0 ? `+${result.summary.red_zone_delta}` : result.summary.red_zone_delta}
                </span>
              </div>
              <p className="text-xs font-medium text-cmd-text-muted mt-3">Critical & Immediate urgency zones</p>
            </div>
          </div>

          {/* Affected Population */}
          <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border p-6 relative overflow-hidden group hover:border-cmd-warning/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cmd-warning/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted flex items-center gap-1.5 mb-3">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Displaced / At-Risk Pop
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-slate-300 line-through decoration-slate-200">
                  {(result.summary.baseline_affected_population / 1000).toFixed(1)}k
                </span>
                <span className="text-4xl font-black text-cmd-text">
                  {(result.summary.scenario_affected_population / 1000).toFixed(1)}k
                </span>
              </div>
              <p className="text-xs font-bold text-cmd-warning bg-cmd-warning/10 inline-block px-2 py-0.5 rounded-md mt-3 border border-amber-100">
                +{result.summary.affected_population_delta.toLocaleString()} newly affected
              </p>
            </div>
          </div>

          {/* Urgency Escalations */}
          <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border p-6 relative overflow-hidden group hover:border-purple-200 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted flex items-center gap-1.5 mb-3">
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                Urgency Category Shifts
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-cmd-text">
                  {result.summary.habitations_urgency_changed}
                </span>
                <span className="text-sm font-bold text-cmd-text-muted">habitations</span>
              </div>
              <p className="text-xs font-medium text-cmd-text-muted mt-3">Transitions to Short-Term/Immediate</p>
            </div>
          </div>

          {/* Optimizer Reassignments */}
          <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border p-6 relative overflow-hidden group hover:border-cmd-info/30 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cmd-info/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted flex items-center gap-1.5 mb-3">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                Optimizer Reroutes
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-cmd-text">
                  {result.summary.habitations_site_reassigned}
                </span>
                <span className="text-sm font-bold text-cmd-text-muted">corridors</span>
              </div>
              <p className="text-xs font-medium text-cmd-text-muted mt-3">Due to priority greedy reallocation</p>
            </div>
          </div>
        </div>
      )}

      {/* Differential Habitation Ledger Table */}
      {result && (
        <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border overflow-hidden">
          <div className="p-6 md:p-8 bg-cmd-secondary/50 border-b border-cmd-border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <h3 className="text-lg font-black text-cmd-text flex items-center gap-3">
                Differential Scenario Impact Ledger
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-md uppercase tracking-widest border border-indigo-200">
                  Base ({baselineRainfall}mm) vs Scen ({scenarioRainfall}mm)
                </span>
              </h3>
              <p className="text-sm text-cmd-text-muted font-medium mt-1">
                Highlights habitations whose hazard, risk category, relocation urgency, or recommended safe site changed under this simulation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 xl:flex-none">
                <input
                  type="text"
                  placeholder="Filter habitations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full xl:w-64 text-sm font-medium pl-4 pr-4 py-2.5 bg-cmd-card border border-cmd-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-cmd-text-muted"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`text-[11px] px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    filter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary/50'
                  }`}
                >
                  All ({result.comparison.length})
                </button>
                <button
                  onClick={() => setFilter('IMPACTED')}
                  className={`text-[11px] px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    filter === 'IMPACTED' ? 'bg-blue-600 text-white shadow-sm' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary/50'
                  }`}
                >
                  Impacted
                </button>
                <button
                  onClick={() => setFilter('RED_ZONES')}
                  className={`text-[11px] px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    filter === 'RED_ZONES' ? 'bg-rose-600 text-white shadow-sm' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary/50'
                  }`}
                >
                  Red Zones
                </button>
                <button
                  onClick={() => setFilter('REASSIGNED')}
                  className={`text-[11px] px-3 py-2 rounded-lg font-bold uppercase tracking-wider transition-all ${
                    filter === 'REASSIGNED' ? 'bg-purple-600 text-white shadow-sm' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary/50'
                  }`}
                >
                  Reassigned
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-cmd-card text-cmd-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-cmd-border">
                <tr>
                  <th className="py-4 px-6">Habitation & Demographics</th>
                  <th className="py-4 px-6 text-center">Hazard (Base → Scen)</th>
                  <th className="py-4 px-6 text-center">RPI & Risk Category</th>
                  <th className="py-4 px-6 text-center">Relocation Urgency</th>
                  <th className="py-4 px-6">Recommended Destination</th>
                  <th className="py-4 px-6 text-center">Impact Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHabitations.map(item => {
                  const diff = item.difference;
                  const isRedZone = item.scenario.risk_category.includes('Red Zone') || item.scenario.urgency === 'Immediate';

                  return (
                    <tr
                      key={item.habitation_id}
                      className={`transition-colors ${
                        isRedZone ? 'bg-cmd-critical/10/30' : diff.is_impacted ? 'bg-cmd-warning/10/20' : 'hover:bg-cmd-secondary/50'
                      }`}
                    >
                      {/* Habitation */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-cmd-text mb-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-cmd-text-muted" />
                          {item.habitation_name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-cmd-text-muted uppercase tracking-widest">
                          <span className="bg-cmd-secondary/50 px-1.5 py-0.5 rounded">{item.habitation_id}</span>
                          <span>•</span>
                          <span>Pop: {item.population}</span>
                          <span>•</span>
                          <span>{item.elevation}m</span>
                        </div>
                      </td>

                      {/* Hazard Score */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-bold text-cmd-text-muted line-through decoration-slate-300">{item.baseline.hazard_score.toFixed(1)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className={`text-base font-black ${diff.hazard_delta > 0 ? 'text-cmd-critical' : 'text-cmd-text'}`}>
                            {item.scenario.hazard_score.toFixed(1)}
                          </span>
                        </div>
                        {diff.hazard_delta > 0 && (
                          <div className="text-[10px] font-black text-cmd-critical bg-cmd-critical/10 inline-block px-1.5 py-0.5 rounded mt-1">
                            +{diff.hazard_delta.toFixed(1)}
                          </div>
                        )}
                      </td>

                      {/* RPI Risk & Category */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-bold text-cmd-text-muted line-through decoration-slate-300">{item.baseline.rpi.toFixed(1)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className={`text-base font-black ${item.scenario.rpi >= 76 ? 'text-cmd-critical' : 'text-cmd-text'}`}>
                            {item.scenario.rpi.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-cmd-text-muted uppercase tracking-widest mt-1">
                          {item.scenario.risk_category}
                        </div>
                      </td>

                      {/* Urgency */}
                      <td className="py-4 px-6 text-center">
                        {diff.urgency_changed ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-bold text-cmd-text-muted line-through decoration-slate-300">{item.baseline.urgency}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-cmd-critical/30">
                              {item.scenario.urgency}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-cmd-secondary/50 text-cmd-text-secondary">
                            {item.scenario.urgency}
                          </span>
                        )}
                      </td>

                      {/* Destination Site */}
                      <td className="py-4 px-6">
                        {diff.site_changed ? (
                          <div className="flex flex-col gap-1">
                            <div className="text-xs font-bold text-cmd-text-muted line-through decoration-slate-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {item.baseline.recommended_site}
                            </div>
                            <div className="text-xs font-black text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 w-fit">
                              <ArrowRight className="w-3 h-3" /> {item.scenario.recommended_site}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-cmd-text-secondary flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-cmd-text-muted" /> {item.scenario.recommended_site}
                          </span>
                        )}
                      </td>

                      {/* Badges */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {diff.risk_category_changed && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-amber-100 text-amber-800 border border-cmd-warning/30">
                              Escalated
                            </span>
                          )}
                          {diff.urgency_changed && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-rose-100 text-rose-800 border border-cmd-critical/30">
                              Urgency Shift
                            </span>
                          )}
                          {diff.site_changed && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                              Rerouted
                            </span>
                          )}
                          {!diff.is_impacted && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">
                              No Change
                            </span>
                          )}
                        </div>
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
