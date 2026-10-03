"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Map, Database, AlertTriangle, MapPin, 
  Home, Target, ClipboardList, CheckSquare, Users, 
  Bell, CloudRain, Brain
} from 'lucide-react';
import { motion } from 'framer-motion';

const routeGroups = [
  {
    label: "OVERVIEW",
    routes: [
      { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: "RISK INTELLIGENCE",
    routes: [
      { name: 'Geospatial Risk Map', path: '/risk-map', icon: Map },
      { name: 'Data Management', path: '/data-management', icon: Database },
    ]
  },
  {
    label: "RELOCATION PLANNING",
    routes: [
      { name: 'Relocation Necessity', path: '/necessity', icon: AlertTriangle },
      { name: 'Safe-Site Suitability', path: '/safe-sites', icon: MapPin },
      { name: 'Carrying Capacity', path: '/capacity', icon: Home },
      { name: 'Relocation Optimizer', path: '/optimizer', icon: Target },
      { name: 'Action Plan', path: '/action-plan', icon: ClipboardList },
    ]
  },
  {
    label: "FIELD OPERATIONS",
    routes: [
      { name: 'Field Verification', path: '/field-verification', icon: CheckSquare },
      { name: 'Post-Relocation', path: '/post-relocation', icon: Users },
      { name: 'Alerts', path: '/notifications', icon: Bell },
      { name: 'Scenario Simulation', path: '/simulation', icon: CloudRain },
    ]
  },
  {
    label: "INTELLIGENCE",
    routes: [
      { name: 'ML Evaluation', path: '/ml-evaluation', icon: Brain },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shadow-xl z-20">
      <div className="flex items-center px-6 py-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-900/50">
          <Map className="w-5 h-5 text-white" />
        </div>
        <div className="font-bold text-xl text-white tracking-tight">
          RELOCATE AI
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-700">
        {routeGroups.map((group) => (
          <div key={group.label} className="px-4">
            <h3 className="px-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              {group.label}
            </h3>
            <nav className="space-y-1">
              {group.routes.map((route) => {
                const isActive = pathname === route.path || (pathname?.startsWith(route.path) && route.path !== '/');
                const Icon = route.icon;
                return (
                  <motion.div
                    key={route.name}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href={route.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                        isActive 
                          ? 'bg-blue-600/10 text-blue-400' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      {route.name}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <div>
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Demo Environment</p>
            <p className="text-[10px] text-slate-500 font-medium">Synthetic Data • Read-Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
