from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

DATA_FILE = '/Users/floydbot/projects/floyd-command/backend/tasks.json'
ARCHIVE_FILE = '/Users/floydbot/projects/floyd-command/backend/archive.json'

# Valid statuses
VALID_STATUSES = ['DO NOW', 'QUEUED', 'IN PROGRESS', 'WAITING', 'BLOCKED', 'REVIEW', 'DONE']

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

def load_archive():
    if not os.path.exists(ARCHIVE_FILE):
        return []
    with open(ARCHIVE_FILE, 'r') as f:
        return json.load(f)

def save_archive(archive):
    with open(ARCHIVE_FILE, 'w') as f:
        json.dump(archive, f, indent=2)

def smart_sort(tasks):
    """Sort by: overdue > high priority > oldest > medium > low"""
    now = datetime.now()
    
    def sort_key(t):
        due = t.get('due_date')
        is_overdue = False
        if due:
            try:
                is_overdue = datetime.fromisoformat(due.replace('Z', '')) < now
            except:
                pass
        
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        priority = priority_order.get(t.get('priority', 'medium'), 1)
        
        try:
            created = datetime.fromisoformat(t.get('created_at', '').replace('Z', ''))
        except:
            created = now
        
        return (not is_overdue, priority, created)
    
    return sorted(tasks, key=sort_key)

def check_dependencies(task, all_tasks):
    """Check if task is blocked by incomplete dependencies"""
    depends_on = task.get('depends_on', []) or task.get('dependencies', [])
    if not depends_on:
        return False
    for dep_id in depends_on:
        dep_task = next((t for t in all_tasks if t['id'] == dep_id), None)
        if dep_task and dep_task.get('status') != 'DONE':
            return True
    return False

def calculate_stale_days(task):
    """Calculate days task has been in QUEUED status"""
    if task.get('status') != 'QUEUED':
        return 0
    created = task.get('created_at')
    if not created:
        return 0
    try:
        created_dt = datetime.fromisoformat(created.replace('Z', ''))
        return (datetime.now() - created_dt).days
    except:
        return 0

def auto_archive_old_tasks():
    """Move tasks that have been DONE for >7 days to archive"""
    tasks = load_tasks()
    archive = load_archive()
    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    
    to_archive = []
    remaining = []
    
    for t in tasks:
        if t.get('status') == 'DONE' and t.get('reviewed_at'):
            try:
                reviewed = datetime.fromisoformat(t['reviewed_at'].replace('Z', ''))
                if reviewed < seven_days_ago:
                    t['archived_at'] = now.isoformat()
                    to_archive.append(t)
                    continue
            except:
                pass
        remaining.append(t)
    
    if to_archive:
        archive.extend(to_archive)
        save_archive(archive)
        save_tasks(remaining)
    
    return len(to_archive)

def cleanup_old_archives():
    """Remove archives older than 30 days"""
    archive = load_archive()
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    
    remaining = []
    for t in archive:
        archived_at = t.get('archived_at')
        if archived_at:
            try:
                archived = datetime.fromisoformat(archived_at.replace('Z', ''))
                if archived >= thirty_days_ago:
                    remaining.append(t)
                    continue
            except:
                pass
        remaining.append(t)  # Keep if can't parse date
    
    if len(remaining) != len(archive):
        save_archive(remaining)
    
    return len(archive) - len(remaining)

# ============ BASIC CRUD ============

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    # Auto-archive old tasks on each request
    auto_archive_old_tasks()
    
    tasks = load_tasks()
    status_filter = request.args.get('status')
    category_filter = request.args.get('category')
    
    if status_filter:
        tasks = [t for t in tasks if t.get('status') == status_filter]
    if category_filter:
        tasks = [t for t in tasks if t.get('category') == category_filter]
    
    for t in tasks:
        t['blocked_by_dependencies'] = check_dependencies(t, tasks)
        t['stale_days'] = calculate_stale_days(t)
    
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
    task.setdefault('dependencies', [])
    task.setdefault('outcome', '')
    task.setdefault('action_steps', [])
    task.setdefault('completion_log', None)
    task.setdefault('recurring', None)
    
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
        task['stale_days'] = calculate_stale_days(task)
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

# ============ WORKFLOW ENDPOINTS ============

@app.route('/api/tasks/<task_id>/start', methods=['POST'])
def start_task(task_id):
    """Move task to IN PROGRESS and record start time"""
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t['status'] = 'IN PROGRESS'
            t['started_at'] = datetime.now().isoformat()
            t['updated_at'] = datetime.now().isoformat()
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Move task to REVIEW with completion log"""
    data = request.json or {}
    
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            t['status'] = 'REVIEW'
            t['completed_at'] = datetime.now().isoformat()
            t['updated_at'] = datetime.now().isoformat()
            
            # Calculate time spent
            time_spent = data.get('time_spent')
            if not time_spent and t.get('started_at'):
                try:
                    started = datetime.fromisoformat(t['started_at'].replace('Z', ''))
                    completed = datetime.fromisoformat(t['completed_at'].replace('Z', ''))
                    delta = completed - started
                    hours = int(delta.total_seconds() // 3600)
                    minutes = int((delta.total_seconds() % 3600) // 60)
                    if hours > 0:
                        time_spent = f"{hours}h {minutes}m"
                    else:
                        time_spent = f"{minutes}m"
                except:
                    time_spent = 'unknown'
            
            # Build completion log
            t['completion_log'] = {
                'what_was_done': data.get('what_was_done', ''),
                'artifacts': data.get('artifacts', []),
                'time_spent': time_spent or 'unknown',
                'lessons_learned': data.get('lessons_learned', '')
            }
            
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404

@app.route('/api/tasks/<task_id>/approve', methods=['POST'])
def approve_task(task_id):
    """Move task from REVIEW to DONE"""
    data = request.json or {}
    
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            if t.get('status') != 'REVIEW':
                return jsonify({'error': 'Task must be in REVIEW status to approve'}), 400
            
            t['status'] = 'DONE'
            t['reviewed_at'] = datetime.now().isoformat()
            t['updated_at'] = datetime.now().isoformat()
            
            if data.get('notes'):
                t['approval_notes'] = data['notes']
            
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404


@app.route('/api/tasks/<task_id>/reject', methods=['POST'])
def reject_task(task_id):
    data = request.json or {}
    tasks = load_tasks()
    for t in tasks:
        if t['id'] == task_id:
            if t.get('status') != 'REVIEW':
                return jsonify({'error': 'Task must be in REVIEW status to reject'}), 400
            if 'retry_count' not in t: t['retry_count'] = 0
            if 'retry_history' not in t: t['retry_history'] = []
            t['retry_count'] += 1
            rejection_notes = data.get('notes', '')
            t['rejection_notes'] = rejection_notes
            t['retry_history'].append({'attempt': t['retry_count'], 'completed_at': t.get('completed_at'), 'rejected_at': __import__('datetime').datetime.now().isoformat(), 'rejection_notes': rejection_notes})
            t['status'] = 'QUEUED'
            t['reviewed_at'] = __import__('datetime').datetime.now().isoformat()
            t['updated_at'] = __import__('datetime').datetime.now().isoformat()
            t['completed_at'] = None
            t['assignee'] = None
            save_tasks(tasks)
            return jsonify(t)
    return jsonify({'error': 'Task not found'}), 404
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

# ============ QUERY ENDPOINTS ============

@app.route('/api/tasks/history', methods=['GET'])
def get_history():
    """Get tasks completed in last 7 days"""
    tasks = load_tasks()
    now = datetime.now()
    seven_days_ago = now - timedelta(days=7)
    
    history = []
    for t in tasks:
        if t.get('status') == 'DONE' and t.get('completed_at'):
            try:
                completed = datetime.fromisoformat(t['completed_at'].replace('Z', ''))
                if completed >= seven_days_ago:
                    history.append(t)
            except:
                pass
    
    # Sort by completed_at descending
    history.sort(key=lambda x: x.get('completed_at', ''), reverse=True)
    return jsonify(history)

@app.route('/api/tasks/stale', methods=['GET'])
def get_stale():
    """Get tasks queued for >3 days"""
    tasks = load_tasks()
    now = datetime.now()
    three_days_ago = now - timedelta(days=3)
    
    stale = []
    for t in tasks:
        if t.get('status') == 'QUEUED' and t.get('created_at'):
            try:
                created = datetime.fromisoformat(t['created_at'].replace('Z', ''))
                if created < three_days_ago:
                    days = (now - created).days
                    t['stale_days'] = days
                    stale.append(t)
            except:
                pass
    
    # Sort by staleness (oldest first)
    stale.sort(key=lambda x: x.get('created_at', ''))
    return jsonify(stale)

@app.route('/api/tasks/review', methods=['GET'])
def get_in_review():
    """Get tasks awaiting review"""
    tasks = load_tasks()
    review = [t for t in tasks if t.get('status') == 'REVIEW']
    return jsonify(review)

@app.route('/api/archive', methods=['GET'])
def get_archive():
    """Get archived tasks"""
    archive = load_archive()
    return jsonify(archive)

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

@app.route('/api/tasks/quick', methods=['POST'])
def quick_capture():
    """Quick task creation - just title, auto-fill the rest"""
    data = request.json
    title = data.get('title', 'Untitled task')
    
    priority = 'medium'
    lower_title = title.lower()
    if any(w in lower_title for w in ['urgent', 'asap', 'critical', 'emergency']):
        priority = 'high'
    elif any(w in lower_title for w in ['someday', 'maybe', 'low priority']):
        priority = 'low'
    
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
        'outcome': '',
        'action_steps': [],
        'status': 'QUEUED',
        'priority': priority,
        'category': category,
        'assignee': 'Floyd',
        'artifacts': [],
        'depends_on': [],
        'dependencies': [],
        'completion_log': None,
        'recurring': None,
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
    
    completed_recent = [t for t in tasks if t.get('status') == 'DONE' 
                        and t.get('completed_at')
                        and datetime.fromisoformat(t['completed_at'].replace('Z', '')) > yesterday]
    
    in_review = [t for t in tasks if t.get('status') == 'REVIEW']
    blocked = [t for t in tasks if t.get('status') == 'BLOCKED']
    waiting = [t for t in tasks if t.get('status') == 'WAITING']
    
    queue = [t for t in tasks if t.get('status') in ['DO NOW', 'QUEUED']]
    queue = smart_sort(queue)[:5]
    
    # Stale tasks (>3 days in QUEUED)
    three_days_ago = now - timedelta(days=3)
    stale = []
    for t in tasks:
        if t.get('status') == 'QUEUED' and t.get('created_at'):
            try:
                created = datetime.fromisoformat(t['created_at'].replace('Z', ''))
                if created < three_days_ago:
                    stale.append(t)
            except:
                pass
    
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
        'in_review_count': len(in_review),
        'in_review': in_review,
        'blocked_count': len(blocked),
        'blocked_tasks': blocked,
        'waiting_count': len(waiting),
        'waiting_tasks': waiting,
        'priority_queue': queue,
        'stale_count': len(stale),
        'stale_tasks': stale,
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
        'outcome': '',
        'action_steps': [],
        'status': 'QUEUED',
        'priority': template['priority'],
        'category': template['category'],
        'time_estimate_minutes': template['time_estimate_minutes'],
        'acceptance_criteria': template.get('acceptance_criteria', []),
        'assignee': 'Floyd',
        'artifacts': [],
        'depends_on': [],
        'dependencies': [],
        'completion_log': None,
        'recurring': None,
        'template_id': template_id,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
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
    
    times = [t.get('time_actual_minutes') for t in completed if t.get('time_actual_minutes')]
    avg_time = sum(times) / len(times) if times else 0
    
    by_category = {}
    for t in tasks:
        cat = t.get('category', 'other')
        by_category[cat] = by_category.get(cat, 0) + 1
    
    by_status = {}
    for t in tasks:
        status = t.get('status', 'QUEUED')
        by_status[status] = by_status.get(status, 0) + 1
    
    queue_depth = len([t for t in tasks if t.get('status') in ['DO NOW', 'QUEUED']])
    in_review = len([t for t in tasks if t.get('status') == 'REVIEW'])
    
    return jsonify({
        'completed_today': completed_today,
        'completed_this_week': completed_this_week,
        'completed_this_month': completed_this_month,
        'total_completed': len(completed),
        'average_completion_minutes': round(avg_time, 1),
        'by_category': by_category,
        'by_status': by_status,
        'queue_depth': queue_depth,
        'in_review': in_review,
        'total_tasks': len(tasks)
    })

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get tasks that need attention"""
    tasks = load_tasks()
    now = datetime.now()
    three_days_ago = now - timedelta(days=3)
    five_days_ago = now - timedelta(days=5)
    
    alerts = []
    
    for t in tasks:
        # Stale QUEUED tasks (3+ days)
        if t.get('status') == 'QUEUED' and t.get('created_at'):
            try:
                created = datetime.fromisoformat(t['created_at'].replace('Z', ''))
                if created < five_days_ago:
                    alerts.append({'type': 'stale_5_days', 'task': t, 'days': (now - created).days})
                elif created < three_days_ago:
                    alerts.append({'type': 'stale_3_days', 'task': t, 'days': (now - created).days})
            except:
                pass
        
        # Blocked for >24h
        if t.get('status') == 'BLOCKED':
            updated = t.get('updated_at', t.get('created_at'))
            if updated:
                try:
                    u = datetime.fromisoformat(updated.replace('Z', ''))
                    if u < now - timedelta(days=1):
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

@app.route('/api/system/archive-cleanup', methods=['POST'])
def trigger_cleanup():
    """Manually trigger archive cleanup"""
    archived = auto_archive_old_tasks()
    removed = cleanup_old_archives()
    return jsonify({'archived': archived, 'removed_from_archive': removed})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
