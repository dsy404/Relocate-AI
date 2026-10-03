"use client";

import { usePathname } from 'next/navigation';
import { User, ShieldAlert, Clock, LayoutGrid, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Command Center',
  '/risk-map': 'Geospatial Risk Map',
  '/data-management': 'Data Management',
  '/safe-sites': 'Safe-Site Suitability',
  '/capacity': 'Carrying Capacity Analysis',
  '/necessity': 'Relocation Necessity',
  '/optimizer': 'Relocation Optimizer',
  '/action-plan': 'Government Action Plan',
  '/field-verification': 'Field Verification',
  '/post-relocation': 'Post-Relocation Tracking',
  '/notifications': 'System Alerts',
  '/simulation': 'Scenario Simulation',
  '/ml-evaluation': 'Machine Learning Evaluation',
};

export default function Header() {
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] || 'Dashboard';
  
  const [time, setTime] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check initial theme from document attribute if set
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      className="bg-cmd-secondary border-b border-cmd-border h-[72px] shrink-0 px-6 flex items-center justify-between z-10 relative"
    >
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-lg bg-cmd-card border border-cmd-border flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-cmd-text-muted" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-cmd-text tracking-tight leading-tight">
            {pageTitle}
          </h1>
          <div className="flex items-center text-[10px] text-cmd-text-muted font-mono tracking-widest gap-2">
            <span>RELOCATE AI</span>
            <span>/</span>
            <span className="text-cmd-text-secondary">{pageTitle.toUpperCase()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        {/* Status badges */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cmd-card border border-cmd-border rounded-full">
            <Clock className="w-3.5 h-3.5 text-cmd-text-muted" />
            <span className="text-[10px] font-mono text-cmd-text-secondary">SYS_SYNC: {time || 'LOADING...'}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cmd-warning/10 border border-cmd-warning/20 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-cmd-warning" />
            <span className="text-[10px] font-bold text-cmd-warning uppercase tracking-wide">
              DEMO DATASET
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-cmd-border" />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full bg-cmd-card border border-cmd-border flex items-center justify-center hover:bg-cmd-border transition-colors outline-none focus:ring-2 focus:ring-cmd-info/50"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-cmd-text-secondary" />
          ) : (
            <Moon className="w-4 h-4 text-cmd-text-secondary" />
          )}
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[12px] font-bold text-cmd-text">GovAdmin_01</span>
            <span className="text-[10px] text-cmd-text-muted font-medium uppercase tracking-wider">Clearance L3</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-cmd-card border border-cmd-border flex items-center justify-center hover:bg-cmd-border transition-colors outline-none focus:ring-2 focus:ring-cmd-info/50">
            <User className="w-4 h-4 text-cmd-text-secondary" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
