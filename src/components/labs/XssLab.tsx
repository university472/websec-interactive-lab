import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

interface XssLabProps {
  onSuccess: () => void;
}

export function XssLab({ onSuccess }: XssLabProps) {
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; html?: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleSearch = () => {
    const xssPattern = /<script|<img\s+.*onerror|javascript:|on\w+\s*=/i;
    
    if (isSecureMode) {
      // Secure mode - sanitize input
      const sanitized = searchQuery.replace(/[<>]/g, '');
      setResult({ 
        success: false, 
        message: `Search results for: ${sanitized}`,
        html: `<p>No results found for "${sanitized}"</p>`
      });
    } else {
      if (xssPattern.test(searchQuery)) {
        setResult({ 
          success: true, 
          message: '🎉 XSS successful! You injected malicious code.',
          html: searchQuery
        });
        onSuccess();
      } else {
        setResult({ 
          success: false, 
          message: 'No XSS detected. Try injecting a script!',
          html: `<p>Search results for: "${searchQuery}"</p>`
        });
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
              This search form reflects user input without proper sanitization. 
              Your goal is to inject JavaScript code that will execute in the browser.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
              <p className="text-muted-foreground mb-2">// Vulnerable code:</p>
              <code className="text-foreground">
                element.innerHTML = "Results for: " + userInput;
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
                  Try entering: <code className="bg-muted px-1 rounded">&lt;img src=x onerror=alert(1)&gt;</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={isSecureMode ? 'border-success/50' : 'border-destructive/50'}>
          <CardHeader>
            <CardTitle className="text-lg">Demo Search Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Query</Label>
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search term..."
              />
            </div>
            <Button onClick={handleSearch} className="w-full">
              Search
            </Button>

            {result && (
              <>
                <div
                  className={`flex items-center gap-2 p-4 rounded-lg ${
                    result.success
                      ? 'bg-success/10 text-success'
                      : 'bg-muted'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium">{result.message}</p>
                </div>
                {result.html && !isSecureMode && (
                  <div 
                    className="bg-muted/50 p-4 rounded-lg text-sm"
                    dangerouslySetInnerHTML={{ __html: result.html }}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
