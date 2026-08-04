from datetime import datetime

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    display_name: str = Field(default="", max_length=120)
    current_focus: str = Field(default="", max_length=1000)
    likes: str = Field(default="", max_length=1000)
    dislikes: str = Field(default="", max_length=1000)
    personal_context: str = Field(default="", max_length=1600)


class Profile(ProfileUpdate):
    id: str
    user_id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
