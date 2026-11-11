import os
from pathlib import Path
from fastapi import FastAPI

app = FastAPI(
    title="DevKit API",
    description="Developer utility toolkit API",
    version="0.1.0",
)

VERSION_FILE = Path(__file__).parent / "version.txt"


def get_app_version() -> str:
    """Retrieve version from environment or version.txt file."""
    for env_var in ("COMMIT_SHA", "APP_VERSION", "RAILWAY_GIT_COMMIT_SHA"):
        val = os.getenv(env_var)
        if val:
            return val.strip()
    if VERSION_FILE.exists():
        content = VERSION_FILE.read_text(encoding="utf-8").strip()
        if content:
            return content
    return "0.1.0"


@app.get("/health")
def health():
    """Health check endpoint returning service status and deployed version."""
    return {
        "status": "ok",
        "version": get_app_version(),
    }

