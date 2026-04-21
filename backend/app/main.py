from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .redis_client import redis_client
from .routers import auth, exercises, plans, records, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.init()
    yield
    await redis_client.close()


app = FastAPI(
    title="健身运动记录系统",
    description="一个完整的健身训练记录和管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(exercises.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "健身运动记录系统 API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
