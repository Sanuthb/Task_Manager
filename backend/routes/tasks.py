from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from ..models import db, Task, Subtask, ProgressLog
from ..services.nlp import parse_task_text
from ..services.ml import heuristic_priority_score
from ..services.exports import to_excel, to_pdf

bp = Blueprint('tasks', __name__, url_prefix='/api')

@bp.post('/parse')
@jwt_required()
def parse():
    data = request.get_json() or {}
    text = data.get('text', '')
    parsed = parse_task_text(text)
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
    task = Task(
        user_id=uid,
        title=title,
        description=data.get('description'),
        category=data.get('category'),
        status=data.get('status', 'pending'),
        priority=data.get('priority', 'medium'),
        due_date=due_dt,
        estimated_hours=data.get('estimated_hours')
    )
    task.priority_score = heuristic_priority_score(task.priority, task.due_date, task.estimated_hours)
    db.session.add(task)
    db.session.commit()
    return jsonify({'id': task.id}), 201

@bp.get('/tasks')
@jwt_required()
def list_tasks():
    uid = int(get_jwt_identity())
    tasks = Task.query.filter_by(user_id=uid).order_by(Task.priority_score.desc(), Task.due_date.asc().nullsfirst()).all()
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
            'created_at': t.created_at.isoformat(),
        }
    return jsonify([to_dict(t) for t in tasks])

@bp.patch('/tasks/<int:task_id>')
@jwt_required()
def update_task(task_id):
    uid = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=uid).first_or_404()
    data = request.get_json() or {}
    for k in ['title','description','category','status','priority','estimated_hours']:
        if k in data:
            setattr(task, k, data[k])
    if 'due_date' in data:
        task.due_date = datetime.fromisoformat(data['due_date']) if data['due_date'] else None
    task.priority_score = heuristic_priority_score(task.priority, task.due_date, task.estimated_hours)
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
