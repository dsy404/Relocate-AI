'use client';

import React, { useState, useEffect } from 'react';
import { NecessityDecision, NecessityData } from '@/components/relocation/NecessityDecision';
import { apiClient } from '@/lib/api';
import { Settings2, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';

const DEMO_HABITATION_ID = "HAB001";

export default function NecessityPage() {
  const [data, setData] = useState<NecessityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskSlider, setRiskSlider] = useState(75);

  const fetchNecessity = async (score: number) => {
    try {
      setLoading(true);
      const json = await apiClient.get(`/necessity/evaluate?habitation_id=${DEMO_HABITATION_ID}&risk_score=${score}`);
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error loading necessity decision data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNecessity(riskSlider);
  }, []); // Run once on mount

  // Handle slider change (debounce slightly or fetch immediately)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = parseInt(e.target.value);
    setRiskSlider(newScore);
  };

  const handleSimulate = () => {
    fetchNecessity(riskSlider);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-cmd-border">
        <div>
          <h1 className="text-3xl font-extrabold text-cmd-text tracking-tight mb-2">Relocation Necessity Classifier</h1>
          <p className="text-cmd-text-muted font-medium text-sm max-w-2xl leading-relaxed">
            Rule-based decision engine assigning habitations to action categories based on composite risk profiling.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-lg flex items-center shadow-sm text-xs font-bold uppercase tracking-wider">
            <Settings2 className="w-4 h-4 mr-2 text-indigo-600" />
            <span>Rule Engine Active</span>
          </div>
        </div>
      </div>

      {/* Simulation Console */}
      <div className="bg-cmd-card p-6 md:p-8 rounded-2xl shadow-sm border border-cmd-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-cmd-border/50 pb-6">
          <div>
            <h3 className="text-lg font-bold text-cmd-text tracking-tight">Simulation Console</h3>
            <p className="text-sm text-cmd-text-muted font-medium mt-1">
              Adjust the synthetic risk score below to see how the decision engine re-evaluates the habitation's relocation necessity.
            </p>
          </div>
          <div className="bg-cmd-secondary border border-cmd-border px-4 py-2 rounded-xl flex items-center gap-3">
             <span className="text-xs font-bold text-cmd-text-muted uppercase tracking-widest">Active Target</span>
             <span className="text-sm font-black text-indigo-700">{DEMO_HABITATION_ID}</span>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={riskSlider} 
              onChange={handleSliderChange}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-cmd-text-muted mt-4">
              <span className="flex flex-col items-start"><span className="text-emerald-500 mb-1">0</span> Safe</span>
              <span className="flex flex-col items-center"><span className="text-amber-500 mb-1">50</span> Moderate</span>
              <span className="flex flex-col items-end"><span className="text-rose-500 mb-1">100</span> Critical</span>
            </div>
          </div>
          <div className="w-24 text-center shrink-0">
            <span className="text-[10px] font-bold text-cmd-text-muted uppercase tracking-widest block mb-1">Input RPI</span>
            <span className="text-5xl font-black text-indigo-600 tracking-tighter">{riskSlider}</span>
          </div>
          <button 
            onClick={handleSimulate}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0 group"
          >
            Evaluate Engine
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-cmd-secondary rounded-2xl border border-cmd-border border-dashed">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mb-4" />
          <p className="text-sm font-medium text-cmd-text-muted">Evaluating classification rules...</p>
        </div>
      ) : error ? (
        <div className="bg-cmd-critical/10 border border-cmd-critical/30 p-6 rounded-2xl shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-cmd-critical flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">Engine Error</h3>
            <p className="text-sm text-cmd-critical mt-1">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="animate-in fade-in duration-500">
           <NecessityDecision data={data} />
        </div>
      ) : null}
    </div>
  );
}
