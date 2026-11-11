# DevKit API — Team 5

A lightweight developer utility toolkit built with FastAPI, Docker, and GitHub Actions, deployed to Railway.

## Team Members
- **Maria Rasmus** — Project & Repository Lead, CI/CD, Railway, `/add`, `/wordcount`
- **Sanskaar Singh** — Backend & Docker Lead, FastAPI starter, `/greet`, `/reverse`, Integration

## Tech Stack
- Python 3.12
- FastAPI & Uvicorn
- Pytest & HTTPX
- Docker
- GitHub Actions (CI & CD)
- Railway

## Endpoints
- `GET /health` — Health check returning status and deployed version
- `GET /greet/{name}` — Returns greeting message
- `GET /reverse/{text}` — Returns reversed text string
- `GET /add?a=2&b=3` — Returns sum of two numbers
- `POST /wordcount` — Accepts JSON `{"text": "string"}` and returns word count

## Work Allocation & Ownership
Refer to [TEAM_WORK_ALLOCATION.md](./TEAM_WORK_ALLOCATION.md) for strict task ownership, branch allocation, and conflict-prevention rules.
