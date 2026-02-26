import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTask, updateTask, deleteTask } from '@/lib/api';
import { Task, TaskStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle } from 'lucide-react';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchTask(id);
  }, [id]);

  const fetchTask = async (taskId: string) => {
    try {
      const response = await getTask(taskId);
      setTask(response.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure?')) return;
    try {
      await deleteTask(id);
      navigate('/');
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!task) return <div className="p-6 text-center">Task not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/')}>← Back board</Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{task.title}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="uppercase">{task.status}</Badge>
              <Badge variant="secondary" className="uppercase">{task.priority} Priority</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => alert('Edit logic here')}>Edit</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Assignee</span>
              <p className="font-medium">{task.assignee || 'Unassigned'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Created At</span>
              <p className="font-medium">{new Date(task.created_at).toLocaleString()}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">Description</h4>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground bg-muted/20 p-4 rounded-md">
              {task.description || 'No description provided.'}
            </div>
          </div>

          {task.outcome && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold">Expected Outcome</h4>
                <div className="text-sm leading-relaxed text-muted-foreground bg-green-50 dark:bg-green-950/20 p-4 rounded-md border border-green-200 dark:border-green-900">
                  {task.outcome}
                </div>
              </div>
            </>
          )}

          {task.action_steps && task.action_steps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Action Steps</h4>
                <div className="space-y-2">
                  {task.action_steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold">Acceptance Criteria</h4>
                <div className="space-y-2">
                  {task.acceptance_criteria.map((criteria, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm leading-relaxed">{criteria}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetailPage;
