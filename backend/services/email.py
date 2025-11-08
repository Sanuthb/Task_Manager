import os
import smtplib
from email.message import EmailMessage

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER') or os.environ.get('GMAIL_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD') or os.environ.get('GMAIL_APP_PASSWORD')
FROM_NAME = os.environ.get('MAIL_FROM_NAME', 'Task Manager')
FROM_EMAIL = os.environ.get('MAIL_FROM_EMAIL') or SMTP_USER


def send_email(subject: str, to_email: str, body: str):
    if not SMTP_USER or not SMTP_PASSWORD or not FROM_EMAIL:
        raise RuntimeError('SMTP is not configured. Set SMTP_USER/GMAIL_USER and SMTP_PASSWORD/GMAIL_APP_PASSWORD.')

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
