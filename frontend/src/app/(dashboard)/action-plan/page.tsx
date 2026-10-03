'use client';

import React, { useState, useEffect } from 'react';
import { StatsCards, DashboardStats } from '@/components/dashboard/StatsCards';
import { PriorityTable, PriorityRow } from '@/components/dashboard/PriorityTable';
import VoiceBriefingPlayer from '@/components/voice/VoiceBriefingPlayer';

import { API_BASE_URL } from '@/lib/api';
import ExportButton from '@/components/reports/ExportButton';
import { Send, Activity, ShieldAlert } from 'lucide-react';

const API_URL = API_BASE_URL;

export default function ActionPlanPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rows, setRows] = useState<PriorityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActionPlan = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/dashboard/action-plan`);
        if (!res.ok) {
          throw new Error('Failed to fetch action plan data');
        }
        const json = await res.json();
        setStats(json.stats);
        setRows(json.priority_table);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Error loading the action plan. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchActionPlan();
  }, []);

  return (
    <>
      <style jsx global>{`
        @media print {
          body::before {
            content: "DEMO DATA";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 10rem;
            color: rgba(200, 200, 200, 0.2);
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Government Action Plan</h1>
            <p className="text-slate-500 font-medium text-sm max-w-2xl leading-relaxed">
              Executive summary of disaster relocation priorities, assignments, and critical field dispatch actions.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center no-print">
            {/* AI Voice Briefing — Brief Me */}
            {!loading && !error && stats && (
              <VoiceBriefingPlayer
                endpoint="/voice/action-plan-briefing"
                requestBody={{}}
                idleLabel="Brief Me"
                icon="🎙"
                tooltip="Generate a concise executive voice briefing from the current action plan."
                size="md"
              />
            )}
            
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg flex items-center shadow-sm text-xs font-bold uppercase tracking-wider">
              <Send className="w-4 h-4 mr-2 text-blue-600" />
              <span>Action Dispatch Active</span>
            </div>
            
            <ExportButton />
          </div>
        </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm font-medium text-slate-500">Compiling executive summary...</p>
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
          {rows && <PriorityTable rows={rows} />}
          
          {/* ElevenLabs Attribution */}
          <div className="text-center mt-2 mb-4">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              AI Voice Briefing powered by ElevenLabs
            </p>
          </div>
        </>
      )}
    </div>
    </>
  );
}
