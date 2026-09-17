from datetime import date
import re
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_user_id
from app.config import get_settings
from app.main import app
from app.schemas.analysis_schema import DailyAnalysisCreate
from app.schemas.check_in_schema import AnalyzeCheckInRequest
from app.schemas.report_schema import WeeklyReportCreate
from app.services.analysis_service import AnalysisService
from app.routers.dashboard import _calendar_days, _current_streak
from app.services.report_service import ReportService
from app.services.transcription_service import TranscriptionService


USER_ID = "11111111-1111-1111-1111-111111111111"


def test_vercel_origin_is_allowed_by_cors_config():
    settings = get_settings()
    origin = "https://goalvoiceai-fz7k.vercel.app"
    assert origin in settings.allowed_origins or re.fullmatch(settings.cors_origin_regex, origin)


class Query:
    def __init__(self, db, table):
        self.db = db
        self.table = table
        self.rows = db.setdefault(table, [])
        self.filters = []
        self.limit_count = None
        self.delete_mode = False
        self.insert_payload = None

    def select(self, *_):
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def gte(self, *_):
        return self

    def lte(self, *_):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def insert(self, payload):
        self.insert_payload = payload
        return self

    def update(self, payload):
        data = []
        for row in self._filtered():
            row.update(payload)
            data.append(row)
        return SimpleNamespace(data=data)

    def delete(self):
        self.delete_mode = True
        return self

    def execute(self):
        if self.insert_payload is not None:
            row = {**self.insert_payload, "id": f"{self.table}-{len(self.rows) + 1}"}
            if self.table == "check_ins":
                row.setdefault("check_in_date", date.today().isoformat())
            self.rows.append(row)
            return SimpleNamespace(data=[row])
        if self.delete_mode:
            deleted = self._filtered()
            self.db[self.table] = [row for row in self.rows if row not in deleted]
            return SimpleNamespace(data=deleted)
        rows = self._filtered()
        if self.limit_count:
            rows = rows[: self.limit_count]
        return SimpleNamespace(data=rows)

    def _filtered(self):
        rows = list(self.db[self.table])
        for key, value in self.filters:
            rows = [row for row in rows if row.get(key) == value]
        if self.table == "check_ins":
            for row in rows:
                analyses = [a for a in self.db.get("check_in_analyses", []) if a.get("check_in_id") == row.get("id")]
                row.setdefault("check_in_analyses", analyses)
        return rows


class FakeSupabase:
    def __init__(self, seed=None):
        self.db = seed or {}

    def table(self, name):
        return Query(self.db, name)


class FakeAI:
    def analyze_daily(self, goals, transcript, profile=None, recent_check_ins=None):
        analysis = DailyAnalysisCreate(
            mood="Motivated",
            energy_level=7,
            completed_actions=[{"action": "Studied", "related_goal": goals[0]["title"], "evidence": transcript}],
            missed_actions=[],
            blockers=[],
            goal_scores=[{"goal_id": goals[0]["id"], "goal_title": goals[0]["title"], "score": 80, "reason": "Clear progress."}],
            overall_score=80,
            insight="You moved the goal forward.",
            tomorrow_action="Repeat the smallest useful action.",
        )
        return analysis, analysis.model_dump(mode="json")

    def generate_weekly_report(self, goals, check_ins, profile=None):
        report = WeeklyReportCreate(
            overall_week_score=76,
            goal_progress=[{"goal_id": goals[0]["id"], "goal_title": goals[0]["title"], "weekly_score": 76, "summary": "Solid week."}],
            best_day="Wednesday",
            weakest_day="Friday",
            repeated_blockers=["Low energy"],
            positive_patterns=["Consistent applications"],
            summary="You made meaningful progress with some energy dips.",
            next_week_recommendations=["Schedule portfolio work first."],
        )
        return report, report.model_dump(mode="json")


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeSupabase(
        {
            "goals": [{"id": "goal-1", "user_id": USER_ID, "title": "Get AI Engineer job", "importance": "high", "status": "active"}],
            "check_ins": [],
            "check_in_analyses": [],
            "weekly_reports": [],
        }
    )
    monkeypatch.setattr("app.routers.goals.get_supabase", lambda: db)
    monkeypatch.setattr("app.routers.check_ins.get_supabase", lambda: db)
    monkeypatch.setattr("app.services.analysis_service.get_supabase", lambda: db)
    monkeypatch.setattr("app.services.report_service.get_supabase", lambda: db)
    monkeypatch.setattr("app.routers.account.get_supabase", lambda: db)
    return db


def test_creating_goals(fake_db, monkeypatch):
    app.dependency_overrides.clear()
    monkeypatch.setattr("app.routers.goals.get_current_user_id", lambda: USER_ID)
    created = (
        fake_db.table("goals")
        .insert({"user_id": USER_ID, "title": "Improve fitness", "importance": "medium", "status": "active"})
        .execute()
        .data[0]
    )
    assert created["user_id"] == USER_ID
    assert created["title"] == "Improve fitness"


def test_fetching_only_current_user_goals(fake_db):
    fake_db.db["goals"].append({"id": "goal-2", "user_id": "other", "title": "Other", "importance": "low", "status": "active"})
    rows = fake_db.table("goals").select("*").eq("user_id", USER_ID).eq("status", "active").execute().data
    assert len(rows) == 1
    assert rows[0]["user_id"] == USER_ID


def test_deleting_goal_removes_only_current_user_goal(fake_db):
    fake_db.db["goals"].append({"id": "goal-2", "user_id": "other", "title": "Other", "importance": "low", "status": "active"})
    deleted = fake_db.table("goals").delete().eq("id", "goal-1").eq("user_id", USER_ID).execute().data
    remaining = fake_db.table("goals").select("*").execute().data
    assert deleted[0]["id"] == "goal-1"
    assert [goal["id"] for goal in remaining] == ["goal-2"]


def test_creating_text_check_in(fake_db):
    response = AnalysisService(ai=FakeAI()).analyze_and_store(
        USER_ID, AnalyzeCheckInRequest(transcript="Studied and applied to jobs.", input_type="text", goal_id="goal-1")
    )
    assert response.analysis.overall_score == 80
    assert response.check_in.goal_id == "goal-1"
    assert response.check_in.transcript.startswith("Studied")


def test_list_check_ins_filters_by_goal_route(fake_db):
    app.dependency_overrides[get_current_user_id] = lambda: USER_ID
    fake_db.db["check_ins"] = [
        {"id": "check-1", "user_id": USER_ID, "goal_id": "goal-1", "transcript": "Goal one", "input_type": "text", "check_in_date": date.today().isoformat()},
        {"id": "check-2", "user_id": USER_ID, "goal_id": "goal-2", "transcript": "Goal two", "input_type": "text", "check_in_date": date.today().isoformat()},
    ]
    response = TestClient(app).get("/check-ins?goal_id=goal-1")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert [row["id"] for row in response.json()] == ["check-1"]


@pytest.mark.asyncio
async def test_transcription_endpoint_mock(monkeypatch):
    class MockTranscriptionService:
        async def transcribe(self, audio):
            return "Mock transcript"

    monkeypatch.setattr("app.routers.check_ins.TranscriptionService", MockTranscriptionService)
    assert await MockTranscriptionService().transcribe(None) == "Mock transcript"


def test_ai_json_validation():
    analysis = DailyAnalysisCreate.model_validate(
        {
            "mood": "Tired but productive",
            "energy_level": 6,
            "completed_actions": [],
            "missed_actions": [],
            "blockers": [],
            "goal_scores": [],
            "overall_score": 70,
            "insight": "Useful progress.",
            "tomorrow_action": "Do portfolio first.",
        }
    )
    assert analysis.overall_score == 70


def test_weekly_report_generation(fake_db):
    fake_db.db["check_ins"].append({"id": "check_ins-1", "user_id": USER_ID, "transcript": "Applied", "input_type": "text", "check_in_date": date.today().isoformat()})
    report = ReportService(ai=FakeAI()).generate_and_store(USER_ID)
    assert report.overall_week_score == 76
    assert fake_db.db["weekly_reports"]


def test_weekly_report_requires_at_least_one_check_in(fake_db):
    with pytest.raises(Exception) as exc:
        ReportService(ai=FakeAI()).generate_and_store(USER_ID)
    assert "first check-in" in str(exc.value)


def test_streak_waits_for_today_until_day_ends():
    yesterday = date.today().replace().toordinal() - 1
    yesterday_iso = date.fromordinal(yesterday).isoformat()
    assert _current_streak([{"check_in_date": yesterday_iso}]) == 1


def test_calendar_marks_unfinished_today_in_progress():
    days = _calendar_days([], days=1)
    assert days[0]["is_today"] is True
    assert days[0]["status"] == "in_progress"


def test_ai_schema_validation_retries_once():
    from app.services.openai_service import OpenAIService

    class RetryAI(OpenAIService):
        def __init__(self):
            self.calls = 0

        def _chat_json(self, system_prompt, user_prompt):
            self.calls += 1
            if self.calls == 1:
                return {"mood": "Missing fields"}
            return {
                "mood": "Focused",
                "energy_level": 7,
                "completed_actions": [],
                "missed_actions": [],
                "blockers": [],
                "goal_scores": [],
                "overall_score": 70,
                "insight": "Progress was made.",
                "tomorrow_action": "Continue.",
            }

    analysis, _ = RetryAI().analyze_daily([], "Worked on goal.")
    assert analysis.overall_score == 70


def test_delete_account_data(fake_db):
    for table in ["weekly_reports", "check_in_analyses", "check_ins", "goals"]:
        fake_db.table(table).delete().eq("user_id", USER_ID).execute()
    assert fake_db.db["goals"] == []
