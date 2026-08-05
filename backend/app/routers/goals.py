from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id
from app.database import get_supabase
from app.schemas.goal_schema import Goal, GoalCreate, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.post("", response_model=Goal)
def create_goal(payload: GoalCreate, user_id: Annotated[str, Depends(get_current_user_id)]):
    data = {**payload.model_dump(mode="json"), "user_id": user_id}
    return get_supabase().table("goals").insert(data).execute().data[0]


@router.get("", response_model=list[Goal])
def list_goals(user_id: Annotated[str, Depends(get_current_user_id)]):
    return (
        get_supabase().table("goals").select("*").eq("user_id", user_id).eq("status", "active").order("created_at", desc=True).execute().data
    )


@router.get("/{goal_id}", response_model=Goal)
def get_goal(goal_id: str, user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = get_supabase().table("goals").select("*").eq("id", goal_id).eq("user_id", user_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return rows[0]


@router.put("/{goal_id}", response_model=Goal)
def update_goal(goal_id: str, payload: GoalUpdate, user_id: Annotated[str, Depends(get_current_user_id)]):
    update = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
    rows = get_supabase().table("goals").update(update).eq("id", goal_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return rows[0]


@router.post("/{goal_id}/archive", response_model=Goal)
def archive_goal(goal_id: str, user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = get_supabase().table("goals").update({"status": "archived"}).eq("id", goal_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return rows[0]


@router.post("/{goal_id}/complete", response_model=Goal)
def complete_goal(goal_id: str, user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = get_supabase().table("goals").update({"status": "completed"}).eq("id", goal_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return rows[0]


@router.delete("/{goal_id}")
def delete_goal(goal_id: str, user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = get_supabase().table("goals").delete().eq("id", goal_id).eq("user_id", user_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found.")
    return {"message": "Goal has been deleted."}
