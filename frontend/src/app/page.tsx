"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Map, ShieldAlert, Activity, Target, ClipboardList, CheckSquare, Users, Bell, CloudRain, Brain, Mic, MapPin, Search, Layers, Zap
} from 'lucide-react';

const workflowStages = [
  {
    id: 1,
    title: "IDENTIFY RISK",
    desc: "Locate high-risk and multi-hazard affected habitations.",
    detail: "Geospatial scanning of flood plains, landslide zones, and historic incident areas to isolate vulnerable populations.",
  },
  {
    id: 2,
    title: "UNDERSTAND VULNERABILITY",
    desc: "Assess population exposure, infrastructure, and vulnerability factors.",
    detail: "Deep analysis of household density, critical facility proximity, and socioeconomic vulnerability indices.",
  },
  {
    id: 3,
    title: "ASSESS RELOCATION NEED",
    desc: "Determine whether relocation may be required and how urgently.",
    detail: "Algorithmic necessity classification driving Immediate, Planned, or Monitoring status.",
  },
  {
    id: 4,
    title: "FIND SAFE SITES",
    desc: "Evaluate candidate relocation sites using safety, accessibility, terrain, and infrastructure factors.",
    detail: "Geospatial filtering for slope stability, road access, and distance from hazard zones.",
  },
  {
    id: 5,
    title: "CHECK CAPACITY",
    desc: "Determine whether a candidate site can support the incoming population.",
    detail: "Infrastructure bottleneck analysis and carrying capacity estimation for the proposed site.",
  },
  {
    id: 6,
    title: "RECOMMEND ACTION",
    desc: "Connect risk assessment, relocation necessity, candidate sites, and capacity analysis into an actionable government planning workflow.",
    detail: "Automated routing and assignment optimization for maximum safety and minimal disruption.",
  }
];

const capabilities = [
  { icon: Map, title: "GEOSPATIAL RISK INTELLIGENCE", desc: "Identify and visualize habitation-level hazard and risk information." },
  { icon: Target, title: "EXPLAINABLE RISK ASSESSMENT", desc: "Understand the contributions of hazard, exposure, and vulnerability when the required data is available." },
  { icon: ShieldAlert, title: "RELOCATION NECESSITY", desc: "Review relocation urgency and the evidence supporting the assessment." },
  { icon: CheckSquare, title: "SAFE-SITE SUITABILITY", desc: "Compare potential destinations using supported safety and infrastructure criteria." },
  { icon: Layers, title: "CARRYING-CAPACITY ANALYSIS", desc: "Review site capacity estimates and infrastructure constraints." },
  { icon: Zap, title: "RELOCATION OPTIMIZATION", desc: "Support the assignment of affected populations to feasible destinations where the implemented planning logic permits." },
  { icon: Activity, title: "FIELD VERIFICATION", desc: "Record and review on-the-ground findings where the feature is implemented." },
  { icon: CloudRain, title: "SCENARIO SIMULATION", desc: "Explore supported illustrative scenarios without misrepresenting them as validated forecasts." }
];

import dynamic from 'next/dynamic';

const LandingMap = dynamic(() => import('@/components/map/LandingMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0f1c] animate-pulse" />
});

// Abstracted Map Component
const MapVisualization = ({ activeStage }: { activeStage: number }) => {
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      {/* Base Dark Map of India */}
      <LandingMap />
      
      {/* Map Vignette/Overlay for cinematic feel */}
      <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_100px_rgba(10,15,28,1)]"></div>
      
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        {/* Stage 1: Identify Risk (Red Alert) */}
        <AnimatePresence>
          {activeStage >= 1 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-[35%] top-[40%] flex flex-col items-center"
            >
              <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping absolute" />
              <div className="w-4 h-4 bg-rose-600 rounded-full z-10 border-2 border-slate-900" />
              <div className="mt-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded backdrop-blur-md">
                HABITATION 01
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2 & 3: Vulnerability & Urgency (Expanding Risk Radius) */}
        <AnimatePresence>
          {activeStage >= 2 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: activeStage >= 3 ? 1.5 : 1 }}
               className="absolute left-[35%] top-[40%] w-32 h-32 -ml-16 -mt-16 rounded-full border-2 border-rose-500/30 bg-rose-500/5 z-0"
             />
          )}
        </AnimatePresence>

        {/* Stage 4: Safe Sites (Green Nodes) */}
        <AnimatePresence>
          {activeStage >= 4 && (
            <>
              <motion.div 
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="absolute left-[65%] top-[30%] flex flex-col items-center"
              >
                <div className="w-4 h-4 bg-emerald-500 rounded-full z-10 border-2 border-slate-900" />
                <div className="mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded backdrop-blur-md">SITE A</div>
              </motion.div>
              
              <motion.div 
                initial={{ scale: 0, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="absolute left-[55%] top-[60%] flex flex-col items-center"
              >
                <div className="w-4 h-4 bg-emerald-500 rounded-full z-10 border-2 border-slate-900" />
                <div className="mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded backdrop-blur-md">SITE B</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Stage 5: Check Capacity (Amber processing rings) */}
        <AnimatePresence>
          {activeStage >= 5 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-[65%] top-[30%] w-16 h-16 -ml-6 -mt-6 rounded-full border border-amber-400/50 animate-[spin_4s_linear_infinite]"
            />
          )}
        </AnimatePresence>

        {/* Stage 6: Recommend Action (Connecting Line) */}
        <AnimatePresence>
          {activeStage >= 6 && (
            <motion.svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <motion.path 
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                d="M 35% 40% Q 50% 20% 65% 30%"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>

      {/* Disclaimers */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 font-mono">
          GEO_LAT: 23.6345<br/>
          GEO_LNG: 85.5113
        </div>
        <div className="text-[10px] text-slate-500 text-right uppercase">
          Stylized Representation<br/>3D Terrain Limited by Demo Data
        </div>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [activeStage, setActiveStage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll spy logic for stages
  useEffect(() => {
    const handleScroll = () => {
      const stages = document.querySelectorAll('.workflow-stage');
      let currentStage = 0;
      
      stages.forEach((stage, index) => {
        const rect = stage.getBoundingClientRect();
        // If the top of the stage is above the middle of the viewport
        if (rect.top <= window.innerHeight / 2) {
          currentStage = index + 1;
        }
      });
      
      setActiveStage(currentStage);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger immediately
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* ────────────────────────────────────────────────────────────────────────
          NAVIGATION
      ──────────────────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Map className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">RELOCATE AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#workflow" className="hover:text-white transition-colors">Decision Workflow</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
          </nav>

          <Link href="/dashboard" className="px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-full hover:bg-slate-200 transition-colors">
            ENTER PLATFORM &rarr;
          </Link>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────
          HERO SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section id="overview" className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8"
          >
            Geospatial Disaster Decision Intelligence
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
          >
            FROM RISK<br />TO SAFE RELOCATION.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Identify high-risk habitations, understand vulnerability, evaluate candidate destinations, and support relocation planning through explainable geospatial intelligence.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              ENTER PLATFORM &rarr;
            </Link>
            <a href="#workflow" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center border border-slate-700">
              EXPLORE THE WORKFLOW &darr;
            </a>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            DEMO ENVIRONMENT &bull; SYNTHETIC DATA
          </motion.div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          SCROLL-DRIVEN WORKFLOW SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section id="workflow" className="relative bg-[#050810] border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row">
            
            {/* Left Column: Scrolling Content */}
            <div className="w-full md:w-1/2 py-32 space-y-[40vh]">
              {workflowStages.map((stage) => (
                <div key={stage.id} className="workflow-stage flex flex-col justify-center min-h-[50vh]">
                  <div className={`transition-all duration-500 ${activeStage === stage.id ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
                    <div className="text-blue-500 font-mono font-bold text-lg mb-2">STAGE 0{stage.id}</div>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white">{stage.title}</h2>
                    <p className="text-xl text-slate-300 font-medium mb-4 leading-relaxed">{stage.desc}</p>
                    <p className="text-base text-slate-500 leading-relaxed border-l-2 border-slate-700 pl-4">{stage.detail}</p>
                  </div>
                </div>
              ))}
              
              <div className="workflow-stage h-[20vh]" /> {/* Buffer */}
            </div>
            
            {/* Right Column: Sticky Map */}
            <div className="hidden md:block w-full md:w-1/2 relative">
              <div className="sticky top-0 h-screen flex items-center justify-center p-8">
                <div className="w-full aspect-[4/5] max-h-[800px]">
                  <MapVisualization activeStage={activeStage} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          CAPABILITIES SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-32 px-6 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">INTELLIGENCE AT EVERY STEP</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              A comprehensive suite of analytical engines working together to produce explainable and optimized relocation plans.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((cap, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                  <cap.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider">{cap.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          VOICE COPILOT SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-y border-slate-800/50 bg-gradient-to-b from-[#0a0f1c] to-[#050810]">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mx-auto mb-8 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Mic className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">MEET YOUR VOICE COPILOT</h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
              Ask questions about risk, explore relocation options, and understand the available evidence through natural conversation.
            </p>
            
            <div className="flex flex-col gap-3 mb-10 max-w-md mx-auto">
              <div className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-5 text-sm text-slate-300 italic text-left">
                "Which habitation has the highest calculated risk?"
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl py-3 px-5 text-sm text-slate-300 italic text-left">
                "What candidate relocation sites are available?"
              </div>
            </div>
            
            <Link href="/dashboard" className="inline-flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors">
              EXPLORE VOICE COPILOT &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          FINAL CTA
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative overflow-hidden bg-[#0a0f1c]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-blue-600/10 rounded-t-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-8">
            SEE THE RISK.<br/>
            UNDERSTAND THE PEOPLE.<br/>
            PLAN THE NEXT ACTION.
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Explore how RELOCATE AI connects geospatial risk intelligence with relocation planning and supporting evidence.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <Link href="/dashboard" className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-[0_0_30px_rgba(37,99,235,0.4)] text-lg">
              ENTER PLATFORM &rarr;
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-semibold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
              BACK TO TOP &uarr;
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
