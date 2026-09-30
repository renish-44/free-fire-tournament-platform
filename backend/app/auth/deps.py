from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson import ObjectId
from app.config import settings
from app.database.connection import db
from app.schemas.admin import AdminResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    admin_dict = await db.db.admins.find_one({"_id": ObjectId(admin_id)})
    if admin_dict is None:
        raise credentials_exception
        
    admin_dict["_id"] = str(admin_dict["_id"])
    return AdminResponse(**admin_dict)

async def get_super_admin(current_admin: AdminResponse = Depends(get_current_admin)):
    if current_admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Super admin required."
        )
    return current_admin
