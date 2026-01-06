import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Play,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Code,
  Target,
} from 'lucide-react';

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  order_index: number;
  estimated_minutes: number;
}

interface UserProgress {
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  time_spent_seconds: number;
}

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [modulesRes, progressRes] = await Promise.all([
          supabase.from('modules').select('*').eq('is_active', true).order('order_index'),
          supabase.from('user_progress').select('*'),
        ]);

        if (modulesRes.data) setModules(modulesRes.data);
        if (progressRes.data) setProgress(progressRes.data as UserProgress[]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const completedModules = progress.filter((p) => p.status === 'completed').length;
  const totalModules = modules.length;
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const totalTimeSpent = progress.reduce((acc, p) => acc + p.time_spent_seconds, 0);
  const hoursSpent = Math.floor(totalTimeSpent / 3600);
  const minutesSpent = Math.floor((totalTimeSpent % 3600) / 60);

  const getModuleStatus = (moduleId: string): 'not_started' | 'in_progress' | 'completed' => {
    const p = progress.find((pr) => pr.module_id === moduleId);
    return p?.status || 'not_started';
  };

  const getCurrentModule = () => {
    const inProgress = modules.find((m) => getModuleStatus(m.id) === 'in_progress');
    if (inProgress) return inProgress;
    
    const notStarted = modules.find((m) => getModuleStatus(m.id) === 'not_started');
    return notStarted || modules[0];
  };

  const currentModule = getCurrentModule();

  const getModuleIcon = (slug: string) => {
    if (slug.includes('sql') || slug.includes('injection')) return Code;
    if (slug.includes('xss')) return AlertTriangle;
    if (slug.includes('secure')) return Shield;
    if (slug.includes('assessment')) return Target;
    if (slug.includes('certificate') || slug.includes('completion')) return Award;
    return BookOpen;
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Learner'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Continue your journey in web application security.
            </p>
          </div>
          {currentModule && (
            <Button asChild size="lg" className="gap-2">
              <Link to={`/lab/${currentModule.slug}`}>
                <Play className="h-4 w-4" />
                Continue Learning
              </Link>
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modules Completed</p>
                  <p className="text-2xl font-bold">
                    {completedModules}/{totalModules}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Target className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{progressPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time Spent</p>
                  <p className="text-2xl font-bold">
                    {hoursSpent}h {minutesSpent}m
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate</p>
                  <p className="text-2xl font-bold">
                    {progressPercentage === 100 ? 'Earned!' : 'In Progress'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              Complete all modules to earn your certificate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall completion</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex flex-wrap gap-2">
                {modules.map((module) => {
                  const status = getModuleStatus(module.id);
                  return (
                    <div
                      key={module.id}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        status === 'completed'
                          ? 'bg-success text-success-foreground'
                          : status === 'in_progress'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {module.order_index}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Learning Path</h2>
          <div className="grid gap-4">
            {modules.map((module, index) => {
              const status = getModuleStatus(module.id);
              const isLocked = index > 0 && getModuleStatus(modules[index - 1].id) !== 'completed';
              const Icon = getModuleIcon(module.slug);

              return (
                <Card
                  key={module.id}
                  className={`transition-all ${
                    isLocked
                      ? 'opacity-60'
                      : 'hover:shadow-md cursor-pointer hover:border-primary/50'
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          status === 'completed'
                            ? 'bg-success/10'
                            : status === 'in_progress'
                            ? 'bg-primary/10'
                            : 'bg-muted'
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Icon
                            className={`h-5 w-5 ${
                              status === 'in_progress' ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{module.title}</h3>
                          {status === 'in_progress' && (
                            <Badge variant="secondary" className="text-xs">
                              In Progress
                            </Badge>
                          )}
                          {status === 'completed' && (
                            <Badge className="text-xs bg-success text-success-foreground">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {module.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.estimated_minutes}m
                        </div>
                        {!isLocked && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/lab/${module.slug}`}>
                              <ChevronRight className="h-5 w-5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
