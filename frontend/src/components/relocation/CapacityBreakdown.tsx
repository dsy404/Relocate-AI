import React from 'react';

export interface CapacityDimension {
  dimension: string;
  raw_unit?: string;
  raw_max_capacity?: number;
  raw_current_utilization?: number;
  raw_available_capacity?: number;
  raw_required_for_incoming?: number;
  conversion_standard?: string;
  total_supported_population: number;
  existing_population: number;
  additional_capacity: number;
  assigned_relocation_population: number;
  remaining_capacity: number;
  status: 'Critical' | 'Warning' | 'Safe';
  // Backward compatibility keys
  max_capacity?: number;
  current_utilization?: number;
  available_capacity?: number;
  required_capacity?: number;
  post_relocation_surplus?: number;
}

interface CapacityBreakdownProps {
  dimensions: CapacityDimension[];
}

export const CapacityBreakdown: React.FC<CapacityBreakdownProps> = ({ dimensions }) => {
  if (!dimensions || dimensions.length === 0) return null;

  return (
    <div className="bg-cmd-card rounded-xl shadow-xs border border-cmd-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cmd-border pb-3 mb-6 gap-2">
        <div>
          <h3 className="text-lg font-bold text-cmd-text">Per-Dimension Infrastructure Capacity</h3>
          <p className="text-xs text-cmd-text-muted mt-0.5">
            Physical infrastructure converted to people-supported capacity equivalents.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-cmd-secondary/50 text-cmd-text-secondary rounded-full border border-cmd-border self-start sm:self-auto">
          8 Evaluated Dimensions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {dimensions.map((dim, idx) => {
          const totalPeople = dim.total_supported_population || dim.max_capacity || 1;
          const existingPeople = dim.existing_population || dim.current_utilization || 0;
          const incomingPeople = dim.assigned_relocation_population || dim.required_capacity || 0;
          const surplus = dim.remaining_capacity !== undefined ? dim.remaining_capacity : (dim.post_relocation_surplus || 0);

          const usedPct = Math.min(100, (existingPeople / totalPeople) * 100);
          const reqPct = Math.min(100 - usedPct, (incomingPeople / totalPeople) * 100);

          let statusBg = "bg-cmd-success/10";
          let statusBorder = "border-cmd-success/30";
          let statusText = "text-cmd-success";
          let barColor = "bg-emerald-500";

          if (dim.status === 'Critical' || surplus < 0) {
            statusBg = "bg-cmd-critical/10";
            statusBorder = "border-cmd-critical/30";
            statusText = "text-cmd-critical";
            barColor = "bg-rose-500";
          } else if (dim.status === 'Warning') {
            statusBg = "bg-cmd-warning/10";
            statusBorder = "border-cmd-warning/30";
            statusText = "text-cmd-warning";
            barColor = "bg-amber-500";
          }

          return (
            <div key={idx} className={`p-4 rounded-xl border ${statusBorder} ${statusBg} transition-all`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm text-cmd-text">{dim.dimension}</h4>
                  {dim.raw_unit && dim.raw_max_capacity !== undefined && (
                    <span className="text-[11px] text-cmd-text-muted font-mono">
                      Physical: {dim.raw_current_utilization?.toLocaleString()} / {dim.raw_max_capacity?.toLocaleString()} {dim.raw_unit}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cmd-card ${statusText} border ${statusBorder} shadow-2xs`}>
                  {dim.status.toUpperCase()}
                </span>
              </div>

              {/* Conversion factor annotation */}
              {dim.conversion_standard && (
                <div className="text-[10px] text-cmd-text-muted italic mb-2">
                  Factor: {dim.conversion_standard}
                </div>
              )}

              {/* People-supported metrics */}
              <div className="bg-cmd-card/80 rounded-lg p-2.5 border border-gray-100 text-xs text-cmd-text-secondary mb-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-cmd-text-muted">Total Supported:</span>
                  <span className="font-semibold text-cmd-text">{totalPeople.toLocaleString()} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cmd-text-muted">Available Headroom:</span>
                  <span className="font-semibold text-cmd-info">{(dim.additional_capacity || 0).toLocaleString()} people</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span className="font-medium text-cmd-text-secondary">Post-Relocation Balance:</span>
                  <span className={`font-bold ${surplus < 0 ? 'text-cmd-critical' : 'text-cmd-success'}`}>
                    {surplus > 0 ? '+' : ''}{surplus.toLocaleString()} people
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                <div className="bg-gray-400 h-2" style={{ width: `${usedPct}%` }} title={`Existing Utilization: ${existingPeople.toLocaleString()}`} />
                <div className={`${barColor} h-2`} style={{ width: `${reqPct}%` }} title={`Incoming Relocated: ${incomingPeople.toLocaleString()}`} />
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0</span>
                <span>Max: {totalPeople.toLocaleString()} people</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
