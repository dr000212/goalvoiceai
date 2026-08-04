from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id
from app.database import get_supabase
from app.schemas.report_schema import WeeklyReport
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports/weekly", tags=["weekly reports"])


@router.post("/generate", response_model=WeeklyReport)
def generate_weekly_report(user_id: Annotated[str, Depends(get_current_user_id)]):
    return ReportService().generate_and_store(user_id)


@router.get("/latest", response_model=WeeklyReport | None)
def latest_weekly_report(user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = (
        get_supabase()
        .table("weekly_reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


@router.get("", response_model=list[WeeklyReport])
def list_weekly_reports(user_id: Annotated[str, Depends(get_current_user_id)]):
    return (
        get_supabase()
        .table("weekly_reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
