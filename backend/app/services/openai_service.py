import json
from typing import Any

from fastapi import HTTPException
from openai import OpenAI
from pydantic import ValidationError

from app.config import get_settings
from app.schemas.analysis_schema import DailyAnalysisCreate
from app.schemas.report_schema import WeeklyReportCreate
from app.utils.json_parser import parse_json_object


DAILY_SYSTEM_PROMPT = """You are an AI goal accountability coach. Your job is to analyze a user's daily check-in and compare it against their active goals.

Be practical, supportive, and honest. Do not shame the user. Do not give medical, mental-health, therapy, legal, financial, or diagnosis advice. Focus only on actions, progress, blockers, patterns, and the next small step.

Use the user profile only as helpful context for tone and practical recommendations. Do not over-assume identity, personality, health, or diagnosis from the profile.

Return only valid JSON using this schema:
{
"mood": "string",
"energy_level": 1,
"completed_actions": [{"action": "string", "related_goal": "string", "evidence": "string"}],
"missed_actions": [{"action": "string", "related_goal": "string", "reason_if_known": "string"}],
"blockers": [{"blocker": "string", "evidence": "string"}],
"goal_scores": [{"goal_id": "string", "goal_title": "string", "score": 0, "reason": "string"}],
"overall_score": 0,
"insight": "string",
"tomorrow_action": "string"
}

Scoring: 0 means no progress, 50 means partial progress, 100 means excellent progress. If most daily targets were completed, score above 70. If no goal-related action was completed, score below 50. Do not invent actions. If information is missing, say it is unclear.

Make "insight" 3 to 5 clear sentences explaining: what went well, what was missed or unclear, what pattern it suggests, and how it affects the selected goal. Make "tomorrow_action" 2 to 4 sentences with a specific first step, suggested time or order, and a small fallback action if the user has low energy or limited time."""

WEEKLY_SYSTEM_PROMPT = """You are an AI weekly goal accountability coach. Analyze the user's recent daily check-ins and goal analyses. Identify progress, patterns, repeated blockers, best day, weakest day, and recommendations for next week.

Be supportive, practical, and honest. Do not shame the user. Do not give medical, mental-health, therapy, legal, financial, or diagnosis advice. Use the user profile only as helpful context for clearer recommendations.

Make every summary specific to the user's actual goals and check-ins. Recommendations should be concrete, ordered, and small enough to start within one day.

Return only valid JSON using this schema:
{
"overall_week_score": 0,
"goal_progress": [{"goal_id": "string", "goal_title": "string", "weekly_score": 0, "summary": "string"}],
"best_day": "string",
"weakest_day": "string",
"repeated_blockers": ["string"],
"positive_patterns": ["string"],
"summary": "string",
"next_week_recommendations": ["string"]
}"""


class OpenAIService:
    def __init__(self) -> None:
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def _chat_json(self, system_prompt: str, user_prompt: str) -> dict[str, Any]:
        if self.client is None:
            raise HTTPException(status_code=503, detail="OpenAI API key is not configured.")

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return parse_json_object(content)

    def _validated_json(self, system_prompt: str, user_prompt: str, schema: type) -> tuple[Any, dict]:
        last_error: Exception | None = None
        retry_prompt = user_prompt
        for attempt in range(2):
            try:
                raw = self._chat_json(system_prompt, retry_prompt)
                return schema.model_validate(raw), raw
            except (ValidationError, ValueError, json.JSONDecodeError) as exc:
                last_error = exc
                retry_prompt = (
                    f"{user_prompt}\n\nYour previous response did not match the required JSON schema. "
                    "Return only valid JSON with every required field."
                )
                if attempt == 1:
                    break
        raise HTTPException(status_code=502, detail="AI returned an invalid response.") from last_error

    def analyze_daily(
        self, goals: list[dict[str, Any]], transcript: str, profile: dict[str, Any] | None = None
    ) -> tuple[DailyAnalysisCreate, dict]:
        prompt = (
            f"User profile:\n{json.dumps(profile or {}, default=str)}\n\n"
            f"User goals:\n{json.dumps(goals, default=str)}\n\n"
            f"Daily check-in transcript:\n{transcript}"
        )
        return self._validated_json(DAILY_SYSTEM_PROMPT, prompt, DailyAnalysisCreate)

    def generate_weekly_report(
        self, goals: list[dict[str, Any]], check_ins: list[dict[str, Any]], profile: dict[str, Any] | None = None
    ) -> tuple[WeeklyReportCreate, dict]:
        prompt = (
            f"User profile:\n{json.dumps(profile or {}, default=str)}\n\n"
            f"User goals:\n{json.dumps(goals, default=str)}\n\n"
            f"Recent check-ins and analyses:\n{json.dumps(check_ins, default=str)}"
        )
        return self._validated_json(WEEKLY_SYSTEM_PROMPT, prompt, WeeklyReportCreate)
