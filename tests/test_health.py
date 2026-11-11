from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_returns_ok_and_version():
    """Verify that /health responds with 200, status 'ok', and a version string."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    assert "version" in data
    assert isinstance(data["version"], str)
    assert len(data["version"]) > 0
