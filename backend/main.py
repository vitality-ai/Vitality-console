from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_sqlite, close_sqlite
from routers import auth, buckets, api_keys

app = FastAPI(title="Vitality Console")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await init_sqlite()


@app.on_event("shutdown")
async def shutdown_event():
    await close_sqlite()


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(buckets.router, prefix="/api/buckets", tags=["buckets"])
app.include_router(api_keys.router, prefix="/api/auth", tags=["api-keys"])


@app.get("/")
async def root():
    return {
        "message": "Vitality Console",
        "docs": "/docs",
        "redoc": "/redoc",
    }
