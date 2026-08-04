from datetime import datetime
from pydantic import BaseModel, Field


class CompletedAction(BaseModel):
    action: str
    related_goal: str
    evidence: str


class MissedAction(BaseModel):
    action: str
    related_goal: str
    reason_if_known: str | None = None


class Blocker(BaseModel):
    blocker: str
    evidence: str


class GoalScore(BaseModel):
    goal_id: str
    goal_title: str
    score: int = Field(ge=0, le=100)
    reason: str


class DailyAnalysisCreate(BaseModel):
    mood: str
    energy_level: int = Field(ge=1, le=10)
    completed_actions: list[CompletedAction] = []
    missed_actions: list[MissedAction] = []
    blockers: list[Blocker] = []
    goal_scores: list[GoalScore] = []
    overall_score: int = Field(ge=0, le=100)
    insight: str
    tomorrow_action: str


class DailyAnalysis(DailyAnalysisCreate):
    id: str
    check_in_id: str
    user_id: str
    raw_ai_response: dict | None = None
    created_at: datetime | None = None
