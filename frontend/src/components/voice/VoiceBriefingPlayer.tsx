"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────

type VoiceState = "idle" | "loading" | "playing" | "paused" | "error";

interface VoiceBriefingPlayerProps {
  /** The API endpoint path to call (e.g., "/voice/risk-briefing") */
  endpoint: string;
  /** The JSON body to send with the POST request */
  requestBody?: Record<string, unknown>;
  /** Button label when idle */
  idleLabel: string;
  /** Icon/emoji displayed before the label */
  icon: string;
  /** Tooltip text */
  tooltip?: string;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

// ── Component ────────────────────────────────────────────────────────

export default function VoiceBriefingPlayer({
  endpoint,
  requestBody = {},
  idleLabel,
  icon,
  tooltip = "Generate a concise voice briefing from the current system assessment.",
  className = "",
  size = "md",
}: VoiceBriefingPlayerProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fallbackText, setFallbackText] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup function for audio resources
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [cleanup]);

  const handleGenerate = useCallback(async () => {
    // Prevent duplicate requests
    if (state === "loading") return;

    // If currently playing/paused, stop and reset
    if (state === "playing" || state === "paused") {
      cleanup();
      setState("idle");
      return;
    }

    setState("loading");
    setErrorMessage("");
    setFallbackText("");
    cleanup();

    // Create abort controller for this request
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Try to parse error JSON
        let errMsg = "Voice briefing is currently unavailable.";
        let briefingText = "";
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
          briefingText = errData.briefing_text || "";
        } catch {
          // Response wasn't JSON
        }

        setErrorMessage(errMsg);
        if (briefingText) {
          setFallbackText(briefingText);
        }
        setState("error");
        return;
      }

      // Check content type
      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes("audio")) {
        // Server returned JSON instead of audio (e.g., text-only fallback)
        try {
          const data = await response.json();
          setFallbackText(data.briefing_text || "");
          setErrorMessage("Voice audio not available. Briefing text shown below.");
        } catch {
          setErrorMessage("Unexpected response from voice service.");
        }
        setState("error");
        return;
      }

      // Create audio from the blob
      const blob = await response.blob();
      if (blob.size === 0) {
        setErrorMessage("Received empty audio response.");
        setState("error");
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      objectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Audio event handlers
      audio.addEventListener("ended", () => {
        setState("idle");
      });

      audio.addEventListener("error", () => {
        setErrorMessage("Failed to play audio briefing.");
        setState("error");
      });

      // Start playing
      await audio.play();
      setState("playing");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setState("idle");
        return;
      }
      console.error("Voice briefing error:", err);
      setErrorMessage("Failed to connect to voice briefing service.");
      setState("error");
    }
  }, [state, endpoint, requestBody, cleanup]);

  const handlePauseResume = useCallback(() => {
    if (!audioRef.current) return;

    if (state === "playing") {
      audioRef.current.pause();
      setState("paused");
    } else if (state === "paused") {
      audioRef.current.play();
      setState("playing");
    }
  }, [state]);

  const handleRetry = useCallback(() => {
    setState("idle");
    setErrorMessage("");
    setFallbackText("");
    // Trigger generation on next tick
    setTimeout(() => handleGenerate(), 0);
  }, [handleGenerate]);

  // ── Render helpers ─────────────────────────────────────────────────

  const sizeClasses = size === "sm"
    ? "px-3 py-1.5 text-xs gap-1.5"
    : "px-4 py-2 text-sm gap-2";

  const renderButton = () => {
    switch (state) {
      case "idle":
        return (
          <button
            onClick={handleGenerate}
            title={tooltip}
            aria-label={idleLabel}
            className={`
              inline-flex items-center ${sizeClasses} rounded-lg font-medium
              bg-slate-100 text-slate-700 border border-slate-200
              hover:bg-slate-200 hover:border-slate-300
              active:bg-slate-300
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1
              ${className}
            `}
          >
            <span className="text-base" aria-hidden="true">{icon}</span>
            <span>{idleLabel}</span>
          </button>
        );

      case "loading":
        return (
          <button
            disabled
            aria-label="Generating briefing"
            className={`
              inline-flex items-center ${sizeClasses} rounded-lg font-medium
              bg-blue-50 text-blue-600 border border-blue-200
              cursor-wait
              ${className}
            `}
          >
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{endpoint.includes("action-plan") ? "Preparing executive briefing…" : "Generating briefing…"}</span>
          </button>
        );

      case "playing":
        return (
          <div className={`inline-flex items-center gap-1 ${className}`}>
            <button
              onClick={handlePauseResume}
              aria-label="Pause briefing"
              className={`
                inline-flex items-center ${sizeClasses} rounded-lg font-medium
                bg-green-50 text-green-700 border border-green-200
                hover:bg-green-100
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
              `}
            >
              <span className="text-base" aria-hidden="true">🔊</span>
              <span>Playing Briefing</span>
              <span className="ml-1 text-xs opacity-60">⏸</span>
            </button>
            <button
              onClick={() => { cleanup(); setState("idle"); }}
              aria-label="Stop briefing"
              className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" rx="1" />
              </svg>
            </button>
          </div>
        );

      case "paused":
        return (
          <button
            onClick={handlePauseResume}
            aria-label="Resume briefing"
            className={`
              inline-flex items-center ${sizeClasses} rounded-lg font-medium
              bg-amber-50 text-amber-700 border border-amber-200
              hover:bg-amber-100
              transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
              ${className}
            `}
          >
            <span className="text-base" aria-hidden="true">▶</span>
            <span>Resume Briefing</span>
          </button>
        );

      case "error":
        return (
          <div className={`flex flex-col gap-1 ${className}`}>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={handleRetry}
                aria-label="Retry voice briefing"
                className={`
                  inline-flex items-center ${sizeClasses} rounded-lg font-medium
                  bg-red-50 text-red-600 border border-red-200
                  hover:bg-red-100
                  transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1
                `}
              >
                <span className="text-base" aria-hidden="true">⚠</span>
                <span>Try Again</span>
              </button>
              <button
                onClick={() => { setState("idle"); setErrorMessage(""); setFallbackText(""); }}
                aria-label="Dismiss error"
                className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-red-500 max-w-xs">{errorMessage}</p>
            )}
            {fallbackText && (
              <details className="text-xs text-slate-500 max-w-sm mt-1">
                <summary className="cursor-pointer hover:text-slate-700">View briefing text</summary>
                <p className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-600 leading-relaxed">
                  {fallbackText}
                </p>
              </details>
            )}
          </div>
        );
    }
  };

  return (
    <div className="voice-briefing-player">
      {renderButton()}
    </div>
  );
}
