import asyncio
import io
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

from backend.config import LANGUAGES, Settings


@dataclass
class TtsService:
    settings: Settings
    model: object | None = None
    state: str = "loading"
    error: str | None = None
    device: str = "cpu"
    gpu_name: str | None = None

    def load(self) -> None:
        try:
            import torch

            if torch.cuda.is_available():
                self.device = "cuda"
                self.gpu_name = torch.cuda.get_device_name(0)
        except Exception:
            self.device = "cpu"

        try:
            from TTS.api import TTS

            self.model = TTS(self.settings.tts_model, gpu=self.device == "cuda")
            self.state = "ready"
        except Exception as exc:
            self.error = "XTTS-v2 is unavailable. Install the backend requirements and model dependencies."
            self.state = "unavailable"

    @property
    def ready(self) -> bool:
        return self.model is not None and self.state == "ready"

    def status(self) -> dict:
        memory = None
        if self.device == "cuda":
            try:
                import torch

                memory = {
                    "allocated_bytes": torch.cuda.memory_allocated(),
                    "reserved_bytes": torch.cuda.memory_reserved(),
                }
            except Exception:
                memory = None
        return {
            "model": self.settings.tts_model,
            "state": self.state,
            "device": self.device,
            "cuda_available": self.device == "cuda",
            "gpu_name": self.gpu_name,
            "gpu_memory": memory,
            "supported_languages": list(LANGUAGES),
            "ready": self.ready,
            "error": self.error,
        }

    async def synthesize(self, text: str, language: str, speaker: str | None = None) -> bytes:
        if not self.ready:
            raise RuntimeError(self.error or "Speech model is not ready.")

        def run() -> bytes:
            output = io.BytesIO()
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as target:
                target_path = target.name
            try:
                kwargs = {"text": text, "file_path": target_path, "language": language}

                if speaker:
                    kwargs["speaker"] = speaker
                self.model.tts_to_file(**kwargs)
                output.write(Path(target_path).read_bytes())
                return output.getvalue()
            finally:
                Path(target_path).unlink(missing_ok=True)

        return await asyncio.to_thread(run)
