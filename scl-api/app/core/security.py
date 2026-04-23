"""Security utilities for authentication and authorization."""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from jose.backends import ECKey
import httpx
import bcrypt

from app.core.config import settings

# Cache JWKS keys in memory to avoid repeated network calls
_jwks_cache: Optional[dict] = None


async def _get_jwks() -> Optional[dict]:
    """Fetch and cache the Supabase JWKS (public keys for ES256 verification)."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.SUPABASE_JWKS_URL, timeout=5)
            if resp.status_code == 200:
                _jwks_cache = resp.json()
                return _jwks_cache
    except Exception:
        pass
    return None


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def create_guest_token() -> str:
    """Create a guest access token with limited permissions."""
    expires_delta = timedelta(minutes=settings.GUEST_TOKEN_EXPIRE_MINUTES)
    
    token_data = {
        "sub": "guest",
        "type": "guest",
        "permissions": ["read:public", "create:admission_request"]
    }
    
    return create_access_token(token_data, expires_delta)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token (local or Supabase-issued, sync path).

    Handles:
    - Local HS256 guest/legacy tokens (SECRET_KEY)
    - Supabase legacy HS256 tokens (SUPABASE_JWT_SECRET)
    Note: ES256 (ECC P-256) verification requires the async path; if this
    returns None the auth endpoint falls back to the Supabase /user API.
    """
    # Try local secret first (for guest tokens)
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        pass

    # Try legacy Supabase HS256 JWT secret
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        except JWTError:
            pass

    return None


async def decode_token_async(token: str) -> Optional[dict]:
    """Decode and validate a JWT token, including ECC P-256 (ES256) Supabase tokens."""
    # Try sync path first (guest tokens + legacy HS256)
    result = decode_token(token)
    if result:
        return result

    # Try ES256 via JWKS (current Supabase default)
    jwks = await _get_jwks()
    if jwks:
        for key_data in jwks.get("keys", []):
            try:
                public_key = ECKey(key_data, algorithm="ES256")
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["ES256"],
                    options={"verify_aud": False},
                )
                return payload
            except Exception:
                continue

    return None
