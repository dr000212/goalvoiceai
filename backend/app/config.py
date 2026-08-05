from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    openai_api_key: str = ""
    openai_transcription_model: str = "gpt-4o-mini-transcribe"
    database_url: str = ""
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cors_origin_regex: str = r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}):3000"
    admin_user_ids: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def admin_ids(self) -> set[str]:
        return {item.strip() for item in self.admin_user_ids.split(",") if item.strip()}


@lru_cache
def get_settings() -> Settings:
    return Settings()
