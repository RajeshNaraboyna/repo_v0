"""Authentication endpoints."""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_guest_token,
    verify_password,
    decode_token
)
from app.schemas.auth import (
    Token,
    UserLogin,
    UserResponse,
    GuestTokenResponse
)
from app.services.user_service import get_user_by_email, authenticate_user

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Get the current authenticated user from the JWT token."""
    if not token:
        return None
    
    payload = decode_token(token)
    if not payload:
        return None
    
    return payload


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and return access token.
    
    - **username**: User's email address
    - **password**: User's password
    """
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "type": "user", "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"]
        )
    )


@router.post("/guest", response_model=GuestTokenResponse)
async def guest_login():
    """
    Get a guest access token for limited functionality.
    
    Guest users can:
    - Submit admission requests
    - View public information
    
    No login required.
    """
    if not settings.GUEST_ACCESS_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest access is not enabled"
        )
    
    guest_token = create_guest_token()
    
    return GuestTokenResponse(
        access_token=guest_token,
        token_type="bearer",
        is_guest=True,
        expires_in=settings.GUEST_TOKEN_EXPIRE_MINUTES * 60,
        permissions=["read:public", "create:admission_request"]
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user information."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if current_user.get("type") == "guest":
        return UserResponse(
            id="guest",
            email="guest@school.local",
            name="Guest User",
            role="guest"
        )
    
    # For regular users, fetch from database
    user = await get_user_by_email(current_user.get("sub"))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"]
    )


@router.post("/logout")
async def logout():
    """Logout the current user (client should discard the token)."""
    return {"message": "Successfully logged out"}
