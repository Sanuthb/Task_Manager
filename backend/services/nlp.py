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
    # Use dateparser to find the main due date
    parsed_date = dateparser.parse(text, settings={'PREFER_DATES_FROM': 'future'})
    if parsed_date:
        due_date = parsed_date
    
    # ... (Existing parsing for priority, category, estimate remains here)
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
    
    # --- NEW: Reminder Logic ---
    reminder_date = None
    text_lower = text.lower()

    # 1) Explicit forms: "remind/notify/alert me at|on|by <phrase>"
    reminder_match = re.search(r"\b(remind\s+me|notify\s+me|alert\s+me)\s+(at|on|by)\s+(.+)", text_lower)
    if reminder_match and not reminder_date:
        potential_reminder_text = reminder_match.group(3).strip()
        base_date = due_date or datetime.now()
        parsed_reminder = dateparser.parse(
            potential_reminder_text,
            settings={'RELATIVE_BASE': base_date, 'PREFER_DATES_FROM': 'future'}
        )
        if parsed_reminder:
            # If due_date exists and parsed reminder is after due_date, keep due_date precedence
            if not due_date or parsed_reminder <= due_date:
                reminder_date = parsed_reminder

    # 2) Time-only phrases like: "by 9:00pm" or "at 9 pm" even without due_date
    if not reminder_date:
        m_time_only = re.search(r"\b(by|at)\s+([0-9]{1,2}(:[0-9]{2})?\s*(am|pm)?)\b", text_lower)
        if m_time_only:
            time_phrase = m_time_only.group(0)  # include the by/at for better parsing context
            base_date = due_date or datetime.now()
            parsed_time = dateparser.parse(
                time_phrase,
                settings={'RELATIVE_BASE': base_date, 'PREFER_DATES_FROM': 'future'}
            )
            if parsed_time:
                # If there is a due_date, prefer same-day time before due
                if due_date:
                    # If parsed time lacks date, dateparser uses base_date. Ensure not after due_date.
                    if parsed_time <= due_date:
                        reminder_date = parsed_time
                else:
                    # No due_date: ensure it's in the future relative to now; if not, move to next day
                    now = datetime.now()
                    if parsed_time <= now:
                        reminder_date = parsed_time + timedelta(days=1)
                    else:
                        reminder_date = parsed_time

    # 3) Fallback: If a due date exists but no explicit reminder was found, set 2 hours before due
    if due_date and not reminder_date:
        reminder_date = due_date - timedelta(hours=2)

    # Safety: Ensure reminder is not in the immediate past; if so, drop it
    if reminder_date and reminder_date < datetime.utcnow() + timedelta(minutes=1):
        reminder_date = None


    return {
        'title': title,
        'priority': priority,
        'category': category,
        'due_date': due_date.isoformat() if due_date else None,
        'estimated_hours': estimate,
        'reminder_date': reminder_date.isoformat() if reminder_date else None # NEW FIELD
    }