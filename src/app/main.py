import logging
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.api.v1.routes import api_router
from app.core.database import Base, engine
from app.core.settings import settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.request")


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)


allowed_origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "Request failed: %s %s",
            request.method,
            request.url.path,
        )
        raise

    duration = perf_counter() - start_time

    logger.info(
        "%s %s -> %s (%.3fs)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )

    return response


app.include_router(api_router, prefix="/api/v1")