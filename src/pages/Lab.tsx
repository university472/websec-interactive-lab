import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SqlInjectionLab } from '@/components/labs/SqlInjectionLab';
import { XssLab } from '@/components/labs/XssLab';
import { ContentModule } from '@/components/labs/ContentModule';
import { Skeleton } from '@/components/ui/skeleton';

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
}

export default function Lab() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [module, setModule] = useState<ModuleData | null>(null);
  const [nextModule, setNextModule] = useState<{ slug: string; title: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [labSuccess, setLabSuccess] = useState(false);

  useEffect(() => {
    async function fetchModuleData() {
      if (!slug) return;
      
      setLoading(true);
      setLabSuccess(false);
      setIsCompleted(false);

      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, title, description, slug, order_index')
        .eq('slug', slug)
        .maybeSingle();

      if (moduleData) {
        setModule(moduleData);

        const { data: nextModuleData } = await supabase
          .from('modules')
          .select('slug, title')
          .eq('is_active', true)
          .gt('order_index', moduleData.order_index)
          .order('order_index', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextModuleData) {
          setNextModule(nextModuleData);
        } else {
          setNextModule(null);
        }

        if (user) {
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('status')
            .eq('user_id', user.id)
            .eq('module_id', moduleData.id)
            .maybeSingle();

          if (progressData?.status === 'completed') {
            setIsCompleted(true);
          }
        }
      }

      setLoading(false);
    }

    fetchModuleData();
  }, [slug, user]);

  const markModuleComplete = async () => {
    if (!user || !module) return;
    
    setIsCompleting(true);
    try {
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            module_id: module.id,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          });
      }

      setIsCompleted(true);
      toast.success('Module completed! 🎉');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLabSuccess = () => {
    setLabSuccess(true);
  };

  const renderLabContent = () => {
    if (!module) return null;

    // Interactive labs
    if (module.slug === 'sql-injection') {
      return <SqlInjectionLab onSuccess={handleLabSuccess} />;
    }
    
    if (module.slug === 'xss-vulnerability') {
      return <XssLab onSuccess={handleLabSuccess} />;
    }

    // Content-based modules (no interactive lab)
    return (
      <ContentModule 
        slug={module.slug}
        title={module.title}
        description={module.description || undefined}
        onComplete={markModuleComplete}
      />
    );
  };

  const isInteractiveLab = module?.slug === 'sql-injection' || module?.slug === 'xss-vulnerability';

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!module) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Module not found</h2>
          <p className="text-muted-foreground mt-2">The requested module does not exist.</p>
          <Button onClick={() => navigate('/modules')} className="mt-4">
            Back to Modules
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{module.title}</h1>
            {module.description && (
              <p className="text-muted-foreground">{module.description}</p>
            )}
          </div>
          
          {/* Show mode toggle for interactive labs - handled inside lab components */}
        </div>

        {/* Lab Content */}
        {renderLabContent()}

        {/* Completion Controls for Interactive Labs */}
        {isInteractiveLab && (
          <div className="space-y-4">
            {labSuccess && !isCompleted && user && (
              <Button 
                onClick={markModuleComplete} 
                className="w-full gap-2"
                disabled={isCompleting}
                size="lg"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Complete
                  </>
                )}
              </Button>
            )}

            {isCompleted && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="font-medium text-success">Module Completed!</p>
              </div>
            )}

            {isCompleted && nextModule && (
              <Button 
                onClick={() => navigate(`/lab/${nextModule.slug}`)} 
                className="w-full gap-2"
                size="lg"
              >
                Next: {nextModule.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {isCompleted && !nextModule && (
              <Button 
                onClick={() => navigate('/certificate')} 
                className="w-full gap-2"
                variant="outline"
                size="lg"
              >
                View Certificate
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Navigation for Content Modules */}
        {!isInteractiveLab && isCompleted && (
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="font-medium text-success">Module Completed!</p>
            </div>

            {nextModule && (
              <Button 
                onClick={() => navigate(`/lab/${nextModule.slug}`)} 
                className="w-full gap-2"
                size="lg"
              >
                Next: {nextModule.title}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {!nextModule && (
              <Button 
                onClick={() => navigate('/certificate')} 
                className="w-full gap-2"
                size="lg"
              >
                View Certificate
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
