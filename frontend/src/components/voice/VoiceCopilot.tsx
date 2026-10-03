"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { apiClient } from "@/lib/api";

function VoiceCopilotInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string; data?: any }[]>([]);

  const addLog = (type: string, message: string, data?: any) => {
    setLogs((prev) => [...prev, { type, message, data }]);
  };

  const conversation = useConversation({
    onConnect: () => {
      addLog("status", "Connected to RELOCATE AI Voice Copilot.");
    },
    onDisconnect: () => {
      addLog("status", "Disconnected.");
    },
    onMessage: (message: any) => {
      // Message contains transcript and role
      if (message && message.text) {
        addLog(message.source === "ai" ? "agent" : "user", message.text);
      }
    },
    onError: (error: any) => {
      addLog("error", `Error: ${typeof error === 'string' ? error : error.message || 'Unknown error'}`);
    },
    clientTools: {
      get_highest_risk_habitation: async () => {
        addLog("tool", "Executing: get_highest_risk_habitation");
        try {
          const habitations = await apiClient.get("/habitations/");
          habitations.sort((a: any, b: any) => (b.rpi || 0) - (a.rpi || 0));
          const highest = habitations[0];
          if (!highest) return JSON.stringify({ error: "No habitations found." });
          
          const result = {
            habitation_id: highest.id,
            name: highest.name,
            risk_score: highest.rpi,
            risk_category: highest.risk_category,
            hazard_score: highest.hazard_score,
            exposure_score: highest.exposure_score,
            vulnerability_score: highest.vulnerability_score,
            population: highest.population,
            data_source: "Synthetic Demo Data"
          };
          addLog("result", "Highest Risk Habitation Found", result);
          return JSON.stringify(result);
        } catch (err: any) {
          addLog("error", "Failed to get highest risk habitation", err.message);
          return JSON.stringify({ error: "Backend failed." });
        }
      },

      explain_habitation_risk: async ({ habitation_id }: { habitation_id: string }) => {
        addLog("tool", `Executing: explain_habitation_risk (${habitation_id})`);
        try {
          const explanation = await apiClient.get(`/habitations/${habitation_id}/explain`);
          addLog("result", `Risk Explanation for ${habitation_id}`, explanation);
          return JSON.stringify(explanation);
        } catch (err: any) {
          addLog("error", `Failed to explain risk for ${habitation_id}`, err.message);
          return JSON.stringify({ error: "Backend failed or habitation not found." });
        }
      },

      find_suitable_relocation_sites: async ({ habitation_id }: { habitation_id: string }) => {
        addLog("tool", `Executing: find_suitable_relocation_sites (${habitation_id})`);
        try {
          const response = await apiClient.get(`/safe_sites/compare?habitation_id=${habitation_id}&format=detailed`);
          const topSites = response.ranked_safe_sites.slice(0, 3).map((site: any) => ({
            site_id: site.id,
            name: site.name,
            suitability_score: site.suitability_score,
            distance_km: site.distance_km,
            reasons: site.reasons_for_ranking,
            status: "Candidate Site"
          }));
          const result = { top_candidates: topSites };
          addLog("result", `Suitable Sites for ${habitation_id}`, result);
          return JSON.stringify(result);
        } catch (err: any) {
          addLog("error", `Failed to find sites for ${habitation_id}`, err.message);
          return JSON.stringify({ error: "Backend failed." });
        }
      },

      check_site_capacity: async ({ site_id, incoming_population }: { site_id: string, incoming_population: number }) => {
        addLog("tool", `Executing: check_site_capacity (${site_id}, pop: ${incoming_population})`);
        try {
          const response = await apiClient.get(`/capacity/analyze?site_id=${site_id}&incoming_population=${incoming_population}`);
          const result = {
            site_id: response.site_id,
            overall_planning_capacity: response.overall_capacity_people,
            incoming_population: response.incoming_population,
            remaining_capacity: response.remaining_capacity,
            capacity_status: response.capacity_status,
            binding_bottleneck: response.binding_constraint?.dimension || "None",
            disclaimer: response.disclaimer
          };
          addLog("result", `Capacity for ${site_id}`, result);
          return JSON.stringify(result);
        } catch (err: any) {
          addLog("error", `Failed to check capacity for ${site_id}`, err.message);
          return JSON.stringify({ error: "Backend failed." });
        }
      },

      run_scenario_simulation: async ({ baseline_rainfall_mm, scenario_rainfall_mm }: { baseline_rainfall_mm: number, scenario_rainfall_mm: number }) => {
        addLog("tool", `Executing: run_scenario_simulation (baseline: ${baseline_rainfall_mm}, scenario: ${scenario_rainfall_mm})`);
        try {
          const response = await apiClient.post("/simulation/run-scenario", { baseline_rainfall_mm, scenario_rainfall_mm });
          const result = {
            baseline: response.baseline,
            scenario: response.scenario,
            impact: response.impact,
            disclaimer: "This simulation is illustrative and is not a validated disaster forecast."
          };
          addLog("result", "Simulation Results", result);
          return JSON.stringify(result);
        } catch (err: any) {
          addLog("error", "Failed to run simulation", err.message);
          return JSON.stringify({ error: "Backend failed." });
        }
      },

      generate_command_briefing: async () => {
        addLog("tool", "Executing: generate_command_briefing");
        try {
          const response = await apiClient.post("/voice/action-plan-briefing/text", {});
          addLog("result", "Command Briefing", { briefing: response.briefing_text });
          return JSON.stringify({
            briefing_text: response.briefing_text,
            status: "Success"
          });
        } catch (err: any) {
          addLog("error", "Failed to generate briefing", err.message);
          return JSON.stringify({ error: "Backend failed." });
        }
      }
    }
  });

  const handleStart = async () => {
    try {
      // We request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId) {
        addLog("error", "NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not configured in .env.local");
        return;
      }
      
      addLog("status", "Connecting to agent...");
      await conversation.startSession({ agentId });
    } catch (err: any) {
      addLog("error", `Microphone or connection error: ${err.message}`);
    }
  };

  const handleStop = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
        title="Talk to RELOCATE AI"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {/* Voice Workspace Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full bg-cmd-bg border-l border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">VOICE COPILOT</h2>
                <p className="text-xs text-blue-400 font-medium">Powered by ElevenLabs</p>
              </div>
              <button
                onClick={() => {
                  if (conversation.status === "connected") {
                    handleStop();
                  }
                  setIsOpen(false);
                }}
                className="text-cmd-text-muted hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Conversation Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cmd-bg/50">
              {logs.length === 0 && (
                <div className="text-center text-cmd-text-muted mt-10">
                  <p>Ready to assist with disaster intelligence.</p>
                  <p className="text-sm mt-2">Click the button below to start.</p>
                </div>
              )}
              {logs.map((log, index) => (
                <div key={index} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}>
                  {log.type === 'status' && (
                    <span className="text-xs text-cmd-text-muted mx-auto bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">{log.message}</span>
                  )}
                  {log.type === 'error' && (
                    <div className="bg-red-900/40 border border-red-800 text-red-200 text-sm px-4 py-2 rounded-lg max-w-[85%]">
                      {log.message}
                    </div>
                  )}
                  {log.type === 'tool' && (
                    <div className="flex items-center text-xs text-indigo-400 font-mono mt-2 mb-1">
                      <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {log.message}
                    </div>
                  )}
                  {log.type === 'user' && (
                    <div className="bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                      {log.message}
                    </div>
                  )}
                  {log.type === 'agent' && (
                    <div className="bg-slate-700 text-slate-100 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">
                      {log.message}
                    </div>
                  )}
                  {log.type === 'result' && log.data && (
                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 max-w-full text-xs font-mono overflow-x-auto shadow-inner text-green-400 mt-1 mb-2">
                      <div className="text-cmd-text-muted mb-1 border-b border-slate-700 pb-1 flex justify-between">
                        <span>{log.message}</span>
                        <span className="text-blue-400 ml-2">DEMO DATA</span>
                      </div>
                      <pre>{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Controls Area */}
            <div className="p-6 border-t border-slate-700 bg-slate-800 flex flex-col items-center">
              <div className="mb-4 text-xs font-medium uppercase tracking-widest text-cmd-text-muted flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${conversation.status === 'connected' ? (conversation.isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-blue-400') : 'bg-slate-600'}`}></span>
                {conversation.status === 'connected' ? (conversation.isSpeaking ? 'Agent Speaking' : 'Listening...') : 'Disconnected'}
              </div>

              {conversation.status === 'connected' ? (
                <button
                  onClick={handleStop}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span>END CONVERSATION</span>
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>START VOICE COPILOT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function VoiceCopilot() {
  return (
    <ConversationProvider>
      <VoiceCopilotInner />
    </ConversationProvider>
  );
}
