"""Supabase authentication service using the Supabase Auth REST API."""

from typing import Optional

import httpx

from app.core.config import settings


def _auth_url(path: str) -> str:
    return f"{settings.SUPABASE_URL}/auth/v1{path}"


def _headers() -> dict:
    return {
        "apikey": settings.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }


def _admin_headers() -> dict:
    return {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


async def sign_in_with_password(email: str, password: str) -> Optional[dict]:
    """Authenticate a user with email/password via Supabase Auth."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _auth_url("/token?grant_type=password"),
            json={"email": email, "password": password},
            headers=_headers(),
        )
        if response.status_code == 200:
            return response.json()
        return None


async def get_user_from_token(token: str) -> Optional[dict]:
    """Retrieve the Supabase user for the given Bearer token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            _auth_url("/user"),
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )
        if response.status_code == 200:
            return response.json()
        return None


async def sign_up(email: str, password: str, user_metadata: Optional[dict] = None) -> Optional[dict]:
    """Register a new user via Supabase Auth."""
    body: dict = {"email": email, "password": password}
    if user_metadata:
        body["data"] = user_metadata

    async with httpx.AsyncClient() as client:
        response = await client.post(
            _auth_url("/signup"),
            json=body,
            headers=_headers(),
        )
        if response.status_code in (200, 201):
            return response.json()
        return None


async def refresh_session(refresh_token: str) -> Optional[dict]:
    """Refresh an existing Supabase session."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _auth_url("/token?grant_type=refresh_token"),
            json={"refresh_token": refresh_token},
            headers=_headers(),
        )
        if response.status_code == 200:
            return response.json()
        return None


async def sign_out(token: str) -> bool:
    """Revoke a Supabase session token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _auth_url("/logout"),
            headers={
                "apikey": settings.SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )
        return response.status_code in (200, 204)


async def admin_list_users() -> Optional[list]:
    """List all users (requires service role key)."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            _auth_url("/admin/users"),
            headers=_admin_headers(),
        )
        if response.status_code == 200:
            return response.json().get("users", [])
        return None
