from motor.motor_asyncio import AsyncIOMotorClient
from config import Settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def get_database():
    return db.db

async def connect_to_mongo():
    settings = Settings()
    db.client = AsyncIOMotorClient(
        settings.mongodb_url,
        serverSelectionTimeoutMS=5000
    )
    try:
        # Verify the connection
        await db.client.server_info()
        print("Connected to MongoDB Atlas")
    except Exception as e:
        print(f"Unable to connect to MongoDB Atlas: {e}")
        raise
    
    db.db = db.client[settings.database_name]

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB Atlas connection") 