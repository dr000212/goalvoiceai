from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id
from app.database import get_supabase

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _current_streak(check_ins: list[dict]) -> int:
    dates = {row.get("check_in_date") for row in check_ins if row.get("check_in_date")}
    streak = 0
    today = date.today()
    cursor = today if today.isoformat() in dates else today - timedelta(days=1)
    while cursor.isoformat() in dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _calendar_days(check_ins: list[dict], days: int = 7) -> list[dict]:
    checked_dates = {row.get("check_in_date") for row in check_ins if row.get("check_in_date")}
    start = date.today() - timedelta(days=days - 1)
    return [
        {
            "date": (start + timedelta(days=offset)).isoformat(),
            "status": (
                "completed"
                if (start + timedelta(days=offset)).isoformat() in checked_dates
                else "in_progress"
                if start + timedelta(days=offset) == date.today()
                else "missed"
            ),
            "is_today": start + timedelta(days=offset) == date.today(),
        }
        for offset in range(days)
    ]


def _daily_reports(check_ins: list[dict], goals: list[dict]) -> list[dict]:
    goal_titles = {goal["id"]: goal.get("title") for goal in goals}
    reports = []
    for row in check_ins:
        analysis = (row.get("check_in_analyses") or [None])[0]
        reports.append(
            {
                "id": row.get("id"),
                "date": row.get("check_in_date"),
                "goal_id": row.get("goal_id"),
                "goal_title": goal_titles.get(row.get("goal_id")),
                "transcript": row.get("transcript"),
                "score": analysis.get("overall_score") if analysis else None,
                "mood": analysis.get("mood") if analysis else None,
                "insight": analysis.get("insight") if analysis else None,
                "next_action": analysis.get("tomorrow_action") if analysis else None,
            }
        )
    return reports[:7]


@router.get("")
def dashboard(user_id: Annotated[str, Depends(get_current_user_id)]):
    supabase = get_supabase()
    active_goals = supabase.table("goals").select("*").eq("user_id", user_id).eq("status", "active").execute().data
    all_goals = supabase.table("goals").select("*").eq("user_id", user_id).execute().data
    check_ins = (
        supabase.table("check_ins")
        .select("*, check_in_analyses(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
        .data
    )
    reports = (
        supabase.table("weekly_reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    analyses = [(row.get("check_in_analyses") or [None])[0] for row in check_ins]
    scores = [analysis["overall_score"] for analysis in analyses if analysis and analysis.get("overall_score") is not None]
    return {
        "active_goals": active_goals,
        "latest_check_in": check_ins[0] if check_ins else None,
        "latest_analysis": analyses[0] if analyses else None,
        "current_streak": _current_streak(check_ins),
        "calendar_days": _calendar_days(check_ins),
        "daily_reports": _daily_reports(check_ins, all_goals),
        "weekly_average_score": round(sum(scores[:7]) / len(scores[:7])) if scores[:7] else None,
        "latest_weekly_report": reports[0] if reports else None,
    }
