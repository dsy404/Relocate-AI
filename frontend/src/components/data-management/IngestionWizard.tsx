"use client";

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

interface InspectionResult {
  filename: string;
  original_filename: string;
  format: string;
  category: string;
  total_records: number;
  headers: string[];
  sample_rows: any[];
  suggested_mapping: Record<string, string>;
  detected_crs: string;
  geometry_type: string;
  content: string;
}

interface ValidationResult {
  status: string;
  category: string;
  valid_count: number;
  invalid_count: number;
  missing_values_count: number;
  errors: Array<{ row: number; field: string; message: string }>;
  can_import: boolean;
  sample_valid: any[];
}

interface IngestionWizardProps {
  onImportSuccess?: () => void;
}

export default function IngestionWizard({ onImportSuccess }: IngestionWizardProps) {
  // Step tracker: 1: Upload, 2: Preview, 3: Mapping, 4: Validation, 5: Complete
  const [step, setStep] = useState<number>(1);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("habitations");
  const [datasetName, setDatasetName] = useState<string>("");
  const [source, setSource] = useState<string>("Field Survey / Official Source");

  // Inspection & Mapping states
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Validation & Import states
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Status & Error
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Target Canonical Fields based on Category
  const getTargetFields = (cat: string) => {
    if (cat === "habitations" || cat === "population") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "name", label: "Village / Habitation Name (Required)" },
        { key: "latitude", label: "Latitude (Required, [-90, 90])" },
        { key: "longitude", label: "Longitude (Required, [-180, 180])" },
        { key: "population", label: "Population (Required, Integer >= 0)" },
        { key: "households", label: "Households (Integer)" },
        { key: "elevation", label: "Elevation (Meters)" },
        { key: "slope", label: "Slope (Degrees)" },
        { key: "aspect", label: "Aspect (Degrees)" },
      ];
    } else if (cat === "hazards" || cat === "flood") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "type", label: "Hazard Type (e.g. Flood, Landslide) (Required)" },
        { key: "severity", label: "Severity (High, Moderate, Low) (Required)" },
        { key: "latitude", label: "Centroid Latitude" },
        { key: "longitude", label: "Centroid Longitude" },
      ];
    } else if (cat === "administrative") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "name", label: "Region / Boundary Name (Required)" },
        { key: "level", label: "Admin Level (e.g., District, State)" },
        { key: "latitude", label: "Centroid Latitude" },
        { key: "longitude", label: "Centroid Longitude" },
      ];
    } else if (cat === "healthcare" || cat === "candidate_sites") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "name", label: "Facility / Site Name (Required)" },
        { key: "latitude", label: "Latitude (Required)" },
        { key: "longitude", label: "Longitude (Required)" },
        { key: "capacity", label: "Capacity (Beds/Score)" },
        { key: "type", label: "Type (Hospital, Clinic, Camp)" },
      ];
    } else if (cat === "roads") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "name", label: "Road Name (Required)" },
        { key: "type", label: "Road Type (Highway, Local)" },
        { key: "status", label: "Status (Open, Blocked)" },
      ];
    } else if (cat === "dem") {
      return [
        { key: "__ignore__", label: "-- Ignore this column --" },
        { key: "name", label: "Raster Name (Required)" },
        { key: "resolution", label: "Resolution (Meters)" },
      ];
    }
    
    // Fallback
    return [
      { key: "__ignore__", label: "-- Ignore this column --" },
      { key: "name", label: "Name (Required)" },
      { key: "latitude", label: "Latitude (Required)" },
      { key: "longitude", label: "Longitude (Required)" },
    ];
  };

  // ── Step 1 Handler: Inspect ──────────────────────────────────────────
  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a valid CSV or GeoJSON file.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/inspect`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Inspection failed.");
      }

      setInspection(data);
      setDatasetName(file.name.replace(/\.[^/.]+$/, ""));
      // Initialize column mapping from suggested mapping or default to ignore
      const initialMapping: Record<string, string> = {};
      data.headers.forEach((h: string) => {
        initialMapping[h] = data.suggested_mapping[h] || "__ignore__";
      });
      setColumnMapping(initialMapping);
      setStep(2); // Go to Preview & Schema step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 Handler: Validate ─────────────────────────────────────────
  const handleValidate = async () => {
    if (!inspection) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          format: inspection.format,
          column_mapping: columnMapping,
          crs: inspection.detected_crs,
          content: inspection.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Validation failed.");
      }

      setValidation(data);
      setStep(4); // Move to Validation Results step
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4 Handler: Clean, Import & Recalculate ───────────────────────
  const handleImport = async () => {
    if (!inspection) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/datasets/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          format: inspection.format,
          column_mapping: columnMapping,
          dataset_name: datasetName || inspection.original_filename,
          source,
          original_filename: inspection.original_filename,
          crs: inspection.detected_crs,
          content: inspection.content,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Import failed.");
      }

      setImportResult(data);
      setStep(5); // Complete!
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset wizard
  const handleReset = () => {
    setStep(1);
    setFile(null);
    setInspection(null);
    setValidation(null);
    setImportResult(null);
    setError("");
  };

  return (
    <div className="bg-cmd-card rounded-xl shadow-sm border border-cmd-border overflow-hidden">
      {/* Wizard Step Progress Bar */}
      <div className="bg-cmd-secondary border-b border-cmd-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-cmd-text-secondary">Real Data Ingestion Wizard</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Step {step} of 5
            </span>
          </div>
          <div className="flex space-x-1 text-xs">
            {["Upload", "Preview", "Map Columns", "Validate", "Recalculate"].map((label, idx) => (
              <span
                key={label}
                className={`px-2 py-1 rounded ${
                  step === idx + 1
                    ? "bg-blue-600 text-white font-bold"
                    : step > idx + 1
                    ? "bg-green-100 text-green-800 font-medium"
                    : "text-gray-400 bg-cmd-secondary/50"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-cmd-critical/10 border-l-4 border-red-500 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-cmd-critical mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* ── STEP 1: UPLOAD & REFERENCE TEMPLATES ── */}
        {step === 1 && (
          <form onSubmit={handleInspect} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-cmd-text-secondary mb-1">Target Data Category</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-cmd-card shadow-sm font-medium"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <optgroup label="Core Relocation Models">
                  <option value="habitations">Population & Demographics (Villages, Wards)</option>
                  <option value="hazards">Flood & Hazard Polygons</option>
                  <option value="candidate_sites">Candidate Relocation Sites</option>
                </optgroup>
                <optgroup label="Supplementary Geospatial Layers">
                  <option value="administrative">Administrative Boundaries</option>
                  <option value="dem">DEM / Elevation (GeoTIFF / Raster)</option>
                  <option value="roads">Road Network</option>
                  <option value="healthcare">Healthcare & Essential Facilities</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-cmd-text-secondary mb-1">Select File (CSV or GeoJSON)</label>
              <input
                type="file"
                accept=".csv,.geojson,.json"
                className="w-full p-3 border border-dashed border-cmd-border rounded-lg bg-cmd-secondary text-sm cursor-pointer hover:bg-cmd-secondary/50"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-cmd-text-muted mt-1">
                Upload raw CSV or GeoJSON. You can map arbitrary field names in Step 3.
              </p>
            </div>

            {/* Template Download Section */}
            <div className="bg-cmd-info/10 border border-cmd-info/30 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2">
                Download Reference Templates:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href={`${API_BASE_URL}/datasets/templates/habitations.csv`}
                  download
                  className="bg-cmd-card px-3 py-1.5 border border-cmd-info/50 rounded text-cmd-info font-medium hover:bg-blue-100 shadow-sm"
                >
                  📥 Habitations CSV Template
                </a>
                <a
                  href={`${API_BASE_URL}/datasets/templates/habitations.geojson`}
                  download
                  className="bg-cmd-card px-3 py-1.5 border border-cmd-info/50 rounded text-cmd-info font-medium hover:bg-blue-100 shadow-sm"
                >
                  📥 Habitations GeoJSON Template
                </a>
                <a
                  href={`${API_BASE_URL}/datasets/templates/hazards.geojson`}
                  download
                  className="bg-cmd-card px-3 py-1.5 border border-cmd-info/50 rounded text-cmd-info font-medium hover:bg-blue-100 shadow-sm"
                >
                  📥 Hazards GeoJSON Template
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow disabled:opacity-50 transition-colors"
            >
              {loading ? "Inspecting File Structure..." : "Inspect Schema & Preview Data →"}
            </button>
          </form>
        )}

        {/* ── STEP 2: SCHEMA INSPECTION & PREVIEW ── */}
        {step === 2 && inspection && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-cmd-secondary p-4 rounded-lg border border-cmd-border text-sm">
              <div>
                <p className="text-xs text-cmd-text-muted font-semibold">Format Detected</p>
                <p className="font-bold text-cmd-text uppercase">{inspection.format}</p>
              </div>
              <div>
                <p className="text-xs text-cmd-text-muted font-semibold">Record Count</p>
                <p className="font-bold text-cmd-text">{inspection.total_records}</p>
              </div>
              <div>
                <p className="text-xs text-cmd-text-muted font-semibold">Detected CRS</p>
                <p className="font-bold text-cmd-text">{inspection.detected_crs}</p>
              </div>
              <div>
                <p className="text-xs text-cmd-text-muted font-semibold">Geometry Type</p>
                <p className="font-bold text-cmd-text">{inspection.geometry_type}</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2">Raw Data Preview (First {inspection.sample_rows.length} rows):</h3>
              <div className="overflow-x-auto max-h-60 border border-cmd-border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-cmd-secondary/50 uppercase text-gray-600 sticky top-0">
                    <tr>
                      {inspection.headers.map((h) => (
                        <th key={h} className="px-3 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-cmd-card font-mono">
                    {inspection.sample_rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-cmd-secondary">
                        {inspection.headers.map((h) => (
                          <td key={h} className="px-3 py-1.5 whitespace-nowrap text-cmd-text-secondary">
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : <span className="text-red-300 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-cmd-secondary"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg shadow"
              >
                Proceed to Column Mapping →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: COLUMN / FIELD MAPPING ── */}
        {step === 3 && inspection && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-cmd-text text-base">Map Your File Columns to System Schema</h3>
              <p className="text-xs text-cmd-text-muted mt-0.5">
                Ensure required fields (Name, Coordinates, Population) are mapped appropriately.
              </p>
            </div>

            <div className="space-y-3 bg-cmd-secondary p-4 rounded-lg border border-cmd-border">
              {inspection.headers.map((header) => {
                const mappedVal = columnMapping[header] || "__ignore__";
                return (
                  <div key={header} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cmd-border pb-2.5">
                    <div className="sm:w-1/2">
                      <span className="font-mono text-sm font-bold text-gray-800">{header}</span>
                      <span className="text-xs text-gray-400 block">Sample: {String(inspection.sample_rows[0]?.[header] ?? "N/A")}</span>
                    </div>
                    <div className="sm:w-1/2">
                      <select
                        className={`w-full p-2 border rounded-md text-xs font-semibold ${
                          mappedVal !== "__ignore__" ? "border-blue-500 bg-cmd-info/10/40 text-blue-900" : "bg-cmd-card text-cmd-text-muted"
                        }`}
                        value={mappedVal}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [header]: e.target.value })
                        }
                      >
                        {getTargetFields(category).map((target) => (
                          <option key={target.key} value={target.key}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-cmd-secondary"
              >
                ← Back to Preview
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleValidate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg shadow"
              >
                {loading ? "Validating Records..." : "Validate & Detect Anomalies →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: VALIDATION RESULTS & ANOMALIES ── */}
        {step === 4 && validation && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-cmd-success/10 border border-cmd-success/30 p-4 rounded-lg">
                <p className="text-xs text-green-700 font-bold uppercase">Valid Records</p>
                <p className="text-3xl font-black text-green-700 mt-1">{validation.valid_count}</p>
              </div>
              <div className={`p-4 rounded-lg border ${validation.invalid_count > 0 ? "bg-cmd-critical/10 border-cmd-critical/30 text-cmd-critical" : "bg-cmd-secondary border-cmd-border text-gray-400"}`}>
                <p className="text-xs font-bold uppercase">Invalid Records</p>
                <p className="text-3xl font-black mt-1">{validation.invalid_count}</p>
              </div>
              <div className="bg-cmd-warning/10 border border-cmd-warning/30 p-4 rounded-lg text-amber-800">
                <p className="text-xs font-bold uppercase">Missing Field Values</p>
                <p className="text-3xl font-black mt-1">{validation.missing_values_count}</p>
              </div>
            </div>

            {/* Error alerts if invalid records exist */}
            {validation.errors.length > 0 && (
              <div className="bg-cmd-critical/10 border border-cmd-critical/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Validation Errors Detected:</h4>
                <ul className="text-xs text-cmd-critical space-y-1 list-disc pl-4 font-mono">
                  {validation.errors.map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dataset Metadata Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-cmd-secondary p-4 rounded-lg border border-cmd-border">
              <div>
                <label className="block text-xs font-bold text-cmd-text-secondary mb-1">Dataset Name</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded text-xs bg-cmd-card"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cmd-text-secondary mb-1">Source / Authority</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded text-xs bg-cmd-card"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-cmd-secondary"
              >
                ← Back to Mapping
              </button>
              <button
                type="button"
                disabled={loading || !validation.can_import}
                onClick={handleImport}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg shadow disabled:opacity-50"
              >
                {loading ? "Importing & Recalculating..." : `Clean, Standardize & Import ${validation.valid_count} Records →`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: IMPORT & RECALCULATION COMPLETE ── */}
        {step === 5 && importResult && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-cmd-success rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-black text-cmd-text">Real Data Ingestion & Recalculation Complete!</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {importResult.message}
            </p>

            <div className="inline-block bg-cmd-secondary border border-cmd-border rounded-lg p-4 text-xs font-mono text-cmd-text-secondary">
              <p>Imported Records: <b>{importResult.imported_count}</b></p>
              <p>Total Habitations in System: <b>{importResult.total_system_habitations}</b></p>
              <p>Analytical Engines: <b>MasterEngine + Necessity + Optimizer Re-executed</b></p>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <a
                href="/risk-map"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm shadow"
              >
                View on Risk Map
              </a>
              <a
                href="/dashboard"
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-2 rounded-lg text-sm shadow"
              >
                View Action Plan Dashboard
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="border border-cmd-border text-cmd-text-secondary px-4 py-2 rounded-lg text-sm hover:bg-cmd-secondary"
              >
                Ingest Another Dataset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
