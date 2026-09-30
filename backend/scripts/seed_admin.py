import asyncio
import os
import sys
from datetime import datetime

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import connect_to_mongo, close_mongo_connection, db
from app.auth.security import get_password_hash
from app.config import settings

async def seed():
    print("Starting admin seed script...")
    await connect_to_mongo()
    
    if db.db is None:
        print("Database connection failed. Exiting.")
        return
        
    email = settings.INITIAL_ADMIN_EMAIL
    password = settings.INITIAL_ADMIN_PASSWORD
    
    existing = await db.db.admins.find_one({"email": email})
    if existing:
        print(f"Admin with email {email} already exists.")
    else:
        admin_doc = {
            "name": "Super Admin",
            "email": email,
            "password_hash": get_password_hash(password),
            "role": "super_admin",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.db.admins.insert_one(admin_doc)
        print(f"Successfully created super_admin: {email}")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
