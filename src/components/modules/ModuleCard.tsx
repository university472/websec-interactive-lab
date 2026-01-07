import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, PlayCircle, Lock } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Module = Tables<'modules'>;
type UserProgress = Tables<'user_progress'>;

interface ModuleCardProps {
  module: Module;
  progress?: UserProgress | null;
  index: number;
  isUnlocked: boolean;
}

export function ModuleCard({ module, progress, index, isUnlocked }: ModuleCardProps) {
  const status = progress?.status || 'not_started';
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }
    if (isInProgress) {
      return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
    }
    if (!isUnlocked) {
      return <Badge variant="secondary">Locked</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  const getButtonContent = () => {
    if (!isUnlocked) {
      return (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Complete Previous
        </>
      );
    }
    if (isCompleted) {
      return (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Review
        </>
      );
    }
    if (isInProgress) {
      return (
        <>
          <PlayCircle className="mr-2 h-4 w-4" />
          Continue
        </>
      );
    }
    return (
      <>
        <PlayCircle className="mr-2 h-4 w-4" />
        Start Module
      </>
    );
  };

  const progressPercentage = isCompleted ? 100 : isInProgress ? 50 : 0;

  return (
    <Card className={`transition-all duration-200 ${!isUnlocked ? 'opacity-60' : 'hover:shadow-lg hover:border-primary/50'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
              isCompleted 
                ? 'bg-success text-success-foreground' 
                : isInProgress 
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{module.estimated_minutes} min</span>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm">
          {module.description || 'No description available.'}
        </CardDescription>
        
        {(isInProgress || isCompleted) && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <Button 
          asChild={isUnlocked} 
          disabled={!isUnlocked}
          className="w-full"
          variant={isCompleted ? 'outline' : 'default'}
        >
          {isUnlocked ? (
            <Link to={`/lab/${module.slug}`}>
              {getButtonContent()}
            </Link>
          ) : (
            getButtonContent()
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
