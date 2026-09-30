from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from app.database.connection import connect_to_mongo, close_mongo_connection, db
from app.database.indexes import create_indexes
from app.config import settings
from app.routes.auth import router as auth_router
from app.routes.tournaments import router as tournaments_router
from app.routes.public import router as public_router
from app.routes.payments import router as payments_router
from app.routes.admin_payments import router as admin_payments_router
from app.routes.admin_tournament_fields import router as admin_fields_router
from app.routes.admin_dashboard import router as admin_dashboard_router
from app.routes.admin_registrations import router as admin_registrations_router
from app.routes.admin_players import router as admin_players_router
from app.routes.admin_teams import router as admin_teams_router
from app.routes.admin_reports import router as admin_reports_router
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to database and create indexes
    await connect_to_mongo()
    if db.db is not None:
        await create_indexes(db.db)
    
    os.makedirs("uploads/payments", exist_ok=True)
    yield
    
    # Shutdown: close connection
    await close_mongo_connection()

app = FastAPI(
    title="Free Fire Tournament API",
    description="API for Free Fire Tournament Registration & Management",
    version="1.0.0",
    lifespan=lifespan
)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Include Routers
app.include_router(auth_router)
app.include_router(tournaments_router)
app.include_router(public_router)
app.include_router(payments_router)
app.include_router(admin_payments_router)
app.include_router(admin_fields_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_registrations_router)
app.include_router(admin_players_router)
app.include_router(admin_teams_router)
app.include_router(admin_reports_router)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the Free Fire Tournament API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}

@app.get("/api/db-test")
async def test_db_connection():
    try:
        if db.db is None:
            return {"status": "error", "message": "Database not initialized"}
        # Ping the database
        await db.client.admin.command('ping')
        return {"status": "ok", "message": "Successfully connected to MongoDB Atlas"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
