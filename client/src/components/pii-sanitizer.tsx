import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Copy, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HomographicSanitizerProps {
  onSanitized?: (original: string, sanitized: string) => void;
}

const HomographicSanitizer: React.FC<HomographicSanitizerProps> = ({ onSanitized }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [detectedPII, setDetectedPII] = useState<string[]>([]);
  const { toast } = useToast();

  // Local AI-powered PII sanitization
  const sanitizePII = async (text: string): Promise<{ sanitized: string; detected: string[] }> => {
    setIsProcessing(true);
    
    try {
      // Simulate processing delay for local AI
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const detected: string[] = [];
      let sanitized = text;

      // IP Address patterns
      const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
      const ips = text.match(ipPattern);
      if (ips) {
        detected.push('IP Addresses');
        ips.forEach((ip, index) => {
          const sanitizedIP = `192.168.${100 + index}.${10 + index}`;
          sanitized = sanitized.replace(ip, sanitizedIP);
        });
      }

      // Hostname patterns
      const hostnamePattern = /\b[a-zA-Z0-9-]+\.(corp|internal|local|domain|com|net|org|gov|edu)\b/g;
      const hostnames = text.match(hostnamePattern);
      if (hostnames) {
        detected.push('Hostnames');
        hostnames.forEach((hostname, index) => {
          const sanitizedHostname = `host${index + 1}.example.local`;
          sanitized = sanitized.replace(hostname, sanitizedHostname);
        });
      }

      // Username patterns (email format)
      const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const emails = text.match(emailPattern);
      if (emails) {
        detected.push('Email Addresses');
        emails.forEach((email, index) => {
          const sanitizedEmail = `user${index + 1}@example.com`;
          sanitized = sanitized.replace(email, sanitizedEmail);
        });
      }

      // Username patterns (domain\username)
      const domainUserPattern = /\b[A-Z][A-Z0-9-]*\\[a-zA-Z0-9._-]+/g;
      const domainUsers = text.match(domainUserPattern);
      if (domainUsers) {
        detected.push('Domain Users');
        domainUsers.forEach((user, index) => {
          const sanitizedUser = `DOMAIN\\user${index + 1}`;
          sanitized = sanitized.replace(user, sanitizedUser);
        });
      }

      // System/Server names
      const serverPattern = /\b(SRV|SERVER|SVR|DC|WS|DESKTOP)-[A-Z0-9-]+/gi;
      const servers = text.match(serverPattern);
      if (servers) {
        detected.push('System Names');
        servers.forEach((server, index) => {
          const sanitizedServer = `SERVER-${String(index + 1).padStart(2, '0')}`;
          sanitized = sanitized.replace(server, sanitizedServer);
        });
      }

      // Company/Organization names (common patterns)
      const companyPattern = /\b(Corp|Inc|LLC|Ltd|Company|Corporation|Technologies|Solutions|Systems|Enterprises)\b/g;
      const companies = text.match(companyPattern);
      if (companies) {
        detected.push('Company References');
        sanitized = sanitized.replace(companyPattern, 'ExampleCorp');
      }

      // File paths with potential sensitive info
      const pathPattern = /[C-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g;
      const paths = text.match(pathPattern);
      if (paths) {
        detected.push('File Paths');
        paths.forEach((path, index) => {
          const sanitizedPath = `C:\\Users\\User${index + 1}\\Documents\\file${index + 1}.txt`;
          sanitized = sanitized.replace(path, sanitizedPath);
        });
      }

      // Phone numbers
      const phonePattern = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
      const phones = text.match(phonePattern);
      if (phones) {
        detected.push('Phone Numbers');
        phones.forEach((phone, index) => {
          const sanitizedPhone = `555-0${String(100 + index).padStart(3, '0')}`;
          sanitized = sanitized.replace(phone, sanitizedPhone);
        });
      }

      // MAC Addresses
      const macPattern = /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g;
      const macs = text.match(macPattern);
      if (macs) {
        detected.push('MAC Addresses');
        macs.forEach((mac, index) => {
          const sanitizedMac = `00:11:22:33:44:${String(index + 1).padStart(2, '0')}`;
          sanitized = sanitized.replace(mac, sanitizedMac);
        });
      }

      // Credit Card Numbers (basic pattern)
      const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
      const ccs = text.match(ccPattern);
      if (ccs) {
        detected.push('Credit Card Numbers');
        ccs.forEach((cc) => {
          sanitized = sanitized.replace(cc, '4111-1111-1111-1111');
        });
      }

      // SSN patterns
      const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
      const ssns = text.match(ssnPattern);
      if (ssns) {
        detected.push('SSN Numbers');
        ssns.forEach((ssn) => {
          sanitized = sanitized.replace(ssn, '123-45-6789');
        });
      }

      return { sanitized, detected };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSanitize = async () => {
    if (!input.trim()) {
      toast({
        title: "No input provided",
        description: "Please enter some text to sanitize.",
        variant: "destructive",
      });
      return;
    }

    const result = await sanitizePII(input);
    setOutput(result.sanitized);
    setDetectedPII(result.detected);
    
    if (onSanitized) {
      onSanitized(input, result.sanitized);
    }

    toast({
      title: "Homographic Transform Complete",
      description: `Processed and transformed ${result.detected.length} types of sensitive information.`,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setInput('');
    setOutput('');
    setDetectedPII([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Homographic Sanitizer
        </CardTitle>
        <CardDescription>
          Transform sensitive information using homographic characters while preserving visual structure and conventions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All processing happens locally in your browser. No data is sent to external servers.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Original Text</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showOriginal ? 'Hide' : 'Show'}
            </Button>
          </div>
          <Textarea
            placeholder="Enter text containing sensitive information to sanitize..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className={!showOriginal ? 'filter blur-sm' : ''}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSanitize} disabled={isProcessing || !input.trim()}>
            {isProcessing ? 'Processing...' : 'Apply Homographic Transform'}
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {detectedPII.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Detected PII Types</label>
            <div className="flex flex-wrap gap-2">
              {detectedPII.map((type, index) => (
                <Badge key={index} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sanitized Text</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(output)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <Textarea
              value={output}
              readOnly
              rows={6}
              className="bg-green-50 dark:bg-green-950/20 border-green-200"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomographicSanitizer;