# Team 5 — DevKit API Work Allocation

**Project:** DevKit API  
**Repository:** `team-api`  
**Team members:** Maria Rasmus and Sanskaar Singh  
**Stack:** Python 3.12, FastAPI, Pytest, Git, GitHub, GitHub Actions, Docker, Railway

---

## 1. Purpose

This document defines task ownership, file ownership, branch allocation, implementation order, and collaboration rules for the Team 5 CI/CD assignment.

The goal is to complete the assignment without duplicated work, accidental overwrites, or unnecessary merge conflicts.

## 2. Team responsibilities

### Maria — Project, Repository and CI/CD Lead

**Project setup**
- Create the local `team-api` project directory and initial root structure.
- Create the GitHub repository.
- Add Sanskaar as a collaborator.
- Confirm that both developers can access and clone the repository.

**Implementation ownership**
- Starter health tests and development dependencies.
- GitHub Actions CI workflow.
- Main branch protection configuration.
- Railway project and service configuration.
- Railway domain and deployment token.
- GitHub secrets and variables.
- Deployment workflow and live smoke-test coordination.
- `/add` and `/wordcount` features.
- Lead the final acceptance checklist.

### Sanskaar — Backend and Docker Lead

**Implementation ownership**
- FastAPI starter application.
- `app/main.py` and health endpoint implementation.
- Application package and version handling.
- Dockerfile and `.dockerignore`.
- `/greet` and `/reverse` features.
- Register both feature routers in `app/main.py` after both feature PRs are merged.

### Joint responsibilities

Both developers must:
- Verify repository access.
- Test Docker independently on their own laptops.
- Verify branch protection.
- Review each other's pull requests.
- Verify final application functionality.
- Participate in the deliberate CI failure demonstration.
- Complete final acceptance testing.

Do not change this allocation without explicit agreement.

## 3. Approved directory structure

Keep the project structure aligned with the Team 5 ownership plan.

```text
team-api/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── version.txt
│   └── routers/
│       ├── __init__.py
│       ├── maria_tools.py
│       └── san_tools.py
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   ├── test_maria_tools.py
│   └── test_san_tools.py
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── Dockerfile
├── .dockerignore
├── .gitignore
├── requirements.txt
├── requirements-dev.txt
├── README.md
└── TEAM_WORK_ALLOCATION.md
```

Do not create duplicate routers or test files. If an additional file becomes technically necessary, explain why, identify its owner, and get approval before adding it.

## 4. File ownership matrix

| File or task | Owner |
|---|---|
| Local project directory and initial root structure | Maria |
| GitHub repository and collaborator setup | Maria |
| `app/main.py` | Sanskaar |
| `app/__init__.py` and application package | Sanskaar |
| `app/version.txt` | Sanskaar |
| `app/routers/__init__.py` | Sanskaar |
| `app/routers/maria_tools.py` | Maria |
| `app/routers/san_tools.py` | Sanskaar |
| `tests/test_health.py` | Maria |
| `tests/test_maria_tools.py` | Maria |
| `tests/test_san_tools.py` | Sanskaar |
| `requirements.txt` | Sanskaar; coordinate dependency changes |
| `requirements-dev.txt` | Maria |
| `Dockerfile` | Sanskaar |
| `.dockerignore` | Sanskaar |
| `.gitignore` | Coordinate before editing |
| `.github/workflows/ci.yml` | Maria |
| `.github/workflows/deploy.yml` | Maria |
| Railway configuration | Maria |
| Router registration in `app/main.py` | Sanskaar |
| Final README and acceptance checklist | Both |

**Important ownership rules**
- Sanskaar owns `app/main.py` throughout the workshop. Maria must not independently edit it.
- Maria owns the CI and deployment workflow YAML files. Sanskaar must not independently edit them.
- Each feature module and its tests have one clear owner.
- Reviewers should report issues and review changes; they should not push edits into the owner's branch.
- If a task requires changing a file owned by the other developer, stop and agree on the handoff first.

## 5. Branch allocation

Use these branch names and ownership assignments.

| Branch | Owner | Files / purpose |
|---|---|---|
| `setup/starter` | Sanskaar | App package and `app/main.py` |
| `setup/tests` | Maria | `tests/test_health.py`, `requirements-dev.txt` |
| `setup/docker` | Sanskaar | `Dockerfile`, `.dockerignore` |
| `setup/ci` | Maria | `.github/workflows/ci.yml` |
| `setup/deploy` | Maria | `.github/workflows/deploy.yml` |
| `feature/maria-tools` | Maria | `app/routers/maria_tools.py`, `tests/test_maria_tools.py` |
| `feature/san-tools` | Sanskaar | `app/routers/san_tools.py`, `tests/test_san_tools.py` |
| `integration/register-routers` | Sanskaar | `app/main.py`, after both feature PRs merge |

One branch has one owner. Do not have both developers commit to the same feature branch.

## 6. Implementation sequence and task tracking

Update each status only after checking the work. Use one of these statuses:

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `COMPLETED`

| Phase | Task | Owner | Branch | Status |
|---|---|---|---|---|
| 1 | Create local project directory and initial root structure | Maria | Local setup | COMPLETED |
| 1 | Create GitHub repository and add Sanskaar as collaborator | Maria | GitHub setup | COMPLETED |
| 1 | Verify both developers can access and clone the repository | Both | — | COMPLETED |
| 2 | Build FastAPI starter, health endpoint and version handling | Sanskaar | `setup/starter` | COMPLETED |
| 2 | Add health tests and development dependencies | Maria | `setup/tests` | COMPLETED |
| 3 | Create Dockerfile and `.dockerignore` | Sanskaar | `setup/docker` | COMPLETED |
| 3 | Build and run Docker image independently | Both | — | COMPLETED |
| 4 | Create GitHub Actions CI workflow | Maria | `setup/ci` | COMPLETED |
| 4 | Review CI workflow and verify Docker build compatibility | Sanskaar | — | COMPLETED |
| 5 | Configure main branch protection | Maria | GitHub settings | COMPLETED |
| 5 | Verify pull request and required-check rules | Both | — | COMPLETED |
| 6 | Configure Railway project, service, domain and GitHub variables/secrets | Maria | Railway / GitHub settings | COMPLETED |
| 6 | Verify application port and host binding | Sanskaar | — | COMPLETED |
| 7 | Create deployment workflow and live smoke test | Maria | `setup/deploy` | COMPLETED |
| 7 | Review deployment workflow and verify live application | Sanskaar | — | COMPLETED |
| 8 | Implement `/add` and `/wordcount` with tests | Maria | `feature/maria-tools` | COMPLETED |
| 8 | Implement `/greet` and `/reverse` with tests | Sanskaar | `feature/san-tools` | COMPLETED |
| 9 | Register both routers in `app/main.py` after feature PRs merge | Sanskaar | `integration/register-routers` | COMPLETED |
| 9 | Review integration and verify all four feature endpoints | Maria and Sanskaar | — | COMPLETED |
| 10 | Demonstrate a deliberate CI test failure, then restore the test | Both | Temporary branch | COMPLETED |
| 11 | Complete final acceptance checks and README handover | Both | — | COMPLETED |
| 11 | Delete Railway project if it is no longer needed after the workshop | Maria | Railway | COMPLETED |

### Phase details

#### Phase 1 — Project and repository setup
**Maria**
1. Create the local `team-api` directory and approved root structure.
2. Create the public GitHub repository.
3. Add Sanskaar as a collaborator.
4. Confirm both developers can clone and access the repository.
5. Coordinate the first branches before implementation begins.

Maria creates the root workspace and initial structure; Sanskaar remains responsible for the application code and files assigned to him.

#### Phase 2 — FastAPI starter and health endpoint
**Sanskaar**
- Create the FastAPI application and `app/main.py`.
- Implement `/health`.
- Add required version handling.
- Confirm the application starts.

**Maria**
- Create `tests/test_health.py`.
- Create `requirements-dev.txt`.
- Verify the health endpoint with automated tests.

#### Phase 3 — Docker
**Sanskaar**
- Create `Dockerfile` and `.dockerignore`.
- Use the required Python environment.
- Ensure dependencies install correctly.
- Ensure the application listens on `0.0.0.0` and reads the `PORT` environment variable.

**Maria**
- Build the image on her laptop.
- Run the container and test the application.
- Report any issues to Sanskaar; Sanskaar owns Dockerfile changes.

#### Phase 4 — Continuous integration
**Maria**
Create `.github/workflows/ci.yml`. It must:
1. Trigger on pull requests targeting `main`.
2. Check out the repository.
3. Configure Python 3.12.
4. Install development dependencies.
5. Run Pytest.
6. Build the Docker image.

**Sanskaar** reviews the workflow and checks Docker build compatibility.

#### Phase 5 — Main branch protection
**Maria** configures:
- Pull request requirement.
- One required approval.
- Required `test` status check.
- Protection against direct unapproved changes.

**Both** verify that the rules work. Neither developer should approve their own PR.

#### Phase 6 — Railway setup
**Maria** configures:
- Railway project and service.
- `PORT=8000`.
- Generated deployment domain.
- Production project token.
- GitHub secret `RAILWAY_TOKEN`.
- GitHub variable `RAILWAY_SERVICE=team-api`.
- GitHub variable `APP_URL` containing the generated application URL.

**Sanskaar** verifies that the application binds to `0.0.0.0` and reads the configured port. Do not expose deployment tokens. Do not connect Railway directly to the GitHub repository if GitHub Actions is responsible for deployment.

#### Phase 7 — Deployment workflow
**Maria** creates `.github/workflows/deploy.yml` with this sequence:
1. Test.
2. Deploy.
3. Smoke test.

The smoke test must check that the live health endpoint responds and that the deployed version matches the intended commit SHA. It must report failures accurately.

**Sanskaar** reviews the YAML and verifies the live application endpoints. Do not claim deployment success without checking the live URL.

#### Phase 8 — Parallel feature development
**Maria — `feature/maria-tools`**
- Files: `app/routers/maria_tools.py` and `tests/test_maria_tools.py`.
- Implement `GET /add?a=2&b=3`.
- Implement `POST /wordcount`.
- Add relevant tests.
- Do not edit `app/main.py`.

**Sanskaar — `feature/san-tools`**
- Files: `app/routers/san_tools.py` and `tests/test_san_tools.py`.
- Implement `GET /greet/{name}`.
- Implement `GET /reverse/{text}`.
- Add relevant tests.
- Do not edit `app/main.py` during parallel feature work.

Each developer opens their own PR. The other developer reviews and tests the PR.

#### Phase 9 — Feature integration
Only after both feature PRs have merged, **Sanskaar**:
1. Creates `integration/register-routers`.
2. Updates `app/main.py` to include both routers.
3. Preserves the existing health endpoint.
4. Avoids rewriting the existing application.
5. Opens a PR.

**Maria** reviews the integration. Both developers run CI and verify all four feature endpoints.

#### Phase 10 — Deliberate CI failure demonstration
**Both**
1. Create a temporary branch.
2. Deliberately break one test.
3. Open or update the PR.
4. Observe GitHub Actions fail.
5. Restore the test.
6. Verify CI becomes green again.
7. Complete the exercise as required by the assignment.

Do not leave broken code in `main`.

#### Phase 11 — Final verification and cleanup
**Both** verify the application, endpoints, tests, Docker build and container, CI, branch protection, PR review process, Railway deployment, live smoke test and README.

**Maria** deletes the Railway project after the workshop if it is no longer required, to avoid unnecessary trial usage.

## 7. Conflict-prevention rules

1. Do not work directly on `main` after the initial approved setup.
2. Do not edit another developer's owned files without approval.
3. Do not have two developers modify the same file simultaneously.
4. Do not modify `app/main.py` during parallel feature development.
5. Do not put both developers' endpoints into one shared feature router.
6. Keep each developer's feature implementation and tests separate.
7. Merge setup tasks in the agreed sequence.
8. Review the latest `main` before creating a new branch.
9. Do not blindly accept `ours` or `theirs` during conflict resolution.
10. Do not overwrite remote work.

Before modifying a file, check:
- Current branch.
- Working tree status.
- File owner.
- Whether the other developer is editing it.
- Whether the change belongs to the assigned task.

### If a conflict occurs

1. Stop and avoid further edits.
2. Identify the conflicting files.
3. Explain the cause.
4. Identify each file's owner.
5. Propose a safe resolution.
6. Preserve both developers' functionality.
7. Run relevant tests.
8. Get approval before risky Git operations.

The assignment requires a deliberate CI failure demonstration. This document does **not** add a separate merge-conflict exercise.

## 8. Verification requirements

Do not mark a task `COMPLETED` just because code has been written. Record evidence.

| Area | Completion evidence |
|---|---|
| FastAPI | Application starts and endpoint responds |
| Tests | Pytest completes successfully |
| Docker | Image builds and container runs |
| CI | GitHub Actions workflow completes successfully |
| Branch protection | PR restrictions and required checks are verified |
| Deployment | Live application is checked |
| Smoke test | Deployed commit/version is verified |
| Integration | All endpoints are tested |

Never weaken or remove tests simply to make CI pass. Never fabricate command output or test results.

## 9. Progress log

Update this section after each verified phase. Include the date, phase, owner, files changed, short implementation summary, tests run, verification evidence and blockers.

| Date | Phase / task | Owner | Files changed | Summary and verification evidence | Blockers |
|---|---|---|---|---|---|
| 2026-11-11 | Phase 1 / Local project & GitHub repo | Maria | `team-api/`, `.gitignore`, `README.md`, `TEAM_WORK_ALLOCATION.md` | Created local repository skeleton, initialized Git on `main`, created public GitHub repository `rasmusmaria26-cell/team-api` and pushed initial commit | None |
| 2026-11-11 | Phase 2 / Starter app & health endpoint | Sanskaar | `requirements.txt`, `app/__init__.py`, `app/main.py`, `app/version.txt`, `app/routers/__init__.py` | Created FastAPI starter application with GET /health reading dynamic version, verified locally, merged via PR #1 | None |
| 2026-11-11 | Phase 2 / Health tests & dev dependencies | Maria | `requirements-dev.txt`, `tests/__init__.py`, `tests/test_health.py` | Implemented automated health check tests with pytest & httpx, verified locally (1 passed), merged via PR #2 | None |
| 2026-11-11 | Phase 3 / Dockerfile and .dockerignore | Sanskaar | `Dockerfile`, `.dockerignore`, `TEAM_WORK_ALLOCATION.md` | Created python:3.12-slim Dockerfile and .dockerignore. Built image `team-api` successfully. Ran container on port 8000; GET /health returned {"status":"ok","version":"0.1.0"}. Stopped and removed test container. | None |
| 2026-11-11 | Phase 4 / CI Workflow | Maria | `.github/workflows/ci.yml` | Implemented GitHub Actions CI workflow for pull requests targeting `main`. Runs Pytest and Docker build. Verified green check on PR #4. | None |
| 2026-11-11 | Phase 5 / Main branch protection | Maria | GitHub settings | Configured classic branch protection: required PR with 1 review approval, required `Test and Build` check, and no bypass rules enforced. | None |
| 2026-11-11 | Phase 6 / Railway & secrets setup | Maria & Sanskaar | Railway / GitHub settings | Created Railway project and `team-api` service with `PORT=8000`. Configured `RAILWAY_TOKEN`, `RAILWAY_SERVICE`, and `APP_URL` in repository secrets & variables. | None |
| 2026-11-11 | Phase 7 / Deployment workflow & live smoke test | Maria | `.github/workflows/deploy.yml` | Created automated CD workflow: test -> deploy to Railway -> live smoke test polling `/health` verifying status and commit SHA. Verified via PR #5. | None |
| 2026-11-11 | Phase 8 / maria-tools feature | Maria | `app/routers/maria_tools.py`, `tests/test_maria_tools.py` | Implemented GET /add and POST /wordcount in isolated router with 4 unit tests. Verified all tests passing, merged via PR #6. | None |
| 2026-11-11 | Phase 8 / san-tools feature | Sanskaar | `app/routers/san_tools.py`, `tests/test_san_tools.py` | Implemented GET /greet/{name} and GET /reverse/{text} with unit tests. 2 tests passed. Merged via PR #7. | None |
| 2026-11-11 | Phase 9 / Router integration | Sanskaar | `app/main.py`, `TEAM_WORK_ALLOCATION.md` | Registered maria_tools and san_tools routers in app/main.py. All 7 tests pass (health, add x2, wordcount x2, greet, reverse). Merged via PR #8. | None |
| 2026-11-12 | Conflict Demo / Merge conflict resolution | Both | `app/main.py` | Demonstrated intentional merge conflict on concurrent branches, resolved conflict markers, committed "Merge main and resolve conflict", merged via PR #9 & #10. | None |
| 2026-11-12 | Phase 10 / Deliberate CI failure demo | Both | `tests/test_maria_tools.py` | Broke test assertion to demonstrate CI failure (red status check and blocked merge on PR #11), then restored assertion to verify green recovery and merged cleanly. | None |
| 2026-11-12 | Phase 11 / Final acceptance & verification | Both | Whole repository | Tested and verified all 5 endpoints live on Railway. Complete pipeline, branch protection, conflict resolution, and CI failure demo successfully verified. | None |

## 10. Working rules for OpenCode and other coding assistants

Before every implementation task:
1. Read the relevant section of this file.
2. Inspect the existing files.
3. Confirm the current Git branch and working tree.
4. Confirm the file owner.
5. Identify the smallest required change.
6. Implement only the approved change.
7. Run relevant tests.
8. Report modified files and actual verification results.

Avoid:
- Rewriting entire files unnecessarily.
- Repeating completed work.
- Adding unnecessary dependencies.
- Unrelated refactoring.
- Adding databases, authentication, AI integrations or dashboards.
- Creating features not required by the assignment.

Use clear Windows PowerShell commands and state the working directory. Do not commit, push, merge or perform destructive Git operations without explicit approval.

## 11. Final operating principle

**One task = One owner = One branch = Controlled integration = Verified completion.**

Understand first. Plan second. Implement third. Test continuously. Deploy only after verification.
