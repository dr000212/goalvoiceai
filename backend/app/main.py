from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import account, admin, check_ins, dashboard, goals, profile, reports

app = FastAPI(title="GoalVoice AI API", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(goals.router)
app.include_router(check_ins.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(account.router)
app.include_router(profile.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "GoalVoice AI"}
