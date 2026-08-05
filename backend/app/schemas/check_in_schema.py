from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.analysis_schema import DailyAnalysis


InputType = Literal["text", "voice"]


class TextCheckInRequest(BaseModel):
    transcript: str = Field(min_length=1)
    goal_id: str | None = None


class AnalyzeCheckInRequest(BaseModel):
    transcript: str = Field(min_length=1)
    input_type: InputType = "text"
    goal_id: str | None = None
    replace_today: bool = False


class CheckInUpdateRequest(BaseModel):
    transcript: str = Field(min_length=1)


class CheckIn(BaseModel):
    id: str
    user_id: str
    goal_id: str | None = None
    transcript: str
    input_type: InputType
    check_in_date: date | None = None
    created_at: datetime | None = None


class CheckInWithAnalysis(CheckIn):
    analysis: DailyAnalysis | None = None


class CheckInResponse(BaseModel):
    check_in: CheckIn
    analysis: DailyAnalysis


class TranscriptionResponse(BaseModel):
    transcript: str
