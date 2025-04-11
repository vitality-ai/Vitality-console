from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import connect_to_mongo, close_mongo_connection
from routers import auth, buckets, objects, api_keys

app = FastAPI(title="Object Storage Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event handlers
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(buckets.router, prefix="/api/buckets", tags=["buckets"])
app.include_router(objects.router, prefix="/api/objects", tags=["objects"])
app.include_router(api_keys.router, prefix="/api/auth", tags=["api-keys"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Object Storage Service",
        "docs": "/docs",
        "redoc": "/redoc"
    }
