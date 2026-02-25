from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DATA_FILE = '/Users/floydbot/projects/floyd-command/backend/tasks.json'

TEMPLATES = {
    'research-prospect': {
        'id': 'research-prospect',
        'name': 'Research Prospect',
        'description': 'Research a company and create a detailed profile',
        'category': 'business',
        'priority': 'medium',
        'time_estimate_minutes': 30,
        'acceptance_criteria': ['Company overview', 'Key contacts', 'Pain points', 'Opportunity assessment']
    },
    'draft-email': {
        'id': 'draft-email',
        'name': 'Draft Email',
        'description': 'Write an email draft',
        'category': 'business',
        'priority': 'medium',
        'time_estimate_minutes': 15,
        'acceptance_criteria': ['Subject line', 'Body text', 'Call to action']
    },
    'analyze-competitor': {
        'id': 'analyze-competitor',
        'name': 'Analyze Competitor',
        'description': 'Competitive analysis and comparison',
        'category': 'business',
        'priority': 'medium',
        'time_estimate_minutes': 45,
        'acceptance_criteria': ['Competitor overview', 'Strengths/weaknesses', 'Pricing comparison', 'Recommendations']
    },
    'build-automation': {
        'id': 'build-automation',
        'name': 'Build Automation',
        'description': 'Create a workflow, script, or automation',
        'category': 'business',
        'priority': 'high',
        'time_estimate_minutes': 60,
        'acceptance_criteria': ['Working code/workflow', 'Documentation', 'Test results']
    },
    'content-draft': {
        'id': 'content-draft',
        'name': 'Content Draft',
        'description': 'Write content (blog post, social post, documentation)',
        'category': 'business',
        'priority': 'medium',
        'time_estimate_minutes': 30,
        'acceptance_criteria': ['Draft text', 'Formatted properly', 'Ready for review']
    }
}

def load_tasks():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_tasks(tasks):
    with open(DATA_FILE, 'w') as f:
        json.dump(tasks, f, indent=2)

def smart_sort(tasks):
    """Sort by: overdue > high priority > oldest > medium > low"""
    now = datetime.now()
    
    def sort_key(t):
        # Overdue check
        due = t.get('due_date')
        is_overdue = False
        if due:
            try:
                is_overdue = datetime.fromisoformat(due.replace('Z', '')) < now
            except:
                pass
        
        # Priority mapping
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        priority = priority_order.get(t.get('priority', 'medium'), 1)
        
        # Created date
        try:
            created = datetime.fromisoformat(t.get('created_at', '').replace('Z', ''))
        except:
            created = now
        
        return (not is_overdue, priority, created)
    
    return sorted(tasks, key=sort_key)

def check_dependencies(task, all_tasks):
    """Check if task is blocked by incomplete dependencies"""
    depends_on = task.get('depends_on', [])
    if not depends_on:
        return False
    for dep_id in depends_on:
        dep_task = next((t for t in all_tasks if t['id'] == dep_id), None)
        if dep_task and dep_task.get('status') != 'DONE':
            return True
    return False

# ============ BASIC CRUD ============

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    tasks = load_tasks()
    # Add computed fields
    for t in tasks:
        t['blocked_by_dependencies'] = check_dependencies(t, tasks)
    return jsonify(smart_sort(tasks))

@app.route('/api/tasks', methods=['POST'])
def create_task():
    task = request.json
    task['id'] = str(uuid.uuid4())
    task['created_at'] = datetime.now().isoformat()
    task['updated_at'] = datetime.now().isoformat()
    task.setdefault('status', 'QUEUED')
    task.setdefault('priority', 'medium')
    task.setdefault('category', 'other')
    task.setdefault('artifacts', [])
    task.setdefault('depends_on', [])
    
    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    tasks = load_tasks()
    task = next((t for t in tasks if t['id'] == task_id), None)
    if task:
        task['blocked_by_dependencies'] = check_dependencies(task, tasks)
        return jsonify(task)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    update_data = request.json
    tasks = load_tasks()
    for i, t in enumerate(tasks):
        if t['id'] == task_id:
            tasks[i].update(update_data)
            tasks[i]['updated_at'] = datetime.now().isoformat()
            save_tasks(tasks)
            return jsonify(tasks[i])
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    tasks = load_tasks()
    tasks = [t for t in tasks if t['id'] != task_id]
    save_tasks(tasks)
    return jsonify({'success': True})

# ============ FEATURE ENDPOINTS ============

@app.route('/api/next', methods=['GET'])
def get_next_task():
    """Get highest priority unassigned DO NOW task"""
    tasks = load_tasks()
    do_now = [t for t in tasks if t.get('status') == 'DO NOW' 
              and not t.get('assignee')
              and not check_dependencies(t, tasks)]
    sorted_tasks = smart_sort(do_now)
    if sorted_tasks:
        return jsonify(sorted_tasks[0])
    return jsonify(None)

@app.route('/api/tasks/<task_id>/claim', methods=['POST'])
def claim_task(task_id):
    """Claim a task - set assignee and move to IN PROGRESS"""
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t['assignee'] = 'Floyd'
            t['status'] = 'IN PROGRESS'
            t['started_at'] = datetime.now().isoformat()
            t['updated_at'] = datetime.now().isoformat()
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Complete a task with optional artifacts"""
    data = request.json or {}
    artifacts = data.get('artifacts', [])
    
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t['status'] = 'DONE'
            t['completed_at'] = datetime.now().isoformat()
            t['updated_at'] = datetime.now().isoformat()
            
            # Calculate actual time
            if t.get('started_at'):
                try:
                    started = datetime.fromisoformat(t['started_at'])
                    completed = datetime.fromisoformat(t['completed_at'])
                    t['time_actual_minutes'] = int((completed - started).total_seconds() / 60)
                except:
                    pass
            
            # Add artifacts
            if artifacts:
                t.setdefault('artifacts', [])
                t['artifacts'].extend(artifacts)
            
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/quick', methods=['POST'])
def quick_capture():
    """Quick task creation - just title, auto-fill the rest"""
    data = request.json
    title = data.get('title', 'Untitled task')
    
    # Auto-detect priority from keywords
    priority = 'medium'
    lower_title = title.lower()
    if any(w in lower_title for w in ['urgent', 'asap', 'critical', 'emergency']):
        priority = 'high'
    elif any(w in lower_title for w in ['someday', 'maybe', 'low priority']):
        priority = 'low'
    
    # Auto-detect category from keywords
    category = 'other'
    if any(w in lower_title for w in ['prospect', 'lead', 'sales', 'client', 'revenue', 'pricing']):
        category = 'business'
    elif any(w in lower_title for w in ['territory', 'account', 'salesforce', 'quota']):
        category = 'work'
    elif any(w in lower_title for w in ['personal', 'home', 'family', 'health']):
        category = 'personal'
    
    task = {
        'id': str(uuid.uuid4()),
        'title': title,
        'description': '',
        'status': 'QUEUED',
        'priority': priority,
        'category': category,
        'assignee': 'Floyd',
        'artifacts': [],
        'depends_on': [],
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201

@app.route('/api/digest', methods=['GET'])
def get_digest():
    """Get morning digest data"""
    tasks = load_tasks()
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    
    # Completed in last 24h
    completed_recent = [t for t in tasks if t.get('status') == 'DONE' 
                        and t.get('completed_at')
                        and datetime.fromisoformat(t['completed_at'].replace('Z', '')) > yesterday]
    
    # Awaiting review (DONE but not yet reviewed)
    awaiting_review = [t for t in tasks if t.get('status') == 'DONE' 
                       and not t.get('reviewed')]
    
    # Blocked
    blocked = [t for t in tasks if t.get('status') == 'BLOCKED']
    
    # Priority queue (DO NOW and QUEUED, sorted)
    queue = [t for t in tasks if t.get('status') in ['DO NOW', 'QUEUED']]
    queue = smart_sort(queue)[:5]
    
    # Overdue
    overdue = []
    for t in tasks:
        if t.get('due_date') and t.get('status') not in ['DONE', 'BLOCKED']:
            try:
                due = datetime.fromisoformat(t['due_date'].replace('Z', ''))
                if due < now:
                    overdue.append(t)
            except:
                pass
    
    return jsonify({
        'completed_count': len(completed_recent),
        'completed_tasks': completed_recent,
        'awaiting_review_count': len(awaiting_review),
        'awaiting_review': awaiting_review,
        'blocked_count': len(blocked),
        'blocked_tasks': blocked,
        'priority_queue': queue,
        'overdue_count': len(overdue),
        'overdue_tasks': overdue,
        'generated_at': now.isoformat()
    })

@app.route('/api/tasks/<task_id>/breakdown', methods=['POST'])
def breakdown_task(task_id):
    """Placeholder for AI task breakdown"""
    return jsonify({'success': True, 'message': 'Task breakdown requested', 'task_id': task_id})

@app.route('/api/tasks/<task_id>/artifacts', methods=['POST'])
def add_artifact(task_id):
    """Add artifact to a task"""
    artifact = request.json
    artifact['id'] = str(uuid.uuid4())
    artifact['created_at'] = datetime.now().isoformat()
    
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t.setdefault('artifacts', [])
            t['artifacts'].append(artifact)
            t['updated_at'] = datetime.now().isoformat()
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get all task templates"""
    return jsonify(list(TEMPLATES.values()))

@app.route('/api/tasks/from-template/<template_id>', methods=['POST'])
def create_from_template(template_id):
    """Create task from template"""
    template = TEMPLATES.get(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    
    data = request.json or {}
    
    task = {
        'id': str(uuid.uuid4()),
        'title': data.get('title', template['name']),
        'description': template['description'],
        'status': 'QUEUED',
        'priority': template['priority'],
        'category': template['category'],
        'time_estimate_minutes': template['time_estimate_minutes'],
        'acceptance_criteria': template.get('acceptance_criteria', []),
        'assignee': 'Floyd',
        'artifacts': [],
        'depends_on': [],
        'template_id': template_id,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    # Merge any additional data
    task.update({k: v for k, v in data.items() if k not in ['id', 'created_at']})
    
    tasks = load_tasks()
    tasks.append(task)
    save_tasks(tasks)
    return jsonify(task), 201

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get productivity metrics"""
    tasks = load_tasks()
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)
    
    # Completed counts
    completed = [t for t in tasks if t.get('status') == 'DONE']
    
    def completed_since(since):
        count = 0
        for t in completed:
            if t.get('completed_at'):
                try:
                    c = datetime.fromisoformat(t['completed_at'].replace('Z', ''))
                    if c >= since:
                        count += 1
                except:
                    pass
        return count
    
    completed_today = completed_since(today_start)
    completed_this_week = completed_since(week_start)
    completed_this_month = completed_since(month_start)
    
    # Average completion time
    times = [t.get('time_actual_minutes') for t in completed if t.get('time_actual_minutes')]
    avg_time = sum(times) / len(times) if times else 0
    
    # By category
    by_category = {}
    for t in tasks:
        cat = t.get('category', 'other')
        by_category[cat] = by_category.get(cat, 0) + 1
    
    # By status
    by_status = {}
    for t in tasks:
        status = t.get('status', 'QUEUED')
        by_status[status] = by_status.get(status, 0) + 1
    
    # Queue depth
    queue_depth = len([t for t in tasks if t.get('status') in ['DO NOW', 'QUEUED']])
    
    return jsonify({
        'completed_today': completed_today,
        'completed_this_week': completed_this_week,
        'completed_this_month': completed_this_month,
        'total_completed': len(completed),
        'average_completion_minutes': round(avg_time, 1),
        'by_category': by_category,
        'by_status': by_status,
        'queue_depth': queue_depth,
        'total_tasks': len(tasks)
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get tasks that need attention (blocked >24h)"""
    tasks = load_tasks()
    now = datetime.now()
    day_ago = now - timedelta(days=1)
    
    alerts = []
    for t in tasks:
        # Blocked for >24h
        if t.get('status') == 'BLOCKED':
            updated = t.get('updated_at', t.get('created_at'))
            if updated:
                try:
                    u = datetime.fromisoformat(updated.replace('Z', ''))
                    if u < day_ago:
                        alerts.append({'type': 'blocked_stale', 'task': t})
                except:
                    pass
        
        # Overdue
        if t.get('due_date') and t.get('status') not in ['DONE']:
            try:
                due = datetime.fromisoformat(t['due_date'].replace('Z', ''))
                if due < now:
                    alerts.append({'type': 'overdue', 'task': t})
            except:
                pass
    
    return jsonify(alerts)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
