"use client";

import React, { useEffect, useState } from 'react';
import { BrainCircuit, Loader2, AlertTriangle } from 'lucide-react';
import MLExplanation from '@/components/ml/MLExplanation';
import { apiClient } from '@/lib/api';

export default function MLEvaluationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMLData = async () => {
      try {
        const result = await apiClient.get('/ml/feature-importance');
        setData(result);
      } catch (error) {
        console.error("Failed to fetch ML data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMLData();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-cmd-border">
        <div>
          <h1 className="text-3xl font-extrabold text-cmd-text tracking-tight mb-2 flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-purple-600" />
            Machine Learning Evaluation
          </h1>
          <p className="text-cmd-text-muted font-medium text-sm max-w-2xl leading-relaxed">
            Methodology demonstration for predictive risk classification. Review feature importance and model performance metrics.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-cmd-card rounded-3xl border border-cmd-border border-dashed">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-4" />
          <p className="text-cmd-text-muted font-medium">Evaluating ML model metrics...</p>
        </div>
      ) : data ? (
        <MLExplanation data={data} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-cmd-card rounded-3xl border border-cmd-border border-dashed">
          <AlertTriangle className="w-8 h-8 text-rose-500 mb-4" />
          <p className="text-cmd-text-secondary font-bold">Error loading ML evaluation data.</p>
          <p className="text-cmd-text-muted text-sm mt-1">Please ensure the backend engine is running.</p>
        </div>
      )}
    </div>
  );
}
