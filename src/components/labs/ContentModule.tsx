import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BookOpen, Settings, Shield, Award } from 'lucide-react';

interface ContentModuleProps {
  slug: string;
  title: string;
  description?: string;
  onComplete: () => void;
}

const moduleContent: Record<string, { icon: React.ReactNode; content: React.ReactNode }> = {
  'introduction': {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>Welcome to the Web Application Security Lab! In this hands-on course, you'll learn:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>How SQL Injection attacks work and how to prevent them</li>
          <li>Understanding Cross-Site Scripting (XSS) vulnerabilities</li>
          <li>Best practices for secure authentication</li>
          <li>How to write secure code from the start</li>
        </ul>
        <p className="text-muted-foreground">
          Each module includes interactive labs where you'll practice exploiting vulnerabilities 
          in a safe environment, then learn how to fix them.
        </p>
      </div>
    ),
  },
  'environment-setup': {
    icon: <Settings className="h-8 w-8 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>Good news! No setup required. This entire lab runs in your browser.</p>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">What you have access to:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
            <li>Interactive vulnerable web applications</li>
            <li>Secure/Vulnerable mode toggle to compare implementations</li>
            <li>Real-time feedback on your attacks</li>
            <li>Hints when you get stuck</li>
          </ul>
        </div>
        <p className="text-muted-foreground">
          Click "Mark as Complete" below to proceed to the first hands-on lab.
        </p>
      </div>
    ),
  },
  'vulnerable-auth': {
    icon: <Shield className="h-8 w-8 text-warning" />,
    content: (
      <div className="space-y-4">
        <p>In this module, you'll explore common authentication vulnerabilities:</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-destructive/10 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2">Vulnerable Patterns</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Weak password policies</li>
              <li>• No rate limiting</li>
              <li>• Predictable session tokens</li>
              <li>• Missing input validation</li>
            </ul>
          </div>
          <div className="bg-success/10 rounded-lg p-4">
            <h4 className="font-medium text-success mb-2">Secure Patterns</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Strong password requirements</li>
              <li>• Account lockout mechanisms</li>
              <li>• Cryptographic session IDs</li>
              <li>• Parameterized queries</li>
            </ul>
          </div>
        </div>
        <p className="text-muted-foreground">
          Understanding these patterns will help you recognize and fix vulnerabilities in real applications.
        </p>
      </div>
    ),
  },
  'secure-version': {
    icon: <Shield className="h-8 w-8 text-success" />,
    content: (
      <div className="space-y-4">
        <p>Now that you've seen the vulnerabilities, let's compare secure implementations:</p>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-4">
          <div>
            <p className="text-destructive mb-1">// ❌ Vulnerable:</p>
            <code>query = "SELECT * FROM users WHERE id = " + userId</code>
          </div>
          <div>
            <p className="text-success mb-1">// ✅ Secure:</p>
            <code>query = "SELECT * FROM users WHERE id = $1", [userId]</code>
          </div>
        </div>
        <p className="text-muted-foreground">
          The key difference is using parameterized queries instead of string concatenation.
        </p>
      </div>
    ),
  },
  'final-assessment': {
    icon: <Award className="h-8 w-8 text-primary" />,
    content: (
      <div className="space-y-4">
        <p>Congratulations on making it to the final assessment!</p>
        <p className="text-muted-foreground">
          This module tests your understanding of all the security concepts covered in this course.
          Review your knowledge of:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>SQL Injection attack vectors and prevention</li>
          <li>Cross-Site Scripting (XSS) types and mitigations</li>
          <li>Secure authentication best practices</li>
          <li>Input validation and output encoding</li>
        </ul>
      </div>
    ),
  },
  'completion': {
    icon: <Award className="h-8 w-8 text-success" />,
    content: (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🎉</div>
        <h3 className="text-xl font-bold">Congratulations!</h3>
        <p className="text-muted-foreground">
          You've completed all the modules in the Web Application Security Lab.
          Mark this module as complete to generate your certificate!
        </p>
      </div>
    ),
  },
};

export function ContentModule({ slug, title, description, onComplete }: ContentModuleProps) {
  const content = moduleContent[slug] || {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    content: <p className="text-muted-foreground">{description || 'Module content coming soon...'}</p>,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {content.icon}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.content}
        <Button onClick={onComplete} className="w-full gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Mark as Complete
        </Button>
      </CardContent>
    </Card>
  );
}
