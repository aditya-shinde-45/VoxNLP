# VoxNLP

VoxNLP is a local React and FastAPI application for multilingual text-to-speech and NLP analysis.

The project is intentionally split into two independent applications:

```text
VoxNLP/
├── backend/   # FastAPI, XTTS-v2, spaCy, tests, and Python virtual environment
└── frontend/  # React, Vite, and Tailwind UI
```

## Requirements

- Linux or Windows 10/11
- Python 3.12
- Node.js 18+ and npm
- NVIDIA GPU with a compatible PyTorch/CUDA installation is recommended for XTTS-v2

Python 3.13 is not supported by the pinned Coqui TTS package. Use Python 3.12 for the backend virtual environment.

## Backend setup

From the project root:

Linux/macOS:

```bash
python3.12 -m venv backend/.venv
backend/.venv/bin/python -m pip install --upgrade pip setuptools wheel
backend/.venv/bin/pip install -r backend/requirements.txt
```

Windows PowerShell:

```powershell
py -3.12 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
backend\.venv\Scripts\pip.exe install -r backend\requirements.txt
```

The requirements file uses the maintained `coqui-tts` package with its `codec` extra. It provides the `TTS` Python import used by the backend and supports Python 3.12.

The English `en_core_web_sm` spaCy model is included in
`backend/requirements.txt` and is installed with the backend dependencies.

Start the API from the project root:

Linux/macOS:

```bash
PYTHONPATH=. backend/.venv/bin/uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Windows PowerShell:

```powershell
$env:PYTHONPATH = (Get-Location).Path
backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The first XTTS-v2 initialization may download model files from the model provider. This can take time and requires internet access. Coqui may ask you to confirm either a purchased commercial license or agreement to its non-commercial CPML terms. Read the terms at https://tts-hub.github.io/cpml and answer the prompt in the terminal only if that option applies to your use. The API reports `unavailable` instead of pretending the model is ready if initialization fails.

API documentation is available while the server is running:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend uses:

```text
VITE_API_BASE_URL=http://localhost:8000/api
```

Update `frontend/.env` if the backend is running on another host or port. Do not commit `.env`; use `.env.example` as the shareable template.

## Running tests and builds

Backend tests:

Linux/macOS:

```bash
backend/.venv/bin/python -m pytest -q backend/tests
```

Windows PowerShell:

```powershell
backend\.venv\Scripts\python.exe -m pytest -q backend\tests
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Implemented API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Backend and model health |
| GET | `/api/system/status` | Device, CUDA, model, and analyzer status |
| GET | `/api/languages` | Verified XTTS-v2 language metadata |
| GET | `/api/voices` | Available built-in speakers |
| POST | `/api/analyze` | Tokenization and optional English spaCy analysis |
| POST | `/api/synthesize` | WAV speech generation using form data |
| GET | `/api/history` | Current audio history state |

`POST /api/synthesize` accepts multipart form fields:

- `text`
- `language`
- `speaker` (optional)

The endpoint returns `audio/wav` on success.

## Configuration

Backend settings are configured through environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `VOXNLP_MAX_TEXT_LENGTH` | `3000` | Maximum synthesis/analyzer text length |
| `VOXNLP_CORS_ORIGINS` | `http://localhost:5173,http://localhost:8443` | Comma-separated allowed frontend origins |
| `VOXNLP_AUDIO_DIR` | `backend/data/audio` | Private audio storage directory |

The frontend API URL is configured separately with `VITE_API_BASE_URL`.

## Current service behavior

- XTTS-v2 is loaded once during FastAPI startup.
- CUDA is used only when PyTorch reports that it is available.
- GPU inference is serialized to limit memory pressure.
- English advanced NLP uses the installed `en_core_web_sm` model; if it is unavailable, the analyzer provides reliable tokenization and explicitly reports basic preprocessing.
- Other languages receive language-independent preprocessing unless a language-specific analyzer is added.
- History currently returns a genuine empty state; fabricated history records are not created.
- Generated audio is returned directly as a WAV response and is not exposed through a public static directory.

## Troubleshooting

### The API reports that XTTS-v2 is unavailable

Check the startup logs and verify the environment:

```bash
backend/.venv/bin/python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
backend/.venv/bin/python -c "import torchaudio; from TTS.api import TTS; print('Coqui TTS import OK')"
```

On Windows PowerShell, use:

```powershell
backend\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.cuda.is_available())"
backend\.venv\Scripts\python.exe -c "import torchaudio; from TTS.api import TTS; print('Coqui TTS import OK')"
```

If the model cannot be downloaded, check internet access and the local model cache. The API will still start, but synthesis correctly returns HTTP 503 until the model is ready.

### NLP results show basic preprocessing

Install the backend dependencies, or install the English spaCy pipeline directly:

```bash
backend/.venv/bin/pip install -r backend/requirements.txt
# Alternatively:
backend/.venv/bin/python -m spacy download en_core_web_sm
```

On Windows PowerShell, replace `backend/.venv/bin/` with `backend\.venv\Scripts\`.

Restart the API after installing it.

### Frontend cannot reach the API

Confirm that the backend is running on port 8000 and that `frontend/.env` contains:

```text
VITE_API_BASE_URL=http://localhost:8000/api
```

Restart the Vite development server after changing environment variables.
