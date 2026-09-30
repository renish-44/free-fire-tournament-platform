import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    c = AsyncIOMotorClient("mongodb+srv://freefire_app:101_spaki_business@freefiretournament.rr2islu.mongodb.net/?appName=FreeFireTournament")
    db = c["free_fire_tournament"]
    r = await db.admins.delete_many({})
    print(f"Deleted {r.deleted_count} admin(s). Restart the server to re-seed.")

asyncio.run(main())
