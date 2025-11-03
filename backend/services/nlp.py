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
    
    # Try to parse a specific reminder time related to the main date
    reminder_match = re.search(r"(remind me|notify me|alert me) (at|on|by) (.+)", text_lower)
    if reminder_match:
        # Extract the potential time phrase
        potential_reminder_text = reminder_match.group(3).split(' ')[0]
        
        # Parse it relative to the due date, or now if no due date
        base_date = due_date or datetime.now()
        parsed_reminder = dateparser.parse(potential_reminder_text, settings={'RELATIVE_BASE': base_date, 'PREFER_DATES_FROM': 'future'})
        if parsed_reminder and (not due_date or parsed_reminder < due_date):
            reminder_date = parsed_reminder

    # Fallback: Set a default reminder offset (2 hours) if a due date exists but no explicit reminder was found
    if due_date and not reminder_date:
        reminder_date = due_date - timedelta(hours=2)
    
    # Safety check: Ensure reminder is not set too close to creation time (1 minute buffer)
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