from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


Importance = Literal["low", "medium", "high"]
GoalStatus = Literal["active", "archived"]


class GoalBase(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    category: str | None = None
    description: str | None = None
    target_date: date | None = None
    weekly_target: str | None = None
    daily_target: str | None = None
    importance: Importance = "medium"


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    category: str | None = None
    description: str | None = None
    target_date: date | None = None
    weekly_target: str | None = None
    daily_target: str | None = None
    importance: Importance | None = None
    status: GoalStatus | None = None


class Goal(GoalBase):
    id: str
    user_id: str
    status: GoalStatus = "active"
    created_at: datetime | None = None
    updated_at: datetime | None = None
