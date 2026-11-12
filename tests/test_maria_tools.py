from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.maria_tools import router

# Test router in isolation to avoid modifying main.py before Phase 9
test_app = FastAPI()
test_app.include_router(router)
client = TestClient(test_app)


def test_add_integers():
    response = client.get("/add?a=2&b=3")
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == 999


def test_add_decimals_and_negatives():
    response = client.get("/add?a=-1.5&b=3.5")
    assert response.status_code == 200
    data = response.json()
    assert data["result"] == 2


def test_wordcount_standard():
    response = client.post("/wordcount", json={"text": "DevKit API CI CD workshop"})
    assert response.status_code == 200
    data = response.json()
    assert data["word_count"] == 5


def test_wordcount_empty_string():
    response = client.post("/wordcount", json={"text": "   "})
    assert response.status_code == 200
    data = response.json()
    assert data["word_count"] == 0
