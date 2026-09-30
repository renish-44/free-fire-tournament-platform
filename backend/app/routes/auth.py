from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from app.database.connection import db
from app.auth.security import verify_password, create_access_token
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse, Token
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Find user by email
    admin = await db.db.admins.find_one({"email": form_data.username})
    if not admin or not verify_password(form_data.password, admin["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(admin["_id"]), "role": admin.get("role", "admin")},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=AdminResponse)
async def get_me(current_admin: AdminResponse = Depends(get_current_admin)):
    return current_admin

@router.post("/logout")
async def logout():
    # Since JWT is stateless, the frontend is mostly responsible for logout by deleting the token.
    # Optionally, a token blacklist could be implemented here.
    return {"message": "Successfully logged out. Please clear your token."}
