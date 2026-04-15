"""User service for authentication and user management."""

from typing import Optional, Dict
from app.core.security import verify_password, get_password_hash

# In-memory user store for demo purposes
# In production, replace with database operations
_demo_users: Dict[str, dict] = {
    "admin@school.local": {
        "id": "1",
        "email": "admin@school.local",
        "name": "Admin User",
        "role": "admin",
        "hashed_password": get_password_hash("admin123")
    },
    "staff@school.local": {
        "id": "2",
        "email": "staff@school.local",
        "name": "Staff User",
        "role": "staff",
        "hashed_password": get_password_hash("staff123")
    }
}


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email address."""
    if email in _demo_users:
        user = _demo_users[email].copy()
        del user["hashed_password"]
        return user
    return None


async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user with email and password."""
    if email not in _demo_users:
        return None
    
    user = _demo_users[email]
    if not verify_password(password, user["hashed_password"]):
        return None
    
    # Return user without password
    result = user.copy()
    del result["hashed_password"]
    return result


async def create_user(email: str, password: str, name: str, role: str = "user") -> dict:
    """Create a new user."""
    if email in _demo_users:
        raise ValueError("User already exists")
    
    user_id = str(len(_demo_users) + 1)
    _demo_users[email] = {
        "id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "hashed_password": get_password_hash(password)
    }
    
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "role": role
    }
