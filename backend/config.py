from functools import lru_cache
import os
from dataclasses import dataclass


LANGUAGES = {
    "en": ("English", True),
    "hi": ("Hindi", False),
    "es": ("Spanish", False),
    "fr": ("French", False),
    "de": ("German", False),
    "it": ("Italian", False),
    "pt": ("Portuguese", False),
    "pl": ("Polish", False),
    "tr": ("Turkish", False),
    "ru": ("Russian", False),
    "nl": ("Dutch", False),
    "cs": ("Czech", False),
    "ar": ("Arabic", False),
    "zh-cn": ("Simplified Chinese", False),
    "ja": ("Japanese", False),
    "hu": ("Hungarian", False),
    "ko": ("Korean", False),
}


@dataclass(frozen=True)
class Settings:
    max_text_length: int = int(os.getenv("VOXNLP_MAX_TEXT_LENGTH", "3000"))
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("VOXNLP_CORS_ORIGINS", "http://localhost:5173,http://localhost:8443").split(",")
        if origin.strip()
    )
    audio_dir: str = os.getenv("VOXNLP_AUDIO_DIR", "backend/data/audio")
    tts_model: str = "tts_models/multilingual/multi-dataset/xtts_v2"


@lru_cache
def get_settings() -> Settings:
    return Settings()
