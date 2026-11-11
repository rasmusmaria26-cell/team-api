from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Maria Tools"])


class WordCountRequest(BaseModel):
    text: str


@router.get("/add")
def add(a: float, b: float):
    """Add two numbers and return the sum."""
    res = a + b
    formatted = int(res) if res.is_integer() else res
    return {
        "result": formatted,
        "sum": formatted,
    }


@router.post("/wordcount")
def word_count(payload: WordCountRequest):
    """Count words in the provided string."""
    words = payload.text.split()
    return {
        "word_count": len(words),
        "count": len(words),
    }
