import re
from datetime import datetime, timedelta
import dateparser

PRIORITY_WORDS = {
    'low': ['sometime', 'whenever', 'low', 'later'],
    'medium': ['should', 'normal', 'medium'],
    'high': ['urgent', 'asap', 'important', 'high', 'immediately', 'today']
}

CATEGORIES = {
    'work': ['report', 'meeting', 'email', 'presentation', 'deploy', 'bug'],
    'study': ['assignment', 'homework', 'study', 'exam', 'course'],
    'personal': ['gym', 'shopping', 'groceries', 'doctor', 'call'],
}

def parse_task_text(text: str):
    title = text.strip()
    due_date = None
    parsed_date = dateparser.parse(text, settings={'PREFER_DATES_FROM': 'future'})
    if parsed_date:
        due_date = parsed_date
    priority = 'medium'
    for lvl, words in PRIORITY_WORDS.items():
        if any(w in text.lower() for w in words):
            priority = lvl
            break
    category = None
    for cat, words in CATEGORIES.items():
        if any(w in text.lower() for w in words):
            category = cat
            break
    estimate = None
    m = re.search(r"(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)", text, re.I)
    if m:
        estimate = float(m.group(1))
    if not due_date:
        if 'tomorrow' in text.lower():
            due_date = datetime.now() + timedelta(days=1)
    return {
        'title': title,
        'priority': priority,
        'category': category,
        'due_date': due_date.isoformat() if due_date else None,
        'estimated_hours': estimate
    }
