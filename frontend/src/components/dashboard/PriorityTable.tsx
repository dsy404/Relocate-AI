import React from 'react';

export interface PriorityRow {
  rank: number;
  habitation_name: string;
  risk_score: number;
  population: number;
  action_category: string;
  assigned_site: string;
  capacity_status: string;
}

interface PriorityTableProps {
  rows: PriorityRow[];
}

export const PriorityTable: React.FC<PriorityTableProps> = ({ rows }) => {
  return (
    <div className="bg-cmd-card rounded-xl shadow-sm border border-cmd-border overflow-hidden">
      <div className="px-6 py-5 border-b border-cmd-border">
        <h3 className="text-lg font-semibold text-cmd-text">Relocation Priority Action Plan</h3>
        <p className="text-sm text-cmd-text-muted mt-1">Sorted by risk severity and necessity priority.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-cmd-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Rank
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Habitation
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Risk Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Population
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Action
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Assigned Site
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-cmd-text-muted uppercase tracking-wider">
                Capacity Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-cmd-card divide-y divide-gray-200">
            {rows.map((row) => (
              <tr key={row.rank} className="hover:bg-cmd-secondary transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cmd-secondary/50 text-gray-800 font-bold text-sm">
                    {row.rank}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-cmd-text">{row.habitation_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-cmd-text font-semibold">{row.risk_score}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-cmd-text-muted">{row.population.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                    row.action_category === 'Immediate' ? 'bg-red-100 text-red-800 border-cmd-critical/30' :
                    row.action_category === 'Short-Term' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    row.action_category === 'Medium-Term' ? 'bg-yellow-100 text-yellow-800 border-cmd-warning/30' :
                    'bg-green-100 text-green-800 border-cmd-success/30'
                  }`}>
                    {row.action_category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${row.assigned_site === 'UNASSIGNED' ? 'text-cmd-critical' : 'text-cmd-info'}`}>
                    {row.assigned_site}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    row.capacity_status === 'Safe' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {row.capacity_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
