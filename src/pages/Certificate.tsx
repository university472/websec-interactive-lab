import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Download, Share2, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Certificate = Tables<'certificates'>;
type Module = Tables<'modules'>;
type UserProgress = Tables<'user_progress'>;

function generateCertificateNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CERT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export default function Certificate() {
  const { user, profile } = useAuth();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);

      // Fetch existing certificate
      const { data: certData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (certData) {
        setCertificate(certData);
      }

      // Fetch all modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (modulesData) {
        setModules(modulesData);
      }

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressData) {
        setProgress(progressData);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  const completedModules = progress.filter(p => p.status === 'completed');
  const completionPercentage = modules.length > 0 
    ? Math.round((completedModules.length / modules.length) * 100) 
    : 0;
  const totalTimeSpent = progress.reduce((acc, p) => acc + p.time_spent_seconds, 0);
  const isComplete = modules.length > 0 && completedModules.length === modules.length;

  const handleGenerateCertificate = async () => {
    if (!user || !profile || !isComplete) return;

    setGenerating(true);
    try {
      const newCertificate = {
        user_id: user.id,
        full_name: profile.full_name || profile.email,
        certificate_number: generateCertificateNumber(),
        completion_percentage: 100,
        total_time_seconds: totalTimeSpent,
      };

      const { data, error } = await supabase
        .from('certificates')
        .insert(newCertificate)
        .select()
        .single();

      if (error) throw error;

      setCertificate(data);
      toast.success('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!certificate) return;
    
    const url = `${window.location.origin}/verify/${certificate.certificate_number}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Web Security Certificate',
          text: 'I completed the Web Application Security Fundamentals course!',
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Certificate link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </MainLayout>
    );
  }

  // Show certificate if already generated
  if (certificate) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Your Certificate</h1>
            <p className="text-muted-foreground">Congratulations on completing the course!</p>
          </div>

          {/* Certificate Display */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12">
              <div className="border-4 border-primary/20 rounded-lg p-8 md:p-12 bg-card/80 backdrop-blur text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-10 w-10 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">Certificate of Completion</p>
                  <h2 className="text-2xl md:text-3xl font-bold">Web Application Security Fundamentals</h2>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This certifies that</p>
                  <p className="text-2xl md:text-3xl font-semibold text-primary">{certificate.full_name}</p>
                </div>

                <p className="text-muted-foreground max-w-md mx-auto">
                  has successfully completed the hands-on training program covering SQL Injection, 
                  Cross-Site Scripting (XSS), and secure coding practices.
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Issued</p>
                    <p className="font-medium">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Time Spent</p>
                    <p className="font-medium">{formatTime(certificate.total_time_seconds)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Certificate ID</p>
                  <p className="font-mono text-sm font-medium">{certificate.certificate_number}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleShare} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share Certificate
            </Button>
            <Button asChild variant="outline">
              <Link to={`/verify/${certificate.certificate_number}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Link
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show progress if not complete
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Earn Your Certificate</h1>
          <p className="text-muted-foreground">Complete all modules to receive your verifiable certificate</p>
        </div>

        {/* Progress Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center">
                  {isComplete ? (
                    <CheckCircle2 className="h-12 w-12 text-success" />
                  ) : (
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border">
                  <span className="text-lg font-bold">{completionPercentage}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedModules.length} of {modules.length} modules</span>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </div>

            {/* Module checklist */}
            <div className="space-y-3">
              {modules.map((module, index) => {
                const isModuleComplete = progress.some(
                  p => p.module_id === module.id && p.status === 'completed'
                );
                return (
                  <div 
                    key={module.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isModuleComplete ? 'bg-success/5 border-success/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isModuleComplete 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    }`}>
                      {isModuleComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className={isModuleComplete ? 'text-foreground' : 'text-muted-foreground'}>
                      {module.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {isComplete ? (
              <Button 
                onClick={handleGenerateCertificate} 
                disabled={generating}
                className="w-full"
                size="lg"
              >
                <Award className="mr-2 h-5 w-5" />
                {generating ? 'Generating...' : 'Generate Certificate'}
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/modules">
                  Continue Learning
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
