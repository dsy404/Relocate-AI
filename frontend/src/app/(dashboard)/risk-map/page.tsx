"use client";

import DynamicMap from '@/components/map/DynamicMap';
import VoiceBriefingPlayer from '@/components/voice/VoiceBriefingPlayer';
import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, MapPin, Activity, RadioTower } from 'lucide-react';

export default function RiskMapPage() {
  const [topVillages, setTopVillages] = useState<any[]>([]);

  useEffect(() => {
    const handleScoredData = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        // detail is already sorted by rpi, take top 5
        setTopVillages(e.detail.slice(0, 5));
      }
    };
    
    window.addEventListener('map-scored-data', handleScoredData);
    return () => window.removeEventListener('map-scored-data', handleScoredData);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-6 max-w-[1600px] mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Geospatial Risk Map</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl">
            Interactive visualization of habitations, hazard layers, and candidate relocation sites for spatial analysis.
          </p>
        </div>
        
        {/* Modern Map Legend */}
        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex space-x-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-rose-500 ring-4 ring-rose-50"></div>
            <span className="font-semibold text-slate-700">Critical Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-amber-500 ring-4 ring-amber-50"></div>
            <span className="font-semibold text-slate-700">High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500 ring-4 ring-emerald-50"></div>
            <span className="font-semibold text-slate-700">Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-blue-500 ring-4 ring-blue-50"></div>
            <span className="font-semibold text-slate-700">Candidate Sites</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 gap-6 min-h-0">
        
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-slate-50 rounded-xl" />
          <DynamicMap />
        </div>
        
        {/* Priority Targets Sidebar */}
        <div className="w-[360px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          
          <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-slate-900">Priority Targets</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Highest RPI</span>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {topVillages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                <RadioTower className="w-8 h-8 text-slate-400 animate-pulse" />
                <p className="text-sm font-medium text-slate-600">Syncing telemetry...</p>
              </div>
            ) : (
              topVillages.map((village, idx) => {
                const isCritical = village.rpi > 75;
                return (
                  <div key={idx} className={`rounded-xl border p-4 transition-all hover:shadow-md ${isCritical ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'}`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-2">
                        <h3 className="font-bold text-slate-900 truncate">{village.name}</h3>
                        <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          ID: {village.id}
                        </p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${isCritical ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
                        {village.rpi?.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Haz</span>
                        <span className="font-mono text-sm font-bold text-slate-700">{village.hazard_score}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Exp</span>
                        <span className="font-mono text-sm font-bold text-slate-700">{village.exposure_score}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-2 text-center shadow-sm">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vul</span>
                        <span className="font-mono text-sm font-bold text-slate-700">{village.vulnerability_score}</span>
                      </div>
                    </div>
                    
                    {/* AI Voice Briefing */}
                    <div className="pt-3 border-t border-slate-200 border-dashed">
                      <VoiceBriefingPlayer
                        endpoint="/voice/risk-briefing"
                        requestBody={{ habitation_id: village.id }}
                        idleLabel="Explain Risk Profile"
                        icon="🔊"
                        tooltip="Generate a concise voice briefing from the current risk assessment."
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Attribution */}
          {topVillages.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-200 p-3 text-center">
              <p className="text-[10px] font-medium text-slate-400">
                AI Voice Briefing powered by ElevenLabs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
