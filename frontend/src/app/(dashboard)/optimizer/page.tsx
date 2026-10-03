'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RelocationPlan, RelocationPlanData } from '@/components/relocation/RelocationPlan';
import { apiClient } from '@/lib/api';
import { Map as MapIcon, Target, Activity, CheckCircle, RotateCw } from 'lucide-react';

export default function OptimizerPage() {
  const [data, setData] = useState<RelocationPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const json = await apiClient.get('/optimizer/plan');
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error loading relocation plan. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleRunOptimizer = async () => {
    try {
      setLoading(true);
      const json = await apiClient.post('/optimizer/run', {});
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error running the optimizer. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Relocation Optimizer</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
            Multi-criteria deterministic greedy assignment engine incorporating safety clearances, spatial proximity, and 8D carrying capacity.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            href="/risk-map"
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-lg border border-slate-300 shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            <MapIcon className="w-4 h-4 text-blue-600" />
            View Relocation Map
          </Link>
          
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg flex items-center shadow-sm text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse ring-2 ring-blue-200"></span>
            Allocator Active
          </div>
          
          <button 
            onClick={handleRunOptimizer}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Re-calculate Assignments
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <RotateCw className="animate-spin h-8 w-8 text-blue-600 mb-4" />
          <h3 className="text-base font-bold text-slate-900">Calculating Assignments...</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Evaluating multi-criteria suitability and dynamic headroom.</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl shadow-sm flex items-start gap-4">
          <Activity className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">Optimizer Error</h3>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {data && (
        <div className="animate-in fade-in duration-500">
          <RelocationPlan data={data} />
        </div>
      )}
    </div>
  );
}
