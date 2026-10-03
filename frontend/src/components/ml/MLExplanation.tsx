"use client";

import React from 'react';
import { AlertTriangle, Cpu, Target, BarChart4, TrendingUp } from 'lucide-react';

interface Feature {
  name: string;
  importance: number;
  color: string;
}

interface MLExplanationProps {
  model_type: string;
  accuracy: number;
  f1_score: number;
  warning: string;
  features: Feature[];
}

export default function MLExplanation({ data }: { data: MLExplanationProps }) {
  // Enhanced color mapping for SaaS look
  const getFeatureColor = (colorClass: string) => {
    if (colorClass.includes('blue')) return 'bg-blue-500';
    if (colorClass.includes('red')) return 'bg-rose-500';
    if (colorClass.includes('green')) return 'bg-emerald-500';
    if (colorClass.includes('yellow')) return 'bg-amber-500';
    if (colorClass.includes('indigo')) return 'bg-indigo-500';
    if (colorClass.includes('purple')) return 'bg-purple-500';
    return 'bg-slate-500';
  };

  return (
    <div className="space-y-8">
      
      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 p-6 rounded-3xl shadow-sm flex items-start gap-4">
        <div className="bg-amber-100 p-2.5 rounded-2xl shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Model State Warning</h3>
          <p className="text-sm font-medium text-amber-800/80 leading-relaxed">{data.warning}</p>
        </div>
      </div>

      {/* Model Stats */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 p-2 rounded-xl">
            <Cpu className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Model Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-slate-200 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Algorithm Engine
              </h3>
              <p className="text-2xl font-black text-slate-800">{data.model_type}</p>
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-200 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Simulated Accuracy
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-indigo-700 leading-none">{(data.accuracy * 100).toFixed(1)}</p>
                <span className="text-lg font-bold text-indigo-400 mb-1">%</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-50 transition-opacity" />
            <div className="relative z-10">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                F1 Score
              </h3>
              <p className="text-4xl font-black text-emerald-600 leading-none">{data.f1_score.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-50 p-2 rounded-xl">
            <BarChart4 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Feature Importance</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Relative weight of input parameters determining risk classification outcomes.</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {data.features.map((feature, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-700">{feature.name}</span>
                <span className="text-sm font-black text-slate-900 font-mono">{feature.importance}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 ${getFeatureColor(feature.color)}`} 
                  style={{ width: `${feature.importance}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
