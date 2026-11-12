"""
Automated Integration Tests for DevKit Static Workbench & UI Assets (Phase 8).
Verifies root HTML delivery, static asset serving, OpenAPI accessibility,
and confirms that static file mounting does not shadow or break existing API routes.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ui_root_serves_workbench_html():
    """Verify that root / returns 200 OK and serves the DEVKIT workbench HTML."""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    html_content = response.text
    assert "<!DOCTYPE html>" in html_content
    assert "DEVKIT" in html_content
    assert "Request Builder" in html_content
    assert "Response Inspector" in html_content
    assert "Recent History" in html_content
    assert "Documentation" in html_content


def test_ui_index_html_direct_route():
    """Verify that /index.html directly resolves with 200 OK."""
    response = client.get("/index.html")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "DEVKIT" in response.text


def test_ui_css_stylesheet_served():
    """Verify that /css/style.css returns 200 OK with CSS content type and design tokens."""
    response = client.get("/css/style.css")
    assert response.status_code == 200
    assert "text/css" in response.headers.get("content-type", "")
    css_content = response.text
    assert "--font-brand" in css_content
    assert "--accent" in css_content
    assert "--bg-app" in css_content
    assert ".response-panel" in css_content
    assert ".history-list" in css_content
    assert ".doc-card" in css_content


def test_ui_javascript_modules_served():
    """Verify that all four ES modules are served with valid JS content type."""
    js_files = ["app.js", "api.js", "history.js", "docs.js"]
    for filename in js_files:
        response = client.get(f"/js/{filename}")
        assert response.status_code == 200, f"Failed to fetch /js/{filename}"
        assert any(
            ct in response.headers.get("content-type", "")
            for ct in ["javascript", "text/plain"]
        )

    # Content checks
    assert "ApiClient" in client.get("/js/api.js").text
    assert "HistoryRepository" in client.get("/js/history.js").text
    assert "ENDPOINT_DOCS" in client.get("/js/docs.js").text
    assert "DOMContentLoaded" in client.get("/js/app.js").text


def test_api_routes_precedence_over_static():
    """Verify that all API routes remain active and take precedence over static files."""
    # 1. /health
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json().get("status") == "ok"

    # 2. /add
    add_resp = client.get("/add?a=15&b=25")
    assert add_resp.status_code == 200
    assert add_resp.json() == {"result": 40.0, "sum": 40.0}

    # 3. /wordcount
    wc_resp = client.post("/wordcount", json={"text": "DevKit workbench automated testing"})
    assert wc_resp.status_code == 200
    assert wc_resp.json() == {"word_count": 4, "count": 4}

    # 4. /greet/{name}
    greet_resp = client.get("/greet/Engineer")
    assert greet_resp.status_code == 200
    assert greet_resp.json() == "Hello, Engineer!"

    # 5. /reverse/{text}
    rev_resp = client.get("/reverse/DevKit")
    assert rev_resp.status_code == 200
    assert rev_resp.json() == "tiKveD"


def test_openapi_and_docs_remain_available():
    """Verify that FastAPI automatic OpenAPI spec and Swagger docs are unaffected."""
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    schema = openapi_resp.json()
    assert "/health" in schema.get("paths", {})
    assert "/add" in schema.get("paths", {})
    assert "/wordcount" in schema.get("paths", {})
    assert "/greet/{name}" in schema.get("paths", {})
    assert "/reverse/{text}" in schema.get("paths", {})

