def score_label(score: int | None) -> str:
    if score is None:
        return "Needs Attention"
    if score >= 80:
        return "Strong Progress"
    if score >= 60:
        return "On Track"
    if score >= 40:
        return "Needs Attention"
    return "Falling Behind"
