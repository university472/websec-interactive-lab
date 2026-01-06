import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function Certificate() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Your Certificate</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Complete all modules to earn your verifiable certificate.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
