'use client';

import React, { useState, useEffect } from 'react';
import { SiteComparison, CandidateSite } from '@/components/relocation/SiteComparison';
import { API_BASE_URL } from '@/lib/api';
import { Target, Search, AlertTriangle, ShieldCheck, MapPin, Loader2, ArrowRight } from 'lucide-react';

interface HabitationOption {
  id: string;
  name: string;
  population?: number;
  rpi?: number;
  risk_category?: string;
}

export default function SafeSitesPage() {
  const [habitations, setHabitations] = useState<HabitationOption[]>([]);
  const [selectedHabId, setSelectedHabId] = useState<string>('');
  const [rankedSites, setRankedSites] = useState<CandidateSite[]>([]);
  const [disqualifiedSites, setDisqualifiedSites] = useState<CandidateSite[]>([]);
  const [sourceHabitation, setSourceHabitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load habitations for the dynamic origin selector
  useEffect(() => {
    const fetchHabitations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/habitations`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setHabitations(list);
            // Default to the first high-risk habitation if available
            const highRisk = list.find((h: any) => h.risk_category?.toLowerCase().includes('high') || h.rpi > 60);
            setSelectedHabId(highRisk ? highRisk.id : list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load habitations list", err);
      }
    };
    fetchHabitations();
  }, []);

  // Fetch dynamic suitability comparison whenever selected habitation changes
  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        setError(null);
        const query = selectedHabId ? `?habitation_id=${selectedHabId}` : '';
        const res = await fetch(`${API_BASE_URL}/safe-sites/compare${query}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch safe sites (${res.status})`);
        }
        const data = await res.json();

        if (data.ranked_safe_sites) {
          setRankedSites(data.ranked_safe_sites);
          setDisqualifiedSites(data.disqualified_sites || []);
          setSourceHabitation(data.source_habitation);
        } else if (Array.isArray(data)) {
          setRankedSites(data);
          setDisqualifiedSites([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading safe sites data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [selectedHabId]);

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Safe-Site Suitability Engine</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
            Dynamic multi-criteria suitability scoring with pre-ranking safety disqualification.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg flex items-center shadow-sm text-xs font-bold uppercase tracking-wider">
            <Target className="w-4 h-4 mr-2 text-emerald-600" />
            <span>Dynamic Evaluation Active</span>
          </div>
        </div>
      </div>

      {/* Interactive Origin Selector */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
        <div className="flex-1 max-w-2xl">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            <Search className="w-3.5 h-3.5" />
            Evaluate Relocation for Affected Habitation
          </label>
          <div className="relative">
            <select
              value={selectedHabId}
              onChange={(e) => setSelectedHabId(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all cursor-pointer appearance-none"
            >
              {habitations.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.id}) — Pop: {h.population?.toLocaleString() || 'N/A'}, Risk: {h.risk_category || 'Assessed'}
                </option>
              ))}
              {habitations.length === 0 && (
                <option value="">Default Regional Centroid</option>
              )}
            </select>
            <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {sourceHabitation && (
          <div className="flex items-center gap-4 px-5 py-4 bg-indigo-50 rounded-xl border border-indigo-100 min-w-[280px]">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block mb-0.5">Origin Profile</span>
              <span className="text-sm font-bold text-indigo-950 block truncate">{sourceHabitation.name}</span>
              <span className="text-[11px] font-medium text-indigo-700/80 mt-1 block">
                {sourceHabitation.latitude?.toFixed(4)}, {sourceHabitation.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading / Error States */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-4" />
          <p className="text-sm font-medium text-slate-500">Evaluating suitability metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">Evaluation Error</h3>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Top Recommendation Hero */}
          {rankedSites.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Optimal Relocation Recommendation</h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                  Rank #1 Safe Candidate
                </span>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-50/30 border border-emerald-200/60 rounded-2xl p-6 md:p-8 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  
                  <div className="flex-1 space-y-5">
                    <div className="flex items-center flex-wrap gap-4">
                      <h3 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                        {rankedSites[0].site_name}
                      </h3>
                      {rankedSites[0].distance_km !== null && rankedSites[0].distance_km !== undefined && (
                        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-white text-emerald-800 rounded-lg shadow-sm border border-emerald-200">
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                          {rankedSites[0].distance_km} km from origin
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm leading-relaxed text-emerald-900/80 font-medium max-w-3xl">
                      {rankedSites[0].reasoning}
                    </p>

                    {/* Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div className="bg-white/80 rounded-xl p-5 border border-emerald-100 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-[11px] font-bold text-emerald-900 uppercase tracking-widest">Key Advantages</h4>
                        </div>
                        <ul className="text-sm text-slate-700 space-y-2">
                          {rankedSites[0].advantages?.map((adv, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-1 text-[10px]">●</span>
                              <span className="leading-tight">{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white/80 rounded-xl p-5 border border-amber-100 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-widest">Identified Trade-Offs</h4>
                        </div>
                        <ul className="text-sm text-slate-700 space-y-2">
                          {rankedSites[0].trade_offs?.map((tr, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1 text-[10px]">●</span>
                              <span className="leading-tight">{tr}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="flex flex-col justify-center items-center bg-white p-8 rounded-2xl shadow-xl shadow-emerald-900/5 border border-emerald-200 min-w-[200px] shrink-0 transform transition-transform hover:scale-105">
                    <div className="text-[10px] text-emerald-600 uppercase font-bold tracking-widest mb-2">Suitability Score</div>
                    <div className="text-6xl font-black text-emerald-600 tracking-tighter">
                      {rankedSites[0].overall_suitability_score || rankedSites[0].total_score}
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">out of 100</div>
                    <div className="mt-5 pt-4 border-t border-slate-100 w-full text-center flex flex-col items-center gap-1">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Confidence</span>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{rankedSites[0].confidence || 'HIGH'}</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )}

          {/* Detailed Safe Candidate Cards Grid */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">
              All Eligible Safe Sites <span className="text-slate-400 ml-2">({rankedSites.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankedSites.map((site, index) => (
                <div key={site.site_id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">Rank #{index + 1}</div>
                        <h4 className="text-lg font-bold text-slate-900 tracking-tight">{site.site_name}</h4>
                        {site.distance_km !== null && site.distance_km !== undefined && (
                          <span className="text-[11px] font-medium text-slate-500 mt-1 block flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {site.distance_km} km away
                          </span>
                        )}
                      </div>
                      <div className="text-right bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors">
                        <span className="text-2xl font-black text-slate-900 group-hover:text-blue-700">
                          {site.overall_suitability_score || site.total_score}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 ml-0.5">/100</span>
                      </div>
                    </div>

                    {/* Component Score Pills */}
                    {site.component_scores && (
                      <div className="grid grid-cols-2 gap-2 my-5 text-[11px] font-bold">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                          <span className="text-slate-500 uppercase tracking-wide text-[9px]">Safety</span>
                          <span className="text-emerald-600">{site.component_scores.hazard_safety}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                          <span className="text-slate-500 uppercase tracking-wide text-[9px]">Terrain</span>
                          <span className="text-blue-600">{site.component_scores.terrain_suitability}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                          <span className="text-slate-500 uppercase tracking-wide text-[9px]">Transit</span>
                          <span className="text-indigo-600">{site.component_scores.accessibility}</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                          <span className="text-slate-500 uppercase tracking-wide text-[9px]">Utils</span>
                          <span className="text-amber-600">{site.component_scores.utilities}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-5 font-medium">
                      {site.reasoning}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl group-hover:bg-slate-100/50 transition-colors">
                    <span className="font-bold text-slate-900 block mb-1">Top Advantage</span>
                    <span className="line-clamp-2">{site.advantages?.[0] || 'Meets baseline safety standards'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disqualified / Unsafe Sites Warning Section */}
          {disqualifiedSites.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-rose-950 tracking-tight">
                  Pre-Ranking Safety Exclusions <span className="text-rose-500 ml-2">({disqualifiedSites.length} Disqualified)</span>
                </h3>
              </div>
              
              <p className="text-sm text-rose-800/80 mb-6 max-w-3xl font-medium leading-relaxed">
                The following candidate sites were automatically disqualified from relocation consideration due to acute hazard exposure or severe environmental constraints exceeding acceptable thresholds.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {disqualifiedSites.map(s => (
                  <div key={s.site_id} className="p-5 bg-white rounded-2xl border border-rose-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="font-bold text-rose-950 text-base">{s.site_name}</div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-rose-100 text-rose-700 rounded-md shrink-0">
                        Disqualified
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {s.disqualifying_conditions?.map((cond, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-rose-700/90 font-medium">
                          <span className="text-rose-400 mt-1 text-[10px]">●</span>
                          <span className="leading-tight">{cond}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Factor Comparison Matrix */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <SiteComparison sites={rankedSites} />
          </div>
        </div>
      )}
    </div>
  );
}
