import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Lab() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [module, setModule] = useState<{ id: string; title: string } | null>(null);
  const [nextModule, setNextModule] = useState<{ slug: string; title: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    async function fetchModuleData() {
      if (!slug) return;

      // Fetch current module
      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, title, order_index')
        .eq('slug', slug)
        .maybeSingle();

      if (moduleData) {
        setModule({ id: moduleData.id, title: moduleData.title });

        // Fetch next module
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
        }

        // Check if already completed
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
    }

    fetchModuleData();
  }, [slug, user]);

  const markModuleComplete = async () => {
    if (!user || !module) return;
    
    setIsCompleting(true);
    try {
      // Check if progress record exists
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .maybeSingle();

      if (existingProgress) {
        // Update existing record
        await supabase
          .from('user_progress')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingProgress.id);
      } else {
        // Create new record
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

  const handleLogin = () => {
    if (isSecureMode) {
      // Secure mode - proper validation
      if (username === 'admin' && password === 'admin123') {
        setResult({ success: true, message: 'Login successful! (Secure Mode)' });
      } else {
        setResult({ success: false, message: 'Invalid credentials. SQL Injection blocked.' });
      }
    } else {
      // Vulnerable mode - simulate SQL injection
      const sqliPattern = /'\s*OR\s*['"]?1['"]?\s*=\s*['"]?1|admin['"]\s*--|'\s*OR\s*''='/i;
      if (sqliPattern.test(username) || sqliPattern.test(password)) {
        setResult({ success: true, message: '🎉 SQL Injection successful! You bypassed authentication.' });
      } else if (username === 'admin' && password === 'admin123') {
        setResult({ success: true, message: 'Login successful with valid credentials.' });
      } else {
        setResult({ success: false, message: 'Login failed. Try a SQL injection payload!' });
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">SQL Injection Lab</h1>
            <p className="text-muted-foreground">Practice SQL injection attacks safely</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="mode-toggle" className="text-sm">
                {isSecureMode ? (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <Shield className="h-3 w-3" /> Secure
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" /> Vulnerable
                  </Badge>
                )}
              </Label>
              <Switch
                id="mode-toggle"
                checked={isSecureMode}
                onCheckedChange={setIsSecureMode}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This login form is vulnerable to SQL injection. Your goal is to bypass
                the authentication without knowing the password.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                <p className="text-muted-foreground mb-2">// Vulnerable SQL query:</p>
                <code className="text-foreground">
                  SELECT * FROM users WHERE username = '<span className="text-primary">{username || 'input'}</span>' 
                  AND password = '<span className="text-primary">{password || 'input'}</span>'
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                className="gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>
              {showHint && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm">
                  <p className="font-medium text-warning mb-2">Hint:</p>
                  <p className="text-muted-foreground">
                    Try entering: <code className="bg-muted px-1 rounded">' OR '1'='1</code> in the username field.
                    This makes the query always return true!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Demo App */}
          <Card className={isSecureMode ? 'mode-secure' : 'mode-vulnerable'}>
            <CardHeader>
              <CardTitle className="text-lg">Demo Login Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>

              {result && (
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    result.success
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium">{result.message}</p>
                </div>
              )}

              {/* Complete Module Button - show when attack succeeds */}
              {result?.success && !isCompleted && user && (
                <Button 
                  onClick={markModuleComplete} 
                  className="w-full gap-2"
                  disabled={isCompleting}
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

              {/* Already completed status */}
              {isCompleted && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
                  <p className="font-medium text-success">Module Completed!</p>
                </div>
              )}

              {/* Next Module Button */}
              {isCompleted && nextModule && (
                <Button 
                  onClick={() => navigate(`/lab/${nextModule.slug}`)} 
                  className="w-full gap-2"
                >
                  Next: {nextModule.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}

              {/* All Done - show certificate link */}
              {isCompleted && !nextModule && (
                <Button 
                  onClick={() => navigate('/certificate')} 
                  className="w-full gap-2"
                  variant="outline"
                >
                  View Certificate
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
