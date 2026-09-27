import os

class Settings:
    app_name = "Disaster Relocation DSS"
    api_prefix = "/api"
    debug = True
    db_path = os.path.join(os.path.dirname(__file__), '..', 'disaster_relocation.db')

    # ElevenLabs Voice Briefing Configuration
    elevenlabs_api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    elevenlabs_voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
    elevenlabs_model_id = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_turbo_v2_5")

settings = Settings()
