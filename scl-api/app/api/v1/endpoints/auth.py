"""Authentication endpoints backed by Supabase Auth."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_guest_token, decode_token_async
from app.schemas.auth import (
    GuestTokenResponse,
    RefreshRequest,
    Token,
    UserResponse,
)
from app.services import supabase_auth_service

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def _user_response_from_supabase(supabase_user: dict) -> UserResponse:
    """Map a Supabase user object to our UserResponse schema."""
    metadata = supabase_user.get("user_metadata") or {}
    app_metadata = supabase_user.get("app_metadata") or {}
    role = (
        metadata.get("role")
        or app_metadata.get("role")
        or "staff"
    )
    name = metadata.get("name") or metadata.get("full_name") or supabase_user.get("email", "")
    return UserResponse(
        id=supabase_user["id"],
        email=supabase_user.get("email", ""),
        name=name,
        role=role,
    )


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Resolve the current user from a Bearer token.

    Accepts both Supabase JWTs and local guest tokens.
    Returns the decoded payload dict or None if unauthenticated.
    """
    if not token:
        return None

    # Local decode handles guest tokens, legacy HS256, and ECC P-256 Supabase JWTs
    payload = await decode_token_async(token)
    print(f"Decoded token payload: {payload}")
    if payload:
        # Guest/local tokens already carry the correct 'role'.
        # Supabase JWTs have a DB-level role ('authenticated') at the top level;
        # the application role is nested inside user_metadata / app_metadata.
        if payload.get("type") != "guest":
            user_metadata = payload.get("user_metadata") or {}
            app_metadata = payload.get("app_metadata") or {}
            app_role = user_metadata.get("role") or app_metadata.get("role") or "staff"
            payload = {**payload, "role": app_role}
        return payload

    # Fallback: validate against Supabase API (e.g. when JWT secret is not configured)
    supabase_user = await supabase_auth_service.get_user_from_token(token)
    if supabase_user:
        metadata = supabase_user.get("user_metadata") or {}
        app_metadata = supabase_user.get("app_metadata") or {}
        return {
            "sub": supabase_user.get("email"),
            "id": supabase_user.get("id"),
            "type": "user",
            "role": metadata.get("role") or app_metadata.get("role") or "staff",
            "email": supabase_user.get("email"),
        }

    return None


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user via Supabase and return session tokens."""
    session = await supabase_auth_service.sign_in_with_password(
        form_data.username, form_data.password
    )

    if not session or "access_token" not in session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_user = session.get("user", {})
    user_resp = _user_response_from_supabase(supabase_user) if supabase_user else None

    return Token(
        access_token=session["access_token"],
        token_type=session.get("token_type", "bearer"),
        expires_in=session.get("expires_in"),
        expires_at=session.get("expires_at"),
        refresh_token=session.get("refresh_token"),
        user=user_resp,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(body: RefreshRequest):
    """Refresh a Supabase session using a refresh token."""
    session = await supabase_auth_service.refresh_session(body.refresh_token)

    if not session or "access_token" not in session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    supabase_user = session.get("user", {})
    user_resp = _user_response_from_supabase(supabase_user) if supabase_user else None

    return Token(
        access_token=session["access_token"],
        token_type=session.get("token_type", "bearer"),
        expires_in=session.get("expires_in"),
        expires_at=session.get("expires_at"),
        refresh_token=session.get("refresh_token"),
        user=user_resp,
    )


@router.post("/guest", response_model=GuestTokenResponse)
async def guest_login():
    """Issue a short-lived guest token for unauthenticated access."""
    if not settings.GUEST_ACCESS_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest access is not enabled",
        )

    guest_token = create_guest_token()

    return GuestTokenResponse(
        access_token=guest_token,
        token_type="bearer",
        is_guest=True,
        expires_in=settings.GUEST_TOKEN_EXPIRE_MINUTES * 60,
        permissions=["read:public", "create:admission_request"],
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    token: Optional[str] = Depends(oauth2_scheme),
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Return the profile of the currently authenticated user."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    if current_user.get("type") == "guest":
        return UserResponse(
            id="guest",
            email="guest@school.local",
            name="Guest User",
            role="guest",
        )

    # Fetch up-to-date profile from Supabase
    if token:
        supabase_user = await supabase_auth_service.get_user_from_token(token)
        if supabase_user:
            return _user_response_from_supabase(supabase_user)

    # Fallback: build from decoded token payload
    return UserResponse(
        id=current_user.get("id") or current_user.get("sub", ""),
        email=current_user.get("email") or current_user.get("sub", ""),
        name=current_user.get("email") or current_user.get("sub", ""),
        role=current_user.get("role", "staff"),
    )


@router.post("/logout")
async def logout(token: Optional[str] = Depends(oauth2_scheme)):
    """Revoke the current session in Supabase."""
    if token:
        await supabase_auth_service.sign_out(token)
    return {"message": "Successfully logged out"}


