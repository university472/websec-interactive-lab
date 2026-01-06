import { MainLayout } from '@/components/layout/MainLayout';

export default function Modules() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">All Modules</h1>
        <p className="text-muted-foreground">View all available learning modules.</p>
      </div>
    </MainLayout>
  );
}
