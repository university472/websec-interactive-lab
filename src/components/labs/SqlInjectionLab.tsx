import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface SqlInjectionLabProps {
  onSuccess: () => void;
}

export function SqlInjectionLab({ onSuccess }: SqlInjectionLabProps) {
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleLogin = () => {
    if (isSecureMode) {
      if (username === 'admin' && password === 'admin123') {
        setResult({ success: true, message: 'Login successful! (Secure Mode)' });
      } else {
        setResult({ success: false, message: 'Invalid credentials. SQL Injection blocked.' });
      }
    } else {
      const sqliPattern = /'\s*OR\s*['"]?1['"]?\s*=\s*['"]?1|admin['"]\s*--|'\s*OR\s*''='/i;
      if (sqliPattern.test(username) || sqliPattern.test(password)) {
        setResult({ success: true, message: '🎉 SQL Injection successful! You bypassed authentication.' });
        onSuccess();
      } else if (username === 'admin' && password === 'admin123') {
        setResult({ success: true, message: 'Login successful with valid credentials.' });
      } else {
        setResult({ success: false, message: 'Login failed. Try a SQL injection payload!' });
      }
    }
  };

  return (
    <>
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

      <div className="grid lg:grid-cols-2 gap-6">
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
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isSecureMode ? 'border-success/50' : 'border-destructive/50'}>
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
