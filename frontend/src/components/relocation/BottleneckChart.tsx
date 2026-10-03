import React from 'react';
import { CapacityDimension } from './CapacityBreakdown';

interface BottleneckChartProps {
  bottleneck: CapacityDimension | null;
  feasibleCapacity: number;
  isFeasible: boolean;
  incomingPopulation: number;
  explanation?: string;
}

export const BottleneckChart: React.FC<BottleneckChartProps> = ({ 
  bottleneck, 
  feasibleCapacity, 
  isFeasible,
  incomingPopulation,
  explanation,
}) => {
  if (!bottleneck) return null;

  return (
    <div className="bg-cmd-card rounded-xl shadow-xs border border-cmd-border overflow-hidden h-full flex flex-col">
      <div className="p-4 bg-cmd-secondary/75 border-b border-cmd-border">
        <h3 className="text-base font-bold text-cmd-text">Binding Bottleneck Analysis</h3>
        <p className="text-xs text-cmd-text-muted mt-0.5">Most restrictive infrastructure dimension governing feasible headroom.</p>
      </div>
      
      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-cmd-critical/10 rounded-full mb-3 border border-cmd-critical/30 shadow-xs">
            <svg className="w-8 h-8 text-cmd-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="text-2xl font-black text-cmd-text tracking-tight">{bottleneck.dimension}</h4>
          <p className="text-cmd-critical text-xs font-semibold uppercase tracking-wider mt-1">Limiting Capacity Constraint</p>
        </div>

        <div className="bg-cmd-secondary rounded-xl p-4 border border-cmd-border space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-cmd-text-muted">Planned Relocated Population:</span>
            <span className="font-bold text-cmd-text">{incomingPopulation.toLocaleString()} people</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-3 border-b border-cmd-border">
            <span className="text-cmd-text-muted">Feasible Capacity Limit:</span>
            <span className={`font-bold text-sm ${isFeasible ? 'text-cmd-success' : 'text-cmd-critical'}`}>
              {feasibleCapacity.toLocaleString()} people max
            </span>
          </div>

          <div className="text-xs pt-1">
            <div className={`p-3 rounded-lg flex items-start gap-2.5 ${isFeasible ? 'bg-cmd-success/10 text-emerald-800 border border-cmd-success/30' : 'bg-cmd-critical/10 text-rose-800 border border-cmd-critical/30'}`}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                {isFeasible ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <span className="text-xs leading-relaxed font-medium">
                {explanation || (isFeasible 
                  ? `Site can absorb the planned ${incomingPopulation.toLocaleString()} people under the limiting constraint of ${bottleneck.dimension}.` 
                  : `Site capacity deficit: ${bottleneck.dimension} cannot absorb ${incomingPopulation.toLocaleString()} people without capital infrastructure augmentation.`)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
