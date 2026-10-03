'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { ShieldCheck, MapPin, Search, Filter, CheckCircle2, AlertTriangle, XCircle, Users, Activity, FileText, ArrowRight, Loader2 } from 'lucide-react';

export interface VerificationHabitation {
  id: string;
  name: string;
  population: number;
  households: number;
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  road_accessible: boolean;
  road_status: string;
  water_availability: string;
  housing_condition: string;
  healthcare_accessible: boolean;
  hazard_observation: string;
  verification_status: string;
  risk_score: number;
  risk_category: string;
  hazard_score: number;
  exposure_score: number;
  vulnerability_score: number;
  necessity_category: string;
  last_verified?: string | null;
  verifier_name?: string | null;
}

export interface RecalculationResult {
  verification_id: number;
  habitation: { id: string; name: string };
  status: string;
  verifier: string;
  timestamp: string;
  before: any;
  after: any;
  difference: {
    vulnerability_delta: number;
    hazard_delta: number;
    rpi_delta: number;
    risk_category_changed: boolean;
    necessity_changed: boolean;
    site_changed: boolean;
    road_status_changed: boolean;
  };
  cascading_pipeline_steps: string[];
}

export interface AuditRecord {
  id: number;
  habitation_id: string;
  habitation_name: string;
  verifier_name: string;
  verified_at: string;
  road_status: string;
  water_availability: string;
  housing_condition: string;
  verification_status: string;
  notes: string;
  previous_state: any;
  updated_state: any;
  recalculation_diff: any;
  created_at: string;
}

export default function FieldVerificationPage() {
  const [habitations, setHabitations] = useState<VerificationHabitation[]>([]);
  const [selectedHabId, setSelectedHabId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'FORM' | 'AUDIT'>('FORM');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<AuditRecord[]>([]);

  // Form inputs
  const [verifierName, setVerifierName] = useState('Field Officer Jane Doe');
  const [verificationStatus, setVerificationStatus] = useState('VERIFIED');
  const [roadStatus, setRoadStatus] = useState<'OPEN' | 'BLOCKED' | 'DAMAGED'>('OPEN');
  const [waterAvail, setWaterAvail] = useState('ADEQUATE');
  const [housingCondition, setHousingCondition] = useState('PUCCA_GOOD');
  const [healthcareAccessible, setHealthcareAccessible] = useState(true);
  const [hazardObs, setHazardObs] = useState('NONE');
  const [notes, setNotes] = useState('');

  // Result modal/card
  const [recalcResult, setRecalcResult] = useState<RecalculationResult | null>(null);

  const fetchHabitations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/field-verification/habitations');
      setHabitations(data);
      if (data.length > 0 && !selectedHabId) {
        setSelectedHabId(data[0].id);
        populateFormFromHab(data[0]);
      }
    } catch (err) {
      console.error('Failed to load habitations for verification:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await apiClient.get('/field-verification/history');
      setHistory(data);
    } catch (err) {
      console.error('Failed to load verification history:', err);
    }
  };

  useEffect(() => {
    fetchHabitations();
    fetchHistory();
  }, []);

  const populateFormFromHab = (hab: VerificationHabitation) => {
    setRoadStatus((hab.road_status as any) || (hab.road_accessible ? 'OPEN' : 'BLOCKED'));
    setWaterAvail(hab.water_availability || 'ADEQUATE');
    setHousingCondition(hab.housing_condition || 'PUCCA_GOOD');
    setHealthcareAccessible(hab.healthcare_accessible !== false);
    setHazardObs(hab.hazard_observation || 'NONE');
    setVerificationStatus(hab.verification_status || 'VERIFIED');
    setNotes('');
  };

  const handleSelectHabitation = (hab: VerificationHabitation) => {
    setSelectedHabId(hab.id);
    populateFormFromHab(hab);
    setRecalcResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabId) return;

    try {
      setSubmitting(true);
      const payload = {
        habitation_id: selectedHabId,
        verifier_name: verifierName,
        road_accessible: roadStatus === 'OPEN',
        road_status: roadStatus,
        water_availability: waterAvail,
        housing_condition: housingCondition,
        healthcare_accessible: healthcareAccessible,
        hazard_observation: hazardObs,
        verification_status: verificationStatus,
        notes: notes,
      };

      const result = await apiClient.post('/field-verification/submit', payload);
      setRecalcResult(result);
      // Refresh local habitations and audit history
      await fetchHabitations();
      await fetchHistory();
    } catch (err: any) {
      console.error('Field verification submission failed:', err);
      alert(`Submission failed: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const currentHab = habitations.find(h => h.id === selectedHabId);

  const filteredHabitations = habitations.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && h.verification_status === filterStatus;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-cmd-border">
        <div>
          <h1 className="text-3xl font-extrabold text-cmd-text tracking-tight mb-2">Field Verification Console</h1>
          <p className="text-cmd-text-muted font-medium text-sm max-w-2xl leading-relaxed">
            Ground-truth verification console with automated cascading recalculation: Field Report → Vulnerability → Hazard → Risk → Necessity → Optimizer.
          </p>
        </div>

        {/* Action / Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-cmd-secondary/50/80 p-1.5 rounded-xl flex gap-1 border border-cmd-border shadow-sm">
            <button
              onClick={() => setActiveTab('FORM')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'FORM' ? 'bg-cmd-card text-cmd-info shadow-sm ring-1 ring-slate-200/50' : 'text-cmd-text-secondary hover:text-cmd-text hover:bg-slate-200/50'}`}
            >
              Verification Console
            </button>
            <button
              onClick={() => { setActiveTab('AUDIT'); fetchHistory(); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'AUDIT' ? 'bg-cmd-card text-cmd-info shadow-sm ring-1 ring-slate-200/50' : 'text-cmd-text-secondary hover:text-cmd-text hover:bg-slate-200/50'}`}
            >
              Audit Trail ({history.length})
            </button>
          </div>
          <Link
            href="/action-plan"
            className="text-xs bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary hover:text-cmd-text px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Action Plan
          </Link>
          <Link
            href="/optimizer"
            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5" />
            Relocation Optimizer
          </Link>
        </div>
      </div>

      {activeTab === 'FORM' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Panel: Habitation Directory */}
          <div className="xl:col-span-4 bg-cmd-card rounded-3xl shadow-sm border border-cmd-border flex flex-col h-[850px] overflow-hidden">
            <div className="p-6 bg-cmd-secondary/50 border-b border-cmd-border space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-cmd-text text-sm tracking-tight flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cmd-text-muted" />
                  Habitation Directory
                </h3>
                <span className="text-xs font-bold text-cmd-text-muted bg-slate-200/50 px-2.5 py-1 rounded-md">{filteredHabitations.length} Total</span>
              </div>
              
              <div className="relative">
                <Search className="w-4 h-4 text-cmd-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-sm font-medium pl-10 pr-4 py-2.5 bg-cmd-card border border-cmd-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-cmd-text-muted"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['ALL', 'VERIFIED', 'NEEDS_VERIFICATION', 'CONFLICTING_DATA', 'OUTDATED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition-all uppercase tracking-wider ${
                      filterStatus === status ? 'bg-slate-800 text-white shadow-sm' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:bg-cmd-secondary/50 hover:text-cmd-text'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 bg-cmd-secondary/30">
              {filteredHabitations.map(hab => {
                const isSelected = hab.id === selectedHabId;
                const isBlocked = hab.road_status === 'BLOCKED' || hab.road_accessible === false;
                return (
                  <div
                    key={hab.id}
                    onClick={() => handleSelectHabitation(hab)}
                    className={`p-5 cursor-pointer transition-all ${
                      isSelected ? 'bg-cmd-info/10/80 border-l-4 border-blue-600 shadow-sm relative z-10' : 'hover:bg-cmd-card border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-extrabold text-cmd-text text-sm tracking-tight">{hab.name}</div>
                      <span className="text-[10px] font-bold text-cmd-text-muted bg-cmd-secondary/50 px-2 py-0.5 rounded uppercase tracking-wider">{hab.id}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold text-cmd-text-secondary flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cmd-text-muted" />
                        {hab.population}
                      </span>
                      <span className="text-xs font-black text-cmd-critical flex items-center gap-1 bg-cmd-critical/10 px-2 py-0.5 rounded-md">
                        RPI: {hab.risk_score.toFixed(1)}
                      </span>
                      {isBlocked ? (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-rose-100 text-rose-800 border border-cmd-critical/30 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-cmd-success/30 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Open
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        hab.verification_status === 'VERIFIED' ? 'bg-cmd-success/10 text-cmd-success' :
                        hab.verification_status === 'NEEDS_VERIFICATION' ? 'bg-cmd-warning/10 text-cmd-warning' :
                        'bg-cmd-secondary/50 text-cmd-text-secondary'
                      }`}>
                        {hab.verification_status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-cmd-text-muted uppercase tracking-widest">{hab.necessity_category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Verification Form & Cascading Impact Modal */}
          <div className="xl:col-span-8 space-y-8">
            {currentHab ? (
              <form onSubmit={handleSubmit} className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border overflow-hidden">
                
                {/* Habitation Banner */}
                <div className="bg-cmd-bg text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-20 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black tracking-tight">{currentHab.name}</h2>
                      <span className="text-xs font-bold uppercase tracking-widest bg-cmd-card/10 text-white px-2.5 py-1 rounded-md border border-white/20">
                        {currentHab.id}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-300 flex flex-wrap items-center gap-4">
                      <span><span className="text-cmd-text-muted">Lat:</span> {currentHab.latitude.toFixed(4)}</span>
                      <span><span className="text-cmd-text-muted">Lng:</span> {currentHab.longitude.toFixed(4)}</span>
                      <span><span className="text-cmd-text-muted">Elev:</span> {currentHab.elevation}m</span>
                      <span><span className="text-cmd-text-muted">Slope:</span> {currentHab.slope}°</span>
                    </p>
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-4 bg-cmd-card/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-cmd-text-muted mb-1">Baseline RPI</div>
                      <div className="text-3xl font-black text-white leading-none">{currentHab.risk_score.toFixed(1)}</div>
                    </div>
                    <div className="w-px h-10 bg-cmd-card/10 mx-2" />
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-cmd-text-muted mb-1">Necessity</div>
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {currentHab.necessity_category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-10">
                  {/* Section 1: Verifier Credentials & Metadata */}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      1. Verifier Identity & Audit Metadata
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Verifier Name / Badge ID</label>
                        <input
                          type="text"
                          required
                          value={verifierName}
                          onChange={e => setVerifierName(e.target.value)}
                          className="w-full text-sm font-semibold p-3 border border-cmd-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Verification Status</label>
                        <div className="relative">
                          <select
                            value={verificationStatus}
                            onChange={e => setVerificationStatus(e.target.value)}
                            className="w-full text-sm font-semibold p-3 pr-10 border border-cmd-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card appearance-none cursor-pointer"
                          >
                            <option value="VERIFIED">Verified (Ground truth confirmed)</option>
                            <option value="NEEDS_VERIFICATION">Needs Verification (Pending follow-up)</option>
                            <option value="CONFLICTING_DATA">Conflicting Data (Discrepancy with satellite)</option>
                            <option value="OUTDATED">Outdated (Seasonal resurvey needed)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-cmd-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Evacuation Road Accessibility Trigger */}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      2. Evacuation Corridor & Transit Accessibility
                    </h3>
                    <div className="bg-cmd-warning/10/50 border border-cmd-warning/30 p-6 rounded-2xl">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="max-w-xl">
                          <span className="text-sm font-bold text-amber-950 block mb-1">Primary Evacuation Road Status</span>
                          <p className="text-xs font-medium text-amber-800/80 leading-relaxed">
                            Reporting a road as blocked or damaged automatically triggers vulnerability escalation (+25 points) and recalculates the overall risk & relocation necessity score.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setRoadStatus('OPEN')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                              roadStatus === 'OPEN' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/10' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:border-cmd-border hover:bg-cmd-secondary'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Road Open
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoadStatus('BLOCKED')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                              roadStatus === 'BLOCKED' ? 'bg-rose-600 text-white shadow-md shadow-rose-900/10' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:border-cmd-border hover:bg-cmd-secondary'
                            }`}
                          >
                            <XCircle className="w-4 h-4" /> Road Blocked
                          </button>
                          <button
                            type="button"
                            onClick={() => setRoadStatus('DAMAGED')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                              roadStatus === 'DAMAGED' ? 'bg-amber-500 text-white shadow-md shadow-amber-900/10' : 'bg-cmd-card text-cmd-text-secondary border border-cmd-border hover:border-cmd-border hover:bg-cmd-secondary'
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" /> Road Damaged
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Socio-Economic Infrastructure */}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      3. Ground-Truth Socio-Economic Observations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Drinking Water</label>
                        <div className="relative">
                          <select
                            value={waterAvail}
                            onChange={e => setWaterAvail(e.target.value)}
                            className="w-full text-sm font-semibold p-3 pr-10 border border-cmd-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card appearance-none cursor-pointer"
                          >
                            <option value="ABUNDANT">Abundant (Protected aquifer)</option>
                            <option value="ADEQUATE">Adequate (Meets 70 LPCD)</option>
                            <option value="SCARCE">Scarce (+15 vuln)</option>
                            <option value="CONTAMINATED">Contaminated (+15 vuln)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-cmd-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Housing Condition</label>
                        <div className="relative">
                          <select
                            value={housingCondition}
                            onChange={e => setHousingCondition(e.target.value)}
                            className="w-full text-sm font-semibold p-3 pr-10 border border-cmd-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card appearance-none cursor-pointer"
                          >
                            <option value="PUCCA_GOOD">Pucca Good (Stable)</option>
                            <option value="SEMI_PUCCA">Semi-Pucca (+10 vuln)</option>
                            <option value="KUTCHA_VULNERABLE">Kutcha Vulnerable (+20 vuln)</option>
                            <option value="DAMAGED">Damaged (+20 vuln)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-cmd-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Healthcare Access</label>
                        <div className="flex items-center h-12 bg-cmd-secondary border border-cmd-border rounded-xl px-4 cursor-pointer" onClick={() => setHealthcareAccessible(!healthcareAccessible)}>
                          <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${healthcareAccessible ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-cmd-card shadow-sm transition-transform ${healthcareAccessible ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                          <span className={`ml-3 text-xs font-bold ${healthcareAccessible ? 'text-cmd-text' : 'text-cmd-text-muted'}`}>
                            {healthcareAccessible ? 'Clinic Route Clear' : 'Route Severed (+10)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Geotechnical & Hazard Observations */}
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cmd-text-muted mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      4. Active Hazard Field Observations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Field Hazard Sighting</label>
                        <div className="relative">
                          <select
                            value={hazardObs}
                            onChange={e => setHazardObs(e.target.value)}
                            className="w-full text-sm font-semibold p-3 pr-10 border border-cmd-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card appearance-none cursor-pointer"
                          >
                            <option value="NONE">None (No active expansion)</option>
                            <option value="RISING_WATER">Rising Water (+25 hazard)</option>
                            <option value="ACTIVE_SLOPE_CRACK">Active Slope Crack (+30 hazard)</option>
                            <option value="DEBRIS_FLOW">Debris Flow (+30 hazard)</option>
                            <option value="FLASH_FLOOD">Flash Flood (+25 hazard)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg className="w-4 h-4 text-cmd-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-cmd-text-secondary mb-2 uppercase tracking-wide">Field Officer Detailed Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Record qualitative observations, culvert conditions..."
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          className="w-full text-sm font-medium p-3 border border-cmd-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all bg-cmd-secondary hover:bg-cmd-card resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="bg-cmd-secondary p-6 md:p-8 border-t border-cmd-border flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-sm transition-all flex items-center gap-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Executing Cascading Recalculation...
                      </>
                    ) : (
                      <>
                        Submit Field Verification & Recalculate
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-cmd-card rounded-3xl p-16 text-center border border-cmd-border border-dashed flex flex-col items-center justify-center h-[400px]">
                <MapPin className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-cmd-text-muted font-medium text-lg">Select a habitation from the directory to start verification.</p>
              </div>
            )}

            {/* Recalculation Impact Proof Card */}
            {recalcResult && (
              <div className="bg-cmd-card rounded-3xl shadow-xl shadow-blue-900/5 border-2 border-blue-500 p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start border-b border-cmd-border/50 pb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-cmd-info bg-cmd-info/10 border border-blue-100 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 mb-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cascading Recalculation Complete
                    </span>
                    <h3 className="text-2xl font-black text-cmd-text tracking-tight">
                      {recalcResult.habitation.name} <span className="text-cmd-text-muted font-bold ml-1 text-lg">({recalcResult.habitation.id})</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setRecalcResult(null)}
                    className="text-cmd-text-muted hover:text-cmd-text transition-colors p-2"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Before vs After Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Vulnerability */}
                  <div className="border border-cmd-border rounded-2xl p-5 bg-cmd-secondary/50">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-cmd-text-muted">Vulnerability Score</span>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-xl font-bold text-cmd-text-muted line-through">
                        {recalcResult.before.vulnerability_score.toFixed(1)}
                      </span>
                      <span className="text-3xl font-black text-cmd-info">
                        {recalcResult.after.vulnerability_score.toFixed(1)}
                      </span>
                      <span className="text-xs font-black text-cmd-critical bg-cmd-critical/10 px-2 py-0.5 rounded-md">
                        +{recalcResult.difference.vulnerability_delta}
                      </span>
                    </div>
                  </div>

                  {/* RPI Risk Score */}
                  <div className="border border-cmd-border rounded-2xl p-5 bg-cmd-secondary/50">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-cmd-text-muted">Relocation Priority (RPI)</span>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-xl font-bold text-cmd-text-muted line-through">
                        {recalcResult.before.rpi.toFixed(1)}
                      </span>
                      <span className="text-3xl font-black text-cmd-critical">
                        {recalcResult.after.rpi.toFixed(1)}
                      </span>
                      <span className="text-xs font-black text-cmd-critical bg-cmd-critical/10 px-2 py-0.5 rounded-md">
                        +{recalcResult.difference.rpi_delta}
                      </span>
                    </div>
                  </div>

                  {/* Relocation Necessity */}
                  <div className="border border-cmd-border rounded-2xl p-5 bg-cmd-secondary/50">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-cmd-text-muted">Relocation Urgency Tier</span>
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-sm font-bold text-cmd-text-muted line-through">
                        {recalcResult.before.necessity_category}
                      </span>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cmd-text-muted" />
                        <span className="text-sm font-black uppercase tracking-wider px-3 py-1 rounded-md bg-rose-100 text-rose-800 border border-cmd-critical/30">
                          {recalcResult.after.necessity_category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Relocation Destination Before vs After */}
                <div className="border border-indigo-100 bg-indigo-50/50 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[11px] uppercase font-black tracking-widest text-indigo-900 block mb-1">Optimizer Destination Allocation Re-Assigned</span>
                    <div className="text-sm text-indigo-950 font-medium flex items-center gap-2 flex-wrap">
                      <span className="line-through opacity-60">{recalcResult.before.assigned_site_name}</span> 
                      <ArrowRight className="w-4 h-4 opacity-50" /> 
                      <span className="font-bold text-indigo-700 bg-cmd-card px-2 py-1 rounded-md shadow-sm border border-indigo-100">{recalcResult.after.assigned_site_name}</span>
                    </div>
                  </div>
                  <Link
                    href="/optimizer"
                    className="text-xs bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    View Optimizer Ledger
                  </Link>
                </div>

                {/* Pipeline Progression Steps */}
                <div className="pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-cmd-text-muted mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    Automated Cascading Execution Log
                  </h4>
                  <div className="bg-cmd-bg border border-slate-800 p-5 rounded-2xl font-mono text-xs space-y-2.5 shadow-inner">
                    {recalcResult.cascading_pipeline_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-emerald-400/90">
                        <span className="text-cmd-text-muted shrink-0 mt-0.5">[{new Date().toLocaleTimeString()}]</span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Audit Trail & Provenance Ledger */}
      {activeTab === 'AUDIT' && (
        <div className="bg-cmd-card rounded-3xl shadow-sm border border-cmd-border overflow-hidden">
          <div className="p-6 md:p-8 bg-cmd-secondary/50 border-b border-cmd-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-cmd-text tracking-tight">Field Verification Audit Trail & Provenance Ledger</h2>
              <p className="text-sm text-cmd-text-muted font-medium mt-1">Non-destructive history preserving original source records and timestamped ground truth submissions.</p>
            </div>
            <button
              onClick={fetchHistory}
              className="text-xs bg-cmd-card text-cmd-text-secondary border border-cmd-border px-4 py-2.5 rounded-xl font-bold hover:bg-cmd-secondary shadow-sm transition-all"
            >
              Refresh Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-cmd-card text-cmd-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-cmd-border">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Habitation</th>
                  <th className="py-4 px-6">Verifier</th>
                  <th className="py-4 px-6">Road Status</th>
                  <th className="py-4 px-6">Verification Status</th>
                  <th className="py-4 px-6">Recalc Impact (Δ)</th>
                  <th className="py-4 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-cmd-secondary/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-cmd-text-muted">
                      {item.verified_at ? new Date(item.verified_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-cmd-text">{item.habitation_name}</div>
                      <span className="text-[10px] text-cmd-text-muted font-bold uppercase tracking-widest">{item.habitation_id}</span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-cmd-text-secondary">{item.verifier_name}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                        item.road_status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' : 
                        item.road_status === 'DAMAGED' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.road_status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] px-2.5 py-1 rounded-md bg-cmd-info/10 text-cmd-info font-bold border border-blue-100 uppercase tracking-wider">
                        {item.verification_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px]">
                      {item.recalculation_diff ? (
                        <div className="flex flex-col gap-1 font-bold">
                          <span className="text-cmd-info bg-cmd-info/10 px-2 py-0.5 rounded w-max">Δ Vuln: +{item.recalculation_diff.vulnerability_delta}</span>
                          <span className="text-cmd-critical bg-cmd-critical/10 px-2 py-0.5 rounded w-max">Δ RPI: +{item.recalculation_diff.rpi_delta}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[11px] font-medium text-cmd-text-muted max-w-[200px] truncate" title={item.notes}>
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
