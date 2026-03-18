---
description: Start local dev servers - Backend :8000, Frontend :3010
---

# Local Development Servers

Start the backend (FastAPI/Uvicorn) on port **8000** and the frontend (Next.js) on port **3010**.

## Project Root

```
/Users/maqashable/Desktop/scoop-sagadasaxado
```

## Environment Files

| File | Purpose | Key Value |
|------|---------|-----------|
| `backend/tax_agent/.env` | Backend config (MongoDB, Gemini) | `MONGODB_URI`, `GEMINI_API_KEY` |
| `frontend/.env.local` | Frontend config | `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000` |

> [!IMPORTANT]
> Frontend MUST use `127.0.0.1` (not `localhost`) to avoid IPv6 resolution failures.
> Backend binds to `0.0.0.0` (IPv4 only) — `localhost` resolves to `::1` (IPv6) on macOS and fails.

> [!IMPORTANT]
> `backend/tax_agent/.env` must exist in `backend/tax_agent/` — NOT in project root.
> `config.py` calls `load_dotenv()` which reads `.env` from the server's CWD.

---

## Step 1: Kill existing processes on ports 8000 and 3010

// turbo
```bash
lsof -ti:8000,3010 2>/dev/null | xargs kill -9 2>/dev/null; echo "Ports cleared"
```

> This ensures no ghost processes block the ports.

---

## Step 2: Start Backend (port 8000)

```bash
cd /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent && python3 main.py
```

**Important notes:**
- CWD must be `backend/tax_agent/` so that `load_dotenv()` finds `.env`
- `main.py` calls `uvicorn.run()` internally — no need to call `uvicorn` directly
- Must run as a **background command** (WaitMsBeforeAsync=8000) so it stays alive
- Wait 8s — startup includes MongoDB connect + tree cache warmup (~4-5s total)

**Expected output:**
```
INFO:     Started server process [PID]
{"version": "0.1.0", "event": "starting_tax_agent", ...}
{"database": "georgian_tax_db", "event": "database_connected", ...}
{"collections": 7, "event": "indexes_created", ...}
{"event": "tree_cache_warmed", ...}
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## Step 3: Start Frontend (port 3010)

```bash
cd /Users/maqashable/Desktop/scoop-sagadasaxado/frontend && nohup npx next dev -p 3010 > /tmp/frontend.log 2>&1 &
echo "Frontend PID: $!"
```

**Important notes:**
- Port **3010** (not 3000) — matches `ALLOWED_ORIGINS` in backend config
- Use `nohup ... &` — `npx next dev` exits prematurely in managed terminals without it
- Wait ~5s after launch before verifying
- Logs available at `/tmp/frontend.log`

**Expected output (in /tmp/frontend.log):**
```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3010
- Environments: .env.local
✓ Ready in 400ms
```

---

## Step 4: Verify both servers

// turbo
```bash
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
```

Expected: `{"status": "healthy", "database": "connected", ...}`

// turbo
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3010
```

Expected: `200`

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Port already in use (Errno 48) | Ghost process on port | Run Step 1 to kill existing processes |
| `database: disconnected` | Missing/wrong `MONGODB_URI` | Check `backend/tax_agent/.env` has correct URI |
| **Failed to fetch** (browser console) | **IPv6 mismatch** | Ensure `frontend/.env.local` uses `http://127.0.0.1:8000` (NOT `localhost`) |
| Frontend CORS blocked | Missing origin in backend | `config.py` → `allowed_origins` must include `http://127.0.0.1:3010` |
| Frontend exits immediately | Managed terminal limitation | Use `nohup ... &` pattern (Step 3) |
| `Connection refused` on 8000 | Backend crashed during startup | Check for missing env vars (`GEMINI_API_KEY`, `MONGODB_URI`) |
| MongoDB connection timeout | Atlas IP not whitelisted | Allow `0.0.0.0/0` in Atlas Network Access |
| `.env` not loading | Wrong CWD | Must `cd backend/tax_agent` before `python3 main.py` |

---

## Quick Reference (Copy-Paste)

```bash
# 1. Clear ports
lsof -ti:8000,3010 2>/dev/null | xargs kill -9 2>/dev/null

# 2. Backend (background)
cd /Users/maqashable/Desktop/scoop-sagadasaxado/backend/tax_agent && python3 main.py

# 3. Frontend (background with nohup)
cd /Users/maqashable/Desktop/scoop-sagadasaxado/frontend && \
nohup npx next dev -p 3010 > /tmp/frontend.log 2>&1 &

# 4. Verify
curl -s http://127.0.0.1:8000/health | python3 -m json.tool
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3010
```

## Access URLs

| Service | URL |
|---------|-----|
| Frontend (browser) | http://127.0.0.1:3010 |
| Backend health | http://127.0.0.1:8000/health |
| Backend API docs | http://127.0.0.1:8000/docs |
