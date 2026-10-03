import React from 'react';
import { Home, ShieldAlert, Users, Target } from 'lucide-react';

export interface DashboardStats {
  total_habitations: number;
  total_population: number;
  red_zones: number;
  affected_population?: number;
  capacity_deficit: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const displayPopulation = stats.affected_population !== undefined 
    ? stats.affected_population 
    : stats.total_population;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Total Habitations */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Evaluated Habitations</p>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
            <Home className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats.total_habitations}</p>
        </div>
      </div>

      {/* Red Zones */}
      <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-6 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <p className="text-sm font-bold text-rose-600 uppercase tracking-wider">Critical Red Zones</p>
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-4xl font-extrabold text-rose-700 tracking-tight">{stats.red_zones}</p>
        </div>
      </div>

      {/* Affected Population */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Affected Population</p>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className="text-4xl font-extrabold text-slate-900 tracking-tight">{displayPopulation.toLocaleString()}</p>
          {stats.affected_population !== undefined && (
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wide">
              Total demo pop: {stats.total_population.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Capacity Deficit */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Capacity Deficit</p>
          <div className={`p-2.5 rounded-xl border ${stats.capacity_deficit > 0 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div>
          <p className={`text-4xl font-extrabold tracking-tight ${stats.capacity_deficit > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {stats.capacity_deficit.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
