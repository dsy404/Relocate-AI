"use client";

import { usePathname } from 'next/navigation';
import { User, ShieldAlert } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/risk-map': 'Geospatial Risk Map',
  '/data-management': 'Data Management',
  '/safe-sites': 'Safe-Site Suitability',
  '/capacity': 'Carrying Capacity Analysis',
  '/necessity': 'Relocation Necessity',
  '/optimizer': 'Relocation Optimizer',
  '/action-plan': 'Government Action Plan',
  '/field-verification': 'Field Verification Console',
  '/post-relocation': 'Post-Relocation Tracking',
  '/notifications': 'System Alerts',
  '/simulation': 'Scenario Simulation',
  '/ml-evaluation': 'Machine Learning Evaluation',
};

export default function Header() {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] || 'Dashboard';

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10 relative">
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          {pageTitle}
        </h1>
        
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-full">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
            Ramgarh District (Demo)
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-5">
        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900">Administrator</span>
            <span className="text-xs text-slate-500 font-medium">Demo Mode</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      </div>
    </header>
  );
}
