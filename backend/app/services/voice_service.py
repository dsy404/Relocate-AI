"""
Voice Service — ElevenLabs Text-to-Speech integration.

This service is ONLY the voice communication layer.
It receives pre-generated briefing text and converts it to audio.
It NEVER generates, modifies, or invents risk/relocation data.

The ElevenLabs API key is kept server-side and never exposed to the frontend.
"""
from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Optional, Tuple

import requests

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────

ELEVENLABS_API_KEY: Optional[str] = os.environ.get("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID: str = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")  # Default: Sarah
ELEVENLABS_API_BASE: str = "https://api.elevenlabs.io/v1"
ELEVENLABS_MODEL_ID: str = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5")

# Simple in-memory cache: key -> (audio_bytes, timestamp)
_audio_cache: dict[str, Tuple[bytes, float]] = {}
_CACHE_TTL_SECONDS: int = 300  # 5 minutes
_CACHE_MAX_ENTRIES: int = 50


def _cache_key(briefing_type: str, entity_id: str, text: str) -> str:
    """Generate a deterministic cache key from briefing parameters."""
    content = f"{briefing_type}:{entity_id}:{text}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _get_cached(key: str) -> Optional[bytes]:
    """Retrieve cached audio if it exists and hasn't expired."""
    entry = _audio_cache.get(key)
    if entry is None:
        return None
    audio_bytes, timestamp = entry
    if time.time() - timestamp > _CACHE_TTL_SECONDS:
        del _audio_cache[key]
        return None
    return audio_bytes


def _set_cached(key: str, audio_bytes: bytes) -> None:
    """Store audio in cache, evicting oldest entries if necessary."""
    # Evict expired entries first
    now = time.time()
    expired = [k for k, (_, ts) in _audio_cache.items() if now - ts > _CACHE_TTL_SECONDS]
    for k in expired:
        del _audio_cache[k]

    # Evict oldest if at capacity
    while len(_audio_cache) >= _CACHE_MAX_ENTRIES:
        oldest_key = min(_audio_cache, key=lambda k: _audio_cache[k][1])
        del _audio_cache[oldest_key]

    _audio_cache[key] = (audio_bytes, now)


def is_available() -> bool:
    """Check if the ElevenLabs service is configured and ready."""
    return bool(ELEVENLABS_API_KEY and ELEVENLABS_API_KEY.strip())


def synthesize_speech(
    text: str,
    briefing_type: str = "general",
    entity_id: str = "unknown",
) -> Tuple[Optional[bytes], Optional[str]]:
    """
    Convert text to speech using the ElevenLabs API.

    Args:
        text: The briefing text to convert to speech.
        briefing_type: Type of briefing ('risk' or 'action-plan') for caching.
        entity_id: Entity identifier for caching.

    Returns:
        Tuple of (audio_bytes, error_message).
        On success: (bytes, None)
        On failure: (None, error_string)
    """
    if not text or not text.strip():
        return None, "Cannot generate voice briefing: no briefing text provided."

    if not is_available():
        return None, (
            "Voice briefing is currently unavailable. "
            "ElevenLabs API key is not configured."
        )

    # Check cache
    cache_key = _cache_key(briefing_type, entity_id, text)
    cached = _get_cached(cache_key)
    if cached is not None:
        logger.info("Returning cached audio for %s/%s", briefing_type, entity_id)
        return cached, None

    # Make the API call
    url = f"{ELEVENLABS_API_BASE}/text-to-speech/{ELEVENLABS_VOICE_ID}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    try:
        logger.info(
            "Calling ElevenLabs TTS for %s/%s (%d chars)",
            briefing_type, entity_id, len(text),
        )

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
        )

        if response.status_code == 200:
            audio_bytes = response.content
            if len(audio_bytes) == 0:
                return None, "ElevenLabs returned empty audio response."

            # Cache the result
            _set_cached(cache_key, audio_bytes)
            logger.info(
                "Successfully generated %d bytes of audio for %s/%s",
                len(audio_bytes), briefing_type, entity_id,
            )
            return audio_bytes, None

        elif response.status_code == 401:
            logger.error("ElevenLabs API key is invalid or expired.")
            return None, "Voice briefing unavailable: API authentication failed."

        elif response.status_code == 429:
            logger.warning("ElevenLabs rate limit exceeded.")
            return None, "Voice briefing temporarily unavailable due to rate limiting. Please try again shortly."

        elif response.status_code == 422:
            logger.error("ElevenLabs rejected the request: %s", response.text)
            return None, "Voice briefing generation failed: invalid voice configuration."

        else:
            logger.error(
                "ElevenLabs API returned status %d: %s",
                response.status_code, response.text[:200],
            )
            return None, f"Voice briefing unavailable (service error {response.status_code})."

    except requests.exceptions.Timeout:
        logger.error("ElevenLabs API request timed out.")
        return None, "Voice briefing timed out. Please try again."

    except requests.exceptions.ConnectionError:
        logger.error("Cannot connect to ElevenLabs API.")
        return None, "Voice briefing unavailable: cannot reach the voice service."

    except Exception as e:
        logger.exception("Unexpected error during TTS synthesis.")
        return None, f"Voice briefing generation encountered an unexpected error."
