"""Authentication schemas."""

from typing import Optional, List
from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    """User login request schema."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    name: str
    role: str


class Token(BaseModel):
    """JWT token response schema."""
    access_token: str
    token_type: str
    expires_in: Optional[int] = None
    expires_at: Optional[int] = None
    refresh_token: Optional[str] = None
    user: Optional[UserResponse] = None


class RefreshRequest(BaseModel):
    """Token refresh request schema."""
    refresh_token: str


class GuestTokenResponse(BaseModel):
    """Guest token response schema."""
    access_token: str
    token_type: str
    is_guest: bool = True
    expires_in: int
    permissions: List[str]


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: str
    type: str
    exp: Optional[int] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
