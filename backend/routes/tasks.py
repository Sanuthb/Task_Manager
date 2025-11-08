from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from ..models import db, Task, Subtask, ProgressLog, User
from ..services.nlp import parse_task_text
from ..services.ml import gemini_priority_score
from ..services.exports import to_excel, to_pdf
from ..services.email import send_email

bp = Blueprint('tasks', __name__, url_prefix='/api')

@bp.post('/parse')
@jwt_required()
def parse():
    data = request.get_json() or {}
    text = data.get('text', '')
    parsed = parse_task_text(text)
    # The new field 'reminder_date' is now in the parsed dict
    return jsonify(parsed)

@bp.post('/tasks')
@jwt_required()
def create_task():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}
    title = data.get('title')
    if not title:
        return jsonify({'message': 'title is required'}), 400
        
    due_date = data.get('due_date')
    due_dt = datetime.fromisoformat(due_date) if due_date else None
    
    reminder_date = data.get('reminder_date') # NEW: Extract reminder date
    reminder_dt = datetime.fromisoformat(reminder_date) if reminder_date else None # NEW

    task = Task(
        user_id=uid,
        title=title,
        description=data.get('description'),
        category=data.get('category'),
        status=data.get('status', 'pending'),
        priority=data.get('priority', 'medium'),
        due_date=due_dt,
        estimated_hours=data.get('estimated_hours'),
        reminder_date=reminder_dt # NEW: Save reminder date
    )
    task_data = {
        'title': title,
        'description': data.get('description'),
        'priority': task.priority,
        'due_date': data.get('due_date'),
        'estimated_hours': data.get('estimated_hours')
    }
    task.priority_score = gemini_priority_score(task_data)
    db.session.add(task)
    db.session.commit()

    # Send Task Created email (best-effort; do not fail the request if email errors)
    try:
        user = User.query.get(uid)
        if user and user.email:
            subject = f"Task Created: {task.title}"
            parts = [
                f"Title: {task.title}",
                f"Description: {task.description or '-'}",
                f"Priority: {task.priority}",
                f"Due: {task.due_date.isoformat() if task.due_date else '-'}",
                f"Reminder: {task.reminder_date.isoformat() if task.reminder_date else '-'}",
            ]
            body = "\n".join(parts)
            send_email(subject, user.email, body)
    except Exception:
        pass
    return jsonify({'id': task.id}), 201

@bp.get('/tasks')
@jwt_required()
def list_tasks():
    uid = int(get_jwt_identity())
    
    # --- START FEATURE 5: Filtering Tasks ---
    query = Task.query.filter_by(user_id=uid)
    
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    category_filter = request.args.get('category')
    
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if category_filter:
        query = query.filter(Task.category == category_filter)
    
    tasks = query.order_by(Task.priority_score.desc(), Task.due_date.asc().nullsfirst()).all()
    # --- END FEATURE 5: Filtering Tasks ---

    # Utility to convert subtask to dict
    def subtask_to_dict(s: Subtask):
        return {'id': s.id, 'title': s.title, 'status': s.status}
        
    def to_dict(t: Task):
        return {
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'category': t.category,
            'status': t.status,
            'priority': t.priority,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'estimated_hours': t.estimated_hours,
            'priority_score': t.priority_score,
            'reminder_date': t.reminder_date.isoformat() if t.reminder_date else None,
            # --- START FEATURE 6: Subtasks ---
            'subtasks': [subtask_to_dict(s) for s in t.subtasks.all()],
            # --- END FEATURE 6: Subtasks ---
            'created_at': t.created_at.isoformat(),
        }
    return jsonify([to_dict(t) for t in tasks])

@bp.patch('/tasks/<int:task_id>')
@jwt_required()
def update_task(task_id):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    data = request.get_json() or {}
    
    # Recalculate flag
    recalculate_score = False
    
    for k in ['title','description','category','status','priority','estimated_hours']:
        if k in data:
            setattr(task, k, data[k])
            if k in ['title', 'description', 'priority', 'estimated_hours']:
                recalculate_score = True
            
    if 'due_date' in data:
        task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
        recalculate_score = True # Due date affects priority score
        
    if 'reminder_date' in data: # NEW: Handle reminder date update
        task.reminder_date = datetime.fromisoformat(data['reminder_date']) if data['reminder_date'] else None

    # Recalculate AI score (if relevant fields changed)
    if recalculate_score:
        task_data = {
            'title': task.title,
            'description': task.description,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'estimated_hours': task.estimated_hours
        }
        task.priority_score = gemini_priority_score(task_data)
        
    db.session.commit()
    return jsonify({'message': 'updated'})

@bp.delete('/tasks/<int:task_id>')
@jwt_required()
def delete_task(task_id):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'deleted'})

@bp.get('/stats')
@jwt_required()
def stats():
    uid = int(get_jwt_identity())
    total = Task.query.filter_by(user_id=uid).count()
    completed = Task.query.filter_by(user_id=uid, status='completed').count()
    pending = Task.query.filter_by(user_id=uid, status='pending').count()
    in_progress = Task.query.filter_by(user_id=uid, status='in_progress').count()
    return jsonify({'total': total, 'completed': completed, 'pending': pending, 'in_progress': in_progress})

@bp.post('/export')
@jwt_required()
def export():
    uid = int(get_jwt_identity())
    fmt = (request.args.get('format') or 'excel').lower()
    tasks = Task.query.filter_by(user_id=uid).all()
    rows = []
    for t in tasks:
        rows.append({
            'title': t.title,
            'category': t.category,
            'status': t.status,
            'priority': t.priority,
            'due_date': t.due_date.isoformat() if t.due_date else '',
            'estimated_hours': t.estimated_hours or '',
            'priority_score': t.priority_score,
            'created_at': t.created_at.isoformat(),
        })
    if fmt == 'pdf':
        data = to_pdf(rows)
        return send_file(BytesIO(data), mimetype='application/pdf', as_attachment=True, download_name='tasks.pdf')
    data = to_excel(rows)
    return send_file(BytesIO(data), mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name='tasks.xlsx')

@bp.post('/tasks/<int:task_id>/snooze')
@jwt_required()
def snooze_task(task_id):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    try:
        minutes = int(request.args.get('minutes', '10'))
    except ValueError:
        return jsonify({'message': 'invalid minutes'}), 400

    base = task.reminder_date or datetime.now()
    task.reminder_date = base + timedelta(minutes=minutes)
    db.session.commit()
    return jsonify({'reminder_date': task.reminder_date.isoformat()})

@bp.post('/tasks/<int:task_id>/subtasks')
@jwt_required()
def create_subtask(task_id: int):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    data = request.get_json() or {}
    title = data.get('title')
    if not title:
        return jsonify({'message': 'title is required'}), 400
    sub = Subtask(task_id=task.id, title=title)
    db.session.add(sub)
    db.session.commit()
    return jsonify({'id': sub.id}), 201

# --- START FEATURE 6: New Subtask Management Endpoints ---

@bp.get('/tasks/<int:task_id>/subtasks')
@jwt_required()
def list_subtasks(task_id: int):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    
    def subtask_to_dict(s: Subtask):
        return {'id': s.id, 'title': s.title, 'status': s.status}

    subtasks = Subtask.query.filter_by(task_id=task.id).all()
    return jsonify([subtask_to_dict(s) for s in subtasks])


@bp.patch('/subtasks/<int:subtask_id>')
@jwt_required()
def update_subtask(subtask_id: int):
    uid = int(get_jwt_identity())
    sub = Subtask.query.get_or_404(subtask_id)

    # Check ownership via the parent task
    if sub.task.user_id != uid:
        return jsonify({'message': 'Forbidden'}), 403

    data = request.get_json() or {}
    if 'title' in data:
        sub.title = data['title']
    if 'status' in data:
        sub.status = data['status']
        
    db.session.commit()
    return jsonify({'message': 'updated'})


@bp.delete('/subtasks/<int:subtask_id>')
@jwt_required()
def delete_subtask(subtask_id: int):
    uid = int(get_jwt_identity())
    sub = Subtask.query.get_or_404(subtask_id)

    # Check ownership via the parent task
    if sub.task.user_id != uid:
        return jsonify({'message': 'Forbidden'}), 403

    db.session.delete(sub)
    db.session.commit()
    return jsonify({'message': 'deleted'})
# --- END FEATURE 6: New Subtask Management Endpoints ---