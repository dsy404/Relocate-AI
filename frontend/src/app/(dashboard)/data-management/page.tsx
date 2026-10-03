'use client';

import React, { useState, useEffect } from 'react';
import IngestionWizard from '@/components/data-management/IngestionWizard';
import { API_BASE_URL } from '@/lib/api';
import { Database, Download, RefreshCw, FileText, Map, AlertCircle, CheckCircle, DatabaseZap } from 'lucide-react';

interface DatasetRecord {
  id: string;
  name: string;
  source: string;
  data_type: string;
  original_filename: string;
  upload_date: string;
  record_count: number;
  crs: string;
  geometry_type: string;
  missing_values_count: number;
  invalid_records_count: number;
  validation_status: string;
  processing_status: string;
  is_real: boolean;
}

export default function DataManagementPage() {
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/datasets`);
      if (!res.ok) throw new Error(`Failed to fetch datasets (${res.status})`);
      const data = await res.json();
      setDatasets(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load datasets from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const downloadTemplate = (filename: string) => {
    window.open(`${API_BASE_URL}/datasets/templates/${filename}`, '_blank');
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-cmd-border">
        <div>
          <h1 className="text-3xl font-extrabold text-cmd-text tracking-tight mb-2">Geospatial Data Management</h1>
          <p className="text-cmd-text-muted font-medium text-sm max-w-2xl leading-relaxed">
            Production-grade ingestion pipeline for CSV and GeoJSON datasets into the disaster relocation engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDatasets}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-cmd-text-secondary bg-cmd-card border border-cmd-border rounded-lg hover:bg-cmd-secondary hover:border-slate-400 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cmd-info' : 'text-cmd-text-muted'}`} />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Downloadable reference templates bar */}
      <div className="bg-cmd-info/10/50 border border-blue-100 rounded-2xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cmd-card border border-cmd-info/30 text-cmd-info rounded-xl shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-950 mb-1">Download Real Ingestion Templates</h3>
            <p className="text-xs font-medium text-blue-800/80 leading-relaxed max-w-xl">
              Test ingestion with sample datasets containing arbitrary column names, multi-hazard values, and coordinates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => downloadTemplate('sample_habitations.csv')}
            className="px-3.5 py-2 bg-cmd-card border border-cmd-info/30 hover:border-cmd-info/50 hover:shadow-md text-blue-900 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            Habitations (CSV)
          </button>
          <button
            onClick={() => downloadTemplate('sample_habitations.geojson')}
            className="px-3.5 py-2 bg-cmd-card border border-cmd-info/30 hover:border-cmd-info/50 hover:shadow-md text-blue-900 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <Map className="w-4 h-4 text-blue-500" />
            Habitations (GeoJSON)
          </button>
          <button
            onClick={() => downloadTemplate('sample_hazards.geojson')}
            className="px-3.5 py-2 bg-cmd-card border border-cmd-info/30 hover:border-cmd-info/50 hover:shadow-md text-blue-900 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Hazards (GeoJSON)
          </button>
          <button
            onClick={() => downloadTemplate('sample_candidate_sites.csv')}
            className="px-3.5 py-2 bg-cmd-card border border-cmd-info/30 hover:border-cmd-info/50 hover:shadow-md text-blue-900 text-xs font-semibold rounded-lg transition-all flex items-center gap-2"
          >
            <Map className="w-4 h-4 text-emerald-500" />
            Candidate Sites (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        <IngestionWizard onImportSuccess={fetchDatasets} />

        {/* Active Registry Table */}
        <div className="bg-cmd-card rounded-2xl shadow-sm border border-cmd-border overflow-hidden">
          <div className="px-6 py-5 border-b border-cmd-border/50 flex items-center justify-between bg-cmd-secondary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <DatabaseZap className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-cmd-text tracking-tight">Active Datasets Registry</h2>
                <p className="text-xs font-medium text-cmd-text-muted mt-0.5">
                  All registered synthetic baselines and user-ingested real datasets.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-slate-200/70 text-cmd-text-secondary px-3 py-1.5 rounded-lg border border-cmd-border">
              {datasets.length} Total Datasets
            </span>
          </div>

          {error && (
            <div className="p-4 bg-cmd-critical/10 text-cmd-critical text-sm font-medium border-b border-rose-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-cmd-card text-cmd-text-muted text-[11px] font-bold uppercase tracking-wider border-b border-cmd-border">
                <tr>
                  <th className="px-6 py-4">Dataset Name & Source</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4">CRS / Geometry</th>
                  <th className="px-6 py-4 text-right">Records</th>
                  <th className="px-6 py-4 text-center">Data Origin</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Uploaded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-cmd-text-secondary">
                {datasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-cmd-secondary transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-cmd-text">{ds.name}</div>
                      <div className="text-[11px] font-medium text-cmd-text-muted mt-0.5">{ds.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-cmd-secondary/50 border border-cmd-border text-cmd-text-secondary px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide">
                        {ds.data_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 uppercase font-mono font-bold text-xs text-cmd-text-secondary">
                      {ds.original_filename?.split('.').pop() || 'GEOJSON'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[11px] font-bold text-cmd-text-secondary">{ds.crs || 'EPSG:4326'}</div>
                      <div className="text-[11px] font-medium text-cmd-text-muted capitalize">{ds.geometry_type || 'Point'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-cmd-text">{ds.record_count?.toLocaleString() || 0}</div>
                      {((ds.invalid_records_count || 0) > 0 || (ds.missing_values_count || 0) > 0) && (
                        <div className="text-[10px] font-bold text-cmd-warning uppercase tracking-widest mt-1">
                          {(ds.invalid_records_count || 0) + (ds.missing_values_count || 0)} Anomalies
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ds.is_real ? (
                        <span className="bg-cmd-success/10 text-cmd-success text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-cmd-success/30 tracking-wide">
                          Real Data
                        </span>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-indigo-200 tracking-wide">
                          Synthetic
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide border ${
                            ds.validation_status === 'VALIDATED' || ds.validation_status === 'STANDARDIZED' || ds.validation_status === 'READY'
                              ? 'bg-cmd-success/10 text-cmd-success border-cmd-success/30'
                              : ds.validation_status === 'FAILED'
                              ? 'bg-cmd-critical/10 text-cmd-critical border-cmd-critical/30'
                              : 'bg-cmd-warning/10 text-cmd-warning border-cmd-warning/30'
                          }`}
                        >
                          {ds.validation_status || 'READY'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cmd-text-muted">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {ds.processing_status || 'READY'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] font-medium text-cmd-text-muted whitespace-nowrap">
                      {ds.upload_date ? new Date(ds.upload_date).toLocaleDateString() : 'Baseline'}
                    </td>
                  </tr>
                ))}
                {datasets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-cmd-text-muted font-medium">
                      No datasets registered. Upload a CSV or GeoJSON dataset above to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
