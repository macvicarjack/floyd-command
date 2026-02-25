import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, getArchive } from '@/lib/api';
import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, Clock, BookOpen, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archive, setArchive] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, archiveRes] = await Promise.all([
          getHistory(),
          getArchive()
        ]);
        setTasks(historyRes.data);
        setArchive(archiveRes.data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTasks(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const TaskCard = ({ task, isArchive = false }: { task: Task; isArchive?: boolean }) => {
    const isExpanded = expandedTasks.has(task.id);
    
    return (
      <Card className={cn(isArchive && "opacity-60")}>
        <CardContent className="p-4">
          <div 
            className="flex items-start justify-between cursor-pointer"
            onClick={() => toggleExpand(task.id)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {task.project && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    {task.project}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium">{task.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {task.completed_at && <span>{formatDate(task.completed_at)}</span>}
                {task.completion_log?.time_spent && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {task.completion_log.time_spent}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          
          {isExpanded && task.completion_log && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {task.completion_log.what_was_done && (
                <div>
                  <span className="text-xs text-muted-foreground font-medium">What was done:</span>
                  <p className="text-sm mt-1">{task.completion_log.what_was_done}</p>
                </div>
              )}
              
              {task.completion_log.lessons_learned && (
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Lessons learned:</span>
                  <p className="text-sm mt-1 italic">{task.completion_log.lessons_learned}</p>
                </div>
              )}
              
              {task.completion_log.artifacts && task.completion_log.artifacts.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Artifacts:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.completion_log.artifacts.map((a, i) => (
                      <Badge key={i} variant="secondary">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {task.approval_notes && (
                <div>
                  <span className="text-xs text-muted-foreground font-medium">Approval notes:</span>
                  <p className="text-sm mt-1 text-emerald-400">{task.approval_notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">History</h1>
        <Badge variant="outline" className="ml-auto">{tasks.length} completed</Badge>
      </div>

      {/* Recent History (Last 7 Days) */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Last 7 Days
        </h2>
        
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No completed tasks in the last 7 days.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}
      </div>

      {/* Archive Section */}
      {archive.length > 0 && (
        <div>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between mb-4"
            onClick={() => setShowArchive(!showArchive)}
          >
            <span className="flex items-center gap-2">
              <Archive className="h-5 w-5" /> Archive ({archive.length} tasks)
            </span>
            {showArchive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showArchive && (
            <div className="space-y-3">
              {archive.map(task => <TaskCard key={task.id} task={task} isArchive />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
