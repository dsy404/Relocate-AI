"use client";

import React from 'react';
import { CloudRain, ShieldAlert } from 'lucide-react';
import SimulationPanel from '@/components/simulation/SimulationPanel';

export default function SimulationPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-cmd-border">
        <div>
          <h1 className="text-3xl font-extrabold text-cmd-text tracking-tight mb-2 flex items-center gap-3">
            <CloudRain className="w-8 h-8 text-cmd-info" />
            Live Scenario Simulation Engine
          </h1>
          <p className="text-cmd-text-muted font-medium text-sm max-w-2xl leading-relaxed">
            Environmental stress-testing console comparing baseline conditions against extreme precipitation scenarios without mutating production databases.
          </p>
        </div>
      </div>

      <SimulationPanel />
    </div>
  );
}
