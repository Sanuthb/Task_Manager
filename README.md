# Task Genius

AI-powered task management (Flask API + Streamlit UI) with NLP parsing, heuristic ML prioritization, analytics, and exports.

## Prerequisites
- Python 3.10+
- Windows PowerShell

## Setup
```powershell
python -m venv .venv
. .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

## Run backend (Flask)
```powershell
$env:FLASK_APP="backend/app.py"
python -m flask run --app backend.app --debug
```
The API will be at http://127.0.0.1:5000


## setup frontend (react)
```powershell
npm install
```

## Run frontend (react)
```powershell
npm run dev 
```
## To setup email 

Go to https://myaccount.google.com/security

Turn on 2-Step Verification.

Under “App passwords” → create one for “taskmanagerapp”.

Copy the 16-character app password (looks like abcd efgh ijkl mnop).


Add the following to the .env file in the backend folder:

SMTP_USER="your-mail@gmail.com"
SMTP_PASSWORD="your-app-password"
MAIL_FROM_NAME="Task Manager"

