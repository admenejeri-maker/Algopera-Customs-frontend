# Algopera Customs — AI Assistant

## Project Structure

```
/Users/maqashable/Desktop/Algopera-Customs/
├── backend/                    # Python FastAPI backend
│   └── tax_agent/
│       ├── main.py             # FastAPI entry point (port 8000)
│       ├── app/
│       │   ├── services/       # RAG pipeline, LLM, conversation store
│       │   ├── models/         # Pydantic schemas
│       │   ├── routers/        # API endpoints
│       │   └── utils/          # Helpers, LLM streaming
│       └── tests/              # pytest test suite
├── frontend/                   # React/Next.js frontend
│   └── src/
│       ├── components/         # UI components
│       ├── stores/             # Zustand state management
│       └── lib/                # Utilities
└── .agent/
    ├── skills/                 # AI agent skills (see below)
    ├── workflows/              # Slash command workflows
    └── memory/                 # Session context & memory bank
```

## Skills (29 Total)

Located in: `/Users/maqashable/Desktop/Algopera-Customs/.agent/skills/`

Each skill has a `SKILL.md` file with instructions. Read the relevant SKILL.md before working on a task.

### Core Engineering
- `testing-qa` — pytest, Vitest, Playwright, TDD
- `code-review` — PR review, code smells, feedback
- `debugging-patterns` — root cause analysis, stack traces
- `git-workflow` — commits, branching, conflicts
- `refactoring` — extract method, guard clauses, DRY
- `documentation-generator` — docstrings, JSDoc, README
- `code-generation` — scaffolding, CRUD, project structure

### Architecture & Design
- `architect-review` — clean architecture, DDD, SOLID
- `api-design-principles` — REST/GraphQL design
- `database-design` — schema, indexing, query optimization
- `ui-ux-design-guidelines` — design tokens, WCAG, responsive
- `performance-optimization` — profiling, caching, async I/O

### DevOps & Infrastructure
- `ci-cd-pipelines` — GitHub Actions, caching
- `containerization` — Docker, multi-stage builds, Compose
- `infrastructure-as-code` — Terraform, GCP
- `monitoring-observability` — structured logging, metrics
- `deployment-strategies` — blue/green, canary, Cloud Run

### Security
- `api-security-best-practices` — JWT, rate limiting, OWASP
- `auth-implementation-patterns` — OAuth2, RBAC, sessions
- `security-scanning` — Semgrep, OWASP Top 10
- `secrets-management` — env vars, GCP Secret Manager
- `dependency-auditing` — CVE scanning, lock files

### Frameworks & Languages
- `react-nextjs` — App Router, hooks, SSR/SSG
- `typescript-advanced` — generics, utility types, type guards
- `async-python-patterns` — asyncio, FastAPI async

### Meta-Skills
- `agent-memory-systems` — memory architecture, retrieval
- `ai-agents-architect` — agent design, tool use, orchestration
- `brainstorming` — structured ideation → validated design
- `verification-before-completion` — evidence before claims
- `get-api-docs` — fetch current API docs via chub CLI (Gemini, MongoDB, Firebase...)

## Tech Stack
- **Backend:** Python 3.12, FastAPI, MongoDB Atlas, Gemini API
- **Frontend:** React 18, Next.js, TypeScript, Zustand
- **Deployment:** Google Cloud Run
- **Database:** MongoDB Atlas (vector search enabled)

## API Documentation Rule (MANDATORY)

When writing or modifying code that calls **external APIs** (Gemini, MongoDB, Firebase, Stripe, etc.),
**ALWAYS** fetch current docs with `chub` before writing code:

```bash
chub get gemini/genai --lang py    # Gemini SDK (Python)
chub get mongodb/atlas --lang js   # MongoDB Atlas (JS)
chub search "<library>"            # Find any other library
```

Do NOT rely on training data for API syntax. The `get-api-docs` skill has full details.

## Local Development
- Backend: `cd backend/tax_agent && uvicorn main:app --port 8000`
- Frontend: `cd frontend && npm run dev` (port 3010)
