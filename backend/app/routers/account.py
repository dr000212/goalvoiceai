from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id
from app.database import get_supabase

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("/data")
def delete_account_data(user_id: Annotated[str, Depends(get_current_user_id)]):
    supabase = get_supabase()
    for table in ["weekly_reports", "check_in_analyses", "check_ins", "goals", "profiles"]:
        supabase.table(table).delete().eq("user_id", user_id).execute()
    return {"message": "Your data has been deleted."}
