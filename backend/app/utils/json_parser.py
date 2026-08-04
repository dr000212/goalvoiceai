import json


def parse_json_object(raw: str) -> dict:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        value = json.loads(raw[start : end + 1])

    if not isinstance(value, dict):
        raise ValueError("AI response must be a JSON object.")
    return value
