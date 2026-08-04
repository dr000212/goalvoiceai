from datetime import date, timedelta


def current_week_window(today: date | None = None) -> tuple[date, date]:
    anchor = today or date.today()
    start = anchor - timedelta(days=anchor.weekday())
    return start, start + timedelta(days=6)
