import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from backend.config import LANGUAGES, get_settings
from backend.services.nlp import NlpService, language_metadata, normalize_text
from backend.services.tts import TtsService


settings = get_settings()
tts = TtsService(settings)
nlp = NlpService()
inference_lock = asyncio.Semaphore(1)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.audio_dir).mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(tts.load)
    yield


app = FastAPI(title="VoxNLP API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=settings.max_text_length)
    language: str = "en"


def validate_language(language: str) -> None:
    if language not in LANGUAGES:
        raise HTTPException(status_code=422, detail={"message": f"Unsupported language: {language}"})


@app.get("/api/health")
async def health():
    return {"status": "ok", "backend_version": app.version, "model_state": tts.state, "ready": tts.ready}


@app.get("/api/system/status")
async def system_status():
    return {"tts": tts.status(), "nlp": {"english_available": nlp.available}, "service_ready": tts.ready}


@app.get("/api/languages")
async def languages():
    return {"languages": language_metadata(nlp.available)}


@app.get("/api/voices")
async def voices():
    speakers = []
    if tts.ready:
        configured = getattr(getattr(tts.model, "synthesizer", None), "tts_model", None)
        speaker_manager = getattr(configured, "speaker_manager", None)
        speakers = list(getattr(speaker_manager, "name_to_id", {}))
    return {"built_in": [{"id": speaker, "name": speaker} for speaker in speakers]}


@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    validate_language(request.language)
    try:
        return nlp.analyze(request.text, request.language)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"message": str(exc)}) from exc


@app.post("/api/synthesize")
async def synthesize(
    text: str = Form(..., min_length=1, max_length=settings.max_text_length),
    language: str = Form(...),
    speaker: str | None = Form(None),
):
    validate_language(language)
    normalized = normalize_text(text)
    if not normalized:
        raise HTTPException(status_code=400, detail={"message": "Text must not be empty."})
    if not tts.ready:
        raise HTTPException(status_code=503, detail={"message": tts.error or "Speech model is unavailable."})

    try:
        async with inference_lock:
            audio = await tts.synthesize(normalized, language, speaker)
        return Response(content=audio, media_type="audio/wav", headers={"Content-Disposition": 'attachment; filename="voxnpl-speech.wav"'})
    except HTTPException:
        raise
    except (RuntimeError, OSError) as exc:
        raise HTTPException(status_code=503, detail={"message": str(exc)}) from exc


@app.get("/api/history")
async def history():
    return {"items": []}
