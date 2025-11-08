import threading
import time
from datetime import datetime
from ..models import db, Task, User
from .email import send_email


def _run_loop(app):
    # Simple polling loop; checks every 60 seconds
    while True:
        try:
            with app.app_context():
                now = datetime.now()
                # Fetch tasks needing reminders
                tasks = (
                    Task.query
                    .filter(Task.reminder_date.isnot(None))
                    .filter(Task.reminder_date <= now)
                    .all()
                )
                for t in tasks:
                    user = User.query.get(t.user_id)
                    if not user or not user.email:
                        # Prevent repeated attempts if user email missing
                        t.reminder_date = None
                        db.session.add(t)
                        continue
                    subject = f"Reminder: {t.title}"
                    parts = [
                        f"Title: {t.title}",
                        f"Description: {t.description or '-'}",
                        f"Priority: {t.priority}",
                        f"Due: {t.due_date.isoformat() if t.due_date else '-'}",
                        f"Reminder Time: {t.reminder_date.isoformat() if t.reminder_date else '-'}",
                    ]
                    body = "\n".join(parts)
                    try:
                        send_email(subject, user.email, body)
                        # Clear reminder_date to avoid duplicate sends
                        t.reminder_date = None
                    except Exception:
                        # Best-effort: try next cycle again
                        pass
                    db.session.add(t)
                if tasks:
                    db.session.commit()
        except Exception:
            # Never crash the loop
            pass
        time.sleep(60)


def start_reminder_worker(app):
    if getattr(app, '_reminder_worker_started', False):
        return
    t = threading.Thread(target=_run_loop, args=(app,), daemon=True)
    t.start()
    setattr(app, '_reminder_worker_started', True)
