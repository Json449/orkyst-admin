"""
User ID configuration.
LOCAL_TEST_USER_ID is used when no user is specified (local dev / testing bypass).
In production, pass an explicit user_id from auth headers / session.
"""

LOCAL_TEST_USER_ID = "local_test"


def resolve_user_id(user_id: str | None) -> str:
    """Return user_id if provided, otherwise fall back to local test bypass."""
    return user_id if user_id else LOCAL_TEST_USER_ID
