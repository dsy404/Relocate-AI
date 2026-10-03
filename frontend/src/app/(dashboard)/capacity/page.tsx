'use client';

import React, { useState, useEffect } from 'react';
import { CapacityBreakdown, CapacityDimension } from '@/components/relocation/CapacityBreakdown';
import { BottleneckChart } from '@/components/relocation/BottleneckChart';
import { API_BASE_URL } from '@/lib/api';
import { Layers, MapPin, Users, Loader2, AlertTriangle, Info } from 'lucide-react';

interface SiteOption {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export default function CapacityPage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('SITE001');
  const [incomingPop, setIncomingPop] = useState<number>(1200);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load available candidate sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/safe-sites`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setSites(list.map((s: any) => ({
              id: s.site_id || s.id,
              name: s.site_name || s.name,
              latitude: s.latitude,
              longitude: s.longitude,
            })));
            setSelectedSiteId(list[0].site_id || list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load candidate sites list", err);
      }
    };
    fetchSites();
  }, []);

  // Fetch capacity analysis whenever site or population changes
  useEffect(() => {
    if (!selectedSiteId) return;

    const fetchCapacity = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/capacity/analyze?site_id=${selectedSiteId}&incoming_population=${incomingPop}`);
        if (!res.ok) {
          throw new Error('Failed to fetch capacity analysis');
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Error loading capacity data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [selectedSiteId, incomingPop]);

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Carrying Capacity Analysis</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
            Dynamic 8-dimensional infrastructure headroom evaluation and binding bottleneck detection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg flex items-center shadow-sm text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 mr-2 text-blue-600" />
            <span>Capacity Engine Active</span>
          </div>
        </div>
      </div>

      {/* Mandatory Planning Disclaimer Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-950 mb-1">
            Planning estimate — not legally certified carrying capacity.
          </h3>
          <p className="text-xs text-amber-800/80 font-medium leading-relaxed max-w-4xl">
            Infrastructure capacities are modeled using public engineering norms (70 LPCD water, 4.5 persons/dwelling, 1 bed/250 people). On-site geotechnical and municipal verification is required prior to legal resettlement gazettement.
          </p>
        </div>
      </div>

      {/* Interactive Controls Bar: Dynamic Candidate Site & Population Inputs */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
          <div className="flex-1 max-w-lg">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5" />
              Select Candidate Relocation Site
            </label>
            <div className="relative">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all cursor-pointer appearance-none"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
                {sites.length === 0 && (
                  <>
                    <option value="SITE001">Site A (SITE001)</option>
                    <option value="SITE002">Site B (SITE002)</option>
                    <option value="SITE003">Site C (SITE003)</option>
                    <option value="SITE004">Site D (SITE004)</option>
                    <option value="SITE005">Site E (SITE005)</option>
                  </>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              <Users className="w-3.5 h-3.5" />
              Planned Relocated Population
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={incomingPop}
                onChange={(e) => setIncomingPop(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-slate-50 hover:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
              />
              <span className="absolute right-4 top-3 text-xs text-slate-400 font-bold pointer-events-none">
                people
              </span>
            </div>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-6 px-6 py-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Feasible Headroom</div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {data.feasible_additional_capacity?.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">people</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Binding Bottleneck</div>
              <div className="text-sm font-bold text-rose-600 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                {data.critical_bottleneck}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Results Display */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mb-4" />
          <p className="text-sm font-medium text-slate-500">Analyzing capacity dimensions...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">Analysis Error</h3>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-2">
            <CapacityBreakdown dimensions={data.dimensions || []} />
          </div>
          <div className="lg:col-span-1">
            <BottleneckChart 
              bottleneck={data.bottleneck} 
              feasibleCapacity={data.feasible_additional_capacity}
              isFeasible={data.is_feasible}
              incomingPopulation={data.assigned_relocation_population || incomingPop}
              explanation={data.capacity_explanation}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
