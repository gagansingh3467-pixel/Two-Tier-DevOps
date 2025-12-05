# backend/app/main.py
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import List, Optional
import os, asyncpg, datetime
from decimal import Decimal
from app.auth import hash_password, verify_password, create_access_token, decode_token
from asyncpg.exceptions import UniqueViolationError

# ----------------------------------------------------
# Create app
# ----------------------------------------------------
app = FastAPI(title="Expense Tracker API (Auth)")

# ----------------------------------------------------
# ENABLE PROMETHEUS METRICS (must be here)
# ----------------------------------------------------
Instrumentator().instrument(app).expose(app)

# ----------------------------------------------------
# Database setup
# ----------------------------------------------------
DB_URL = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres:5432/appdb")
pool: Optional[asyncpg.pool.Pool] = None


class UserIn(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)


class TokenOut(BaseModel):
    access_token: str


class ExpenseIn(BaseModel):
    amount: Decimal = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    description: Optional[str] = ""
    date: Optional[datetime.date] = Field(default_factory=lambda: datetime.date.today())


class ExpenseOut(ExpenseIn):
    id: int
    created_at: datetime.datetime


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["sub"]


# ----------------------------------------------------
# Startup
# ----------------------------------------------------
@app.on_event("startup")
async def startup():
    global pool
    pool = await asyncpg.create_pool(DB_URL, min_size=1, max_size=10)

    async with pool.acquire() as conn:
        # users table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            )
        """)

        # expenses table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                amount NUMERIC NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                owner VARCHAR(100) NOT NULL
            );
        """)


@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        await pool.close()


# ----------------------------------------------------
# Auth Endpoints
# ----------------------------------------------------
@app.post("/api/register", response_model=dict)
async def register(u: UserIn):
    async with pool.acquire() as conn:
        hashed = hash_password(u.password)
        try:
            await conn.execute(
                "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
                u.username, hashed
            )
        except UniqueViolationError:
            raise HTTPException(status_code=400, detail="User already exists")
    return {"ok": True}


@app.post("/api/login", response_model=TokenOut)
async def login(u: UserIn):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT username, password_hash FROM users WHERE username=$1",
            u.username
        )
        if not row or not verify_password(u.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token(row["username"])
    return {"access_token": token}


# ----------------------------------------------------
# Expense CRUD
# ----------------------------------------------------
@app.post("/api/expenses", response_model=ExpenseOut)
async def create_expense(exp: ExpenseIn, current_user: str = Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO expenses (amount, category, description, date, owner) "
            "VALUES ($1,$2,$3,$4,$5) RETURNING id, amount, category, description, date, created_at",
            str(exp.amount), exp.category, exp.description, exp.date, current_user
        )
    return {
        "id": row["id"],
        "amount": float(row["amount"]),
        "category": row["category"],
        "description": row["description"],
        "date": row["date"],
        "created_at": row["created_at"],
    }


@app.get("/api/expenses", response_model=List[ExpenseOut])
async def list_expenses(limit: int = 100, offset: int = 0, current_user: str = Depends(get_current_user)):
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, amount, category, description, date, created_at "
            "FROM expenses WHERE owner=$1 ORDER BY date DESC, id DESC LIMIT $2 OFFSET $3",
            current_user, limit, offset
        )
    return [
        {
            "id": r["id"],
            "amount": float(r["amount"]),
            "category": r["category"],
            "description": r["description"],
            "date": r["date"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]


@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int, current_user: str = Depends(get_current_user)):
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT owner FROM expenses WHERE id=$1", expense_id)
        if not row:
            raise HTTPException(status_code=404, detail="Expense not found")
        if row["owner"] != current_user:
            raise HTTPException(status_code=403, detail="Not allowed")
        await conn.execute("DELETE FROM expenses WHERE id=$1", expense_id)
    return {"deleted": expense_id}


@app.get("/api/summary")
async def summary(current_user: str = Depends(get_current_user)):
    async with pool.acquire() as conn:
        total_row = await conn.fetchrow(
            "SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE owner=$1",
            current_user
        )
        rows = await conn.fetch(
            "SELECT category, COALESCE(SUM(amount),0) as total "
            "FROM expenses WHERE owner=$1 GROUP BY category ORDER BY total DESC",
            current_user
        )
    total = float(total_row["total"]) if total_row else 0.0
    by_category = [{"category": r["category"], "total": float(r["total"])} for r in rows]
    return {"total": total, "by_category": by_category}


@app.get("/api/monthly-summary")
async def monthly_summary(year: Optional[int] = None, current_user: str = Depends(get_current_user)):
    q = "SELECT date_trunc('month', date)::date as month, COALESCE(SUM(amount),0) as total FROM expenses WHERE owner=$1"
    args = [current_user]
    if year:
        q += " AND EXTRACT(YEAR FROM date) = $2"
        args.append(year)
    q += " GROUP BY month ORDER BY month"

    async with pool.acquire() as conn:
        rows = await conn.fetch(q, *args)

    return [{"month": r["month"].isoformat(), "total": float(r["total"])} for r in rows]
