'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCards, DashboardStats } from '@/components/dashboard/StatsCards';
import { apiClient } from '@/lib/api';
import VoiceBriefingPlayer from '@/components/voice/VoiceBriefingPlayer';
import { ShieldAlert, Map as MapIcon, Database, CheckSquare, Target, CloudRain, ArrowRight, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="w-full flex flex-col gap-6 pb-10">
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-cmd-border/50"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-cmd-text tracking-tight">Disaster Intelligence Overview</h1>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cmd-warning/10 text-cmd-warning border border-cmd-warning/20 uppercase tracking-widest">
              Synthetic Data
            </span>
          </div>
          <p className="text-cmd-text-muted font-medium max-w-2xl text-sm leading-relaxed">
            Monitor habitation risk, assess relocation requirements, and coordinate evidence-based response planning.
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
          <Link href="/action-plan" className="bg-cmd-card border border-cmd-border text-cmd-text hover:bg-cmd-secondary font-semibold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2 text-xs">
            View Action Plan
          </Link>
          <Link href="/risk-map" className="bg-cmd-info hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow-[0_0_15px_rgba(108,166,255,0.3)] transition-all flex items-center gap-2 text-xs">
            <MapIcon className="w-4 h-4" />
            Open Risk Map
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-cmd-card/50 rounded-2xl border border-cmd-border/50 border-dashed">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cmd-info mb-4"></div>
          <p className="text-xs font-bold text-cmd-text-muted tracking-widest uppercase">Compiling intelligence...</p>
        </div>
      ) : error ? (
        <div className="bg-cmd-critical/10 border border-cmd-critical/30 p-6 rounded-2xl flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-cmd-critical flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-cmd-critical text-sm tracking-wide">CONNECTION ERROR</h3>
            <p className="text-xs text-cmd-critical/80 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {stats && <StatsCards stats={stats} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Primary Intelligence: Critical Zones */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="lg:col-span-7 bg-cmd-card rounded-2xl shadow-sm border border-cmd-border flex flex-col h-full overflow-hidden"
            >
              <div className="border-b border-cmd-border/50 p-5 flex justify-between items-center bg-cmd-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-cmd-critical/10 flex items-center justify-center border border-cmd-critical/20">
                    <Activity className="w-4 h-4 text-cmd-critical" />
                  </div>
                  <h3 className="font-bold text-cmd-text text-sm tracking-wide">Highest-Priority Habitations</h3>
                </div>
                <Link href="/action-plan" className="text-[11px] text-cmd-info hover:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1 group transition-colors">
                  View Full List <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="p-0 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-cmd-border scrollbar-track-transparent">
                <table className="w-full text-sm text-left">
                  <thead className="bg-cmd-secondary/50 text-cmd-text-muted text-[10px] font-bold uppercase tracking-widest sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-4 border-b border-cmd-border/50">Habitation</th>
                      <th className="px-5 py-4 text-center border-b border-cmd-border/50">Risk Score</th>
                      <th className="px-5 py-4 text-right border-b border-cmd-border/50">Population</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cmd-border/30">
                    {topCritical.map((row, idx) => (
                      <tr key={idx} className="hover:bg-cmd-secondary/50 transition-colors group">
                        <td className="px-5 py-4 font-semibold text-cmd-text text-xs">{row.habitation_name}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest ${row.risk_score > 75 ? 'bg-cmd-critical/10 text-cmd-critical border border-cmd-critical/20' : 'bg-cmd-warning/10 text-cmd-warning border border-cmd-warning/20'}`}>
                            {row.risk_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-cmd-text-secondary text-xs">
                          {row.population.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {topCritical.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-5 py-12 text-center text-cmd-text-muted text-xs font-medium">No critical zones identified.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Next Steps / Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="lg:col-span-5 bg-cmd-card rounded-2xl shadow-sm border border-cmd-border flex flex-col h-full overflow-hidden"
            >
              <div className="border-b border-cmd-border/50 p-5 bg-cmd-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded bg-cmd-info/10 flex items-center justify-center border border-cmd-info/20">
                    <Zap className="w-4 h-4 text-cmd-info" />
                  </div>
                  <h3 className="font-bold text-cmd-text text-sm tracking-wide">Operational Actions</h3>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                
                <Link href="/optimizer" className="border border-cmd-border/50 rounded-xl p-4 hover:border-cmd-info/50 hover:bg-cmd-info/5 transition-all group flex gap-4 items-center">
                  <div className="w-10 h-10 bg-cmd-secondary border border-cmd-border text-cmd-info rounded-lg flex items-center justify-center shrink-0 group-hover:bg-cmd-info group-hover:text-white group-hover:border-cmd-info transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cmd-text text-sm mb-0.5 group-hover:text-cmd-info transition-colors">Run Relocation Optimizer</h4>
                    <p className="text-[11px] text-cmd-text-muted font-medium leading-relaxed">Assign priority habitations to safe candidate sites.</p>
                  </div>
                </Link>

                <Link href="/simulation" className="border border-cmd-border/50 rounded-xl p-4 hover:border-cmd-info/50 hover:bg-cmd-info/5 transition-all group flex gap-4 items-center">
                  <div className="w-10 h-10 bg-cmd-secondary border border-cmd-border text-cmd-info rounded-lg flex items-center justify-center shrink-0 group-hover:bg-cmd-info group-hover:text-white group-hover:border-cmd-info transition-colors">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cmd-text text-sm mb-0.5 group-hover:text-cmd-info transition-colors">Simulate Scenarios</h4>
                    <p className="text-[11px] text-cmd-text-muted font-medium leading-relaxed">Model risk impacts against changing hazard thresholds.</p>
                  </div>
                </Link>

                <Link href="/field-verification" className="border border-cmd-border/50 rounded-xl p-4 hover:border-cmd-success/50 hover:bg-cmd-success/5 transition-all group flex gap-4 items-center">
                  <div className="w-10 h-10 bg-cmd-secondary border border-cmd-border text-cmd-success rounded-lg flex items-center justify-center shrink-0 group-hover:bg-cmd-success group-hover:text-white group-hover:border-cmd-success transition-colors">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cmd-text text-sm mb-0.5 group-hover:text-cmd-success transition-colors">Field Verification</h4>
                    <p className="text-[11px] text-cmd-text-muted font-medium leading-relaxed">Dispatch ground teams to verify model predictions.</p>
                  </div>
                </Link>

                <Link href="/data-management" className="border border-cmd-border/50 rounded-xl p-4 hover:border-cmd-warning/50 hover:bg-cmd-warning/5 transition-all group flex gap-4 items-center">
                  <div className="w-10 h-10 bg-cmd-secondary border border-cmd-border text-cmd-warning rounded-lg flex items-center justify-center shrink-0 group-hover:bg-cmd-warning group-hover:text-white group-hover:border-cmd-warning transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-cmd-text text-sm mb-0.5 group-hover:text-cmd-warning transition-colors">Ingest Datasets</h4>
                    <p className="text-[11px] text-cmd-text-muted font-medium leading-relaxed">Upload latest boundaries, demographics, or hazards.</p>
                  </div>
                </Link>

              </div>
            </motion.div>

          </div>
        </>
      )}
    </div>
  );
}
