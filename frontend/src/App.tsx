import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import BoardPage from './BoardPage';
import CreateTaskPage from './CreateTaskPage';
import TaskDetailPage from './TaskDetailPage';
import MetricsPage from './MetricsPage';
import ReviewPage from './ReviewPage';
import TemplatesPage from './TemplatesPage';
import { LayoutDashboard, CheckSquare, BarChart3, FileStack, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

function NavBar() {
  const location = useLocation();
  
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Board' },
    { to: '/review', icon: CheckSquare, label: 'Review' },
    { to: '/metrics', icon: BarChart3, label: 'Metrics' },
    { to: '/templates', icon: FileStack, label: 'Templates' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 md:relative md:border-t-0 md:border-b md:py-3">
      <div className="flex justify-around md:justify-center md:gap-8 max-w-4xl mx-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1 rounded-lg transition-colors",
              location.pathname === to 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs md:text-sm">{label}</span>
          </Link>
        ))}
        <Link
          to="/create"
          className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1 rounded-lg bg-primary text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs md:text-sm">New</span>
        </Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
        <NavBar />
        <main className="md:pt-4">
          <Routes>
            <Route path="/" element={<BoardPage />} />
            <Route path="/create" element={<CreateTaskPage />} />
            <Route path="/task/:id" element={<TaskDetailPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
