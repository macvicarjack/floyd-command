import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, updateTask } from '@/lib/api';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';

export default function ReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = () => {
    getTasks().then(res => {
      const doneTasks = res.data.filter(t => t.status === 'DONE');
      setTasks(doneTasks);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAccept = async (id: string) => {
    await updateTask(id, { reviewed: true } as any);
    fetchTasks();
  };

  const handleReject = async (id: string) => {
    await updateTask(id, { status: 'QUEUED', reviewed: false } as any);
    fetchTasks();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <Badge variant="outline" className="ml-auto">{tasks.length} to review</Badge>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <p>All caught up! No tasks to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge variant="outline" className="text-emerald-400">Done</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                )}
                
                {/* Time stats */}
                <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                  {task.time_estimate_minutes && (
                    <span>Est: {task.time_estimate_minutes}m</span>
                  )}
                  {task.time_actual_minutes && (
                    <span>Actual: {task.time_actual_minutes}m</span>
                  )}
                  {task.completed_at && (
                    <span>Completed: {new Date(task.completed_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Artifacts */}
                {task.artifacts && task.artifacts.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Artifacts:</div>
                    <div className="flex flex-wrap gap-2">
                      {task.artifacts.map(a => (
                        <Badge key={a.id} variant="secondary" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {a.name}
                          {a.type === 'url' && <ExternalLink className="h-3 w-3" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(task.id)} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(task.id)} className="flex-1">
                    <XCircle className="h-4 w-4 mr-1" /> Send Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
