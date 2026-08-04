from datetime import date

from fastapi import HTTPException
from postgrest.exceptions import APIError

from app.database import get_supabase
from app.schemas.check_in_schema import AnalyzeCheckInRequest, CheckInResponse
from app.services.openai_service import OpenAIService


class AnalysisService:
    def __init__(self, ai: OpenAIService | None = None) -> None:
        self.ai = ai or OpenAIService()

    def analyze_and_store(self, user_id: str, request: AnalyzeCheckInRequest) -> CheckInResponse:
        supabase = get_supabase()
        self._ensure_goal_check_in_schema(supabase)
        goal_query = (
            supabase.table("goals")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
        )
        if request.goal_id:
            goal_query = goal_query.eq("id", request.goal_id)
        goals = goal_query.execute().data

        if request.goal_id and not goals:
            raise HTTPException(status_code=404, detail="Goal not found.")

        profile_rows = supabase.table("profiles").select("*").eq("user_id", user_id).limit(1).execute().data
        analysis, raw = self.ai.analyze_daily(goals, request.transcript, profile_rows[0] if profile_rows else None)
        if request.replace_today and request.goal_id:
            (
                supabase.table("check_ins")
                .delete()
                .eq("user_id", user_id)
                .eq("goal_id", request.goal_id)
                .eq("check_in_date", date.today().isoformat())
                .execute()
            )
        check_in = (
            supabase.table("check_ins")
            .insert(
                {
                    "user_id": user_id,
                    "goal_id": request.goal_id,
                    "transcript": request.transcript,
                    "input_type": request.input_type,
                }
            )
            .execute()
            .data[0]
        )
        try:
            stored_analysis = (
                supabase.table("check_in_analyses")
                .insert(
                    {
                        "check_in_id": check_in["id"],
                        "user_id": user_id,
                        **analysis.model_dump(mode="json"),
                        "raw_ai_response": raw,
                    }
                )
                .execute()
                .data[0]
            )
        except Exception:
            supabase.table("check_ins").delete().eq("id", check_in["id"]).eq("user_id", user_id).execute()
            raise
        return CheckInResponse(check_in=check_in, analysis=stored_analysis)

    def _ensure_goal_check_in_schema(self, supabase) -> None:
        try:
            supabase.table("check_ins").select("id, goal_id").limit(1).execute()
        except APIError as exc:
            if "goal_id" in str(exc):
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Database update needed: run supabase/migrations/004_add_goal_id_to_check_ins.sql "
                        "in Supabase SQL Editor, then restart the backend."
                    ),
                ) from exc
            raise
