"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Map, Database, AlertTriangle, MapPin, 
  Home, Target, ClipboardList, CheckSquare, Users, 
  Bell, CloudRain, Brain, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const routeGroups = [
  {
    label: "OVERVIEW",
    routes: [
      { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: "RISK & RELOCATION",
    routes: [
      { name: 'Geospatial Risk Map', path: '/risk-map', icon: Map },
      { name: 'Relocation Necessity', path: '/necessity', icon: AlertTriangle },
      { name: 'Safe-Site Suitability', path: '/safe-sites', icon: MapPin },
      { name: 'Carrying Capacity', path: '/capacity', icon: Home },
      { name: 'Relocation Optimizer', path: '/optimizer', icon: Target },
    ]
  },
  {
    label: "OPERATIONS",
    routes: [
      { name: 'Data Management', path: '/data-management', icon: Database },
      { name: 'Government Action Plan', path: '/action-plan', icon: ClipboardList },
      { name: 'Field Verification', path: '/field-verification', icon: CheckSquare },
      { name: 'Post-Relocation Tracking', path: '/post-relocation', icon: Users },
      { name: 'Alerts', path: '/notifications', icon: Bell },
    ]
  },
  {
    label: "INTELLIGENCE",
    routes: [
      { name: 'Scenario Simulation', path: '/simulation', icon: CloudRain },
      { name: 'ML Evaluation', path: '/ml-evaluation', icon: Brain },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-[260px] bg-cmd-sidebar text-cmd-text-secondary h-screen flex flex-col border-r border-cmd-border z-20 shrink-0"
    >
      <div className="flex items-center px-6 h-[72px] shrink-0 border-b border-cmd-border/50">
        <div className="w-8 h-8 rounded bg-cmd-info/20 flex items-center justify-center mr-3 border border-cmd-info/30">
          <Map className="w-4 h-4 text-cmd-info" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-cmd-text tracking-tight uppercase">RELOCATE AI</span>
          <span className="text-[9px] text-cmd-text-muted font-mono tracking-widest">DISASTER INTELLIGENCE</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-cmd-border scrollbar-track-transparent">
        {routeGroups.map((group, index) => (
          <motion.div 
            key={group.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="px-4"
          >
            <h3 className="px-3 text-[10px] font-bold text-cmd-text-muted uppercase tracking-widest mb-2">
              {group.label}
            </h3>
            <nav className="space-y-0.5">
              {group.routes.map((route) => {
                const isActive = pathname === route.path || (pathname?.startsWith(route.path) && route.path !== '/');
                const Icon = route.icon;
                return (
                  <Link 
                    key={route.name}
                    href={route.path}
                    className="block outline-none"
                  >
                    <div className="relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 group">
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          className="absolute inset-0 bg-cmd-card border border-cmd-border/50 rounded-md z-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-cmd-info rounded-r-md z-10" />
                      )}
                      
                      <div className={`relative z-10 flex items-center gap-3 w-full ${
                        isActive ? 'text-cmd-text' : 'text-cmd-text-secondary group-hover:text-cmd-text'
                      }`}>
                        <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-cmd-info' : 'text-cmd-text-muted group-hover:text-cmd-text-secondary'}`} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[13px] font-medium tracking-wide">{route.name}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-cmd-border/50 bg-cmd-sidebar">
        <div className="flex items-center gap-3 px-2 py-2 rounded bg-cmd-card/50 border border-cmd-border/30">
          <div className="w-2 h-2 rounded-full bg-cmd-warning animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-cmd-text uppercase tracking-wider">Demo Environment</span>
            <span className="text-[9px] text-cmd-text-muted font-mono uppercase">Synthetic Data</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
