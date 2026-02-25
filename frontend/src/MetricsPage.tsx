import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMetrics } from '@/lib/api';
import { Metrics } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Clock, CheckCircle2, ListTodo } from 'lucide-react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMetrics().then(res => {
      setMetrics(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading metrics...</div>;
  if (!metrics) return <div className="p-6">Failed to load metrics</div>;

  const categoryColors: Record<string, string> = {
    business: 'bg-blue-500',
    work: 'bg-purple-500',
    personal: 'bg-green-500',
    other: 'bg-gray-500'
  };

  const statusColors: Record<string, string> = {
    'DO NOW': 'bg-red-500',
    'QUEUED': 'bg-yellow-500',
    'IN PROGRESS': 'bg-blue-500',
    'DONE': 'bg-emerald-500',
    'BLOCKED': 'bg-purple-500'
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Metrics Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Today</span>
            </div>
            <div className="text-2xl font-bold">{metrics.completed_today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">This Week</span>
            </div>
            <div className="text-2xl font-bold">{metrics.completed_this_week}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Avg Time</span>
            </div>
            <div className="text-2xl font-bold">{metrics.average_completion_minutes}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ListTodo className="h-4 w-4" />
              <span className="text-xs">Queue</span>
            </div>
            <div className="text-2xl font-bold">{metrics.queue_depth}</div>
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-sm">By Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.by_category).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${categoryColors[cat] || 'bg-gray-500'}`} />
                <span className="flex-1 capitalize">{cat}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(metrics.by_status).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                <span className="flex-1">{status}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
