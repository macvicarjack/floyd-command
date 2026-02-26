import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasksInReview, approveTask, rejectTask } from '@/lib/api';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle2, XCircle, FileText, ExternalLink, Clock, BookOpen } from 'lucide-react';

export default function ReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const fetchTasks = async () => {
    try {
      const res = await getTasksInReview();
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching review tasks:', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await approveTask(id, feedback[id]);
      fetchTasks();
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTask(id, feedback[id]);
      fetchTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
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
            <Link to="/history" className="text-primary hover:underline mt-2 block">
              View completed tasks →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    {task.project && (
                      <Badge variant="outline" className="mb-1 bg-primary/10 text-primary border-primary/20 text-[10px]">
                        {task.project}
                      </Badge>
                    )}
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/30">In Review</Badge>
                  {task.retry_count && task.retry_count > 0 && (
                    <Badge variant='destructive' className='ml-2'>Retry #{task.retry_count}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                
                
                {/* Rejection Notes from Previous Attempt */}
                {task.rejection_notes && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Previous Rejection Notes
                    </h4>
                    <p className="text-sm">{task.rejection_notes}</p>
                  </div>
                )}
                {/* Completion Log */}
                {task.completion_log && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Completion Summary
                    </h4>
                    
                    {task.completion_log.what_was_done && (
                      <div>
                        <span className="text-xs text-muted-foreground">What was done:</span>
                        <p className="text-sm">{task.completion_log.what_was_done}</p>
                      </div>
                    )}
                    
                    {task.completion_log.time_spent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Time spent: <strong>{task.completion_log.time_spent}</strong></span>
                      </div>
                    )}
                    
                    {task.completion_log.lessons_learned && (
                      <div>
                        <span className="text-xs text-muted-foreground">Lessons learned:</span>
                        <p className="text-sm italic">{task.completion_log.lessons_learned}</p>
                      </div>
                    )}
                    
                    {task.completion_log.artifacts && task.completion_log.artifacts.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Artifacts:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {task.completion_log.artifacts.map((a, i) => (
                            <Badge key={i} variant="secondary" className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Time stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {task.started_at && (
                    <span>Started: {new Date(task.started_at).toLocaleString()}</span>
                  )}
                  {task.completed_at && (
                    <span>Completed: {new Date(task.completed_at).toLocaleString()}</span>
                  )}
                </div>

                {/* Feedback */}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Feedback (optional):</label>
                  <Textarea 
                    placeholder="Add notes or feedback..."
                    value={feedback[task.id] || ''}
                    onChange={(e) => setFeedback({ ...feedback, [task.id]: e.target.value })}
                    className="h-20"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(task.id)} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" onClick={() => handleReject(task.id)} className="flex-1">
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
