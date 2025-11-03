import os
import json
from typing import Dict, Any

try:
    from google import genai  # google-genai SDK
except Exception:  # pragma: no cover - SDK may not be installed in some envs
    genai = None  # type: ignore


def gemini_priority_score(task_data: Dict[str, Any]) -> float:
    """
    Calls Gemini model to compute an AI-driven priority score in [0.0, 100.0].
    Falls back to 50.0 on any error or missing dependency.
    Expected task_data keys: title, description, priority, due_date, estimated_hours
    """
    fallback = 50.0

    api_key = os.environ.get('GEMINI_API_KEY')
    if genai is None or not api_key:
        return fallback

    try:
        client = genai.Client(api_key=api_key)

        system_prompt = (
            "You are an expert Task Priority Analyst. Your goal is to analyze the provided task "
            "details and assign a definitive 'priority_score' from 0.0 (lowest) to 100.0 (highest). "
            "Consider the title, description, and especially the due date proximity. Respond only "
            "with a single JSON object containing the key 'priority_score' and its float value."
        )

        title = task_data.get('title') or ''
        description = task_data.get('description') or ''
        priority = task_data.get('priority') or ''
        due_date = task_data.get('due_date') or ''
        estimated_hours = task_data.get('estimated_hours')

        user_prompt = (
            f"Title: {title}\n"
            f"Description: {description}\n"
            f"Due Date: {due_date}\n"
            f"Initial Priority: {priority}\n"
            f"Estimated Hours: {estimated_hours}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        )

        # Extract text from response; SDK returns candidates with parts
        text = None
        try:
            if hasattr(response, 'text') and response.text:
                text = response.text
            elif getattr(response, 'candidates', None):
                parts = response.candidates[0].content.parts  # type: ignore[attr-defined]
                if parts:
                    text = getattr(parts[0], 'text', None) or str(parts[0])
        except Exception:
            text = None

        if not text:
            return fallback

        obj = None
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            # Try to extract JSON substring if model wrapped it in extra text
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                try:
                    obj = json.loads(text[start:end + 1])
                except Exception:
                    obj = None

        if not isinstance(obj, dict):
            return fallback

        val = obj.get('priority_score')
        if isinstance(val, (int, float)):
            try:
                num = float(val)
                if num < 0.0:
                    return 0.0
                if num > 100.0:
                    return 100.0
                return num
            except Exception:
                return fallback
        return fallback
    except Exception:
        return fallback


def heuristic_priority_score(priority: str, due_date, estimated_hours):
    return gemini_priority_score({
        'title': '',
        'description': '',
        'priority': priority,
        'due_date': due_date,
        'estimated_hours': estimated_hours
    })
