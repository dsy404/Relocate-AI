"use client";

import React from 'react';
import { Home, ShieldAlert, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" }
    }),
    hover: { y: -2, scale: 1.01, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {/* Total Habitations */}
      <motion.div 
        custom={0} initial="hidden" animate="visible" whileHover="hover" whileTap="tap"
        className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-border p-5 flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-cmd-text-muted uppercase tracking-wider group-hover:text-cmd-text-secondary transition-colors">Evaluated Habitations</p>
          <div className="p-2 rounded-lg bg-cmd-secondary border border-cmd-border text-cmd-text-muted group-hover:text-cmd-info group-hover:border-cmd-info/30 transition-colors">
            <Home className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-cmd-text tracking-tight">{stats.total_habitations}</p>
        </div>
      </motion.div>

      {/* Red Zones */}
      <motion.div 
        custom={1} initial="hidden" animate="visible" whileHover="hover" whileTap="tap"
        className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-critical/30 p-5 flex flex-col justify-between relative overflow-hidden cursor-pointer group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cmd-critical/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 group-hover:bg-cmd-critical/20"></div>
        <div className="flex items-center justify-between mb-4 relative z-10">
          <p className="text-[11px] font-bold text-cmd-critical uppercase tracking-wider">Critical Red Zones</p>
          <div className="p-2 rounded-lg bg-cmd-critical/10 border border-cmd-critical/20 text-cmd-critical">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-3xl font-extrabold text-cmd-text tracking-tight">{stats.red_zones}</p>
        </div>
      </motion.div>

      {/* Affected Population */}
      <motion.div 
        custom={2} initial="hidden" animate="visible" whileHover="hover" whileTap="tap"
        className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-border p-5 flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-cmd-text-muted uppercase tracking-wider group-hover:text-cmd-text-secondary transition-colors">Affected Population</p>
          <div className="p-2 rounded-lg bg-cmd-secondary border border-cmd-border text-cmd-text-muted group-hover:text-cmd-info group-hover:border-cmd-info/30 transition-colors">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-cmd-text tracking-tight">{displayPopulation.toLocaleString()}</p>
          {stats.affected_population !== undefined && (
            <p className="text-[10px] font-semibold text-cmd-text-muted mt-1 uppercase tracking-wide">
              Total demo pop: {stats.total_population.toLocaleString()}
            </p>
          )}
        </div>
      </motion.div>

      {/* Capacity Deficit */}
      <motion.div 
        custom={3} initial="hidden" animate="visible" whileHover="hover" whileTap="tap"
        className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-border p-5 flex flex-col justify-between cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-cmd-text-muted uppercase tracking-wider group-hover:text-cmd-text-secondary transition-colors">Capacity Deficit</p>
          <div className={`p-2 rounded-lg border ${stats.capacity_deficit > 0 ? 'bg-cmd-warning/10 border-cmd-warning/20 text-cmd-warning' : 'bg-cmd-success/10 border-cmd-success/20 text-cmd-success'}`}>
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className={`text-3xl font-extrabold tracking-tight ${stats.capacity_deficit > 0 ? 'text-cmd-warning' : 'text-cmd-success'}`}>
            {stats.capacity_deficit.toLocaleString()}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
