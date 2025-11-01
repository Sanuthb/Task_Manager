from datetime import datetime
from math import exp


def heuristic_priority_score(priority: str, due_date, estimated_hours):
    base = {'low': 0.2, 'medium': 0.5, 'high': 0.8}.get(priority or 'medium', 0.5)
    due_factor = 0.5
    if due_date:
        try:
            if isinstance(due_date, str):
                due_dt = datetime.fromisoformat(due_date)
            else:
                due_dt = due_date
            days = (due_dt - datetime.now()).total_seconds() / 86400.0
            due_factor = 1.0 / (1.0 + exp(days - 2))
        except Exception:
            due_factor = 0.5
    est = estimated_hours or 1.0
    est_factor = min(1.0, est / 8.0)
    return round(100 * (0.6 * base + 0.3 * due_factor + 0.1 * est_factor), 2)
