from datetime import date

from fastapi import HTTPException

from app.database import get_supabase
from app.schemas.report_schema import WeeklyReport
from app.services.openai_service import OpenAIService
from app.utils.dates import current_week_window


class ReportService:
    def __init__(self, ai: OpenAIService | None = None) -> None:
        self.ai = ai or OpenAIService()

    def generate_and_store(self, user_id: str, today: date | None = None) -> WeeklyReport:
        week_start, week_end = current_week_window(today)
        supabase = get_supabase()
        goals = supabase.table("goals").select("*").eq("user_id", user_id).execute().data
        profile_rows = supabase.table("profiles").select("*").eq("user_id", user_id).limit(1).execute().data
        check_ins = (
            supabase.table("check_ins")
            .select("*, check_in_analyses(*)")
            .eq("user_id", user_id)
            .gte("check_in_date", week_start.isoformat())
            .lte("check_in_date", week_end.isoformat())
            .order("check_in_date")
            .execute()
            .data
        )
        if not check_ins:
            raise HTTPException(status_code=400, detail="Add your first check-in before generating a weekly report.")

        report, raw = self.ai.generate_weekly_report(goals, check_ins, profile_rows[0] if profile_rows else None)
        stored = (
            supabase.table("weekly_reports")
            .insert(
                {
                    "user_id": user_id,
                    "week_start_date": week_start.isoformat(),
                    "week_end_date": week_end.isoformat(),
                    **report.model_dump(mode="json"),
                    "raw_ai_response": raw,
                }
            )
            .execute()
            .data[0]
        )
        return WeeklyReport.model_validate(stored)
