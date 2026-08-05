from datetime import date, datetime
from pydantic import BaseModel, Field


class GoalProgress(BaseModel):
    goal_id: str
    goal_title: str
    weekly_score: int = Field(ge=0, le=100)
    summary: str


class WeeklyReportCreate(BaseModel):
    overall_week_score: int = Field(ge=0, le=100)
    goal_progress: list[GoalProgress] = []
    best_day: str
    weakest_day: str
    repeated_blockers: list[str] = []
    positive_patterns: list[str] = []
    summary: str
    next_week_recommendations: list[str] = []


class WeeklyReport(WeeklyReportCreate):
    id: str
    user_id: str
    goal_id: str | None = None
    week_start_date: date
    week_end_date: date
    raw_ai_response: dict | None = None
    created_at: datetime | None = None
