import logging
import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

async def create_indexes(db: AsyncIOMotorDatabase):
    """Create necessary database indexes."""
    logger.info("Creating database indexes...")
    try:
        # Users
        await db.users.create_index("email", unique=True)
        
        # Tournaments
        await db.tournaments.create_index("slug", unique=True)
        await db.tournaments.create_index("status")
        
        # Registrations
        await db.registrations.create_index("registration_id", unique=True)
        await db.registrations.create_index("tournament_id")
        await db.registrations.create_index("status")
        await db.registrations.create_index(
            [("tournament_id", pymongo.ASCENDING), ("team_id", pymongo.ASCENDING)]
        )
        
        # Players
        await db.players.create_index("free_fire_uid")
        
        # Payments
        # UTR can be sparse since not all payments might have UTRs initially
        await db.payments.create_index("utr", unique=True, sparse=True)
        await db.payments.create_index("status")
        await db.payments.create_index("registration_id")
        await db.payments.create_index("tournament_id")
        
        # Status History & Audit Logs
        await db.status_history.create_index("registration_id")
        await db.audit_logs.create_index("entity_id")
        
        logger.info("Database indexes created successfully.")
        
        # Seed initial admin user if none exists
        from app.config import settings
        from app.auth.security import get_password_hash
        admin_count = await db.admins.count_documents({})
        if admin_count == 0:
            logger.info("Seeding initial admin user...")
            await db.admins.insert_one({
                "email": settings.INITIAL_ADMIN_EMAIL,
                "password_hash": get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                "name": "Super Admin",
                "role": "super_admin",
                "created_at": __import__("datetime").datetime.utcnow(),
                "updated_at": __import__("datetime").datetime.utcnow()
            })
            logger.info("Initial admin seeded.")

    except Exception as e:
        logger.error(f"Failed to create indexes or seed: {e}")
