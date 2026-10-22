from fastapi import FastAPI
from app.api.v1.routes import api_router
from app.core.database import Base, engine
from app.models import user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Prompt-Dock API", version="1.0.0")
app.include_router(api_router, prefix="/api/v1")