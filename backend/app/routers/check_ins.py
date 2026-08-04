from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from postgrest.exceptions import APIError

from app.auth import get_current_user_id
from app.database import get_supabase
from app.schemas.check_in_schema import (
    AnalyzeCheckInRequest,
    CheckInResponse,
    CheckInWithAnalysis,
    TextCheckInRequest,
    TranscriptionResponse,
)
from app.services.analysis_service import AnalysisService
from app.services.transcription_service import TranscriptionService

router = APIRouter(prefix="/check-ins", tags=["check-ins"])


@router.post("/text", response_model=CheckInResponse)
def create_text_check_in(payload: TextCheckInRequest, user_id: Annotated[str, Depends(get_current_user_id)]):
    return AnalysisService().analyze_and_store(
        user_id,
        AnalyzeCheckInRequest(transcript=payload.transcript, input_type="text", goal_id=payload.goal_id),
    )


@router.post("/voice", response_model=TranscriptionResponse)
async def transcribe_voice(audio: UploadFile, user_id: Annotated[str, Depends(get_current_user_id)]):
    _ = user_id
    transcript = await TranscriptionService().transcribe(audio)
    return {"transcript": transcript}


@router.post("/analyze", response_model=CheckInResponse)
def analyze_check_in(payload: AnalyzeCheckInRequest, user_id: Annotated[str, Depends(get_current_user_id)]):
    return AnalysisService().analyze_and_store(user_id, payload)


@router.get("", response_model=list[CheckInWithAnalysis])
def list_check_ins(user_id: Annotated[str, Depends(get_current_user_id)], goal_id: str | None = None):
    query = (
        get_supabase()
        .table("check_ins")
        .select("*, check_in_analyses(*)")
        .eq("user_id", user_id)
    )
    if goal_id:
        query = query.eq("goal_id", goal_id)
    try:
        rows = query.order("created_at", desc=True).execute().data
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
    return [{**row, "analysis": (row.get("check_in_analyses") or [None])[0]} for row in rows]


@router.get("/{check_in_id}", response_model=CheckInWithAnalysis)
def get_check_in(check_in_id: str, user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = (
        get_supabase()
        .table("check_ins")
        .select("*, check_in_analyses(*)")
        .eq("id", check_in_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Check-in not found.")
    row = rows[0]
    return {**row, "analysis": (row.get("check_in_analyses") or [None])[0]}
