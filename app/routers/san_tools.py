from fastapi import APIRouter

router = APIRouter(tags=["Sanskaar Tools"])


@router.get("/greet/{name}")
def greet(name: str):
    return f"Hello, {name}!"


@router.get("/reverse/{text}")
def reverse_text(text: str):
    return text[::-1]
