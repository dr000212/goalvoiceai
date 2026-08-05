from typing import Annotated
from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id
from app.config import get_settings
from app.database import get_supabase

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/status")
def admin_status(user_id: Annotated[str, Depends(get_current_user_id)]):
    if user_id not in get_settings().admin_ids:
        raise HTTPException(status_code=403, detail="Admin access required.")

    supabase = get_supabase()
    tables = ["goals", "check_ins", "check_in_analyses", "weekly_reports", "profiles"]
    counts = {}
    for table in tables:
        counts[table] = len(supabase.table(table).select("id").execute().data)

    check_ins_today = (
        supabase.table("check_ins")
        .select("id")
        .eq("check_in_date", date.today().isoformat())
        .execute()
        .data
    )
    ai_request_estimate = counts.get("check_in_analyses", 0) + counts.get("weekly_reports", 0)

    return {
        "status": "ok",
        "counts": counts,
        "check_ins_today": len(check_ins_today),
        "estimated_ai_requests": ai_request_estimate,
    }
