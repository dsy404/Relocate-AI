'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCards, DashboardStats } from '@/components/dashboard/StatsCards';
import { apiClient } from '@/lib/api';
import VoiceBriefingPlayer from '@/components/voice/VoiceBriefingPlayer';
import { ShieldAlert, Map as MapIcon, Database, CheckSquare, Target, CloudRain, ArrowRight, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topCritical, setTopCritical] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/dashboard/action-plan');
        setStats(res.stats);
        setTopCritical(res.priority_table.slice(0, 5));
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Error loading dashboard data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Disaster Intelligence Overview</h1>
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Demo Environment • Synthetic Data
            </span>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl text-sm leading-relaxed">
            Understand current risk, identify vulnerable habitations, and review relocation-planning priorities based on geospatial and operational evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {!loading && !error && stats && (
            <div className="mr-2">
              <VoiceBriefingPlayer
                endpoint="/voice/dashboard-briefing"
                requestBody={{}}
                idleLabel="Brief Me"
                icon="🎙"
                tooltip="Generate a concise executive voice briefing of the current system state."
                size="md"
              />
            </div>
          )}
          <Link href="/action-plan" className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm">
            View Action Plan
          </Link>
          <Link href="/risk-map" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 text-sm">
            <MapIcon className="w-4 h-4" />
            Open Risk Map
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm font-medium text-slate-500">Compiling intelligence...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl shadow-sm flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-800">Connection Error</h3>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {stats && <StatsCards stats={stats} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Primary Intelligence: Critical Zones */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 tracking-tight">Highest-Priority Habitations</h3>
                </div>
                <Link href="/action-plan" className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 group">
                  View full list <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Habitation</th>
                      <th className="px-6 py-4 text-center">Risk Score</th>
                      <th className="px-6 py-4 text-right">Population</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topCritical.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-5 font-semibold text-slate-900">{row.habitation_name}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.risk_score > 75 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                            {row.risk_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-medium text-slate-600">
                          {row.population.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {topCritical.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">No critical zones identified.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Next Steps / Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 tracking-tight">Operational Actions</h3>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <Link href="/optimizer" className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 transition-all group bg-slate-50/50">
                  <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Run Optimizer</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Automatically assign critical habitations to safe candidate sites based on capacity.</p>
                </Link>

                <Link href="/simulation" className="border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all group bg-slate-50/50">
                  <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-colors">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Simulate Scenarios</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Test how increased rainfall expands the red zone footprint and affects populations.</p>
                </Link>

                <Link href="/field-verification" className="border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all group bg-slate-50/50">
                  <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white transition-colors">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Field Verification</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Dispatch operations teams to ground-truth machine learning predictions.</p>
                </Link>

                <Link href="/data-management" className="border border-slate-200 rounded-xl p-5 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/5 transition-all group bg-slate-50/50">
                  <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm text-amber-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Ingest Datasets</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">Upload new habitation boundaries, population metrics, or hazard zones.</p>
                </Link>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
