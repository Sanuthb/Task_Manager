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

## Run frontend (Streamlit)
```powershell
streamlit run frontend/streamlit_app.py
```

Optionally set Streamlit secret `API_URL` if backend runs elsewhere:
```
# .streamlit/secrets.toml
API_URL = "http://127.0.0.1:5000"
```

## Features
- Natural language task input with due date/priority/category extraction.
- Heuristic priority score with due date proximity and estimate.
- JWT auth, per-user task storage (SQLite).
- Dashboard and Plotly charts.
- Export to Excel/PDF.

## Notes
- NLP uses `dateparser` and simple keyword/entity rules.
- Replace heuristic with trained models later; API surface remains compatible.
