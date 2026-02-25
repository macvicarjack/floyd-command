import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTask } from '@/lib/api';
import { TaskStatus, TaskCategory, TaskPriority } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'QUEUED' as TaskStatus,
    priority: 'medium' as TaskPriority,
    category: 'other' as TaskCategory, project: '',
    assignee: 'Floyd',
    time_estimate_minutes: '',
    due_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        time_estimate_minutes: formData.time_estimate_minutes ? parseInt(formData.time_estimate_minutes) : undefined,
        due_date: formData.due_date || undefined
      };
      await createTask(payload);
      navigate('/');
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Create Task</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
                          <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Input 
                id="project" 
                value={formData.project} 
                onChange={e => setFormData({...formData, project: e.target.value})}
                placeholder="Project name..."
              />
            </div>\n\n              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                required 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="What needs to be done?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v: TaskCategory) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v: TaskPriority) => setFormData({...formData, priority: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: TaskStatus) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DO NOW">DO NOW</SelectItem>
                    <SelectItem value="QUEUED">QUEUED</SelectItem>
                    <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Estimate (min)</Label>
                <Input 
                  type="number"
                  value={formData.time_estimate_minutes} 
                  onChange={e => setFormData({...formData, time_estimate_minutes: e.target.value})}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input 
                type="date"
                value={formData.due_date} 
                onChange={e => setFormData({...formData, due_date: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                className="min-h-[100px]" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Details, context, acceptance criteria..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
