from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.auth import get_current_user_id
from app.database import get_supabase
from app.schemas.profile_schema import Profile, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def _profile_schema_error(exc: APIError) -> HTTPException:
    return HTTPException(
        status_code=500,
        detail=(
            "Database update needed: run supabase/migrations/005_create_profiles.sql "
            "in Supabase SQL Editor, then restart the backend."
        ),
    )


@router.get("", response_model=Profile | None)
def get_profile(user_id: Annotated[str, Depends(get_current_user_id)]):
    try:
        rows = get_supabase().table("profiles").select("*").eq("user_id", user_id).limit(1).execute().data
    except APIError as exc:
        if "profiles" in str(exc):
            raise _profile_schema_error(exc) from exc
        raise
    return rows[0] if rows else None


@router.put("", response_model=Profile)
def upsert_profile(payload: ProfileUpdate, user_id: Annotated[str, Depends(get_current_user_id)]):
    data = {"user_id": user_id, **payload.model_dump(mode="json")}
    try:
        rows = get_supabase().table("profiles").upsert(data, on_conflict="user_id").execute().data
    except APIError as exc:
        if "profiles" in str(exc):
            raise _profile_schema_error(exc) from exc
        raise
    return rows[0]
