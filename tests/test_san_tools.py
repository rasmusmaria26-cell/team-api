from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.san_tools import router

test_app = FastAPI()
test_app.include_router(router)
client = TestClient(test_app)


def test_greet():
    response = client.get("/greet/Maria")
    assert response.status_code == 200
    assert response.json() == "Hello, Maria!"


def test_reverse():
    response = client.get("/reverse/hello")
    assert response.status_code == 200
    assert response.json() == "olleh"
