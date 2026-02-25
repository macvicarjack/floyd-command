import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTemplates, createFromTemplate } from '@/lib/api';
import { Template } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Briefcase, User, Folder, Plus } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTemplates().then(res => {
      setTemplates(res.data);
      setLoading(false);
    });
  }, []);

  const handleUseTemplate = async (templateId: string) => {
    const res = await createFromTemplate(templateId);
    navigate(`/task/${res.data.id}`);
  };

  const categoryIcons: Record<string, any> = {
    business: Briefcase,
    work: Folder,
    personal: User
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-blue-400'
  };

  if (loading) return <div className="p-6">Loading templates...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Task Templates</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Quick-start with pre-built task templates. Click to create a task.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map(template => {
          const Icon = categoryIcons[template.category] || Folder;
          return (
            <Card key={template.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleUseTemplate(template.id)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={priorityColors[template.priority]}>
                    {template.priority}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>~{template.time_estimate_minutes} min</span>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4 mr-1" /> Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
