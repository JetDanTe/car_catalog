from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from car_catalog.config import settings
from car_catalog.database import init_db
from car_catalog.routers.cars import router as cars_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager to initialize database tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="REST API for car dealership and vehicle sales catalog.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cars_router)

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Root health check endpoint returning API information and documentation links."""
    return {
        "message": f"Welcome to {settings.app_name} v{settings.app_version}",
        "docs": "/docs",
        "redoc": "/redoc",
        "frontend": "/app/",
        "status": "healthy",
    }


def main() -> None:
    """Entrypoint to run the development server with Uvicorn."""
    uvicorn.run("car_catalog.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()
