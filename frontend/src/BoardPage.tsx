import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getTasks, updateTask } from '@/lib/api';
import { Task, TaskStatus, TaskCategory } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, Pause, Lock, Briefcase, Folder, User, Layers, Filter } from 'lucide-react';

const COLUMNS: { status: TaskStatus; icon: React.ReactNode; color: string }[] = [
  { status: 'DO NOW', icon: <AlertCircle className="h-4 w-4" />, color: 'text-red-400' },
  { status: 'QUEUED', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-400' },
  { status: 'IN PROGRESS', icon: <Pause className="h-4 w-4" />, color: 'text-blue-400' },
  { status: 'DONE', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-400' },
  { status: 'BLOCKED', icon: <Lock className="h-4 w-4" />, color: 'text-purple-400' },
];

const CATEGORY_FILTERS: { value: TaskCategory | 'all'; label: string; icon?: React.ReactNode }[] = [
  { value: 'all', label: 'All' },
  { value: 'business', label: 'Business', icon: <Briefcase className="h-3 w-3" /> },
  { value: 'work', label: 'Work', icon: <Folder className="h-3 w-3" /> },
  { value: 'personal', label: 'Personal', icon: <User className="h-3 w-3" /> },
];

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [groupByProject, setGroupByProject] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const filteredTasks = categoryFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === categoryFilter);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    let newStatus = destination.droppableId as TaskStatus;
    let newProject = '';
    
    if (destination.droppableId.includes(':')) {
      const parts = destination.droppableId.split(':');
      newProject = parts[0];
      newStatus = parts[1] as TaskStatus;
    }

    const updated = tasks.map(t => {
      if (t.id === draggableId) {
        const update: Partial<Task> = { status: newStatus };
        if (newProject && newProject !== 'No Project') update.project = newProject;
        return { ...t, ...update };
      }
      return t;
    });
    setTasks(updated);

    try {
      const update: any = { status: newStatus };
      if (newProject && newProject !== 'No Project') update.project = newProject;
      await updateTask(draggableId, update);
    } catch (error) {
      fetchTasks();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/15 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'business': return 'text-blue-400';
      case 'work': return 'text-purple-400';
      case 'personal': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen flex flex-col">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Floyd Command</h1>
        
        {/* Projects */}\n        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button 
            onClick={() => setProjectFilter('all')}
            className={cn("px-3 py-1.5 rounded-md text-sm transition-colors", projectFilter === 'all' ? "bg-background shadow-sm" : "text-muted-foreground")}
          >All Projects</button>
          {[...new Set(tasks.map(t => t.project).filter(Boolean))].map(p => (
            <button 
              key={p}
              onClick={() => setProjectFilter(p!)}
              className={cn("px-3 py-1.5 rounded-md text-sm transition-colors", projectFilter === p ? "bg-background shadow-sm" : "text-muted-foreground")}
            >{p}</button>
          ))}
        </div>
        <button 
          onClick={() => setGroupByProject(!groupByProject)}
          className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all", groupByProject ? "bg-primary text-primary-foreground" : "bg-muted")}
        >
          <Layers className="h-4 w-4" />
          {groupByProject ? "Ungroup" : "Group by Project"}
        </button>\n\n        {/* Category Filter */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          {CATEGORY_FILTERS.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setCategoryFilter(value)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                categoryFilter === value 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex flex-col gap-8">
            {(groupByProject ? (projects.length > 0 ? projects : ['No Project']) : ['All']).map(projGroup => (
              <div key={projGroup} className="space-y-4">
                {groupByProject && (
                  <div className="flex items-center gap-2 px-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">{projGroup}</h2>
                  </div>
                )}
                <div className="flex gap-4 min-w-max md:grid md:grid-cols-5 md:min-w-0">
                  {COLUMNS.map(({ status, icon, color }) => {
                    const columnTasks = filteredTasks.filter(t => 
                      t.status === status && 
                      (!groupByProject || (projGroup === 'No Project' ? !t.project : t.project === projGroup))
                    );
                    
                    return (
                      <div key={status} className="w-[280px] md:w-auto flex flex-col bg-card/50 rounded-xl p-3 border border-border">
                        <div className={cn("flex items-center gap-2 mb-4 px-2", color)}>
                          {icon}
                          <h2 className="font-semibold text-sm uppercase tracking-wider">{status}</h2>
                          <span className="ml-auto bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                            {columnTasks.length}
                          </span>
                        </div>
                        
                        <Droppable droppableId={groupByProject ? `${projGroup}:${status}` : status}>
                          {(provided, snapshot) => (
                            <div
                              {...provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                "flex-1 space-y-3 min-h-[150px] rounded-lg p-2 transition-colors",
                                snapshot.isDraggingOver ? "bg-muted/50" : ""
                              )}
                            >
                              {columnTasks.map((task, index) => (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => navigate(`/task/${task.id}`)}
                                      className={cn(
                                        "cursor-pointer hover:border-primary/50 transition-all",
                                        snapshot.isDragging ? "opacity-70 rotate-2" : "",
                                        task.blocked_by_dependencies ? "opacity-50" : ""
                                      )}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col gap-1">
                                              {task.project && (
                                                <Badge variant="outline" className="w-fit bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5 font-bold uppercase tracking-wider">
                                                  {task.project}
                                                </Badge>
                                              )}
                                              <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
                                            </div>
                                            {task.blocked_by_dependencies && (
                                              <Lock className="h-3 w-3 text-purple-400 shrink-0" />
                                            )}
                                          </div>
                                          {task.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                                              {task.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="outline" className={cn("text-[10px] h-5", getPriorityColor(task.priority))}>
                                              {task.priority}
                                            </Badge>
                                            <span className={cn("text-[10px] capitalize font-medium", getCategoryColor(task.category))}>
                                              {task.category}
                                            </span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
