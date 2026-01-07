import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Trophy, Clock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Module = Tables<'modules'>;
type UserProgress = Tables<'user_progress'>;

export default function Modules() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch all active modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (modulesData) {
        setModules(modulesData);
      }

      // Fetch user progress if logged in
      if (user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressData) {
          const progressMap: Record<string, UserProgress> = {};
          progressData.forEach(p => {
            progressMap[p.module_id] = p;
          });
          setProgress(progressMap);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length;
  const totalTimeSpent = Object.values(progress).reduce((acc, p) => acc + p.time_spent_seconds, 0);
  const totalEstimatedTime = modules.reduce((acc, m) => acc + m.estimated_minutes, 0);

  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    const previousModule = modules[index - 1];
    if (!previousModule) return true;
    const prevProgress = progress[previousModule.id];
    return prevProgress?.status === 'completed';
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Modules</h1>
          <p className="text-muted-foreground mt-2">
            Master web application security through hands-on practice
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modules</p>
              <p className="text-2xl font-bold">{loading ? '-' : modules.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Trophy className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{loading ? '-' : `${completedCount}/${modules.length}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="text-2xl font-bold">{loading ? '-' : `${totalEstimatedTime} min`}</p>
            </div>
          </div>
        </div>

        {/* Module Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-4 rounded-lg border p-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                progress={progress[module.id]}
                index={index}
                isUnlocked={isModuleUnlocked(index)}
              />
            ))}
          </div>
        )}

        {!loading && modules.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No modules available</h3>
            <p className="text-muted-foreground">Check back later for new learning content.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
