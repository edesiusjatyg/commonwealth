User Insights Service

This service generates per-user financial insights with weekly and monthly comparisons.

Quickstart (local, using Docker MySQL):

1. Copy environment file and edit values:

```bash
cp .env.example .env
# Edit .env to set GEMINI_API_KEY and any DB credentials
```

2. Start MySQL via Docker Compose:

```bash
docker-compose up -d
```

3. Create and activate virtualenv, install deps:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

4. Run the FastAPI app:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

5. Example request (generate insight):

```bash
curl -X POST "http://127.0.0.1:8000/insights/generate?user_id=testuser" \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"date": "2026-01-03T12:00:00", "amount": 50000, "category": "Food"}], "overall_income": {"weekly": {"current": 200000}, "monthly": {"current": 900000}}}'
```

Notes:
- Database: MySQL (see `docker-compose.yml`). By default uses credentials in `.env`.
- TTL: insights are stored with `expires_at` = `created_at` + `data_retention_days` (default 90 days).
- LLM: configure `GEMINI_API_KEY` in `.env` to enable LLM generation.

If you want automated DB migrations, add Alembic and migration scripts. For testing without MySQL, set `SQLALCHEMY_DATABASE_URL` to an SQLite file URL.
