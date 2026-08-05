import logging
from typing import Annotated
from csv import DictWriter
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from postgrest.exceptions import APIError

from app.auth import get_current_user_id
from app.database import get_supabase
from app.schemas.check_in_schema import (
    AnalyzeCheckInRequest,
    CheckInResponse,
    CheckInUpdateRequest,
    CheckInWithAnalysis,
    TextCheckInRequest,
    TranscriptionResponse,
)
from app.services.analysis_service import AnalysisService
from app.services.rate_limiter import rate_limiter
from app.services.transcription_service import TranscriptionService

router = APIRouter(prefix="/check-ins", tags=["check-ins"])
logger = logging.getLogger(__name__)


@router.post("/text", response_model=CheckInResponse)
def create_text_check_in(payload: TextCheckInRequest, user_id: Annotated[str, Depends(get_current_user_id)]):
    rate_limiter.check(f"analysis:{user_id}", limit=20, window_seconds=60 * 60, label="AI analysis")
    logger.info("Creating text check-in for user %s", user_id)
    return AnalysisService().analyze_and_store(
        user_id,
        AnalyzeCheckInRequest(transcript=payload.transcript, input_type="text", goal_id=payload.goal_id),
    )


@router.post("/voice", response_model=TranscriptionResponse)
async def transcribe_voice(audio: UploadFile, user_id: Annotated[str, Depends(get_current_user_id)]):
    rate_limiter.check(f"transcription:{user_id}", limit=20, window_seconds=60 * 60, label="voice transcription")
    logger.info("Transcribing voice check-in for user %s", user_id)
    transcript = await TranscriptionService().transcribe(audio)
    return {"transcript": transcript}


@router.post("/analyze", response_model=CheckInResponse)
def analyze_check_in(payload: AnalyzeCheckInRequest, user_id: Annotated[str, Depends(get_current_user_id)]):
    rate_limiter.check(f"analysis:{user_id}", limit=20, window_seconds=60 * 60, label="AI analysis")
    logger.info("Analyzing check-in for user %s and goal %s", user_id, payload.goal_id)
    return AnalysisService().analyze_and_store(user_id, payload)


@router.put("/{check_in_id}/reanalyze", response_model=CheckInResponse)
def reanalyze_check_in(
    check_in_id: str,
    payload: CheckInUpdateRequest,
    user_id: Annotated[str, Depends(get_current_user_id)],
):
    rate_limiter.check(f"analysis:{user_id}", limit=20, window_seconds=60 * 60, label="AI analysis")
    logger.info("Reanalyzing check-in %s for user %s", check_in_id, user_id)
    return AnalysisService().reanalyze_existing(user_id, check_in_id, payload.transcript)


@router.get("/export.csv")
def export_check_ins(user_id: Annotated[str, Depends(get_current_user_id)]):
    rows = (
        get_supabase()
        .table("check_ins")
        .select("*, check_in_analyses(*)")
        .eq("user_id", user_id)
        .order("check_in_date", desc=True)
        .execute()
        .data
    )
    output = StringIO()
    writer = DictWriter(output, fieldnames=["date", "goal_id", "input_type", "score", "mood", "transcript", "insight", "next_action"])
    writer.writeheader()
    for row in rows:
        analysis = (row.get("check_in_analyses") or [None])[0] or {}
        writer.writerow(
            {
                "date": row.get("check_in_date") or "",
                "goal_id": row.get("goal_id") or "",
                "input_type": row.get("input_type") or "",
                "score": analysis.get("overall_score") or "",
                "mood": analysis.get("mood") or "",
                "transcript": row.get("transcript") or "",
                "insight": analysis.get("insight") or "",
                "next_action": analysis.get("tomorrow_action") or "",
            }
        )
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=goalvoice-check-ins.csv"},
    )


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
