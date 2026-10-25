from fastapi.testclient import TestClient

from backend.main import app


def test_health_contract():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert {"status", "backend_version", "model_state", "ready"} <= response.json().keys()


def test_analyze_returns_real_preprocessing():
    with TestClient(app) as client:
        response = client.post("/api/analyze", json={"text": "Hello, Berlin.", "language": "en"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["characters"] == len("Hello, Berlin.")
    assert [token["text"] for token in payload["tokens"]] == ["Hello", ",", "Berlin", "."]

